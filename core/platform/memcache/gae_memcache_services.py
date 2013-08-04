# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'


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
	return memcache.get_multi(keys)


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
	return memcache.set_multi(key_value_mapping)


def delete(key):
	"""Deletes a key in memcache.

	Args:
	  - key: a key (string) to delete.

    Returns:
      0 on network failure, 1 if the item does not exist, and 2 for a
      successful delete.
	"""
	assert isinstance(key, basestring)
	return memcache.delete(key)
