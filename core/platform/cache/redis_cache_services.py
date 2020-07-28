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
import json

from google.appengine.api import memcache
import redis
import logging

redis_client = redis.Redis(host='localhost', port=6379)

def flush_cache():
    redis_client.flushdb()

def get_multi(keys):
    """Looks up a list of keys in memcache.

    Args:
        keys: list(str). A list of keys (strings) to look up.

    Returns:
        list(str). A list of values in the cache corresponding to the keys that
        are passed in.
    """
    assert isinstance(keys, list)
    return redis_client.mget(keys)


def set_multi(key_value_mapping):
    """Sets multiple keys' values at once.

    Args:
        key_value_mapping: a dict of {key: value} pairs. Both the key and value
            are strings. The value can either be a primitive binary-safe string
            or the json encoded version of a dictionary using
            core.domain.caching_services.

    Returns:
        bool. Whether or not the set action succeeded.
    """
    assert isinstance(key_value_mapping, dict)
    return redis_client.mset(key_value_mapping)


def delete(key):
    """Deletes a key in memcache.

    Args:
        key: str. A key (string) to delete.

    Returns:
        int. Number of successfully deleted keys.
    """
    assert isinstance(key, python_utils.BASESTRING)
    return_code = redis_client.delete(key)
    return return_code


def delete_multi(keys):
    """Deletes multiple keys in memcache.

    Args:
        keys: list(str). The keys (strings) to delete.

    Returns:
        int. Number of successfully deleted keys.
    """
    for key in keys:
        assert isinstance(key, python_utils.BASESTRING)
    return_value = redis_client.delete(*keys)
    return return_value
