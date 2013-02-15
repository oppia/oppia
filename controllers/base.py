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
import webapp2

import feconf
from models.models import Exploration, State
import utils

from google.appengine.api import users


def require_user(handler):
    """Decorator that checks if a user is associated to the current session."""
    def test_login(self, **kwargs):
        """Checks if the user for the current session is logged in."""
        user = users.get_current_user()
        if not user:
            self.redirect(users.create_login_url(self.request.uri))
            return
        return handler(self, user, **kwargs)

    return test_login


def require_editor(handler):
    """Decorator that checks if the user can edit the given entity."""
    def test_editor(self, exploration_id, state_id=None, **kwargs):
        """Gets the user and exploration id if the user can edit it.

        Returns:
            The user and exploration instance, if the user is authorized to edit
            this exploration. Also, the state instance, if one is supplied.

        Raises:
            self.NotLoggedInException: if there is no current user.
            self.UnauthorizedUserException: if the user exists but does not have
                the right credentials.
        """
        user = users.get_current_user()
        if not user:
            self.redirect(users.create_login_url(self.request.uri))
            return

        exploration = utils.GetEntity(Exploration, exploration_id)
        if not utils.CheckAuthorship(user, exploration):
            raise self.UnauthorizedUserException(
                '%s does not have the credentials to edit this exploration.',
                user)

        if not state_id:
            return handler(self, user, exploration, **kwargs)
        state = utils.GetEntity(State, state_id)
        return handler(self, user, exploration, state, **kwargs)

    return test_editor


class BaseHandler(webapp2.RequestHandler):
    """Base class for all Oppia handlers."""
    def __init__(self, request, response):
        # Set self.request, self.response and self.app.
        self.initialize(request, response)

        # Initializes the return dicts for the handlers.
        self.values = {
            'css': utils.GetCssFile('oppia'),
            'debug': feconf.DEBUG,
        }
        self.data_values = {'debug': feconf.DEBUG}

        user = users.get_current_user()
        if user:
            self.values.update({
                'logout_url': users.create_logout_url(self.request.uri),
                'user': str(user),
            })
            self.data_values.update({'user': str(user)})
        else:
            login_url = users.create_login_url(self.request.uri)
            self.values['login_url'] = login_url
            self.data_values['login_url'] = login_url

    def handle_exception(self, exception, debug_mode):
        """Overwrites the default exception handler."""
        logging.info(''.join(traceback.format_exception(*sys.exc_info())))
        logging.error('Exception raised: %s', exception)

        if isinstance(exception, self.NotLoggedInException):
            self.redirect(users.create_login_url(self.request.uri))
            return

        if isinstance(exception, self.UnauthorizedUserException):
            self.error(401)
            self.response.out.write(json.dumps(
                {'code': '401 Unauthorized', 'error': str(exception)}))
            return

        if isinstance(exception, self.InvalidInputException):
            self.error(400)
            self.response.out.write(json.dumps(
                {'code': '400 Bad Request', 'error': str(exception)}))
            return

        webapp2.RequestHandler.handle_exception(self, exception, debug_mode)
        logging.error('Exception was not handled: %s', exception)

    class UnauthorizedUserException(Exception):
        """Error class for unauthorized access."""

    class NotLoggedInException(Exception):
        """Error class for users that are not logged in (error code 401)."""

    class InvalidInputException(Exception):
        """Error class for invalid input on the user's side (error code 400)."""
