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

__author__ = 'Ben Henning'

from core.controllers import base
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
import feconf
import utils

def require_collection_playable(handler):
    """Decorator that checks if the user can play the given collection."""
    def test_can_play(self, collection_id, **kwargs):
        """Check if the current user can play the collection."""
        if rights_manager.Actor(self.user_id).can_play(
                rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id):
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

        version = collection.version

        if not rights_manager.Actor(self.user_id).can_view(
                rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id):
            raise self.PageNotFoundException

        self.values.update({
            'can_edit': (
                bool(self.username) and
                self.username not in config_domain.BANNED_USERNAMES.value and
                rights_manager.Actor(self.user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id)
            ),
            'collection_id': collection_id,
            'collection_title': collection.title,
            'is_private': rights_manager.is_collection_private(collection_id),
            'meta_name': collection.title,
            'meta_description': utils.make_first_letter_uppercase(
                collection.objective)
        })

        self.render_template('pages/collection_player/collection_player.html')


class CollectionDataHandler(base.BaseHandler):
    """Provides the data for a single collection."""

    def get(self, collection_id):
        """Populates the data on the individual collection page."""
        try:
            collection = collection_services.get_collection_by_id(
                collection_id)
        except Exception as e:
            raise self.PageNotFoundException(e)

        exp_ids = [
            collection_node.exploration_id
            for collection_node in collection.nodes]

        exp_summaries = (
            exp_services.get_exploration_summaries_matching_ids(exp_ids))

        exp_titles_dict = {}
        for (ind, exp_id) in enumerate(exp_ids):
            exp_summary = exp_summaries[ind]
            exp_titles_dict[exp_id] = exp_summary.title if exp_summary else ''

        self.values.update({
            'can_edit': (
                self.user_id and rights_manager.Actor(self.user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id)),
            'collection': collection.to_dict(),
            'exploration_titles': exp_titles_dict,
            'info_card_image_url': utils.get_info_card_url_for_category(
                collection.category),
            'is_logged_in': bool(self.user_id),
            'session_id': utils.generate_random_string(24),
        })

        self.render_json(self.values)
