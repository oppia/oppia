# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Internal utilities common to all modules."""

import json
from platform import python_version
from typing import Callable, Optional

import google.auth
import requests
import httpx

import firebase_admin
from firebase_admin import exceptions


_ERROR_CODE_TO_EXCEPTION_TYPE = {
    exceptions.INVALID_ARGUMENT: exceptions.InvalidArgumentError,
    exceptions.FAILED_PRECONDITION: exceptions.FailedPreconditionError,
    exceptions.OUT_OF_RANGE: exceptions.OutOfRangeError,
    exceptions.UNAUTHENTICATED: exceptions.UnauthenticatedError,
    exceptions.PERMISSION_DENIED: exceptions.PermissionDeniedError,
    exceptions.NOT_FOUND: exceptions.NotFoundError,
    exceptions.ABORTED: exceptions.AbortedError,
    exceptions.ALREADY_EXISTS: exceptions.AlreadyExistsError,
    exceptions.CONFLICT: exceptions.ConflictError,
    exceptions.RESOURCE_EXHAUSTED: exceptions.ResourceExhaustedError,
    exceptions.CANCELLED: exceptions.CancelledError,
    exceptions.DATA_LOSS: exceptions.DataLossError,
    exceptions.UNKNOWN: exceptions.UnknownError,
    exceptions.INTERNAL: exceptions.InternalError,
    exceptions.UNAVAILABLE: exceptions.UnavailableError,
    exceptions.DEADLINE_EXCEEDED: exceptions.DeadlineExceededError,
}


_HTTP_STATUS_TO_ERROR_CODE = {
    400: exceptions.INVALID_ARGUMENT,
    401: exceptions.UNAUTHENTICATED,
    403: exceptions.PERMISSION_DENIED,
    404: exceptions.NOT_FOUND,
    409: exceptions.CONFLICT,
    412: exceptions.FAILED_PRECONDITION,
    429: exceptions.RESOURCE_EXHAUSTED,
    500: exceptions.INTERNAL,
    503: exceptions.UNAVAILABLE,
}


# See https://github.com/googleapis/googleapis/blob/master/google/rpc/code.proto
_RPC_CODE_TO_ERROR_CODE = {
    1: exceptions.CANCELLED,
    2: exceptions.UNKNOWN,
    3: exceptions.INVALID_ARGUMENT,
    4: exceptions.DEADLINE_EXCEEDED,
    5: exceptions.NOT_FOUND,
    6: exceptions.ALREADY_EXISTS,
    7: exceptions.PERMISSION_DENIED,
    8: exceptions.RESOURCE_EXHAUSTED,
    9: exceptions.FAILED_PRECONDITION,
    10: exceptions.ABORTED,
    11: exceptions.OUT_OF_RANGE,
    13: exceptions.INTERNAL,
    14: exceptions.UNAVAILABLE,
    15: exceptions.DATA_LOSS,
    16: exceptions.UNAUTHENTICATED,
}

def get_metrics_header():
    return f'gl-python/{python_version()} fire-admin/{firebase_admin.__version__}'

def _get_initialized_app(app):
    """Returns a reference to an initialized App instance."""
    if app is None:
        return firebase_admin.get_app()

    if isinstance(app, firebase_admin.App):
        initialized_app = firebase_admin.get_app(app.name)
        if app is not initialized_app:
            raise ValueError('Illegal app argument. App instance not '
                             'initialized via the firebase module.')
        return app

    raise ValueError('Illegal app argument. Argument must be of type '
                     ' firebase_admin.App, but given "{0}".'.format(type(app)))



def get_app_service(app, name, initializer):
    app = _get_initialized_app(app)
    return app._get_service(name, initializer) # pylint: disable=protected-access


