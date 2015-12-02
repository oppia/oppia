# coding: utf-8

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

"""Controllers for the collections editor."""

__author__ = 'Abraham Mgowano'

from core.controllers import base
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import rights_manager
import feconf
import utils

import jinja2


class CollectionEditorHandler(base.BaseHandler):
    """Base class for all handlers for the collection editor page."""

    # The page name to use as a key for generating CSRF tokens.
    PAGE_NAME_FOR_CSRF = 'collection_editor'


class CollectionEditorPage(CollectionEditorHandler):
    """The editor page for a single collection."""

    def get(self, collection_id):
        """Handles GET requests."""

        collection = collection_services.get_collection_by_id(
            collection_id, strict=False)

        if (collection is None or
            not rights_manager.Actor(self.user_id).can_view(
                rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id)):
            self.redirect('/')
            return

        can_edit = (
            bool(self.user_id) and
            self.username not in config_domain.BANNED_USERNAMES.value and
            rights_manager.Actor(self.user_id).can_edit(
                rights_manager.ACTIVITY_TYPE_COLLECTION, collection_id))

        self.values.update({
            'can_edit': can_edit, 
            'title': collection.title
        })

        self.render_template('collection_editor/collection_editor.html')
