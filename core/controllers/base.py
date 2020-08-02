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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import base64
import datetime
import hmac
import http.cookies
import json
import logging
import os
import sys
import time
import traceback

import backports.functools_lru_cache
from core.domain import config_domain
from core.domain import config_services
from core.domain import user_services
from core.platform import models
import feconf
import python_utils
import utils

import webapp2

current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])

ONE_DAY_AGO_IN_SECS = -24 * 60 * 60
DEFAULT_CSRF_SECRET = 'oppia csrf secret'
CSRF_SECRET = config_domain.ConfigProperty(
    'oppia_csrf_secret', {'type': 'unicode'},
    'Text used to encrypt CSRF tokens.', DEFAULT_CSRF_SECRET)


def _clear_login_cookies(response_headers):
    """Clears login cookies from the given response headers.

    Args:
        response_headers: webapp2.ResponseHeaders. Response headers are used
            to give a more detailed context of the response.
    """
    # App Engine sets the ACSID cookie for http:// and the SACSID cookie
    # for https:// . We just unset both below. We also unset dev_appserver_login
    # cookie used in local server.
    for cookie_name in [b'ACSID', b'SACSID', b'dev_appserver_login']:
        cookie = http.cookies.SimpleCookie()
        cookie[cookie_name] = ''
        cookie[cookie_name]['expires'] = (
            datetime.datetime.utcnow() +
            datetime.timedelta(seconds=ONE_DAY_AGO_IN_SECS)
        ).strftime('%a, %d %b %Y %H:%M:%S GMT')
        response_headers.add_header(*cookie.output().split(b': ', 1))


@backports.functools_lru_cache.lru_cache(maxsize=128)
def load_template(filename):
    """Return the HTML file contents at filepath.

    Args:
        filename: str. Name of the requested HTML file.

    Returns:
        str. The HTML file content.
    """
    filepath = os.path.join(feconf.FRONTEND_TEMPLATES_DIR, filename)
    with python_utils.open_file(filepath, 'r') as f:
        html_text = f.read()
    return html_text


class LogoutPage(webapp2.RequestHandler):
    """Class which handles the logout URL."""

    def get(self):
        """Logs the user out, and returns them to a specified follow-up
        page (or the home page if no follow-up page is specified).
        """

        _clear_login_cookies(self.response.headers)
        url_to_redirect_to = (
            python_utils.convert_to_bytes(
                self.request.get('redirect_url', '/')))
        self.redirect(url_to_redirect_to)


class UserFacingExceptions(python_utils.OBJECT):
    """This class contains all the exception class definitions used."""

    class NotLoggedInException(Exception):
        """Error class for users that are not logged in (error code 401)."""

        pass


    class InvalidInputException(Exception):
        """Error class for invalid input on the user side (error code 400)."""

        pass


    class UnauthorizedUserException(Exception):
        """Error class for unauthorized access."""

        pass


    class PageNotFoundException(Exception):
        """Error class for a page not found error (error code 404)."""

        pass


    class InternalErrorException(Exception):
        """Error class for an internal server side error (error code 500)."""

        pass


    class TemporaryMaintenanceException(Exception):
        """Error class for when the server is currently down for temporary
        maintenance (error code 503).
        """

        pass


