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
from google.protobuf import empty_pb2  # type: ignore
from google.protobuf import json_format
from requests import __version__ as requests_version

from google.cloud.translate_v3.types import (
    adaptive_mt,
    automl_translation,
    common,
    translation_service,
)

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
            def pre_adaptive_mt_translate(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_adaptive_mt_translate(self, response):
                logging.log(f"Received response: {response}")
                return response

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

            def pre_create_adaptive_mt_dataset(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_adaptive_mt_dataset(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_dataset(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_dataset(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_glossary(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_glossary(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_glossary_entry(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_glossary_entry(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_model(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_model(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_delete_adaptive_mt_dataset(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_delete_adaptive_mt_file(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_delete_dataset(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_delete_dataset(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_delete_glossary(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_delete_glossary(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_delete_glossary_entry(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_delete_model(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_delete_model(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_detect_language(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_detect_language(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_export_data(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_export_data(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_adaptive_mt_dataset(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_adaptive_mt_dataset(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_adaptive_mt_file(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_adaptive_mt_file(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_dataset(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_dataset(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_glossary(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_glossary(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_glossary_entry(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_glossary_entry(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_model(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_model(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_supported_languages(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_supported_languages(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_import_adaptive_mt_file(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_import_adaptive_mt_file(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_import_data(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_import_data(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_adaptive_mt_datasets(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_adaptive_mt_datasets(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_adaptive_mt_files(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_adaptive_mt_files(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_adaptive_mt_sentences(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_adaptive_mt_sentences(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_datasets(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_datasets(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_examples(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_examples(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_glossaries(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_glossaries(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_glossary_entries(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_glossary_entries(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_models(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_models(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_romanize_text(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_romanize_text(self, response):
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

            def pre_update_glossary(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_update_glossary(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_update_glossary_entry(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_update_glossary_entry(self, response):
                logging.log(f"Received response: {response}")
                return response

        transport = TranslationServiceRestTransport(interceptor=MyCustomTranslationServiceInterceptor())
        client = TranslationServiceClient(transport=transport)


    """

    def pre_adaptive_mt_translate(
        self,
        request: adaptive_mt.AdaptiveMtTranslateRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.AdaptiveMtTranslateRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for adaptive_mt_translate

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_adaptive_mt_translate(
        self, response: adaptive_mt.AdaptiveMtTranslateResponse
    ) -> adaptive_mt.AdaptiveMtTranslateResponse:
        """Post-rpc interceptor for adaptive_mt_translate

        DEPRECATED. Please use the `post_adaptive_mt_translate_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_adaptive_mt_translate` interceptor runs
        before the `post_adaptive_mt_translate_with_metadata` interceptor.
        """
        return response

    def post_adaptive_mt_translate_with_metadata(
        self,
        response: adaptive_mt.AdaptiveMtTranslateResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.AdaptiveMtTranslateResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for adaptive_mt_translate

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_adaptive_mt_translate_with_metadata`
        interceptor in new development instead of the `post_adaptive_mt_translate` interceptor.
        When both interceptors are used, this `post_adaptive_mt_translate_with_metadata` interceptor runs after the
        `post_adaptive_mt_translate` interceptor. The (possibly modified) response returned by
        `post_adaptive_mt_translate` will be passed to
        `post_adaptive_mt_translate_with_metadata`.
        """
        return response, metadata

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

    def pre_create_adaptive_mt_dataset(
        self,
        request: adaptive_mt.CreateAdaptiveMtDatasetRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.CreateAdaptiveMtDatasetRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for create_adaptive_mt_dataset

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_create_adaptive_mt_dataset(
        self, response: adaptive_mt.AdaptiveMtDataset
    ) -> adaptive_mt.AdaptiveMtDataset:
        """Post-rpc interceptor for create_adaptive_mt_dataset

        DEPRECATED. Please use the `post_create_adaptive_mt_dataset_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_create_adaptive_mt_dataset` interceptor runs
        before the `post_create_adaptive_mt_dataset_with_metadata` interceptor.
        """
        return response

    def post_create_adaptive_mt_dataset_with_metadata(
        self,
        response: adaptive_mt.AdaptiveMtDataset,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[adaptive_mt.AdaptiveMtDataset, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_adaptive_mt_dataset

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_create_adaptive_mt_dataset_with_metadata`
        interceptor in new development instead of the `post_create_adaptive_mt_dataset` interceptor.
        When both interceptors are used, this `post_create_adaptive_mt_dataset_with_metadata` interceptor runs after the
        `post_create_adaptive_mt_dataset` interceptor. The (possibly modified) response returned by
        `post_create_adaptive_mt_dataset` will be passed to
        `post_create_adaptive_mt_dataset_with_metadata`.
        """
        return response, metadata

    def pre_create_dataset(
        self,
        request: automl_translation.CreateDatasetRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.CreateDatasetRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for create_dataset

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_create_dataset(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for create_dataset

        DEPRECATED. Please use the `post_create_dataset_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_create_dataset` interceptor runs
        before the `post_create_dataset_with_metadata` interceptor.
        """
        return response

    def post_create_dataset_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_dataset

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_create_dataset_with_metadata`
        interceptor in new development instead of the `post_create_dataset` interceptor.
        When both interceptors are used, this `post_create_dataset_with_metadata` interceptor runs after the
        `post_create_dataset` interceptor. The (possibly modified) response returned by
        `post_create_dataset` will be passed to
        `post_create_dataset_with_metadata`.
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

    def pre_create_glossary_entry(
        self,
        request: translation_service.CreateGlossaryEntryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.CreateGlossaryEntryRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for create_glossary_entry

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_create_glossary_entry(
        self, response: common.GlossaryEntry
    ) -> common.GlossaryEntry:
        """Post-rpc interceptor for create_glossary_entry

        DEPRECATED. Please use the `post_create_glossary_entry_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_create_glossary_entry` interceptor runs
        before the `post_create_glossary_entry_with_metadata` interceptor.
        """
        return response

    def post_create_glossary_entry_with_metadata(
        self,
        response: common.GlossaryEntry,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[common.GlossaryEntry, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_glossary_entry

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_create_glossary_entry_with_metadata`
        interceptor in new development instead of the `post_create_glossary_entry` interceptor.
        When both interceptors are used, this `post_create_glossary_entry_with_metadata` interceptor runs after the
        `post_create_glossary_entry` interceptor. The (possibly modified) response returned by
        `post_create_glossary_entry` will be passed to
        `post_create_glossary_entry_with_metadata`.
        """
        return response, metadata

    def pre_create_model(
        self,
        request: automl_translation.CreateModelRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.CreateModelRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for create_model

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_create_model(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for create_model

        DEPRECATED. Please use the `post_create_model_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_create_model` interceptor runs
        before the `post_create_model_with_metadata` interceptor.
        """
        return response

    def post_create_model_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_model

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_create_model_with_metadata`
        interceptor in new development instead of the `post_create_model` interceptor.
        When both interceptors are used, this `post_create_model_with_metadata` interceptor runs after the
        `post_create_model` interceptor. The (possibly modified) response returned by
        `post_create_model` will be passed to
        `post_create_model_with_metadata`.
        """
        return response, metadata

    def pre_delete_adaptive_mt_dataset(
        self,
        request: adaptive_mt.DeleteAdaptiveMtDatasetRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.DeleteAdaptiveMtDatasetRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for delete_adaptive_mt_dataset

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def pre_delete_adaptive_mt_file(
        self,
        request: adaptive_mt.DeleteAdaptiveMtFileRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.DeleteAdaptiveMtFileRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for delete_adaptive_mt_file

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def pre_delete_dataset(
        self,
        request: automl_translation.DeleteDatasetRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.DeleteDatasetRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for delete_dataset

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_delete_dataset(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for delete_dataset

        DEPRECATED. Please use the `post_delete_dataset_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_delete_dataset` interceptor runs
        before the `post_delete_dataset_with_metadata` interceptor.
        """
        return response

    def post_delete_dataset_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for delete_dataset

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_delete_dataset_with_metadata`
        interceptor in new development instead of the `post_delete_dataset` interceptor.
        When both interceptors are used, this `post_delete_dataset_with_metadata` interceptor runs after the
        `post_delete_dataset` interceptor. The (possibly modified) response returned by
        `post_delete_dataset` will be passed to
        `post_delete_dataset_with_metadata`.
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

    def pre_delete_glossary_entry(
        self,
        request: translation_service.DeleteGlossaryEntryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.DeleteGlossaryEntryRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for delete_glossary_entry

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def pre_delete_model(
        self,
        request: automl_translation.DeleteModelRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.DeleteModelRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for delete_model

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_delete_model(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for delete_model

        DEPRECATED. Please use the `post_delete_model_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_delete_model` interceptor runs
        before the `post_delete_model_with_metadata` interceptor.
        """
        return response

    def post_delete_model_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for delete_model

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_delete_model_with_metadata`
        interceptor in new development instead of the `post_delete_model` interceptor.
        When both interceptors are used, this `post_delete_model_with_metadata` interceptor runs after the
        `post_delete_model` interceptor. The (possibly modified) response returned by
        `post_delete_model` will be passed to
        `post_delete_model_with_metadata`.
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

    def pre_export_data(
        self,
        request: automl_translation.ExportDataRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.ExportDataRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for export_data

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_export_data(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for export_data

        DEPRECATED. Please use the `post_export_data_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_export_data` interceptor runs
        before the `post_export_data_with_metadata` interceptor.
        """
        return response

    def post_export_data_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for export_data

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_export_data_with_metadata`
        interceptor in new development instead of the `post_export_data` interceptor.
        When both interceptors are used, this `post_export_data_with_metadata` interceptor runs after the
        `post_export_data` interceptor. The (possibly modified) response returned by
        `post_export_data` will be passed to
        `post_export_data_with_metadata`.
        """
        return response, metadata

    def pre_get_adaptive_mt_dataset(
        self,
        request: adaptive_mt.GetAdaptiveMtDatasetRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.GetAdaptiveMtDatasetRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_adaptive_mt_dataset

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_get_adaptive_mt_dataset(
        self, response: adaptive_mt.AdaptiveMtDataset
    ) -> adaptive_mt.AdaptiveMtDataset:
        """Post-rpc interceptor for get_adaptive_mt_dataset

        DEPRECATED. Please use the `post_get_adaptive_mt_dataset_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_get_adaptive_mt_dataset` interceptor runs
        before the `post_get_adaptive_mt_dataset_with_metadata` interceptor.
        """
        return response

    def post_get_adaptive_mt_dataset_with_metadata(
        self,
        response: adaptive_mt.AdaptiveMtDataset,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[adaptive_mt.AdaptiveMtDataset, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_adaptive_mt_dataset

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_get_adaptive_mt_dataset_with_metadata`
        interceptor in new development instead of the `post_get_adaptive_mt_dataset` interceptor.
        When both interceptors are used, this `post_get_adaptive_mt_dataset_with_metadata` interceptor runs after the
        `post_get_adaptive_mt_dataset` interceptor. The (possibly modified) response returned by
        `post_get_adaptive_mt_dataset` will be passed to
        `post_get_adaptive_mt_dataset_with_metadata`.
        """
        return response, metadata

    def pre_get_adaptive_mt_file(
        self,
        request: adaptive_mt.GetAdaptiveMtFileRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.GetAdaptiveMtFileRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_adaptive_mt_file

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_get_adaptive_mt_file(
        self, response: adaptive_mt.AdaptiveMtFile
    ) -> adaptive_mt.AdaptiveMtFile:
        """Post-rpc interceptor for get_adaptive_mt_file

        DEPRECATED. Please use the `post_get_adaptive_mt_file_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_get_adaptive_mt_file` interceptor runs
        before the `post_get_adaptive_mt_file_with_metadata` interceptor.
        """
        return response

    def post_get_adaptive_mt_file_with_metadata(
        self,
        response: adaptive_mt.AdaptiveMtFile,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[adaptive_mt.AdaptiveMtFile, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_adaptive_mt_file

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_get_adaptive_mt_file_with_metadata`
        interceptor in new development instead of the `post_get_adaptive_mt_file` interceptor.
        When both interceptors are used, this `post_get_adaptive_mt_file_with_metadata` interceptor runs after the
        `post_get_adaptive_mt_file` interceptor. The (possibly modified) response returned by
        `post_get_adaptive_mt_file` will be passed to
        `post_get_adaptive_mt_file_with_metadata`.
        """
        return response, metadata

    def pre_get_dataset(
        self,
        request: automl_translation.GetDatasetRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.GetDatasetRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_dataset

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_get_dataset(
        self, response: automl_translation.Dataset
    ) -> automl_translation.Dataset:
        """Post-rpc interceptor for get_dataset

        DEPRECATED. Please use the `post_get_dataset_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_get_dataset` interceptor runs
        before the `post_get_dataset_with_metadata` interceptor.
        """
        return response

    def post_get_dataset_with_metadata(
        self,
        response: automl_translation.Dataset,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[automl_translation.Dataset, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_dataset

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_get_dataset_with_metadata`
        interceptor in new development instead of the `post_get_dataset` interceptor.
        When both interceptors are used, this `post_get_dataset_with_metadata` interceptor runs after the
        `post_get_dataset` interceptor. The (possibly modified) response returned by
        `post_get_dataset` will be passed to
        `post_get_dataset_with_metadata`.
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

    def pre_get_glossary_entry(
        self,
        request: translation_service.GetGlossaryEntryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.GetGlossaryEntryRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for get_glossary_entry

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_get_glossary_entry(
        self, response: common.GlossaryEntry
    ) -> common.GlossaryEntry:
        """Post-rpc interceptor for get_glossary_entry

        DEPRECATED. Please use the `post_get_glossary_entry_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_get_glossary_entry` interceptor runs
        before the `post_get_glossary_entry_with_metadata` interceptor.
        """
        return response

    def post_get_glossary_entry_with_metadata(
        self,
        response: common.GlossaryEntry,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[common.GlossaryEntry, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_glossary_entry

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_get_glossary_entry_with_metadata`
        interceptor in new development instead of the `post_get_glossary_entry` interceptor.
        When both interceptors are used, this `post_get_glossary_entry_with_metadata` interceptor runs after the
        `post_get_glossary_entry` interceptor. The (possibly modified) response returned by
        `post_get_glossary_entry` will be passed to
        `post_get_glossary_entry_with_metadata`.
        """
        return response, metadata

    def pre_get_model(
        self,
        request: automl_translation.GetModelRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.GetModelRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_model

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_get_model(
        self, response: automl_translation.Model
    ) -> automl_translation.Model:
        """Post-rpc interceptor for get_model

        DEPRECATED. Please use the `post_get_model_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_get_model` interceptor runs
        before the `post_get_model_with_metadata` interceptor.
        """
        return response

    def post_get_model_with_metadata(
        self,
        response: automl_translation.Model,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[automl_translation.Model, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_model

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_get_model_with_metadata`
        interceptor in new development instead of the `post_get_model` interceptor.
        When both interceptors are used, this `post_get_model_with_metadata` interceptor runs after the
        `post_get_model` interceptor. The (possibly modified) response returned by
        `post_get_model` will be passed to
        `post_get_model_with_metadata`.
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

    def pre_import_adaptive_mt_file(
        self,
        request: adaptive_mt.ImportAdaptiveMtFileRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.ImportAdaptiveMtFileRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for import_adaptive_mt_file

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_import_adaptive_mt_file(
        self, response: adaptive_mt.ImportAdaptiveMtFileResponse
    ) -> adaptive_mt.ImportAdaptiveMtFileResponse:
        """Post-rpc interceptor for import_adaptive_mt_file

        DEPRECATED. Please use the `post_import_adaptive_mt_file_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_import_adaptive_mt_file` interceptor runs
        before the `post_import_adaptive_mt_file_with_metadata` interceptor.
        """
        return response

    def post_import_adaptive_mt_file_with_metadata(
        self,
        response: adaptive_mt.ImportAdaptiveMtFileResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.ImportAdaptiveMtFileResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for import_adaptive_mt_file

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_import_adaptive_mt_file_with_metadata`
        interceptor in new development instead of the `post_import_adaptive_mt_file` interceptor.
        When both interceptors are used, this `post_import_adaptive_mt_file_with_metadata` interceptor runs after the
        `post_import_adaptive_mt_file` interceptor. The (possibly modified) response returned by
        `post_import_adaptive_mt_file` will be passed to
        `post_import_adaptive_mt_file_with_metadata`.
        """
        return response, metadata

    def pre_import_data(
        self,
        request: automl_translation.ImportDataRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.ImportDataRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for import_data

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_import_data(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for import_data

        DEPRECATED. Please use the `post_import_data_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_import_data` interceptor runs
        before the `post_import_data_with_metadata` interceptor.
        """
        return response

    def post_import_data_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for import_data

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_import_data_with_metadata`
        interceptor in new development instead of the `post_import_data` interceptor.
        When both interceptors are used, this `post_import_data_with_metadata` interceptor runs after the
        `post_import_data` interceptor. The (possibly modified) response returned by
        `post_import_data` will be passed to
        `post_import_data_with_metadata`.
        """
        return response, metadata

    def pre_list_adaptive_mt_datasets(
        self,
        request: adaptive_mt.ListAdaptiveMtDatasetsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.ListAdaptiveMtDatasetsRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for list_adaptive_mt_datasets

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_list_adaptive_mt_datasets(
        self, response: adaptive_mt.ListAdaptiveMtDatasetsResponse
    ) -> adaptive_mt.ListAdaptiveMtDatasetsResponse:
        """Post-rpc interceptor for list_adaptive_mt_datasets

        DEPRECATED. Please use the `post_list_adaptive_mt_datasets_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_list_adaptive_mt_datasets` interceptor runs
        before the `post_list_adaptive_mt_datasets_with_metadata` interceptor.
        """
        return response

    def post_list_adaptive_mt_datasets_with_metadata(
        self,
        response: adaptive_mt.ListAdaptiveMtDatasetsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.ListAdaptiveMtDatasetsResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for list_adaptive_mt_datasets

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_list_adaptive_mt_datasets_with_metadata`
        interceptor in new development instead of the `post_list_adaptive_mt_datasets` interceptor.
        When both interceptors are used, this `post_list_adaptive_mt_datasets_with_metadata` interceptor runs after the
        `post_list_adaptive_mt_datasets` interceptor. The (possibly modified) response returned by
        `post_list_adaptive_mt_datasets` will be passed to
        `post_list_adaptive_mt_datasets_with_metadata`.
        """
        return response, metadata

    def pre_list_adaptive_mt_files(
        self,
        request: adaptive_mt.ListAdaptiveMtFilesRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.ListAdaptiveMtFilesRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_adaptive_mt_files

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_list_adaptive_mt_files(
        self, response: adaptive_mt.ListAdaptiveMtFilesResponse
    ) -> adaptive_mt.ListAdaptiveMtFilesResponse:
        """Post-rpc interceptor for list_adaptive_mt_files

        DEPRECATED. Please use the `post_list_adaptive_mt_files_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_list_adaptive_mt_files` interceptor runs
        before the `post_list_adaptive_mt_files_with_metadata` interceptor.
        """
        return response

    def post_list_adaptive_mt_files_with_metadata(
        self,
        response: adaptive_mt.ListAdaptiveMtFilesResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.ListAdaptiveMtFilesResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_adaptive_mt_files

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_list_adaptive_mt_files_with_metadata`
        interceptor in new development instead of the `post_list_adaptive_mt_files` interceptor.
        When both interceptors are used, this `post_list_adaptive_mt_files_with_metadata` interceptor runs after the
        `post_list_adaptive_mt_files` interceptor. The (possibly modified) response returned by
        `post_list_adaptive_mt_files` will be passed to
        `post_list_adaptive_mt_files_with_metadata`.
        """
        return response, metadata

    def pre_list_adaptive_mt_sentences(
        self,
        request: adaptive_mt.ListAdaptiveMtSentencesRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.ListAdaptiveMtSentencesRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for list_adaptive_mt_sentences

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_list_adaptive_mt_sentences(
        self, response: adaptive_mt.ListAdaptiveMtSentencesResponse
    ) -> adaptive_mt.ListAdaptiveMtSentencesResponse:
        """Post-rpc interceptor for list_adaptive_mt_sentences

        DEPRECATED. Please use the `post_list_adaptive_mt_sentences_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_list_adaptive_mt_sentences` interceptor runs
        before the `post_list_adaptive_mt_sentences_with_metadata` interceptor.
        """
        return response

    def post_list_adaptive_mt_sentences_with_metadata(
        self,
        response: adaptive_mt.ListAdaptiveMtSentencesResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        adaptive_mt.ListAdaptiveMtSentencesResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for list_adaptive_mt_sentences

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_list_adaptive_mt_sentences_with_metadata`
        interceptor in new development instead of the `post_list_adaptive_mt_sentences` interceptor.
        When both interceptors are used, this `post_list_adaptive_mt_sentences_with_metadata` interceptor runs after the
        `post_list_adaptive_mt_sentences` interceptor. The (possibly modified) response returned by
        `post_list_adaptive_mt_sentences` will be passed to
        `post_list_adaptive_mt_sentences_with_metadata`.
        """
        return response, metadata

    def pre_list_datasets(
        self,
        request: automl_translation.ListDatasetsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.ListDatasetsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_datasets

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_list_datasets(
        self, response: automl_translation.ListDatasetsResponse
    ) -> automl_translation.ListDatasetsResponse:
        """Post-rpc interceptor for list_datasets

        DEPRECATED. Please use the `post_list_datasets_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_list_datasets` interceptor runs
        before the `post_list_datasets_with_metadata` interceptor.
        """
        return response

    def post_list_datasets_with_metadata(
        self,
        response: automl_translation.ListDatasetsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.ListDatasetsResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_datasets

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_list_datasets_with_metadata`
        interceptor in new development instead of the `post_list_datasets` interceptor.
        When both interceptors are used, this `post_list_datasets_with_metadata` interceptor runs after the
        `post_list_datasets` interceptor. The (possibly modified) response returned by
        `post_list_datasets` will be passed to
        `post_list_datasets_with_metadata`.
        """
        return response, metadata

    def pre_list_examples(
        self,
        request: automl_translation.ListExamplesRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.ListExamplesRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_examples

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_list_examples(
        self, response: automl_translation.ListExamplesResponse
    ) -> automl_translation.ListExamplesResponse:
        """Post-rpc interceptor for list_examples

        DEPRECATED. Please use the `post_list_examples_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_list_examples` interceptor runs
        before the `post_list_examples_with_metadata` interceptor.
        """
        return response

    def post_list_examples_with_metadata(
        self,
        response: automl_translation.ListExamplesResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.ListExamplesResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_examples

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_list_examples_with_metadata`
        interceptor in new development instead of the `post_list_examples` interceptor.
        When both interceptors are used, this `post_list_examples_with_metadata` interceptor runs after the
        `post_list_examples` interceptor. The (possibly modified) response returned by
        `post_list_examples` will be passed to
        `post_list_examples_with_metadata`.
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

    def pre_list_glossary_entries(
        self,
        request: translation_service.ListGlossaryEntriesRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.ListGlossaryEntriesRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for list_glossary_entries

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_list_glossary_entries(
        self, response: translation_service.ListGlossaryEntriesResponse
    ) -> translation_service.ListGlossaryEntriesResponse:
        """Post-rpc interceptor for list_glossary_entries

        DEPRECATED. Please use the `post_list_glossary_entries_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_list_glossary_entries` interceptor runs
        before the `post_list_glossary_entries_with_metadata` interceptor.
        """
        return response

    def post_list_glossary_entries_with_metadata(
        self,
        response: translation_service.ListGlossaryEntriesResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.ListGlossaryEntriesResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for list_glossary_entries

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_list_glossary_entries_with_metadata`
        interceptor in new development instead of the `post_list_glossary_entries` interceptor.
        When both interceptors are used, this `post_list_glossary_entries_with_metadata` interceptor runs after the
        `post_list_glossary_entries` interceptor. The (possibly modified) response returned by
        `post_list_glossary_entries` will be passed to
        `post_list_glossary_entries_with_metadata`.
        """
        return response, metadata

    def pre_list_models(
        self,
        request: automl_translation.ListModelsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.ListModelsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_models

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_list_models(
        self, response: automl_translation.ListModelsResponse
    ) -> automl_translation.ListModelsResponse:
        """Post-rpc interceptor for list_models

        DEPRECATED. Please use the `post_list_models_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_list_models` interceptor runs
        before the `post_list_models_with_metadata` interceptor.
        """
        return response

    def post_list_models_with_metadata(
        self,
        response: automl_translation.ListModelsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        automl_translation.ListModelsResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_models

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_list_models_with_metadata`
        interceptor in new development instead of the `post_list_models` interceptor.
        When both interceptors are used, this `post_list_models_with_metadata` interceptor runs after the
        `post_list_models` interceptor. The (possibly modified) response returned by
        `post_list_models` will be passed to
        `post_list_models_with_metadata`.
        """
        return response, metadata

    def pre_romanize_text(
        self,
        request: translation_service.RomanizeTextRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.RomanizeTextRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for romanize_text

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_romanize_text(
        self, response: translation_service.RomanizeTextResponse
    ) -> translation_service.RomanizeTextResponse:
        """Post-rpc interceptor for romanize_text

        DEPRECATED. Please use the `post_romanize_text_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_romanize_text` interceptor runs
        before the `post_romanize_text_with_metadata` interceptor.
        """
        return response

    def post_romanize_text_with_metadata(
        self,
        response: translation_service.RomanizeTextResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.RomanizeTextResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for romanize_text

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_romanize_text_with_metadata`
        interceptor in new development instead of the `post_romanize_text` interceptor.
        When both interceptors are used, this `post_romanize_text_with_metadata` interceptor runs after the
        `post_romanize_text` interceptor. The (possibly modified) response returned by
        `post_romanize_text` will be passed to
        `post_romanize_text_with_metadata`.
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

    def pre_update_glossary(
        self,
        request: translation_service.UpdateGlossaryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.UpdateGlossaryRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for update_glossary

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_update_glossary(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for update_glossary

        DEPRECATED. Please use the `post_update_glossary_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_update_glossary` interceptor runs
        before the `post_update_glossary_with_metadata` interceptor.
        """
        return response

    def post_update_glossary_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for update_glossary

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_update_glossary_with_metadata`
        interceptor in new development instead of the `post_update_glossary` interceptor.
        When both interceptors are used, this `post_update_glossary_with_metadata` interceptor runs after the
        `post_update_glossary` interceptor. The (possibly modified) response returned by
        `post_update_glossary` will be passed to
        `post_update_glossary_with_metadata`.
        """
        return response, metadata

    def pre_update_glossary_entry(
        self,
        request: translation_service.UpdateGlossaryEntryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        translation_service.UpdateGlossaryEntryRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for update_glossary_entry

        Override in a subclass to manipulate the request or metadata
        before they are sent to the TranslationService server.
        """
        return request, metadata

    def post_update_glossary_entry(
        self, response: common.GlossaryEntry
    ) -> common.GlossaryEntry:
        """Post-rpc interceptor for update_glossary_entry

        DEPRECATED. Please use the `post_update_glossary_entry_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the TranslationService server but before
        it is returned to user code. This `post_update_glossary_entry` interceptor runs
        before the `post_update_glossary_entry_with_metadata` interceptor.
        """
        return response

    def post_update_glossary_entry_with_metadata(
        self,
        response: common.GlossaryEntry,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[common.GlossaryEntry, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for update_glossary_entry

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the TranslationService server but before it is returned to user code.

        We recommend only using this `post_update_glossary_entry_with_metadata`
        interceptor in new development instead of the `post_update_glossary_entry` interceptor.
        When both interceptors are used, this `post_update_glossary_entry_with_metadata` interceptor runs after the
        `post_update_glossary_entry` interceptor. The (possibly modified) response returned by
        `post_update_glossary_entry` will be passed to
        `post_update_glossary_entry_with_metadata`.
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
                        "uri": "/v3/{name=projects/*/locations/*/operations/*}:cancel",
                        "body": "*",
                    },
                ],
                "google.longrunning.Operations.DeleteOperation": [
                    {
                        "method": "delete",
                        "uri": "/v3/{name=projects/*/locations/*/operations/*}",
                    },
                ],
                "google.longrunning.Operations.GetOperation": [
                    {
                        "method": "get",
                        "uri": "/v3/{name=projects/*/locations/*/operations/*}",
                    },
                ],
                "google.longrunning.Operations.ListOperations": [
                    {
                        "method": "get",
                        "uri": "/v3/{name=projects/*/locations/*}/operations",
                    },
                ],
                "google.longrunning.Operations.WaitOperation": [
                    {
                        "method": "post",
                        "uri": "/v3/{name=projects/*/locations/*/operations/*}:wait",
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
                path_prefix="v3",
            )

            self._operations_client = operations_v1.AbstractOperationsClient(
                transport=rest_transport
            )

        # Return the client from cache.
        return self._operations_client

    class _AdaptiveMtTranslate(
        _BaseTranslationServiceRestTransport._BaseAdaptiveMtTranslate,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.AdaptiveMtTranslate")

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
            request: adaptive_mt.AdaptiveMtTranslateRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> adaptive_mt.AdaptiveMtTranslateResponse:
            r"""Call the adaptive mt translate method over HTTP.

            Args:
                request (~.adaptive_mt.AdaptiveMtTranslateRequest):
                    The request object. The request for sending an AdaptiveMt
                translation query.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.adaptive_mt.AdaptiveMtTranslateResponse:
                    An AdaptiveMtTranslate response.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseAdaptiveMtTranslate._get_http_options()
            )

            request, metadata = self._interceptor.pre_adaptive_mt_translate(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseAdaptiveMtTranslate._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseAdaptiveMtTranslate._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseAdaptiveMtTranslate._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.AdaptiveMtTranslate",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "AdaptiveMtTranslate",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._AdaptiveMtTranslate._get_response(
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
            resp = adaptive_mt.AdaptiveMtTranslateResponse()
            pb_resp = adaptive_mt.AdaptiveMtTranslateResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_adaptive_mt_translate(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_adaptive_mt_translate_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = adaptive_mt.AdaptiveMtTranslateResponse.to_json(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.adaptive_mt_translate",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "AdaptiveMtTranslate",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.BatchTranslateDocument",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.batch_translate_document",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.BatchTranslateText",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.batch_translate_text",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "BatchTranslateText",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateAdaptiveMtDataset(
        _BaseTranslationServiceRestTransport._BaseCreateAdaptiveMtDataset,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.CreateAdaptiveMtDataset")

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
            request: adaptive_mt.CreateAdaptiveMtDatasetRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> adaptive_mt.AdaptiveMtDataset:
            r"""Call the create adaptive mt
            dataset method over HTTP.

                Args:
                    request (~.adaptive_mt.CreateAdaptiveMtDatasetRequest):
                        The request object. Request message for creating an
                    AdaptiveMtDataset.
                    retry (google.api_core.retry.Retry): Designation of what errors, if any,
                        should be retried.
                    timeout (float): The timeout for this request.
                    metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                        sent along with the request as metadata. Normally, each value must be of type `str`,
                        but for metadata keys ending with the suffix `-bin`, the corresponding values must
                        be of type `bytes`.

                Returns:
                    ~.adaptive_mt.AdaptiveMtDataset:
                        An Adaptive MT Dataset.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseCreateAdaptiveMtDataset._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_adaptive_mt_dataset(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseCreateAdaptiveMtDataset._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseCreateAdaptiveMtDataset._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseCreateAdaptiveMtDataset._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.CreateAdaptiveMtDataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "CreateAdaptiveMtDataset",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._CreateAdaptiveMtDataset._get_response(
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
            resp = adaptive_mt.AdaptiveMtDataset()
            pb_resp = adaptive_mt.AdaptiveMtDataset.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_create_adaptive_mt_dataset(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_adaptive_mt_dataset_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = adaptive_mt.AdaptiveMtDataset.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.create_adaptive_mt_dataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "CreateAdaptiveMtDataset",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateDataset(
        _BaseTranslationServiceRestTransport._BaseCreateDataset,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.CreateDataset")

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
            request: automl_translation.CreateDatasetRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the create dataset method over HTTP.

            Args:
                request (~.automl_translation.CreateDatasetRequest):
                    The request object. Request message for CreateDataset.
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
                _BaseTranslationServiceRestTransport._BaseCreateDataset._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_dataset(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseCreateDataset._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseCreateDataset._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseCreateDataset._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.CreateDataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "CreateDataset",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._CreateDataset._get_response(
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

            resp = self._interceptor.post_create_dataset(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_dataset_with_metadata(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.create_dataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "CreateDataset",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.CreateGlossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.create_glossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "CreateGlossary",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateGlossaryEntry(
        _BaseTranslationServiceRestTransport._BaseCreateGlossaryEntry,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.CreateGlossaryEntry")

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
            request: translation_service.CreateGlossaryEntryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> common.GlossaryEntry:
            r"""Call the create glossary entry method over HTTP.

            Args:
                request (~.translation_service.CreateGlossaryEntryRequest):
                    The request object. Request message for
                CreateGlossaryEntry
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.common.GlossaryEntry:
                    Represents a single entry in a
                glossary.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseCreateGlossaryEntry._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_glossary_entry(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseCreateGlossaryEntry._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseCreateGlossaryEntry._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseCreateGlossaryEntry._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.CreateGlossaryEntry",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "CreateGlossaryEntry",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._CreateGlossaryEntry._get_response(
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
            resp = common.GlossaryEntry()
            pb_resp = common.GlossaryEntry.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_create_glossary_entry(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_glossary_entry_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = common.GlossaryEntry.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.create_glossary_entry",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "CreateGlossaryEntry",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateModel(
        _BaseTranslationServiceRestTransport._BaseCreateModel,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.CreateModel")

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
            request: automl_translation.CreateModelRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the create model method over HTTP.

            Args:
                request (~.automl_translation.CreateModelRequest):
                    The request object. Request message for CreateModel.
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
                _BaseTranslationServiceRestTransport._BaseCreateModel._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_model(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseCreateModel._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseCreateModel._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseCreateModel._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.CreateModel",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "CreateModel",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._CreateModel._get_response(
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

            resp = self._interceptor.post_create_model(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_model_with_metadata(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.create_model",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "CreateModel",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _DeleteAdaptiveMtDataset(
        _BaseTranslationServiceRestTransport._BaseDeleteAdaptiveMtDataset,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.DeleteAdaptiveMtDataset")

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
            request: adaptive_mt.DeleteAdaptiveMtDatasetRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the delete adaptive mt
            dataset method over HTTP.

                Args:
                    request (~.adaptive_mt.DeleteAdaptiveMtDatasetRequest):
                        The request object. Request message for deleting an
                    AdaptiveMtDataset.
                    retry (google.api_core.retry.Retry): Designation of what errors, if any,
                        should be retried.
                    timeout (float): The timeout for this request.
                    metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                        sent along with the request as metadata. Normally, each value must be of type `str`,
                        but for metadata keys ending with the suffix `-bin`, the corresponding values must
                        be of type `bytes`.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseDeleteAdaptiveMtDataset._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_adaptive_mt_dataset(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseDeleteAdaptiveMtDataset._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseDeleteAdaptiveMtDataset._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.DeleteAdaptiveMtDataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "DeleteAdaptiveMtDataset",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._DeleteAdaptiveMtDataset._get_response(
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

    class _DeleteAdaptiveMtFile(
        _BaseTranslationServiceRestTransport._BaseDeleteAdaptiveMtFile,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.DeleteAdaptiveMtFile")

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
            request: adaptive_mt.DeleteAdaptiveMtFileRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the delete adaptive mt file method over HTTP.

            Args:
                request (~.adaptive_mt.DeleteAdaptiveMtFileRequest):
                    The request object. The request for deleting an
                AdaptiveMt file.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseDeleteAdaptiveMtFile._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_adaptive_mt_file(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseDeleteAdaptiveMtFile._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseDeleteAdaptiveMtFile._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.DeleteAdaptiveMtFile",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "DeleteAdaptiveMtFile",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._DeleteAdaptiveMtFile._get_response(
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

    class _DeleteDataset(
        _BaseTranslationServiceRestTransport._BaseDeleteDataset,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.DeleteDataset")

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
            request: automl_translation.DeleteDatasetRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the delete dataset method over HTTP.

            Args:
                request (~.automl_translation.DeleteDatasetRequest):
                    The request object. Request message for DeleteDataset.
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
                _BaseTranslationServiceRestTransport._BaseDeleteDataset._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_dataset(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseDeleteDataset._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseDeleteDataset._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.DeleteDataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "DeleteDataset",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._DeleteDataset._get_response(
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

            resp = self._interceptor.post_delete_dataset(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_delete_dataset_with_metadata(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.delete_dataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "DeleteDataset",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.DeleteGlossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.delete_glossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "DeleteGlossary",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _DeleteGlossaryEntry(
        _BaseTranslationServiceRestTransport._BaseDeleteGlossaryEntry,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.DeleteGlossaryEntry")

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
            request: translation_service.DeleteGlossaryEntryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the delete glossary entry method over HTTP.

            Args:
                request (~.translation_service.DeleteGlossaryEntryRequest):
                    The request object. Request message for Delete Glossary
                Entry
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseDeleteGlossaryEntry._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_glossary_entry(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseDeleteGlossaryEntry._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseDeleteGlossaryEntry._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.DeleteGlossaryEntry",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "DeleteGlossaryEntry",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._DeleteGlossaryEntry._get_response(
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

    class _DeleteModel(
        _BaseTranslationServiceRestTransport._BaseDeleteModel,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.DeleteModel")

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
            request: automl_translation.DeleteModelRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the delete model method over HTTP.

            Args:
                request (~.automl_translation.DeleteModelRequest):
                    The request object. Request message for DeleteModel.
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
                _BaseTranslationServiceRestTransport._BaseDeleteModel._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_model(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseDeleteModel._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseDeleteModel._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.DeleteModel",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "DeleteModel",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._DeleteModel._get_response(
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

            resp = self._interceptor.post_delete_model(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_delete_model_with_metadata(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.delete_model",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "DeleteModel",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.DetectLanguage",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.detect_language",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "DetectLanguage",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ExportData(
        _BaseTranslationServiceRestTransport._BaseExportData, TranslationServiceRestStub
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ExportData")

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
            request: automl_translation.ExportDataRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the export data method over HTTP.

            Args:
                request (~.automl_translation.ExportDataRequest):
                    The request object. Request message for ExportData.
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
                _BaseTranslationServiceRestTransport._BaseExportData._get_http_options()
            )

            request, metadata = self._interceptor.pre_export_data(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseExportData._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseExportData._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseExportData._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ExportData",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ExportData",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._ExportData._get_response(
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

            resp = self._interceptor.post_export_data(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_export_data_with_metadata(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.export_data",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ExportData",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetAdaptiveMtDataset(
        _BaseTranslationServiceRestTransport._BaseGetAdaptiveMtDataset,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.GetAdaptiveMtDataset")

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
            request: adaptive_mt.GetAdaptiveMtDatasetRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> adaptive_mt.AdaptiveMtDataset:
            r"""Call the get adaptive mt dataset method over HTTP.

            Args:
                request (~.adaptive_mt.GetAdaptiveMtDatasetRequest):
                    The request object. Request message for getting an
                Adaptive MT dataset.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.adaptive_mt.AdaptiveMtDataset:
                    An Adaptive MT Dataset.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseGetAdaptiveMtDataset._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_adaptive_mt_dataset(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseGetAdaptiveMtDataset._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseGetAdaptiveMtDataset._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.GetAdaptiveMtDataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetAdaptiveMtDataset",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._GetAdaptiveMtDataset._get_response(
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
            resp = adaptive_mt.AdaptiveMtDataset()
            pb_resp = adaptive_mt.AdaptiveMtDataset.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_adaptive_mt_dataset(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_adaptive_mt_dataset_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = adaptive_mt.AdaptiveMtDataset.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.get_adaptive_mt_dataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetAdaptiveMtDataset",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetAdaptiveMtFile(
        _BaseTranslationServiceRestTransport._BaseGetAdaptiveMtFile,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.GetAdaptiveMtFile")

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
            request: adaptive_mt.GetAdaptiveMtFileRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> adaptive_mt.AdaptiveMtFile:
            r"""Call the get adaptive mt file method over HTTP.

            Args:
                request (~.adaptive_mt.GetAdaptiveMtFileRequest):
                    The request object. The request for getting an
                AdaptiveMtFile.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.adaptive_mt.AdaptiveMtFile:
                    An AdaptiveMtFile.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseGetAdaptiveMtFile._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_adaptive_mt_file(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseGetAdaptiveMtFile._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseGetAdaptiveMtFile._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.GetAdaptiveMtFile",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetAdaptiveMtFile",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._GetAdaptiveMtFile._get_response(
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
            resp = adaptive_mt.AdaptiveMtFile()
            pb_resp = adaptive_mt.AdaptiveMtFile.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_adaptive_mt_file(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_adaptive_mt_file_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = adaptive_mt.AdaptiveMtFile.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.get_adaptive_mt_file",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetAdaptiveMtFile",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetDataset(
        _BaseTranslationServiceRestTransport._BaseGetDataset, TranslationServiceRestStub
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.GetDataset")

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
            request: automl_translation.GetDatasetRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> automl_translation.Dataset:
            r"""Call the get dataset method over HTTP.

            Args:
                request (~.automl_translation.GetDatasetRequest):
                    The request object. Request message for GetDataset.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.automl_translation.Dataset:
                    A dataset that hosts the examples
                (sentence pairs) used for translation
                models.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseGetDataset._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_dataset(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseGetDataset._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseGetDataset._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.GetDataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetDataset",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._GetDataset._get_response(
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
            resp = automl_translation.Dataset()
            pb_resp = automl_translation.Dataset.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_dataset(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_dataset_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = automl_translation.Dataset.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.get_dataset",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetDataset",
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
                    Represents a glossary built from
                user-provided data.

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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.GetGlossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.get_glossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetGlossary",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetGlossaryEntry(
        _BaseTranslationServiceRestTransport._BaseGetGlossaryEntry,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.GetGlossaryEntry")

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
            request: translation_service.GetGlossaryEntryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> common.GlossaryEntry:
            r"""Call the get glossary entry method over HTTP.

            Args:
                request (~.translation_service.GetGlossaryEntryRequest):
                    The request object. Request message for the Get Glossary
                Entry Api
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.common.GlossaryEntry:
                    Represents a single entry in a
                glossary.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseGetGlossaryEntry._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_glossary_entry(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseGetGlossaryEntry._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseGetGlossaryEntry._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.GetGlossaryEntry",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetGlossaryEntry",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._GetGlossaryEntry._get_response(
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
            resp = common.GlossaryEntry()
            pb_resp = common.GlossaryEntry.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_glossary_entry(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_glossary_entry_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = common.GlossaryEntry.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.get_glossary_entry",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetGlossaryEntry",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetModel(
        _BaseTranslationServiceRestTransport._BaseGetModel, TranslationServiceRestStub
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.GetModel")

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
            request: automl_translation.GetModelRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> automl_translation.Model:
            r"""Call the get model method over HTTP.

            Args:
                request (~.automl_translation.GetModelRequest):
                    The request object. Request message for GetModel.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.automl_translation.Model:
                    A trained translation model.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseGetModel._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_model(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseGetModel._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseGetModel._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.GetModel",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetModel",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._GetModel._get_response(
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
            resp = automl_translation.Model()
            pb_resp = automl_translation.Model.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_model(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_model_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = automl_translation.Model.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.get_model",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetModel",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.GetSupportedLanguages",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.get_supported_languages",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "GetSupportedLanguages",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ImportAdaptiveMtFile(
        _BaseTranslationServiceRestTransport._BaseImportAdaptiveMtFile,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ImportAdaptiveMtFile")

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
            request: adaptive_mt.ImportAdaptiveMtFileRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> adaptive_mt.ImportAdaptiveMtFileResponse:
            r"""Call the import adaptive mt file method over HTTP.

            Args:
                request (~.adaptive_mt.ImportAdaptiveMtFileRequest):
                    The request object. The request for importing an
                AdaptiveMt file along with its
                sentences.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.adaptive_mt.ImportAdaptiveMtFileResponse:
                    The response for importing an
                AdaptiveMtFile

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseImportAdaptiveMtFile._get_http_options()
            )

            request, metadata = self._interceptor.pre_import_adaptive_mt_file(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseImportAdaptiveMtFile._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseImportAdaptiveMtFile._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseImportAdaptiveMtFile._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ImportAdaptiveMtFile",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ImportAdaptiveMtFile",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._ImportAdaptiveMtFile._get_response(
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
            resp = adaptive_mt.ImportAdaptiveMtFileResponse()
            pb_resp = adaptive_mt.ImportAdaptiveMtFileResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_import_adaptive_mt_file(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_import_adaptive_mt_file_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = adaptive_mt.ImportAdaptiveMtFileResponse.to_json(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.import_adaptive_mt_file",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ImportAdaptiveMtFile",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ImportData(
        _BaseTranslationServiceRestTransport._BaseImportData, TranslationServiceRestStub
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ImportData")

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
            request: automl_translation.ImportDataRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the import data method over HTTP.

            Args:
                request (~.automl_translation.ImportDataRequest):
                    The request object. Request message for ImportData.
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
                _BaseTranslationServiceRestTransport._BaseImportData._get_http_options()
            )

            request, metadata = self._interceptor.pre_import_data(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseImportData._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseImportData._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseImportData._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ImportData",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ImportData",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._ImportData._get_response(
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

            resp = self._interceptor.post_import_data(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_import_data_with_metadata(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.import_data",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ImportData",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListAdaptiveMtDatasets(
        _BaseTranslationServiceRestTransport._BaseListAdaptiveMtDatasets,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ListAdaptiveMtDatasets")

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
            request: adaptive_mt.ListAdaptiveMtDatasetsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> adaptive_mt.ListAdaptiveMtDatasetsResponse:
            r"""Call the list adaptive mt datasets method over HTTP.

            Args:
                request (~.adaptive_mt.ListAdaptiveMtDatasetsRequest):
                    The request object. Request message for listing all
                Adaptive MT datasets that the requestor
                has access to.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.adaptive_mt.ListAdaptiveMtDatasetsResponse:
                    A list of AdaptiveMtDatasets.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseListAdaptiveMtDatasets._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_adaptive_mt_datasets(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseListAdaptiveMtDatasets._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseListAdaptiveMtDatasets._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ListAdaptiveMtDatasets",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListAdaptiveMtDatasets",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._ListAdaptiveMtDatasets._get_response(
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
            resp = adaptive_mt.ListAdaptiveMtDatasetsResponse()
            pb_resp = adaptive_mt.ListAdaptiveMtDatasetsResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_adaptive_mt_datasets(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_adaptive_mt_datasets_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = (
                        adaptive_mt.ListAdaptiveMtDatasetsResponse.to_json(response)
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.list_adaptive_mt_datasets",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListAdaptiveMtDatasets",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListAdaptiveMtFiles(
        _BaseTranslationServiceRestTransport._BaseListAdaptiveMtFiles,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ListAdaptiveMtFiles")

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
            request: adaptive_mt.ListAdaptiveMtFilesRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> adaptive_mt.ListAdaptiveMtFilesResponse:
            r"""Call the list adaptive mt files method over HTTP.

            Args:
                request (~.adaptive_mt.ListAdaptiveMtFilesRequest):
                    The request object. The request to list all AdaptiveMt
                files under a given dataset.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.adaptive_mt.ListAdaptiveMtFilesResponse:
                    The response for listing all
                AdaptiveMt files under a given dataset.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseListAdaptiveMtFiles._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_adaptive_mt_files(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseListAdaptiveMtFiles._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseListAdaptiveMtFiles._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ListAdaptiveMtFiles",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListAdaptiveMtFiles",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._ListAdaptiveMtFiles._get_response(
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
            resp = adaptive_mt.ListAdaptiveMtFilesResponse()
            pb_resp = adaptive_mt.ListAdaptiveMtFilesResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_adaptive_mt_files(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_adaptive_mt_files_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = adaptive_mt.ListAdaptiveMtFilesResponse.to_json(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.list_adaptive_mt_files",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListAdaptiveMtFiles",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListAdaptiveMtSentences(
        _BaseTranslationServiceRestTransport._BaseListAdaptiveMtSentences,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ListAdaptiveMtSentences")

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
            request: adaptive_mt.ListAdaptiveMtSentencesRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> adaptive_mt.ListAdaptiveMtSentencesResponse:
            r"""Call the list adaptive mt
            sentences method over HTTP.

                Args:
                    request (~.adaptive_mt.ListAdaptiveMtSentencesRequest):
                        The request object. The request for listing Adaptive MT
                    sentences from a Dataset/File.
                    retry (google.api_core.retry.Retry): Designation of what errors, if any,
                        should be retried.
                    timeout (float): The timeout for this request.
                    metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                        sent along with the request as metadata. Normally, each value must be of type `str`,
                        but for metadata keys ending with the suffix `-bin`, the corresponding values must
                        be of type `bytes`.

                Returns:
                    ~.adaptive_mt.ListAdaptiveMtSentencesResponse:
                        List AdaptiveMt sentences response.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseListAdaptiveMtSentences._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_adaptive_mt_sentences(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseListAdaptiveMtSentences._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseListAdaptiveMtSentences._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ListAdaptiveMtSentences",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListAdaptiveMtSentences",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._ListAdaptiveMtSentences._get_response(
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
            resp = adaptive_mt.ListAdaptiveMtSentencesResponse()
            pb_resp = adaptive_mt.ListAdaptiveMtSentencesResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_adaptive_mt_sentences(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_adaptive_mt_sentences_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = (
                        adaptive_mt.ListAdaptiveMtSentencesResponse.to_json(response)
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.list_adaptive_mt_sentences",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListAdaptiveMtSentences",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListDatasets(
        _BaseTranslationServiceRestTransport._BaseListDatasets,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ListDatasets")

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
            request: automl_translation.ListDatasetsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> automl_translation.ListDatasetsResponse:
            r"""Call the list datasets method over HTTP.

            Args:
                request (~.automl_translation.ListDatasetsRequest):
                    The request object. Request message for ListDatasets.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.automl_translation.ListDatasetsResponse:
                    Response message for ListDatasets.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseListDatasets._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_datasets(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseListDatasets._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseListDatasets._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ListDatasets",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListDatasets",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._ListDatasets._get_response(
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
            resp = automl_translation.ListDatasetsResponse()
            pb_resp = automl_translation.ListDatasetsResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_datasets(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_datasets_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = automl_translation.ListDatasetsResponse.to_json(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.list_datasets",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListDatasets",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListExamples(
        _BaseTranslationServiceRestTransport._BaseListExamples,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ListExamples")

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
            request: automl_translation.ListExamplesRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> automl_translation.ListExamplesResponse:
            r"""Call the list examples method over HTTP.

            Args:
                request (~.automl_translation.ListExamplesRequest):
                    The request object. Request message for ListExamples.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.automl_translation.ListExamplesResponse:
                    Response message for ListExamples.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseListExamples._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_examples(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseListExamples._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseListExamples._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ListExamples",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListExamples",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._ListExamples._get_response(
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
            resp = automl_translation.ListExamplesResponse()
            pb_resp = automl_translation.ListExamplesResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_examples(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_examples_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = automl_translation.ListExamplesResponse.to_json(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.list_examples",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListExamples",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ListGlossaries",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.list_glossaries",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListGlossaries",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListGlossaryEntries(
        _BaseTranslationServiceRestTransport._BaseListGlossaryEntries,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ListGlossaryEntries")

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
            request: translation_service.ListGlossaryEntriesRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> translation_service.ListGlossaryEntriesResponse:
            r"""Call the list glossary entries method over HTTP.

            Args:
                request (~.translation_service.ListGlossaryEntriesRequest):
                    The request object. Request message for
                ListGlossaryEntries
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.translation_service.ListGlossaryEntriesResponse:
                    Response message for
                ListGlossaryEntries

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseListGlossaryEntries._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_glossary_entries(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseListGlossaryEntries._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseListGlossaryEntries._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ListGlossaryEntries",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListGlossaryEntries",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._ListGlossaryEntries._get_response(
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
            resp = translation_service.ListGlossaryEntriesResponse()
            pb_resp = translation_service.ListGlossaryEntriesResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_glossary_entries(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_glossary_entries_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = (
                        translation_service.ListGlossaryEntriesResponse.to_json(
                            response
                        )
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.list_glossary_entries",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListGlossaryEntries",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListModels(
        _BaseTranslationServiceRestTransport._BaseListModels, TranslationServiceRestStub
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.ListModels")

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
            request: automl_translation.ListModelsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> automl_translation.ListModelsResponse:
            r"""Call the list models method over HTTP.

            Args:
                request (~.automl_translation.ListModelsRequest):
                    The request object. Request message for ListModels.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.automl_translation.ListModelsResponse:
                    Response message for ListModels.
            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseListModels._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_models(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseListModels._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseListModels._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ListModels",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListModels",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._ListModels._get_response(
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
            resp = automl_translation.ListModelsResponse()
            pb_resp = automl_translation.ListModelsResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_models(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_models_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = automl_translation.ListModelsResponse.to_json(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.list_models",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "ListModels",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _RomanizeText(
        _BaseTranslationServiceRestTransport._BaseRomanizeText,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.RomanizeText")

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
            request: translation_service.RomanizeTextRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> translation_service.RomanizeTextResponse:
            r"""Call the romanize text method over HTTP.

            Args:
                request (~.translation_service.RomanizeTextRequest):
                    The request object. The request message for synchronous
                romanization.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.translation_service.RomanizeTextResponse:
                    The response message for synchronous
                romanization.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseRomanizeText._get_http_options()
            )

            request, metadata = self._interceptor.pre_romanize_text(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseRomanizeText._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseRomanizeText._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseRomanizeText._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.RomanizeText",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "RomanizeText",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._RomanizeText._get_response(
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
            resp = translation_service.RomanizeTextResponse()
            pb_resp = translation_service.RomanizeTextResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_romanize_text(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_romanize_text_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = translation_service.RomanizeTextResponse.to_json(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.romanize_text",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "RomanizeText",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.TranslateDocument",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.translate_document",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.TranslateText",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.translate_text",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "TranslateText",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _UpdateGlossary(
        _BaseTranslationServiceRestTransport._BaseUpdateGlossary,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.UpdateGlossary")

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
            request: translation_service.UpdateGlossaryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the update glossary method over HTTP.

            Args:
                request (~.translation_service.UpdateGlossaryRequest):
                    The request object. Request message for the update
                glossary flow
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
                _BaseTranslationServiceRestTransport._BaseUpdateGlossary._get_http_options()
            )

            request, metadata = self._interceptor.pre_update_glossary(request, metadata)
            transcoded_request = _BaseTranslationServiceRestTransport._BaseUpdateGlossary._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseUpdateGlossary._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseUpdateGlossary._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.UpdateGlossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "UpdateGlossary",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = TranslationServiceRestTransport._UpdateGlossary._get_response(
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

            resp = self._interceptor.post_update_glossary(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_update_glossary_with_metadata(
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
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.update_glossary",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "UpdateGlossary",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _UpdateGlossaryEntry(
        _BaseTranslationServiceRestTransport._BaseUpdateGlossaryEntry,
        TranslationServiceRestStub,
    ):
        def __hash__(self):
            return hash("TranslationServiceRestTransport.UpdateGlossaryEntry")

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
            request: translation_service.UpdateGlossaryEntryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> common.GlossaryEntry:
            r"""Call the update glossary entry method over HTTP.

            Args:
                request (~.translation_service.UpdateGlossaryEntryRequest):
                    The request object. Request message for
                UpdateGlossaryEntry
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.common.GlossaryEntry:
                    Represents a single entry in a
                glossary.

            """

            http_options = (
                _BaseTranslationServiceRestTransport._BaseUpdateGlossaryEntry._get_http_options()
            )

            request, metadata = self._interceptor.pre_update_glossary_entry(
                request, metadata
            )
            transcoded_request = _BaseTranslationServiceRestTransport._BaseUpdateGlossaryEntry._get_transcoded_request(
                http_options, request
            )

            body = _BaseTranslationServiceRestTransport._BaseUpdateGlossaryEntry._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseTranslationServiceRestTransport._BaseUpdateGlossaryEntry._get_query_params_json(
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.UpdateGlossaryEntry",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "UpdateGlossaryEntry",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                TranslationServiceRestTransport._UpdateGlossaryEntry._get_response(
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
            resp = common.GlossaryEntry()
            pb_resp = common.GlossaryEntry.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_update_glossary_entry(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_update_glossary_entry_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = common.GlossaryEntry.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.translation_v3.TranslationServiceClient.update_glossary_entry",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
                        "rpcName": "UpdateGlossaryEntry",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    @property
    def adaptive_mt_translate(
        self,
    ) -> Callable[
        [adaptive_mt.AdaptiveMtTranslateRequest],
        adaptive_mt.AdaptiveMtTranslateResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._AdaptiveMtTranslate(self._session, self._host, self._interceptor)  # type: ignore

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
    def create_adaptive_mt_dataset(
        self,
    ) -> Callable[
        [adaptive_mt.CreateAdaptiveMtDatasetRequest], adaptive_mt.AdaptiveMtDataset
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateAdaptiveMtDataset(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_dataset(
        self,
    ) -> Callable[[automl_translation.CreateDatasetRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateDataset(self._session, self._host, self._interceptor)  # type: ignore

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
    def create_glossary_entry(
        self,
    ) -> Callable[
        [translation_service.CreateGlossaryEntryRequest], common.GlossaryEntry
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateGlossaryEntry(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_model(
        self,
    ) -> Callable[[automl_translation.CreateModelRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateModel(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_adaptive_mt_dataset(
        self,
    ) -> Callable[[adaptive_mt.DeleteAdaptiveMtDatasetRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteAdaptiveMtDataset(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_adaptive_mt_file(
        self,
    ) -> Callable[[adaptive_mt.DeleteAdaptiveMtFileRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteAdaptiveMtFile(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_dataset(
        self,
    ) -> Callable[[automl_translation.DeleteDatasetRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteDataset(self._session, self._host, self._interceptor)  # type: ignore

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
    def delete_glossary_entry(
        self,
    ) -> Callable[[translation_service.DeleteGlossaryEntryRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteGlossaryEntry(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_model(
        self,
    ) -> Callable[[automl_translation.DeleteModelRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteModel(self._session, self._host, self._interceptor)  # type: ignore

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
    def export_data(
        self,
    ) -> Callable[[automl_translation.ExportDataRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ExportData(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_adaptive_mt_dataset(
        self,
    ) -> Callable[
        [adaptive_mt.GetAdaptiveMtDatasetRequest], adaptive_mt.AdaptiveMtDataset
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetAdaptiveMtDataset(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_adaptive_mt_file(
        self,
    ) -> Callable[[adaptive_mt.GetAdaptiveMtFileRequest], adaptive_mt.AdaptiveMtFile]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetAdaptiveMtFile(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_dataset(
        self,
    ) -> Callable[[automl_translation.GetDatasetRequest], automl_translation.Dataset]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetDataset(self._session, self._host, self._interceptor)  # type: ignore

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
    def get_glossary_entry(
        self,
    ) -> Callable[[translation_service.GetGlossaryEntryRequest], common.GlossaryEntry]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetGlossaryEntry(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_model(
        self,
    ) -> Callable[[automl_translation.GetModelRequest], automl_translation.Model]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetModel(self._session, self._host, self._interceptor)  # type: ignore

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
    def import_adaptive_mt_file(
        self,
    ) -> Callable[
        [adaptive_mt.ImportAdaptiveMtFileRequest],
        adaptive_mt.ImportAdaptiveMtFileResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ImportAdaptiveMtFile(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def import_data(
        self,
    ) -> Callable[[automl_translation.ImportDataRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ImportData(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_adaptive_mt_datasets(
        self,
    ) -> Callable[
        [adaptive_mt.ListAdaptiveMtDatasetsRequest],
        adaptive_mt.ListAdaptiveMtDatasetsResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListAdaptiveMtDatasets(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_adaptive_mt_files(
        self,
    ) -> Callable[
        [adaptive_mt.ListAdaptiveMtFilesRequest],
        adaptive_mt.ListAdaptiveMtFilesResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListAdaptiveMtFiles(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_adaptive_mt_sentences(
        self,
    ) -> Callable[
        [adaptive_mt.ListAdaptiveMtSentencesRequest],
        adaptive_mt.ListAdaptiveMtSentencesResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListAdaptiveMtSentences(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_datasets(
        self,
    ) -> Callable[
        [automl_translation.ListDatasetsRequest],
        automl_translation.ListDatasetsResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListDatasets(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_examples(
        self,
    ) -> Callable[
        [automl_translation.ListExamplesRequest],
        automl_translation.ListExamplesResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListExamples(self._session, self._host, self._interceptor)  # type: ignore

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
    def list_glossary_entries(
        self,
    ) -> Callable[
        [translation_service.ListGlossaryEntriesRequest],
        translation_service.ListGlossaryEntriesResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListGlossaryEntries(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_models(
        self,
    ) -> Callable[
        [automl_translation.ListModelsRequest], automl_translation.ListModelsResponse
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListModels(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def romanize_text(
        self,
    ) -> Callable[
        [translation_service.RomanizeTextRequest],
        translation_service.RomanizeTextResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._RomanizeText(self._session, self._host, self._interceptor)  # type: ignore

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
    def update_glossary(
        self,
    ) -> Callable[
        [translation_service.UpdateGlossaryRequest], operations_pb2.Operation
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._UpdateGlossary(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def update_glossary_entry(
        self,
    ) -> Callable[
        [translation_service.UpdateGlossaryEntryRequest], common.GlossaryEntry
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._UpdateGlossaryEntry(self._session, self._host, self._interceptor)  # type: ignore

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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.GetLocation",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceAsyncClient.GetLocation",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ListLocations",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceAsyncClient.ListLocations",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.CancelOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.DeleteOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.GetOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceAsyncClient.GetOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.ListOperations",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceAsyncClient.ListOperations",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    f"Sending request for google.cloud.translation_v3.TranslationServiceClient.WaitOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
                    "Received response for google.cloud.translation_v3.TranslationServiceAsyncClient.WaitOperation",
                    extra={
                        "serviceName": "google.cloud.translation.v3.TranslationService",
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