def handle_platform_error_from_requests(error, handle_func=None):
    """Constructs a ``FirebaseError`` from the given requests error.

    This can be used to handle errors returned by Google Cloud Platform (GCP) APIs.

    Args:
        error: An error raised by the requests module while making an HTTP call to a GCP API.
        handle_func: A function that can be used to handle platform errors in a custom way. When
            specified, this function will be called with three arguments. It has the same
            signature as ```_handle_func_requests``, but may return ``None``.

    Returns:
        FirebaseError: A ``FirebaseError`` that can be raised to the user code.
    """
    if error.response is None:
        return handle_requests_error(error)

    response = error.response
    content = response.content.decode()
    status_code = response.status_code
    error_dict, message = _parse_platform_error(content, status_code)
    exc = None
    if handle_func:
        exc = handle_func(error, message, error_dict)

    return exc if exc else _handle_func_requests(error, message, error_dict)

def handle_platform_error_from_httpx(
        error: httpx.HTTPError,
        handle_func: Optional[Callable[..., Optional[exceptions.FirebaseError]]] = None
) -> exceptions.FirebaseError:
    """Constructs a ``FirebaseError`` from the given httpx error.

    This can be used to handle errors returned by Google Cloud Platform (GCP) APIs.

    Args:
        error: An error raised by the httpx module while making an HTTP call to a GCP API.
        handle_func: A function that can be used to handle platform errors in a custom way. When
            specified, this function will be called with three arguments. It has the same
            signature as ```_handle_func_httpx``, but may return ``None``.

    Returns:
        FirebaseError: A ``FirebaseError`` that can be raised to the user code.
    """

    if isinstance(error, httpx.HTTPStatusError):
        response = error.response
        content = response.content.decode()
        status_code = response.status_code
        error_dict, message = _parse_platform_error(content, status_code)
        exc = None
        if handle_func:
            exc = handle_func(error, message, error_dict)

        return exc if exc else _handle_func_httpx(error, message, error_dict)
    return handle_httpx_error(error)


def handle_operation_error(error):
    """Constructs a ``FirebaseError`` from the given operation error.

    Args:
        error: An error returned by a long running operation.

    Returns:
        FirebaseError: A ``FirebaseError`` that can be raised to the user code.
    """
    if not isinstance(error, dict):
        return exceptions.UnknownError(
            message='Unknown error while making a remote service call: {0}'.format(error),
            cause=error)

    rpc_code = error.get('code')
    message = error.get('message')
    error_code = _rpc_code_to_error_code(rpc_code)
    err_type = _error_code_to_exception_type(error_code)
    return err_type(message=message)


def _handle_func_requests(error, message, error_dict):
    """Constructs a ``FirebaseError`` from the given GCP error.

    Args:
        error: An error raised by the requests module while making an HTTP call.
        message: A message to be included in the resulting ``FirebaseError``.
        error_dict: Parsed GCP error response.

    Returns:
        FirebaseError: A ``FirebaseError`` that can be raised to the user code or None.
    """
    code = error_dict.get('status')
    return handle_requests_error(error, message, code)


def handle_requests_error(error, message=None, code=None):
    """Constructs a ``FirebaseError`` from the given requests error.

    This method is agnostic of the remote service that produced the error, whether it is a GCP
    service or otherwise. Therefore, this method does not attempt to parse the error response in
    any way.

    Args:
        error: An error raised by the requests module while making an HTTP call.
        message: A message to be included in the resulting ``FirebaseError`` (optional). If not
            specified the string representation of the ``error`` argument is used as the message.
        code: A GCP error code that will be used to determine the resulting error type (optional).
            If not specified the HTTP status code on the error response is used to determine a
            suitable error code.

    Returns:
        FirebaseError: A ``FirebaseError`` that can be raised to the user code.
    """
    if isinstance(error, requests.exceptions.Timeout):
        return exceptions.DeadlineExceededError(
            message='Timed out while making an API call: {0}'.format(error),
            cause=error)
    if isinstance(error, requests.exceptions.ConnectionError):
        return exceptions.UnavailableError(
            message='Failed to establish a connection: {0}'.format(error),
            cause=error)
    if error.response is None:
        return exceptions.UnknownError(
            message='Unknown error while making a remote service call: {0}'.format(error),
            cause=error)

    if not code:
        code = _http_status_to_error_code(error.response.status_code)
    if not message:
        message = str(error)

    err_type = _error_code_to_exception_type(code)
    return err_type(message=message, cause=error, http_response=error.response)

