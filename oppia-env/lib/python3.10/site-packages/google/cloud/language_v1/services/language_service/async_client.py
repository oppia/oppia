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
from collections import OrderedDict
import logging as std_logging
import re
from typing import (
    Callable,
    Dict,
    Mapping,
    MutableMapping,
    MutableSequence,
    Optional,
    Sequence,
    Tuple,
    Type,
    Union,
)

from google.api_core import exceptions as core_exceptions
from google.api_core import gapic_v1
from google.api_core import retry_async as retries
from google.api_core.client_options import ClientOptions
from google.auth import credentials as ga_credentials  # type: ignore
from google.oauth2 import service_account  # type: ignore
import google.protobuf

from google.cloud.language_v1 import gapic_version as package_version

try:
    OptionalRetry = Union[retries.AsyncRetry, gapic_v1.method._MethodDefault, None]
except AttributeError:  # pragma: NO COVER
    OptionalRetry = Union[retries.AsyncRetry, object, None]  # type: ignore

from google.cloud.language_v1.types import language_service

from .client import LanguageServiceClient
from .transports.base import DEFAULT_CLIENT_INFO, LanguageServiceTransport
from .transports.grpc_asyncio import LanguageServiceGrpcAsyncIOTransport

try:
    from google.api_core import client_logging  # type: ignore

    CLIENT_LOGGING_SUPPORTED = True  # pragma: NO COVER
except ImportError:  # pragma: NO COVER
    CLIENT_LOGGING_SUPPORTED = False

_LOGGER = std_logging.getLogger(__name__)


