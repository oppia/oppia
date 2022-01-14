# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

from __future__ import annotations

import json

from core.domain import caching_domain
from core.domain import collection_domain
from core.domain import exp_domain
from core.domain import platform_parameter_domain
from core.domain import skill_domain
from core.domain import story_domain
from core.domain import topic_domain
from core.platform import models

from typing import Any, Callable, Dict, List, cast, overload
from typing_extensions import Final, Literal, TypedDict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import memory_cache_services

memory_cache_services = models.Registry.import_cache_services()

# NOTE: Namespaces and sub-namespaces cannot contain ':' because this is used as
# an internal delimiter for cache keys that separates the namespace, the
# sub-namespace, and the id in the cache keys.
MEMCACHE_KEY_DELIMITER = ':'

# This namespace supports sub-namespaces which are identified by the stringified
# version number of the explorations within the sub-namespace. The value for
# each key in this namespace should be a serialized representation of an
# Exploration. There is also a special sub-namespace represented by the empty
# string; this sub-namespace stores the latest version of the exploration.
CACHE_NAMESPACE_EXPLORATION: Final = 'exploration'
# This namespace supports sub-namespaces which are identified by the stringified
# version number of the collections within the sub-namespace. The value for
# each key in this namespace should be a serialized representation of a
# Collection. There is also a special sub-namespace represented by the empty
# string; this sub-namespace stores the latest version of the collection.
CACHE_NAMESPACE_COLLECTION: Final = 'collection'
# This namespace supports sub-namespaces which are identified by the stringified
# version number of the skills within the sub-namespace. The value for
# each key in this namespace should be a serialized representation of a
# Skill. There is also a special sub-namespace represented by the empty
# string; this sub-namespace stores the latest version of the skill.
CACHE_NAMESPACE_SKILL: Final = 'skill'
# This namespace supports sub-namespaces which are identified by the stringified
# version number of the stories within the sub-namespace. The value for
# each key in this namespace should be a serialized representation of a
# Story. There is also a special sub-namespace represented by the empty
# string; this sub-namespace stores the latest version of the story.
CACHE_NAMESPACE_STORY: Final = 'story'
# This namespace supports sub-namespaces which are identified by the stringified
# version number of the topics within the sub-namespace. The value for
# each key in this namespace should be a serialized representation of a
# Topic. There is also a special sub-namespace represented by the empty
# string; this sub-namespace stores the latest version of the topic.
CACHE_NAMESPACE_TOPIC: Final = 'topic'
# This namespace supports sub-namespaces which are identified by the stringified
# version number of the topics within the sub-namespace. The value for
# each key in this namespace should be a serialized representation of a
# Platform Parameter. This namespace does not support sub-namespaces.
CACHE_NAMESPACE_PLATFORM_PARAMETER: Final = 'platform'
# The value for each key in this namespace should be a serialized representation
# of a ConfigPropertyModel value (the 'value' attribute of a ConfigPropertyModel
# object). This namespace does not support sub-namespaces.
CACHE_NAMESPACE_CONFIG: Final = 'config'
# The sub-namespace is not necessary for the default namespace. The namespace
# handles default datatypes allowed by Redis including Strings, Lists, Sets,
# and Hashes. More details can be found at: https://redis.io/topics/data-types.
CACHE_NAMESPACE_DEFAULT: Final = 'default'


class DeserializationFunctionsDict(TypedDict):
    """Type for the DESERIALIZATION_FUNCTIONS."""

    collection: Callable[[str], collection_domain.Collection]
    exploration: Callable[[str], exp_domain.Exploration]
    skill: Callable[[str], skill_domain.Skill]
    story: Callable[[str], story_domain.Story]
    topic: Callable[[str], topic_domain.Topic]
    platform: Callable[[str], platform_parameter_domain.PlatformParameter]
    config: Callable[[str], dict[str, Any]]
    default: Callable[[str], dict[str, Any]]


class SerializationFunctionsDict(TypedDict):
    """Type for the SERIALIZATION_FUNCTIONS."""

    collection: Callable[[collection_domain.Collection], str]
    exploration: Callable[[exp_domain.Exploration], str]
    skill: Callable[[skill_domain.Skill], str]
    story: Callable[[story_domain.Story], str]
    topic: Callable[[topic_domain.Topic], str]
    platform: Callable[[platform_parameter_domain.PlatformParameter], str]
    config: Callable[[dict[str, Any]], str]
    default: Callable[[dict[str, Any]], str]


# Type defined for arguments which can accpet only keys of Dict
# DESERIALIZATION_FUNCTIONS or SERIALIZATION_FUNCTIONS.
namespace_type = Literal[
        'collection', 'exploration', 'skill', 'story', 'topic', 'platform',
        'config', 'default'
        ]


