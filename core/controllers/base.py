# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

import base64
import Cookie
import datetime
import hmac
import json
import logging
import os
import sys
import time
import traceback
import urlparse

import jinja2
import webapp2
from google.appengine.api import users

from core import counters
from core.domain import config_domain
from core.domain import config_services
from core.domain import obj_services
from core.domain import rights_manager
from core.domain import rte_component_registry
from core.domain import user_services
from core.platform import models
import feconf
import jinja_utils
import utils

current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])

ONE_DAY_AGO_IN_SECS = -24 * 60 * 60
DEFAULT_CSRF_SECRET = 'oppia csrf secret'
CSRF_SECRET = config_domain.ConfigProperty(
    'oppia_csrf_secret', {'type': 'unicode'},
    'Text used to encrypt CSRF tokens.', DEFAULT_CSRF_SECRET)
SITE_NAME = config_domain.ConfigProperty(
    'site_name', {'type': 'unicode'}, 'The site name', 'SITE_NAME')

BEFORE_END_HEAD_TAG_HOOK = config_domain.ConfigProperty(
    'before_end_head_tag_hook', {
        'type': 'unicode',
        'ui_config': {
            'rows': 7,
        },
    },
    'Code to insert just before the closing </head> tag in all pages.', '')

SITE_FEEDBACK_FORM_URL = config_domain.ConfigProperty(
    'site_feedback_form_url', {'type': 'unicode'},
    'Site feedback form URL (leave blank if there is no such form)', '')


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


def require_moderator(handler):
    """Decorator that checks if the current user is a moderator."""
    def test_is_moderator(self, **kwargs):
        """Check that the user is a moderator."""
        if not self.user_id:
            self.redirect(current_user_services.create_login_url(
                self.request.uri))
            return

        if not rights_manager.Actor(self.user_id).is_moderator():
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')

        return handler(self, **kwargs)
    return test_is_moderator


def require_fully_signed_up(handler):
    """Decorator that checks if the user is logged in and has completed the
    signup process. If any of these checks fail, an UnauthorizedUserException
    is raised.
    """

    def test_registered_as_editor(self, **kwargs):
        """Check that the user has registered as an editor."""
        if (not self.user_id
                or self.username in config_domain.BANNED_USERNAMES.value
                or not user_services.has_fully_registered(self.user_id)):
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')

        return handler(self, **kwargs)

    return test_registered_as_editor


def _clear_login_cookies(response_headers):
    # AppEngine sets the ACSID cookie for http:// and the SACSID cookie
    # for https:// . We just unset both below.
    cookie = Cookie.SimpleCookie()
    for cookie_name in ['ACSID', 'SACSID']:
        cookie = Cookie.SimpleCookie()
        cookie[cookie_name] = ''
        cookie[cookie_name]['expires'] = (
            datetime.datetime.utcnow() +
            datetime.timedelta(seconds=ONE_DAY_AGO_IN_SECS)
        ).strftime('%a, %d %b %Y %H:%M:%S GMT')
        response_headers.add_header(*cookie.output().split(': ', 1))


