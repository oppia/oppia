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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import config_domain
from core.domain import exp_fetchers
from core.domain import improvements_domain
from core.domain import improvements_services
from core.platform import models
import feconf

(improvements_models,) = (
    models.Registry.import_models([models.NAMES.improvements]))


class ExplorationImprovementsHandler(base.BaseHandler):
    """Handles operations related to managing exploration improvement tasks.

    NOTE: Only exploration creators and editors can interface with tasks.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id):
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(
                exp_fetchers.get_exploration_by_id(exploration_id)))
        self.render_json({
            'open_tasks': [t.to_dict() for t in open_tasks],
            'resolved_task_types_by_state_name': (
                resolved_task_types_by_state_name),
        })

    @acl_decorators.can_edit_exploration
    def post(self, exploration_id):
        task_entries = self.payload.get('task_entries', None)
        if task_entries is None:
            raise self.InvalidInputException('No task_entries provided')
        task_entries_to_put = []
        for task_entry in task_entries:
            entity_version = task_entry.get('entity_version', None)
            if entity_version is None:
                raise self.InvalidInputException('No entity_version provided')
            task_type = task_entry.get('task_type', None)
            if task_type is None:
                raise self.InvalidInputException('No task_type provided')
            target_id = task_entry.get('target_id', None)
            if target_id is None:
                raise self.InvalidInputException('No target_id provided')
            status = task_entry.get('status', None)
            if status is None:
                raise self.InvalidInputException('No status provided')
            # The issue_description is allowed to be None.
            issue_description = task_entry.get('issue_description', None)
            task_entries_to_put.append(
                improvements_domain.TaskEntry(
                    improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
                    exploration_id,
                    entity_version,
                    task_type,
                    improvements_models.TASK_TARGET_TYPE_STATE,
                    target_id,
                    issue_description,
                    status,
                    self.user_id,
                    datetime.datetime.utcnow()))
        improvements_services.put_tasks(task_entries_to_put)
        self.render_json({})


class ExplorationImprovementsHistoryHandler(base.BaseHandler):
    """Handles fetching the history of resolved exploration tasks.

    NOTE: Only exploration creators and editors can interface with tasks.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id):
        urlsafe_start_cursor = self.request.get('cursor', None)

        results, new_urlsafe_start_cursor, more = (
            improvements_services.fetch_exploration_task_history_page(
                exp_fetchers.get_exploration_by_id(exploration_id),
                urlsafe_start_cursor=urlsafe_start_cursor))

        self.render_json({
            'results': [t.to_dict() for t in results],
            'cursor': new_urlsafe_start_cursor,
            'more': more,
        })


class ExplorationImprovementsConfigHandler(base.BaseHandler):
    """Handles fetching the configuration of exploration tasks."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id):
        self.render_json({
            'exploration_id': exploration_id,
            'exploration_version': (
                exp_fetchers.get_exploration_by_id(exploration_id).version),
            'is_improvements_tab_enabled': (
                config_domain.IS_IMPROVEMENTS_TAB_ENABLED.value),
            'high_bounce_rate_task_state_bounce_rate_creation_threshold': (
                config_domain
                .HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD
                .value),
            'high_bounce_rate_task_state_bounce_rate_obsoletion_threshold': (
                config_domain
                .HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD
                .value),
            'high_bounce_rate_task_minimum_exploration_starts': (
                config_domain.HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS
                .value),
        })