DESERIALIZATION_FUNCTIONS: DeserializationFunctionsDict = {
    CACHE_NAMESPACE_COLLECTION: collection_domain.Collection.deserialize,
    CACHE_NAMESPACE_EXPLORATION: exp_domain.Exploration.deserialize,
    CACHE_NAMESPACE_SKILL: skill_domain.Skill.deserialize,
    CACHE_NAMESPACE_STORY: story_domain.Story.deserialize,
    CACHE_NAMESPACE_TOPIC: topic_domain.Topic.deserialize,
    CACHE_NAMESPACE_PLATFORM_PARAMETER: (
        platform_parameter_domain.PlatformParameter.deserialize),
    CACHE_NAMESPACE_CONFIG: json.loads,
    CACHE_NAMESPACE_DEFAULT: json.loads
}


# Since we mapped this Dict with `SerializationFunctionsDict`. So, here
# every 'x' in value belongs to some object, like CACHE_NAMESPACE_COLLECTION's
# x is a collection object. When we call serialize method on it, Mypy expects
# it to be a typed call. So, to remove un-typed-call error ignore statement
# is placed temporarily. Untill all classes are typed.
SERIALIZATION_FUNCTIONS: SerializationFunctionsDict = {
    CACHE_NAMESPACE_COLLECTION: lambda x: cast(str, x.serialize()), # type: ignore[no-untyped-call]
    CACHE_NAMESPACE_EXPLORATION: lambda x: cast(str, x.serialize()), # type: ignore[no-untyped-call]
    CACHE_NAMESPACE_SKILL: lambda x: cast(str, x.serialize()), # type: ignore[no-untyped-call]
    CACHE_NAMESPACE_STORY: lambda x: cast(str, x.serialize()), # type: ignore[no-untyped-call]
    CACHE_NAMESPACE_TOPIC: lambda x: cast(str, x.serialize()), # type: ignore[no-untyped-call]
    CACHE_NAMESPACE_PLATFORM_PARAMETER: lambda x: cast(str, x.serialize()), # type: ignore[no-untyped-call]
    CACHE_NAMESPACE_CONFIG: json.dumps,
    CACHE_NAMESPACE_DEFAULT: json.dumps
}


def _get_memcache_key(
    namespace: namespace_type,
    sub_namespace: str | None, obj_id: str
) -> str:
    """Returns a memcache key for the class under the corresponding
    namespace and sub_namespace.

    Args:
        namespace: str. The namespace under which the values associated with the
            id lie. Use CACHE_NAMESPACE_DEFAULT as the namespace for ids that
            are not associated with a conceptual domain-layer entity and
            therefore don't require serialization.
        sub_namespace: str|None. The sub-namespace further differentiates the
            values. For Explorations, Skills, Stories, Topics, and Collections,
            the sub-namespace is the stringified version number of the objects.
        obj_id: str. The id of the value to store in the memory cache.

    Raises:
        Exception. The sub-namespace contains a ':'.

    Returns:
        str. The generated key for use in the memory cache in order to
        differentiate a passed-in key based on namespace and sub-namespace.
    """
    sub_namespace_key_string = (sub_namespace or '')
    if MEMCACHE_KEY_DELIMITER in sub_namespace_key_string:
        raise ValueError(
            'Sub-namespace %s cannot contain \':\'.' % sub_namespace_key_string)
    return '%s%s%s%s%s' % (
        namespace, MEMCACHE_KEY_DELIMITER,
        sub_namespace_key_string, MEMCACHE_KEY_DELIMITER, obj_id)


def flush_memory_caches() -> None:
    """Flushes the memory caches by wiping all of the data."""
    memory_cache_services.flush_caches()


@overload
def get_multi(
    namespace: Literal['collection'],
    sub_namespace: str | None, obj_ids: List[str]
) -> Dict[str, collection_domain.Collection]: ...


@overload
def get_multi(
    namespace: Literal['exploration'],
    sub_namespace: str | None, obj_ids: List[str]
) -> Dict[str, exp_domain.Exploration]: ...


@overload
def get_multi(
    namespace: Literal['skill'],
    sub_namespace: str | None, obj_ids: List[str]
) -> Dict[str, skill_domain.Skill]: ...


@overload
def get_multi(
    namespace: Literal['story'],
    sub_namespace: str | None, obj_ids: List[str]
) -> Dict[str, story_domain.Story]: ...


@overload
def get_multi(
    namespace: Literal['topic'],
    sub_namespace: str | None, obj_ids: List[str]
) -> Dict[str, topic_domain.Topic]: ...


@overload
def get_multi(
    namespace: Literal['platform'],
    sub_namespace: str | None, obj_ids: List[str]
) -> Dict[str, platform_parameter_domain.PlatformParameter]: ...


@overload
def get_multi(
    namespace: Literal['config'],
    sub_namespace: str | None, obj_ids: List[str]
) -> Dict[str, Dict[str, Any]]: ...


@overload
def get_multi(
    namespace: Literal['default'],
    sub_namespace: str | None, obj_ids: List[str]
) -> Dict[str, Dict[str, Any]]: ...


