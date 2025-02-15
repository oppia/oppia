from datetime import datetime, timezone
"""Base constants and handlers."""
from __future__ import annotations
import base64
import datetime
import functools
import hmac
import io
import json
import logging
import os
import re
import time
import urllib
from core import feconf
from core import handler_schema_constants
from core import utils
from core.controllers import payload_validator
from core.domain import auth_domain
from core.domain import auth_services
from core.domain import user_services
from typing import Any, Dict, Final, Generic, Mapping, Optional, Sequence, TypedDict, TypeVar, Union
from core.storage.base_model.gae_models import get_current_datetime_utc
import webapp2
_NormalizedRequestDictType = TypeVar('_NormalizedRequestDictType')
_NormalizedPayloadDictType = TypeVar('_NormalizedPayloadDictType')
ONE_DAY_AGO_IN_SECS: Final = -24 * 60 * 60
AUTH_HANDLER_PATHS: Final = ('/csrfhandler', '/login', '/session_begin',
    '/session_end')


class ResponseValueDict(TypedDict):
    """Dict representation of key-value pairs that will be included in the
    response.
    """
    error: str
    status_code: int


@functools.lru_cache(maxsize=128)
def load_template(filename: str, *, template_is_aot_compiled: bool) ->str:
    """Return the HTML file contents at filepath.

    Args:
        filename: str. Name of the requested HTML file.
        template_is_aot_compiled: bool. Used to determine which bundle to use.

    Returns:
        str. The HTML file content.
    """
    filepath = os.path.join(feconf.FRONTEND_AOT_DIR if
        template_is_aot_compiled else feconf.FRONTEND_TEMPLATES_DIR, filename)
    with utils.open_file(filepath, 'r') as f:
        html_text = f.read()
    return html_text


class SessionBeginHandler(webapp2.RequestHandler):
    """Handler for creating new authentication sessions."""

    def get(self) ->None:
        """Establishes a new auth session."""
        auth_services.establish_auth_session(self.request, self.response)


class SessionEndHandler(webapp2.RequestHandler):
    """Handler for destroying existing authentication sessions."""

    def get(self) ->None:
        """Destroys an existing auth session."""
        auth_services.destroy_auth_session(self.response)


class UserFacingExceptions:
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


    class NotFoundException(Exception):
        """Error class for resource not found error (error code 404)."""
        pass


    class InternalErrorException(Exception):
        """Error class for an internal server side error (error code 500)."""
        pass


