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

from __future__ import absolute_import
from __future__ import unicode_literals

from constants import constants
from core.controllers import base
from core.domain import blog_domain
from core.domain import collection_domain
from core.domain import config_domain
from core.domain import exp_domain
import python_utils

from typing import Any, Dict # isort:skip  pylint: disable=wrong-import-order, wrong-import-position, unused-import, import-only-modules


def validate_exploration_change(change_dict):
    # type: (Dict[String, Any]) -> None
    """Validates exploration change.

    Args:
        change_dict: dict. Data that needs to be validated.

    Returns:
        ExplorationChange. Returns ExplorationChange object after validation.
    """
    # No explicit call to validate_dict method is necessary, because
    # ExplorationChange calls validate method while initialization.
    return exp_domain.ExplorationChange(change_dict)


def validate_new_config_property_values_dict(new_config_property_values_dict):
    # type: (Dict[String, Any]) -> None
    """Validates the new config property values dict.

    Args:
        new_config_property_values_dict: dict. Data that needs to be validated.

    Returns:
        dict(str, any). Returns new_config_property_values_dict
        after validation.
    """
    # The method returns a dict containing config properties and its values.
    # These items are used individually to set config properties.
    # Hence they need not be converted into domain objects.
    for (name, value) in new_config_property_values_dict.items():
        if not isinstance(name, python_utils.BASESTRING):
            raise Exception(
                'config property name should be a string, received'
                ': %s' % name)
        config_property = config_domain.Registry.get_config_property(name)
        if config_property is None:
            raise Exception('%s do not have any schema.' % name)

        config_property.normalize(value)

    return new_config_property_values_dict


def validate_change_dict_for_blog_post(change_dict):
    # type: (Dict[Any, Any]) -> None
    """Validates change_dict required for updating values of blog post.

    Args:
        change_dict: dict. Data that needs to be validated.

    Returns:
        dict(str, any). Returns change_dict after validation.
    """
    # The method returns a dict containing blog post properties, they are used
    # to update blog posts in the domain layer. This dicts does not correspond
    # to any domain class so we are validating the fields of change_dict
    # as a part of schema validation.
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

    return change_dict


def validate_collection_change(change_dict):
    # type: (Dict[String, Any]) -> None
    """Validates collection change.

    Args:
        change_dict: dict. Data that needs to be validated.

    Returns:
        CollectionChange. Returns CollectionChange object after validation.
    """
    # No explicit call to validate_dict method is necessary, because
    # CollectionChange calls validate method while initialization.
    return collection_domain.CollectionChange(change_dict)


def validate_email_dashboard_data(email_dashboard_data_dict):
    # type: (Dict[String, Optional[Union[bool, int]]]) -> None
    """Validates the email dashboard data dict.

    Args:
        email_dashboard_data_dict: dict. Data that needs to be validated.

    Returns:
        dict(str, any). Returns email dashboard data dict after validation.
    """
    # The method returns a dict containing fields of email_dashboard query
    # params. This dict represents a domain class namedtuple. Hence the fields
    # are validating as a part of schema validation before saving new
    # user queries in the handler.
    predicates = constants.EMAIL_DASHBOARD_PREDICATE_DEFINITION
    possible_keys = [predicate['backend_attr'] for predicate in predicates]

    for key, value in email_dashboard_data_dict.items():
        if value is None:
            continue
        if key not in possible_keys:
            # Raise exception if key is not one of the allowed keys.
            raise Exception('400 Invalid input for query.')

    return email_dashboard_data_dict


def validate_task_entry_dict(task_entry_dict):
    # type: (Dict[String, Any]) -> None
    """Validates the task entry dict.

    Args:
        task_entry_dict: dict. Data that needs to be validated.

    Returns:
        dict(str, any). Returns task_entry_dict after validation.
    """
    # The method returns a dict which contains several fields for task entries.
    # Creation of TaskEntry objects require some additional data like
    # entity_id, user_id, etc. which are provided by handlers.
    # Thus here we are only validating data coming from task_entry_dict.
    entity_version = task_entry_dict.get('entity_version', None)
    if entity_version is None:
        raise base.BaseHandler.InvalidInputException(
            'No entity_version provided')
    task_type = task_entry_dict.get('task_type', None)
    if task_type is None:
        raise base.BaseHandler.InvalidInputException('No task_type provided')
    target_id = task_entry_dict.get('target_id', None)
    if target_id is None:
        raise base.BaseHandler.InvalidInputException('No target_id provided')
    status = task_entry_dict.get('status', None)
    if status is None:
        raise base.BaseHandler.InvalidInputException('No status provided')

    return task_entry_dict
