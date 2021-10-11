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

from __future__ import absolute_import
from __future__ import unicode_literals

from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import learner_goals_services
from core.domain import learner_progress_services


class LearnerGoalsHandler(base.BaseHandler):
    """Handles operations related to the learner goals."""

    @acl_decorators.can_access_learner_dashboard
    def post(self, activity_type, topic_id):
        belongs_to_learnt_list = False
        goals_limit_exceeded = False

        if activity_type == constants.ACTIVITY_TYPE_LEARN_TOPIC:
            belongs_to_learnt_list, goals_limit_exceeded = (
                learner_progress_services.validate_and_add_topic_to_learn_goal(
                    self.user_id, topic_id))
        else:
            raise self.InvalidInputException('Invalid activityType: %s' % (
                activity_type))

        self.values.update({
            'belongs_to_learnt_list': belongs_to_learnt_list,
            'goals_limit_exceeded': goals_limit_exceeded
        })

        self.render_json(self.values)

    @acl_decorators.can_access_learner_dashboard
    def delete(self, activity_type, topic_id):
        if activity_type == constants.ACTIVITY_TYPE_LEARN_TOPIC:
            learner_goals_services.remove_topics_from_learn_goal(
                self.user_id, [topic_id])
        else:
            raise self.InvalidInputException('Invalid activityType: %s' % (
                activity_type))

        self.render_json(self.values)
