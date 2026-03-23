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

"""Firebase Cloud Messaging module."""

from __future__ import annotations
from typing import Any, Callable, Dict, List, Optional, cast
import concurrent.futures
import json
import warnings
import asyncio
import logging
import requests
import httpx

from googleapiclient import http
from googleapiclient import _auth

import firebase_admin
from firebase_admin import (
    _http_client,
    _messaging_encoder,
    _messaging_utils,
    _gapic_utils,
    _utils,
    exceptions,
    App
)

logger = logging.getLogger(__name__)

_MESSAGING_ATTRIBUTE = '_messaging'


__all__ = [
    'AndroidConfig',
    'AndroidFCMOptions',
    'AndroidNotification',
    'APNSConfig',
    'APNSFCMOptions',
    'APNSPayload',
    'Aps',
    'ApsAlert',
    'BatchResponse',
    'CriticalSound',
    'ErrorInfo',
    'FCMOptions',
    'LightSettings',
    'Message',
    'MulticastMessage',
    'Notification',
    'QuotaExceededError',
    'SenderIdMismatchError',
    'SendResponse',
    'ThirdPartyAuthError',
    'TopicManagementResponse',
    'UnregisteredError',
    'WebpushConfig',
    'WebpushFCMOptions',
    'WebpushNotification',
    'WebpushNotificationAction',

    'send',
    'send_all',
    'send_multicast',
    'send_each',
    'send_each_async',
    'send_each_for_multicast',
    'send_each_for_multicast_async',
    'subscribe_to_topic',
    'unsubscribe_from_topic',
]


AndroidConfig = _messaging_utils.AndroidConfig
AndroidFCMOptions = _messaging_utils.AndroidFCMOptions
AndroidNotification = _messaging_utils.AndroidNotification
APNSConfig = _messaging_utils.APNSConfig
APNSFCMOptions = _messaging_utils.APNSFCMOptions
APNSPayload = _messaging_utils.APNSPayload
Aps = _messaging_utils.Aps
ApsAlert = _messaging_utils.ApsAlert
CriticalSound = _messaging_utils.CriticalSound
FCMOptions = _messaging_utils.FCMOptions
LightSettings = _messaging_utils.LightSettings
Message = _messaging_encoder.Message
MulticastMessage = _messaging_encoder.MulticastMessage
Notification = _messaging_utils.Notification
WebpushConfig = _messaging_utils.WebpushConfig
WebpushFCMOptions = _messaging_utils.WebpushFCMOptions
WebpushNotification = _messaging_utils.WebpushNotification
WebpushNotificationAction = _messaging_utils.WebpushNotificationAction

QuotaExceededError = _messaging_utils.QuotaExceededError
SenderIdMismatchError = _messaging_utils.SenderIdMismatchError
ThirdPartyAuthError = _messaging_utils.ThirdPartyAuthError
UnregisteredError = _messaging_utils.UnregisteredError


def _get_messaging_service(app: Optional[App]) -> _MessagingService:
    return _utils.get_app_service(app, _MESSAGING_ATTRIBUTE, _MessagingService)

def send(message: Message, dry_run: bool = False, app: Optional[App] = None) -> str:
    """Sends the given message via Firebase Cloud Messaging (FCM).

    If the ``dry_run`` mode is enabled, the message will not be actually delivered to the
    recipients. Instead, FCM performs all the usual validations and emulates the send operation.

    Args:
        message: An instance of ``messaging.Message``.
        dry_run: A boolean indicating whether to run the operation in dry run mode (optional).
        app: An App instance (optional).

    Returns:
        string: A message ID string that uniquely identifies the sent message.

    Raises:
        FirebaseError: If an error occurs while sending the message to the FCM service.
        ValueError: If the input arguments are invalid.
    """
    return _get_messaging_service(app).send(message, dry_run)

