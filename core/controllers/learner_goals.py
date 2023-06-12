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

"""Controllers for the learner goals."""

from __future__ import annotations

from core import feconf

from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import learner_goals_services
from core.domain import learner_progress_services

from typing import Dict


class LearnerGoalsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handles operations related to the learner goals."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'topic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': r'^[a-zA-Z0-9\-_]{1,12}$'
                }]
            }
        },
        'activity_type': {
            'schema': {
                'type': 'basestring',
                'choices': [
                    constants.ACTIVITY_TYPE_LEARN_TOPIC
                ]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'POST': {},
        'DELETE': {}
    }

    # Note: Currently this handler only accepts one type of activity
    # which is 'ACTIVITY_TYPE_LEARN_TOPIC', so 'activity_type' argument
    # is not used inside the function body. But, in future, if this handler
    # accepts more than one activity type, then please remove the pylint
    # exception below and use an 'if-else' clause inside the function
    # body to handle the different activity cases properly.
    @acl_decorators.can_access_learner_dashboard
    def post(self, activity_type: str, topic_id: str) -> None:  # pylint: disable=unused-argument
        """Adds a topic to the learner's learning goals.

        Args:
            activity_type: str. The activity type.
            topic_id: str. The ID of the topic.
        """
        assert self.user_id is not None
        belongs_to_learnt_list = False
        goals_limit_exceeded = False

        belongs_to_learnt_list, goals_limit_exceeded = (
            learner_progress_services.validate_and_add_topic_to_learn_goal(
                self.user_id, topic_id))

        self.values.update({
            'belongs_to_learnt_list': belongs_to_learnt_list,
            'goals_limit_exceeded': goals_limit_exceeded
        })

        self.render_json(self.values)

    # Note: Currently this handler only accepts one type of activity
    # which is 'ACTIVITY_TYPE_LEARN_TOPIC', so 'activity_type' argument
    # is not used inside the function body. But, in future, if this handler
    # accepts more than one activity type, then please remove the pylint
    # exception below and use an 'if-else' clause inside the function
    # body to handle the different activity cases properly.
    @acl_decorators.can_access_learner_dashboard
    def delete(self, activity_type: str, topic_id: str) -> None:  # pylint: disable=unused-argument
        """Removes a topic from the learner's learning goals.

        Args:
            activity_type: str. The activity type.
            topic_id: str. The topic ID.
        """
        assert self.user_id is not None
        learner_goals_services.remove_topics_from_learn_goal(
            self.user_id, [topic_id])

        self.render_json(self.values)
