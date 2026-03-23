#!/usr/bin/env python
# encoding: utf-8

"""WebHDFS API clients."""

from .util import AsyncWriter, HdfsError
from collections import deque
from contextlib import closing, contextmanager
from getpass import getuser
from itertools import repeat
from multiprocessing.pool import ThreadPool
from random import sample
from shutil import move, rmtree
from six import add_metaclass
from six.moves.urllib.parse import quote
from threading import Lock
import codecs
import logging as lg
import os
import os.path as osp
import posixpath as psp
import re
import requests as rq
import sys
import time


_logger = lg.getLogger(__name__)


def _to_error(response):
  """Callback when an API response has a non 2XX status code.

  :param response: Response.

  """
  if response.status_code == 401:
    _logger.error(response.content)
    raise HdfsError('Authentication failure. Check your credentials.')
  try:
    # Cf. http://hadoop.apache.org/docs/r1.0.4/webhdfs.html#Error+Responses
    message = response.json()['RemoteException']['message']
  except ValueError:
    # No clear one thing to display, display entire message content
    message = response.content
  try:
    exception = response.json()['RemoteException']['exception']
  except ValueError:
    exception = None
  return HdfsError(message, exception=exception)


class _Request(object):

  """Class to define API requests.

  :param verb: HTTP verb (`'GET'`, `'PUT'`, etc.).
  :param kwargs: Keyword arguments passed to the request handler.

  """

  webhdfs_prefix = '/webhdfs/v1'
  doc_url = 'https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html'

  def __init__(self, method, **kwargs):
    self.method = method
    self.kwargs = kwargs

  def __call__(self):
    pass # make pylint happy

  def to_method(self, operation):
    """Returns method associated with request to attach to client.

    :param operation: operation name.

    This is called inside the metaclass to switch :class:`_Request` objects
    with the method they represent.

    """

    def api_handler(client, hdfs_path, data=None, strict=True, **params):
      """Wrapper function."""
      params['op'] = operation
      if client._proxy is not None:
        params['doas'] = client._proxy

      attempted_hosts = set()
      while True:
        with client._lock:
          while client._urls[0] in attempted_hosts:
            client._urls.rotate(-1)
          host = client._urls[0]
        url = '{}{}{}'.format(
          host.rstrip('/'),
          self.webhdfs_prefix,
          quote(client.resolve(hdfs_path), '/= '),
        )

        err = None
        try:
          res = client._request(
            method=self.method,
            url=url,
            data=data,
            params=params,
            **self.kwargs
          )
        except (rq.exceptions.ReadTimeout, rq.exceptions.ConnectTimeout,
                rq.exceptions.ConnectionError) as retriable_err:
          err = retriable_err # Retry.
        else:
          if res: # 2XX status code.
            return res
          err = _to_error(res)
          if err.exception not in ('RetriableException', 'StandbyException'):
            if strict:
              raise err
            return res

        attempted_hosts.add(host)
        if len(attempted_hosts) == len(client._urls):
          if len(client._urls) > 1:
            _logger.warning('No reachable host, raising last error.')
          raise err

    api_handler.__name__ = '{}_handler'.format(operation.lower())
    api_handler.__doc__ = 'Cf. {}#{}'.format(self.doc_url, operation)
    return api_handler


class _ClientType(type):

  """Metaclass that enables short and dry request definitions.

  This metaclass transforms any :class:`_Request` instances into their
  corresponding API handlers. Note that the operation used is determined
  directly from the name of the attribute (trimming numbers and underscores and
  uppercasing it).

  """

  pattern = re.compile(r'_|\d')

  def __new__(mcs, name, bases, attrs):
    for key, value in attrs.items():
      if isinstance(value, _Request):
        attrs[key] = value.to_method(mcs.pattern.sub('', key).upper())
    client = super(_ClientType, mcs).__new__(mcs, name, bases, attrs)
    client.__registry__[client.__name__] = client
    return client


