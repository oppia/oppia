# Copyright 2021 Google Inc.
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

"""Internal utilities for interacting with Google API client."""

import io
import socket

import googleapiclient
import httplib2
import requests

from firebase_admin import exceptions
from firebase_admin import _utils


def handle_platform_error_from_googleapiclient(error, handle_func=None):
    """Constructs a ``FirebaseError`` from the given googleapiclient error.

    This can be used to handle errors returned by Google Cloud Platform (GCP) APIs.

    Args:
        error: An error raised by the googleapiclient while making an HTTP call to a GCP API.
        handle_func: A function that can be used to handle platform errors in a custom way. When
            specified, this function will be called with three arguments. It has the same
            signature as ```_handle_func_googleapiclient``, but may return ``None``.

    Returns:
        FirebaseError: A ``FirebaseError`` that can be raised to the user code.
    """
    if not isinstance(error, googleapiclient.errors.HttpError):
        return handle_googleapiclient_error(error)

    content = error.content.decode()
    status_code = error.resp.status
    error_dict, message = _utils._parse_platform_error(content, status_code) # pylint: disable=protected-access
    http_response = _http_response_from_googleapiclient_error(error)
    exc = None
    if handle_func:
        exc = handle_func(error, message, error_dict, http_response)

    return exc if exc else _handle_func_googleapiclient(error, message, error_dict, http_response)


def _handle_func_googleapiclient(error, message, error_dict, http_response):
    """Constructs a ``FirebaseError`` from the given GCP error.

    Args:
        error: An error raised by the googleapiclient module while making an HTTP call.
        message: A message to be included in the resulting ``FirebaseError``.
        error_dict: Parsed GCP error response.
        http_response: A requests HTTP response object to associate with the exception.

    Returns:
        FirebaseError: A ``FirebaseError`` that can be raised to the user code or None.
    """
    code = error_dict.get('status')
    return handle_googleapiclient_error(error, message, code, http_response)


def handle_googleapiclient_error(error, message=None, code=None, http_response=None):
    """Constructs a ``FirebaseError`` from the given googleapiclient error.

    This method is agnostic of the remote service that produced the error, whether it is a GCP
    service or otherwise. Therefore, this method does not attempt to parse the error response in
    any way.

    Args:
        error: An error raised by the googleapiclient module while making an HTTP call.
        message: A message to be included in the resulting ``FirebaseError`` (optional). If not
            specified the string representation of the ``error`` argument is used as the message.
        code: A GCP error code that will be used to determine the resulting error type (optional).
            If not specified the HTTP status code on the error response is used to determine a
            suitable error code.
        http_response: A requests HTTP response object to associate with the exception (optional).
            If not specified, one will be created from the ``error``.

    Returns:
        FirebaseError: A ``FirebaseError`` that can be raised to the user code.
    """
    if isinstance(error, socket.timeout) or (
            isinstance(error, socket.error) and 'timed out' in str(error)):
        return exceptions.DeadlineExceededError(
            message='Timed out while making an API call: {0}'.format(error),
            cause=error)
    if isinstance(error, httplib2.ServerNotFoundError):
        return exceptions.UnavailableError(
            message='Failed to establish a connection: {0}'.format(error),
            cause=error)
    if not isinstance(error, googleapiclient.errors.HttpError):
        return exceptions.UnknownError(
            message='Unknown error while making a remote service call: {0}'.format(error),
            cause=error)

    if not code:
        code = _utils._http_status_to_error_code(error.resp.status) # pylint: disable=protected-access
    if not message:
        message = str(error)
    if not http_response:
        http_response = _http_response_from_googleapiclient_error(error)

    err_type = _utils._error_code_to_exception_type(code) # pylint: disable=protected-access
    return err_type(message=message, cause=error, http_response=http_response)


def _http_response_from_googleapiclient_error(error):
    """Creates a requests HTTP Response object from the given googleapiclient error."""
    resp = requests.models.Response()
    resp.raw = io.BytesIO(error.content)
    resp.status_code = error.resp.status
    return resp
