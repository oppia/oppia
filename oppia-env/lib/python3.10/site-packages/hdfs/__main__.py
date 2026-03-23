#!/usr/bin/env python
# encoding: utf-8

"""HdfsCLI: a command line interface for HDFS.

Usage:
  hdfscli [interactive] [-a ALIAS] [-v...]
  hdfscli download [-fsa ALIAS] [-v...] [-t THREADS] HDFS_PATH LOCAL_PATH
  hdfscli upload [-sa ALIAS] [-v...] [-A | -f] [-t THREADS] LOCAL_PATH HDFS_PATH
  hdfscli -L | -V | -h

Commands:
  download                      Download a file or folder from HDFS. If a
                                single file is downloaded, - can be
                                specified as LOCAL_PATH to stream it to
                                standard out.
  interactive                   Start the client and expose it via the python
                                interpreter (using iPython if available).
  upload                        Upload a file or folder to HDFS. - can be
                                specified as LOCAL_PATH to read from standard
                                in.

Arguments:
  HDFS_PATH                     Remote HDFS path.
  LOCAL_PATH                    Path to local file or directory.

Options:
  -A --append                   Append data to an existing file. Only supported
                                if uploading a single file or from standard in.
  -L --log                      Show path to current log file and exit.
  -V --version                  Show version and exit.
  -a ALIAS --alias=ALIAS        Alias of namenode to connect to.
  -f --force                    Allow overwriting any existing files.
  -s --silent                   Don't display progress status.
  -t THREADS --threads=THREADS  Number of threads to use for parallelization.
                                0 allocates a thread per file. [default: 0]
  -v --verbose                  Enable log output. Can be specified up to three
                                times (increasing verbosity each time).

Examples:
  hdfscli -a prod /user/foo
  hdfscli download features.avro dat/
  hdfscli download logs/1987-03-23 - >>logs
  hdfscli upload -f - data/weights.tsv <weights.tsv

HdfsCLI exits with return status 1 if an error occurred and 0 otherwise.

"""

from . import __version__
from .config import Config, NullHandler, catch
from .util import HdfsError
from docopt import docopt
from threading import Lock
import logging as lg
import os
import os.path as osp
import sys


def parse_arg(args, name, parser, separator=None):
  """Parse command line argument, raising an appropriate error on failure.

  :param args: Arguments dictionary.
  :param name: Name of option to look up.
  :param parser: Function to parse option.
  :param separator: For parsing lists.

  """
  value = args[name]
  if not value:
    return
  try:
    if separator and separator in value:
      return [parser(part) for part in value.split(separator) if part]
    else:
      return parser(value)
  except ValueError:
    raise HdfsError('Invalid %r option: %r.', name, args[name])

def configure_client(command, args, config=None):
  """Instantiate configuration from arguments dictionary.

  :param command: Command name, used to set up the appropriate log handler.
  :param args: Arguments returned by `docopt`.
  :param config: CLI configuration, used for testing.

  If the `--log` argument is set, this method will print active file handler
  paths and exit the process.

  """
  logger = lg.getLogger()
  logger.setLevel(lg.DEBUG)
  lg.getLogger('requests_kerberos.kerberos_').setLevel(lg.INFO)
  # TODO: Filter only at handler level.
  if not config:
    levels = {0: lg.ERROR, 1: lg.WARNING, 2: lg.INFO}
    config = Config(stream_log_level=levels.get(args['--verbose'], lg.DEBUG))
  handler = config.get_log_handler(command)
  if args['--log']:
    if isinstance(handler, NullHandler):
      sys.stdout.write('No log file active.\n')
      sys.exit(1)
    else:
      sys.stdout.write('{}\n'.format(handler.baseFilename))
      sys.exit(0)
  logger.addHandler(handler)
  return config.get_client(args['--alias'])