@add_metaclass(_ClientType)
class Client(object):

  """Base HDFS web client.

  :param url: Hostname or IP address of HDFS namenode, prefixed with protocol,
    followed by WebHDFS port on namenode.  You may also specify multiple URLs
    separated by semicolons for High Availability support.
  :param proxy: User to proxy as.
  :param root: Root path, this will be prefixed to all HDFS paths passed to the
    client. If the root is relative, the path will be assumed relative to the
    user's home directory.
  :param timeout: Connection timeouts, forwarded to the request handler. How
    long to wait for the server to send data before giving up, as a float, or a
    `(connect_timeout, read_timeout)` tuple. If the timeout is reached, an
    appropriate exception will be raised. See the requests_ documentation for
    details.
  :param session: `requests.Session` instance, used to emit all requests.

  In general, this client should only be used directly when its subclasses
  (e.g. :class:`InsecureClient`, :class:`TokenClient`, and others provided by
  extensions) do not provide enough flexibility.

  .. _requests: http://docs.python-requests.org/en/latest/api/#requests.request

  """

  __registry__ = {}

  def __init__(self, url, root=None, proxy=None, timeout=None, session=None):
    self.root = root
    self.url = url
    self.urls = [u for u in url.split(';') if u]
    self._urls = deque(self.urls) # this is rotated and used internally
    self._session = session or rq.Session()
    self._proxy = proxy
    self._timeout = timeout
    self._lock = Lock()
    _logger.info('Instantiated %r.', self)

  def __repr__(self):
    return '<{}(url={!r})>'.format(self.__class__.__name__, self.url)

  # Generic request handler

  def _request(self, method, url, **kwargs):
    r"""Send request to WebHDFS API.

    :param method: HTTP verb.
    :param url: Url to send the request to.
    :param \*\*kwargs: Extra keyword arguments forwarded to the request
      handler. If any `params` are defined, these will take precedence over
      the instance's defaults.

    """
    return self._session.request(
      method=method,
      url=url,
      timeout=self._timeout,
      headers={'content-type': 'application/octet-stream'}, # For HttpFS.
      **kwargs
    )

  # Raw API endpoints

  _append = _Request('POST', allow_redirects=False) # cf. `read`
  _create = _Request('PUT', allow_redirects=False) # cf. `write`
  _delete = _Request('DELETE')
  _get_acl_status = _Request('GET')
  _get_content_summary = _Request('GET')
  _get_file_checksum = _Request('GET')
  _get_file_status = _Request('GET')
  _get_home_directory = _Request('GET')
  _get_trash_root = _Request('GET')
  _list_status = _Request('GET')
  _mkdirs = _Request('PUT')
  _modify_acl_entries = _Request('PUT')
  _remove_acl_entries = _Request('PUT')
  _remove_default_acl = _Request('PUT')
  _remove_acl = _Request('PUT')
  _open = _Request('GET', stream=True)
  _rename = _Request('PUT')
  _set_acl = _Request('PUT')
  _set_owner = _Request('PUT')
  _set_permission = _Request('PUT')
  _set_replication = _Request('PUT')
  _set_times = _Request('PUT')
  _allow_snapshot = _Request('PUT')
  _disallow_snapshot = _Request('PUT')
  _create_snapshot = _Request('PUT')
  _delete_snapshot = _Request('DELETE')
  _rename_snapshot = _Request('PUT')

  # Exposed endpoints

  def resolve(self, hdfs_path):
    """Return absolute, normalized path, with special markers expanded.

    :param hdfs_path: Remote path.

    Currently supported markers:

    * `'#LATEST'`: this marker gets expanded to the most recently updated file
      or folder. They can be combined using the `'{N}'` suffix. For example,
      `'foo/#LATEST{2}'` is equivalent to `'foo/#LATEST/#LATEST'`.

    """
    path = hdfs_path
    if not psp.isabs(path):
      if not self.root or not psp.isabs(self.root):
        root = self._get_home_directory('/').json()['Path']
        self.root = psp.join(root, self.root) if self.root else root
        _logger.debug('Updated root to %r.', self.root)
      path = psp.join(self.root, path)
    path = psp.normpath(path)

    def expand_latest(match):
      """Substitute #LATEST marker."""
      prefix = match.string[:match.start()]
      suffix = ''
      n = match.group(1) # n as in {N} syntax
      for _ in repeat(None, int(n) if n else 1):
        statuses = self._list_status(psp.join(prefix, suffix)).json()
        candidates = sorted(
          (-status['modificationTime'], status['pathSuffix'])
          for status in statuses['FileStatuses']['FileStatus']
        )
        if not candidates:
          raise HdfsError('Cannot expand #LATEST. %r is empty.', prefix)
        elif len(candidates) == 1 and candidates[0][1] == '':
          raise HdfsError('Cannot expand #LATEST. %r is a file.', prefix)
        suffix = psp.join(suffix, candidates[0][1])
      return '/' + suffix

    path = re.sub(r'/?#LATEST(?:{(\d+)})?(?=/|$)', expand_latest, path)
    # #LATEST expansion (could cache the pattern, but not worth it)

    _logger.debug('Resolved path %r to %r.', hdfs_path, path)
    return path

  def content(self, hdfs_path, strict=True):
    """Get ContentSummary_ for a file or folder on HDFS.

    :param hdfs_path: Remote path.
    :param strict: If `False`, return `None` rather than raise an exception if
      the path doesn't exist.

    .. _ContentSummary: CS_
    .. _CS: http://hadoop.apache.org/docs/r1.0.4/webhdfs.html#ContentSummary

    """
    _logger.info('Fetching content summary for %r.', hdfs_path)
    res = self._get_content_summary(hdfs_path, strict=strict)
    return res.json()['ContentSummary'] if res else None

  def status(self, hdfs_path, strict=True):
    """Get FileStatus_ for a file or folder on HDFS.

    :param hdfs_path: Remote path.
    :param strict: If `False`, return `None` rather than raise an exception if
      the path doesn't exist.

    .. _FileStatus: FS_
    .. _FS: http://hadoop.apache.org/docs/r1.0.4/webhdfs.html#FileStatus

    """
    _logger.info('Fetching status for %r.', hdfs_path)
    res = self._get_file_status(hdfs_path, strict=strict)
    return res.json()['FileStatus'] if res else None

  def acl_status(self, hdfs_path, strict=True):
    """Get AclStatus_ for a file or folder on HDFS.

    :param hdfs_path: Remote path.
    :param strict: If `False`, return `None` rather than raise an exception if
      the path doesn't exist.

    .. _AclStatus: https://hadoop.apache.org/docs/stable2/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Get_ACL_Status

    """
    _logger.info('Fetching ACL status for %r.', hdfs_path)
    res = self._get_acl_status(hdfs_path, strict=strict)
    return res.json()['AclStatus'] if res else None

  def set_acl(self, hdfs_path, acl_spec, clear=True):
    """SetAcl_ or ModifyAcl_ for a file or folder on HDFS.

    :param hdfs_path: Path to an existing remote file or directory. An
      :class:`HdfsError` will be raised if the path doesn't exist.
    :param acl_spec: String representation of an ACL spec. Must be a valid
      string with entries for user, group and other. For example:
      `"user::rwx,user:foo:rw-,group::r--,other::---"`.
    :param clear: Clear existing ACL entries. If set to false, all existing ACL
      entries that are not specified in this call are retained without changes,
      behaving like ModifyAcl_. For example: `"user:foo:rwx"`.

    .. _SetAcl: https://hadoop.apache.org/docs/stable2/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Set_ACL
    .. _ModifyAcl: https://hadoop.apache.org/docs/stable2/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Modify_ACL_Entries

    """
    if clear:
      _logger.info('Setting ACL spec for %r to %r.', hdfs_path, acl_spec)
      self._set_acl(hdfs_path, aclspec=acl_spec)
    else:
      _logger.info('Modifying ACL spec for %r to %r.', hdfs_path, acl_spec)
      self._modify_acl_entries(hdfs_path, aclspec=acl_spec)

  def remove_acl_entries(self, hdfs_path, acl_spec):
    """RemoveAclEntries_ for a file or folder on HDFS.

    :param hdfs_path: Path to an existing remote file or directory. An
      :class:`HdfsError` will be raised if the path doesn't exist.
    :param acl_spec: String representation of an ACL spec. Must be a valid
      string with entries for user, group and other. For example:
      `"user::rwx,user:foo:rw-,group::r--,other::---"`.

    .. _RemoveAclEntries: https://hadoop.apache.org/docs/stable2/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Remove_ACL_Entries

    """
    _logger.info('Removing ACL spec on %r for %r.', hdfs_path, acl_spec)
    self._remove_acl_entries(hdfs_path, aclspec=acl_spec)

  def remove_default_acl(self, hdfs_path):
    """RemoveDefaultAcl_ for a file or folder on HDFS.

        :param hdfs_path: Path to an existing remote file or directory. An
          :class:`HdfsError` will be raised if the path doesn't exist.

        .. _RemoveDefaultAcl: https://hadoop.apache.org/docs/stable2/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Remove_Default_ACL

        """
    _logger.info('Removing default acl for %r', hdfs_path)
    self._remove_default_acl(hdfs_path)

  def remove_acl(self, hdfs_path):
    """RemoveAcl_ for a file or folder on HDFS.

        :param hdfs_path: Path to an existing remote file or directory. An
          :class:`HdfsError` will be raised if the path doesn't exist.

        .. _RemoveAcl: https://hadoop.apache.org/docs/stable2/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Remove_ACL

        """
    _logger.info('Removing all ACL for %r', hdfs_path)
    self._remove_acl(hdfs_path)

  def parts(self, hdfs_path, parts=None, status=False):
    """Returns a dictionary of part-files corresponding to a path.

    :param hdfs_path: Remote path. This directory should contain at most one
      part file per partition (otherwise one will be picked arbitrarily).
    :param parts: List of part-files numbers or total number of part-files to
      select. If a number, that many partitions will be chosen at random. By
      default all part-files are returned. If `parts` is a list and one of the
      parts is not found or too many samples are demanded, an
      :class:`~hdfs.util.HdfsError` is raised.
    :param status: Also return each file's corresponding FileStatus_.

    """
    _logger.debug('Fetching parts for %r.', hdfs_path)
    pattern = re.compile(r'^part-(?:(?:m|r)-|)(\d+)[^/]*$')
    matches = (
      (name, pattern.match(name), s)
      for name, s in self.list(hdfs_path, status=True)
    )
    part_files = {
      int(match.group(1)): (name, s)
      for name, match, s in matches
      if match
    }
    if not part_files:
      raise HdfsError('No part-files found in %r.', hdfs_path)
    _logger.debug('Found %s part-files for %r.', len(part_files), hdfs_path)
    if parts:
      if isinstance(parts, int):
        _logger.debug('Choosing %s parts randomly.', parts)
        if parts > len(part_files):
          raise HdfsError('Not enough part-files in %r.', hdfs_path)
        parts = sample(part_files, parts)
      try:
        infos = list(part_files[p] for p in parts)
      except KeyError as err:
        raise HdfsError('No part-file %r in %r.', err.args[0], hdfs_path)
      _logger.info(
        'Returning %s of %s part-files for %r: %s.', len(infos),
        len(part_files), hdfs_path, ', '.join(name for name, _ in infos)
      )
    else:
      infos = list(sorted(part_files.values()))
      _logger.info('Returning all %s part-files at %r.', len(infos), hdfs_path)
    return infos if status else [name for name, _ in infos]

  def write(self, hdfs_path, data=None, overwrite=False, permission=None,
    blocksize=None, replication=None, buffersize=None, append=False,
    encoding=None):
    """Create a file on HDFS.

    :param hdfs_path: Path where to create file. The necessary directories will
      be created appropriately.
    :param data: Contents of file to write. Can be a string, a generator or a
      file object. The last two options will allow streaming upload (i.e.
      without having to load the entire contents into memory). If `None`, this
      method will return a file-like object and should be called using a `with`
      block (see below for examples).
    :param overwrite: Overwrite any existing file or directory.
    :param permission: Octal permission to set on the newly created file.
      Leading zeros may be omitted.
    :param blocksize: Block size of the file.
    :param replication: Number of replications of the file.
    :param buffersize: Size of upload buffer.
    :param append: Append to a file rather than create a new one.
    :param encoding: Encoding used to serialize data written.

    Sample usages:

    .. code-block:: python

      from json import dump, dumps

      records = [
        {'name': 'foo', 'weight': 1},
        {'name': 'bar', 'weight': 2},
      ]

      # As a context manager:
      with client.write('data/records.jsonl', encoding='utf-8') as writer:
        dump(records, writer)

      # Or, passing in a generator directly:
      client.write('data/records.jsonl', data=dumps(records), encoding='utf-8')

    """
    # TODO: Figure out why this function generates a "Connection pool is full,
    # discarding connection" warning when passed a generator.
    if append:
      if overwrite:
        raise ValueError('Cannot both overwrite and append.')
      if permission or blocksize or replication:
        raise ValueError('Cannot change file properties while appending.')
      _logger.info('Appending to %r.', hdfs_path)
      res = self._append(hdfs_path, buffersize=buffersize)
    else:
      _logger.info('Writing to %r.', hdfs_path)
      res = self._create(
        hdfs_path,
        overwrite=overwrite,
        permission=permission,
        blocksize=blocksize,
        replication=replication,
        buffersize=buffersize,
      )
    loc = res.headers['location']

    def consumer(_data):
      """Thread target."""
      res = self._request(
        method='POST' if append else 'PUT',
        url=loc,
        data=(c.encode(encoding) for c in _data) if encoding else _data,
      )
      if not res:
        raise _to_error(res)

    if data is None:
      return AsyncWriter(consumer)
    else:
      consumer(data)

  def upload(self, hdfs_path, local_path, n_threads=1, temp_dir=None,
    chunk_size=2 ** 16, progress=None, cleanup=True, **kwargs):
    r"""Upload a file or directory to HDFS.

    :param hdfs_path: Target HDFS path. If it already exists and is a
      directory, files will be uploaded inside.
    :param local_path: Local path to file or folder. If a folder, all the files
      inside of it will be uploaded (note that this implies that folders empty
      of files will not be created remotely).
    :param n_threads: Number of threads to use for parallelization. A value of
      `0` (or negative) uses as many threads as there are files.
    :param temp_dir: Directory under which the files will first be uploaded
      when `overwrite=True` and the final remote path already exists. Once the
      upload successfully completes, it will be swapped in.
    :param chunk_size: Interval in bytes by which the files will be uploaded.
    :param progress: Callback function to track progress, called every
      `chunk_size` bytes. It will be passed two arguments, the path to the
      file being uploaded and the number of bytes transferred so far. On
      completion, it will be called once with `-1` as second argument.
    :param cleanup: Delete any uploaded files if an error occurs during the
      upload.
    :param \*\*kwargs: Keyword arguments forwarded to :meth:`write`. In
      particular, set `overwrite` to overwrite any existing file or directory.

    On success, this method returns the remote upload path.

    """
    if chunk_size <= 0:
      raise ValueError('Upload chunk size must be positive.')
    _logger.info('Uploading %r to %r.', local_path, hdfs_path)

    def _upload(_path_tuple):
      """Upload a single file."""
      _local_path, _temp_path = _path_tuple
      _logger.debug('Uploading %r to %r.', _local_path, _temp_path)

      def wrap(_reader, _chunk_size, _progress):
        """Generator that can track progress."""
        nbytes = 0
        while True:
          chunk = _reader.read(_chunk_size)
          if chunk:
            if _progress:
              nbytes += len(chunk)
              _progress(_local_path, nbytes)
            yield chunk
          else:
            break
        if _progress:
          _progress(_local_path, -1)

      with open(_local_path, 'rb') as reader:
        self.write(_temp_path, wrap(reader, chunk_size, progress), **kwargs)

    # First, we gather information about remote paths.
    hdfs_path = self.resolve(hdfs_path)
    temp_path = None
    try:
      statuses = [status for _, status in self.list(hdfs_path, status=True)]
    except HdfsError as err:
      if 'not a directory' in err.message:
        # Remote path is a normal file.
        if not kwargs.get('overwrite'):
          raise HdfsError('Remote path %r already exists.', hdfs_path)
      elif 'does not exist' in err.message:
        # Remote path doesn't exist.
        temp_path = hdfs_path
      else:
        # An unexpected error occurred.
        raise err
    else:
      # Remote path is a directory.
      suffixes = {status['pathSuffix'] for status in statuses}
      local_name = osp.basename(local_path)
      hdfs_path = psp.join(hdfs_path, local_name)
      if local_name in suffixes:
        if not kwargs.get('overwrite'):
          raise HdfsError('Remote path %r already exists.', hdfs_path)
      else:
        temp_path = hdfs_path
    if not temp_path:
      # The remote path already exists, we need to generate a temporary one.
      remote_dpath, remote_name = psp.split(hdfs_path)
      temp_dir = temp_dir or remote_dpath
      temp_path = psp.join(
        temp_dir,
        '{}.temp-{}'.format(remote_name, _current_micros())
      )
      _logger.debug(
        'Upload destination %r already exists. Using temporary path %r.',
        hdfs_path, temp_path
      )
    # Then we figure out which files we need to upload, and where.
    if osp.isdir(local_path):
      local_fpaths = [
        osp.join(dpath, fpath)
        for dpath, _, fpaths in os.walk(local_path)
        for fpath in fpaths
      ]
      if not local_fpaths:
        raise HdfsError('No files to upload found inside %r.', local_path)
      offset = len(local_path.rstrip(os.sep)) + len(os.sep)
      fpath_tuples = [
        (fpath, psp.join(temp_path, fpath[offset:].replace(os.sep, '/')))
        for fpath in local_fpaths
      ]
    elif osp.exists(local_path):
      fpath_tuples = [(local_path, temp_path)]
    else:
      raise HdfsError('Local path %r does not exist.', local_path)
    # Finally, we upload all files (optionally, in parallel).
    if n_threads <= 0:
      n_threads = len(fpath_tuples)
    else:
      n_threads = min(n_threads, len(fpath_tuples))
    _logger.debug(
      'Uploading %s files using %s thread(s).', len(fpath_tuples), n_threads
    )
    try:
      if n_threads == 1:
        for path_tuple in fpath_tuples:
          _upload(path_tuple)
      else:
        _map_async(n_threads, _upload, fpath_tuples)
    except Exception as err: # pylint: disable=broad-except
      if cleanup:
        _logger.exception('Error while uploading. Attempting cleanup.')
        try:
          self.delete(temp_path, recursive=True)
        except Exception:
          _logger.error('Unable to cleanup temporary folder.')
        finally:
          raise err
      else:
        raise err
    else:
      if temp_path != hdfs_path:
        _logger.debug(
          'Upload of %r complete. Moving from %r to %r.',
          local_path, temp_path, hdfs_path
        )
        self.delete(hdfs_path, recursive=True)
        self.rename(temp_path, hdfs_path)
      else:
        _logger.debug(
          'Upload of %r to %r complete.', local_path, hdfs_path
        )
    return hdfs_path

  @contextmanager
  def read(self, hdfs_path, offset=0, length=None, buffer_size=None,
    encoding=None, chunk_size=0, delimiter=None, progress=None):
    """Read a file from HDFS.

    :param hdfs_path: HDFS path.
    :param offset: Starting byte position.
    :param length: Number of bytes to be processed. `None` will read the entire
      file.
    :param buffer_size: Size of the buffer in bytes used for transferring the
      data. Defaults the the value set in the HDFS configuration.
    :param encoding: Encoding used to decode the request. By default the raw
      data is returned. This is mostly helpful in python 3, for example to
      deserialize JSON data (as the decoder expects unicode).
    :param chunk_size: If set to a positive number, the context manager will
      return a generator yielding every `chunk_size` bytes instead of a
      file-like object (unless `delimiter` is also set, see below).
    :param delimiter: If set, the context manager will return a generator
      yielding each time the delimiter is encountered. This parameter requires
      the `encoding` to be specified.
    :param progress: Callback function to track progress, called every
      `chunk_size` bytes (not available if the chunk size isn't specified). It
      will be passed two arguments, the path to the file being uploaded and the
      number of bytes transferred so far. On completion, it will be called once
      with `-1` as second argument.

    This method must be called using a `with` block:

    .. code-block:: python

      with client.read('foo') as reader:
        content = reader.read()

    This ensures that connections are always properly closed.

    .. note::

      The raw file-like object returned by this method (when called without an
      encoding, chunk size, or delimiter) can have a very different performance
      profile than local files. In particular, line-oriented methods are often
      slower. The recommended workaround is to specify an encoding when
      possible or read the entire file before splitting it.

    """
    if chunk_size < 0:
      raise ValueError('Read chunk size must be non-negative.')
    if progress and not chunk_size:
      raise ValueError('Progress callback requires a positive chunk size.')
    if delimiter:
      if not encoding:
        raise ValueError('Delimiter splitting requires an encoding.')
      if chunk_size:
        raise ValueError('Delimiter splitting incompatible with chunk size.')
    _logger.info('Reading file %r.', hdfs_path)
    res = self._open(
      hdfs_path,
      offset=offset,
      length=length,
      buffersize=buffer_size,
    )
    try:
      if not chunk_size and not delimiter:
        yield codecs.getreader(encoding)(res.raw) if encoding else res.raw
      else:
        # Patch in encoding  on the response object so that `iter_content` and
        # `iter_lines` can pick it up. If `None`, it is ignored and no decoding
        # happens (which is why we can always set `decode_unicode=True`).
        res.encoding = encoding
        if delimiter:
          data = res.iter_lines(delimiter=delimiter, decode_unicode=True)
        else:
          data = res.iter_content(chunk_size=chunk_size, decode_unicode=True)
        if progress:

          def reader(_hdfs_path, _progress):
            """Generator that tracks progress."""
            nbytes = 0
            for chunk in data:
              nbytes += len(chunk)
              _progress(_hdfs_path, nbytes)
              yield chunk
            _progress(_hdfs_path, -1)

          yield reader(hdfs_path, progress)
        else:
          yield data
    finally:
      res.close()
      _logger.debug('Closed response for reading file %r.', hdfs_path)

  def download(self, hdfs_path, local_path, overwrite=False, n_threads=1,
    temp_dir=None, **kwargs):
    r"""Download a file or folder from HDFS and save it locally.

    :param hdfs_path: Path on HDFS of the file or folder to download. If a
      folder, all the files under it will be downloaded.
    :param local_path: Local path. If it already exists and is a directory,
      the files will be downloaded inside of it.
    :param overwrite: Overwrite any existing file or directory.
    :param n_threads: Number of threads to use for parallelization. A value of
      `0` (or negative) uses as many threads as there are files.
    :param temp_dir: Directory under which the files will first be downloaded
      when `overwrite=True` and the final destination path already exists. Once
      the download successfully completes, it will be swapped in.
    :param \*\*kwargs: Keyword arguments forwarded to :meth:`read`. If no
      `chunk_size` argument is passed, a default value of 64 kB will be used.
      If a `progress` argument is passed and threading is used, care must be
      taken to ensure correct behavior.

    On success, this method returns the local download path.

    """
    _logger.info('Downloading %r to %r.', hdfs_path, local_path)
    kwargs.setdefault('chunk_size', 2 ** 16)
    lock = Lock()

    def _download(_path_tuple):
      """Download a single file."""
      _remote_path, _temp_path = _path_tuple
      _logger.debug('Downloading %r to %r.', _remote_path, _temp_path)
      _dpath = osp.dirname(_temp_path)
      with lock:
        # Prevent race condition when using multiple threads.
        if not osp.exists(_dpath):
          os.makedirs(_dpath)
      with open(_temp_path, 'wb') as _writer:
        with self.read(_remote_path, **kwargs) as reader:
          for chunk in reader:
            _writer.write(chunk)

    # First, we figure out where we will download the files to.
    hdfs_path = self.resolve(hdfs_path)
    local_path = osp.realpath(local_path)
    if osp.isdir(local_path):
      local_path = osp.join(local_path, psp.basename(hdfs_path))
    if osp.exists(local_path):
      if not overwrite:
        raise HdfsError('Path %r already exists.', local_path)
      local_dpath, local_name = osp.split(local_path)
      temp_dir = temp_dir or local_dpath
      temp_path = osp.join(
        temp_dir,
        '{}.temp-{}'.format(local_name, _current_micros())
      )
      _logger.debug(
        'Download destination %r already exists. Using temporary path %r.',
        local_path, temp_path
      )
    else:
      if not osp.isdir(osp.dirname(local_path)):
        raise HdfsError('Parent directory of %r does not exist.', local_path)
      temp_path = local_path
    # Then we figure out which files we need to download and where.
    remote_paths = list(self.walk(hdfs_path, depth=0, status=False))
    if not remote_paths:
      # This is a single file.
      remote_fpaths = [hdfs_path]
    else:
      remote_fpaths = [
        psp.join(dpath, fname)
        for dpath, _, fnames in remote_paths
        for fname in fnames
      ]
      if not remote_fpaths:
        raise HdfsError('No files to download found inside %r.', hdfs_path)
    offset = len(hdfs_path) + 1 # Prefix length.
    fpath_tuples = [
      (
        fpath,
        osp.join(temp_path, fpath[offset:].replace('/', os.sep)).rstrip(os.sep)
      )
      for fpath in remote_fpaths
    ]
    # Finally, we download all of them.
    if n_threads <= 0:
      n_threads = len(fpath_tuples)
    else:
      n_threads = min(n_threads, len(fpath_tuples))
    _logger.debug(
      'Downloading %s files using %s thread(s).', len(fpath_tuples), n_threads
    )
    try:
      if n_threads == 1:
        for fpath_tuple in fpath_tuples:
          _download(fpath_tuple)
      else:
        _map_async(n_threads, _download, fpath_tuples)
    except Exception as err: # pylint: disable=broad-except
      _logger.exception('Error while downloading. Attempting cleanup.')
      try:
        if osp.isdir(temp_path):
          rmtree(temp_path)
        else:
          os.remove(temp_path)
      except Exception:
        _logger.error('Unable to cleanup temporary folder.')
      finally:
        raise err
    else:
      if temp_path != local_path:
        _logger.debug(
          'Download of %r complete. Moving from %r to %r.',
          hdfs_path, temp_path, local_path
        )
        if osp.isdir(local_path):
          rmtree(local_path)
        else:
          os.remove(local_path)
        move(temp_path, local_path)
      else:
        _logger.debug(
          'Download of %s to %r complete.', hdfs_path, local_path
        )
    return local_path

  def delete(self, hdfs_path, recursive=False, skip_trash=True):
    """Remove a file or directory from HDFS.

    :param hdfs_path: HDFS path.
    :param recursive: Recursively delete files and directories. By default,
      this method will raise an :class:`HdfsError` if trying to delete a
      non-empty directory.
    :param skip_trash: When false, the deleted path will be moved to an
      appropriate trash folder rather than deleted. This requires Hadoop 2.9+
      and trash to be enabled on the cluster.

    This function returns `True` if the deletion was successful and `False` if
    no file or directory previously existed at `hdfs_path`.

    """
    verb = 'Deleting' if skip_trash else 'Trashing'
    _logger.info(
      '%s %r%s.', verb, hdfs_path, ' recursively' if recursive else ''
    )
    if skip_trash:
      return self._delete(hdfs_path, recursive=recursive).json()['boolean']
    hdfs_path = self.resolve(hdfs_path)
    status = self.status(hdfs_path, strict=False)
    if not status:
      return False
    if status['type'] == 'DIRECTORY' and not recursive:
      raise HdfsError('Non-recursive trashing of directory %r.', hdfs_path)
    _logger.info('Fetching trash root for %r.', hdfs_path)
    trash_path = self._get_trash_root(hdfs_path).json()['Path']
    # The default trash policy (http://mtth.xyz/_9lc9t3hjtz276rx) expects
    # folders to be under a `"Current"` subfolder. We also add a timestamped
    # folder as a simple safeguard against path conflicts (note that the above
    # policy implements a more involved variant).
    dst_path = psp.join(trash_path, 'Current', _current_micros())
    self.makedirs(dst_path)
    # Note that there is a (hopefully small) race condition here: the path might
    # have been deleted between the status call above and the rename here.
    self.rename(hdfs_path, dst_path)
    _logger.info('%r moved to trash at %r.', hdfs_path, dst_path)
    return True

  def rename(self, hdfs_src_path, hdfs_dst_path):
    """Move a file or folder.

    :param hdfs_src_path: Source path.
    :param hdfs_dst_path: Destination path. If the path already exists and is
      a directory, the source will be moved into it. If the path exists and is
      a file, or if a parent destination directory is missing, this method will
      raise an :class:`HdfsError`.

    """
    _logger.info('Renaming %r to %r.', hdfs_src_path, hdfs_dst_path)
    hdfs_dst_path = self.resolve(hdfs_dst_path)
    res = self._rename(hdfs_src_path, destination=hdfs_dst_path)
    if not res.json()['boolean']:
      raise HdfsError(
        'Unable to rename %r to %r.',
        self.resolve(hdfs_src_path), hdfs_dst_path
      )

  def set_owner(self, hdfs_path, owner=None, group=None):
    """Change the owner of file.

    :param hdfs_path: HDFS path.
    :param owner: Optional, new owner for file.
    :param group: Optional, new group for file.

    At least one of `owner` and `group` must be specified.

    """
    if not owner and not group:
      raise ValueError('Must set at least one of owner or group.')
    messages = []
    if owner:
      messages.append('owner to {!r}'.format(owner))
    if group:
      messages.append('group to {!r}'.format(group))
    _logger.info('Changing %s of %r.', ', and'.join(messages), hdfs_path)
    self._set_owner(hdfs_path, owner=owner, group=group)

  def set_permission(self, hdfs_path, permission):
    """Change the permissions of file.

    :param hdfs_path: HDFS path.
    :param permission: New octal permissions string of file.

    """
    _logger.info(
      'Changing permissions of %r to %r.', hdfs_path, permission
    )
    self._set_permission(hdfs_path, permission=permission)

  def set_times(self, hdfs_path, access_time=None, modification_time=None):
    """Change remote timestamps.

    :param hdfs_path: HDFS path.
    :param access_time: Timestamp of last file access.
    :param modification_time: Timestamps of last file access.

    """
    if not access_time and not modification_time:
      raise ValueError('At least one of time must be specified.')
    msgs = []
    if access_time:
      msgs.append('access time to {!r}'.format(access_time))
    if modification_time:
      msgs.append('modification time to {!r}'.format(modification_time))
    _logger.info('Updating %s of %r.', ' and '.join(msgs), hdfs_path)
    self._set_times(
      hdfs_path,
      accesstime=access_time,
      modificationtime=modification_time,
    )

  def set_replication(self, hdfs_path, replication):
    """Set file replication.

    :param hdfs_path: Path to an existing remote file. An :class:`HdfsError`
      will be raised if the path doesn't exist or points to a directory.
    :param replication: Replication factor.

    """
    _logger.info(
      'Setting replication factor to %r for %r.', replication, hdfs_path
    )
    res = self._set_replication(hdfs_path, replication=replication)
    if not res.json()['boolean']:
      raise HdfsError('%r is not a file.', hdfs_path)

  def makedirs(self, hdfs_path, permission=None):
    """Create a remote directory, recursively if necessary.

    :param hdfs_path: Remote path. Intermediate directories will be created
      appropriately.
    :param permission: Octal permission to set on the newly created directory.
      These permissions will only be set on directories that do not already
      exist.

    This function currently has no return value as WebHDFS doesn't return a
    meaningful flag.

    """
    _logger.info('Creating directories to %r.', hdfs_path)
    self._mkdirs(hdfs_path, permission=permission)

  def checksum(self, hdfs_path):
    """Get a remote file's checksum.

    :param hdfs_path: Remote path. Must point to a file.

    """
    _logger.info('Getting checksum for %r.', hdfs_path)
    return self._get_file_checksum(hdfs_path).json()['FileChecksum']

  def allow_snapshot(self, hdfs_path):
    """Allow snapshots for a remote folder.

    :param hdfs_path: Remote path to a directory.  If `hdfs_path`
      doesn't exist or does points to a normal file, an
      :class:`HdfsError` will be raised.  No-op if snapshotting is
      already allowed.
    """
    _logger.info('Allowing snapshots in %r.', hdfs_path)
    hdfs_path = self.resolve(hdfs_path)
    self._allow_snapshot(hdfs_path)

  def disallow_snapshot(self, hdfs_path):
    """Disallow snapshots for a remote folder.

    :param hdfs_path: Remote path to a directory.  If `hdfs_path`
      doesn't exist, points to a normal file or there are some
      snapshots, an :class:`HdfsError` will be raised.

    No-op if snapshotting is disallowed/never allowed.
    """
    _logger.info('Disallowing snapshots in %r.', hdfs_path)
    hdfs_path = self.resolve(hdfs_path)
    self._disallow_snapshot(hdfs_path)

  def create_snapshot(self, hdfs_path, snapshotname=None):
    """Create snapshot for a remote folder where it was allowed.

    :param hdfs_path: Remote path to a directory.  If `hdfs_path`
      doesn't exist, doesn't allow to create snapshot or points to a
      normal file, an :class:`HdfsError` will be raised.
    :param snapshotname snapshot name; if absent, name is generated
      by the server.

    Returns a path to created snapshot.
    """
    _logger.info('Creating snapshot %r in %r.', snapshotname, hdfs_path)
    hdfs_path = self.resolve(hdfs_path)
    return self._create_snapshot(hdfs_path, snapshotname=snapshotname).json()['Path']

  def delete_snapshot(self, hdfs_path, snapshotname):
    """Remove snapshot for a remote folder where it was allowed.

    :param hdfs_path: Remote path to a directory.  If `hdfs_path` doesn't exist
      or points to a normal file, an :class:`HdfsError` will be raised.
    :param snapshotname snapshot name; if it does not exist, an
      :class:`HdfsError` will be raised.
    """
    _logger.info('Deleting snapshot %r in %r.', snapshotname, hdfs_path)
    hdfs_path = self.resolve(hdfs_path)
    self._delete_snapshot(hdfs_path, snapshotname=snapshotname)

  def rename_snapshot(self, hdfs_path, oldsnapshotname, snapshotname):
    """Rename snapshot for a remote folder.

    :param hdfs_path: Remote path to a directory.  If `hdfs_path` doesn't exist
      or points to a normal file, an :class:`HdfsError` will be raised.
    :param oldsnapshotname snapshot name; if it does not exist,
      an :class:`HdfsError` will be raised.
    :param snapshotname new snapshot name; if it does already exist,
      an :class:`HdfsError` will be raised.
    """
    _logger.info('Renaming snapshot %r to %r in %r.', oldsnapshotname, snapshotname, hdfs_path)
    hdfs_path = self.resolve(hdfs_path)
    self._rename_snapshot(hdfs_path,
                          oldsnapshotname=oldsnapshotname,
                          snapshotname=snapshotname)

  def list(self, hdfs_path, status=False):
    """Return names of files contained in a remote folder.

    :param hdfs_path: Remote path to a directory. If `hdfs_path` doesn't exist
      or points to a normal file, an :class:`HdfsError` will be raised.
    :param status: Also return each file's corresponding FileStatus_.

    """
    _logger.info('Listing %r.', hdfs_path)
    hdfs_path = self.resolve(hdfs_path)
    statuses = self._list_status(hdfs_path).json()['FileStatuses']['FileStatus']
    if len(statuses) == 1 and (
      not statuses[0]['pathSuffix'] or self.status(hdfs_path)['type'] == 'FILE'
      # HttpFS behaves incorrectly here, we sometimes need an extra call to
      # make sure we always identify if we are dealing with a file.
    ):
      raise HdfsError('%r is not a directory.', hdfs_path)
    if status:
      return [(s['pathSuffix'], s) for s in statuses]
    else:
      return [s['pathSuffix'] for s in statuses]

  def walk(self, hdfs_path, depth=0, status=False, ignore_missing=False,
    allow_dir_changes=False):
    """Depth-first walk of remote filesystem.

    :param hdfs_path: Starting path. If the path doesn't exist, an
      :class:`HdfsError` will be raised. If it points to a file, the returned
      generator will be empty.
    :param depth: Maximum depth to explore. `0` for no limit.
    :param status: Also return each file or folder's corresponding FileStatus_.
    :param ignore_missing: Ignore missing nested folders rather than raise an
      exception. This can be useful when the tree is modified during a walk.
    :param allow_dir_changes: Allow changes to the directories' list to affect
      the walk. For example clearing it by setting `dirs[:] = []` would prevent
      the walk from entering any nested directories. This option can only be set
      when `status` is false.

    This method returns a generator yielding tuples `(path, dirs, files)`
    where `path` is the absolute path to the current directory, `dirs` is the
    list of directory names it contains, and `files` is the list of file names
    it contains.

    """
    _logger.info('Walking %r (depth %r).', hdfs_path, depth)
    if status and allow_dir_changes:
      raise ValueError('Cannot set both status and allow_dir_changes')

    def _walk(dir_path, dir_status, depth):
      """Recursion helper."""
      try:
        infos = self.list(dir_path, status=True)
      except HdfsError as err:
        if ignore_missing and 'does not exist' in err.message:
          return
        raise
      dir_infos = [info for info in infos if info[1]['type'] == 'DIRECTORY']
      file_infos = [info for info in infos if info[1]['type'] == 'FILE']
      if status:
        yield ((dir_path, dir_status), dir_infos, file_infos)
      else:
        dir_names = [dir_name for dir_name, _ in dir_infos]
        yield (
          dir_path,
          dir_names,
          [file_name for file_name, _ in file_infos],
        )
        if allow_dir_changes:
          infos_by_name = dict(dir_infos)
          strict = not ignore_missing
          dir_infos = []
          for dir_name in dir_names:
            info = infos_by_name.get(dir_name)
            if not info:
              info = self.status(psp.join(dir_path, dir_name), strict=strict)
            if info:
              dir_infos.append((dir_name, info))
      if depth != 1:
        for name, s in dir_infos:
          path = psp.join(dir_path, name)
          for infos in _walk(path, s, depth - 1):
            yield infos

    hdfs_path = self.resolve(hdfs_path) # Cache resolution.
    s = self.status(hdfs_path)
    if s['type'] == 'DIRECTORY':
      for infos in _walk(hdfs_path, s, depth):
        yield infos

  # Class loader.

  @classmethod
  def from_options(cls, options, class_name='Client'):
    """Load client from options.

    :param options: Options dictionary.
    :param class_name: Client class name. Defaults to the base :class:`Client`
      class.

    This method provides a single entry point to instantiate any registered
    :class:`Client` subclass. To register a subclass, simply load its
    containing module. If using the CLI, you can use the `autoload.modules` and
    `autoload.paths` options.

    """
    try:
      return cls.__registry__[class_name](**options)
    except KeyError:
      raise HdfsError('Unknown client class: %r', class_name)
    except TypeError:
      raise HdfsError('Invalid options: %r', options)


