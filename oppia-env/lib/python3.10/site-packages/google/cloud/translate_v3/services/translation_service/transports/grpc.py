# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
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
#
import json
import logging as std_logging
import pickle
from typing import Callable, Dict, Optional, Sequence, Tuple, Union
import warnings

from google.api_core import gapic_v1, grpc_helpers, operations_v1
import google.auth  # type: ignore
from google.auth import credentials as ga_credentials  # type: ignore
from google.auth.transport.grpc import SslCredentials  # type: ignore
from google.cloud.location import locations_pb2  # type: ignore
from google.iam.v1 import iam_policy_pb2  # type: ignore
from google.iam.v1 import policy_pb2  # type: ignore
from google.longrunning import operations_pb2  # type: ignore
from google.protobuf import empty_pb2  # type: ignore
from google.protobuf.json_format import MessageToJson
import google.protobuf.message
import grpc  # type: ignore
import proto  # type: ignore

from google.cloud.translate_v3.types import (
    adaptive_mt,
    automl_translation,
    common,
    translation_service,
)

from .base import DEFAULT_CLIENT_INFO, TranslationServiceTransport

try:
    from google.api_core import client_logging  # type: ignore

    CLIENT_LOGGING_SUPPORTED = True  # pragma: NO COVER
except ImportError:  # pragma: NO COVER
    CLIENT_LOGGING_SUPPORTED = False

_LOGGER = std_logging.getLogger(__name__)


class _LoggingClientInterceptor(grpc.UnaryUnaryClientInterceptor):  # pragma: NO COVER
    def intercept_unary_unary(self, continuation, client_call_details, request):
        logging_enabled = CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
            std_logging.DEBUG
        )
        if logging_enabled:  # pragma: NO COVER
            request_metadata = client_call_details.metadata
            if isinstance(request, proto.Message):
                request_payload = type(request).to_json(request)
            elif isinstance(request, google.protobuf.message.Message):
                request_payload = MessageToJson(request)
            else:
                request_payload = f"{type(request).__name__}: {pickle.dumps(request)}"

            request_metadata = {
                key: value.decode("utf-8") if isinstance(value, bytes) else value
                for key, value in request_metadata
            }
            grpc_request = {
                "payload": request_payload,
                "requestMethod": "grpc",
                "metadata": dict(request_metadata),
            }
            _LOGGER.debug(
                f"Sending request for {client_call_details.method}",
                extra={
                    "serviceName": "google.cloud.translation.v3.TranslationService",
                    "rpcName": str(client_call_details.method),
                    "request": grpc_request,
                    "metadata": grpc_request["metadata"],
                },
            )
        response = continuation(client_call_details, request)
        if logging_enabled:  # pragma: NO COVER
            response_metadata = response.trailing_metadata()
            # Convert gRPC metadata `<class 'grpc.aio._metadata.Metadata'>` to list of tuples
            metadata = (
                dict([(k, str(v)) for k, v in response_metadata])
                if response_metadata
                else None
            )
            result = response.result()
            if isinstance(result, proto.Message):
                response_payload = type(result).to_json(result)
            elif isinstance(result, google.protobuf.message.Message):
                response_payload = MessageToJson(result)
            else:
                response_payload = f"{type(result).__name__}: {pickle.dumps(result)}"
            grpc_response = {
                "payload": response_payload,
                "metadata": metadata,
                "status": "OK",
            }
            _LOGGER.debug(
                f"Received response for {client_call_details.method}.",
                extra={
                    "serviceName": "google.cloud.translation.v3.TranslationService",
                    "rpcName": client_call_details.method,
                    "response": grpc_response,
                    "metadata": grpc_response["metadata"],
                },
            )
        return response


