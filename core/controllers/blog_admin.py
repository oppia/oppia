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
from core.domain import platform_feature_services
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_list
from core.domain import platform_parameter_registry
from core.domain import role_services
from core.domain import user_services

from typing import Dict, Final, List, Optional, TypedDict, Union

BLOG_POST_EDITOR: Final = feconf.ROLE_ID_BLOG_POST_EDITOR
BLOG_ADMIN: Final = feconf.ROLE_ID_BLOG_ADMIN


class PlatformParamBlogAdminSchemaDict(TypedDict):
    """Type representing the platform parameter's schema dictionary to display
    on the blog admin page.
    """

    schema: Dict[str, str]
    description: str
    value: platform_parameter_domain.PlatformDataTypes


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
    new_platform_parameter_values: Optional[Dict[str, int]]


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
                        'save_platform_parameters'
                    ]
                }
            },
            'new_platform_parameter_values': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        validation_method.
                        validate_platform_params_values_for_blog_admin),
                },
                'default_value': None
            }
        }
    }

    def _get_platform_parameter_schema(
        self, param_name: str
    ) -> PlatformParamBlogAdminSchemaDict:
        """Returns a platform parameter dict to display on the blog
        admin page.

        Args:
            param_name: str. The name of the platform parameter.

        Returns:
            PlatformParamBlogAdminSchemaDict. The platform params value to
            display on the blog admin page.
        """
        parameter = platform_parameter_registry.Registry.get_platform_parameter(
            param_name)
        schema = {}
        if parameter.data_type == 'bool':
            schema = {'type': 'bool'}
        elif parameter.data_type == 'string':
            schema = {'type': 'unicode'}
        elif parameter.data_type == 'number':
            schema = {'type': 'float'}
        return {
            'schema': schema,
            'description': parameter.description,
            'value': platform_feature_services.get_platform_parameter_value(
                param_name)
        }

    @acl_decorators.can_access_blog_admin_page
    def get(self) -> None:
        """Handles GET requests."""
        platform_params_for_blog_admin = {
            'max_number_of_tags_assigned_to_blog_post': (
                self._get_platform_parameter_schema(
                    platform_parameter_list.ParamNames.
                    MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value
                )
            )
        }
        role_to_action = role_services.get_role_actions()
        self.render_json({
            'platform_parameters': platform_params_for_blog_admin,
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
        assert action == 'save_platform_parameters'

        new_platform_parameter_values = self.normalized_payload.get(
            'new_platform_parameter_values')
        if new_platform_parameter_values is None:
            raise Exception(
                'The new_platform_parameter_values cannot be None when the'
                ' action is save_platform_parameters.'
            )
        for (name, value) in new_platform_parameter_values.items():
            rules_for_platform_parameter = [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [[
                                '=',
                                platform_feature_services.
                                get_server_mode().value
                            ]]
                        }
                    ],
                    'value_when_matched': value
                })
            ]
            platform_parameter_registry.Registry.update_platform_parameter(
                name,
                self.user_id,
                'Update platform parameter property from blog admin page.',
                rules_for_platform_parameter
            )

        logging.info(
            '[BLOG ADMIN] %s saved platform parameter values: %s' %
            (self.user_id, new_platform_parameter_values))

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
