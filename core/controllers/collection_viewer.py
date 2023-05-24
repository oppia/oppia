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

from __future__ import annotations

from core import feconf
from core import utils
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import rights_manager
from core.domain import summary_services

from typing import Dict


class CollectionPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Page describing a single collection."""

    URL_PATH_ARGS_SCHEMAS = {
        'collection_id': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_play_collection
    def get(self, _: str) -> None:
        """Handles GET requests."""

        self.render_template('collection-player-page.mainpage.html')


class CollectionDataHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Provides the data for a single collection."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'collection_id': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_play_collection
    def get(self, collection_id: str) -> None:
        """Populates the data on the individual collection page.

        Args:
            collection_id: str. The ID of the collection.
        """
        collection_dict = (
            summary_services.get_learner_collection_dict_by_id(
                collection_id, self.user,
                allow_invalid_explorations=False))

        collection_rights = rights_manager.get_collection_rights(
            collection_id, strict=False)
        self.values.update({
            'can_edit': rights_manager.check_can_edit_activity(
                self.user, collection_rights),
            'collection': collection_dict,
            'is_logged_in': bool(self.user_id),
            'session_id': utils.generate_new_session_id(),
            'meta_name': collection_dict['title'],
            'meta_description': utils.capitalize_string(
                collection_dict['objective'])
        })

        self.render_json(self.values)
