# Copyright 2019 Google Inc.
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

"""Firebase Exceptions module.

This module defines the base types for exceptions and the platform-wide error codes as outlined in
https://cloud.google.com/apis/design/errors.

:class:`FirebaseError` is the parent class of all exceptions raised by the Admin SDK. It contains
the ``code``, ``http_response`` and ``cause`` properties common to all Firebase exception types.
Each exception also carries a message that outlines what went wrong. This can be logged for
audit or debugging purposes.

When calling an Admin SDK API, developers can catch the parent ``FirebaseError`` and
inspect its ``code`` to implement fine-grained error handling. Alternatively, developers can
catch one or more subtypes of ``FirebaseError``. Under normal conditions, any given API can raise
only a small subset of the available exception subtypes. However, the SDK also exposes rare error
conditions like connection timeouts and other I/O errors as instances of ``FirebaseError``.
Therefore it is always a good idea to have a handler specified for ``FirebaseError``, after all the
subtype error handlers.
"""


#: Error code for ``InvalidArgumentError`` type.
INVALID_ARGUMENT = 'INVALID_ARGUMENT'

#: Error code for ``FailedPreconditionError`` type.
FAILED_PRECONDITION = 'FAILED_PRECONDITION'

#: Error code for ``OutOfRangeError`` type.
OUT_OF_RANGE = 'OUT_OF_RANGE'

#: Error code for ``UnauthenticatedError`` type.
UNAUTHENTICATED = 'UNAUTHENTICATED'

#: Error code for ``PermissionDeniedError`` type.
PERMISSION_DENIED = 'PERMISSION_DENIED'

#: Error code for ``NotFoundError`` type.
NOT_FOUND = 'NOT_FOUND'

#: Error code for ``ConflictError`` type.
CONFLICT = 'CONFLICT'

#: Error code for ``AbortedError`` type.
ABORTED = 'ABORTED'

#: Error code for ``AlreadyExistsError`` type.
ALREADY_EXISTS = 'ALREADY_EXISTS'

#: Error code for ``ResourceExhaustedError`` type.
RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED'

#: Error code for ``CancelledError`` type.
CANCELLED = 'CANCELLED'

#: Error code for ``DataLossError`` type.
DATA_LOSS = 'DATA_LOSS'

#: Error code for ``UnknownError`` type.
UNKNOWN = 'UNKNOWN'

#: Error code for ``InternalError`` type.
INTERNAL = 'INTERNAL'

#: Error code for ``UnavailableError`` type.
UNAVAILABLE = 'UNAVAILABLE'

#: Error code for ``DeadlineExceededError`` type.
DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED'


class FirebaseError(Exception):
    """Base class for all errors raised by the Admin SDK.

    Args:
        code: A string error code that represents the type of the exception. Possible error
            codes are defined in https://cloud.google.com/apis/design/errors#handling_errors.
        message: A human-readable error message string.
        cause: The exception that caused this error (optional).
        http_response: If this error was caused by an HTTP error response, this property is
            set to the ``requests.Response`` object that represents the HTTP response (optional).
            See https://docs.python-requests.org/en/master/api/#requests.Response for details of
            this object.
    """

    def __init__(self, code, message, cause=None, http_response=None):
        Exception.__init__(self, message)
        self._code = code
        self._cause = cause
        self._http_response = http_response

    @property
    def code(self):
        return self._code

    @property
    def cause(self):
        return self._cause

    @property
    def http_response(self):
        return self._http_response


class InvalidArgumentError(FirebaseError):
    """Client specified an invalid argument."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, INVALID_ARGUMENT, message, cause, http_response)


class FailedPreconditionError(FirebaseError):
    """Request can not be executed in the current system state, such as deleting a non-empty
    directory."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, FAILED_PRECONDITION, message, cause, http_response)


class OutOfRangeError(FirebaseError):
    """Client specified an invalid range."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, OUT_OF_RANGE, message, cause, http_response)


class UnauthenticatedError(FirebaseError):
    """Request not authenticated due to missing, invalid, or expired OAuth token."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, UNAUTHENTICATED, message, cause, http_response)


class PermissionDeniedError(FirebaseError):
    """Client does not have sufficient permission.

    This can happen because the OAuth token does not have the right scopes, the client doesn't
    have permission, or the API has not been enabled for the client project.
    """

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, PERMISSION_DENIED, message, cause, http_response)


class NotFoundError(FirebaseError):
    """A specified resource is not found, or the request is rejected by undisclosed reasons, such
    as whitelisting."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, NOT_FOUND, message, cause, http_response)


class ConflictError(FirebaseError):
    """Concurrency conflict, such as read-modify-write conflict."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, CONFLICT, message, cause, http_response)


class AbortedError(FirebaseError):
    """Concurrency conflict, such as read-modify-write conflict."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, ABORTED, message, cause, http_response)


class AlreadyExistsError(FirebaseError):
    """The resource that a client tried to create already exists."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, ALREADY_EXISTS, message, cause, http_response)


class ResourceExhaustedError(FirebaseError):
    """Either out of resource quota or reaching rate limiting."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, RESOURCE_EXHAUSTED, message, cause, http_response)


class CancelledError(FirebaseError):
    """Request cancelled by the client."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, CANCELLED, message, cause, http_response)


class DataLossError(FirebaseError):
    """Unrecoverable data loss or data corruption."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, DATA_LOSS, message, cause, http_response)


class UnknownError(FirebaseError):
    """Unknown server error."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, UNKNOWN, message, cause, http_response)


class InternalError(FirebaseError):
    """Internal server error."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, INTERNAL, message, cause, http_response)


class UnavailableError(FirebaseError):
    """Service unavailable. Typically the server is down."""

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, UNAVAILABLE, message, cause, http_response)


class DeadlineExceededError(FirebaseError):
    """Request deadline exceeded.

    This will happen only if the caller sets a deadline that is shorter than the method's
    default deadline (i.e. requested deadline is not enough for the server to process the
    request) and the request did not finish within the deadline.
    """

    def __init__(self, message, cause=None, http_response=None):
        FirebaseError.__init__(self, DEADLINE_EXCEEDED, message, cause, http_response)
