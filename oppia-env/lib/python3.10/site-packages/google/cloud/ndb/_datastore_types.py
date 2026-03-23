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

"""Ported implementations from the Google App Engine SDK.

These are from the ``google.appengine.api.datastore_types`` module.
The following members have been brought in:

* ``BlobKey``
"""

import functools

from google.cloud.ndb import exceptions


_MAX_STRING_LENGTH = 1500


@functools.total_ordering
class BlobKey(object):
    """Key used to identify a blob in the blobstore.

    .. note::

        The blobstore was an early Google App Engine feature that later became
        Google Cloud Storage.

    This class is a simple wrapper a :class:`bytes` object. The bytes represent
    a key used internally by the Blobstore API  to identify application blobs
    (i.e. Google Cloud Storage objects). The key corresponds to the entity name
    of the underlying object.

    Args:
        blob_key (Optional[bytes]): The key used for the blobstore.

    Raises:
        exceptions.BadValueError: If the ``blob_key`` exceeds 1500 bytes.
        exceptions.BadValueError: If the ``blob_key`` is not :data:`None` or a
            :class:`bytes` instance.
    """

    def __init__(self, blob_key):
        if isinstance(blob_key, bytes):
            if len(blob_key) > _MAX_STRING_LENGTH:
                raise exceptions.BadValueError(
                    "blob key must be under {:d} " "bytes.".format(_MAX_STRING_LENGTH)
                )
        elif blob_key is not None:
            raise exceptions.BadValueError(
                "blob key should be bytes; received "
                "{} (a {})".format(blob_key, type(blob_key).__name__)
            )

        self._blob_key = blob_key

    def __eq__(self, other):
        if isinstance(other, BlobKey):
            return self._blob_key == other._blob_key
        elif isinstance(other, bytes):
            return self._blob_key == other
        else:
            return NotImplemented

    def __lt__(self, other):
        if isinstance(other, BlobKey):
            # Python 2.7 does not raise an error when other is None.
            if other._blob_key is None:
                raise TypeError
            return self._blob_key < other._blob_key
        elif isinstance(other, bytes):
            return self._blob_key < other
        else:
            raise TypeError

    def __hash__(self):
        return hash(self._blob_key)
