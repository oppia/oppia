# Copyright 2012 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the License for the specific
# language governing permissions and limitations under the License.

"""File Interface for Google Cloud Storage."""



from __future__ import with_statement



__all__ = ['delete',
           'listbucket',
           'open',
           'stat',
          ]

import logging
import StringIO
import urllib
import xml.etree.cElementTree as ET
from . import api_utils
from . import common
from . import errors
from . import storage_api



def open(filename,
         mode='r',
         content_type=None,
         options=None,
         read_buffer_size=storage_api.ReadBuffer.DEFAULT_BUFFER_SIZE,
         retry_params=None,
         _account_id=None):
  """Opens a Google Cloud Storage file and returns it as a File-like object.

  Args:
    filename: A Google Cloud Storage filename of form '/bucket/filename'.
    mode: 'r' for reading mode. 'w' for writing mode.
      In reading mode, the file must exist. In writing mode, a file will
      be created or be overrode.
    content_type: The MIME type of the file. str. Only valid in writing mode.
    options: A str->basestring dict to specify additional headers to pass to
      GCS e.g. {'x-goog-acl': 'private', 'x-goog-meta-foo': 'foo'}.
      Supported options are x-goog-acl, x-goog-meta-, cache-control,
      content-disposition, and content-encoding.
      Only valid in writing mode.
      See https://developers.google.com/storage/docs/reference-headers
      for details.
    read_buffer_size: The buffer size for read. Read keeps a buffer
      and prefetches another one. To minimize blocking for large files,
      always read by buffer size. To minimize number of RPC requests for
      small files, set a large buffer size. Max is 30MB.
    retry_params: An instance of api_utils.RetryParams for subsequent calls
      to GCS from this file handle. If None, the default one is used.
    _account_id: Internal-use only.

  Returns:
    A reading or writing buffer that supports File-like interface. Buffer
    must be closed after operations are done.

  Raises:
    errors.AuthorizationError: if authorization failed.
    errors.NotFoundError: if an object that's expected to exist doesn't.
    ValueError: invalid open mode or if content_type or options are specified
      in reading mode.
  """
  common.validate_file_path(filename)
  api = storage_api._get_storage_api(retry_params=retry_params,
                                     account_id=_account_id)
  filename = api_utils._quote_filename(filename)

  if mode == 'w':
    common.validate_options(options)
    return storage_api.StreamingBuffer(api, filename, content_type, options)
  elif mode == 'r':
    if content_type or options:
      raise ValueError('Options and content_type can only be specified '
                       'for writing mode.')
    return storage_api.ReadBuffer(api,
                                  filename,
                                  buffer_size=read_buffer_size)
  else:
    raise ValueError('Invalid mode %s.' % mode)


def delete(filename, retry_params=None, _account_id=None):
  """Delete a Google Cloud Storage file.

  Args:
    filename: A Google Cloud Storage filename of form '/bucket/filename'.
    retry_params: An api_utils.RetryParams for this call to GCS. If None,
      the default one is used.
    _account_id: Internal-use only.

  Raises:
    errors.NotFoundError: if the file doesn't exist prior to deletion.
  """
  api = storage_api._get_storage_api(retry_params=retry_params,
                                     account_id=_account_id)
  common.validate_file_path(filename)
  filename = api_utils._quote_filename(filename)
  status, resp_headers, content = api.delete_object(filename)
  errors.check_status(status, [204], filename, resp_headers=resp_headers,
                      body=content)


def stat(filename, retry_params=None, _account_id=None):
  """Get GCSFileStat of a Google Cloud storage file.

  Args:
    filename: A Google Cloud Storage filename of form '/bucket/filename'.
    retry_params: An api_utils.RetryParams for this call to GCS. If None,
      the default one is used.
    _account_id: Internal-use only.

  Returns:
    a GCSFileStat object containing info about this file.

  Raises:
    errors.AuthorizationError: if authorization failed.
    errors.NotFoundError: if an object that's expected to exist doesn't.
  """
  common.validate_file_path(filename)
  api = storage_api._get_storage_api(retry_params=retry_params,
                                     account_id=_account_id)
  status, headers, content = api.head_object(
      api_utils._quote_filename(filename))
  errors.check_status(status, [200], filename, resp_headers=headers,
                      body=content)
  file_stat = common.GCSFileStat(
      filename=filename,
      st_size=common.get_stored_content_length(headers),
      st_ctime=common.http_time_to_posix(headers.get('last-modified')),
      etag=headers.get('etag'),
      content_type=headers.get('content-type'),
      metadata=common.get_metadata(headers))

  return file_stat