class BaseHandler(webapp2.RequestHandler):
    """Base class for all Oppia handlers."""

    # Whether to check POST and PUT payloads for CSRF tokens prior to
    # processing them. Can be overridden by subclasses if this check is
    # not necessary.
    REQUIRE_PAYLOAD_CSRF_CHECK = True
    # Whether to redirect requests corresponding to a logged-in user who has
    # not completed signup in to the signup page. This ensures that logged-in
    # users have agreed to the latest terms.
    REDIRECT_UNFINISHED_SIGNUPS = True

    # What format the get method returns when exception raised, json or html.
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_HTML
    POST_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    PUT_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    DELETE_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def __init__(self, request, response):  # pylint: disable=super-init-not-called
        # Set self.request, self.response and self.app.
        self.initialize(request, response)

        self.start_time = datetime.datetime.utcnow()

        # Initializes the return dict for the handlers.
        self.values = {}

        if self.request.get('payload'):
            self.payload = json.loads(self.request.get('payload'))
        else:
            self.payload = None
        self.iframed = False

        self.is_super_admin = (
            current_user_services.is_current_user_super_admin())
        if feconf.ENABLE_MAINTENANCE_MODE and not self.is_super_admin:
            return

        self.gae_id = current_user_services.get_current_gae_id()
        self.user_id = None
        self.username = None
        self.partially_logged_in = False
        self.user_is_scheduled_for_deletion = False

        if self.gae_id:
            user_settings = user_services.get_user_settings_by_gae_id(
                self.gae_id, strict=False)
            if user_settings is None:
                email = current_user_services.get_current_user_email()
                user_settings = user_services.create_new_user(
                    self.gae_id, email)
            self.values['user_email'] = user_settings.email
            self.user_id = user_settings.user_id

            if user_settings.deleted:
                self.user_is_scheduled_for_deletion = user_settings.deleted
            elif (self.REDIRECT_UNFINISHED_SIGNUPS and not
                  user_services.has_fully_registered_account(
                      user_settings.user_id)):
                self.partially_logged_in = True
            else:
                self.username = user_settings.username
                self.values['username'] = self.username
                # In order to avoid too many datastore writes, we do not bother
                # recording a log-in if the current time is sufficiently close
                # to the last log-in time.
                if (user_settings.last_logged_in is None or
                        not utils.are_datetimes_close(
                            datetime.datetime.utcnow(),
                            user_settings.last_logged_in)):
                    user_services.record_user_logged_in(self.user_id)

        self.role = (
            feconf.ROLE_ID_GUEST
            if self.user_id is None else user_settings.role)
        self.user = user_services.UserActionsInfo(self.user_id)

        self.values['is_moderator'] = user_services.is_at_least_moderator(
            self.user_id)
        self.values['is_admin'] = user_services.is_admin(self.user_id)
        self.values['is_topic_manager'] = (
            user_services.is_topic_manager(self.user_id))
        self.values['is_super_admin'] = self.is_super_admin

    def dispatch(self):
        """Overrides dispatch method in webapp2 superclass.

        Raises:
            Exception. The CSRF token is missing.
            UnauthorizedUserException. The CSRF token is invalid.
        """
        # If the request is to the old demo server, redirect it permanently to
        # the new demo server.
        if self.request.uri.startswith('https://oppiaserver.appspot.com'):
            self.redirect(
                b'https://oppiatestserver.appspot.com', permanent=True)
            return

        if feconf.ENABLE_MAINTENANCE_MODE and not self.is_super_admin:
            self.handle_exception(
                self.TemporaryMaintenanceException(
                    'Oppia is currently being upgraded, and the site should '
                    'be up and running again in a few hours. '
                    'Thanks for your patience!'),
                self.app.debug)
            return

        if self.user_is_scheduled_for_deletion:
            self.redirect(
                '/logout?redirect_url=%s' % feconf.PENDING_ACCOUNT_DELETION_URL)
            return

        if self.partially_logged_in:
            self.redirect('/logout?redirect_url=%s' % self.request.uri)
            return

        if self.payload is not None and self.REQUIRE_PAYLOAD_CSRF_CHECK:
            try:
                # If user opens a new tab during signup process, the user_id
                # parameter is set to None and this causes the signup session
                # to expire. The code here checks if user is on the signup
                # page and the user_id is None, if that is the case an exception
                # is raised which is handled by the frontend by showing a
                # continue to registration modal.
                if 'signup' in self.request.uri and not self.user_id:
                    raise self.UnauthorizedUserException(
                        'Registration session expired.')
                csrf_token = self.request.get('csrf_token')
                if not csrf_token:
                    raise self.UnauthorizedUserException(
                        'Missing CSRF token. Changes were not saved. '
                        'Please report this bug.')

                is_csrf_token_valid = CsrfTokenManager.is_csrf_token_valid(
                    self.user_id, csrf_token)

                if not is_csrf_token_valid:
                    raise self.UnauthorizedUserException(
                        'Your session has expired, and unfortunately your '
                        'changes cannot be saved. Please refresh the page.')
            except Exception as e:
                logging.error('%s: payload %s', e, self.payload)

                self.handle_exception(e, self.app.debug)
                return

        super(BaseHandler, self).dispatch()

    def get(self, *args, **kwargs):  # pylint: disable=unused-argument
        """Base method to handle GET requests.

        Raises:
            PageNotFoundException. Page not found error (error code 404).
        """
        raise self.PageNotFoundException

    def post(self, *args):  # pylint: disable=unused-argument
        """Base method to handle POST requests.

        Raises:
            PageNotFoundException. Page not found error (error code 404).
        """
        raise self.PageNotFoundException

    def put(self, *args):  # pylint: disable=unused-argument
        """Base method to handle PUT requests.

        Raises:
            PageNotFoundException. Page not found error (error code 404).
        """
        raise self.PageNotFoundException

    def delete(self, *args):  # pylint: disable=unused-argument
        """Base method to handle DELETE requests.

        Raises:
            PageNotFoundException. Page not found error (error code 404).
        """
        raise self.PageNotFoundException

    def render_json(self, values):
        """Prepares JSON response to be sent to the client.

        Args:
            values: dict. The key-value pairs to encode in the JSON response.
        """
        self.response.content_type = b'application/json; charset=utf-8'
        self.response.headers[b'Content-Disposition'] = (
            b'attachment; filename="oppia-attachment.txt"')
        self.response.headers[b'Strict-Transport-Security'] = (
            b'max-age=31536000; includeSubDomains')
        self.response.headers[b'X-Content-Type-Options'] = b'nosniff'
        self.response.headers[b'X-Xss-Protection'] = b'1; mode=block'

        json_output = json.dumps(values, cls=utils.JSONEncoderForHTML)
        self.response.write('%s%s' % (feconf.XSSI_PREFIX, json_output))

    def render_downloadable_file(self, values, filename, content_type):
        """Prepares downloadable content to be sent to the client.

        Args:
            values: dict. The key-value pairs to include in the response.
            filename: str. The name of the file to be rendered.
            content_type: str. The type of file to be rendered.
        """
        self.response.headers[b'Content-Type'] = python_utils.convert_to_bytes(
            content_type)
        self.response.headers[
            b'Content-Disposition'] = python_utils.convert_to_bytes(
                'attachment; filename=%s' % filename)
        self.response.write(values)

    def render_template(self, filepath, iframe_restriction='DENY'):
        """Prepares an HTML response to be sent to the client.

        Args:
            filepath: str. The template filepath.
            iframe_restriction: str or None. Possible values are
                'DENY' and 'SAMEORIGIN':

                DENY: Strictly prevents the template to load in an iframe.
                SAMEORIGIN: The template can only be displayed in a frame
                    on the same origin as the page itself.
        """
        self.response.cache_control.no_cache = True
        self.response.cache_control.must_revalidate = True
        self.response.headers[b'Strict-Transport-Security'] = (
            b'max-age=31536000; includeSubDomains')
        self.response.headers[b'X-Content-Type-Options'] = b'nosniff'
        self.response.headers[b'X-Xss-Protection'] = b'1; mode=block'

        if iframe_restriction is not None:
            if iframe_restriction in ['SAMEORIGIN', 'DENY']:
                self.response.headers[
                    b'X-Frame-Options'] = python_utils.convert_to_bytes(
                        iframe_restriction)
            else:
                raise Exception(
                    'Invalid X-Frame-Options: %s' % iframe_restriction)

        self.response.expires = 'Mon, 01 Jan 1990 00:00:00 GMT'
        self.response.pragma = 'no-cache'

        self.response.write(load_template(filepath))

    def _render_exception_json_or_html(self, return_type, values):
        """Renders an error page, or an error JSON response.

        Args:
            return_type: str. Indicator to return JSON or HTML.
            values: dict. The key-value pairs to include in the response.
        """

        method = self.request.environ['REQUEST_METHOD']

        if return_type == feconf.HANDLER_TYPE_HTML and method == 'GET':
            self.values.update(values)
            if self.iframed:
                self.render_template(
                    'error-iframed.mainpage.html', iframe_restriction=None)
            elif values['status_code'] == 503:
                self.render_template('maintenance-page.mainpage.html')
            else:
                self.render_template(
                    'error-page-%s.mainpage.html' % values['status_code'])
        else:
            if return_type != feconf.HANDLER_TYPE_JSON and (
                    return_type != feconf.HANDLER_TYPE_DOWNLOADABLE):
                logging.warning(
                    'Not a recognized return type: defaulting to render JSON.')
            self.render_json(values)

    def _render_exception(self, error_code, values):
        """Renders an error page, or an error JSON response.

        Args:
            error_code: int. The HTTP status code (expected to be one of
                400, 401, 404 or 500).
            values: dict. The key-value pairs to include in the response.
        """
        # The error codes here should be in sync with the error pages
        # generated via webpack.common.config.ts.
        assert error_code in [400, 401, 404, 500, 503]
        values['status_code'] = error_code
        method = self.request.environ['REQUEST_METHOD']

        if method == 'GET':
            self._render_exception_json_or_html(
                self.GET_HANDLER_ERROR_RETURN_TYPE, values)
        elif method == 'POST':
            self._render_exception_json_or_html(
                self.POST_HANDLER_ERROR_RETURN_TYPE, values)
        elif method == 'PUT':
            self._render_exception_json_or_html(
                self.PUT_HANDLER_ERROR_RETURN_TYPE, values)
        elif method == 'DELETE':
            self._render_exception_json_or_html(
                self.DELETE_HANDLER_ERROR_RETURN_TYPE, values)
        else:
            logging.warning('Not a recognized request method.')
            self._render_exception_json_or_html(None, values)

    def handle_exception(self, exception, unused_debug_mode):
        """Overwrites the default exception handler.

        Args:
            exception: Exception. The exception that was thrown.
            unused_debug_mode: bool. True if the web application is running
                in debug mode.
        """
        if isinstance(exception, self.NotLoggedInException):
            # This checks if the response should be JSON or HTML.
            # For GET requests, there is no payload, so we check against
            # GET_HANDLER_ERROR_RETURN_TYPE.
            # Otherwise, we check whether self.payload exists.
            if (self.payload is not None or
                    self.GET_HANDLER_ERROR_RETURN_TYPE ==
                    feconf.HANDLER_TYPE_JSON):
                self.error(401)
                self._render_exception(
                    401, {
                        'error': (
                            'You must be logged in to access this resource.')})
            else:
                self.redirect(
                    current_user_services.create_login_url(self.request.uri))
            return

        logging.info(b''.join(traceback.format_exception(*sys.exc_info())))

        if isinstance(exception, self.PageNotFoundException):
            logging.warning('Invalid URL requested: %s', self.request.uri)
            self.error(404)
            self._render_exception(
                404, {
                    'error': 'Could not find the page %s.' % self.request.uri})
            return

        logging.error('Exception raised: %s', exception)

        if isinstance(exception, self.UnauthorizedUserException):
            self.error(401)
            self._render_exception(401, {'error': python_utils.convert_to_bytes(
                exception)})
            return

        if isinstance(exception, self.InvalidInputException):
            self.error(400)
            self._render_exception(400, {'error': python_utils.convert_to_bytes(
                exception)})
            return

        if isinstance(exception, self.InternalErrorException):
            self.error(500)
            self._render_exception(500, {'error': python_utils.convert_to_bytes(
                exception)})
            return

        if isinstance(exception, self.TemporaryMaintenanceException):
            self.error(503)
            self._render_exception(503, {'error': python_utils.convert_to_bytes(
                exception)})
            return

        self.error(500)
        self._render_exception(
            500, {'error': python_utils.convert_to_bytes(exception)})

    InternalErrorException = UserFacingExceptions.InternalErrorException
    InvalidInputException = UserFacingExceptions.InvalidInputException
    NotLoggedInException = UserFacingExceptions.NotLoggedInException
    PageNotFoundException = UserFacingExceptions.PageNotFoundException
    UnauthorizedUserException = UserFacingExceptions.UnauthorizedUserException
    TemporaryMaintenanceException = (
        UserFacingExceptions.TemporaryMaintenanceException)