def send_each(
        messages: List[Message],
        dry_run: bool = False,
        app: Optional[App] = None
    ) -> BatchResponse:
    """Sends each message in the given list via Firebase Cloud Messaging.

    If the ``dry_run`` mode is enabled, the message will not be actually delivered to the
    recipients. Instead, FCM performs all the usual validations and emulates the send operation.

    Args:
        messages: A list of ``messaging.Message`` instances.
        dry_run: A boolean indicating whether to run the operation in dry run mode (optional).
        app: An App instance (optional).

    Returns:
        BatchResponse: A ``messaging.BatchResponse`` instance.

    Raises:
        FirebaseError: If an error occurs while sending the message to the FCM service.
        ValueError: If the input arguments are invalid.
    """
    return _get_messaging_service(app).send_each(messages, dry_run)

async def send_each_async(
        messages: List[Message],
        dry_run: bool = False,
        app: Optional[App] = None
    ) -> BatchResponse:
    """Sends each message in the given list asynchronously via Firebase Cloud Messaging.

    If the ``dry_run`` mode is enabled, the message will not be actually delivered to the
    recipients. Instead, FCM performs all the usual validations and emulates the send operation.

    Args:
        messages: A list of ``messaging.Message`` instances.
        dry_run: A boolean indicating whether to run the operation in dry run mode (optional).
        app: An App instance (optional).

    Returns:
        BatchResponse: A ``messaging.BatchResponse`` instance.

    Raises:
        FirebaseError: If an error occurs while sending the message to the FCM service.
        ValueError: If the input arguments are invalid.
    """
    return await _get_messaging_service(app).send_each_async(messages, dry_run)

async def send_each_for_multicast_async(
        multicast_message: MulticastMessage,
        dry_run: bool = False,
        app: Optional[App] = None
    ) -> BatchResponse:
    """Sends the given mutlicast message to each token asynchronously via Firebase Cloud Messaging
    (FCM).

    If the ``dry_run`` mode is enabled, the message will not be actually delivered to the
    recipients. Instead, FCM performs all the usual validations and emulates the send operation.

    Args:
        multicast_message: An instance of ``messaging.MulticastMessage``.
        dry_run: A boolean indicating whether to run the operation in dry run mode (optional).
        app: An App instance (optional).

    Returns:
        BatchResponse: A ``messaging.BatchResponse`` instance.

    Raises:
        FirebaseError: If an error occurs while sending the message to the FCM service.
        ValueError: If the input arguments are invalid.
    """
    if not isinstance(multicast_message, MulticastMessage):
        raise ValueError('Message must be an instance of messaging.MulticastMessage class.')
    messages = [Message(
        data=multicast_message.data,
        notification=multicast_message.notification,
        android=multicast_message.android,
        webpush=multicast_message.webpush,
        apns=multicast_message.apns,
        fcm_options=multicast_message.fcm_options,
        token=token
    ) for token in multicast_message.tokens]
    return await _get_messaging_service(app).send_each_async(messages, dry_run)

def send_each_for_multicast(multicast_message, dry_run=False, app=None):
    """Sends the given mutlicast message to each token via Firebase Cloud Messaging (FCM).

    If the ``dry_run`` mode is enabled, the message will not be actually delivered to the
    recipients. Instead, FCM performs all the usual validations and emulates the send operation.

    Args:
        multicast_message: An instance of ``messaging.MulticastMessage``.
        dry_run: A boolean indicating whether to run the operation in dry run mode (optional).
        app: An App instance (optional).

    Returns:
        BatchResponse: A ``messaging.BatchResponse`` instance.

    Raises:
        FirebaseError: If an error occurs while sending the message to the FCM service.
        ValueError: If the input arguments are invalid.
    """
    if not isinstance(multicast_message, MulticastMessage):
        raise ValueError('Message must be an instance of messaging.MulticastMessage class.')
    messages = [Message(
        data=multicast_message.data,
        notification=multicast_message.notification,
        android=multicast_message.android,
        webpush=multicast_message.webpush,
        apns=multicast_message.apns,
        fcm_options=multicast_message.fcm_options,
        token=token
    ) for token in multicast_message.tokens]
    return _get_messaging_service(app).send_each(messages, dry_run)

