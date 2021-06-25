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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import blog_services
from core.domain import config_domain
from core.domain import config_services
from core.domain import role_services
from core.domain import user_services
import feconf
import python_utils

BLOG_POST_EDITOR = feconf.ROLE_ID_BLOG_POST_EDITOR
BLOG_ADMIN = feconf.ROLE_ID_BLOG_ADMIN


class BlogAdminPage(base.BaseHandler):
    """Handler for rendering the blog admin page."""

    @acl_decorators.can_access_blog_admin_page
    def get(self):
        """Handles GET requests."""
        self.render_template('blog-admin-page.mainpage.html')


class BlogAdminHandler(base.BaseHandler):
    """Handler for the blog admin page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_blog_admin_page
    def get(self):
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
    def post(self):
        """Handles POST requests."""
        try:
            result = {}
            if self.payload.get('action') == 'save_config_properties':
                new_config_property_values = self.payload.get(
                    'new_config_property_values')
                for (name, value) in new_config_property_values.items():
                    config_services.set_property(self.user_id, name, value)
                logging.info(
                    '[BLOG ADMIN] %s saved config property values: %s' %
                    (self.user_id, new_config_property_values))
            elif self.payload.get('action') == 'revert_config_property':
                config_property_id = self.payload.get('config_property_id')
                config_services.revert_property(
                    self.user_id, config_property_id)
                logging.info(
                    '[BLOG ADMIN] %s reverted config property: %s' %
                    (self.user_id, config_property_id))
            self.render_json(result)
        except Exception as e:
            logging.exception('[BLOG ADMIN] %s', e)
            self.render_json({'error': python_utils.UNICODE(e)})
            python_utils.reraise_exception()


class BlogAdminRolesHandler(base.BaseHandler):
    """Handler for the blog admin page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_manage_blog_post_editors
    def post(self):
        """Handles POST requests."""
        username = self.payload.get('username')
        role = self.payload.get('role')
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'User with given username does not exist.')
        user_services.update_user_role(user_id, role)
        role_services.log_role_query(
            self.user_id, feconf.ROLE_ACTION_UPDATE, role=role,
            username=username)
        self.render_json({})

    @acl_decorators.can_manage_blog_post_editors
    def put(self):
        """Handles PUT requests."""
        username = self.payload.get('username', None)
        if username is None:
            raise self.InvalidInputException('Missing username param')
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % username)

        user_services.remove_blog_editor(user_id)
        blog_services.deassign_user_from_all_blog_posts(user_id)
        self.render_json({})