class BaseHandler(webapp2.RequestHandler, Generic[
    _NormalizedPayloadDictType, _NormalizedRequestDictType]):
    """Base class for all Oppia handlers."""
    REQUIRE_PAYLOAD_CSRF_CHECK = True
    REDIRECT_UNFINISHED_SIGNUPS = True
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_HTML
    POST_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    PUT_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    DELETE_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Optional[Dict[str, Any]] = None
    HANDLER_ARGS_SCHEMAS: Optional[Dict[str, Any]] = None

    def __init__(self, request: webapp2.Request, response: webapp2.Response
        ) ->None:
        self.initialize(request, response)

        self.start_time = get_current_datetime_utc()

        # Here we use type Any because dict 'self.values' is a return dict
        # for the handlers, and different handlers can return different
        # key-value pairs. So, to allow every type of key-value pair, we
        # used Any type here.
        self.values: Dict[str, Any] = {}
        try:
            payload_json_string = self.request.get('payload')
        except ValueError as e:
            logging.error('%s: request %s', e, self.request)
            raise e
        if payload_json_string:
            self.payload = json.loads(payload_json_string)
        else:
            self.payload = None
        self.iframed = False
        self.user_id = None
        self.username = None
        self.email = None
        self.partially_logged_in = False
        self.user_is_scheduled_for_deletion = False
        self.current_user_is_super_admin = False
        self.normalized_request: Optional[_NormalizedRequestDictType] = None
        self.normalized_payload: Optional[_NormalizedPayloadDictType] = None
        try:
            auth_claims = auth_services.get_auth_claims_from_request(request)
        except auth_domain.StaleAuthSessionError:
            auth_services.destroy_auth_session(self.response)
            self.redirect(user_services.create_login_url(self.request.uri))
            return
        except auth_domain.UserDisabledError:
            auth_services.destroy_auth_session(self.response)
            self.redirect('/logout?redirect_url=%s' % feconf.
                PENDING_ACCOUNT_DELETION_URL)
            return
        except auth_domain.InvalidAuthSessionError:
            logging.exception('User session is invalid!')
            auth_services.destroy_auth_session(self.response)
            self.redirect(user_services.create_login_url(self.request.uri))
            return
        else:
            self.current_user_is_super_admin = (auth_claims is not None and
                auth_claims.role_is_super_admin)
        if auth_claims:
            auth_id = auth_claims.auth_id
            user_settings = user_services.get_user_settings_by_auth_id(auth_id)
            if user_settings is None:
                email = auth_claims.email
                if email is None:
                    logging.exception(
                        'No email address was found for the user.')
                    auth_services.destroy_auth_session(self.response)
                    return
                if 'signup?' in self.request.uri:
                    user_settings = user_services.create_new_user(auth_id,
                        email)
                else:
                    logging.error(
                        'Cannot find user %s with email %s on page %s' % (
                        auth_id, email, self.request.uri))
                    auth_services.destroy_auth_session(self.response)
                    return
            self.email = user_settings.email
            self.values['user_email'] = user_settings.email
            self.user_id = user_settings.user_id
            if user_settings.deleted:
                self.user_is_scheduled_for_deletion = user_settings.deleted
            elif self.REDIRECT_UNFINISHED_SIGNUPS and not user_services.has_fully_registered_account(
                self.user_id):
                self.partially_logged_in = True
            else:
                self.username = user_settings.username
                self.values['username'] = self.username
                # In order to avoid too many datastore writes, we do not bother
                # recording a log-in if the current time is sufficiently close
                # to the last log-in time.
                if (user_settings.last_logged_in is None or
                        not utils.are_datetimes_close(
                            get_current_datetime_utc(),
                            user_settings.last_logged_in)):
                    user_services.record_user_logged_in(self.user_id)
            self.roles = user_settings.roles
        if self.user_id is None:
            self.roles = [feconf.ROLE_ID_GUEST]
        self.user = user_services.get_user_actions_info(self.user_id)
        if not self._is_requested_path_currently_accessible_to_user():
            auth_services.destroy_auth_session(self.response)
            return
        self.values['is_super_admin'] = self.current_user_is_super_admin

    def dispatch(self) ->None:
        """Overrides dispatch method in webapp2 superclass.

        Raises:
            Exception. The CSRF token is missing.
            UnauthorizedUserException. The CSRF token is invalid.
        """
        request_split = urllib.parse.urlsplit(self.request.uri)
        if (request_split.netloc == 'oppiaserver.appspot.com' and not
            request_split.path.startswith(('/cron/', '/task/'))):
            self.redirect('https://oppiatestserver.appspot.com', permanent=True
                )
            return
        if not self._is_requested_path_currently_accessible_to_user():
            self.render_template('maintenance-page.mainpage.html')
            return
        if self.user_is_scheduled_for_deletion:
            self.redirect('/logout?redirect_url=%s' % feconf.
                PENDING_ACCOUNT_DELETION_URL)
            return
        if self.partially_logged_in and request_split.path != '/logout':
            self.redirect('/logout?redirect_url=%s' % request_split.path)
            return
        if self.payload is not None and self.REQUIRE_PAYLOAD_CSRF_CHECK:
            try:
                if 'signup' in self.request.uri and not self.user_id:
                    raise self.UnauthorizedUserException(
                        'Registration session expired.')
                csrf_token = self.request.get('csrf_token')
                if not csrf_token:
                    raise self.UnauthorizedUserException(
                        'Missing CSRF token. Changes were not saved. Please report this bug.'
                        )
                is_csrf_token_valid = CsrfTokenManager.is_csrf_token_valid(self
                    .user_id, csrf_token)
                if not is_csrf_token_valid:
                    raise self.UnauthorizedUserException(
                        'Your session has expired, and unfortunately your changes cannot be saved. Please refresh the page.'
                        )
            except Exception as e:
                logging.exception('%s: payload %s', e, self.payload)
                self.handle_exception(e, self.app.debug)
                return
        schema_validation_succeeded = True
        try:
            self.validate_and_normalize_args()
        except (NotImplementedError, self.InternalErrorException, self.
            InvalidInputException) as e:
            self.handle_exception(e, self.app.debug)
            schema_validation_succeeded = False
        if not schema_validation_succeeded:
            return
        super().dispatch()

    def validate_and_normalize_args(self) ->None:
        """Validates schema for controller layer handler class arguments.

        Raises:
            InvalidInputException. Schema validation failed.
            NotImplementedError. Schema is not provided in handler class.
        """
        handler_class_name = self.__class__.__name__
        request_method = self.request.environ['REQUEST_METHOD']
        if request_method == 'HEAD':
            request_method = 'GET'
        url_path_args = self.request.route_kwargs
        if (handler_class_name in handler_schema_constants.
            HANDLER_CLASS_NAMES_WITH_NO_SCHEMA):
            if self.URL_PATH_ARGS_SCHEMAS or self.HANDLER_ARGS_SCHEMAS:
                raise self.InternalErrorException(
                    'Remove handler class name from HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS'
                    )
            return
        handler_args = {}
        payload_arg_keys = []
        request_arg_keys = []
        for arg in self.request.arguments():
            if arg == 'csrf_token':
                pass
            elif arg == 'source':
                source_url = self.request.get('source')
                regex_pattern = (
                    'http[s]?://(?:[a-zA-Z]|[0-9]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
                    )
                regex_verified_url = re.findall(regex_pattern, source_url)
                if not regex_verified_url:
                    raise self.InvalidInputException('Not a valid source url.')
            elif arg == 'payload':
                payload_args = self.payload
                if payload_args is not None:
                    payload_arg_keys = list(payload_args.keys())
                    handler_args.update(payload_args)
            else:
                request_arg_keys.append(arg)
                handler_args[arg] = self.request.get(arg)
        extra_args_are_allowed = (self.GET_HANDLER_ERROR_RETURN_TYPE ==
            feconf.HANDLER_TYPE_HTML and request_method == 'GET')
        if self.URL_PATH_ARGS_SCHEMAS is None:
            raise NotImplementedError(
                'Missing schema for url path args in %s handler class.' %
                handler_class_name)
        schema_for_url_path_args = self.URL_PATH_ARGS_SCHEMAS
        self.request.route_kwargs, errors = (payload_validator.
            validate_arguments_against_schema(url_path_args,
            schema_for_url_path_args, extra_args_are_allowed))
        if errors:
            raise self.InvalidInputException(
                "At '%s' these errors are happening:\n%s" % (self.request.
                uri, '\n'.join(errors)))
        if request_method in ['GET', 'POST', 'PUT', 'DELETE'] and getattr(self
            .__class__, request_method.lower()) == getattr(BaseHandler,
            request_method.lower()):
            return
        try:
            if self.HANDLER_ARGS_SCHEMAS is None:
                raise Exception(
                    "No 'HANDLER_ARGS_SCHEMAS' Found for the handler class: %s"
                     % handler_class_name)
            schema_for_request_method = self.HANDLER_ARGS_SCHEMAS[
                request_method]
        except Exception as e:
            raise NotImplementedError(
                'Missing schema for %s method in %s handler class.' % (
                request_method, handler_class_name)) from e
        allow_string_to_bool_conversion = request_method in ['GET', 'DELETE']
        normalized_arg_values, errors = (payload_validator.
            validate_arguments_against_schema(handler_args,
            schema_for_request_method, extra_args_are_allowed,
            allow_string_to_bool_conversion))
        normalized_payload = {arg: normalized_arg_values.get(arg) for arg in
            payload_arg_keys}
        normalized_request = {arg: normalized_arg_values.get(arg) for arg in
            request_arg_keys}
        keys_that_correspond_to_default_values = list(set(
            normalized_arg_values.keys()) - set(payload_arg_keys +
            request_arg_keys))
        for arg in keys_that_correspond_to_default_values:
            if request_method in ['GET', 'DELETE']:
                normalized_request[arg] = normalized_arg_values.get(arg)
            else:
                normalized_payload[arg] = normalized_arg_values.get(arg)
        self.normalized_payload = normalized_payload
        self.normalized_request = normalized_request
        self.request.get = RaiseErrorOnGet(
            'Use self.normalized_request instead of self.request.').get
        self.payload = RaiseErrorOnGet(
            'Use self.normalized_payload instead of self.payload.')
        if errors:
            raise self.InvalidInputException(
                "At '%s' these errors are happening:\n%s" % (self.request.
                uri, '\n'.join(errors)))

    @property
    def current_user_is_site_maintainer(self) ->bool:
        """Returns whether the current user is a site maintainer.

        A super admin or release coordinator is also a site maintainer.

        Returns:
            bool. Whether the current user is a site maintainer.
        """
        return (self.current_user_is_super_admin or feconf.
            ROLE_ID_RELEASE_COORDINATOR in self.roles)

    def _is_requested_path_currently_accessible_to_user(self) ->bool:
        """Checks whether the requested path is currently accessible to user.

        Returns:
            bool. Whether the requested path is currently accessible to user.
        """
        return (self.request.path in AUTH_HANDLER_PATHS or not feconf.
            ENABLE_MAINTENANCE_MODE or self.current_user_is_site_maintainer)

    def get(self, *args: Any, **kwargs: Any) ->None:
        """Base method to handle GET requests."""
        logging.warning('Invalid URL requested: %s', self.request.uri)
        self.error(404)
        values: ResponseValueDict = {'error': 
            'Could not find the resource %s.' % self.request.uri,
            'status_code': 404}
        self._render_exception(values)

    def post(self, *args: Any) ->None:
        """Base method to handle POST requests.

        Raises:
            NotFoundException. Resource not found error (error code 404).
        """
        raise self.NotFoundException

    def put(self, *args: Any) ->None:
        """Base method to handle PUT requests.

        Raises:
            NotFoundException. Resource not found error (error code 404).
        """
        raise self.NotFoundException

    def delete(self, *args: Any) ->None:
        """Base method to handle DELETE requests.

        Raises:
            NotFoundException. Resource not found error (error code 404).
        """
        raise self.NotFoundException

    def head(self, *args: Any, **kwargs: Any) ->None:
        """Method to handle HEAD requests. The webapp library automatically
        makes sure that HEAD only returns the headers of GET request.
        """
        return self.get(*args, **kwargs)

    def render_json(self, values: Union[str, Sequence[Mapping[str, Any]],
        Mapping[str, Any]]) ->None:
        """Prepares JSON response to be sent to the client.

        Args:
            values: str|dict. The key-value pairs to encode in the
                JSON response.
        """
        self.response.content_type = 'application/json; charset=utf-8'
        self.response.headers['Content-Disposition'
            ] = 'attachment; filename="oppia-attachment.txt"'
        self.response.headers['Strict-Transport-Security'
            ] = 'max-age=31536000; includeSubDomains'
        self.response.headers['X-Content-Type-Options'] = 'nosniff'
        self.response.headers['X-Xss-Protection'] = '1; mode=block'
        json_output = json.dumps(values, cls=utils.JSONEncoderForHTML)
        self.response.write(b'%s%s' % (feconf.XSSI_PREFIX, json_output.
            encode('utf-8')))

    def render_downloadable_file(self, file: io.BytesIO, filename: str,
        content_type: str) ->None:
        """Prepares downloadable content to be sent to the client.

        Args:
            file: BytesIO. The data of the downloadable file.
            filename: str. The name of the file to be rendered.
            content_type: str. The type of file to be rendered.
        """
        self.response.headers['Content-Type'] = content_type
        self.response.headers['Content-Disposition'
            ] = 'attachment; filename=%s' % filename
        self.response.charset = 'utf-8'
        super(webapp2.Response, self.response).write(file.getvalue())

    def render_template(self, filepath: str, iframe_restriction: Optional[
        str]='DENY', *, template_is_aot_compiled: bool=False) ->None:
        """Prepares an HTML response to be sent to the client.

        Args:
            filepath: str. The template filepath.
            iframe_restriction: str or None. Possible values are
                'DENY' and 'SAMEORIGIN':

                DENY: Strictly prevents the template to load in an iframe.
                SAMEORIGIN: The template can only be displayed in a frame
                    on the same origin as the page itself.
            template_is_aot_compiled: bool. False by default. Use
                True when the template is compiled by angular AoT compiler.

        Raises:
            Exception. Invalid X-Frame-Options.
        """
        self.response.cache_control.no_store = True
        self.response.cache_control.must_revalidate = True
        self.response.headers['Strict-Transport-Security'
            ] = 'max-age=31536000; includeSubDomains'
        self.response.headers['X-Content-Type-Options'] = 'nosniff'
        self.response.headers['X-Xss-Protection'] = '1; mode=block'
        if iframe_restriction is not None:
            if iframe_restriction in ['SAMEORIGIN', 'DENY']:
                self.response.headers['X-Frame-Options'] = str(
                    iframe_restriction)
            else:
                raise Exception('Invalid X-Frame-Options: %s' %
                    iframe_restriction)
        self.response.expires = 'Mon, 01 Jan 1990 00:00:00 GMT'
        self.response.pragma = 'no-cache'
        self.response.write(load_template(filepath,
            template_is_aot_compiled=template_is_aot_compiled))

    def _render_exception_json_or_html(self, return_type: str, values:
        ResponseValueDict) ->None:
        """Renders an error page, or an error JSON response.

        Args:
            return_type: str. Indicator to return JSON or HTML.
            values: dict. The key-value pairs to include in the response.
        """
        method = self.request.environ['REQUEST_METHOD']
        if return_type == feconf.HANDLER_TYPE_HTML and method == 'GET':
            self.values.update(values)
            if values['status_code'] == 404:
                self.render_template('oppia-root.mainpage.html')
            else:
                self.render_template('error-page-%s.mainpage.html' % values
                    ['status_code'])
        else:
            if return_type not in (feconf.HANDLER_TYPE_JSON, feconf.
                HANDLER_TYPE_DOWNLOADABLE):
                logging.warning(
                    'Not a recognized return type: defaulting to render JSON.')
            self.render_json(values)

    def _render_exception(self, values: ResponseValueDict) ->None:
        """Renders an error page, or an error JSON response.

        Args:
            values: dict. The key-value pairs to include in the response.
        """
        assert values['status_code'] in [400, 401, 404, 405, 500]
        method = self.request.environ['REQUEST_METHOD']
        if method == 'GET':
            self._render_exception_json_or_html(self.
                GET_HANDLER_ERROR_RETURN_TYPE, values)
        elif method == 'POST':
            self._render_exception_json_or_html(self.
                POST_HANDLER_ERROR_RETURN_TYPE, values)
        elif method == 'PUT':
            self._render_exception_json_or_html(self.
                PUT_HANDLER_ERROR_RETURN_TYPE, values)
        elif method == 'DELETE':
            self._render_exception_json_or_html(self.
                DELETE_HANDLER_ERROR_RETURN_TYPE, values)
        else:
            logging.warning('Not a recognized request method.')
            self._render_exception_json_or_html(feconf.HANDLER_TYPE_JSON,
                values)

    def handle_exception(self, exception: BaseException, unused_debug_mode:
        bool) ->None:
        """Overwrites the default exception handler.

        Args:
            exception: Exception. The exception that was thrown.
            unused_debug_mode: bool. True if the web application is running
                in debug mode.
        """
        handler_class_name = self.__class__.__name__
        request_method = self.request.environ['REQUEST_METHOD']
        if isinstance(exception, self.NotLoggedInException):
            payload_exists = self.payload is not None and not isinstance(self
                .payload, RaiseErrorOnGet)
            if (payload_exists or self.GET_HANDLER_ERROR_RETURN_TYPE ==
                feconf.HANDLER_TYPE_JSON):
                self.error(401)
                values: ResponseValueDict = {'error':
                    'You must be logged in to access this resource.',
                    'status_code': 401}
                self._render_exception(values)
            else:
                self.redirect(user_services.create_login_url(self.request.uri))
            return
        if isinstance(exception, self.NotFoundException):
            logging.warning('Invalid URL requested: %s', self.request.uri)
            self.error(404)
            values = {'error': 'Could not find the resource %s.' % self.
                request.uri, 'status_code': 404}
            self._render_exception(values)
            return
        logging.exception('Exception raised at %s: %s', self.request.uri,
            exception)
        if isinstance(exception, self.UnauthorizedUserException):
            self.error(401)
            values = {'error': str(exception), 'status_code': 401}
            self._render_exception(values)
            return
        if isinstance(exception, self.InvalidInputException):
            self.error(400)
            values = {'error': str(exception), 'status_code': 400}
            self._render_exception(values)
            return
        if isinstance(exception, self.InternalErrorException):
            self.error(500)
            values = {'error': str(exception), 'status_code': 500}
            self._render_exception(values)
            return
        if isinstance(exception, TypeError):
            self.error(405)
            values = {'error': 'Invalid method %s for %s' % (request_method,
                handler_class_name), 'status_code': 405}
            self._render_exception(values)
            return
        self.error(500)
        values = {'error': str(exception), 'status_code': 500}
        self._render_exception(values)
    InternalErrorException = UserFacingExceptions.InternalErrorException
    InvalidInputException = UserFacingExceptions.InvalidInputException
    NotLoggedInException = UserFacingExceptions.NotLoggedInException
    NotFoundException = UserFacingExceptions.NotFoundException
    UnauthorizedUserException = UserFacingExceptions.UnauthorizedUserException


