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

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import collection_services
from core.domain import rights_manager
from core.domain import summary_services
from core.platform import models
import feconf
import utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


class CollectionPage(base.BaseHandler):
    """Page describing a single collection."""

    @acl_decorators.can_play_collection
    def get(self, collection_id):
        """Handles GET requests."""
        (collection, collection_rights) = (
            collection_services.get_collection_and_collection_rights_by_id(
                collection_id))
        if collection is None:
            raise self.PageNotFoundException

        self.values.update({
            'can_edit': rights_manager.check_can_edit_activity(
                self.user, collection_rights),
            'is_logged_in': bool(self.user_id),
            'collection_id': collection_id,
            'collection_title': collection.title,
            'is_private': rights_manager.is_collection_private(collection_id),
            'meta_name': collection.title,
            'meta_description': utils.capitalize_string(collection.objective)
        })

        self.render_template('pages/collection_player/collection_player.html')


class CollectionDataHandler(base.BaseHandler):
    """Provides the data for a single collection."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_collection
    def get(self, collection_id):
        """Populates the data on the individual collection page."""
        try:
            collection_dict = (
                summary_services.get_learner_collection_dict_by_id(
                    collection_id, self.user,
                    allow_invalid_explorations=False))
        except Exception as e:
            raise self.PageNotFoundException(e)
        collection_rights = rights_manager.get_collection_rights(
            collection_id, strict=False)
        self.values.update({
            'can_edit': rights_manager.check_can_edit_activity(
                self.user, collection_rights),
            'collection': collection_dict,
            'is_logged_in': bool(self.user_id),
            'session_id': utils.generate_new_session_id(),
        })

        self.render_json(self.values)
