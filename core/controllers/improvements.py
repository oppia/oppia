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

"""Controllers related to Oppia improvement tasks."""

from __future__ import annotations

import datetime

from core import feature_flag_list
from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator
from core.domain import exp_fetchers
from core.domain import feature_flag_services
from core.domain import improvements_domain
from core.domain import improvements_services
from core.domain import platform_parameter_list
from core.domain import platform_parameter_services
from core.domain import user_services

from typing import Dict, List, Optional, TypedDict


def get_task_dict_with_username_and_profile_picture(
    task_entry: improvements_domain.TaskEntry
) -> improvements_domain.TaskEntryDict:
    """Returns a task entry dict with the username and profile picture
    URL inserted.

    Args:
        task_entry: improvements_domain.TaskEntry. The TaskEntry domain object
            whose dict is to be returned.

    Returns:
        TaskEntryDict. TaskEntry dict with username and profile picture
        URL of the task resolver inserted.
    """

    task_entry_dict = task_entry.to_dict()
    if task_entry.resolver_id:
        resolver_settings = user_services.get_user_settings(
            task_entry.resolver_id, strict=True)
        task_entry_dict['resolver_username'] = (
            resolver_settings.username)
    return task_entry_dict


class ExplorationImprovementsHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ExplorationImprovementsHandler's
    normalized_Payload dictionary.
    """

    task_entries: List[improvements_domain.TaskEntryDict]


class ExplorationImprovementsHandler(
    base.BaseHandler[
        ExplorationImprovementsHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Handles operations related to managing exploration improvement tasks.

    NOTE: Only exploration creators and editors can interface with tasks.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'task_entries': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'validation_method': (
                            domain_objects_validator.validate_task_entries
                        )
                    }
                }
            }
        }
    }

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id: str) -> None:
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(
                exp_fetchers.get_exploration_by_id(exploration_id)))
        self.render_json({
            'open_tasks': [
                get_task_dict_with_username_and_profile_picture(
                    task
                ) for task in open_tasks
            ],
            'resolved_task_types_by_state_name': (
                resolved_task_types_by_state_name),
        })

    @acl_decorators.can_edit_exploration
    def post(self, exploration_id: str) -> None:
        assert self.normalized_payload is not None
        task_entries = self.normalized_payload['task_entries']
        task_entries_to_put = []
        for task_entry in task_entries:
            entity_version = task_entry['entity_version']
            task_type = task_entry['task_type']
            target_id = task_entry['target_id']
            status = task_entry['status']
            # The issue_description is allowed to be None.
            issue_description = task_entry.get('issue_description', None)
            task_entries_to_put.append(
                improvements_domain.TaskEntry(
                    constants.TASK_ENTITY_TYPE_EXPLORATION,
                    exploration_id,
                    entity_version,
                    task_type,
                    constants.TASK_TARGET_TYPE_STATE,
                    target_id,
                    issue_description,
                    status,
                    self.user_id,
                    datetime.datetime.utcnow()))
        improvements_services.put_tasks(task_entries_to_put)
        self.render_json({})


class ExplorationImprovementsHistoryHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ExplorationImprovementsHistoryHandler's
    normalized_Request dictionary.
    """

    cursor: Optional[str]


class ExplorationImprovementsHistoryHandler(
    base.BaseHandler[
        Dict[str, str],
        ExplorationImprovementsHistoryHandlerNormalizedRequestDict
    ]
):
    """Handles fetching the history of resolved exploration tasks.

    NOTE: Only exploration creators and editors can interface with tasks.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'cursor': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id: str) -> None:
        assert self.normalized_request is not None
        urlsafe_start_cursor = self.normalized_request.get('cursor')

        results, new_urlsafe_start_cursor, more = (
            improvements_services.fetch_exploration_task_history_page(
                exp_fetchers.get_exploration_by_id(exploration_id),
                urlsafe_start_cursor=urlsafe_start_cursor))

        self.render_json({
            'results': [
                get_task_dict_with_username_and_profile_picture(
                    task
                ) for task in results
            ],
            'cursor': new_urlsafe_start_cursor,
            'more': more,
        })


class ExplorationImprovementsConfigHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handles fetching the configuration of exploration tasks."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id: str) -> None:
        self.render_json({
            'exploration_id': exploration_id,
            'exploration_version': (
                exp_fetchers.get_exploration_by_id(exploration_id).version),
            'is_improvements_tab_enabled': (
                feature_flag_services.is_feature_flag_enabled(
                    feature_flag_list.FeatureNames.
                    IS_IMPROVEMENTS_TAB_ENABLED.value,
                    self.user_id)),
            'high_bounce_rate_task_state_bounce_rate_creation_threshold': (
                platform_parameter_services.get_platform_parameter_value(
                    platform_parameter_list.ParamName.
                    HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD.
                    value
                )),
            'high_bounce_rate_task_state_bounce_rate_obsoletion_threshold': (
                platform_parameter_services.get_platform_parameter_value(
                    platform_parameter_list.ParamName.
                    HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD
                    .value
                )),
            'high_bounce_rate_task_minimum_exploration_starts': (
                platform_parameter_services.get_platform_parameter_value(
                    platform_parameter_list.ParamName.
                    HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS.value
                )),
        })
