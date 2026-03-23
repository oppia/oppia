#!/usr/bin/env python
# encoding: utf-8

"""HdfsCLI Avro: an Avro extension for HdfsCLI.

Usage:
  hdfscli-avro schema [-a ALIAS] [-v...] HDFS_PATH
  hdfscli-avro read [-a ALIAS] [-v...] [-F FREQ | -n NUM] [-p PARTS] HDFS_PATH
  hdfscli-avro write [-fa ALIAS] [-v...] [-C CODEC] [-S SCHEMA] HDFS_PATH
  hdfscli-avro -L | -h

Commands:
  schema                        Pretty print schema.
  read                          Read an Avro file from HDFS and output records
                                as JSON to standard out.
  write                         Read JSON records from standard in and
                                serialize them into a single Avro file on HDFS.

Arguments:
  HDFS_PATH                     Remote path to Avro file or directory
                                containing Avro part-files.

Options:
  -C CODEC --codec=CODEC        Compression codec. Available values are among:
                                null, deflate, snappy. [default: deflate]
  -F FREQ --freq=FREQ           Probability of sampling a record.
  -L --log                      Show path to current log file and exit.
  -S SCHEMA --schema=SCHEMA     Schema for serializing records. If not passed,
                                it will be inferred from the first record.
  -a ALIAS --alias=ALIAS        Alias of namenode to connect to.
  -f --force                    Overwrite any existing file.
  -h --help                     Show this message and exit.
  -n NUM --num=NUM              Cap number of records to output.
  -p PARTS --parts=PARTS        Part-files to read. Specify a number to
                                randomly select that many, or a comma-separated
                                list of numbers to read only these. Use a
                                number followed by a comma (e.g. `1,`) to get a
                                unique part-file. The default is to read all
                                part-files.
  -v --verbose                  Enable log output. Can be specified up to three
                                times (increasing verbosity each time).

Examples:
  hdfscli-avro schema /data/impressions.avro
  hdfscli-avro read -a dev snapshot.avro >snapshot.jsonl
  hdfscli-avro read -F 0.1 -p 2,3 clicks.avro
  hdfscli-avro write -f positives.avro <positives.jsonl -S "$(cat schema.avsc)"

"""

from . import AvroReader, AvroWriter
from ...__main__ import configure_client, parse_arg
from ...config import catch
from ...util import HdfsError
from docopt import docopt
from itertools import islice
from json import JSONEncoder, dumps, loads
from random import random
import sys


class _Encoder(JSONEncoder):

  r"""Custom encoder to support bytes and fixed strings.

  :param \*\*kwargs: Keyword arguments forwarded to the base constructor.

  """

  encoding = 'ISO-8859-1'

  def __init__(self, **kwargs):
    kwargs.update({
      'check_circular': False,
      'separators': (',', ':'),
    })
    if sys.version_info[0] == 2: # Python 3 removed the `encoding` kwarg.
      kwargs['encoding'] = self.encoding
    super(_Encoder, self).__init__(**kwargs)

  def default(self, obj): # pylint: disable=method-hidden
    """This should only ever be run in python 3."""
    if isinstance(obj, bytes):
      return obj.decode(self.encoding)
    return super(_Encoder, self).default(self, obj)


@catch(HdfsError)
def main(argv=None, client=None, stdin=sys.stdin, stdout=sys.stdout):
  """Entry point.

  :param argv: Arguments list.
  :param client: For testing.

  """
  args = docopt(__doc__, argv=argv)
  if not client:
    client = configure_client('hdfscli-avro', args)
  elif args['--log']:
    raise HdfsError('Logging is only available when no client is specified.')
  overwrite = args['--force']
  parts = parse_arg(args, '--parts', int, ',')
  if args['write']:
    writer = AvroWriter(
      client,
      args['HDFS_PATH'],
      overwrite=overwrite,
      schema=parse_arg(args, '--schema', loads),
      codec=args['--codec'],
    )
    with writer:
      records = (loads(line) for line in stdin)
      for record in records:
        writer.write(record)
  else:
    reader = AvroReader(client, args['HDFS_PATH'], parts=parts)
    with reader:
      if args['schema']:
        stdout.write('{}\n'.format(dumps(reader.schema, indent=2)))
      elif args['read']:
        encoder = _Encoder()
        num = parse_arg(args, '--num', int)
        freq = parse_arg(args, '--freq', float)
        if freq:
          for record in reader:
            if random() <= freq:
              stdout.write(encoder.encode(record))
              stdout.write('\n')
        else:
          for record in islice(reader, num):
            stdout.write(encoder.encode(record))
            stdout.write('\n')

if __name__ == '__main__':
  main()