def get_multi(
    namespace: namespace_type,
    sub_namespace: str | None, obj_ids: List[str]
) -> Dict[str, Any]:
    """Get a dictionary of the {id, value} pairs from the memory cache.

    Args:
        namespace: str. The namespace under which the values associated with
            these object ids lie. The namespace determines how the objects are
            decoded from their JSON-encoded string. Use CACHE_NAMESPACE_DEFAULT
            as the namespace for objects that are not associated with a
            conceptual domain-layer entity and therefore don't require
            serialization.
        sub_namespace: str|None. The sub-namespace further differentiates the
            values. For Explorations, Skills, Stories, Topics, and Collections,
            the sub-namespace is either None or the stringified version number
            of the objects. If the sub-namespace is not required, pass in None.
        obj_ids: list(str). List of object ids corresponding to values to
            retrieve from the cache.

    Raises:
        ValueError. The namespace does not exist or is not recognized.

    Returns:
        dict(str, Exploration|Skill|Story|Topic|Collection|str). Dictionary of
        decoded (id, value) pairs retrieved from the platform caching service.
    """

    # In result_dict's key-value pair, value can be any of the type from
    # Exploration, Skill, Story, Topic, Collection, str. hence Any type has
    # to be used here for the value type of result_dict dictionary.
    result_dict: Dict[str, Any] = {}
    if len(obj_ids) == 0:
        return result_dict

    if namespace not in DESERIALIZATION_FUNCTIONS:
        raise ValueError('Invalid namespace: %s.' % namespace)

    memcache_keys = [
        _get_memcache_key(namespace, sub_namespace, obj_id)
        for obj_id in obj_ids]
    values = memory_cache_services.get_multi(memcache_keys)
    for obj_id, value in zip(obj_ids, values):
        if value:
            result_dict[obj_id] = DESERIALIZATION_FUNCTIONS[namespace](value)
    return result_dict


# id_value_mapping is a Dict whose values can be any of the type from
# Exploration, Skill, Story, Topic, Collection, str. hence Any type has
# to be used here for the value type of id_value_mapping dictionary.
def set_multi(
    namespace: namespace_type,
    sub_namespace: str | None, id_value_mapping: Dict[str, Any]
) -> bool:
    """Set multiple id values at once to the cache, where the values are all
    of a specific namespace type or a Redis compatible type (more details here:
    https://redis.io/topics/data-types).

    Args:
        namespace: str. The namespace under which the values associated with the
            id lie. Use CACHE_NAMESPACE_DEFAULT as the namespace for objects
            that are not associated with a conceptual domain-layer entity and
            therefore don't require serialization.
        sub_namespace: str|None. The sub-namespace further differentiates the
            values. For Explorations, Skills, Stories, Topics, and Collections,
            the sub-namespace is either None or the stringified version number
            of the objects. If the sub-namespace is not required, pass in None.
        id_value_mapping:
            dict(str, Exploration|Skill|Story|Topic|Collection|str). A dict of
            {id, value} pairs to set to the cache.

    Raises:
        ValueError. The namespace does not exist or is not recognized.

    Returns:
        bool. Whether all operations complete successfully.
    """
    if len(id_value_mapping) == 0:
        return True

    if namespace not in SERIALIZATION_FUNCTIONS:
        raise ValueError('Invalid namespace: %s.' % namespace)

    memory_cache_id_value_mapping = {
        _get_memcache_key(namespace, sub_namespace, obj_id):
        SERIALIZATION_FUNCTIONS[namespace](value)
        for obj_id, value in id_value_mapping.items()
    }
    return memory_cache_services.set_multi(memory_cache_id_value_mapping)


def delete_multi(
    namespace: namespace_type,
    sub_namespace: str | None, obj_ids: List[str]
) -> bool:
    """Deletes multiple ids in the cache.

    Args:
        namespace: str. The namespace under which the values associated with the
            id lie. Use CACHE_NAMESPACE_DEFAULT namespace for object ids that
            are not associated with a conceptual domain-layer entity and
            therefore don't require serialization.
        sub_namespace: str|None. The sub-namespace further differentiates the
            values. For Explorations, Skills, Stories, Topics, and Collections,
            the sub-namespace is either None or the stringified version number
            of the objects. If the sub-namespace is not required, pass in None.
        obj_ids: list(str). A list of id strings to delete from the cache.

    Raises:
        ValueError. The namespace does not exist or is not recognized.

    Returns:
        bool. Whether all operations complete successfully.
    """
    if len(obj_ids) == 0:
        return True

    if namespace not in DESERIALIZATION_FUNCTIONS:
        raise ValueError('Invalid namespace: %s.' % namespace)

    memcache_keys = [
        _get_memcache_key(namespace, sub_namespace, obj_id)
        for obj_id in obj_ids]
    return memory_cache_services.delete_multi(memcache_keys) == len(obj_ids)


def get_memory_cache_stats() -> caching_domain.MemoryCacheStats:
    """Get a memory profile of the cache in a dictionary dependent on how the
    caching service profiles its own cache.

    Returns:
        MemoryCacheStats. MemoryCacheStats object containing the total allocated
        memory in bytes, peak memory usage in bytes, and the total number of
        keys stored as values.
    """
    return memory_cache_services.get_memory_cache_stats()
