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

"""Base constants and handlers."""

__author__ = 'Sean Lip'

import base64
import datetime
import hmac
import json
import logging
import os
import sys
import time
import traceback

from core import counters
from core.domain import config_domain
from core.domain import config_services
from core.domain import exp_services
from core.platform import models
import feconf
import jinja_utils
user_services = models.Registry.import_user_services()

import webapp2


DEFAULT_CSRF_SECRET = 'oppia csrf secret'

CSRF_SECRET = config_domain.ConfigProperty(
    'oppia_csrf_secret', str, 'Text used to encrypt CSRF tokens.',
    DEFAULT_CSRF_SECRET)


def require_user(handler):
    """Decorator that checks if a user is associated to the current session."""
    def test_login(self, **kwargs):
        """Checks if the user for the current session is logged in."""
        if not self.user_id:
            self.redirect(user_services.create_login_url(self.request.uri))
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
        if not self.user_id:
            self.redirect(user_services.create_login_url(self.request.uri))
            return

        try:
            exploration = exp_services.get_exploration_by_id(exploration_id)
        except:
            raise self.PageNotFoundException

        if (not user_services.is_current_user_admin(self.request) and
                not exploration.is_editable_by(self.user_id)):
            raise self.UnauthorizedUserException(
                '%s does not have the credentials to edit this exploration.',
                self.user_id)

        if not state_id:
            return handler(self, exploration_id, **kwargs)
        try:
            exp_services.get_state_by_id(exploration_id, state_id)
        except:
            raise self.PageNotFoundException
        return handler(self, exploration_id, state_id, **kwargs)

    return test_editor


def require_admin(handler):
    """Decorator that checks if the current user is an admin."""
    def test_admin(self, **kwargs):
        """Checks if the user is logged in and is an admin."""
        if not self.user_id:
            self.redirect(user_services.create_login_url(self.request.uri))
            return
        if not user_services.is_current_user_admin(self.request):
            raise self.UnauthorizedUserException(
                '%s is not an admin of this application', self.user_id)
        return handler(self, **kwargs)

    return test_admin


class BaseHandler(webapp2.RequestHandler):
    """Base class for all Oppia handlers."""

    # Whether to check POST and PUT payloads for CSRF tokens prior to
    # processing them. Can be overridden by subclasses if this check is
    # not necessary.
    REQUIRE_PAYLOAD_CSRF_CHECK = True
    # Specific page name to use as a key for generating CSRF tokens. This name
    # must be overwritten by subclasses. This represents both the source
    # page name and the destination page name.
    # TODO(sll): A weakness of the current approach is that the source and
    # destination page names have to be the same. Consider fixing this.
    PAGE_NAME_FOR_CSRF = ''

    @webapp2.cached_property
    def jinja2_env(self):
        return jinja_utils.get_jinja_env(feconf.FRONTEND_TEMPLATES_DIR)

    def __init__(self, request, response):
        # Set self.request, self.response and self.app.
        self.initialize(request, response)

        self.start_time = datetime.datetime.utcnow()

        # Initializes the return dict for the handlers.
        self.values = {
            'debug': feconf.DEBUG,
            'allow_yaml_file_upload': feconf.ALLOW_YAML_FILE_UPLOAD,
            'INVALID_NAME_CHARS': feconf.INVALID_NAME_CHARS,
        }

        self.user = user_services.get_current_user(self.request)
        self.user_id = self.user.email() if self.user else None
        if self.user_id:
            self.values['logout_url'] = (
                user_services.create_logout_url(self.request.uri))
            self.values['user'] = self.user.nickname()
            self.values['is_admin'] = user_services.is_current_user_admin(
                self.request)
        else:
            self.values['login_url'] = user_services.create_login_url(
                self.request.uri)

        if self.request.get('payload'):
            self.payload = json.loads(self.request.get('payload'))
        else:
            self.payload = None

    def dispatch(self):
        """Overrides dispatch method in webapp2 superclass."""
        if self.payload and self.REQUIRE_PAYLOAD_CSRF_CHECK:
            try:
                if not self.PAGE_NAME_FOR_CSRF:
                    raise Exception('No CSRF page name specified for this '
                                    'handler.')

                csrf_token = self.request.get('csrf_token')
                if not csrf_token:
                    raise Exception(
                        'Missing CSRF token. Changes were not saved. '
                        'Please report this bug.')

                is_csrf_token_valid = CsrfTokenManager.is_csrf_token_valid(
                    self.user_id, self.PAGE_NAME_FOR_CSRF, csrf_token)

                if not is_csrf_token_valid:
                    raise Exception(
                        'Invalid CSRF token. Changes were not saved. '
                        'Please reload the page.')
            except Exception as e:
                logging.error('%s: page name %s, payload %s',
                    e, self.PAGE_NAME_FOR_CSRF, self.payload)

                return self.handle_exception(e, self.app.debug)

        super(BaseHandler, self).dispatch()

    def get(self, *args, **kwargs):
        """Base method to handle GET requests."""
        raise self.PageNotFoundException

    def post(self, *args):
        """Base method to handle POST requests."""
        raise self.PageNotFoundException

    def put(self, *args):
        """Base method to handle PUT requests."""
        raise self.PageNotFoundException

    def delete(self, *args):
        """Base method to handle DELETE requests."""
        raise self.PageNotFoundException

    def render_json(self, values):
        self.response.content_type = 'application/json'
        self.response.write(json.dumps(values))

        # Calculate the processing time of this request.
        duration = datetime.datetime.utcnow() - self.start_time
        processing_time = duration.seconds + duration.microseconds / 1E6

        counters.JSON_RESPONSE_TIME_SECS.inc(increment=processing_time)
        counters.JSON_RESPONSE_COUNT.inc()

    def render_template(self, filename, values=None):
        if values is None:
            values = self.values

        # Create a new csrf token for inclusion in HTML responses. This assumes
        # that tokens generated in one handler will be sent back to a handler
        # with the same page name.
        values['csrf_token'] = ''
        if self.REQUIRE_PAYLOAD_CSRF_CHECK and self.PAGE_NAME_FOR_CSRF:
            values['csrf_token'] = CsrfTokenManager.create_csrf_token(
                self.user_id, self.PAGE_NAME_FOR_CSRF)

        self.response.cache_control.no_cache = True
        self.response.cache_control.must_revalidate = True
        self.response.expires = 'Mon, 01 Jan 1990 00:00:00 GMT'
        self.response.pragma = 'no-cache'
        self.response.write(self.jinja2_env.get_template(
            filename).render(**values))

        # Calculate the processing time of this request.
        duration = datetime.datetime.utcnow() - self.start_time
        processing_time = duration.seconds + duration.microseconds / 1E6

        counters.HTML_RESPONSE_TIME_SECS.inc(increment=processing_time)
        counters.HTML_RESPONSE_COUNT.inc()

    def _render_exception(self, error_code, values):
        assert error_code in [400, 401, 404, 500]
        values['code'] = error_code

        # This checks if the response should be JSON or HTML.
        if self.payload is not None:
            self.response.content_type = 'application/json'
            self.response.write(json.dumps(values))
        else:
            self.values.update(values)
            if error_code == 404:
                self.render_template('error/error_404.html')
            else:
                self.render_template('error/error.html')

    def handle_exception(self, exception, debug_mode):
        """Overwrites the default exception handler."""
        logging.info(''.join(traceback.format_exception(*sys.exc_info())))
        logging.error('Exception raised: %s', exception)

        if isinstance(exception, self.PageNotFoundException):
            logging.error('Invalid URL requested: %s', self.request.uri)
            self.error(404)
            self._render_exception(404, {'error': 'Page not found.'})
            return

        if isinstance(exception, self.NotLoggedInException):
            self.redirect(user_services.create_login_url(self.request.uri))
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


