# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Oppia base constants and handlers."""

__author__ = 'Sean Lip'

import json
import logging
import sys
import traceback

from apps.exploration.models import Exploration
from apps.state.models import State
import feconf
import webapp2

from google.appengine.api import users


def require_user(handler):
    """Decorator that checks if a user is associated to the current session."""
    def test_login(self, **kwargs):
        """Checks if the user for the current session is logged in."""
        if not self.user:
            self.redirect(users.create_login_url(self.request.uri))
            return
        return handler(self, **kwargs)

    return test_login


def require_editor(handler):
    """Decorator that checks if the user can edit the given entity."""
    def test_editor(self, exploration_id, state_id=None, **kwargs):
        """Gets the user and exploration id if the user can edit it.

        Args:
            self: the handler instance
            exploration_id: the exploration id
            state_id: the state id, if it exists
            **kwargs: any other arguments passed to the handler

        Returns:
            The user and exploration instance, if the user is authorized to edit
            this exploration. Also, the state instance, if one is supplied.

        Raises:
            self.NotLoggedInException: if there is no current user.
            self.UnauthorizedUserException: if the user exists but does not have
                the right credentials.
        """
        if not self.user:
            self.redirect(users.create_login_url(self.request.uri))
            return

        try:
            exploration = Exploration.get(exploration_id)
        except:
            raise self.PageNotFoundException

        if not exploration.is_editable_by(self.user):
            raise self.UnauthorizedUserException(
                '%s does not have the credentials to edit this exploration.',
                self.user)

        if not state_id:
            return handler(self, exploration, **kwargs)
        try:
            state = State.get(state_id, parent=exploration.key)
        except:
            raise self.PageNotFoundException
        return handler(self, exploration, state, **kwargs)

    return test_editor


def require_admin(handler):
    """Decorator that checks if the current user is an admin."""
    def test_admin(self, **kwargs):
        """Checks if the user is logged in and is an admin."""
        if not self.user:
            self.redirect(users.create_login_url(self.request.uri))
            return
        if not users.is_current_user_admin():
            raise self.UnauthorizedUserException(
                '%s is not an admin of this application', self.user)
        return handler(self, **kwargs)

    return test_admin


class BaseHandler(webapp2.RequestHandler):
    """Base class for all Oppia handlers."""

    @webapp2.cached_property
    def jinja2_env(self):
        return feconf.JINJA_ENV

    def __init__(self, request, response):
        # Set self.request, self.response and self.app.
        self.initialize(request, response)

        # Initializes the return dict for the handlers.
        self.values = {
            'debug': feconf.DEBUG,
            'allow_yaml_file_upload': feconf.ALLOW_YAML_FILE_UPLOAD,
        }

        self.user = users.get_current_user()
        if self.user:
            self.values['logout_url'] = (
                users.create_logout_url(self.request.uri))
            self.values['user'] = self.user.nickname()
            self.values['is_admin'] = users.is_current_user_admin()
        else:
            self.values['login_url'] = users.create_login_url(self.request.uri)

    def get(self, *args):
        """Base method to handle GET requests."""
        raise self.PageNotFoundException

    def post(self, *args):
        """Base method to handle POST requests."""
        raise self.PageNotFoundException

    def put(self, *args):
        """Base method to handle PUT requests."""
        raise self.PageNotFoundException

    def delete(self, *args):
        """Base method to handle PUT requests."""
        raise self.PageNotFoundException

    def render_json(self, values):
        self.response.content_type = 'application/json'
        self.response.write(json.dumps(values))

    def render_template(self, filename, values=None):
        if values is None:
            values = self.values

        self.response.cache_control.no_cache = True
        self.response.cache_control.must_revalidate = True
        self.response.expires = 'Mon, 01 Jan 1990 00:00:00 GMT'
        self.response.pragma = 'no-cache'
        self.response.write(self.jinja2_env.get_template(
            filename).render(**values))

    def _render_exception(self, error_code, values):
        assert error_code in [400, 401, 500]
        values['code'] = error_code

        # This checks if the response should be JSON or HTML.
        if self.request.get('payload'):
            self.response.content_type = 'application/json'
            self.response.write(json.dumps(values))
        else:
            self.values.update(values)
            self.render_template('error/error.html')

    def handle_exception(self, exception, debug_mode):
        """Overwrites the default exception handler."""
        logging.info(''.join(traceback.format_exception(*sys.exc_info())))
        logging.error('Exception raised: %s', exception)

        if isinstance(exception, self.PageNotFoundException):
            logging.error('Invalid URL requested: %s', self.request.uri)
            self.error(404)
            self.redirect('/gallery')
            return

        if isinstance(exception, self.NotLoggedInException):
            self.redirect(users.create_login_url(self.request.uri))
            return

        if isinstance(exception, self.UnauthorizedUserException):
            self.error(401)
            self._render_exception(401, {'error': str(exception)})
            return

        if isinstance(exception, self.InvalidInputException):
            self.error(400)
            self._render_exception(400, {'error': str(exception)})
            return

        if isinstance(exception, self.InternalErrorException):
            self.error(500)
            self._render_exception(500, {'error': str(exception)})
            return

        self.error(500)
        self._render_exception(500, {'error': str(exception)})

    class UnauthorizedUserException(Exception):
        """Error class for unauthorized access."""

    class NotLoggedInException(Exception):
        """Error class for users that are not logged in (error code 401)."""

    class InvalidInputException(Exception):
        """Error class for invalid input on the user's side (error code 400)."""

    class PageNotFoundException(Exception):
        """Error class for a page not found error (error code 404)."""

    class InternalErrorException(Exception):
        """Error class for an internal server side error (error code 500)."""