def send_all(messages, dry_run=False, app=None):
    """Sends the given list of messages via Firebase Cloud Messaging as a single batch.

    If the ``dry_run`` mode is enabled, the message will not be actually delivered to the
    recipients. Instead, FCM performs all the usual validations and emulates the send operation.

    Args:
        messages: A list of ``messaging.Message`` instances.
        dry_run: A boolean indicating whether to run the operation in dry run mode (optional).
        app: An App instance (optional).

    Returns:
        BatchResponse: A ``messaging.BatchResponse`` instance.

    Raises:
        FirebaseError: If an error occurs while sending the message to the FCM service.
        ValueError: If the input arguments are invalid.

    send_all() is deprecated. Use send_each() instead.
    """
    warnings.warn('send_all() is deprecated. Use send_each() instead.', DeprecationWarning)
    return _get_messaging_service(app).send_all(messages, dry_run)

def send_multicast(multicast_message, dry_run=False, app=None):
    """Sends the given mutlicast message to all tokens via Firebase Cloud Messaging (FCM).

    If the ``dry_run`` mode is enabled, the message will not be actually delivered to the
    recipients. Instead, FCM performs all the usual validations and emulates the send operation.

    Args:
        multicast_message: An instance of ``messaging.MulticastMessage``.
        dry_run: A boolean indicating whether to run the operation in dry run mode (optional).
        app: An App instance (optional).

    Returns:
        BatchResponse: A ``messaging.BatchResponse`` instance.

    Raises:
        FirebaseError: If an error occurs while sending the message to the FCM service.
        ValueError: If the input arguments are invalid.

    send_multicast() is deprecated. Use send_each_for_multicast() instead.
    """
    warnings.warn('send_multicast() is deprecated. Use send_each_for_multicast() instead.',
                  DeprecationWarning)
    if not isinstance(multicast_message, MulticastMessage):
        raise ValueError('Message must be an instance of messaging.MulticastMessage class.')
    messages = [Message(
        data=multicast_message.data,
        notification=multicast_message.notification,
        android=multicast_message.android,
        webpush=multicast_message.webpush,
        apns=multicast_message.apns,
        fcm_options=multicast_message.fcm_options,
        token=token
    ) for token in multicast_message.tokens]
    return _get_messaging_service(app).send_all(messages, dry_run)

def subscribe_to_topic(tokens, topic, app=None):
    """Subscribes a list of registration tokens to an FCM topic.

    Args:
        tokens: A non-empty list of device registration tokens. List may not have more than 1000
            elements.
        topic: Name of the topic to subscribe to. May contain the ``/topics/`` prefix.
        app: An App instance (optional).

    Returns:
        TopicManagementResponse: A ``TopicManagementResponse`` instance.

    Raises:
        FirebaseError: If an error occurs while communicating with instance ID service.
        ValueError: If the input arguments are invalid.
    """
    return _get_messaging_service(app).make_topic_management_request(
        tokens, topic, 'iid/v1:batchAdd')

def unsubscribe_from_topic(tokens, topic, app=None):
    """Unsubscribes a list of registration tokens from an FCM topic.

    Args:
        tokens: A non-empty list of device registration tokens. List may not have more than 1000
            elements.
        topic: Name of the topic to unsubscribe from. May contain the ``/topics/`` prefix.
        app: An App instance (optional).

    Returns:
        TopicManagementResponse: A ``TopicManagementResponse`` instance.

    Raises:
        FirebaseError: If an error occurs while communicating with instance ID service.
        ValueError: If the input arguments are invalid.
    """
    return _get_messaging_service(app).make_topic_management_request(
        tokens, topic, 'iid/v1:batchRemove')


class ErrorInfo:
    """An error encountered when performing a topic management operation."""

    def __init__(self, index, reason):
        self._index = index
        self._reason = reason

    @property
    def index(self):
        """Index of the registration token to which this error is related to."""
        return self._index

    @property
    def reason(self):
        """String describing the nature of the error."""
        return self._reason


