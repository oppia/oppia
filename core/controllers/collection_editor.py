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

import base64

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import collection_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import summary_services
from core.platform import models
import feconf
import utils

current_user_services = models.Registry.import_current_user_services()


def _require_valid_version(version_from_payload, collection_version):
    """Check that the payload version matches the given collection version."""
    if version_from_payload is None:
        raise base.BaseHandler.InvalidInputException(
            'Invalid POST request: a version must be specified.')

    if version_from_payload != collection_version:
        raise base.BaseHandler.InvalidInputException(
            'Trying to update version %s of collection from version %s, '
            'which is too old. Please reload the page and try again.'
            % (collection_version, version_from_payload))


class CollectionEditorHandler(base.BaseHandler):
    """Base class for all handlers for the collection editor page."""
    pass


class CollectionEditorPage(CollectionEditorHandler):
    """The editor page for a single collection."""

    @acl_decorators.can_edit_collection
    def get(self, collection_id):
        """Handles GET requests."""

        collection = collection_services.get_collection_by_id(
            collection_id, strict=False)

        self.values.update({
            'collection_id': collection.id,
            'SHOW_COLLECTION_NAVIGATION_TAB_HISTORY': (
                feconf.SHOW_COLLECTION_NAVIGATION_TAB_HISTORY),
            'SHOW_COLLECTION_NAVIGATION_TAB_STATS': (
                feconf.SHOW_COLLECTION_NAVIGATION_TAB_STATS),
            'TAG_REGEX': feconf.TAG_REGEX,
            'title': collection.title,
        })

        self.render_template('pages/collection_editor/collection_editor.html')


class EditableCollectionDataHandler(CollectionEditorHandler):
    """A data handler for collections which supports writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def _require_valid_version(self, version_from_payload, collection_version):
        """Check that the payload version matches the given collection
        version.
        """
        if version_from_payload is None:
            raise base.BaseHandler.InvalidInputException(
                'Invalid POST request: a version must be specified.')

        if version_from_payload != collection_version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of collection from version %s, '
                'which is too old. Please reload the page and try again.'
                % (collection_version, version_from_payload))

    @acl_decorators.can_edit_collection
    def get(self, collection_id):
        """Populates the data on the individual collection page."""

        try:
            # Try to retrieve collection.
            collection_dict = (
                summary_services.get_learner_collection_dict_by_id(
                    collection_id, self.user,
                    allow_invalid_explorations=True))
        except Exception as e:
            raise self.PageNotFoundException(e)

        self.values.update({
            'collection': collection_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_collection
    def put(self, collection_id):
        """Updates properties of the given collection."""

        collection = collection_services.get_collection_by_id(collection_id)
        version = self.payload.get('version')
        self._require_valid_version(version, collection.version)

        commit_message = self.payload.get('commit_message')
        change_list = self.payload.get('change_list')

        try:
            collection_services.update_collection(
                self.user_id, collection_id, change_list, commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        collection_dict = (
            summary_services.get_learner_collection_dict_by_id(
                collection_id, self.user,
                allow_invalid_explorations=True))

        # Send the updated collection back to the frontend.
        self.values.update({
            'collection': collection_dict
        })

        self.render_json(self.values)


class CollectionRightsHandler(CollectionEditorHandler):
    """Handles management of collection editing rights."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_collection
    def get(self, collection_id):
        """Gets the editing rights for the given collection.

        Args:
            collection_id: str. ID for the collection.
        """
        (collection, collection_rights) = (
            collection_services.get_collection_and_collection_rights_by_id(
                collection_id))

        self.values.update({
            'can_edit': True,
            'can_unpublish': rights_manager.check_can_unpublish_activity(
                self.user, collection_rights),
            'collection_id': collection.id,
            'is_private': rights_manager.is_collection_private(collection_id),
            'owner_names': rights_manager.get_collection_owner_names(
                collection_id)
        })

        self.render_json(self.values)


class CollectionPublishHandler(base.BaseHandler):
    """Handles the publication of the given collection."""

    @acl_decorators.can_publish_collection
    def put(self, collection_id):
        """Publishes the given collection."""
        collection = collection_services.get_collection_by_id(collection_id)
        version = self.payload.get('version')
        _require_valid_version(version, collection.version)

        try:
            collection.validate(strict=True)
            collection_services.validate_exps_in_collection_are_public(
                collection)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        collection_services.publish_collection_and_update_user_profiles(
            self.user, collection_id)
        collection_services.index_collections_given_ids([
            collection_id])

        collection_rights = rights_manager.get_collection_rights(
            collection_id, strict=False)

        self.values.update({
            'can_edit': True,
            'can_unpublish': rights_manager.check_can_unpublish_activity(
                self.user, collection_rights),
            'collection_id': collection.id,
            'is_private': rights_manager.is_collection_private(collection_id),
            'owner_names': rights_manager.get_collection_owner_names(
                collection_id)
        })
        self.render_json(self.values)


class CollectionUnpublishHandler(base.BaseHandler):
    """Handles the unpublication of the given collection."""

    @acl_decorators.can_unpublish_collection
    def put(self, collection_id):
        """Unpublishes the given collection."""
        collection = collection_services.get_collection_by_id(collection_id)
        version = self.payload.get('version')
        _require_valid_version(version, collection.version)

        rights_manager.unpublish_collection(self.user, collection_id)
        search_services.delete_collections_from_search_index([
            collection_id])

        collection_rights = rights_manager.get_collection_rights(
            collection_id, strict=False)

        self.values.update({
            'can_edit': True,
            'can_unpublish': rights_manager.check_can_unpublish_activity(
                self.user, collection_rights),
            'collection_id': collection.id,
            'is_private': rights_manager.is_collection_private(collection_id),
            'owner_names': rights_manager.get_collection_owner_names(
                collection_id)
        })
        self.render_json(self.values)


class ExplorationMetadataSearchHandler(base.BaseHandler):
    """Provides data for exploration search."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        query_string = base64.b64decode(self.request.get('q'))

        search_cursor = self.request.get('cursor', None)

        collection_node_metadata_list, new_search_cursor = (
            summary_services.get_exp_metadata_dicts_matching_query(
                query_string, search_cursor, self.user))

        self.values.update({
            'collection_node_metadata_list': collection_node_metadata_list,
            'search_cursor': new_search_cursor,
        })

        self.render_json(self.values)
