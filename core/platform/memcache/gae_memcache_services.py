# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Provides memcache services."""

from core import counters
from google.appengine.api import memcache


def get_multi(keys):
    """Looks up a list of keys in memcache.

    Args:
      - keys: a list of keys (strings) to look up.

    Returns:
      A dict of key-value pairs for the keys/values that were present in
      memcache.
    """
    assert isinstance(keys, list)
    result = memcache.get_multi(keys)

    if result is not None:
        counters.MEMCACHE_HIT.inc()
    else:
        counters.MEMCACHE_MISS.inc()

    return result


def set_multi(key_value_mapping):
    """Sets multiple keys' values at once.

    Args:
      - key_value_mapping: a dict of {key: value} pairs. The key is a string
          and the value is anything that is serializable using the Python
          pickle module. The combined size of each key and value must be
          < 1 MB. The total size of key_value_mapping should be at most 32 MB.

    Returns:
      A list of the keys whose values were NOT set.
    """
    assert isinstance(key_value_mapping, dict)
    unset_keys = memcache.set_multi(key_value_mapping)

    if unset_keys:
        counters.MEMCACHE_SET_FAILURE.inc()
    else:
        counters.MEMCACHE_SET_SUCCESS.inc()

    return unset_keys


def delete(key):
    """Deletes a key in memcache.

    Args:
      - key: a key (string) to delete.

    Returns:
      0 on network failure, 1 if the item does not exist, and 2 for a
      successful delete.
    """
    assert isinstance(key, basestring)
    return_code = memcache.delete(key)

    if return_code == 0:
        counters.MEMCACHE_DELETE_FAILURE.inc()
    elif return_code == 1:
        counters.MEMCACHE_DELETE_MISSING.inc()
    else:
        counters.MEMCACHE_DELETE_SUCCESS.inc()

    return return_code


def delete_multi(keys):
    """Deletes multiple keys in memcache.

    Args:
      - keys: the keys (strings) to delete.

    Returns:
      True if all operations complete successfully; False otherwise.
    """
    for key in keys:
        assert isinstance(key, basestring)
    return_value = memcache.delete_multi(keys)

    if return_value is True:
        counters.MEMCACHE_DELETE_SUCCESS.inc()
    else:
        counters.MEMCACHE_DELETE_FAILURE.inc()

    return return_value
