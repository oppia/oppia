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
import dataclasses
import json  # type: ignore
import logging
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple, Union
import warnings

from google.api_core import gapic_v1, operations_v1, rest_helpers, rest_streaming
from google.api_core import exceptions as core_exceptions
from google.api_core import retry as retries
from google.auth import credentials as ga_credentials  # type: ignore
from google.auth.transport.requests import AuthorizedSession  # type: ignore
from google.cloud.location import locations_pb2  # type: ignore
from google.iam.v1 import iam_policy_pb2  # type: ignore
from google.iam.v1 import policy_pb2  # type: ignore
from google.longrunning import operations_pb2  # type: ignore
import google.protobuf
from google.protobuf import json_format
from requests import __version__ as requests_version

from google.cloud.translate_v3beta1.types import translation_service

from .base import DEFAULT_CLIENT_INFO as BASE_DEFAULT_CLIENT_INFO
from .rest_base import _BaseTranslationServiceRestTransport

try:
    OptionalRetry = Union[retries.Retry, gapic_v1.method._MethodDefault, None]
except AttributeError:  # pragma: NO COVER
    OptionalRetry = Union[retries.Retry, object, None]  # type: ignore

try:
    from google.api_core import client_logging  # type: ignore

    CLIENT_LOGGING_SUPPORTED = True  # pragma: NO COVER
except ImportError:  # pragma: NO COVER
    CLIENT_LOGGING_SUPPORTED = False

_LOGGER = logging.getLogger(__name__)

DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
    gapic_version=BASE_DEFAULT_CLIENT_INFO.gapic_version,
    grpc_version=None,
    rest_version=f"requests@{requests_version}",
)

if hasattr(DEFAULT_CLIENT_INFO, "protobuf_runtime_version"):  # pragma: NO COVER
    DEFAULT_CLIENT_INFO.protobuf_runtime_version = google.protobuf.__version__


