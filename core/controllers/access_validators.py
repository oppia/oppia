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

"""Controllers for validating access."""

from __future__ import absolute_import
from __future__ import unicode_literals

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classroom_services
from core.domain import user_services

import feconf

from typing import Any # pylint: disable=unused-import
from typing import Dict # pylint: disable=unused-import
from typing import Text # pylint: disable=unused-import


# TODO(#13605): Refactor access validation handlers to follow a single handler
# pattern.

class ClassroomAccessValidationHandler(base.BaseHandler):
    """Validates whether request made to /learn route.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {} # type: Dict[Text, Any]
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'classroom_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    } # type: Dict[Text, Any]

    @acl_decorators.open_access # type: ignore[misc]
    def get(self):
        # type: () -> None
        classroom_url_fragment = self.normalized_request.get( # type: ignore[union-attr]
            'classroom_url_fragment')
        classroom = classroom_services.get_classroom_by_url_fragment( # type: ignore[no-untyped-call]
            classroom_url_fragment)

        if not classroom:
            raise self.PageNotFoundException


class ManageOwnAccountValidationHandler(base.BaseHandler):
    """Validates access to preferences page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {} # type: Dict[Text, Any]

    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    } # type: Dict[Text, Any]

    @acl_decorators.can_manage_own_account # type: ignore[misc]
    def get(self):
        # type: () -> None
        pass


class ProfileExistsValidationHandler(base.BaseHandler):
    """The world-viewable profile page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'username': {
            'schema': {
                'type': 'basestring'
            }
        }
    } # type: Dict[Text, Any]

    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    } # type: Dict[Text, Any]

    @acl_decorators.open_access # type: ignore[misc]
    def get(self, username):
        # type: (Text) -> None
        """Validates access to profile page."""

        user_settings = user_services.get_user_settings_from_username( # type: ignore[no-untyped-call]
            username)

        if not user_settings:
            raise self.PageNotFoundException


class AccountDeletionIsEnabledValidationHandler(base.BaseHandler):
    """Checks whether account deletion is enabled."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {} # type: Dict[Text, Any]

    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    } # type: Dict[Text, Any]

    @acl_decorators.open_access # type: ignore[misc]
    def get(self):
        # type: () -> None
        """Handles GET requests."""
        if not constants.ENABLE_ACCOUNT_DELETION:
            raise self.PageNotFoundException


class ReleaseCoordinatorAccessValidationHandler(base.BaseHandler):
    """Validates access to release coordinator page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {} # type: Dict[Text, Any]

    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    } # type: Dict[Text, Any]

    @acl_decorators.can_access_release_coordinator_page # type: ignore[misc]
    def get(self):
        # type: () -> None
        """Handles GET requests."""
        pass
