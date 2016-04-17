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
from core.domain import exp_services
from core.domain import rights_manager
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

        self.values.update({
            'can_edit': (
                bool(self.username) and
                self.username not in config_domain.BANNED_USERNAMES.value and
                rights_manager.Actor(self.user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id)
            ),
            'is_logged_in': bool(self.user_id),
            'collection_id': collection_id,
            'collection_title': collection.title,
            'is_private': rights_manager.is_collection_private(collection_id),
            'meta_name': collection.title,
            'meta_description': utils.capitalize_string(collection.objective)
        })

        self.render_template('collection_player/collection_player.html')


class CollectionDataHandler(base.BaseHandler):
    """Provides the data for a single collection."""

    def get(self, collection_id):
        """Populates the data on the individual collection page."""
        try:
            collection = collection_services.get_collection_by_id(
                collection_id)
        except Exception as e:
            raise self.PageNotFoundException(e)

        exp_ids = collection.exploration_ids
        exp_summaries = (
            exp_services.get_exploration_summaries_matching_ids(exp_ids))
        exp_summaries_dict = {
            exp_id: exp_summaries[ind] for (ind, exp_id) in enumerate(exp_ids)
        }

        # TODO(bhenning): Users should not be recommended explorations they
        # have completed outside the context of a collection.
        next_exploration_ids = None
        completed_exploration_ids = None
        if self.user_id:
            completed_exploration_ids = (
                collection_services.get_completed_exploration_ids(
                    self.user_id, collection_id))
            next_exploration_ids = collection.get_next_exploration_ids(
                completed_exploration_ids)
        else:
            # If the user is not logged in or they have not completed any of
            # the explorations yet within the context of this collection,
            # recommend the initial explorations.
            next_exploration_ids = collection.init_exploration_ids
            completed_exploration_ids = []

        collection_dict = collection.to_dict()
        collection_dict['next_exploration_ids'] = next_exploration_ids
        collection_dict['completed_exploration_ids'] = (
            completed_exploration_ids)

        # Insert an 'exploration' dict into each collection node, where the
        # dict includes meta information about the exploration (ID and title).
        for collection_node in collection_dict['nodes']:
            summary = exp_summaries_dict.get(collection_node['exploration_id'])
            collection_node['exploration'] = {
                'id': collection_node['exploration_id'],
                'title': summary.title if summary else None,
                'category': summary.category if summary else None,
                'objective': summary.objective if summary else None,
                'ratings': summary.ratings if summary else None,
                'last_updated_msec': utils.get_time_in_millisecs(
                    summary.exploration_model_last_updated
                ) if summary else None,
                'thumbnail_icon_url': utils.get_thumbnail_icon_url_for_category(
                    summary.category),
                'thumbnail_bg_color': utils.get_hex_color_for_category(
                    summary.category),
            }

        self.values.update({
            'can_edit': (
                self.user_id and rights_manager.Actor(self.user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id)),
            'collection': collection_dict,
            'info_card_image_url': utils.get_info_card_url_for_category(
                collection.category),
            'is_logged_in': bool(self.user_id),
            'session_id': utils.generate_new_session_id(),
        })

        self.render_json(self.values)