def _copy2(src, dst, metadata=None, retry_params=None):
  """Copy the file content from src to dst.

  Internal use only!

  Args:
    src: /bucket/filename
    dst: /bucket/filename
    metadata: a dict of metadata for this copy. If None, old metadata is copied.
      For example, {'x-goog-meta-foo': 'bar'}.
    retry_params: An api_utils.RetryParams for this call to GCS. If None,
      the default one is used.

  Raises:
    errors.AuthorizationError: if authorization failed.
    errors.NotFoundError: if an object that's expected to exist doesn't.
  """
  common.validate_file_path(src)
  common.validate_file_path(dst)

  if metadata is None:
    metadata = {}
    copy_meta = 'COPY'
  else:
    copy_meta = 'REPLACE'
  metadata.update({'x-goog-copy-source': src,
                   'x-goog-metadata-directive': copy_meta})

  api = storage_api._get_storage_api(retry_params=retry_params)
  status, resp_headers, content = api.put_object(
      api_utils._quote_filename(dst), headers=metadata)
  errors.check_status(status, [200], src, metadata, resp_headers, body=content)


def listbucket(path_prefix, marker=None, prefix=None, max_keys=None,
               delimiter=None, retry_params=None, _account_id=None):
  """Returns a GCSFileStat iterator over a bucket.

  Optional arguments can limit the result to a subset of files under bucket.

  This function has two modes:
  1. List bucket mode: Lists all files in the bucket without any concept of
     hierarchy. GCS doesn't have real directory hierarchies.
  2. Directory emulation mode: If you specify the 'delimiter' argument,
     it is used as a path separator to emulate a hierarchy of directories.
     In this mode, the "path_prefix" argument should end in the delimiter
     specified (thus designates a logical directory). The logical directory's
     contents, both files and subdirectories, are listed. The names of
     subdirectories returned will end with the delimiter. So listbucket
     can be called with the subdirectory name to list the subdirectory's
     contents.

  Args:
    path_prefix: A Google Cloud Storage path of format "/bucket" or
      "/bucket/prefix". Only objects whose fullpath starts with the
      path_prefix will be returned.
    marker: Another path prefix. Only objects whose fullpath starts
      lexicographically after marker will be returned (exclusive).
    prefix: Deprecated. Use path_prefix.
    max_keys: The limit on the number of objects to return. int.
      For best performance, specify max_keys only if you know how many objects
      you want. Otherwise, this method requests large batches and handles
      pagination for you.
    delimiter: Use to turn on directory mode. str of one or multiple chars
      that your bucket uses as its directory separator.
    retry_params: An api_utils.RetryParams for this call to GCS. If None,
      the default one is used.
    _account_id: Internal-use only.

  Examples:
    For files "/bucket/a",
              "/bucket/bar/1"
              "/bucket/foo",
              "/bucket/foo/1", "/bucket/foo/2/1", "/bucket/foo/3/1",

    Regular mode:
    listbucket("/bucket/f", marker="/bucket/foo/1")
    will match "/bucket/foo/2/1", "/bucket/foo/3/1".

    Directory mode:
    listbucket("/bucket/", delimiter="/")
    will match "/bucket/a, "/bucket/bar/" "/bucket/foo", "/bucket/foo/".
    listbucket("/bucket/foo/", delimiter="/")
    will match "/bucket/foo/1", "/bucket/foo/2/", "/bucket/foo/3/"

  Returns:
    Regular mode:
    A GCSFileStat iterator over matched files ordered by filename.
    The iterator returns GCSFileStat objects. filename, etag, st_size,
    st_ctime, and is_dir are set.

    Directory emulation mode:
    A GCSFileStat iterator over matched files and directories ordered by
    name. The iterator returns GCSFileStat objects. For directories,
    only the filename and is_dir fields are set.

    The last name yielded can be used as next call's marker.
  """
  if prefix:
    common.validate_bucket_path(path_prefix)
    bucket = path_prefix
  else:
    bucket, prefix = common._process_path_prefix(path_prefix)

  if marker and marker.startswith(bucket):
    marker = marker[len(bucket) + 1:]

  api = storage_api._get_storage_api(retry_params=retry_params,
                                     account_id=_account_id)
  options = {}
  if marker:
    options['marker'] = marker
  if max_keys:
    options['max-keys'] = max_keys
  if prefix:
    options['prefix'] = prefix
  if delimiter:
    options['delimiter'] = delimiter

  return _Bucket(api, bucket, options)