class TranslationServiceRestInterceptor:
    """Interceptor for TranslationService.

    Interceptors are used to manipulate requests, request metadata, and responses
    in arbitrary ways.
    Example use cases include:
    * Logging
    * Verifying requests according to service or custom semantics
    * Stripping extraneous information from responses

    These use cases and more can be enabled by injecting an
    instance of a custom subclass when constructing the TranslationServiceRestTransport.

    .. code-block:: python
        class MyCustomTranslationServiceInterceptor(TranslationServiceRestInterceptor):
            def pre_batch_translate_document(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_batch_translate_document(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_batch_translate_text(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_batch_translate_text(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_glossary(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_glossary(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_delete_glossary(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_delete_glossary(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_detect_language(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_detect_language(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_glossary(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_glossary(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_supported_languages(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_supported_languages(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_glossaries(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_glossaries(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_translate_document(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_translate_document(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_translate_text(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_translate_text(self, response):
                logging.log(f"Received response: {response}")
                return response

        transport = TranslationServiceRestTransport(interceptor=MyCustomTranslationServiceInterceptor())
        client = TranslationServiceClient(transport=transport)


    """

    def pre_batch_translate_document(
        self,
        request: translation_service.BatchTranslateDocumentRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.BatchTranslateDocumentRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for batch_translate_document

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_batch_translate_document(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for batch_translate_document

        DEPRECATED. Please use the `post_batch_translate_document_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_batch_translate_document` interceptor runs
        before the `post_batch_translate_document_with_metadata` interceptor.
        """
        return response

    def post_batch_translate_document_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for batch_translate_document

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_batch_translate_document_with_metadata`
        interceptor in new development instead of the `post_batch_translate_document` interceptor.
        When both interceptors are used, this `post_batch_translate_document_with_metadata` interceptor runs after the
        `post_batch_translate_document` interceptor. The (possibly modified) response returned by
        `post_batch_translate_document` will be passed to
        `post_batch_translate_document_with_metadata`.
        """
        return response, metadata

    def pre_batch_translate_text(
        self,
        request: translation_service.BatchTranslateTextRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.BatchTranslateTextRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for batch_translate_text

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_batch_translate_text(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for batch_translate_text

        DEPRECATED. Please use the `post_batch_translate_text_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_batch_translate_text` interceptor runs
        before the `post_batch_translate_text_with_metadata` interceptor.
        """
        return response

    def post_batch_translate_text_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for batch_translate_text

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_batch_translate_text_with_metadata`
        interceptor in new development instead of the `post_batch_translate_text` interceptor.
        When both interceptors are used, this `post_batch_translate_text_with_metadata` interceptor runs after the
        `post_batch_translate_text` interceptor. The (possibly modified) response returned by
        `post_batch_translate_text` will be passed to
        `post_batch_translate_text_with_metadata`.
        """
        return response, metadata

    def pre_create_glossary(
        self,
        request: translation_service.CreateGlossaryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.CreateGlossaryRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for create_glossary

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_create_glossary(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for create_glossary

        DEPRECATED. Please use the `post_create_glossary_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_create_glossary` interceptor runs
        before the `post_create_glossary_with_metadata` interceptor.
        """
        return response

    def post_create_glossary_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_glossary

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_create_glossary_with_metadata`
        interceptor in new development instead of the `post_create_glossary` interceptor.
        When both interceptors are used, this `post_create_glossary_with_metadata` interceptor runs after the
        `post_create_glossary` interceptor. The (possibly modified) response returned by
        `post_create_glossary` will be passed to
        `post_create_glossary_with_metadata`.
        """
        return response, metadata

    def pre_delete_glossary(
        self,
        request: translation_service.DeleteGlossaryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.DeleteGlossaryRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for delete_glossary

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_delete_glossary(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for delete_glossary

        DEPRECATED. Please use the `post_delete_glossary_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_delete_glossary` interceptor runs
        before the `post_delete_glossary_with_metadata` interceptor.
        """
        return response

    def post_delete_glossary_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for delete_glossary

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_delete_glossary_with_metadata`
        interceptor in new development instead of the `post_delete_glossary` interceptor.
        When both interceptors are used, this `post_delete_glossary_with_metadata` interceptor runs after the
        `post_delete_glossary` interceptor. The (possibly modified) response returned by
        `post_delete_glossary` will be passed to
        `post_delete_glossary_with_metadata`.
        """
        return response, metadata

    def pre_detect_language(
        self,
        request: translation_service.DetectLanguageRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.DetectLanguageRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for detect_language

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_detect_language(
        self, response: translation_service.DetectLanguageResponse
    ) -> translation_service.DetectLanguageResponse:
        """Post-rpc interceptor for detect_language

        DEPRECATED. Please use the `post_detect_language_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_detect_language` interceptor runs
        before the `post_detect_language_with_metadata` interceptor.
        """
        return response

    def post_detect_language_with_metadata(
        self,
        response: translation_service.DetectLanguageResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.DetectLanguageResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for detect_language

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_detect_language_with_metadata`
        interceptor in new development instead of the `post_detect_language` interceptor.
        When both interceptors are used, this `post_detect_language_with_metadata` interceptor runs after the
        `post_detect_language` interceptor. The (possibly modified) response returned by
        `post_detect_language` will be passed to
        `post_detect_language_with_metadata`.
        """
        return response, metadata

    def pre_get_glossary(
        self,
        request: translation_service.GetGlossaryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.GetGlossaryRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_glossary

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_get_glossary(
        self, response: translation_service.Glossary
    ) -> translation_service.Glossary:
        """Post-rpc interceptor for get_glossary

        DEPRECATED. Please use the `post_get_glossary_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_get_glossary` interceptor runs
        before the `post_get_glossary_with_metadata` interceptor.
        """
        return response

    def post_get_glossary_with_metadata(
        self,
        response: translation_service.Glossary,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[translation_service.Glossary, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_glossary

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_get_glossary_with_metadata`
        interceptor in new development instead of the `post_get_glossary` interceptor.
        When both interceptors are used, this `post_get_glossary_with_metadata` interceptor runs after the
        `post_get_glossary` interceptor. The (possibly modified) response returned by
        `post_get_glossary` will be passed to
        `post_get_glossary_with_metadata`.
        """
        return response, metadata

    def pre_get_supported_languages(
        self,
        request: translation_service.GetSupportedLanguagesRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.GetSupportedLanguagesRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for get_supported_languages

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_get_supported_languages(
        self, response: translation_service.SupportedLanguages
    ) -> translation_service.SupportedLanguages:
        """Post-rpc interceptor for get_supported_languages

        DEPRECATED. Please use the `post_get_supported_languages_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_get_supported_languages` interceptor runs
        before the `post_get_supported_languages_with_metadata` interceptor.
        """
        return response

    def post_get_supported_languages_with_metadata(
        self,
        response: translation_service.SupportedLanguages,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.SupportedLanguages, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for get_supported_languages

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_get_supported_languages_with_metadata`
        interceptor in new development instead of the `post_get_supported_languages` interceptor.
        When both interceptors are used, this `post_get_supported_languages_with_metadata` interceptor runs after the
        `post_get_supported_languages` interceptor. The (possibly modified) response returned by
        `post_get_supported_languages` will be passed to
        `post_get_supported_languages_with_metadata`.
        """
        return response, metadata

    def pre_list_glossaries(
        self,
        request: translation_service.ListGlossariesRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.ListGlossariesRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for list_glossaries

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_list_glossaries(
        self, response: translation_service.ListGlossariesResponse
    ) -> translation_service.ListGlossariesResponse:
        """Post-rpc interceptor for list_glossaries

        DEPRECATED. Please use the `post_list_glossaries_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_list_glossaries` interceptor runs
        before the `post_list_glossaries_with_metadata` interceptor.
        """
        return response

    def post_list_glossaries_with_metadata(
        self,
        response: translation_service.ListGlossariesResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.ListGlossariesResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for list_glossaries

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_list_glossaries_with_metadata`
        interceptor in new development instead of the `post_list_glossaries` interceptor.
        When both interceptors are used, this `post_list_glossaries_with_metadata` interceptor runs after the
        `post_list_glossaries` interceptor. The (possibly modified) response returned by
        `post_list_glossaries` will be passed to
        `post_list_glossaries_with_metadata`.
        """
        return response, metadata

    def pre_translate_document(
        self,
        request: translation_service.TranslateDocumentRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.TranslateDocumentRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for translate_document

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_translate_document(
        self, response: translation_service.TranslateDocumentResponse
    ) -> translation_service.TranslateDocumentResponse:
        """Post-rpc interceptor for translate_document

        DEPRECATED. Please use the `post_translate_document_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_translate_document` interceptor runs
        before the `post_translate_document_with_metadata` interceptor.
        """
        return response

    def post_translate_document_with_metadata(
        self,
        response: translation_service.TranslateDocumentResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.TranslateDocumentResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for translate_document

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_translate_document_with_metadata`
        interceptor in new development instead of the `post_translate_document` interceptor.
        When both interceptors are used, this `post_translate_document_with_metadata` interceptor runs after the
        `post_translate_document` interceptor. The (possibly modified) response returned by
        `post_translate_document` will be passed to
        `post_translate_document_with_metadata`.
        """
        return response, metadata

    def pre_translate_text(
        self,
        request: translation_service.TranslateTextRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.TranslateTextRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for translate_text

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_translate_text(
        self, response: translation_service.TranslateTextResponse
    ) -> translation_service.TranslateTextResponse:
        """Post-rpc interceptor for translate_text

        DEPRECATED. Please use the `post_translate_text_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_translate_text` interceptor runs
        before the `post_translate_text_with_metadata` interceptor.
        """
        return response

    def post_translate_text_with_metadata(
        self,
        response: translation_service.TranslateTextResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.TranslateTextResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for translate_text

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_translate_text_with_metadata`
        interceptor in new development instead of the `post_translate_text` interceptor.
        When both interceptors are used, this `post_translate_text_with_metadata` interceptor runs after the
        `post_translate_text` interceptor. The (possibly modified) response returned by
        `post_translate_text` will be passed to
        `post_translate_text_with_metadata`.
        """
        return response, metadata

    def pre_get_location(
        self,
        request: locations_pb2.GetLocationRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        locations_pb2.GetLocationRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_location

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_get_location(
        self, response: locations_pb2.Location
    ) -> locations_pb2.Location:
        """Post-rpc interceptor for get_location

        Override in a subclass to manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code.
        """
        return response

    def pre_list_locations(
        self,
        request: locations_pb2.ListLocationsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        locations_pb2.ListLocationsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_locations

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_list_locations(
        self, response: locations_pb2.ListLocationsResponse
    ) -> locations_pb2.ListLocationsResponse:
        """Post-rpc interceptor for list_locations

        Override in a subclass to manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code.
        """
        return response

    def pre_cancel_operation(
        self,
        request: operations_pb2.CancelOperationRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        operations_pb2.CancelOperationRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for cancel_operation

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_cancel_operation(self, response: None) -> None:
        """Post-rpc interceptor for cancel_operation

        Override in a subclass to manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code.
        """
        return response

    def pre_delete_operation(
        self,
        request: operations_pb2.DeleteOperationRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        operations_pb2.DeleteOperationRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for delete_operation

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_delete_operation(self, response: None) -> None:
        """Post-rpc interceptor for delete_operation

        Override in a subclass to manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code.
        """
        return response

    def pre_get_operation(
        self,
        request: operations_pb2.GetOperationRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        operations_pb2.GetOperationRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_operation

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_get_operation(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for get_operation

        Override in a subclass to manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code.
        """
        return response

    def pre_list_operations(
        self,
        request: operations_pb2.ListOperationsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        operations_pb2.ListOperationsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_operations

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_list_operations(
        self, response: operations_pb2.ListOperationsResponse
    ) -> operations_pb2.ListOperationsResponse:
        """Post-rpc interceptor for list_operations

        Override in a subclass to manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code.
        """
        return response

    def pre_wait_operation(
        self,
        request: operations_pb2.WaitOperationRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        operations_pb2.WaitOperationRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for wait_operation

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_wait_operation(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for wait_operation

        Override in a subclass to manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code.
        """
        return response


@dataclasses.dataclass
class TranslationServiceRestStub:
    _session: AuthorizedSession
    _host: str
    _interceptor: TranslationServiceRestInterceptor


class TranslationServiceRestTransport(_BaseTranslationServiceRestTransport):
    """REST backend synchronous transport for TranslationService.

    Provides natural language translation operations.

    This class defines the same methods as the primary client, so the
    primary client can load the underlying transport implementation
    and call it.

    It sends JSON representations of protocol buffers over HTTP/1.1
    """

    def __init__(
        self,
        *,
        host: str = "translate.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        client_cert_source_for_mtls: Optional[Callable[[], Tuple[bytes, bytes]]] = None,
        quota_project_id: Optional[str] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
        always_use_jwt_access: Optional[bool] = False,
        url_scheme: str = "https",
        interceptor: Optional[TranslationServiceRestInterceptor] = None,
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

            credentials_file (Optional[str]): A file with credentials that can
                be loaded with :func:`google.auth.load_credentials_from_file`.
                This argument is ignored if ``channel`` is provided.
            scopes (Optional(Sequence[str])): A list of scopes. This argument is
                ignored if ``channel`` is provided.
            client_cert_source_for_mtls (Callable[[], Tuple[bytes, bytes]]): Client
                certificate to configure mutual TLS HTTP channel. It is ignored
                if ``channel`` is provided.
            quota_project_id (Optional[str]): An optional project to use for billing
                and quota.
            client_info (google.api_core.gapic_v1.client_info.ClientInfo):
                The client info used to send a user-agent string along with
                API requests. If ``None``, then default info will be used.
                Generally, you only need to set this if you are developing
                your own client library.
            always_use_jwt_access (Optional[bool]): Whether self signed JWT should
                be used for service account credentials.
            url_scheme: the protocol scheme for the API endpoint.  Normally
                "https", but for testing or local servers,
                "http" can be specified.
        """
        # Run the base constructor
        # TODO(yon-mg): resolve other ctor params i.e. scopes, quota, etc.
        # TODO: When custom host (api_endpoint) is set, `scopes` must *also* be set on the
        # credentials object
        super().__init__(
            host=host,
            credentials=credentials,
            client_info=client_info,
            always_use_jwt_access=always_use_jwt_access,
            url_scheme=url_scheme,
            api_audience=api_audience,
        )
        self._session = AuthorizedSession(
            self._credentials, default_host=self.DEFAULT_HOST
        )
        self._operations_client: Optional[operations_v1.AbstractOperationsClient] = None
        if client_cert_source_for_mtls:
            self._session.configure_mtls_channel(client_cert_source_for_mtls)
        self._interceptor = interceptor or TranslationServiceRestInterceptor()
        self._prep_wrapped_messages(client_info)

    @property
    def operations_client(self) -> operations_v1.AbstractOperationsClient:
        """Create the client designed to process long-running operations.

        This property caches on the instance; repeated calls return the same
        client.
        """
        # Only create a new client if we do not already have one.
        if self._operations_client is None:
            http_options: Dict[str, List[Dict[str, str]]] = {
                "google.longrunning.Operations.CancelOperation": [
                    {
                        "method": "post",
                        "uri": "/v3beta1/{name=projects/*/locations/*/operations/*}:cancel",
                        "body": "*",
                    },
                ],
                "google.longrunning.Operations.DeleteOperation": [
                    {
                        "method": "delete",
                        "uri": "/v3beta1/{name=projects/*/locations/*/operations/*}",
                    },
                ],
                "google.longrunning.Operations.GetOperation": [
                    {
                        "method": "get",
                        "uri": "/v3beta1/{name=projects/*/locations/*/operations/*}",
                    },
                ],
                "google.longrunning.Operations.ListOperations": [
                    {
                        "method": "get",
                        "uri": "/v3beta1/{name=projects/*/locations/*}/operations",
                    },
                ],
                "google.longrunning.Operations.WaitOperation": [
                    {
                        "method": "post",
                        "uri": "/v3beta1/{name=projects/*/locations/*/operations/*}:wait",
                        "body": "*",
                    },
                ],
            }

            rest_transport = operations_v1.OperationsRestTransport(
                host=self._host,
                # use the credentials which are saved
                credentials=self._credentials,
                scopes=self._scopes,
                http_options=http_options,
                path_prefix="v3beta1",
            )

            self._operations_client = operations_v1.AbstractOperationsClient(
                transport=rest_transport
            )

        # Return the client from cache.
        return self._operations_client

    class _BatchTranslateDocument(
        _BaseTranslationServiceRestTransport._BaseBatchTranslateDocument,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.BatchTranslateDocument")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: translation_service.BatchTranslateDocumentRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the batch translate document method over HTTP.

            Args:
                request (~.translation_service.BatchTranslateDocumentRequest):
                    The request object. The BatchTranslateDocument request.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.operations_pb2.Operation:
                    This resource represents a
                long-running operation that is the
                result of a network API call.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseBatchTranslateDocument._get_http_options()
            )

            request, metadata = self._interceptor.pre_batch_translate_document(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseBatchTranslateDocument._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseBatchTranslateDocument._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseBatchTranslateDocument._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.BatchTranslateDocument",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "BatchTranslateDocument",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._BatchTranslateDocument._get_response(
                    self._host,
                    metadata,
                    query_params,
                    self._session,
                    timeout,
                    transcoded_request,
                    body,
                )
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = operations_pb2.Operation()
            json_format.Parse(response.content, resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_batch_translate_document(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_batch_translate_document_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceClient.batch_translate_document",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "BatchTranslateDocument",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _BatchTranslateText(
        _BaseTranslationServiceRestTransport._BaseBatchTranslateText,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.BatchTranslateText")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: translation_service.BatchTranslateTextRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the batch translate text method over HTTP.

            Args:
                request (~.translation_service.BatchTranslateTextRequest):
                    The request object. The batch translation request.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.operations_pb2.Operation:
                    This resource represents a
                long-running operation that is the
                result of a network API call.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseBatchTranslateText._get_http_options()
            )

            request, metadata = self._interceptor.pre_batch_translate_text(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseBatchTranslateText._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseBatchTranslateText._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseBatchTranslateText._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.BatchTranslateText",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "BatchTranslateText",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._BatchTranslateText._get_response(
                    self._host,
                    metadata,
                    query_params,
                    self._session,
                    timeout,
                    transcoded_request,
                    body,
                )
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = operations_pb2.Operation()
            json_format.Parse(response.content, resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_batch_translate_text(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_batch_translate_text_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceClient.batch_translate_text",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "BatchTranslateText",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateGlossary(
        _BaseTranslationServiceRestTransport._BaseCreateGlossary,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.CreateGlossary")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: translation_service.CreateGlossaryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the create glossary method over HTTP.

            Args:
                request (~.translation_service.CreateGlossaryRequest):
                    The request object. Request message for CreateGlossary.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.operations_pb2.Operation:
                    This resource represents a
                long-running operation that is the
                result of a network API call.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseCreateGlossary._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_glossary(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseCreateGlossary._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseCreateGlossary._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseCreateGlossary._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.CreateGlossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "CreateGlossary",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._CreateGlossary._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = operations_pb2.Operation()
            json_format.Parse(response.content, resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_create_glossary(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_glossary_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceClient.create_glossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "CreateGlossary",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _DeleteGlossary(
        _BaseTranslationServiceRestTransport._BaseDeleteGlossary,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.DeleteGlossary")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: translation_service.DeleteGlossaryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the delete glossary method over HTTP.

            Args:
                request (~.translation_service.DeleteGlossaryRequest):
                    The request object. Request message for DeleteGlossary.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.operations_pb2.Operation:
                    This resource represents a
                long-running operation that is the
                result of a network API call.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseDeleteGlossary._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_glossary(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseDeleteGlossary._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseDeleteGlossary._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.DeleteGlossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "DeleteGlossary",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._DeleteGlossary._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = operations_pb2.Operation()
            json_format.Parse(response.content, resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_delete_glossary(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_delete_glossary_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceClient.delete_glossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "DeleteGlossary",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _DetectLanguage(
        _BaseTranslationServiceRestTransport._BaseDetectLanguage,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.DetectLanguage")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: translation_service.DetectLanguageRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> translation_service.DetectLanguageResponse:
            r"""Call the detect language method over HTTP.

            Args:
                request (~.translation_service.DetectLanguageRequest):
                    The request object. The request message for language
                detection.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.translation_service.DetectLanguageResponse:
                    The response message for language
                detection.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseDetectLanguage._get_http_options()
            )

            request, metadata = self._interceptor.pre_detect_language(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseDetectLanguage._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseDetectLanguage._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseDetectLanguage._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.DetectLanguage",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "DetectLanguage",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._DetectLanguage._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = translation_service.DetectLanguageResponse()
            pb_resp = translation_service.DetectLanguageResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_detect_language(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_detect_language_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = (
                        translation_service.DetectLanguageResponse.to_json(response)
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceClient.detect_language",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "DetectLanguage",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetGlossary(
        _BaseTranslationServiceRestTransport._BaseGetGlossary,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.GetGlossary")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: translation_service.GetGlossaryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> translation_service.Glossary:
            r"""Call the get glossary method over HTTP.

            Args:
                request (~.translation_service.GetGlossaryRequest):
                    The request object. Request message for GetGlossary.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.translation_service.Glossary:
                    Represents a glossary built from user
                provided data.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseGetGlossary._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_glossary(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseGetGlossary._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseGetGlossary._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.GetGlossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "GetGlossary",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._GetGlossary._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = translation_service.Glossary()
            pb_resp = translation_service.Glossary.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_glossary(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_glossary_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = translation_service.Glossary.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceClient.get_glossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "GetGlossary",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetSupportedLanguages(
        _BaseTranslationServiceRestTransport._BaseGetSupportedLanguages,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.GetSupportedLanguages")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: translation_service.GetSupportedLanguagesRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> translation_service.SupportedLanguages:
            r"""Call the get supported languages method over HTTP.

            Args:
                request (~.translation_service.GetSupportedLanguagesRequest):
                    The request object. The request message for discovering
                supported languages.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.translation_service.SupportedLanguages:
                    The response message for discovering
                supported languages.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseGetSupportedLanguages._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_supported_languages(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseGetSupportedLanguages._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseGetSupportedLanguages._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.GetSupportedLanguages",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "GetSupportedLanguages",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._GetSupportedLanguages._get_response(
                    self._host,
                    metadata,
                    query_params,
                    self._session,
                    timeout,
                    transcoded_request,
                )
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = translation_service.SupportedLanguages()
            pb_resp = translation_service.SupportedLanguages.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_supported_languages(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_supported_languages_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = translation_service.SupportedLanguages.to_json(
                        response
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceClient.get_supported_languages",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "GetSupportedLanguages",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListGlossaries(
        _BaseTranslationServiceRestTransport._BaseListGlossaries,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ListGlossaries")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: translation_service.ListGlossariesRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> translation_service.ListGlossariesResponse:
            r"""Call the list glossaries method over HTTP.

            Args:
                request (~.translation_service.ListGlossariesRequest):
                    The request object. Request message for ListGlossaries.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.translation_service.ListGlossariesResponse:
                    Response message for ListGlossaries.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseListGlossaries._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_glossaries(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseListGlossaries._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseListGlossaries._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.ListGlossaries",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "ListGlossaries",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._ListGlossaries._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = translation_service.ListGlossariesResponse()
            pb_resp = translation_service.ListGlossariesResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_glossaries(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_glossaries_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = (
                        translation_service.ListGlossariesResponse.to_json(response)
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceClient.list_glossaries",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "ListGlossaries",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _TranslateDocument(
        _BaseTranslationServiceRestTransport._BaseTranslateDocument,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.TranslateDocument")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: translation_service.TranslateDocumentRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> translation_service.TranslateDocumentResponse:
            r"""Call the translate document method over HTTP.

            Args:
                request (~.translation_service.TranslateDocumentRequest):
                    The request object. A document translation request.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.translation_service.TranslateDocumentResponse:
                    A translated document response
                message.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseTranslateDocument._get_http_options()
            )

            request, metadata = self._interceptor.pre_translate_document(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseTranslateDocument._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseTranslateDocument._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseTranslateDocument._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.TranslateDocument",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "TranslateDocument",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._TranslateDocument._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = translation_service.TranslateDocumentResponse()
            pb_resp = translation_service.TranslateDocumentResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_translate_document(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_translate_document_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = (
                        translation_service.TranslateDocumentResponse.to_json(response)
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceClient.translate_document",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "TranslateDocument",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _TranslateText(
        _BaseTranslationServiceRestTransport._BaseTranslateText,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.TranslateText")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: translation_service.TranslateTextRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> translation_service.TranslateTextResponse:
            r"""Call the translate text method over HTTP.

            Args:
                request (~.translation_service.TranslateTextRequest):
                    The request object. The request message for synchronous
                translation.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.translation_service.TranslateTextResponse:

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseTranslateText._get_http_options()
            )

            request, metadata = self._interceptor.pre_translate_text(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseTranslateText._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseTranslateText._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseTranslateText._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.TranslateText",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "TranslateText",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._TranslateText._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = translation_service.TranslateTextResponse()
            pb_resp = translation_service.TranslateTextResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_translate_text(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_translate_text_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = (
                        translation_service.TranslateTextResponse.to_json(response)
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceClient.translate_text",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "TranslateText",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    @property
    def batch_translate_document(
        self,
    ) -> Callable[
        [translation_service.BatchTranslateDocumentRequest], operations_pb2.Operation
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._BatchTranslateDocument(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def batch_translate_text(
        self,
    ) -> Callable[
        [translation_service.BatchTranslateTextRequest], operations_pb2.Operation
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._BatchTranslateText(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_glossary(
        self,
    ) -> Callable[
        [translation_service.CreateGlossaryRequest], operations_pb2.Operation
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateGlossary(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_glossary(
        self,
    ) -> Callable[
        [translation_service.DeleteGlossaryRequest], operations_pb2.Operation
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteGlossary(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def detect_language(
        self,
    ) -> Callable[
        [translation_service.DetectLanguageRequest],
        translation_service.DetectLanguageResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DetectLanguage(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_glossary(
        self,
    ) -> Callable[
        [translation_service.GetGlossaryRequest], translation_service.Glossary
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetGlossary(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_supported_languages(
        self,
    ) -> Callable[
        [translation_service.GetSupportedLanguagesRequest],
        translation_service.SupportedLanguages,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetSupportedLanguages(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_glossaries(
        self,
    ) -> Callable[
        [translation_service.ListGlossariesRequest],
        translation_service.ListGlossariesResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListGlossaries(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def translate_document(
        self,
    ) -> Callable[
        [translation_service.TranslateDocumentRequest],
        translation_service.TranslateDocumentResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._TranslateDocument(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def translate_text(
        self,
    ) -> Callable[
        [translation_service.TranslateTextRequest],
        translation_service.TranslateTextResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._TranslateText(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_location(self):
        return self._GetLocation(self._session, self._host, self._interceptor)  # type: ignore

    class _GetLocation(
        _BaseTranslationServiceRestTransport._BaseGetLocation,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.GetLocation")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: locations_pb2.GetLocationRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> locations_pb2.Location:
            r"""Call the get location method over HTTP.

            Args:
                request (locations_pb2.GetLocationRequest):
                    The request object for GetLocation method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                locations_pb2.Location: Response from GetLocation method.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseGetLocation._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_location(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseGetLocation._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseGetLocation._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.GetLocation",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "GetLocation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._GetLocation._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            content = response.content.decode("utf-8")
            resp = locations_pb2.Location()
            resp = json_format.Parse(content, resp)
            resp = self._interceptor.post_get_location(resp)
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceAsyncClient.GetLocation",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "GetLocation",
                        "httpResponse": http_response,
                        "metadata": http_response["headers"],
                    },
                )
            return resp

    @property
    def list_locations(self):
        return self._ListLocations(self._session, self._host, self._interceptor)  # type: ignore

    class _ListLocations(
        _BaseTranslationServiceRestTransport._BaseListLocations,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ListLocations")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: locations_pb2.ListLocationsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> locations_pb2.ListLocationsResponse:
            r"""Call the list locations method over HTTP.

            Args:
                request (locations_pb2.ListLocationsRequest):
                    The request object for ListLocations method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                locations_pb2.ListLocationsResponse: Response from ListLocations method.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseListLocations._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_locations(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseListLocations._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseListLocations._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.ListLocations",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "ListLocations",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._ListLocations._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            content = response.content.decode("utf-8")
            resp = locations_pb2.ListLocationsResponse()
            resp = json_format.Parse(content, resp)
            resp = self._interceptor.post_list_locations(resp)
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceAsyncClient.ListLocations",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "ListLocations",
                        "httpResponse": http_response,
                        "metadata": http_response["headers"],
                    },
                )
            return resp

    @property
    def cancel_operation(self):
        return self._CancelOperation(self._session, self._host, self._interceptor)  # type: ignore

    class _CancelOperation(
        _BaseTranslationServiceRestTransport._BaseCancelOperation,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.CancelOperation")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: operations_pb2.CancelOperationRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> None:
            r"""Call the cancel operation method over HTTP.

            Args:
                request (operations_pb2.CancelOperationRequest):
                    The request object for CancelOperation method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseCancelOperation._get_http_options()
            )

            request, metadata = self._interceptor.pre_cancel_operation(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseCancelOperation._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseCancelOperation._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseCancelOperation._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.CancelOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "CancelOperation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._CancelOperation._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            return self._interceptor.post_cancel_operation(None)

    @property
    def delete_operation(self):
        return self._DeleteOperation(self._session, self._host, self._interceptor)  # type: ignore

    class _DeleteOperation(
        _BaseTranslationServiceRestTransport._BaseDeleteOperation,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.DeleteOperation")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: operations_pb2.DeleteOperationRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> None:
            r"""Call the delete operation method over HTTP.

            Args:
                request (operations_pb2.DeleteOperationRequest):
                    The request object for DeleteOperation method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseDeleteOperation._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_operation(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseDeleteOperation._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseDeleteOperation._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.DeleteOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "DeleteOperation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._DeleteOperation._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            return self._interceptor.post_delete_operation(None)

    @property
    def get_operation(self):
        return self._GetOperation(self._session, self._host, self._interceptor)  # type: ignore

    class _GetOperation(
        _BaseTranslationServiceRestTransport._BaseGetOperation,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.GetOperation")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: operations_pb2.GetOperationRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the get operation method over HTTP.

            Args:
                request (operations_pb2.GetOperationRequest):
                    The request object for GetOperation method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                operations_pb2.Operation: Response from GetOperation method.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseGetOperation._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_operation(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseGetOperation._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseGetOperation._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.GetOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "GetOperation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._GetOperation._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            content = response.content.decode("utf-8")
            resp = operations_pb2.Operation()
            resp = json_format.Parse(content, resp)
            resp = self._interceptor.post_get_operation(resp)
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceAsyncClient.GetOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "GetOperation",
                        "httpResponse": http_response,
                        "metadata": http_response["headers"],
                    },
                )
            return resp

    @property
    def list_operations(self):
        return self._ListOperations(self._session, self._host, self._interceptor)  # type: ignore

    class _ListOperations(
        _BaseTranslationServiceRestTransport._BaseListOperations,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ListOperations")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: operations_pb2.ListOperationsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.ListOperationsResponse:
            r"""Call the list operations method over HTTP.

            Args:
                request (operations_pb2.ListOperationsRequest):
                    The request object for ListOperations method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                operations_pb2.ListOperationsResponse: Response from ListOperations method.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseListOperations._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_operations(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseListOperations._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseListOperations._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.ListOperations",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "ListOperations",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._ListOperations._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            content = response.content.decode("utf-8")
            resp = operations_pb2.ListOperationsResponse()
            resp = json_format.Parse(content, resp)
            resp = self._interceptor.post_list_operations(resp)
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceAsyncClient.ListOperations",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "ListOperations",
                        "httpResponse": http_response,
                        "metadata": http_response["headers"],
                    },
                )
            return resp

    @property
    def wait_operation(self):
        return self._WaitOperation(self._session, self._host, self._interceptor)  # type: ignore

    class _WaitOperation(
        _BaseTranslationServiceRestTransport._BaseWaitOperation,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.WaitOperation")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: operations_pb2.WaitOperationRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the wait operation method over HTTP.

            Args:
                request (operations_pb2.WaitOperationRequest):
                    The request object for WaitOperation method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                operations_pb2.Operation: Response from WaitOperation method.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseWaitOperation._get_http_options()
            )

            request, metadata = self._interceptor.pre_wait_operation(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseWaitOperation._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseWaitOperation._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseWaitOperation._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.translation_v3beta1.TranslationServiceClient.WaitOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "WaitOperation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._WaitOperation._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            content = response.content.decode("utf-8")
            resp = operations_pb2.Operation()
            resp = json_format.Parse(content, resp)
            resp = self._interceptor.post_wait_operation(resp)
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3beta1.TranslationServiceAsyncClient.WaitOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3beta1.TranslationService",
                        "rpcName": "WaitOperation",
                        "httpResponse": http_response,
                        "metadata": http_response["headers"],
                    },
                )
            return resp

    @property
    def kind(self) -> str:
        return "rest"

    def close(self):
        self._session.close()


__all__ = ("TranslationServiceRestTransport",)
