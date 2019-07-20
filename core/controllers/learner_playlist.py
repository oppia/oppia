# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the learner playlist."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import learner_playlist_services
from core.domain import learner_progress_services

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class LearnerPlaylistHandler(base.BaseHandler):
    """Handles operations related to the learner playlist."""

    @acl_decorators.can_access_learner_dashboard
    def post(self, activity_type, activity_id):
        position_to_be_inserted_in = self.payload.get('index')

        belongs_to_completed_or_incomplete_list = False
        playlist_limit_exceeded = False
        belongs_to_subscribed_activities = False

        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
            (
                belongs_to_completed_or_incomplete_list,
                playlist_limit_exceeded,
                belongs_to_subscribed_activities) = (
                    learner_progress_services.add_exp_to_learner_playlist(
                        self.user_id, activity_id,
                        position_to_be_inserted=position_to_be_inserted_in))
        elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
            (
                belongs_to_completed_or_incomplete_list,
                playlist_limit_exceeded,
                belongs_to_subscribed_activities) = (
                    learner_progress_services.
                    add_collection_to_learner_playlist(
                        self.user_id, activity_id,
                        position_to_be_inserted=position_to_be_inserted_in))

        self.values.update({
            'belongs_to_completed_or_incomplete_list': (
                belongs_to_completed_or_incomplete_list),
            'playlist_limit_exceeded': playlist_limit_exceeded,
            'belongs_to_subscribed_activities': (
                belongs_to_subscribed_activities)
        })

        self.render_json(self.values)

    @acl_decorators.can_access_learner_dashboard
    def delete(self, activity_type, activity_id):
        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
            learner_playlist_services.remove_exploration_from_learner_playlist(
                self.user_id, activity_id)
        elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
            learner_playlist_services.remove_collection_from_learner_playlist(
                self.user_id, activity_id)

        self.render_json(self.values)