def _handle_func_httpx(error: httpx.HTTPError, message, error_dict) -> exceptions.FirebaseError:
    """Constructs a ``FirebaseError`` from the given GCP error.

    Args:
        error: An error raised by the httpx module while making an HTTP call.
        message: A message to be included in the resulting ``FirebaseError``.
        error_dict: Parsed GCP error response.

    Returns:
        FirebaseError: A ``FirebaseError`` that can be raised to the user code or None.
    """
    code = error_dict.get('status')
    return handle_httpx_error(error, message, code)


def handle_httpx_error(error: httpx.HTTPError, message=None, code=None) -> exceptions.FirebaseError:
    """Constructs a ``FirebaseError`` from the given httpx error.

    This method is agnostic of the remote service that produced the error, whether it is a GCP
    service or otherwise. Therefore, this method does not attempt to parse the error response in
    any way.

    Args:
        error: An error raised by the httpx module while making an HTTP call.
        message: A message to be included in the resulting ``FirebaseError`` (optional). If not
            specified the string representation of the ``error`` argument is used as the message.
        code: A GCP error code that will be used to determine the resulting error type (optional).
            If not specified the HTTP status code on the error response is used to determine a
            suitable error code.

    Returns:
        FirebaseError: A ``FirebaseError`` that can be raised to the user code.
    """
    if isinstance(error, httpx.TimeoutException):
        return exceptions.DeadlineExceededError(
            message='Timed out while making an API call: {0}'.format(error),
            cause=error)
    if isinstance(error, httpx.ConnectError):
        return exceptions.UnavailableError(
            message='Failed to establish a connection: {0}'.format(error),
            cause=error)
    if isinstance(error, httpx.HTTPStatusError):
        print("printing status error", error)
        if not code:
            code = _http_status_to_error_code(error.response.status_code)
        if not message:
            message = str(error)

        err_type = _error_code_to_exception_type(code)
        return err_type(message=message, cause=error, http_response=error.response)

    return exceptions.UnknownError(
        message='Unknown error while making a remote service call: {0}'.format(error),
        cause=error)

def _http_status_to_error_code(status):
    """Maps an HTTP status to a platform error code."""
    return _HTTP_STATUS_TO_ERROR_CODE.get(status, exceptions.UNKNOWN)

def _rpc_code_to_error_code(rpc_code):
    """Maps an RPC code to a platform error code."""
    return _RPC_CODE_TO_ERROR_CODE.get(rpc_code, exceptions.UNKNOWN)

def _error_code_to_exception_type(code):
    """Maps a platform error code to an exception type."""
    return _ERROR_CODE_TO_EXCEPTION_TYPE.get(code, exceptions.UnknownError)


def _parse_platform_error(content, status_code):
    """Parses an HTTP error response from a Google Cloud Platform API and extracts the error code
    and message fields.

    Args:
        content: Decoded content of the response body.
        status_code: HTTP status code.

    Returns:
        tuple: A tuple containing error code and message.
    """
    data = {}
    try:
        parsed_body = json.loads(content)
        if isinstance(parsed_body, dict):
            data = parsed_body
    except ValueError:
        pass

    error_dict = data.get('error', {})
    msg = error_dict.get('message')
    if not msg:
        msg = 'Unexpected HTTP response with status: {0}; body: {1}'.format(status_code, content)
    return error_dict, msg


# Temporarily disable the lint rule. For more information see:
# https://github.com/googleapis/google-auth-library-python/pull/561
# pylint: disable=abstract-method
class EmulatorAdminCredentials(google.auth.credentials.Credentials):
    """ Credentials for use with the firebase local emulator.

    This is used instead of user-supplied credentials or ADC.  It will silently do nothing when
    asked to refresh credentials.
    """
    def __init__(self):
        google.auth.credentials.Credentials.__init__(self)
        self.token = 'owner'

    def refresh(self, request):
        pass