# Custom client classes
# ---------------------

class InsecureClient(Client):

  r"""HDFS web client to use when security is off.

  :param url: Hostname or IP address of HDFS namenode, prefixed with protocol,
    followed by WebHDFS port on namenode
  :param user: User default. Defaults to the current user's (as determined by
    `whoami`).
  :param \*\*kwargs: Keyword arguments passed to the base class' constructor.

  Note that if a session argument is passed in, it will be modified in-place to
  support authentication.

  """

  def __init__(self, url, user=None, **kwargs):
    user = user or getuser()
    session = kwargs.setdefault('session', rq.Session())
    if not session.params:
      session.params = {}
    session.params['user.name'] = user
    super(InsecureClient, self).__init__(url, **kwargs)


class TokenClient(Client):

  r"""HDFS web client using Hadoop token delegation security.

  :param url: Hostname or IP address of HDFS namenode, prefixed with protocol,
    followed by WebHDFS port on namenode
  :param token: Hadoop delegation token.
  :param \*\*kwargs: Keyword arguments passed to the base class' constructor.

  Note that if a session argument is passed in, it will be modified in-place to
  support authentication.

  """

  def __init__(self, url, token, **kwargs):
    session = kwargs.setdefault('session', rq.Session())
    if not session.params:
      session.params = {}
    session.params['delegation'] = token
    super(TokenClient, self).__init__(url, **kwargs)


# Helpers
# -------

def _current_micros():
  """Returns a string representing the current time in microseconds."""
  return str(int(time.time() * 1e6))

def _map_async(pool_size, func, args):
  """Async map (threading), handling python 2.6 edge case.

  :param pool_size: Maximum number of threads.
  :param func: Function to run.
  :param args: Iterable of arguments (one per thread).

  This is necessary since using `map` will in general prevent keyboard
  interrupts from functioning properly (see this thread for more details -
  http://stackoverflow.com/a/1408476/1062617), but `map_async` hangs in python
  2.6.

  """
  pool = ThreadPool(pool_size)
  with closing(pool):
    if sys.version_info <= (2, 6):
      results = pool.map(func, args)
    else:
      results = pool.map_async(func, args).get(1 << 22) # 6+ weeks.
  pool.join()
  return results