class _Bucket(object):
  """A wrapper for a GCS bucket as the return value of listbucket."""

  def __init__(self, api, path, options):
    """Initialize.

    Args:
      api: storage_api instance.
      path: bucket path of form '/bucket'.
      options: a dict of listbucket options. Please see listbucket doc.
    """
    self._init(api, path, options)

  def _init(self, api, path, options):
    self._api = api
    self._path = path
    self._options = options.copy()
    self._get_bucket_fut = self._api.get_bucket_async(
        self._path + '?' + urllib.urlencode(self._options))
    self._last_yield = None
    self._new_max_keys = self._options.get('max-keys')

  def __getstate__(self):
    options = self._options
    if self._last_yield:
      options['marker'] = self._last_yield.filename[len(self._path) + 1:]
    if self._new_max_keys is not None:
      options['max-keys'] = self._new_max_keys
    return {'api': self._api,
            'path': self._path,
            'options': options}

  def __setstate__(self, state):
    self._init(state['api'], state['path'], state['options'])

  def __iter__(self):
    """Iter over the bucket.

    Yields:
      GCSFileStat: a GCSFileStat for an object in the bucket.
        They are ordered by GCSFileStat.filename.
    """
    total = 0
    max_keys = self._options.get('max-keys')

    while self._get_bucket_fut:
      status, resp_headers, content = self._get_bucket_fut.get_result()
      errors.check_status(status, [200], self._path, resp_headers=resp_headers,
                          body=content, extras=self._options)

      if self._should_get_another_batch(content):
        self._get_bucket_fut = self._api.get_bucket_async(
            self._path + '?' + urllib.urlencode(self._options))
      else:
        self._get_bucket_fut = None

      root = ET.fromstring(content)
      dirs = self._next_dir_gen(root)
      files = self._next_file_gen(root)
      next_file = files.next()
      next_dir = dirs.next()

      while ((max_keys is None or total < max_keys) and
             not (next_file is None and next_dir is None)):
        total += 1
        if next_file is None:
          self._last_yield = next_dir
          next_dir = dirs.next()
        elif next_dir is None:
          self._last_yield = next_file
          next_file = files.next()
        elif next_dir < next_file:
          self._last_yield = next_dir
          next_dir = dirs.next()
        elif next_file < next_dir:
          self._last_yield = next_file
          next_file = files.next()
        else:
          logging.error(
              'Should never reach. next file is %r. next dir is %r.',
              next_file, next_dir)
        if self._new_max_keys:
          self._new_max_keys -= 1
        yield self._last_yield

  def _next_file_gen(self, root):
    """Generator for next file element in the document.

    Args:
      root: root element of the XML tree.

    Yields:
      GCSFileStat for the next file.
    """
    for e in root.getiterator(common._T_CONTENTS):
      st_ctime, size, etag, key = None, None, None, None
      for child in e.getiterator('*'):
        if child.tag == common._T_LAST_MODIFIED:
          st_ctime = common.dt_str_to_posix(child.text)
        elif child.tag == common._T_ETAG:
          etag = child.text
        elif child.tag == common._T_SIZE:
          size = child.text
        elif child.tag == common._T_KEY:
          key = child.text
      yield common.GCSFileStat(self._path + '/' + key,
                               size, etag, st_ctime)
      e.clear()
    yield None

  def _next_dir_gen(self, root):
    """Generator for next directory element in the document.

    Args:
      root: root element in the XML tree.

    Yields:
      GCSFileStat for the next directory.
    """
    for e in root.getiterator(common._T_COMMON_PREFIXES):
      yield common.GCSFileStat(
          self._path + '/' + e.find(common._T_PREFIX).text,
          st_size=None, etag=None, st_ctime=None, is_dir=True)
      e.clear()
    yield None

  def _should_get_another_batch(self, content):
    """Whether to issue another GET bucket call.

    Args:
      content: response XML.

    Returns:
      True if should, also update self._options for the next request.
      False otherwise.
    """
    if ('max-keys' in self._options and
        self._options['max-keys'] <= common._MAX_GET_BUCKET_RESULT):
      return False

    elements = self._find_elements(
        content, set([common._T_IS_TRUNCATED,
                      common._T_NEXT_MARKER]))
    if elements.get(common._T_IS_TRUNCATED, 'false').lower() != 'true':
      return False

    next_marker = elements.get(common._T_NEXT_MARKER)
    if next_marker is None:
      self._options.pop('marker', None)
      return False
    self._options['marker'] = next_marker
    return True

  def _find_elements(self, result, elements):
    """Find interesting elements from XML.

    This function tries to only look for specified elements
    without parsing the entire XML. The specified elements is better
    located near the beginning.

    Args:
      result: response XML.
      elements: a set of interesting element tags.

    Returns:
      A dict from element tag to element value.
    """
    element_mapping = {}
    result = StringIO.StringIO(result)
    for _, e in ET.iterparse(result, events=('end',)):
      if not elements:
        break
      if e.tag in elements:
        element_mapping[e.tag] = e.text
        elements.remove(e.tag)
    return element_mapping
