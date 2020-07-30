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

"""Service functions to set and retrieve data from the memory cache."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import collection_domain
from core.domain import exp_domain
from core.domain import skill_domain
from core.domain import story_domain
from core.domain import topic_domain
from core.platform import models
import python_utils

memory_cache_services = models.Registry.import_cache_services()


def flush_memory_cache():
    """Flushes the redis cache by wiping all of the data."""
    memory_cache_services.flush_cache()


def _get_correct_type_of_key(key):
    """In the memory cache, values are stored as (key, value) pairs where values
    can be string representations of Oppia objects, e.g Collection,
    Exploration, etc. These object types can be identified by the key that
    the memory cache uses to store the dictionaries. This function returns the
    correct type of the saved memory cache value using the key, so that the
    encoded string can be decoded into an object.

    Args:
        key: str. The key string used in the memory cache.

    Returns:
        Collection|Exploration|Skill|Story|Topic|None. Returns the original
        class of the object that got converted to a dictionary. If this key does
        not correspond to a class that requires deserialization, return None.
    """
    if key.startswith('collection'):
        return collection_domain.Collection
    elif key.startswith('exp'):
        return exp_domain.Exploration
    elif key.startswith('skill'):
        return skill_domain.Skill
    elif key.startswith('story'):
        return story_domain.Story
    elif key.startswith('topic'):
        return topic_domain.Topic
    else:
        return None


def get_multi(keys):
    """Get a dictionary of the {key, value} pairs from the memory cache.

    Args:
        keys: list(str). List of keys to query the caching service for.

    Returns:
        dict(str, Exploration|Skill|Story|Topic|Collection|str). Dictionary of
        decoded (key, value) pairs retrieved from the platform caching service.
    """
    result_dict = {}
    if len(keys) == 0:
        return result_dict
    values = memory_cache_services.get_multi(keys)
    for key, value in python_utils.ZIP(keys, values):
        if value:
            value_type = _get_correct_type_of_key(key)
            if value_type:
                decoded_object = value_type.deserialize(value)
                result_dict[key] = decoded_object
            else:
                result_dict[key] = value

    return result_dict


def set_multi(key_value_mapping):
    """Set multiple keys' values at once to the cache.

    Args:
        key_value_mapping: list(str, Exploration|Skill|Story|Topic|Collection|
            str). A dict of {key, value} pairs to set to the cache.

    Returns:
        bool. True if all of the keys are set. False otherwise.
    """
    if len(key_value_mapping) == 0:
        return True

    for key, value in key_value_mapping.items():
        if _get_correct_type_of_key(key):
            key_value_mapping[key] = value.serialize()
    return memory_cache_services.set_multi(key_value_mapping)


def delete_multi(keys):
    """Deletes a multiple keys in the cache.

    Args:
        keys: list(str). A list of key strings to delete from the cache.

    Returns:
        bool. True if all operations complete successfully. False otherwise.
    """
    if len(keys) == 0:
        return True

    return memory_cache_services.delete_multi(keys) == len(keys)
