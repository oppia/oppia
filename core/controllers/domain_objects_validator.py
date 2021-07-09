# coding: utf-8

# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Methods for validating domain objects for schema validation of
handler arguments.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import blog_domain
from core.domain import config_domain
from core.domain import exp_domain
import python_utils

from typing import Any, Dict # isort:skip  pylint: disable=wrong-import-order, wrong-import-position, unused-import, import-only-modules


def validate_exploration_change(obj):
    # type: (Dict[String, Any]) -> None
    """Validates exploration change.

    Args:
        obj: dict. Data that needs to be validated.
    """
    # No explicit call to validate_dict method is necessary, because
    # ExplorationChange calls it while initialization.
    exp_domain.ExplorationChange(obj)


def validate_new_config_property_values(obj):
    # type: (Dict[String, Any]) -> None
    """Validates new config property values.

    Args:
        obj: dict. Data that needs to be validated.
    """
    for (name, value) in obj.items():
        if not isinstance(name, python_utils.BASESTRING):
            raise Exception(
                'config property name should be a string, received'
                ': %s' % name)
        config_property = config_domain.Registry.get_config_property(name)
        if config_property is None:
            raise Exception('%s do not have any schema.' % name)

        config_property.normalize(value)


def validate_change_dict_for_blog_post(change_dict):
    # type: (Dict[Any, Any]) -> None
    """Validates change_dict required for updating values of blog post.

    Args:
        change_dict: dict. Data that needs to be validated.
    """
    if 'title' in change_dict:
        blog_domain.BlogPost.require_valid_title(
            change_dict['title'], True)
    if 'thumbnail_filename' in change_dict:
        blog_domain.BlogPost.require_valid_thumbnail_filename(
            change_dict['thumbnail_filename'])
    if 'tags' in change_dict:
        blog_domain.BlogPost.require_valid_tags(
            change_dict['tags'], True)
        # Validates that the tags in the change dict are from the list of
        # default tags set by admin.
        list_of_default_tags = config_domain.Registry.get_config_property(
            'list_of_default_tags_for_blog_post').value
        if not all(tag in list_of_default_tags for tag in change_dict['tags']):
            raise Exception(
                'Invalid tags provided. Tags not in default tags list.')