class Error404Handler(BaseHandler):
    """Handles 404 errors."""

    pass


class CsrfTokenManager(python_utils.OBJECT):
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
    def _create_token(cls, user_id, issued_on):
        """Creates a new CSRF token.

        Args:
            user_id: str|None. The user_id for which the token is generated.
            issued_on: float. The timestamp at which the token was issued.

        Returns:
            str. The generated CSRF token.
        """
        cls.init_csrf_secret()

        # The token has 4 parts: hash of the actor user id, hash of the page
        # name, hash of the time issued and plain text of the time issued.

        if user_id is None:
            user_id = cls._USER_ID_DEFAULT

        # Round time to seconds.
        issued_on = int(issued_on)

        digester = hmac.new(python_utils.convert_to_bytes(CSRF_SECRET.value))
        digester.update(python_utils.convert_to_bytes(user_id))
        digester.update(':')
        digester.update(python_utils.convert_to_bytes(issued_on))

        digest = digester.digest()
        token = '%s/%s' % (issued_on, base64.urlsafe_b64encode(digest))

        return token

    @classmethod
    def _get_current_time(cls):
        """Returns the current server time.

        Returns:
            float. The time in seconds as floating point number.
        """
        return time.time()

    @classmethod
    def create_csrf_token(cls, user_id):
        """Creates a CSRF token for the given user_id.

        Args:
            user_id: str|None. The user_id for whom the token is generated.

        Returns:
            str. The generated CSRF token.
        """
        return cls._create_token(user_id, cls._get_current_time())

    @classmethod
    def is_csrf_token_valid(cls, user_id, token):
        """Validates a given CSRF token.

        Args:
            user_id: str|None. The user_id to validate the CSRF token against.
            token: str. The CSRF token to validate.

        Returns:
            bool. Whether the given CSRF token is valid.
        """
        try:
            parts = token.split('/')
            if len(parts) != 2:
                return False

            issued_on = int(parts[0])
            age = cls._get_current_time() - issued_on
            if age > cls._CSRF_TOKEN_AGE_SECS:
                return False

            authentic_token = cls._create_token(user_id, issued_on)
            if authentic_token == token:
                return True

            return False
        except Exception:
            return False


class CsrfTokenHandler(BaseHandler):
    """Handles sending CSRF tokens to the frontend."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    REDIRECT_UNFINISHED_SIGNUPS = False

    def get(self):
        csrf_token = CsrfTokenManager.create_csrf_token(
            self.user_id)
        self.render_json({
            'token': csrf_token,
        })