class TopicManagementResponse:
    """The response received from a topic management operation."""

    def __init__(self, resp):
        if not isinstance(resp, dict) or 'results' not in resp:
            raise ValueError('Unexpected topic management response: {0}.'.format(resp))
        self._success_count = 0
        self._failure_count = 0
        self._errors = []
        for index, result in enumerate(resp['results']):
            if 'error' in result:
                self._failure_count += 1
                self._errors.append(ErrorInfo(index, result['error']))
            else:
                self._success_count += 1

    @property
    def success_count(self):
        """Number of tokens that were successfully subscribed or unsubscribed."""
        return self._success_count

    @property
    def failure_count(self):
        """Number of tokens that could not be subscribed or unsubscribed due to errors."""
        return self._failure_count

    @property
    def errors(self):
        """A list of ``messaging.ErrorInfo`` objects (possibly empty)."""
        return self._errors


class BatchResponse:
    """The response received from a batch request to the FCM API."""

    def __init__(self, responses: List[SendResponse]) -> None:
        self._responses = responses
        self._success_count = sum(1 for resp in responses if resp.success)

    @property
    def responses(self) -> List[SendResponse]:
        """A list of ``messaging.SendResponse`` objects (possibly empty)."""
        return self._responses

    @property
    def success_count(self) -> int:
        return self._success_count

    @property
    def failure_count(self) -> int:
        return len(self.responses) - self.success_count


class SendResponse:
    """The response received from an individual batched request to the FCM API."""

    def __init__(self, resp, exception):
        self._exception = exception
        self._message_id = None
        if resp:
            self._message_id = resp.get('name', None)

    @property
    def message_id(self):
        """A message ID string that uniquely identifies the message."""
        return self._message_id

    @property
    def success(self):
        """A boolean indicating if the request was successful."""
        return self._message_id is not None and not self._exception

    @property
    def exception(self):
        """A ``FirebaseError`` if an error occurs while sending the message to the FCM service."""
        return self._exception

