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
import urllib

from core import counters
from core.domain import config_domain
from core.domain import config_services
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])
import feconf
import jinja_utils
import utils

import jinja2
import webapp2


DEFAULT_CSRF_SECRET = 'oppia csrf secret'
CSRF_SECRET = config_domain.ConfigProperty(
    'oppia_csrf_secret', 'UnicodeString', 'Text used to encrypt CSRF tokens.',
    DEFAULT_CSRF_SECRET)
FULL_SITE_URL = config_domain.ConfigProperty(
    'full_site_url', 'UnicodeString',
    'The full site URL, without a trailing slash',
    default_value='https://FULL.SITE/URL')

BEFORE_END_HEAD_TAG_HOOK = config_domain.ConfigProperty(
    'before_end_head_tag_hook', 'UnicodeString',
    'Code to insert just before the closing </head> tag in all pages.', '')


def require_user(handler):
    """Decorator that checks if a user is associated to the current session."""
    def test_login(self, **kwargs):
        """Checks if the user for the current session is logged in."""
        if not self.user_id:
            self.redirect(current_user_services.create_login_url(
                self.request.uri))
            return
        return handler(self, **kwargs)

    return test_login


def require_registered_as_editor(handler):
    """Decorator that checks if the user has registered as an editor."""
    def test_registered_as_editor(self, **kwargs):
        """Check that the user has registered as an editor."""
        if not self.user_id:
            self.redirect(current_user_services.create_login_url(
                self.request.uri))
            return

        redirect_url = feconf.EDITOR_PREREQUISITES_URL

        if not user_services.has_user_registered_as_editor(self.user_id):
            redirect_url = utils.set_url_query_parameter(
                redirect_url, 'return_url', self.request.uri)
            self.redirect(redirect_url)
            return

        return handler(self, **kwargs)

    return test_registered_as_editor


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
        self.values = {}

        self.user = current_user_services.get_current_user(self.request)
        self.user_id = self.user.user_id() if self.user else None
        self.is_admin = False

        if self.user_id:
            user_settings = user_services.get_or_create_user(
                self.user_id, self.user.email())
            self.values['user_email'] = user_settings.email
            self.values['username'] = user_settings.username
            self.is_admin = current_user_services.is_current_user_admin(
                self.request)

        self.values['is_admin'] = self.is_admin

        if self.request.get('payload'):
            self.payload = json.loads(self.request.get('payload'))
        else:
            self.payload = None

    def unescape_state_name(self, escaped_state_name):
        """Unescape a state name that is encoded with encodeURIComponent."""
        return urllib.unquote(str(escaped_state_name)).decode('utf-8')

    def dispatch(self):
        """Overrides dispatch method in webapp2 superclass."""
        # If the request is to the old demo server, redirect it permanently to
        # the new demo server.
        if self.request.uri.startswith('https://oppiaserver.appspot.com'):
            self.redirect('https://oppiatestserver.appspot.com', True)
            return

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
                        'Your session has expired, and unfortunately your '
                        'changes cannot be saved. Please refresh the page.')
            except Exception as e:
                logging.error(
                    '%s: page name %s, payload %s',
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
        self.response.content_type = 'application/javascript; charset=utf-8'
        self.response.headers['Content-Disposition'] = 'attachment'
        self.response.headers['Strict-Transport-Security'] = (
            'max-age=31536000; includeSubDomains')
        self.response.headers['X-Content-Type-Options'] = 'nosniff'

        json_output = json.dumps(values, cls=utils.JSONEncoderForHTML)
        self.response.write('%s%s' % (feconf.XSSI_PREFIX, json_output))

        # Calculate the processing time of this request.
        duration = datetime.datetime.utcnow() - self.start_time
        processing_time = duration.seconds + duration.microseconds / 1E6

        counters.JSON_RESPONSE_TIME_SECS.inc(increment=processing_time)
        counters.JSON_RESPONSE_COUNT.inc()

    def render_template(
            self, filename, values=None, iframe_restriction='DENY'):
        if values is None:
            values = self.values

        values.update({
            'debug': feconf.DEBUG,
            'INVALID_NAME_CHARS': feconf.INVALID_NAME_CHARS,
            'DEV_MODE': feconf.DEV_MODE,
            'EXPLORATION_STATUS_PRIVATE': (
                rights_manager.EXPLORATION_STATUS_PRIVATE),
            'EXPLORATION_STATUS_PUBLIC': (
                rights_manager.EXPLORATION_STATUS_PUBLIC),
            'EXPLORATION_STATUS_PUBLICIZED': (
                rights_manager.EXPLORATION_STATUS_PUBLICIZED),
            'BEFORE_END_HEAD_TAG_HOOK': jinja2.utils.Markup(
                BEFORE_END_HEAD_TAG_HOOK.value),
            'FULL_SITE_URL': FULL_SITE_URL.value,
        })

        if self.user_id:
            values['logout_url'] = (
                current_user_services.create_logout_url(self.request.uri))
        else:
            values['login_url'] = (
                current_user_services.create_login_url(self.request.uri))

        # Create a new csrf token for inclusion in HTML responses. This assumes
        # that tokens generated in one handler will be sent back to a handler
        # with the same page name.
        values['csrf_token'] = ''
        if self.REQUIRE_PAYLOAD_CSRF_CHECK and self.PAGE_NAME_FOR_CSRF:
            values['csrf_token'] = CsrfTokenManager.create_csrf_token(
                self.user_id, self.PAGE_NAME_FOR_CSRF)

        self.response.cache_control.no_cache = True
        self.response.cache_control.must_revalidate = True
        self.response.headers['Strict-Transport-Security'] = (
            'max-age=31536000; includeSubDomains')
        self.response.headers['X-Content-Type-Options'] = 'nosniff'

        if iframe_restriction is not None:
            if iframe_restriction in ['SAMEORIGIN', 'DENY']:
                self.response.headers['X-Frame-Options'] = iframe_restriction
            else:
                raise Exception(
                    'Invalid X-Frame-Options: %s' % iframe_restriction)

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
            self.render_json(values)
        else:
            self.values.update(values)
            if error_code == 404:
                self.render_template(
                    'error/error_404.html', iframe_restriction=None)
            else:
                self.render_template(
                    'error/error.html', iframe_restriction=None)

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
            self.redirect(
                current_user_services.create_login_url(self.request.uri))
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
        """Error class for invalid input on the user side (error code 400)."""

    class PageNotFoundException(Exception):
        """Error class for a page not found error (error code 404)."""

    class InternalErrorException(Exception):
        """Error class for an internal server side error (error code 500)."""


class CsrfTokenManager(object):
    """Manages page/user tokens in memcache to protect against CSRF."""

    # Max age of the token (2 hours).
    _CSRF_TOKEN_AGE_SECS = 60 * 60 * 2
    # Default user id for non-logged-in users.
    _USER_ID_DEFAULT = 'non_logged_in_user'

    @classmethod
    def init_csrf_secret(cls):
        """Verify that non-default CSRF secret exists; creates one if not."""

        # Any non-default value is fine.
        if CSRF_SECRET.value and CSRF_SECRET.value != DEFAULT_CSRF_SECRET:
            return

        # Initialize to random value.
        config_services.set_property(
            feconf.ADMIN_COMMITTER_ID, CSRF_SECRET.name,
            base64.urlsafe_b64encode(os.urandom(20)))

    @classmethod
    def _create_token(cls, user_id, page_name, issued_on):
        """Creates a digest (string representation) of a token."""
        cls.init_csrf_secret()

        # The token has 4 parts: hash of the actor user id, hash of the page
        # name, hash of the time issued and plain text of the time issued.

        if user_id is None:
            user_id = cls._USER_ID_DEFAULT

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
    def _get_current_time(cls):
        return time.time()

    @classmethod
    def create_csrf_token(cls, user_id, page_name):
        if not page_name:
            raise Exception('Cannot create CSRF token if page name is empty.')
        return cls._create_token(user_id, page_name, cls._get_current_time())

    @classmethod
    def is_csrf_token_valid(cls, user_id, page_name, token):
        """Validate a given CSRF token with the CSRF secret in memcache."""
        try:
            parts = token.split('/')
            if len(parts) != 2:
                return False

            issued_on = long(parts[0])
            age = cls._get_current_time() - issued_on
            if age > cls._CSRF_TOKEN_AGE_SECS:
                return False

            authentic_token = cls._create_token(user_id, page_name, issued_on)
            if authentic_token == token:
                return True

            return False
        except Exception:
            return False
