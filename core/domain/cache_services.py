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
        type. Returns the original type of the object that got converted to a
        dictionary.
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