class _MessagingService:
    """Service class that implements Firebase Cloud Messaging (FCM) functionality."""

    FCM_URL = 'https://fcm.googleapis.com/v1/projects/{0}/messages:send'
    FCM_BATCH_URL = 'https://fcm.googleapis.com/batch'
    IID_URL = 'https://iid.googleapis.com'
    IID_HEADERS = {'access_token_auth': 'true'}
    JSON_ENCODER = _messaging_encoder.MessageEncoder()

    FCM_ERROR_TYPES = {
        'APNS_AUTH_ERROR': ThirdPartyAuthError,
        'QUOTA_EXCEEDED': QuotaExceededError,
        'SENDER_ID_MISMATCH': SenderIdMismatchError,
        'THIRD_PARTY_AUTH_ERROR': ThirdPartyAuthError,
        'UNREGISTERED': UnregisteredError,
    }

    def __init__(self, app: App) -> None:
        project_id = app.project_id
        if not project_id:
            raise ValueError(
                'Project ID is required to access Cloud Messaging service. Either set the '
                'projectId option, or use service account credentials. Alternatively, set the '
                'GOOGLE_CLOUD_PROJECT environment variable.')
        self._fcm_url = _MessagingService.FCM_URL.format(project_id)
        self._fcm_headers = {
            'X-GOOG-API-FORMAT-VERSION': '2',
            'X-FIREBASE-CLIENT': 'fire-admin-python/{0}'.format(firebase_admin.__version__),
        }
        timeout = app.options.get('httpTimeout', _http_client.DEFAULT_TIMEOUT_SECONDS)
        self._credential = app.credential.get_credential()
        self._client = _http_client.JsonHttpClient(credential=self._credential, timeout=timeout)
        self._async_client = _http_client.HttpxAsyncClient(
            credential=self._credential, timeout=timeout)
        self._build_transport = _auth.authorized_http

    @classmethod
    def encode_message(cls, message):
        if not isinstance(message, Message):
            raise ValueError('Message must be an instance of messaging.Message class.')
        return cls.JSON_ENCODER.default(message)

    def send(self, message: Message, dry_run: bool = False) -> str:
        """Sends the given message to FCM via the FCM v1 API."""
        data = self._message_data(message, dry_run)
        try:
            resp = self._client.body(
                'post',
                url=self._fcm_url,
                headers=self._fcm_headers,
                json=data
            )
        except requests.exceptions.RequestException as error:
            raise self._handle_fcm_error(error)
        else:
            return cast(str, resp['name'])

    def send_each(self, messages: List[Message], dry_run: bool = False) -> BatchResponse:
        """Sends the given messages to FCM via the FCM v1 API."""
        if not isinstance(messages, list):
            raise ValueError('messages must be a list of messaging.Message instances.')
        if len(messages) > 500:
            raise ValueError('messages must not contain more than 500 elements.')

        def send_data(data):
            try:
                resp = self._client.body(
                    'post',
                    url=self._fcm_url,
                    headers=self._fcm_headers,
                    json=data)
            except requests.exceptions.RequestException as exception:
                return SendResponse(resp=None, exception=self._handle_fcm_error(exception))
            else:
                return SendResponse(resp, exception=None)

        message_data = [self._message_data(message, dry_run) for message in messages]
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=len(message_data)) as executor:
                responses = [resp for resp in executor.map(send_data, message_data)]
                return BatchResponse(responses)
        except Exception as error:
            raise exceptions.UnknownError(
                message='Unknown error while making remote service calls: {0}'.format(error),
                cause=error)

    async def send_each_async(self, messages: List[Message], dry_run: bool = True) -> BatchResponse:
        """Sends the given messages to FCM via the FCM v1 API."""
        if not isinstance(messages, list):
            raise ValueError('messages must be a list of messaging.Message instances.')
        if len(messages) > 500:
            raise ValueError('messages must not contain more than 500 elements.')

        async def send_data(data):
            try:
                resp = await self._async_client.request(
                    'post',
                    url=self._fcm_url,
                    headers=self._fcm_headers,
                    json=data)
            except httpx.HTTPError as exception:
                return SendResponse(resp=None, exception=self._handle_fcm_httpx_error(exception))
            # Catch errors caused by the requests library during authorization
            except requests.exceptions.RequestException as exception:
                return SendResponse(resp=None, exception=self._handle_fcm_error(exception))
            else:
                return SendResponse(resp.json(), exception=None)

        message_data = [self._message_data(message, dry_run) for message in messages]
        try:
            responses = await asyncio.gather(*[send_data(message) for message in message_data])
            return BatchResponse(responses)
        except Exception as error:
            raise exceptions.UnknownError(
                message='Unknown error while making remote service calls: {0}'.format(error),
                cause=error)


    def send_all(self, messages, dry_run=False):
        """Sends the given messages to FCM via the batch API."""
        if not isinstance(messages, list):
            raise ValueError('messages must be a list of messaging.Message instances.')
        if len(messages) > 500:
            raise ValueError('messages must not contain more than 500 elements.')

        responses = []

        def batch_callback(_, response, error):
            exception = None
            if error:
                exception = self._handle_batch_error(error)
            send_response = SendResponse(response, exception)
            responses.append(send_response)

        batch = http.BatchHttpRequest(
            callback=batch_callback, batch_uri=_MessagingService.FCM_BATCH_URL)
        transport = self._build_transport(self._credential)
        for message in messages:
            body = json.dumps(self._message_data(message, dry_run))
            req = http.HttpRequest(
                http=transport,
                postproc=self._postproc,
                uri=self._fcm_url,
                method='POST',
                body=body,
                headers=self._fcm_headers
            )
            batch.add(req)

        try:
            batch.execute()
        except Exception as error:
            raise self._handle_batch_error(error)
        else:
            return BatchResponse(responses)

    def make_topic_management_request(self, tokens, topic, operation):
        """Invokes the IID service for topic management functionality."""
        if isinstance(tokens, str):
            tokens = [tokens]
        if not isinstance(tokens, list) or not tokens:
            raise ValueError('Tokens must be a string or a non-empty list of strings.')
        invalid_str = [t for t in tokens if not isinstance(t, str) or not t]
        if invalid_str:
            raise ValueError('Tokens must be non-empty strings.')

        if not isinstance(topic, str) or not topic:
            raise ValueError('Topic must be a non-empty string.')
        if not topic.startswith('/topics/'):
            topic = '/topics/{0}'.format(topic)
        data = {
            'to': topic,
            'registration_tokens': tokens,
        }
        url = '{0}/{1}'.format(_MessagingService.IID_URL, operation)
        try:
            resp = self._client.body(
                'post',
                url=url,
                json=data,
                headers=_MessagingService.IID_HEADERS
            )
        except requests.exceptions.RequestException as error:
            raise self._handle_iid_error(error)
        else:
            return TopicManagementResponse(resp)

    def _message_data(self, message, dry_run):
        data = {'message': _MessagingService.encode_message(message)}
        if dry_run:
            data['validate_only'] = True
        return data

    def _postproc(self, _, body):
        """Handle response from batch API request."""
        # This only gets called for 2xx responses.
        return json.loads(body.decode())

    def _handle_fcm_error(self, error):
        """Handles errors received from the FCM API."""
        return _utils.handle_platform_error_from_requests(
            error, _MessagingService._build_fcm_error_requests)

    def _handle_fcm_httpx_error(self, error: httpx.HTTPError) -> exceptions.FirebaseError:
        """Handles errors received from the FCM API."""
        return _utils.handle_platform_error_from_httpx(
            error, _MessagingService._build_fcm_error_httpx)

    def _handle_iid_error(self, error):
        """Handles errors received from the Instance ID API."""
        if error.response is None:
            raise _utils.handle_requests_error(error)

        data = {}
        try:
            parsed_body = error.response.json()
            if isinstance(parsed_body, dict):
                data = parsed_body
        except ValueError:
            pass

        # IID error response format: {"error": "ErrorCode"}
        code = data.get('error')
        msg = None
        if code:
            msg = 'Error while calling the IID service: {0}'.format(code)
        else:
            msg = 'Unexpected HTTP response with status: {0}; body: {1}'.format(
                error.response.status_code, error.response.content.decode())

        return _utils.handle_requests_error(error, msg)

    def _handle_batch_error(self, error):
        """Handles errors received from the googleapiclient while making batch requests."""
        return _gapic_utils.handle_platform_error_from_googleapiclient(
            error, _MessagingService._build_fcm_error_googleapiclient)

    def close(self) -> None:
        asyncio.run(self._async_client.aclose())

    @classmethod
    def _build_fcm_error_requests(cls, error, message, error_dict):
        """Parses an error response from the FCM API and creates a FCM-specific exception if
        appropriate."""
        exc_type = cls._build_fcm_error(error_dict)
        return exc_type(message, cause=error, http_response=error.response) if exc_type else None

    @classmethod
    def _build_fcm_error_httpx(
            cls,
            error: httpx.HTTPError,
            message: str,
            error_dict: Optional[Dict[str, Any]]
        ) -> Optional[exceptions.FirebaseError]:
        """Parses a httpx error response from the FCM API and creates a FCM-specific exception if
        appropriate."""
        exc_type = cls._build_fcm_error(error_dict)
        if isinstance(error, httpx.HTTPStatusError):
            return exc_type(
                message, cause=error, http_response=error.response) if exc_type else None
        return exc_type(message, cause=error) if exc_type else None


    @classmethod
    def _build_fcm_error_googleapiclient(cls, error, message, error_dict, http_response):
        """Parses an error response from the FCM API and creates a FCM-specific exception if
        appropriate."""
        exc_type = cls._build_fcm_error(error_dict)
        return exc_type(message, cause=error, http_response=http_response) if exc_type else None

    @classmethod
    def _build_fcm_error(
            cls,
            error_dict: Optional[Dict[str, Any]]
        ) -> Optional[Callable[..., exceptions.FirebaseError]]:
        """Parses an error response to determine the appropriate FCM-specific error type."""
        if not error_dict:
            return None
        fcm_code = None
        for detail in error_dict.get('details', []):
            if detail.get('@type') == 'type.googleapis.com/google.firebase.fcm.v1.FcmError':
                fcm_code = detail.get('errorCode')
                break
        return _MessagingService.FCM_ERROR_TYPES.get(fcm_code) if fcm_code else None
