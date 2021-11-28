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

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classroom_services
from core.domain import user_services

from typing import Any, Dict # isort: skip


# TODO(#13605): Refactor access validation handlers to follow a single handler
# pattern.

class ClassroomAccessValidationHandler(base.BaseHandler):
    """Validates whether request made to /learn route.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    URL_PATH_ARGS_SCHEMAS: Dict[str, Any] = {}
    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    HANDLER_ARGS_SCHEMAS: Dict[str, Any] = {
        'GET': {
            'classroom_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    # Using type ignore[misc] here because untyped decorator makes function
    # "get" also untyped.
    @acl_decorators.open_access # type: ignore[misc]
    def get(self) -> None:
        # Please use type casting here instead of type ignore[union-attr] once
        # this attribute `normalized_request` has been type annotated in the
        # parent class BaseHandler.
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

    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    URL_PATH_ARGS_SCHEMAS: Dict[str, Any] = {}

    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    HANDLER_ARGS_SCHEMAS: Dict[str, Any] = {
        'GET': {}
    }

    # Using type ignore[misc] here because untyped decorator makes function
    # "get" also untyped.
    @acl_decorators.can_manage_own_account # type: ignore[misc]
    def get(self) -> None:
        pass


class ProfileExistsValidationHandler(base.BaseHandler):
    """The world-viewable profile page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    URL_PATH_ARGS_SCHEMAS: Dict[str, Any] = {
        'username': {
            'schema': {
                'type': 'basestring'
            }
        }
    }

    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    HANDLER_ARGS_SCHEMAS: Dict[str, Any] = {
        'GET': {}
    }

    # Using type ignore[misc] here because untyped decorator makes function
    # "get" also untyped.
    @acl_decorators.open_access # type: ignore[misc]
    def get(self, username: str) -> None:
        """Validates access to profile page."""

        user_settings = user_services.get_user_settings_from_username( # type: ignore[no-untyped-call]
            username)

        if not user_settings:
            raise self.PageNotFoundException


class ReleaseCoordinatorAccessValidationHandler(base.BaseHandler):
    """Validates access to release coordinator page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    URL_PATH_ARGS_SCHEMAS: Dict[str, Any] = {}

    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    HANDLER_ARGS_SCHEMAS: Dict[str, Any] = {
        'GET': {}
    }

    # Using type ignore[misc] here because untyped decorator makes function
    # "get" also untyped.
    @acl_decorators.can_access_release_coordinator_page # type: ignore[misc]
    def get(self) -> None:
        """Handles GET requests."""
        pass