class Error404Handler(BaseHandler[Dict[str, str], Dict[str, str]]):
    """Handles 404 errors."""
    pass


class RaiseErrorOnGet:
    """Class that will throw a ValueError when the get function is invoked."""

    def __init__(self, message: str) ->None:
        self.error_message = message

    def get(self, *args: Any, **kwargs: Any) ->None:
        """Raises an error when invoked."""
        raise ValueError(self.error_message)


class CsrfTokenManager:
    """Manages page/user tokens in memcache to protect against CSRF."""
    _CSRF_TOKEN_AGE_SECS: Final = 60 * 60 * 48
    _USER_ID_DEFAULT: Final = 'non_logged_in_user'

    @classmethod
    def _create_token(cls, user_id: Optional[str], issued_on: float, nonce:
        Optional[str]=None) ->str:
        """Creates a new CSRF token.

        Args:
            user_id: str|None. The user_id for which the token is generated.
            issued_on: float. The timestamp at which the token was issued.
            nonce: str|None. A token that is never reused to prevent reply
                attacks. This argument should only be provided when validating a
                received CSRF token, in which case the nonce in the received
                token should be provided here.

        Returns:
            str. The generated CSRF token.
        """
        if user_id is None:
            user_id = cls._USER_ID_DEFAULT
        issued_on_str = str(int(issued_on))
        if nonce is None:
            nonce = base64.urlsafe_b64encode(os.urandom(20)).decode('utf-8')
        digester = hmac.new(key=auth_services.get_csrf_secret_value().
            encode('utf-8'), digestmod='sha256')
        digester.update(user_id.encode('utf-8'))
        digester.update(b':')
        digester.update(issued_on_str.encode('utf-8'))
        digester.update(b':')
        digester.update(nonce.encode('utf-8'))
        digest = digester.digest()
        token = '%s/%s/%s' % (issued_on_str, nonce, base64.
            urlsafe_b64encode(digest).decode('utf-8'))
        return token

    @classmethod
    def _get_current_time(cls) ->float:
        """Returns the current server time.

        Returns:
            float. The time in seconds as floating point number.
        """
        return time.time()

    @classmethod
    def create_csrf_token(cls, user_id: Optional[str]) ->str:
        """Creates a CSRF token for the given user_id.

        Args:
            user_id: str|None. The user_id for whom the token is generated.

        Returns:
            str. The generated CSRF token.
        """
        return cls._create_token(user_id, cls._get_current_time())

    @classmethod
    def is_csrf_token_valid(cls, user_id: Optional[str], token: str) ->bool:
        """Validates a given CSRF token.

        Args:
            user_id: str|None. The user_id to validate the CSRF token against.
            token: str. The CSRF token to validate.

        Returns:
            bool. Whether the given CSRF token is valid.
        """
        try:
            parts = token.split('/')
            if len(parts) != 3:
                return False
            issued_on = int(parts[0])
            age = cls._get_current_time() - issued_on
            if age > cls._CSRF_TOKEN_AGE_SECS:
                return False
            nonce = parts[1]
            authentic_token = cls._create_token(user_id, issued_on, nonce)
            if hmac.compare_digest(authentic_token.encode('utf-8'), token.
                encode('utf-8')):
                return True
            return False
        except Exception:
            return False


class CsrfTokenHandler(BaseHandler[Dict[str, str], Dict[str, str]]):
    """Handles sending CSRF tokens to the frontend."""
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    REDIRECT_UNFINISHED_SIGNUPS = False
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    def get(self) ->None:
        csrf_token = CsrfTokenManager.create_csrf_token(self.user_id)
        self.render_json({'token': csrf_token})