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

"""Utility for memory caching."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import python_utils
from core.domain import collection_domain
from core.domain import exp_domain
from core.domain import skill_domain
from core.domain import story_domain
from core.domain import topic_domain

def get_correct_dict_type_of_key(key):
    """In the memory cache, values are stored as (key, value) pairs where values
    can be dictionary representations of Oppia objects, e.g Collection,
    Exploration, etc. These dictionary types can be identified by the key that
    the memory cache uses to store the dictionaries. This function returns the
    correct type of the saved memory cache value using the key.

    Args:
        key: str. The key string used in the memory cache.

    Returns:
        class|None. Returns the original class of the object that got converted
        to a dictionary or if this key does not correspond to a class that
        requires deserialization, None.
    """
    if key.startswith('collection'):
        return collection_domain.Collection
    elif key.startswith('exploration'):
        return exp_domain.Exploration
    elif key.startswith('skill'):
        return skill_domain.Skill
    elif key.startswith('story'):
        return story_domain.Story
    elif key.startswith('topic'):
        return topic_domain.topic
    else:
        return None

def convert_object_to_json_str(object):
    """Converts an oppia object to a json string representation of that object.

    Args:
        object: *. An object that has a to_dict method which means that it can
            be represented by a dictionary with json-serializable (key, value)
            pairs.

    Raises:
        Exception: The object does not have a to_dict method implemented.
        Exception: The object dictionary cannot be encoded to a JSON string.

    Returns:
        str. Returns the json encoded string version of the object.
    """
    if not hasattr(value, 'to_dict'):
        raise Exception(
            ('Object of type %s does not have a to_dict() method ' +
             'implemented. This method is required to allow' +
             ' caching.') % python_utils.convert_to_bytes(type(object)))
    try:
        result = json.dumps(value.to_dict())
    except TypeError:
        raise Exception(
            ('Object of type %s cannot be serialized. Please ' +
            'consult this table for more information on what types are ' +
            'serializable: https://docs.python.org/3/library/json.html#py-to' +
            '-json-table.') % python_utils.convert_to_bytes(type(object)))

    return result

def get_object_from_json_string(object_class, json_string):
    """Converts a json string back into the object it was serialized from.

    Args:
        object_class: class. The class corresponding to this json_string.
        json_string: str. A json encoded string that can be decoded to a
            dictionary.

    Raises:
        Exception: When json.loads fails to decode the json string.
        Exception: The object type corresponding to the key does not have a
            from_dict() method implemented.

    Returns:
        *. Object to which this string corresponds to.
    """
    if not hasattr(object_class, 'from_dict'):
        raise Exception(
            ('Type %s associated with key %s does not have a from_dict() ' +
             'method implemented. This method is required to decode ' +
             'object.') % (str_type, key))

    try:
        decoded_object_dict = json.loads(value)
    except ValueError:
        raise Exception(
            'Json decoding failed for object associated with key %s' % key)
    return object_class.from_dict(decoded_object_dict)

def get_object_dict_from_cache_tuple(cache_tuple):
    """Returns the object dictionary corresponding to the serialized cache tuple


    Args:
        cache_tuple:tuple(list(str), list(str|None)). A tuple consisting of
            a list of keys and a list of corresponding values returned from the
            cache.

    Returns:
        dict(*). Object dictionary where (key, value) pairs from the cache_tuple
        are either inserted into the dictionary as (key,value) or (key, object)
        if the value is a json encoded string and the object is the decoded
        object of that string.
    """

    for key, value in zip(cache_tuple[0], cache_tuple[1]):
        if value:
            correct_type_of_dict = get_correct_dict_type_of_key(key)
            if correct_type_of_dict:
                decoded_object = get_object_from_json_string(value)
                cache_dict[key] = decoded_object

    return cache_dict