class CsrfTokenManager(object):
    """Manages page/user tokens in memcache to protect against CSRF."""

    # Max age of the token (2 hours).
    CSRF_TOKEN_AGE_SECS = 60 * 60 * 2
    # Default user id for non-logged-in users.
    USER_ID_DEFAULT = 'non_logged_in_user'

    @classmethod
    def init_csrf_secret(cls):
        """Verify that non-default CSRF secret exists; creates one if not."""

        # Any non-default value is fine.
        if CSRF_SECRET.value and CSRF_SECRET.value != DEFAULT_CSRF_SECRET:
            return

        # Initialize to random value.
        config_services.set_property(
            CSRF_SECRET.name, base64.urlsafe_b64encode(os.urandom(20)))

    @classmethod
    def _create_token(cls, user_id, page_name, issued_on):
        """Creates a digest (string representation) of a token."""
        cls.init_csrf_secret()

        # The token has 4 parts: hash of the actor user id, hash of the page
        # name, hash of the time issued and plain text of the time issued.

        if user_id is None:
            user_id = cls.USER_ID_DEFAULT

        # Round time to seconds.
        issued_on = long(issued_on)

        digester = hmac.new(str(CSRF_SECRET.value))
        digester.update(str(user_id))
        digester.update(':')
        digester.update(str(page_name))
        digester.update(':')
        digester.update(str(issued_on))

        digest = digester.digest()
        token = '%s/%s' % (issued_on, base64.urlsafe_b64encode(digest))

        return token

    @classmethod
    def create_csrf_token(cls, user_id, page_name):
        if not page_name:
            raise Exception('Cannot create CSRF token if page name is empty.')
        return cls._create_token(user_id, page_name, time.time())

    @classmethod
    def is_csrf_token_valid(cls, user_id, page_name, token):
        """Validate a given CSRF token with the CSRF secret in memcache."""
        try:
            parts = token.split('/')
            if len(parts) != 2:
                return False

            issued_on = long(parts[0])
            age = time.time() - issued_on
            if age > cls.CSRF_TOKEN_AGE_SECS:
                return False

            authentic_token = cls._create_token(user_id, page_name, issued_on)
            if authentic_token == token:
                return True

            return False
        except Exception:
            return False