class _Progress(object):

  """Progress tracker callback.

  :param nbytes: Total number of bytes that will be transferred.
  :param nfiles: Total number of files that will be transferred.
  :param writer: Writable file-object where the progress will be written.
    Defaults to standard error.

  """

  def __init__(self, nbytes, nfiles, writer=None):
    self._total_bytes = nbytes
    self._pending_files = nfiles
    self._writer = writer or sys.stderr
    self._downloading_files = 0
    self._complete_files = 0
    self._lock = Lock()
    self._data = {}

  def __call__(self, hdfs_path, nbytes):
    # TODO: Improve lock granularity.
    with self._lock:
      data = self._data
      if hdfs_path not in data:
        self._pending_files -= 1
        self._downloading_files += 1
      if nbytes == -1:
        self._downloading_files -= 1
        self._complete_files += 1
      else:
        data[hdfs_path] = nbytes
      if self._pending_files + self._downloading_files > 0:
        self._writer.write(
          '%3.1f%%\t[ pending: %d | downloading: %d | complete: %d ]   \r' %
          (
            100. * sum(data.values()) / self._total_bytes,
            self._pending_files,
            self._downloading_files,
            self._complete_files,
          )
        )
      else:
        self._writer.write('%79s\r' % ('', ))

  @classmethod
  def from_hdfs_path(cls, client, hdfs_path, writer=None):
    """Instantiate from remote path.

    :param client: HDFS client.
    :param hdfs_path: HDFS path.

    """
    content = client.content(hdfs_path)
    return cls(content['length'], content['fileCount'], writer=writer)

  @classmethod
  def from_local_path(cls, local_path, writer=None):
    """Instantiate from a local path.

    :param local_path: Local path.

    """
    if osp.isdir(local_path):
      nbytes = 0
      nfiles = 0
      for dpath, _, fnames in os.walk(local_path):
        for fname in fnames:
          nbytes += osp.getsize(osp.join(dpath, fname))
          nfiles += 1
    elif osp.exists(local_path):
      nbytes = osp.getsize(local_path)
      nfiles = 1
    else:
      raise HdfsError('No file found at: %s', local_path)
    return cls(nbytes, nfiles, writer=writer)

@catch(HdfsError)
def main(argv=None, client=None):
  """Entry point.

  :param argv: Arguments list.
  :param client: For testing.

  """
  args = docopt(__doc__, argv=argv, version=__version__)
  if not client:
    client = configure_client('hdfscli', args)
  elif args['--log']:
    raise HdfsError('Logging is only available when no client is specified.')
  hdfs_path = args['HDFS_PATH']
  local_path = args['LOCAL_PATH']
  n_threads = parse_arg(args, '--threads', int)
  force = args['--force']
  silent = args['--silent']
  if args['download']:
    chunk_size = 2 ** 16
    if local_path == '-':
      if not sys.stdout.isatty() and sys.stderr.isatty() and not silent:
        progress = _Progress.from_hdfs_path(client, hdfs_path)
      else:
        progress = None
      with client.read(
        hdfs_path,
        chunk_size=chunk_size,
        progress=progress,
      ) as reader:
        # https://stackoverflow.com/a/23932488/1062617
        stdout = getattr(sys.stdout, 'buffer', sys.stdout)
        for chunk in reader:
          stdout.write(chunk)
    else:
      if sys.stderr.isatty() and not silent:
        progress = _Progress.from_hdfs_path(client, hdfs_path)
      else:
        progress = None
      client.download(
        hdfs_path,
        local_path,
        overwrite=force,
        n_threads=n_threads,
        chunk_size=chunk_size,
        progress=progress,
      )
  elif args['upload']:
    append = args['--append']
    if local_path == '-':
      client.write(
        hdfs_path,
        (line for line in sys.stdin), # Doesn't work with stdin.
        append=append,
        overwrite=force,
      )
    else:
      if append:
        # TODO: Add progress tracking here.
        if osp.isfile(local_path):
          with open(local_path) as reader:
            client.write(hdfs_path, reader, append=True)
        else:
          raise HdfsError('Can only append when uploading a single file.')
      else:
        if sys.stderr.isatty() and not silent:
          progress = _Progress.from_local_path(local_path)
        else:
          progress = None
        client.upload(
          hdfs_path,
          local_path,
          overwrite=force,
          n_threads=n_threads,
          progress=progress,
        )
  else:
    banner = (
      '\n'
      'Welcome to the interactive HDFS python shell.\n'
      'The HDFS client is available as `CLIENT`.\n'
    )
    namespace = {'CLIENT': client}
    try:
      from IPython import embed
    except ImportError:
      from code import interact
      interact(banner=banner, local=namespace)
    else:
      embed(banner1=banner, user_ns=namespace)

if __name__ == '__main__':
  main()
