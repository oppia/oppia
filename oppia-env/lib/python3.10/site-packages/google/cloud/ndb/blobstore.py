# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Provides an ``ndb`` interface for the blob store.

Initially, the blob store was an App Engine specific API for Google Cloud
Storage.

No longer supported.
"""


from google.cloud.ndb import _datastore_types
from google.cloud.ndb import model
from google.cloud.ndb import exceptions


__all__ = [
    "BLOB_INFO_KIND",
    "BLOB_KEY_HEADER",
    "BLOB_MIGRATION_KIND",
    "BLOB_RANGE_HEADER",
    "BlobFetchSizeTooLargeError",
    "BlobInfo",
    "BlobInfoParseError",
    "BlobKey",
    "BlobKeyProperty",
    "BlobNotFoundError",
    "BlobReader",
    "create_upload_url",
    "create_upload_url_async",
    "DataIndexOutOfRangeError",
    "delete",
    "delete_async",
    "delete_multi",
    "delete_multi_async",
    "Error",
    "fetch_data",
    "fetch_data_async",
    "get",
    "get_async",
    "get_multi",
    "get_multi_async",
    "InternalError",
    "MAX_BLOB_FETCH_SIZE",
    "parse_blob_info",
    "PermissionDeniedError",
    "UPLOAD_INFO_CREATION_HEADER",
]


BlobKey = _datastore_types.BlobKey

BLOB_INFO_KIND = "__BlobInfo__"
BLOB_MIGRATION_KIND = "__BlobMigration__"
BLOB_KEY_HEADER = "X-AppEngine-BlobKey"
BLOB_RANGE_HEADER = "X-AppEngine-BlobRange"
MAX_BLOB_FETCH_SIZE = 1015808
UPLOAD_INFO_CREATION_HEADER = "X-AppEngine-Upload-Creation"

BlobKeyProperty = model.BlobKeyProperty


class BlobFetchSizeTooLargeError(object):
    def __init__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()


class BlobInfo(object):
    def __init__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()

    @classmethod
    def get(cls, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()

    @classmethod
    def get_async(cls, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()

    @classmethod
    def get_multi(cls, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()

    @classmethod
    def get_multi_async(cls, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()


class BlobInfoParseError(object):
    def __init__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()


class BlobNotFoundError(object):
    def __init__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()


class BlobReader(object):
    def __init__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()


def create_upload_url(*args, **kwargs):
    raise exceptions.NoLongerImplementedError()


def create_upload_url_async(*args, **kwargs):
    raise exceptions.NoLongerImplementedError()


class DataIndexOutOfRangeError(object):
    def __init__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()


def delete(*args, **kwargs):
    raise exceptions.NoLongerImplementedError()


def delete_async(*args, **kwargs):
    raise exceptions.NoLongerImplementedError()


def delete_multi(*args, **kwargs):
    raise exceptions.NoLongerImplementedError()


def delete_multi_async(*args, **kwargs):
    raise exceptions.NoLongerImplementedError()


class Error(object):
    def __init__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()


def fetch_data(*args, **kwargs):
    raise exceptions.NoLongerImplementedError()


def fetch_data_async(*args, **kwargs):
    raise exceptions.NoLongerImplementedError()


get = BlobInfo.get
get_async = BlobInfo.get_async
get_multi = BlobInfo.get_multi
get_multi_async = BlobInfo.get_multi_async


class InternalError(object):
    def __init__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()


def parse_blob_info(*args, **kwargs):
    raise exceptions.NoLongerImplementedError()


class PermissionDeniedError(object):
    def __init__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()