class TranslationServiceGrpcTransport(TranslationServiceTransport):
    """gRPC backend transport for TranslationService.

    Provides natural language translation operations.

    This class defines the same methods as the primary client, so the
    primary client can load the underlying transport implementation
    and call it.

    It sends protocol buffers over the wire using gRPC (which is built on
    top of HTTP/2); the ``grpcio`` package must be installed.
    """

    _stubs: Dict[str, Callable]

    def __init__(
        self,
        *,
        host: str = "translate.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        channel: Optional[Union[grpc.Channel, Callable[..., grpc.Channel]]] = None,
        api_mtls_endpoint: Optional[str] = None,
        client_cert_source: Optional[Callable[[], Tuple[bytes, bytes]]] = None,
        ssl_channel_credentials: Optional[grpc.ChannelCredentials] = None,
        client_cert_source_for_mtls: Optional[Callable[[], Tuple[bytes, bytes]]] = None,
        quota_project_id: Optional[str] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
        always_use_jwt_access: Optional[bool] = False,
        api_audience: Optional[str] = None,
    ) -> None:
        """Instantiate the transport.

        Args:
            host (Optional[str]):
                 The hostname to connect to (default: 'translate.googleapis.com').
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
                This argument is ignored if a ``channel`` instance is provided.
            credentials_file (Optional[str]): A file with credentials that can
                be loaded with :func:`google.auth.load_credentials_from_file`.
                This argument is ignored if a ``channel`` instance is provided.
            scopes (Optional(Sequence[str])): A list of scopes. This argument is
                ignored if a ``channel`` instance is provided.
            channel (Optional[Union[grpc.Channel, Callable[..., grpc.Channel]]]):
                A ``Channel`` instance through which to make calls, or a Callable
                that constructs and returns one. If set to None, ``self.create_channel``
                is used to create the channel. If a Callable is given, it will be called
                with the same arguments as used in ``self.create_channel``.
            api_mtls_endpoint (Optional[str]): Deprecated. The mutual TLS endpoint.
                If provided, it overrides the ``host`` argument and tries to create
                a mutual TLS channel with client SSL credentials from
                ``client_cert_source`` or application default SSL credentials.
            client_cert_source (Optional[Callable[[], Tuple[bytes, bytes]]]):
                Deprecated. A callback to provide client SSL certificate bytes and
                private key bytes, both in PEM format. It is ignored if
                ``api_mtls_endpoint`` is None.
            ssl_channel_credentials (grpc.ChannelCredentials): SSL credentials
                for the grpc channel. It is ignored if a ``channel`` instance is provided.
            client_cert_source_for_mtls (Optional[Callable[[], Tuple[bytes, bytes]]]):
                A callback to provide client certificate bytes and private key bytes,
                both in PEM format. It is used to configure a mutual TLS channel. It is
                ignored if a ``channel`` instance or ``ssl_channel_credentials`` is provided.
            quota_project_id (Optional[str]): An optional project to use for billing
                and quota.
            client_info (google.api_core.gapic_v1.client_info.ClientInfo):
                The client info used to send a user-agent string along with
                API requests. If ``None``, then default info will be used.
                Generally, you only need to set this if you're developing
                your own client library.
            always_use_jwt_access (Optional[bool]): Whether self signed JWT should
                be used for service account credentials.

        Raises:
          google.auth.exceptions.MutualTLSChannelError: If mutual TLS transport
              creation failed for any reason.
          google.api_core.exceptions.DuplicateCredentialArgs: If both ``credentials``
              and ``credentials_file`` are passed.
        """
        self._grpc_channel = None
        self._ssl_channel_credentials = ssl_channel_credentials
        self._stubs: Dict[str, Callable] = {}
        self._operations_client: Optional[operations_v1.OperationsClient] = None

        if api_mtls_endpoint:
            warnings.warn("api_mtls_endpoint is deprecated", DeprecationWarning)
        if client_cert_source:
            warnings.warn("client_cert_source is deprecated", DeprecationWarning)

        if isinstance(channel, grpc.Channel):
            # Ignore credentials if a channel was passed.
            credentials = None
            self._ignore_credentials = True
            # If a channel was explicitly provided, set it.
            self._grpc_channel = channel
            self._ssl_channel_credentials = None

        else:
            if api_mtls_endpoint:
                host = api_mtls_endpoint

                # Create SSL credentials with client_cert_source or application
                # default SSL credentials.
                if client_cert_source:
                    cert, key = client_cert_source()
                    self._ssl_channel_credentials = grpc.ssl_channel_credentials(
                        certificate_chain=cert, private_key=key
                    )
                else:
                    self._ssl_channel_credentials = SslCredentials().ssl_credentials

            else:
                if client_cert_source_for_mtls and not ssl_channel_credentials:
                    cert, key = client_cert_source_for_mtls()
                    self._ssl_channel_credentials = grpc.ssl_channel_credentials(
                        certificate_chain=cert, private_key=key
                    )

        # The base transport sets the host, credentials and scopes
        super().__init__(
            host=host,
            credentials=credentials,
            credentials_file=credentials_file,
            scopes=scopes,
            quota_project_id=quota_project_id,
            client_info=client_info,
            always_use_jwt_access=always_use_jwt_access,
            api_audience=api_audience,
        )

        if not self._grpc_channel:
            # initialize with the provided callable or the default channel
            channel_init = channel or type(self).create_channel
            self._grpc_channel = channel_init(
                self._host,
                # use the credentials which are saved
                credentials=self._credentials,
                # Set ``credentials_file`` to ``None`` here as
                # the credentials that we saved earlier should be used.
                credentials_file=None,
                scopes=self._scopes,
                ssl_credentials=self._ssl_channel_credentials,
                quota_project_id=quota_project_id,
                options=[
                    ("grpc.max_send_message_length", -1),
                    ("grpc.max_receive_message_length", -1),
                ],
            )

        self._interceptor = _LoggingClientInterceptor()
        self._logged_channel = grpc.intercept_channel(
            self._grpc_channel, self._interceptor
        )

        # Wrap messages. This must be done after self._logged_channel exists
        self._prep_wrapped_messages(client_info)

    @classmethod
    def create_channel(
        cls,
        host: str = "translate.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        quota_project_id: Optional[str] = None,
        **kwargs,
    ) -> grpc.Channel:
        """Create and return a gRPC channel object.
        Args:
            host (Optional[str]): The host for the channel to use.
            credentials (Optional[~.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify this application to the service. If
                none are specified, the client will attempt to ascertain
                the credentials from the environment.
            credentials_file (Optional[str]): A file with credentials that can
                be loaded with :func:`google.auth.load_credentials_from_file`.
                This argument is mutually exclusive with credentials.
            scopes (Optional[Sequence[str]]): A optional list of scopes needed for this
                service. These are only used when credentials are not specified and
                are passed to :func:`google.auth.default`.
            quota_project_id (Optional[str]): An optional project to use for billing
                and quota.
            kwargs (Optional[dict]): Keyword arguments, which are passed to the
                channel creation.
        Returns:
            grpc.Channel: A gRPC channel object.

        Raises:
            google.api_core.exceptions.DuplicateCredentialArgs: If both ``credentials``
              and ``credentials_file`` are passed.
        """

        return grpc_helpers.create_channel(
            host,
            credentials=credentials,
            credentials_file=credentials_file,
            quota_project_id=quota_project_id,
            default_scopes=cls.AUTH_SCOPES,
            scopes=scopes,
            default_host=cls.DEFAULT_HOST,
            **kwargs,
        )

    @property
    def grpc_channel(self) -> grpc.Channel:
        """Return the channel designed to connect to this service."""
        return self._grpc_channel

    @property
    def operations_client(self) -> operations_v1.OperationsClient:
        """Create the client designed to process long-running operations.

        This property caches on the instance; repeated calls return the same
        client.
        """
        # Quick check: Only create a new client if we do not already have one.
        if self._operations_client is None:
            self._operations_client = operations_v1.OperationsClient(
                self._logged_channel
            )

        # Return the client from cache.
        return self._operations_client

    @property
    def translate_text(
        self,
    ) -> Callable[
        [translation_service.TranslateTextRequest],
        translation_service.TranslateTextResponse,
    ]:
        r"""Return a callable for the translate text method over gRPC.

        Translates input text and returns translated text.

        Returns:
            Callable[[~.TranslateTextRequest],
                    ~.TranslateTextResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "translate_text" not in self._stubs:
            self._stubs["translate_text"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/TranslateText",
                request_serializer=translation_service.TranslateTextRequest.serialize,
                response_deserializer=translation_service.TranslateTextResponse.deserialize,
            )
        return self._stubs["translate_text"]

    @property
    def romanize_text(
        self,
    ) -> Callable[
        [translation_service.RomanizeTextRequest],
        translation_service.RomanizeTextResponse,
    ]:
        r"""Return a callable for the romanize text method over gRPC.

        Romanize input text written in non-Latin scripts to
        Latin text.

        Returns:
            Callable[[~.RomanizeTextRequest],
                    ~.RomanizeTextResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "romanize_text" not in self._stubs:
            self._stubs["romanize_text"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/RomanizeText",
                request_serializer=translation_service.RomanizeTextRequest.serialize,
                response_deserializer=translation_service.RomanizeTextResponse.deserialize,
            )
        return self._stubs["romanize_text"]

    @property
    def detect_language(
        self,
    ) -> Callable[
        [translation_service.DetectLanguageRequest],
        translation_service.DetectLanguageResponse,
    ]:
        r"""Return a callable for the detect language method over gRPC.

        Detects the language of text within a request.

        Returns:
            Callable[[~.DetectLanguageRequest],
                    ~.DetectLanguageResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "detect_language" not in self._stubs:
            self._stubs["detect_language"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/DetectLanguage",
                request_serializer=translation_service.DetectLanguageRequest.serialize,
                response_deserializer=translation_service.DetectLanguageResponse.deserialize,
            )
        return self._stubs["detect_language"]

    @property
    def get_supported_languages(
        self,
    ) -> Callable[
        [translation_service.GetSupportedLanguagesRequest],
        translation_service.SupportedLanguages,
    ]:
        r"""Return a callable for the get supported languages method over gRPC.

        Returns a list of supported languages for
        translation.

        Returns:
            Callable[[~.GetSupportedLanguagesRequest],
                    ~.SupportedLanguages]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_supported_languages" not in self._stubs:
            self._stubs["get_supported_languages"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/GetSupportedLanguages",
                request_serializer=translation_service.GetSupportedLanguagesRequest.serialize,
                response_deserializer=translation_service.SupportedLanguages.deserialize,
            )
        return self._stubs["get_supported_languages"]

    @property
    def translate_document(
        self,
    ) -> Callable[
        [translation_service.TranslateDocumentRequest],
        translation_service.TranslateDocumentResponse,
    ]:
        r"""Return a callable for the translate document method over gRPC.

        Translates documents in synchronous mode.

        Returns:
            Callable[[~.TranslateDocumentRequest],
                    ~.TranslateDocumentResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "translate_document" not in self._stubs:
            self._stubs["translate_document"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/TranslateDocument",
                request_serializer=translation_service.TranslateDocumentRequest.serialize,
                response_deserializer=translation_service.TranslateDocumentResponse.deserialize,
            )
        return self._stubs["translate_document"]

    @property
    def batch_translate_text(
        self,
    ) -> Callable[
        [translation_service.BatchTranslateTextRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the batch translate text method over gRPC.

        Translates a large volume of text in asynchronous
        batch mode. This function provides real-time output as
        the inputs are being processed. If caller cancels a
        request, the partial results (for an input file, it's
        all or nothing) may still be available on the specified
        output location.

        This call returns immediately and you can
        use google.longrunning.Operation.name to poll the status
        of the call.

        Returns:
            Callable[[~.BatchTranslateTextRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "batch_translate_text" not in self._stubs:
            self._stubs["batch_translate_text"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/BatchTranslateText",
                request_serializer=translation_service.BatchTranslateTextRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["batch_translate_text"]

    @property
    def batch_translate_document(
        self,
    ) -> Callable[
        [translation_service.BatchTranslateDocumentRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the batch translate document method over gRPC.

        Translates a large volume of document in asynchronous
        batch mode. This function provides real-time output as
        the inputs are being processed. If caller cancels a
        request, the partial results (for an input file, it's
        all or nothing) may still be available on the specified
        output location.

        This call returns immediately and you can use
        google.longrunning.Operation.name to poll the status of
        the call.

        Returns:
            Callable[[~.BatchTranslateDocumentRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "batch_translate_document" not in self._stubs:
            self._stubs["batch_translate_document"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/BatchTranslateDocument",
                request_serializer=translation_service.BatchTranslateDocumentRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["batch_translate_document"]

    @property
    def create_glossary(
        self,
    ) -> Callable[
        [translation_service.CreateGlossaryRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the create glossary method over gRPC.

        Creates a glossary and returns the long-running operation.
        Returns NOT_FOUND, if the project doesn't exist.

        Returns:
            Callable[[~.CreateGlossaryRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_glossary" not in self._stubs:
            self._stubs["create_glossary"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/CreateGlossary",
                request_serializer=translation_service.CreateGlossaryRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["create_glossary"]

    @property
    def update_glossary(
        self,
    ) -> Callable[
        [translation_service.UpdateGlossaryRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the update glossary method over gRPC.

        Updates a glossary. A LRO is used since the update
        can be async if the glossary's entry file is updated.

        Returns:
            Callable[[~.UpdateGlossaryRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "update_glossary" not in self._stubs:
            self._stubs["update_glossary"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/UpdateGlossary",
                request_serializer=translation_service.UpdateGlossaryRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["update_glossary"]

    @property
    def list_glossaries(
        self,
    ) -> Callable[
        [translation_service.ListGlossariesRequest],
        translation_service.ListGlossariesResponse,
    ]:
        r"""Return a callable for the list glossaries method over gRPC.

        Lists glossaries in a project. Returns NOT_FOUND, if the project
        doesn't exist.

        Returns:
            Callable[[~.ListGlossariesRequest],
                    ~.ListGlossariesResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_glossaries" not in self._stubs:
            self._stubs["list_glossaries"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ListGlossaries",
                request_serializer=translation_service.ListGlossariesRequest.serialize,
                response_deserializer=translation_service.ListGlossariesResponse.deserialize,
            )
        return self._stubs["list_glossaries"]

    @property
    def get_glossary(
        self,
    ) -> Callable[
        [translation_service.GetGlossaryRequest], translation_service.Glossary
    ]:
        r"""Return a callable for the get glossary method over gRPC.

        Gets a glossary. Returns NOT_FOUND, if the glossary doesn't
        exist.

        Returns:
            Callable[[~.GetGlossaryRequest],
                    ~.Glossary]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_glossary" not in self._stubs:
            self._stubs["get_glossary"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/GetGlossary",
                request_serializer=translation_service.GetGlossaryRequest.serialize,
                response_deserializer=translation_service.Glossary.deserialize,
            )
        return self._stubs["get_glossary"]

    @property
    def delete_glossary(
        self,
    ) -> Callable[
        [translation_service.DeleteGlossaryRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the delete glossary method over gRPC.

        Deletes a glossary, or cancels glossary construction if the
        glossary isn't created yet. Returns NOT_FOUND, if the glossary
        doesn't exist.

        Returns:
            Callable[[~.DeleteGlossaryRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_glossary" not in self._stubs:
            self._stubs["delete_glossary"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/DeleteGlossary",
                request_serializer=translation_service.DeleteGlossaryRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["delete_glossary"]

    @property
    def get_glossary_entry(
        self,
    ) -> Callable[[translation_service.GetGlossaryEntryRequest], common.GlossaryEntry]:
        r"""Return a callable for the get glossary entry method over gRPC.

        Gets a single glossary entry by the given id.

        Returns:
            Callable[[~.GetGlossaryEntryRequest],
                    ~.GlossaryEntry]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_glossary_entry" not in self._stubs:
            self._stubs["get_glossary_entry"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/GetGlossaryEntry",
                request_serializer=translation_service.GetGlossaryEntryRequest.serialize,
                response_deserializer=common.GlossaryEntry.deserialize,
            )
        return self._stubs["get_glossary_entry"]

    @property
    def list_glossary_entries(
        self,
    ) -> Callable[
        [translation_service.ListGlossaryEntriesRequest],
        translation_service.ListGlossaryEntriesResponse,
    ]:
        r"""Return a callable for the list glossary entries method over gRPC.

        List the entries for the glossary.

        Returns:
            Callable[[~.ListGlossaryEntriesRequest],
                    ~.ListGlossaryEntriesResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_glossary_entries" not in self._stubs:
            self._stubs["list_glossary_entries"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ListGlossaryEntries",
                request_serializer=translation_service.ListGlossaryEntriesRequest.serialize,
                response_deserializer=translation_service.ListGlossaryEntriesResponse.deserialize,
            )
        return self._stubs["list_glossary_entries"]

    @property
    def create_glossary_entry(
        self,
    ) -> Callable[
        [translation_service.CreateGlossaryEntryRequest], common.GlossaryEntry
    ]:
        r"""Return a callable for the create glossary entry method over gRPC.

        Creates a glossary entry.

        Returns:
            Callable[[~.CreateGlossaryEntryRequest],
                    ~.GlossaryEntry]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_glossary_entry" not in self._stubs:
            self._stubs["create_glossary_entry"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/CreateGlossaryEntry",
                request_serializer=translation_service.CreateGlossaryEntryRequest.serialize,
                response_deserializer=common.GlossaryEntry.deserialize,
            )
        return self._stubs["create_glossary_entry"]

    @property
    def update_glossary_entry(
        self,
    ) -> Callable[
        [translation_service.UpdateGlossaryEntryRequest], common.GlossaryEntry
    ]:
        r"""Return a callable for the update glossary entry method over gRPC.

        Updates a glossary entry.

        Returns:
            Callable[[~.UpdateGlossaryEntryRequest],
                    ~.GlossaryEntry]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "update_glossary_entry" not in self._stubs:
            self._stubs["update_glossary_entry"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/UpdateGlossaryEntry",
                request_serializer=translation_service.UpdateGlossaryEntryRequest.serialize,
                response_deserializer=common.GlossaryEntry.deserialize,
            )
        return self._stubs["update_glossary_entry"]

    @property
    def delete_glossary_entry(
        self,
    ) -> Callable[[translation_service.DeleteGlossaryEntryRequest], empty_pb2.Empty]:
        r"""Return a callable for the delete glossary entry method over gRPC.

        Deletes a single entry from the glossary

        Returns:
            Callable[[~.DeleteGlossaryEntryRequest],
                    ~.Empty]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_glossary_entry" not in self._stubs:
            self._stubs["delete_glossary_entry"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/DeleteGlossaryEntry",
                request_serializer=translation_service.DeleteGlossaryEntryRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["delete_glossary_entry"]

    @property
    def create_dataset(
        self,
    ) -> Callable[[automl_translation.CreateDatasetRequest], operations_pb2.Operation]:
        r"""Return a callable for the create dataset method over gRPC.

        Creates a Dataset.

        Returns:
            Callable[[~.CreateDatasetRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_dataset" not in self._stubs:
            self._stubs["create_dataset"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/CreateDataset",
                request_serializer=automl_translation.CreateDatasetRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["create_dataset"]

    @property
    def get_dataset(
        self,
    ) -> Callable[[automl_translation.GetDatasetRequest], automl_translation.Dataset]:
        r"""Return a callable for the get dataset method over gRPC.

        Gets a Dataset.

        Returns:
            Callable[[~.GetDatasetRequest],
                    ~.Dataset]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_dataset" not in self._stubs:
            self._stubs["get_dataset"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/GetDataset",
                request_serializer=automl_translation.GetDatasetRequest.serialize,
                response_deserializer=automl_translation.Dataset.deserialize,
            )
        return self._stubs["get_dataset"]

    @property
    def list_datasets(
        self,
    ) -> Callable[
        [automl_translation.ListDatasetsRequest],
        automl_translation.ListDatasetsResponse,
    ]:
        r"""Return a callable for the list datasets method over gRPC.

        Lists datasets.

        Returns:
            Callable[[~.ListDatasetsRequest],
                    ~.ListDatasetsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_datasets" not in self._stubs:
            self._stubs["list_datasets"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ListDatasets",
                request_serializer=automl_translation.ListDatasetsRequest.serialize,
                response_deserializer=automl_translation.ListDatasetsResponse.deserialize,
            )
        return self._stubs["list_datasets"]

    @property
    def delete_dataset(
        self,
    ) -> Callable[[automl_translation.DeleteDatasetRequest], operations_pb2.Operation]:
        r"""Return a callable for the delete dataset method over gRPC.

        Deletes a dataset and all of its contents.

        Returns:
            Callable[[~.DeleteDatasetRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_dataset" not in self._stubs:
            self._stubs["delete_dataset"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/DeleteDataset",
                request_serializer=automl_translation.DeleteDatasetRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["delete_dataset"]

    @property
    def create_adaptive_mt_dataset(
        self,
    ) -> Callable[
        [adaptive_mt.CreateAdaptiveMtDatasetRequest], adaptive_mt.AdaptiveMtDataset
    ]:
        r"""Return a callable for the create adaptive mt dataset method over gRPC.

        Creates an Adaptive MT dataset.

        Returns:
            Callable[[~.CreateAdaptiveMtDatasetRequest],
                    ~.AdaptiveMtDataset]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_adaptive_mt_dataset" not in self._stubs:
            self._stubs[
                "create_adaptive_mt_dataset"
            ] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/CreateAdaptiveMtDataset",
                request_serializer=adaptive_mt.CreateAdaptiveMtDatasetRequest.serialize,
                response_deserializer=adaptive_mt.AdaptiveMtDataset.deserialize,
            )
        return self._stubs["create_adaptive_mt_dataset"]

    @property
    def delete_adaptive_mt_dataset(
        self,
    ) -> Callable[[adaptive_mt.DeleteAdaptiveMtDatasetRequest], empty_pb2.Empty]:
        r"""Return a callable for the delete adaptive mt dataset method over gRPC.

        Deletes an Adaptive MT dataset, including all its
        entries and associated metadata.

        Returns:
            Callable[[~.DeleteAdaptiveMtDatasetRequest],
                    ~.Empty]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_adaptive_mt_dataset" not in self._stubs:
            self._stubs[
                "delete_adaptive_mt_dataset"
            ] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/DeleteAdaptiveMtDataset",
                request_serializer=adaptive_mt.DeleteAdaptiveMtDatasetRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["delete_adaptive_mt_dataset"]

    @property
    def get_adaptive_mt_dataset(
        self,
    ) -> Callable[
        [adaptive_mt.GetAdaptiveMtDatasetRequest], adaptive_mt.AdaptiveMtDataset
    ]:
        r"""Return a callable for the get adaptive mt dataset method over gRPC.

        Gets the Adaptive MT dataset.

        Returns:
            Callable[[~.GetAdaptiveMtDatasetRequest],
                    ~.AdaptiveMtDataset]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_adaptive_mt_dataset" not in self._stubs:
            self._stubs["get_adaptive_mt_dataset"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/GetAdaptiveMtDataset",
                request_serializer=adaptive_mt.GetAdaptiveMtDatasetRequest.serialize,
                response_deserializer=adaptive_mt.AdaptiveMtDataset.deserialize,
            )
        return self._stubs["get_adaptive_mt_dataset"]

    @property
    def list_adaptive_mt_datasets(
        self,
    ) -> Callable[
        [adaptive_mt.ListAdaptiveMtDatasetsRequest],
        adaptive_mt.ListAdaptiveMtDatasetsResponse,
    ]:
        r"""Return a callable for the list adaptive mt datasets method over gRPC.

        Lists all Adaptive MT datasets for which the caller
        has read permission.

        Returns:
            Callable[[~.ListAdaptiveMtDatasetsRequest],
                    ~.ListAdaptiveMtDatasetsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_adaptive_mt_datasets" not in self._stubs:
            self._stubs["list_adaptive_mt_datasets"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ListAdaptiveMtDatasets",
                request_serializer=adaptive_mt.ListAdaptiveMtDatasetsRequest.serialize,
                response_deserializer=adaptive_mt.ListAdaptiveMtDatasetsResponse.deserialize,
            )
        return self._stubs["list_adaptive_mt_datasets"]

    @property
    def adaptive_mt_translate(
        self,
    ) -> Callable[
        [adaptive_mt.AdaptiveMtTranslateRequest],
        adaptive_mt.AdaptiveMtTranslateResponse,
    ]:
        r"""Return a callable for the adaptive mt translate method over gRPC.

        Translate text using Adaptive MT.

        Returns:
            Callable[[~.AdaptiveMtTranslateRequest],
                    ~.AdaptiveMtTranslateResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "adaptive_mt_translate" not in self._stubs:
            self._stubs["adaptive_mt_translate"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/AdaptiveMtTranslate",
                request_serializer=adaptive_mt.AdaptiveMtTranslateRequest.serialize,
                response_deserializer=adaptive_mt.AdaptiveMtTranslateResponse.deserialize,
            )
        return self._stubs["adaptive_mt_translate"]

    @property
    def get_adaptive_mt_file(
        self,
    ) -> Callable[[adaptive_mt.GetAdaptiveMtFileRequest], adaptive_mt.AdaptiveMtFile]:
        r"""Return a callable for the get adaptive mt file method over gRPC.

        Gets and AdaptiveMtFile

        Returns:
            Callable[[~.GetAdaptiveMtFileRequest],
                    ~.AdaptiveMtFile]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_adaptive_mt_file" not in self._stubs:
            self._stubs["get_adaptive_mt_file"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/GetAdaptiveMtFile",
                request_serializer=adaptive_mt.GetAdaptiveMtFileRequest.serialize,
                response_deserializer=adaptive_mt.AdaptiveMtFile.deserialize,
            )
        return self._stubs["get_adaptive_mt_file"]

    @property
    def delete_adaptive_mt_file(
        self,
    ) -> Callable[[adaptive_mt.DeleteAdaptiveMtFileRequest], empty_pb2.Empty]:
        r"""Return a callable for the delete adaptive mt file method over gRPC.

        Deletes an AdaptiveMtFile along with its sentences.

        Returns:
            Callable[[~.DeleteAdaptiveMtFileRequest],
                    ~.Empty]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_adaptive_mt_file" not in self._stubs:
            self._stubs["delete_adaptive_mt_file"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/DeleteAdaptiveMtFile",
                request_serializer=adaptive_mt.DeleteAdaptiveMtFileRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["delete_adaptive_mt_file"]

    @property
    def import_adaptive_mt_file(
        self,
    ) -> Callable[
        [adaptive_mt.ImportAdaptiveMtFileRequest],
        adaptive_mt.ImportAdaptiveMtFileResponse,
    ]:
        r"""Return a callable for the import adaptive mt file method over gRPC.

        Imports an AdaptiveMtFile and adds all of its
        sentences into the AdaptiveMtDataset.

        Returns:
            Callable[[~.ImportAdaptiveMtFileRequest],
                    ~.ImportAdaptiveMtFileResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "import_adaptive_mt_file" not in self._stubs:
            self._stubs["import_adaptive_mt_file"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ImportAdaptiveMtFile",
                request_serializer=adaptive_mt.ImportAdaptiveMtFileRequest.serialize,
                response_deserializer=adaptive_mt.ImportAdaptiveMtFileResponse.deserialize,
            )
        return self._stubs["import_adaptive_mt_file"]

    @property
    def list_adaptive_mt_files(
        self,
    ) -> Callable[
        [adaptive_mt.ListAdaptiveMtFilesRequest],
        adaptive_mt.ListAdaptiveMtFilesResponse,
    ]:
        r"""Return a callable for the list adaptive mt files method over gRPC.

        Lists all AdaptiveMtFiles associated to an
        AdaptiveMtDataset.

        Returns:
            Callable[[~.ListAdaptiveMtFilesRequest],
                    ~.ListAdaptiveMtFilesResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_adaptive_mt_files" not in self._stubs:
            self._stubs["list_adaptive_mt_files"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ListAdaptiveMtFiles",
                request_serializer=adaptive_mt.ListAdaptiveMtFilesRequest.serialize,
                response_deserializer=adaptive_mt.ListAdaptiveMtFilesResponse.deserialize,
            )
        return self._stubs["list_adaptive_mt_files"]

    @property
    def list_adaptive_mt_sentences(
        self,
    ) -> Callable[
        [adaptive_mt.ListAdaptiveMtSentencesRequest],
        adaptive_mt.ListAdaptiveMtSentencesResponse,
    ]:
        r"""Return a callable for the list adaptive mt sentences method over gRPC.

        Lists all AdaptiveMtSentences under a given
        file/dataset.

        Returns:
            Callable[[~.ListAdaptiveMtSentencesRequest],
                    ~.ListAdaptiveMtSentencesResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_adaptive_mt_sentences" not in self._stubs:
            self._stubs[
                "list_adaptive_mt_sentences"
            ] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ListAdaptiveMtSentences",
                request_serializer=adaptive_mt.ListAdaptiveMtSentencesRequest.serialize,
                response_deserializer=adaptive_mt.ListAdaptiveMtSentencesResponse.deserialize,
            )
        return self._stubs["list_adaptive_mt_sentences"]

    @property
    def import_data(
        self,
    ) -> Callable[[automl_translation.ImportDataRequest], operations_pb2.Operation]:
        r"""Return a callable for the import data method over gRPC.

        Import sentence pairs into translation Dataset.

        Returns:
            Callable[[~.ImportDataRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "import_data" not in self._stubs:
            self._stubs["import_data"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ImportData",
                request_serializer=automl_translation.ImportDataRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["import_data"]

    @property
    def export_data(
        self,
    ) -> Callable[[automl_translation.ExportDataRequest], operations_pb2.Operation]:
        r"""Return a callable for the export data method over gRPC.

        Exports dataset's data to the provided output
        location.

        Returns:
            Callable[[~.ExportDataRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "export_data" not in self._stubs:
            self._stubs["export_data"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ExportData",
                request_serializer=automl_translation.ExportDataRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["export_data"]

    @property
    def list_examples(
        self,
    ) -> Callable[
        [automl_translation.ListExamplesRequest],
        automl_translation.ListExamplesResponse,
    ]:
        r"""Return a callable for the list examples method over gRPC.

        Lists sentence pairs in the dataset.

        Returns:
            Callable[[~.ListExamplesRequest],
                    ~.ListExamplesResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_examples" not in self._stubs:
            self._stubs["list_examples"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ListExamples",
                request_serializer=automl_translation.ListExamplesRequest.serialize,
                response_deserializer=automl_translation.ListExamplesResponse.deserialize,
            )
        return self._stubs["list_examples"]

    @property
    def create_model(
        self,
    ) -> Callable[[automl_translation.CreateModelRequest], operations_pb2.Operation]:
        r"""Return a callable for the create model method over gRPC.

        Creates a Model.

        Returns:
            Callable[[~.CreateModelRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_model" not in self._stubs:
            self._stubs["create_model"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/CreateModel",
                request_serializer=automl_translation.CreateModelRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["create_model"]

    @property
    def list_models(
        self,
    ) -> Callable[
        [automl_translation.ListModelsRequest], automl_translation.ListModelsResponse
    ]:
        r"""Return a callable for the list models method over gRPC.

        Lists models.

        Returns:
            Callable[[~.ListModelsRequest],
                    ~.ListModelsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_models" not in self._stubs:
            self._stubs["list_models"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/ListModels",
                request_serializer=automl_translation.ListModelsRequest.serialize,
                response_deserializer=automl_translation.ListModelsResponse.deserialize,
            )
        return self._stubs["list_models"]

    @property
    def get_model(
        self,
    ) -> Callable[[automl_translation.GetModelRequest], automl_translation.Model]:
        r"""Return a callable for the get model method over gRPC.

        Gets a model.

        Returns:
            Callable[[~.GetModelRequest],
                    ~.Model]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_model" not in self._stubs:
            self._stubs["get_model"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/GetModel",
                request_serializer=automl_translation.GetModelRequest.serialize,
                response_deserializer=automl_translation.Model.deserialize,
            )
        return self._stubs["get_model"]

    @property
    def delete_model(
        self,
    ) -> Callable[[automl_translation.DeleteModelRequest], operations_pb2.Operation]:
        r"""Return a callable for the delete model method over gRPC.

        Deletes a model.

        Returns:
            Callable[[~.DeleteModelRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_model" not in self._stubs:
            self._stubs["delete_model"] = self._logged_channel.unary_unary(
                "/google.cloud.translation.v3.TranslationService/DeleteModel",
                request_serializer=automl_translation.DeleteModelRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["delete_model"]

    def close(self):
        self._logged_channel.close()

    @property
    def delete_operation(
        self,
    ) -> Callable[[operations_pb2.DeleteOperationRequest], None]:
        r"""Return a callable for the delete_operation method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_operation" not in self._stubs:
            self._stubs["delete_operation"] = self._logged_channel.unary_unary(
                "/google.longrunning.Operations/DeleteOperation",
                request_serializer=operations_pb2.DeleteOperationRequest.SerializeToString,
                response_deserializer=None,
            )
        return self._stubs["delete_operation"]

    @property
    def cancel_operation(
        self,
    ) -> Callable[[operations_pb2.CancelOperationRequest], None]:
        r"""Return a callable for the cancel_operation method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "cancel_operation" not in self._stubs:
            self._stubs["cancel_operation"] = self._logged_channel.unary_unary(
                "/google.longrunning.Operations/CancelOperation",
                request_serializer=operations_pb2.CancelOperationRequest.SerializeToString,
                response_deserializer=None,
            )
        return self._stubs["cancel_operation"]

    @property
    def wait_operation(
        self,
    ) -> Callable[[operations_pb2.WaitOperationRequest], None]:
        r"""Return a callable for the wait_operation method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "wait_operation" not in self._stubs:
            self._stubs["wait_operation"] = self._logged_channel.unary_unary(
                "/google.longrunning.Operations/WaitOperation",
                request_serializer=operations_pb2.WaitOperationRequest.SerializeToString,
                response_deserializer=None,
            )
        return self._stubs["wait_operation"]

    @property
    def get_operation(
        self,
    ) -> Callable[[operations_pb2.GetOperationRequest], operations_pb2.Operation]:
        r"""Return a callable for the get_operation method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_operation" not in self._stubs:
            self._stubs["get_operation"] = self._logged_channel.unary_unary(
                "/google.longrunning.Operations/GetOperation",
                request_serializer=operations_pb2.GetOperationRequest.SerializeToString,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["get_operation"]

    @property
    def list_operations(
        self,
    ) -> Callable[
        [operations_pb2.ListOperationsRequest], operations_pb2.ListOperationsResponse
    ]:
        r"""Return a callable for the list_operations method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_operations" not in self._stubs:
            self._stubs["list_operations"] = self._logged_channel.unary_unary(
                "/google.longrunning.Operations/ListOperations",
                request_serializer=operations_pb2.ListOperationsRequest.SerializeToString,
                response_deserializer=operations_pb2.ListOperationsResponse.FromString,
            )
        return self._stubs["list_operations"]

    @property
    def list_locations(
        self,
    ) -> Callable[
        [locations_pb2.ListLocationsRequest], locations_pb2.ListLocationsResponse
    ]:
        r"""Return a callable for the list locations method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_locations" not in self._stubs:
            self._stubs["list_locations"] = self._logged_channel.unary_unary(
                "/google.cloud.location.Locations/ListLocations",
                request_serializer=locations_pb2.ListLocationsRequest.SerializeToString,
                response_deserializer=locations_pb2.ListLocationsResponse.FromString,
            )
        return self._stubs["list_locations"]

    @property
    def get_location(
        self,
    ) -> Callable[[locations_pb2.GetLocationRequest], locations_pb2.Location]:
        r"""Return a callable for the list locations method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_location" not in self._stubs:
            self._stubs["get_location"] = self._logged_channel.unary_unary(
                "/google.cloud.location.Locations/GetLocation",
                request_serializer=locations_pb2.GetLocationRequest.SerializeToString,
                response_deserializer=locations_pb2.Location.FromString,
            )
        return self._stubs["get_location"]

    @property
    def kind(self) -> str:
        return "grpc"


__all__ = ("TranslationServiceGrpcTransport",)
