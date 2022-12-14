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

"""Controllers for the blog admin page"""

from __future__ import annotations

import logging

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator as validation_method
from core.domain import blog_services
from core.domain import config_domain
from core.domain import config_services
from core.domain import role_services
from core.domain import user_services

from typing import Dict, Final, List, Optional, TypedDict, Union

BLOG_POST_EDITOR: Final = feconf.ROLE_ID_BLOG_POST_EDITOR
BLOG_ADMIN: Final = feconf.ROLE_ID_BLOG_ADMIN


class BlogAdminPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Blog Admin Page  Handler to render the frontend template."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_blog_admin_page
    def get(self) -> None:
        """Handles GET requests."""

        self.render_template('blog-admin-page.mainpage.html')


class BlogAdminHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of BlogAdminHandler's normalized_payload
    dictionary.
    """

    action: str
    new_config_property_values: Optional[Dict[str, Union[List[str], int]]]
    config_property_id: Optional[str]


class BlogAdminHandler(
    base.BaseHandler[
        BlogAdminHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Handler for the blog admin page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'action': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        'save_config_properties', 'revert_config_property']
                }
            },
            'new_config_property_values': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        validation_method.validate_new_config_property_values),
                },
                'default_value': None
            },
            'config_property_id': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': None
            },
        }
    }

    @acl_decorators.can_access_blog_admin_page
    def get(self) -> None:
        """Handles GET requests."""
        config_properties = config_domain.Registry.get_config_property_schemas()
        config_prop_for_blog_admin = {
            'list_of_default_tags_for_blog_post': (
                config_properties['list_of_default_tags_for_blog_post']),
            'max_number_of_tags_assigned_to_blog_post': (
                config_properties['max_number_of_tags_assigned_to_blog_post'])
        }
        role_to_action = role_services.get_role_actions()
        self.render_json({
            'config_properties': config_prop_for_blog_admin,
            'role_to_actions': {
                BLOG_POST_EDITOR: role_to_action[BLOG_POST_EDITOR],
                BLOG_ADMIN: role_to_action[BLOG_ADMIN]
            },
            'updatable_roles': {
                BLOG_POST_EDITOR: (
                    role_services.HUMAN_READABLE_ROLES[BLOG_POST_EDITOR]),
                BLOG_ADMIN: role_services.HUMAN_READABLE_ROLES[BLOG_ADMIN]
            }
        })

    @acl_decorators.can_access_blog_admin_page
    def post(self) -> None:
        """Handles POST requests."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        action = self.normalized_payload['action']
        if action == 'save_config_properties':
            new_config_property_values = self.normalized_payload.get(
                'new_config_property_values')
            if new_config_property_values is None:
                raise Exception(
                    'The new_config_property_values cannot be None when the'
                    ' action is save_config_properties.'
                )
            for (name, value) in new_config_property_values.items():
                config_services.set_property(self.user_id, name, value)
            logging.info(
                '[BLOG ADMIN] %s saved config property values: %s' %
                (self.user_id, new_config_property_values))
        else:
            # The handler schema defines the possible values of 'action'.
            # If 'action' has a value other than those defined in the schema,
            # a Bad Request error will be thrown. Hence, 'action' must be
            # 'revert_config_property' if this branch is executed.
            assert action == 'revert_config_property'
            config_property_id = self.normalized_payload.get(
                'config_property_id')
            if config_property_id is None:
                raise Exception(
                    'The config_property_id cannot be None when the action'
                    ' is revert_config_property.'
                )
            config_services.revert_property(
                self.user_id, config_property_id)
            logging.info(
                '[BLOG ADMIN] %s reverted config property: %s' %
                (self.user_id, config_property_id))
        self.render_json({})


class BlogAdminRolesHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of BlogAdminRolesHandler's normalized_payload
    dictionary.
    """

    role: str
    username: str


class BlogAdminRolesHandler(
    base.BaseHandler[
        BlogAdminRolesHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Handler for the blog admin page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'role': {
                'schema': {
                    'type': 'basestring',
                    'choices': [BLOG_ADMIN, BLOG_POST_EDITOR]
                }
            },
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            },
        },
        'PUT': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            },
        }
    }

    @acl_decorators.can_manage_blog_post_editors
    def post(self) -> None:
        """Handles POST requests."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        username = self.normalized_payload['username']
        role = self.normalized_payload['role']
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'User with given username does not exist.')
        user_services.add_user_role(user_id, role)
        role_services.log_role_query(
            self.user_id, feconf.ROLE_ACTION_ADD, role=role,
            username=username)
        self.render_json({})

    @acl_decorators.can_manage_blog_post_editors
    def put(self) -> None:
        """Handles PUT requests."""
        assert self.normalized_payload is not None
        username = self.normalized_payload['username']
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % username)

        user_services.remove_user_role(user_id, feconf.ROLE_ID_BLOG_POST_EDITOR)
        blog_services.deassign_user_from_all_blog_posts(user_id)
        self.render_json({})
