# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the Oppia collection learner view."""

from core.controllers import base
from core.domain import collection_services
from core.domain import config_domain
from core.domain import rights_manager
from core.domain import summary_services
from core.platform import models
import utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


def require_collection_playable(handler):
    """Decorator that checks if the user can play the given collection."""
    def test_can_play(self, collection_id, **kwargs):
        """Check if the current user can play the collection."""
        actor = rights_manager.Actor(self.user_id)
        can_play = actor.can_play(
            rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id)
        can_view = actor.can_view(
            rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id)
        if can_play and can_view:
            return handler(self, collection_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_play


class CollectionPage(base.BaseHandler):
    """Page describing a single collection."""

    PAGE_NAME_FOR_CSRF = 'collection'

    @require_collection_playable
    def get(self, collection_id):
        """Handles GET requests."""
        try:
            collection = collection_services.get_collection_by_id(
                collection_id)
        except Exception as e:
            raise self.PageNotFoundException(e)
        whitelisted_usernames = (
            config_domain.WHITELISTED_COLLECTION_EDITOR_USERNAMES.value)
        self.values.update({
            'can_edit': (
                bool(self.username) and
                self.username in whitelisted_usernames and
                self.username not in config_domain.BANNED_USERNAMES.value and
                rights_manager.Actor(self.user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id)
            ),
            'is_logged_in': bool(self.user_id),
            'collection_id': collection_id,
            'collection_title': collection.title,
            'collection_skills': collection.skills,
            'is_private': rights_manager.is_collection_private(collection_id),
            'meta_name': collection.title,
            'meta_description': utils.capitalize_string(collection.objective)
        })

        self.render_template('collection_player/collection_player.html')


class CollectionDataHandler(base.BaseHandler):
    """Provides the data for a single collection."""

    def get(self, collection_id):
        """Populates the data on the individual collection page."""
        allow_invalid_explorations = bool(
            self.request.get('allow_invalid_explorations'))

        try:
            collection_dict = (
                summary_services.get_learner_collection_dict_by_id(
                    collection_id, self.user_id,
                    allow_invalid_explorations=allow_invalid_explorations))
        except Exception as e:
            raise self.PageNotFoundException(e)

        self.values.update({
            'can_edit': (
                self.user_id and rights_manager.Actor(self.user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id)),
            'collection': collection_dict,
            'is_logged_in': bool(self.user_id),
            'session_id': utils.generate_new_session_id(),
        })

        self.render_json(self.values)