class LanguageServiceAsyncClient:
    """Provides text analysis operations such as sentiment analysis
    and entity recognition.
    """

    _client: LanguageServiceClient

    # Copy defaults from the synchronous client for use here.
    # Note: DEFAULT_ENDPOINT is deprecated. Use _DEFAULT_ENDPOINT_TEMPLATE instead.
    DEFAULT_ENDPOINT = LanguageServiceClient.DEFAULT_ENDPOINT
    DEFAULT_MTLS_ENDPOINT = LanguageServiceClient.DEFAULT_MTLS_ENDPOINT
    _DEFAULT_ENDPOINT_TEMPLATE = LanguageServiceClient._DEFAULT_ENDPOINT_TEMPLATE
    _DEFAULT_UNIVERSE = LanguageServiceClient._DEFAULT_UNIVERSE

    common_billing_account_path = staticmethod(
        LanguageServiceClient.common_billing_account_path
    )
    parse_common_billing_account_path = staticmethod(
        LanguageServiceClient.parse_common_billing_account_path
    )
    common_folder_path = staticmethod(LanguageServiceClient.common_folder_path)
    parse_common_folder_path = staticmethod(
        LanguageServiceClient.parse_common_folder_path
    )
    common_organization_path = staticmethod(
        LanguageServiceClient.common_organization_path
    )
    parse_common_organization_path = staticmethod(
        LanguageServiceClient.parse_common_organization_path
    )
    common_project_path = staticmethod(LanguageServiceClient.common_project_path)
    parse_common_project_path = staticmethod(
        LanguageServiceClient.parse_common_project_path
    )
    common_location_path = staticmethod(LanguageServiceClient.common_location_path)
    parse_common_location_path = staticmethod(
        LanguageServiceClient.parse_common_location_path
    )

    @classmethod
    def from_service_account_info(cls, info: dict, *args, **kwargs):
        """Creates an instance of this client using the provided credentials
            info.

        Args:
            info (dict): The service account private key info.
            args: Additional arguments to pass to the constructor.
            kwargs: Additional arguments to pass to the constructor.

        Returns:
            LanguageServiceAsyncClient: The constructed client.
        """
        return LanguageServiceClient.from_service_account_info.__func__(LanguageServiceAsyncClient, info, *args, **kwargs)  # type: ignore

    @classmethod
    def from_service_account_file(cls, filename: str, *args, **kwargs):
        """Creates an instance of this client using the provided credentials
            file.

        Args:
            filename (str): The path to the service account private key json
                file.
            args: Additional arguments to pass to the constructor.
            kwargs: Additional arguments to pass to the constructor.

        Returns:
            LanguageServiceAsyncClient: The constructed client.
        """
        return LanguageServiceClient.from_service_account_file.__func__(LanguageServiceAsyncClient, filename, *args, **kwargs)  # type: ignore

    from_service_account_json = from_service_account_file

    @classmethod
    def get_mtls_endpoint_and_cert_source(
        cls, client_options: Optional[ClientOptions] = None
    ):
        """Return the API endpoint and client cert source for mutual TLS.

        The client cert source is determined in the following order:
        (1) if `GOOGLE_API_USE_CLIENT_CERTIFICATE` environment variable is not "true", the
        client cert source is None.
        (2) if `client_options.client_cert_source` is provided, use the provided one; if the
        default client cert source exists, use the default one; otherwise the client cert
        source is None.

        The API endpoint is determined in the following order:
        (1) if `client_options.api_endpoint` if provided, use the provided one.
        (2) if `GOOGLE_API_USE_CLIENT_CERTIFICATE` environment variable is "always", use the
        default mTLS endpoint; if the environment variable is "never", use the default API
        endpoint; otherwise if client cert source exists, use the default mTLS endpoint, otherwise
        use the default API endpoint.

        More details can be found at https://google.aip.dev/auth/4114.

        Args:
            client_options (google.api_core.client_options.ClientOptions): Custom options for the
                client. Only the `api_endpoint` and `client_cert_source` properties may be used
                in this method.

        Returns:
            Tuple[str, Callable[[], Tuple[bytes, bytes]]]: returns the API endpoint and the
                client cert source to use.

        Raises:
            google.auth.exceptions.MutualTLSChannelError: If any errors happen.
        """
        return LanguageServiceClient.get_mtls_endpoint_and_cert_source(client_options)  # type: ignore

    @property
    def transport(self) -> LanguageServiceTransport:
        """Returns the transport used by the client instance.

        Returns:
            LanguageServiceTransport: The transport used by the client instance.
        """
        return self._client.transport

    @property
    def api_endpoint(self):
        """Return the API endpoint used by the client instance.

        Returns:
            str: The API endpoint used by the client instance.
        """
        return self._client._api_endpoint

    @property
    def universe_domain(self) -> str:
        """Return the universe domain used by the client instance.

        Returns:
            str: The universe domain used
                by the client instance.
        """
        return self._client._universe_domain

    get_transport_class = LanguageServiceClient.get_transport_class

    def __init__(
        self,
        *,
        credentials: Optional[ga_credentials.Credentials] = None,
        transport: Optional[
            Union[
                str, LanguageServiceTransport, Callable[..., LanguageServiceTransport]
            ]
        ] = "grpc_asyncio",
        client_options: Optional[ClientOptions] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
    ) -> None:
        """Instantiates the language service async client.

        Args:
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
            transport (Optional[Union[str,LanguageServiceTransport,Callable[..., LanguageServiceTransport]]]):
                The transport to use, or a Callable that constructs and returns a new transport to use.
                If a Callable is given, it will be called with the same set of initialization
                arguments as used in the LanguageServiceTransport constructor.
                If set to None, a transport is chosen automatically.
            client_options (Optional[Union[google.api_core.client_options.ClientOptions, dict]]):
                Custom options for the client.

                1. The ``api_endpoint`` property can be used to override the
                default endpoint provided by the client when ``transport`` is
                not explicitly provided. Only if this property is not set and
                ``transport`` was not explicitly provided, the endpoint is
                determined by the GOOGLE_API_USE_MTLS_ENDPOINT environment
                variable, which have one of the following values:
                "always" (always use the default mTLS endpoint), "never" (always
                use the default regular endpoint) and "auto" (auto-switch to the
                default mTLS endpoint if client certificate is present; this is
                the default value).

                2. If the GOOGLE_API_USE_CLIENT_CERTIFICATE environment variable
                is "true", then the ``client_cert_source`` property can be used
                to provide a client certificate for mTLS transport. If
                not provided, the default SSL client certificate will be used if
                present. If GOOGLE_API_USE_CLIENT_CERTIFICATE is "false" or not
                set, no client certificate will be used.

                3. The ``universe_domain`` property can be used to override the
                default "googleapis.com" universe. Note that ``api_endpoint``
                property still takes precedence; and ``universe_domain`` is
                currently not supported for mTLS.

            client_info (google.api_core.gapic_v1.client_info.ClientInfo):
                The client info used to send a user-agent string along with
                API requests. If ``None``, then default info will be used.
                Generally, you only need to set this if you're developing
                your own client library.

        Raises:
            google.auth.exceptions.MutualTlsChannelError: If mutual TLS transport
                creation failed for any reason.
        """
        self._client = LanguageServiceClient(
            credentials=credentials,
            transport=transport,
            client_options=client_options,
            client_info=client_info,
        )

        if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
            std_logging.DEBUG
        ):  # pragma: NO COVER
            _LOGGER.debug(
                "Created client `google.cloud.language_v1.LanguageServiceAsyncClient`.",
                extra={
                    "serviceName": "google.cloud.language.v1.LanguageService",
                    "universeDomain": getattr(
                        self._client._transport._credentials, "universe_domain", ""
                    ),
                    "credentialsType": f"{type(self._client._transport._credentials).__module__}.{type(self._client._transport._credentials).__qualname__}",
                    "credentialsInfo": getattr(
                        self.transport._credentials, "get_cred_info", lambda: None
                    )(),
                }
                if hasattr(self._client._transport, "_credentials")
                else {
                    "serviceName": "google.cloud.language.v1.LanguageService",
                    "credentialsType": None,
                },
            )

    async def analyze_sentiment(
        self,
        request: Optional[Union[language_service.AnalyzeSentimentRequest, dict]] = None,
        *,
        document: Optional[language_service.Document] = None,
        encoding_type: Optional[language_service.EncodingType] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> language_service.AnalyzeSentimentResponse:
        r"""Analyzes the sentiment of the provided text.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import language_v1

            async def sample_analyze_sentiment():
                # Create a client
                client = language_v1.LanguageServiceAsyncClient()

                # Initialize request argument(s)
                document = language_v1.Document()
                document.content = "content_value"

                request = language_v1.AnalyzeSentimentRequest(
                    document=document,
                )

                # Make the request
                response = await client.analyze_sentiment(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.language_v1.types.AnalyzeSentimentRequest, dict]]):
                The request object. The sentiment analysis request
                message.
            document (:class:`google.cloud.language_v1.types.Document`):
                Required. Input document.
                This corresponds to the ``document`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            encoding_type (:class:`google.cloud.language_v1.types.EncodingType`):
                The encoding type used by the API to
                calculate sentence offsets.

                This corresponds to the ``encoding_type`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.language_v1.types.AnalyzeSentimentResponse:
                The sentiment analysis response
                message.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [document, encoding_type]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, language_service.AnalyzeSentimentRequest):
            request = language_service.AnalyzeSentimentRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if document is not None:
            request.document = document
        if encoding_type is not None:
            request.encoding_type = encoding_type

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.analyze_sentiment
        ]

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def analyze_entities(
        self,
        request: Optional[Union[language_service.AnalyzeEntitiesRequest, dict]] = None,
        *,
        document: Optional[language_service.Document] = None,
        encoding_type: Optional[language_service.EncodingType] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> language_service.AnalyzeEntitiesResponse:
        r"""Finds named entities (currently proper names and
        common nouns) in the text along with entity types,
        salience, mentions for each entity, and other
        properties.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import language_v1

            async def sample_analyze_entities():
                # Create a client
                client = language_v1.LanguageServiceAsyncClient()

                # Initialize request argument(s)
                document = language_v1.Document()
                document.content = "content_value"

                request = language_v1.AnalyzeEntitiesRequest(
                    document=document,
                )

                # Make the request
                response = await client.analyze_entities(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.language_v1.types.AnalyzeEntitiesRequest, dict]]):
                The request object. The entity analysis request message.
            document (:class:`google.cloud.language_v1.types.Document`):
                Required. Input document.
                This corresponds to the ``document`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            encoding_type (:class:`google.cloud.language_v1.types.EncodingType`):
                The encoding type used by the API to
                calculate offsets.

                This corresponds to the ``encoding_type`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.language_v1.types.AnalyzeEntitiesResponse:
                The entity analysis response message.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [document, encoding_type]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, language_service.AnalyzeEntitiesRequest):
            request = language_service.AnalyzeEntitiesRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if document is not None:
            request.document = document
        if encoding_type is not None:
            request.encoding_type = encoding_type

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.analyze_entities
        ]

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def analyze_entity_sentiment(
        self,
        request: Optional[
            Union[language_service.AnalyzeEntitySentimentRequest, dict]
        ] = None,
        *,
        document: Optional[language_service.Document] = None,
        encoding_type: Optional[language_service.EncodingType] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> language_service.AnalyzeEntitySentimentResponse:
        r"""Finds entities, similar to
        [AnalyzeEntities][google.cloud.language.v1.LanguageService.AnalyzeEntities]
        in the text and analyzes sentiment associated with each entity
        and its mentions.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import language_v1

            async def sample_analyze_entity_sentiment():
                # Create a client
                client = language_v1.LanguageServiceAsyncClient()

                # Initialize request argument(s)
                document = language_v1.Document()
                document.content = "content_value"

                request = language_v1.AnalyzeEntitySentimentRequest(
                    document=document,
                )

                # Make the request
                response = await client.analyze_entity_sentiment(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.language_v1.types.AnalyzeEntitySentimentRequest, dict]]):
                The request object. The entity-level sentiment analysis
                request message.
            document (:class:`google.cloud.language_v1.types.Document`):
                Required. Input document.
                This corresponds to the ``document`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            encoding_type (:class:`google.cloud.language_v1.types.EncodingType`):
                The encoding type used by the API to
                calculate offsets.

                This corresponds to the ``encoding_type`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.language_v1.types.AnalyzeEntitySentimentResponse:
                The entity-level sentiment analysis
                response message.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [document, encoding_type]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, language_service.AnalyzeEntitySentimentRequest):
            request = language_service.AnalyzeEntitySentimentRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if document is not None:
            request.document = document
        if encoding_type is not None:
            request.encoding_type = encoding_type

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.analyze_entity_sentiment
        ]

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def analyze_syntax(
        self,
        request: Optional[Union[language_service.AnalyzeSyntaxRequest, dict]] = None,
        *,
        document: Optional[language_service.Document] = None,
        encoding_type: Optional[language_service.EncodingType] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> language_service.AnalyzeSyntaxResponse:
        r"""Analyzes the syntax of the text and provides sentence
        boundaries and tokenization along with part of speech
        tags, dependency trees, and other properties.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import language_v1

            async def sample_analyze_syntax():
                # Create a client
                client = language_v1.LanguageServiceAsyncClient()

                # Initialize request argument(s)
                document = language_v1.Document()
                document.content = "content_value"

                request = language_v1.AnalyzeSyntaxRequest(
                    document=document,
                )

                # Make the request
                response = await client.analyze_syntax(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.language_v1.types.AnalyzeSyntaxRequest, dict]]):
                The request object. The syntax analysis request message.
            document (:class:`google.cloud.language_v1.types.Document`):
                Required. Input document.
                This corresponds to the ``document`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            encoding_type (:class:`google.cloud.language_v1.types.EncodingType`):
                The encoding type used by the API to
                calculate offsets.

                This corresponds to the ``encoding_type`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.language_v1.types.AnalyzeSyntaxResponse:
                The syntax analysis response message.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [document, encoding_type]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, language_service.AnalyzeSyntaxRequest):
            request = language_service.AnalyzeSyntaxRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if document is not None:
            request.document = document
        if encoding_type is not None:
            request.encoding_type = encoding_type

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.analyze_syntax
        ]

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def classify_text(
        self,
        request: Optional[Union[language_service.ClassifyTextRequest, dict]] = None,
        *,
        document: Optional[language_service.Document] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> language_service.ClassifyTextResponse:
        r"""Classifies a document into categories.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import language_v1

            async def sample_classify_text():
                # Create a client
                client = language_v1.LanguageServiceAsyncClient()

                # Initialize request argument(s)
                document = language_v1.Document()
                document.content = "content_value"

                request = language_v1.ClassifyTextRequest(
                    document=document,
                )

                # Make the request
                response = await client.classify_text(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.language_v1.types.ClassifyTextRequest, dict]]):
                The request object. The document classification request
                message.
            document (:class:`google.cloud.language_v1.types.Document`):
                Required. Input document.
                This corresponds to the ``document`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.language_v1.types.ClassifyTextResponse:
                The document classification response
                message.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [document]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, language_service.ClassifyTextRequest):
            request = language_service.ClassifyTextRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if document is not None:
            request.document = document

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.classify_text
        ]

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def moderate_text(
        self,
        request: Optional[Union[language_service.ModerateTextRequest, dict]] = None,
        *,
        document: Optional[language_service.Document] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> language_service.ModerateTextResponse:
        r"""Moderates a document for harmful and sensitive
        categories.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import language_v1

            async def sample_moderate_text():
                # Create a client
                client = language_v1.LanguageServiceAsyncClient()

                # Initialize request argument(s)
                document = language_v1.Document()
                document.content = "content_value"

                request = language_v1.ModerateTextRequest(
                    document=document,
                )

                # Make the request
                response = await client.moderate_text(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.language_v1.types.ModerateTextRequest, dict]]):
                The request object. The document moderation request
                message.
            document (:class:`google.cloud.language_v1.types.Document`):
                Required. Input document.
                This corresponds to the ``document`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.language_v1.types.ModerateTextResponse:
                The document moderation response
                message.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [document]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, language_service.ModerateTextRequest):
            request = language_service.ModerateTextRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if document is not None:
            request.document = document

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.moderate_text
        ]

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def annotate_text(
        self,
        request: Optional[Union[language_service.AnnotateTextRequest, dict]] = None,
        *,
        document: Optional[language_service.Document] = None,
        features: Optional[language_service.AnnotateTextRequest.Features] = None,
        encoding_type: Optional[language_service.EncodingType] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> language_service.AnnotateTextResponse:
        r"""A convenience method that provides all the features
        that analyzeSentiment, analyzeEntities, and
        analyzeSyntax provide in one call.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import language_v1

            async def sample_annotate_text():
                # Create a client
                client = language_v1.LanguageServiceAsyncClient()

                # Initialize request argument(s)
                document = language_v1.Document()
                document.content = "content_value"

                request = language_v1.AnnotateTextRequest(
                    document=document,
                )

                # Make the request
                response = await client.annotate_text(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.language_v1.types.AnnotateTextRequest, dict]]):
                The request object. The request message for the text
                annotation API, which can perform
                multiple analysis types (sentiment,
                entities, and syntax) in one call.
            document (:class:`google.cloud.language_v1.types.Document`):
                Required. Input document.
                This corresponds to the ``document`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            features (:class:`google.cloud.language_v1.types.AnnotateTextRequest.Features`):
                Required. The enabled features.
                This corresponds to the ``features`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            encoding_type (:class:`google.cloud.language_v1.types.EncodingType`):
                The encoding type used by the API to
                calculate offsets.

                This corresponds to the ``encoding_type`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.language_v1.types.AnnotateTextResponse:
                The text annotations response
                message.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [document, features, encoding_type]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, language_service.AnnotateTextRequest):
            request = language_service.AnnotateTextRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if document is not None:
            request.document = document
        if features is not None:
            request.features = features
        if encoding_type is not None:
            request.encoding_type = encoding_type

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.annotate_text
        ]

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def __aenter__(self) -> "LanguageServiceAsyncClient":
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.transport.close()


DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
    gapic_version=package_version.__version__
)

if hasattr(DEFAULT_CLIENT_INFO, "protobuf_runtime_version"):  # pragma: NO COVER
    DEFAULT_CLIENT_INFO.protobuf_runtime_version = google.protobuf.__version__


__all__ = ("LanguageServiceAsyncClient",)
