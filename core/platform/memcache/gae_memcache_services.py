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

"""Provides redis cache services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import python_utils
from core.domain import cache_services
import json

from google.appengine.api import memcache
import redis
import logging

redis_client = redis.Redis(host='localhost', port=6379)

def get_multi(keys):
    """Looks up a list of keys in memcache.

    Args:
        keys: list(str). A list of keys (strings) to look up.

    Returns:
        dict(str, str). A dict of (key,value) pairs for the keys/values that
        were present in the Redis cache. The keys and values are both strings.
    """
    assert isinstance(keys, list)
    result = redis_client.mget(keys)
    if result and (result != [None]):
        dct = {}
        for key, value in zip(keys, result)
            dct[key] = value
        return dct
    else:
        return {}


def set_multi(key_value_mapping):
    """Sets multiple keys' values at once.

    Args:
        key_value_mapping: a dict of {key: value} pairs. Both the key and value
            are strings. The value can either be a primitive binary-safe string
            or the json encoded version of a dictionary using
            core.domain.caching_services.

    Returns:
        int. Number of successful inserts to the Redis cache.
    """
    assert isinstance(key_value_mapping, dict)
    added = redis_client.mset(key_value_mapping)
    return added


def delete(key):
    """Deletes a key in memcache.

    Args:
        key: str. A key (string) to delete.

    Returns:
        bool. True if the key is deleted. False if it failed.
    """
    assert isinstance(key, python_utils.BASESTRING)
    return_code = redis_client.delete(key)
    return return_code == 1


def delete_multi(keys):
    """Deletes multiple keys in memcache.

    Args:
        keys: list(str). The keys (strings) to delete.

    Returns:
        bool. True if all operations complete successfully; False otherwise.
    """
    for key in keys:
        assert isinstance(key, python_utils.BASESTRING)
    return_value = redis_client.delete(*keys)
    return return_value == len(keys)