class LogoutPage(webapp2.RequestHandler):

    def get(self):
        """Logs the user out, and returns them to a specified page or the home
        page.
        """
        # The str conversion is needed, otherwise an InvalidResponseError
        # asking for the 'Location' header value to be str instead of
        # 'unicode' will result.
        url_to_redirect_to = str(self.request.get('return_url') or '/')
        _clear_login_cookies(self.response.headers)

        if feconf.DEV_MODE:
            self.redirect(users.create_logout_url(url_to_redirect_to))
        else:
            self.redirect(url_to_redirect_to)


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
    # Whether the page includes a button for creating explorations. If this is
    # set to True, a CSRF token for that button will be generated. This is
    # needed because "create exploration" requests can come from multiple
    # pages.
    PAGE_HAS_CREATE_EXP_REQUEST = False
    # Whether to redirect requests corresponding to a logged-in user who has
    # not completed signup in to the signup page. This ensures that logged-in
    # users have agreed to the latest terms.
    REDIRECT_UNFINISHED_SIGNUPS = True

    @webapp2.cached_property
    def jinja2_env(self):
        return jinja_utils.get_jinja_env(feconf.FRONTEND_TEMPLATES_DIR)

    def __init__(self, request, response):  # pylint: disable=super-init-not-called
        # Set self.request, self.response and self.app.
        self.initialize(request, response)

        self.start_time = datetime.datetime.utcnow()

        # Initializes the return dict for the handlers.
        self.values = {}

        self.user = current_user_services.get_current_user()
        self.user_id = current_user_services.get_user_id(
            self.user) if self.user else None
        self.username = None
        self.has_seen_editor_tutorial = False
        self.partially_logged_in = False
        self.values['profile_picture_data_url'] = None
        self.preferred_site_language_code = None

        if self.user_id:
            email = current_user_services.get_user_email(self.user)
            user_settings = user_services.get_or_create_user(
                self.user_id, email)
            self.values['user_email'] = user_settings.email

            if (self.REDIRECT_UNFINISHED_SIGNUPS and not
                    user_services.has_fully_registered(self.user_id)):
                _clear_login_cookies(self.response.headers)
                self.partially_logged_in = True
                self.user_id = None
            else:
                self.username = user_settings.username
                self.preferred_site_language_code = (
                    user_settings.preferred_site_language_code)
                self.values['username'] = self.username
                self.values['profile_picture_data_url'] = (
                    user_settings.profile_picture_data_url)
                if user_settings.last_started_state_editor_tutorial:
                    self.has_seen_editor_tutorial = True

        self.is_moderator = rights_manager.Actor(self.user_id).is_moderator()
        self.is_admin = rights_manager.Actor(self.user_id).is_admin()
        self.is_super_admin = (
            current_user_services.is_current_user_super_admin())

        self.values['is_moderator'] = self.is_moderator
        self.values['is_admin'] = self.is_admin
        self.values['is_super_admin'] = self.is_super_admin

        if self.request.get('payload'):
            self.payload = json.loads(self.request.get('payload'))
        else:
            self.payload = None

    def dispatch(self):
        """Overrides dispatch method in webapp2 superclass."""
        # If the request is to the old demo server, redirect it permanently to
        # the new demo server.
        if self.request.uri.startswith('https://oppiaserver.appspot.com'):
            self.redirect('https://oppiatestserver.appspot.com', True)
            return

        # In DEV_MODE, clearing cookies does not log out the user, so we
        # force-clear them by redirecting to the logout URL.
        if feconf.DEV_MODE and self.partially_logged_in:
            self.redirect(users.create_logout_url(self.request.uri))
            return

        if self.payload is not None and self.REQUIRE_PAYLOAD_CSRF_CHECK:
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
                    raise self.UnauthorizedUserException(
                        'Your session has expired, and unfortunately your '
                        'changes cannot be saved. Please refresh the page.')
            except Exception as e:
                logging.error(
                    '%s: page name %s, payload %s',
                    e, self.PAGE_NAME_FOR_CSRF, self.payload)

                return self.handle_exception(e, self.app.debug)

        super(BaseHandler, self).dispatch()

    def get(self, *args, **kwargs):  # pylint: disable=unused-argument
        """Base method to handle GET requests."""
        raise self.PageNotFoundException

    def post(self, *args):  # pylint: disable=unused-argument
        """Base method to handle POST requests."""
        raise self.PageNotFoundException

    def put(self, *args):  # pylint: disable=unused-argument
        """Base method to handle PUT requests."""
        raise self.PageNotFoundException

    def delete(self, *args):  # pylint: disable=unused-argument
        """Base method to handle DELETE requests."""
        raise self.PageNotFoundException

    def render_json(self, values):
        self.response.content_type = 'application/javascript; charset=utf-8'
        self.response.headers['Content-Disposition'] = (
            'attachment; filename="oppia-attachment.txt"')
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
            self, filename, values=None, iframe_restriction='DENY',
            redirect_url_on_logout=None):
        if values is None:
            values = self.values

        scheme, netloc, path, _, _ = urlparse.urlsplit(self.request.uri)

        values.update({
            'ALL_CATEGORIES': feconf.ALL_CATEGORIES,
            'ALL_LANGUAGE_CODES': feconf.ALL_LANGUAGE_CODES,
            'BEFORE_END_HEAD_TAG_HOOK': jinja2.utils.Markup(
                BEFORE_END_HEAD_TAG_HOOK.value),
            'CAN_SEND_ANALYTICS_EVENTS': feconf.CAN_SEND_ANALYTICS_EVENTS,
            'DEFAULT_LANGUAGE_CODE': feconf.ALL_LANGUAGE_CODES[0]['code'],
            'DEV_MODE': feconf.DEV_MODE,
            'DOMAIN_URL': '%s://%s' % (scheme, netloc),
            'ACTIVITY_STATUS_PRIVATE': (
                rights_manager.ACTIVITY_STATUS_PRIVATE),
            'ACTIVITY_STATUS_PUBLIC': (
                rights_manager.ACTIVITY_STATUS_PUBLIC),
            'ACTIVITY_STATUS_PUBLICIZED': (
                rights_manager.ACTIVITY_STATUS_PUBLICIZED),
            'FULL_URL': '%s://%s/%s' % (scheme, netloc, path),
            'INVALID_NAME_CHARS': feconf.INVALID_NAME_CHARS,
            # TODO(sll): Consider including the obj_editor html directly as
            # part of the base HTML template?
            'OBJECT_EDITORS_JS': jinja2.utils.Markup(
                obj_services.get_all_object_editor_js_templates()),
            'RTE_COMPONENT_SPECS': (
                rte_component_registry.Registry.get_all_specs()),
            'SITE_FEEDBACK_FORM_URL': SITE_FEEDBACK_FORM_URL.value,
            'SITE_NAME': SITE_NAME.value,
            'SUPPORTED_SITE_LANGUAGES': feconf.SUPPORTED_SITE_LANGUAGES,
            'SYSTEM_USERNAMES': feconf.SYSTEM_USERNAMES,
            'user_is_logged_in': user_services.has_fully_registered(
                self.user_id),
            'preferred_site_language_code': self.preferred_site_language_code
        })

        if 'meta_name' not in values:
            values['meta_name'] = 'Personalized Online Learning from Oppia'

        if 'meta_description' not in values:
            values['meta_description'] = (
                'Oppia is a free, open-source learning platform. Join the '
                'community to create or try an exploration today!')

        if redirect_url_on_logout is None:
            redirect_url_on_logout = self.request.uri
        if self.user_id:
            values['logout_url'] = (
                current_user_services.create_logout_url(
                    redirect_url_on_logout))
        else:
            target_url = (
                '/' if self.request.uri.endswith(feconf.SPLASH_URL)
                else self.request.uri)
            values['login_url'] = (
                current_user_services.create_login_url(target_url))

        # Create a new csrf token for inclusion in HTML responses. This assumes
        # that tokens generated in one handler will be sent back to a handler
        # with the same page name.
        values['csrf_token'] = ''
        values['csrf_token_create_exploration'] = ''
        values['csrf_token_i18n'] = (
            CsrfTokenManager.create_csrf_token(
                self.user_id, feconf.CSRF_PAGE_NAME_I18N))

        if self.REQUIRE_PAYLOAD_CSRF_CHECK and self.PAGE_NAME_FOR_CSRF:
            values['csrf_token'] = CsrfTokenManager.create_csrf_token(
                self.user_id, self.PAGE_NAME_FOR_CSRF)
        if self.PAGE_HAS_CREATE_EXP_REQUEST:
            values['csrf_token_create_exploration'] = (
                CsrfTokenManager.create_csrf_token(
                    self.user_id, feconf.CSRF_PAGE_NAME_CREATE_EXPLORATION))

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
            self.render_template(
                'error/error.html', iframe_restriction=None)

    def handle_exception(self, exception, unused_debug_mode):
        """Overwrites the default exception handler."""
        logging.info(''.join(traceback.format_exception(*sys.exc_info())))
        logging.error('Exception raised: %s', exception)

        if isinstance(exception, self.PageNotFoundException):
            logging.error('Invalid URL requested: %s', self.request.uri)
            self.error(404)
            self._render_exception(404, {
                'error': 'Could not find the page %s.' % self.request.uri})
            return

        if isinstance(exception, self.NotLoggedInException):
            self.redirect(
                current_user_services.create_login_url(self.request.uri))
            return

        if isinstance(exception, self.UnauthorizedUserException):
            self.error(401)
            self._render_exception(401, {'error': unicode(exception)})
            return

        if isinstance(exception, self.InvalidInputException):
            self.error(400)
            self._render_exception(400, {'error': unicode(exception)})
            return

        if isinstance(exception, self.InternalErrorException):
            self.error(500)
            self._render_exception(500, {'error': unicode(exception)})
            return

        self.error(500)
        self._render_exception(500, {'error': unicode(exception)})

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


class Error404Handler(BaseHandler):
    """Handles 404 errors."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False


class CsrfTokenManager(object):
    """Manages page/user tokens in memcache to protect against CSRF."""

    # Max age of the token (48 hours).
    _CSRF_TOKEN_AGE_SECS = 60 * 60 * 48
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
            feconf.SYSTEM_COMMITTER_ID, CSRF_SECRET.name,
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
