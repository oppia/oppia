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
DESERIALIZATION_FUNCTIONS = {
    'collection': collection_domain.Collection.deserialize,
    'exploration': exp_domain.Exploration.deserialize,
    'skill': skill_domain.Skill.deserialize,
    'story': story_domain.Story.deserialize,
    'topic': topic_domain.Topic.deserialize,
    'default': lambda x: x
}


def flush_memory_cache():
    """Flushes the memory cache by wiping all of the data."""
    memory_cache_services.flush_cache()


def _get_deserialization_function_for_namespace(namespace):
    """Get the deserialization function associated with the namespace specified.

    Args:
        namespace: str. The namespace that differentiates the objects.

    Returns:
        Method. The deserialization function associated with that particular
        namespace.
    """
    if namespace not in DESERIALIZATION_FUNCTIONS:
        return DESERIALIZATION_FUNCTIONS['default']
    else:
        return DESERIALIZATION_FUNCTIONS[namespace]


def _get_serialized_string_for_namespace(obj, namespace):
    """Get the serialized string of the object associated with the namespace
    specified.

    Args:
        obj: Exploration|Skill|Story|Topic|Collection|str. The object to be
            set to the memory cache.
        namespace: str. The namespace that differentiates the objects.

    Returns:
        str. The serialized string of the object associated with that namespace.
    """
    if namespace == 'collection' or namespace == 'exploration' or (
            namespace == 'skill') or namespace == 'story' or (
                namespace == 'topic'):
        return obj.serialize()
    else:
        return obj


def get_multi(keys, namespace, sub_namespace=''):
    """Get a dictionary of the {key, value} pairs from the memory cache.

    Args:
        keys: list(str). List of keys to query the caching service for.
        namespace: str. The namespace under which the values associated with
            these keys lie. The namespace determines how the keys are decoded
            from their JSON encoded string. Use 'default' as namespace for keys
            that don't require serialization.
        sub_namespace: str. Sub namespace further differentiates the
            values. For Explorations, Skills, Stories, Topics, Collections, the
            sub_namespace is the version number of the objects.

    Returns:
        dict(str, Exploration|Skill|Story|Topic|Collection|str). Dictionary of
        decoded (key, value) pairs retrieved from the platform caching service.
    """
    result_dict = {}
    if len(keys) == 0:
        return result_dict
    memory_cache_keys = []
    for key in keys:
        memory_cache_keys.append(
            _get_memory_cache_key_from_type(key, namespace, sub_namespace))
    values = memory_cache_services.get_multi(memory_cache_keys)
    for key, value in python_utils.ZIP(keys, values):
        if value:
            deserialization_function = (
                _get_deserialization_function_for_namespace(namespace))
            result_dict[key] = deserialization_function(value)

    return result_dict


def _get_memory_cache_key_from_type(key, namespace, sub_namespace):
    """Returns a memcache key for the class under namespace and sub_namespace.

    Args:
        key: str. The key of the value to store in the memory cache.
        namespace: str. The namespace under which the values associated with the
            key lies. Use 'default' as namespace for keys that don't require
            serialization.
        sub_namespace: str. Sub namespace further differentiates the
            values. For Explorations, Skills, Stories, Topics, Collections, the
            sub_namespace is the version number of the objects.

    Returns:
        str. New key to differentiate a passed in key based on namespace and
        sub-namespace.
    """
    if not sub_namespace:
        return namespace + '-' + key
    else:
        return namespace + '-' + sub_namespace + '-' + key


def set_multi(key_value_mapping, namespace, sub_namespace=''):
    """Set multiple keys' values at once to the cache where the values are all
    of a specific type or a primitype type.

    Args:
        key_value_mapping: list(str, *). A dict of {key, value} pairs to set to
            the cache. The values must be of type value_type.
        namespace: str. The namespace under which the values associated with the
            key lies. Use 'default' as namespace for keys that don't require
            serialization.
        sub_namespace: str. Sub namespace further differentiates the
            values. For Explorations, Skills, Stories, Topics, Collections, the
            sub_namespace is the version number of the objects.

    Returns:
        bool. Whether all operations complete successfully.
    """
    if len(key_value_mapping) == 0:
        return True

    memory_cache_key_value_mapping = {}
    for key, value in key_value_mapping.items():
        unique_key = _get_memory_cache_key_from_type(
            key, namespace, sub_namespace)
        memory_cache_key_value_mapping[unique_key] = (
            _get_serialized_string_for_namespace(value, namespace))
    return memory_cache_services.set_multi(memory_cache_key_value_mapping)


def delete_multi(keys, namespace, sub_namespace=''):
    """Deletes multiple keys in the cache.

    Args:
        keys: list(str). A list of key strings to delete from the cache.
        namespace: str. The namespace under which the values associated with the
            key lies. Use default namespace for keys that don't fall under any
            other namespaces.
        sub_namespace: str. Sub namespace further differentiates the
            values. For Explorations, Skills, Stories, Topics, Collections, the
            sub_namespace is the version number of the objects.

    Returns:
        bool. Whether all operations complete successfully.
    """
    if len(keys) == 0:
        return True
    memory_cache_keys = []
    for key in keys:
        memory_cache_keys.append(
            _get_memory_cache_key_from_type(key, namespace, sub_namespace))
    return memory_cache_services.delete_multi(memory_cache_keys) == len(keys)
