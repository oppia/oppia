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

"""Controllers for the learner playlist."""

from constants import constants
from core.controllers import base
from core.domain import acl_decorators
from core.domain import learner_progress_services
from core.domain import learner_playlist_services


class LearnerPlaylistHandler(base.BaseHandler):
    """Handles operations related to the learner playlist."""

    @acl_decorators.can_access_learner_dashboard
    def post(self):
        position_to_be_inserted_in = self.payload.get('index')
        activity_type = self.payload.get('activity_type')
        if activity_type == constants.ACTIVITY_TYPE_EXPLORATIONS:
            exploration_id = self.payload.get('exploration_id')
            learner_progress_services.add_exp_to_learner_playlist(
                self.user_id, exploration_id, position_to_be_inserted_in)
        elif activity_type == constants.ACTIVITY_TYPE_COLLECTIONS:
            collection_id = self.payload.get('collection_id')
            learner_progress_services.add_collection_to_learner_playlist(
                self.user_id, collection_id, position_to_be_inserted_in)

        self.render_json(self.values)

    @acl_decorators.can_access_learner_dashboard
    def delete(self):
        activity_type = self.payload.get('activity_type')
        if activity_type == constants.ACTIVITY_TYPE_EXPLORATIONS:
            exploration_id = self.payload.get('exploration_id')
            learner_playlist_services.remove_exploration_from_learner_playlist(
                self.user_id, exploration_id)
        elif activity_type == constants.ACTIVITY_TYPE_COLLECTIONS:
            collection_id = self.payload.get('collection_id')
            learner_playlist_services.remove_collection_from_learner_playlist(
                self.user_id, collection_id)


class AddExplorationToLearnerPlaylistHandler(base.BaseHandler):
    """Handler for adding the id of the exploration received as payload to the
    playlist of the user.
    """

    @acl_decorators.can_access_learner_dashboard
    def post(self):
        exploration_id = self.payload.get('exploration_id')
        position_to_be_inserted_in = self.payload.get('index')
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, exploration_id, position_to_be_inserted_in)
        self.render_json(self.values)


class AddCollectionToLearnerPlaylistHandler(base.BaseHandler):
    """Handler for adding the id of the collection received as payload to the
    playlist of the user.
    """

    @acl_decorators.can_access_learner_dashboard
    def post(self):
        collection_id = self.payload.get('collection_id')
        position_to_be_inserted_in = self.payload.get('index')
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, collection_id, position_to_be_inserted_in)
        self.render_json(self.values)


class RemoveExplorationFromPlaylistHandler(base.BaseHandler):
    """Handler for removing the id of the exploration received as payload to
    the playlist of the user.
    """

    @acl_decorators.can_access_learner_dashboard
    def post(self):
        exploration_id = self.payload.get('exploration_id')
        learner_playlist_services.remove_exploration_from_learner_playlist(
            self.user_id, exploration_id)
        self.render_json(self.values)


class RemoveCollectionFromPlaylistHandler(base.BaseHandler):
    """Handler for removing the id of the collection received as payload to
    the playlist of the user.
    """

    @acl_decorators.can_access_learner_dashboard
    def post(self):
        collection_id = self.payload.get('collection_id')
        learner_playlist_services.remove_collection_from_learner_playlist(
            self.user_id, collection_id)
        self.render_json(self.values)
