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

"""Controllers for Oppia improvement tasks."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import exp_fetchers
from core.domain import improvements_domain
from core.domain import improvements_services
from core.platform import models
import feconf

(improvements_models,) = (
    models.Registry.import_models([models.NAMES.improvements]))


class ExplorationImprovementsHandler(base.BaseHandler):
    """Handles operations related to managing exploration improvement tasks.

    NOTE: Only exploration creators can interface with tasks!
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id):
        # The ACL decorator guarantees the exploration exists.
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)

        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(exploration))
        self.render_json({
            'open_tasks': [t.to_dict() for t in open_tasks],
            'resolved_task_types_by_state_name': (
                resolved_task_types_by_state_name),
        })

    @acl_decorators.can_edit_exploration
    def post(self, exploration_id):
        # The ACL decorator guarantees the exploration exists.
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)

        try:
            task_entries = []
            for task_entry_payload in self.payload['task_entries']:
                task_entries.append(
                    improvements_domain.TaskEntry(
                        improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
                        exploration_id,
                        task_entry_payload['entity_version'],
                        task_entry_payload['task_type'],
                        improvements_models.TASK_TARGET_TYPE_STATE,
                        task_entry_payload['target_id'],
                        task_entry_payload['issue_description'],
                        task_entry_payload['status'],
                        self.user_id, datetime.datetime.utcnow()))
            improvements_services.put_tasks(task_entries)
        except Exception as e:
            raise self.InvalidInputException(
                'Invalid task entry payload: %s' % (e,))
        self.render_json({})


class ExplorationImprovementsHistoryHandler(base.BaseHandler):
    """Handles fetching the history of resolved exploration tasks.

    NOTE: Only exploration creators can interface with tasks!
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id):
        # The ACL decorator guarantees the exploration exists.
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
        urlsafe_start_cursor = self.request.get('cursor', None)
        try:
            results, urlsafe_cursor, more = (
                improvements_services.fetch_exploration_task_history_page(
                    exploration, urlsafe_start_cursor=urlsafe_start_cursor))
        except Exception as e:
            raise self.InvalidInputException(
                'Invalid history fetch attempt: %s' % (e,))

        self.render_json({
            'results': [t.to_dict() for t in results],
            'cursor': urlsafe_cursor,
            'more': more,
        })
