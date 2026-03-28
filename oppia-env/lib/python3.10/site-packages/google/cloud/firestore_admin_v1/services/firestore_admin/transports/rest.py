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
import logging
import json  # type: ignore

from google.auth.transport.requests import AuthorizedSession  # type: ignore
from google.auth import credentials as ga_credentials  # type: ignore
from google.api_core import exceptions as core_exceptions
from google.api_core import retry as retries
from google.api_core import rest_helpers
from google.api_core import rest_streaming
from google.api_core import gapic_v1
import google.protobuf

from google.protobuf import json_format
from google.api_core import operations_v1
from google.cloud.location import locations_pb2  # type: ignore

from requests import __version__ as requests_version
import dataclasses
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple, Union
import warnings


from google.cloud.firestore_admin_v1.types import backup
from google.cloud.firestore_admin_v1.types import database
from google.cloud.firestore_admin_v1.types import field
from google.cloud.firestore_admin_v1.types import firestore_admin
from google.cloud.firestore_admin_v1.types import index
from google.cloud.firestore_admin_v1.types import schedule
from google.cloud.firestore_admin_v1.types import user_creds
from google.cloud.firestore_admin_v1.types import user_creds as gfa_user_creds
from google.protobuf import empty_pb2  # type: ignore
from google.longrunning import operations_pb2  # type: ignore


from .rest_base import _BaseFirestoreAdminRestTransport
from .base import DEFAULT_CLIENT_INFO as BASE_DEFAULT_CLIENT_INFO

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


class FirestoreAdminRestInterceptor:
    """Interceptor for FirestoreAdmin.

    Interceptors are used to manipulate requests, request metadata, and responses
    in arbitrary ways.
    Example use cases include:
    * Logging
    * Verifying requests according to service or custom semantics
    * Stripping extraneous information from responses

    These use cases and more can be enabled by injecting an
    instance of a custom subclass when constructing the FirestoreAdminRestTransport.

    .. code-block:: python
        class MyCustomFirestoreAdminInterceptor(FirestoreAdminRestInterceptor):
            def pre_bulk_delete_documents(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_bulk_delete_documents(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_backup_schedule(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_backup_schedule(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_database(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_database(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_index(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_index(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_user_creds(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_user_creds(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_delete_backup(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_delete_backup_schedule(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_delete_database(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_delete_database(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_delete_index(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_delete_user_creds(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_disable_user_creds(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_disable_user_creds(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_enable_user_creds(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_enable_user_creds(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_export_documents(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_export_documents(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_backup(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_backup(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_backup_schedule(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_backup_schedule(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_database(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_database(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_field(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_field(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_index(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_index(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_user_creds(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_user_creds(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_import_documents(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_import_documents(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_backups(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_backups(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_backup_schedules(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_backup_schedules(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_databases(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_databases(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_fields(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_fields(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_indexes(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_indexes(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_user_creds(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_user_creds(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_reset_user_password(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_reset_user_password(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_restore_database(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_restore_database(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_update_backup_schedule(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_update_backup_schedule(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_update_database(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_update_database(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_update_field(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_update_field(self, response):
                logging.log(f"Received response: {response}")
                return response

        transport = FirestoreAdminRestTransport(interceptor=MyCustomFirestoreAdminInterceptor())
        client = FirestoreAdminClient(transport=transport)


    """

    def pre_bulk_delete_documents(
        self,
        request: firestore_admin.BulkDeleteDocumentsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.BulkDeleteDocumentsRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for bulk_delete_documents

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_bulk_delete_documents(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for bulk_delete_documents

        DEPRECATED. Please use the `post_bulk_delete_documents_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_bulk_delete_documents` interceptor runs
        before the `post_bulk_delete_documents_with_metadata` interceptor.
        """
        return response

    def post_bulk_delete_documents_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for bulk_delete_documents

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_bulk_delete_documents_with_metadata`
        interceptor in new development instead of the `post_bulk_delete_documents` interceptor.
        When both interceptors are used, this `post_bulk_delete_documents_with_metadata` interceptor runs after the
        `post_bulk_delete_documents` interceptor. The (possibly modified) response returned by
        `post_bulk_delete_documents` will be passed to
        `post_bulk_delete_documents_with_metadata`.
        """
        return response, metadata

    def pre_create_backup_schedule(
        self,
        request: firestore_admin.CreateBackupScheduleRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.CreateBackupScheduleRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for create_backup_schedule

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_create_backup_schedule(
        self, response: schedule.BackupSchedule
    ) -> schedule.BackupSchedule:
        """Post-rpc interceptor for create_backup_schedule

        DEPRECATED. Please use the `post_create_backup_schedule_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_create_backup_schedule` interceptor runs
        before the `post_create_backup_schedule_with_metadata` interceptor.
        """
        return response

    def post_create_backup_schedule_with_metadata(
        self,
        response: schedule.BackupSchedule,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[schedule.BackupSchedule, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_backup_schedule

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_create_backup_schedule_with_metadata`
        interceptor in new development instead of the `post_create_backup_schedule` interceptor.
        When both interceptors are used, this `post_create_backup_schedule_with_metadata` interceptor runs after the
        `post_create_backup_schedule` interceptor. The (possibly modified) response returned by
        `post_create_backup_schedule` will be passed to
        `post_create_backup_schedule_with_metadata`.
        """
        return response, metadata

    def pre_create_database(
        self,
        request: firestore_admin.CreateDatabaseRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.CreateDatabaseRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for create_database

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_create_database(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for create_database

        DEPRECATED. Please use the `post_create_database_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_create_database` interceptor runs
        before the `post_create_database_with_metadata` interceptor.
        """
        return response

    def post_create_database_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_database

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_create_database_with_metadata`
        interceptor in new development instead of the `post_create_database` interceptor.
        When both interceptors are used, this `post_create_database_with_metadata` interceptor runs after the
        `post_create_database` interceptor. The (possibly modified) response returned by
        `post_create_database` will be passed to
        `post_create_database_with_metadata`.
        """
        return response, metadata

    def pre_create_index(
        self,
        request: firestore_admin.CreateIndexRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.CreateIndexRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for create_index

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_create_index(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for create_index

        DEPRECATED. Please use the `post_create_index_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_create_index` interceptor runs
        before the `post_create_index_with_metadata` interceptor.
        """
        return response

    def post_create_index_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_index

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_create_index_with_metadata`
        interceptor in new development instead of the `post_create_index` interceptor.
        When both interceptors are used, this `post_create_index_with_metadata` interceptor runs after the
        `post_create_index` interceptor. The (possibly modified) response returned by
        `post_create_index` will be passed to
        `post_create_index_with_metadata`.
        """
        return response, metadata

    def pre_create_user_creds(
        self,
        request: firestore_admin.CreateUserCredsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.CreateUserCredsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for create_user_creds

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_create_user_creds(
        self, response: gfa_user_creds.UserCreds
    ) -> gfa_user_creds.UserCreds:
        """Post-rpc interceptor for create_user_creds

        DEPRECATED. Please use the `post_create_user_creds_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_create_user_creds` interceptor runs
        before the `post_create_user_creds_with_metadata` interceptor.
        """
        return response

    def post_create_user_creds_with_metadata(
        self,
        response: gfa_user_creds.UserCreds,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[gfa_user_creds.UserCreds, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_user_creds

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_create_user_creds_with_metadata`
        interceptor in new development instead of the `post_create_user_creds` interceptor.
        When both interceptors are used, this `post_create_user_creds_with_metadata` interceptor runs after the
        `post_create_user_creds` interceptor. The (possibly modified) response returned by
        `post_create_user_creds` will be passed to
        `post_create_user_creds_with_metadata`.
        """
        return response, metadata

    def pre_delete_backup(
        self,
        request: firestore_admin.DeleteBackupRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.DeleteBackupRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for delete_backup

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def pre_delete_backup_schedule(
        self,
        request: firestore_admin.DeleteBackupScheduleRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.DeleteBackupScheduleRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for delete_backup_schedule

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def pre_delete_database(
        self,
        request: firestore_admin.DeleteDatabaseRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.DeleteDatabaseRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for delete_database

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_delete_database(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for delete_database

        DEPRECATED. Please use the `post_delete_database_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_delete_database` interceptor runs
        before the `post_delete_database_with_metadata` interceptor.
        """
        return response

    def post_delete_database_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for delete_database

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_delete_database_with_metadata`
        interceptor in new development instead of the `post_delete_database` interceptor.
        When both interceptors are used, this `post_delete_database_with_metadata` interceptor runs after the
        `post_delete_database` interceptor. The (possibly modified) response returned by
        `post_delete_database` will be passed to
        `post_delete_database_with_metadata`.
        """
        return response, metadata

    def pre_delete_index(
        self,
        request: firestore_admin.DeleteIndexRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.DeleteIndexRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for delete_index

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def pre_delete_user_creds(
        self,
        request: firestore_admin.DeleteUserCredsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.DeleteUserCredsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for delete_user_creds

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def pre_disable_user_creds(
        self,
        request: firestore_admin.DisableUserCredsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.DisableUserCredsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for disable_user_creds

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_disable_user_creds(
        self, response: user_creds.UserCreds
    ) -> user_creds.UserCreds:
        """Post-rpc interceptor for disable_user_creds

        DEPRECATED. Please use the `post_disable_user_creds_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_disable_user_creds` interceptor runs
        before the `post_disable_user_creds_with_metadata` interceptor.
        """
        return response

    def post_disable_user_creds_with_metadata(
        self,
        response: user_creds.UserCreds,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[user_creds.UserCreds, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for disable_user_creds

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_disable_user_creds_with_metadata`
        interceptor in new development instead of the `post_disable_user_creds` interceptor.
        When both interceptors are used, this `post_disable_user_creds_with_metadata` interceptor runs after the
        `post_disable_user_creds` interceptor. The (possibly modified) response returned by
        `post_disable_user_creds` will be passed to
        `post_disable_user_creds_with_metadata`.
        """
        return response, metadata

    def pre_enable_user_creds(
        self,
        request: firestore_admin.EnableUserCredsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.EnableUserCredsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for enable_user_creds

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_enable_user_creds(
        self, response: user_creds.UserCreds
    ) -> user_creds.UserCreds:
        """Post-rpc interceptor for enable_user_creds

        DEPRECATED. Please use the `post_enable_user_creds_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_enable_user_creds` interceptor runs
        before the `post_enable_user_creds_with_metadata` interceptor.
        """
        return response

    def post_enable_user_creds_with_metadata(
        self,
        response: user_creds.UserCreds,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[user_creds.UserCreds, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for enable_user_creds

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_enable_user_creds_with_metadata`
        interceptor in new development instead of the `post_enable_user_creds` interceptor.
        When both interceptors are used, this `post_enable_user_creds_with_metadata` interceptor runs after the
        `post_enable_user_creds` interceptor. The (possibly modified) response returned by
        `post_enable_user_creds` will be passed to
        `post_enable_user_creds_with_metadata`.
        """
        return response, metadata

    def pre_export_documents(
        self,
        request: firestore_admin.ExportDocumentsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ExportDocumentsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for export_documents

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_export_documents(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for export_documents

        DEPRECATED. Please use the `post_export_documents_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_export_documents` interceptor runs
        before the `post_export_documents_with_metadata` interceptor.
        """
        return response

    def post_export_documents_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for export_documents

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_export_documents_with_metadata`
        interceptor in new development instead of the `post_export_documents` interceptor.
        When both interceptors are used, this `post_export_documents_with_metadata` interceptor runs after the
        `post_export_documents` interceptor. The (possibly modified) response returned by
        `post_export_documents` will be passed to
        `post_export_documents_with_metadata`.
        """
        return response, metadata

    def pre_get_backup(
        self,
        request: firestore_admin.GetBackupRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.GetBackupRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_backup

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_get_backup(self, response: backup.Backup) -> backup.Backup:
        """Post-rpc interceptor for get_backup

        DEPRECATED. Please use the `post_get_backup_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_get_backup` interceptor runs
        before the `post_get_backup_with_metadata` interceptor.
        """
        return response

    def post_get_backup_with_metadata(
        self, response: backup.Backup, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[backup.Backup, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_backup

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_get_backup_with_metadata`
        interceptor in new development instead of the `post_get_backup` interceptor.
        When both interceptors are used, this `post_get_backup_with_metadata` interceptor runs after the
        `post_get_backup` interceptor. The (possibly modified) response returned by
        `post_get_backup` will be passed to
        `post_get_backup_with_metadata`.
        """
        return response, metadata

    def pre_get_backup_schedule(
        self,
        request: firestore_admin.GetBackupScheduleRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.GetBackupScheduleRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for get_backup_schedule

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_get_backup_schedule(
        self, response: schedule.BackupSchedule
    ) -> schedule.BackupSchedule:
        """Post-rpc interceptor for get_backup_schedule

        DEPRECATED. Please use the `post_get_backup_schedule_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_get_backup_schedule` interceptor runs
        before the `post_get_backup_schedule_with_metadata` interceptor.
        """
        return response

    def post_get_backup_schedule_with_metadata(
        self,
        response: schedule.BackupSchedule,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[schedule.BackupSchedule, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_backup_schedule

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_get_backup_schedule_with_metadata`
        interceptor in new development instead of the `post_get_backup_schedule` interceptor.
        When both interceptors are used, this `post_get_backup_schedule_with_metadata` interceptor runs after the
        `post_get_backup_schedule` interceptor. The (possibly modified) response returned by
        `post_get_backup_schedule` will be passed to
        `post_get_backup_schedule_with_metadata`.
        """
        return response, metadata

    def pre_get_database(
        self,
        request: firestore_admin.GetDatabaseRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.GetDatabaseRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_database

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_get_database(self, response: database.Database) -> database.Database:
        """Post-rpc interceptor for get_database

        DEPRECATED. Please use the `post_get_database_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_get_database` interceptor runs
        before the `post_get_database_with_metadata` interceptor.
        """
        return response

    def post_get_database_with_metadata(
        self,
        response: database.Database,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[database.Database, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_database

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_get_database_with_metadata`
        interceptor in new development instead of the `post_get_database` interceptor.
        When both interceptors are used, this `post_get_database_with_metadata` interceptor runs after the
        `post_get_database` interceptor. The (possibly modified) response returned by
        `post_get_database` will be passed to
        `post_get_database_with_metadata`.
        """
        return response, metadata

    def pre_get_field(
        self,
        request: firestore_admin.GetFieldRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.GetFieldRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_field

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_get_field(self, response: field.Field) -> field.Field:
        """Post-rpc interceptor for get_field

        DEPRECATED. Please use the `post_get_field_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_get_field` interceptor runs
        before the `post_get_field_with_metadata` interceptor.
        """
        return response

    def post_get_field_with_metadata(
        self, response: field.Field, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[field.Field, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_field

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_get_field_with_metadata`
        interceptor in new development instead of the `post_get_field` interceptor.
        When both interceptors are used, this `post_get_field_with_metadata` interceptor runs after the
        `post_get_field` interceptor. The (possibly modified) response returned by
        `post_get_field` will be passed to
        `post_get_field_with_metadata`.
        """
        return response, metadata

    def pre_get_index(
        self,
        request: firestore_admin.GetIndexRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.GetIndexRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_index

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_get_index(self, response: index.Index) -> index.Index:
        """Post-rpc interceptor for get_index

        DEPRECATED. Please use the `post_get_index_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_get_index` interceptor runs
        before the `post_get_index_with_metadata` interceptor.
        """
        return response

    def post_get_index_with_metadata(
        self, response: index.Index, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[index.Index, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_index

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_get_index_with_metadata`
        interceptor in new development instead of the `post_get_index` interceptor.
        When both interceptors are used, this `post_get_index_with_metadata` interceptor runs after the
        `post_get_index` interceptor. The (possibly modified) response returned by
        `post_get_index` will be passed to
        `post_get_index_with_metadata`.
        """
        return response, metadata

    def pre_get_user_creds(
        self,
        request: firestore_admin.GetUserCredsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.GetUserCredsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_user_creds

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_get_user_creds(
        self, response: user_creds.UserCreds
    ) -> user_creds.UserCreds:
        """Post-rpc interceptor for get_user_creds

        DEPRECATED. Please use the `post_get_user_creds_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_get_user_creds` interceptor runs
        before the `post_get_user_creds_with_metadata` interceptor.
        """
        return response

    def post_get_user_creds_with_metadata(
        self,
        response: user_creds.UserCreds,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[user_creds.UserCreds, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_user_creds

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_get_user_creds_with_metadata`
        interceptor in new development instead of the `post_get_user_creds` interceptor.
        When both interceptors are used, this `post_get_user_creds_with_metadata` interceptor runs after the
        `post_get_user_creds` interceptor. The (possibly modified) response returned by
        `post_get_user_creds` will be passed to
        `post_get_user_creds_with_metadata`.
        """
        return response, metadata

    def pre_import_documents(
        self,
        request: firestore_admin.ImportDocumentsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ImportDocumentsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for import_documents

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_import_documents(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for import_documents

        DEPRECATED. Please use the `post_import_documents_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_import_documents` interceptor runs
        before the `post_import_documents_with_metadata` interceptor.
        """
        return response

    def post_import_documents_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for import_documents

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_import_documents_with_metadata`
        interceptor in new development instead of the `post_import_documents` interceptor.
        When both interceptors are used, this `post_import_documents_with_metadata` interceptor runs after the
        `post_import_documents` interceptor. The (possibly modified) response returned by
        `post_import_documents` will be passed to
        `post_import_documents_with_metadata`.
        """
        return response, metadata

    def pre_list_backups(
        self,
        request: firestore_admin.ListBackupsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListBackupsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_backups

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_list_backups(
        self, response: firestore_admin.ListBackupsResponse
    ) -> firestore_admin.ListBackupsResponse:
        """Post-rpc interceptor for list_backups

        DEPRECATED. Please use the `post_list_backups_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_list_backups` interceptor runs
        before the `post_list_backups_with_metadata` interceptor.
        """
        return response

    def post_list_backups_with_metadata(
        self,
        response: firestore_admin.ListBackupsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListBackupsResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_backups

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_list_backups_with_metadata`
        interceptor in new development instead of the `post_list_backups` interceptor.
        When both interceptors are used, this `post_list_backups_with_metadata` interceptor runs after the
        `post_list_backups` interceptor. The (possibly modified) response returned by
        `post_list_backups` will be passed to
        `post_list_backups_with_metadata`.
        """
        return response, metadata

    def pre_list_backup_schedules(
        self,
        request: firestore_admin.ListBackupSchedulesRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListBackupSchedulesRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for list_backup_schedules

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_list_backup_schedules(
        self, response: firestore_admin.ListBackupSchedulesResponse
    ) -> firestore_admin.ListBackupSchedulesResponse:
        """Post-rpc interceptor for list_backup_schedules

        DEPRECATED. Please use the `post_list_backup_schedules_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_list_backup_schedules` interceptor runs
        before the `post_list_backup_schedules_with_metadata` interceptor.
        """
        return response

    def post_list_backup_schedules_with_metadata(
        self,
        response: firestore_admin.ListBackupSchedulesResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListBackupSchedulesResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for list_backup_schedules

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_list_backup_schedules_with_metadata`
        interceptor in new development instead of the `post_list_backup_schedules` interceptor.
        When both interceptors are used, this `post_list_backup_schedules_with_metadata` interceptor runs after the
        `post_list_backup_schedules` interceptor. The (possibly modified) response returned by
        `post_list_backup_schedules` will be passed to
        `post_list_backup_schedules_with_metadata`.
        """
        return response, metadata

    def pre_list_databases(
        self,
        request: firestore_admin.ListDatabasesRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListDatabasesRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_databases

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_list_databases(
        self, response: firestore_admin.ListDatabasesResponse
    ) -> firestore_admin.ListDatabasesResponse:
        """Post-rpc interceptor for list_databases

        DEPRECATED. Please use the `post_list_databases_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_list_databases` interceptor runs
        before the `post_list_databases_with_metadata` interceptor.
        """
        return response

    def post_list_databases_with_metadata(
        self,
        response: firestore_admin.ListDatabasesResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListDatabasesResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_databases

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_list_databases_with_metadata`
        interceptor in new development instead of the `post_list_databases` interceptor.
        When both interceptors are used, this `post_list_databases_with_metadata` interceptor runs after the
        `post_list_databases` interceptor. The (possibly modified) response returned by
        `post_list_databases` will be passed to
        `post_list_databases_with_metadata`.
        """
        return response, metadata

    def pre_list_fields(
        self,
        request: firestore_admin.ListFieldsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListFieldsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_fields

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_list_fields(
        self, response: firestore_admin.ListFieldsResponse
    ) -> firestore_admin.ListFieldsResponse:
        """Post-rpc interceptor for list_fields

        DEPRECATED. Please use the `post_list_fields_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_list_fields` interceptor runs
        before the `post_list_fields_with_metadata` interceptor.
        """
        return response

    def post_list_fields_with_metadata(
        self,
        response: firestore_admin.ListFieldsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListFieldsResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_fields

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_list_fields_with_metadata`
        interceptor in new development instead of the `post_list_fields` interceptor.
        When both interceptors are used, this `post_list_fields_with_metadata` interceptor runs after the
        `post_list_fields` interceptor. The (possibly modified) response returned by
        `post_list_fields` will be passed to
        `post_list_fields_with_metadata`.
        """
        return response, metadata

    def pre_list_indexes(
        self,
        request: firestore_admin.ListIndexesRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListIndexesRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_indexes

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_list_indexes(
        self, response: firestore_admin.ListIndexesResponse
    ) -> firestore_admin.ListIndexesResponse:
        """Post-rpc interceptor for list_indexes

        DEPRECATED. Please use the `post_list_indexes_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_list_indexes` interceptor runs
        before the `post_list_indexes_with_metadata` interceptor.
        """
        return response

    def post_list_indexes_with_metadata(
        self,
        response: firestore_admin.ListIndexesResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListIndexesResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_indexes

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_list_indexes_with_metadata`
        interceptor in new development instead of the `post_list_indexes` interceptor.
        When both interceptors are used, this `post_list_indexes_with_metadata` interceptor runs after the
        `post_list_indexes` interceptor. The (possibly modified) response returned by
        `post_list_indexes` will be passed to
        `post_list_indexes_with_metadata`.
        """
        return response, metadata

    def pre_list_user_creds(
        self,
        request: firestore_admin.ListUserCredsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListUserCredsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_user_creds

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_list_user_creds(
        self, response: firestore_admin.ListUserCredsResponse
    ) -> firestore_admin.ListUserCredsResponse:
        """Post-rpc interceptor for list_user_creds

        DEPRECATED. Please use the `post_list_user_creds_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_list_user_creds` interceptor runs
        before the `post_list_user_creds_with_metadata` interceptor.
        """
        return response

    def post_list_user_creds_with_metadata(
        self,
        response: firestore_admin.ListUserCredsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ListUserCredsResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_user_creds

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_list_user_creds_with_metadata`
        interceptor in new development instead of the `post_list_user_creds` interceptor.
        When both interceptors are used, this `post_list_user_creds_with_metadata` interceptor runs after the
        `post_list_user_creds` interceptor. The (possibly modified) response returned by
        `post_list_user_creds` will be passed to
        `post_list_user_creds_with_metadata`.
        """
        return response, metadata

    def pre_reset_user_password(
        self,
        request: firestore_admin.ResetUserPasswordRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.ResetUserPasswordRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for reset_user_password

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_reset_user_password(
        self, response: user_creds.UserCreds
    ) -> user_creds.UserCreds:
        """Post-rpc interceptor for reset_user_password

        DEPRECATED. Please use the `post_reset_user_password_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_reset_user_password` interceptor runs
        before the `post_reset_user_password_with_metadata` interceptor.
        """
        return response

    def post_reset_user_password_with_metadata(
        self,
        response: user_creds.UserCreds,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[user_creds.UserCreds, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for reset_user_password

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_reset_user_password_with_metadata`
        interceptor in new development instead of the `post_reset_user_password` interceptor.
        When both interceptors are used, this `post_reset_user_password_with_metadata` interceptor runs after the
        `post_reset_user_password` interceptor. The (possibly modified) response returned by
        `post_reset_user_password` will be passed to
        `post_reset_user_password_with_metadata`.
        """
        return response, metadata

    def pre_restore_database(
        self,
        request: firestore_admin.RestoreDatabaseRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.RestoreDatabaseRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for restore_database

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_restore_database(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for restore_database

        DEPRECATED. Please use the `post_restore_database_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_restore_database` interceptor runs
        before the `post_restore_database_with_metadata` interceptor.
        """
        return response

    def post_restore_database_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for restore_database

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_restore_database_with_metadata`
        interceptor in new development instead of the `post_restore_database` interceptor.
        When both interceptors are used, this `post_restore_database_with_metadata` interceptor runs after the
        `post_restore_database` interceptor. The (possibly modified) response returned by
        `post_restore_database` will be passed to
        `post_restore_database_with_metadata`.
        """
        return response, metadata

    def pre_update_backup_schedule(
        self,
        request: firestore_admin.UpdateBackupScheduleRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.UpdateBackupScheduleRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for update_backup_schedule

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_update_backup_schedule(
        self, response: schedule.BackupSchedule
    ) -> schedule.BackupSchedule:
        """Post-rpc interceptor for update_backup_schedule

        DEPRECATED. Please use the `post_update_backup_schedule_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_update_backup_schedule` interceptor runs
        before the `post_update_backup_schedule_with_metadata` interceptor.
        """
        return response

    def post_update_backup_schedule_with_metadata(
        self,
        response: schedule.BackupSchedule,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[schedule.BackupSchedule, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for update_backup_schedule

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_update_backup_schedule_with_metadata`
        interceptor in new development instead of the `post_update_backup_schedule` interceptor.
        When both interceptors are used, this `post_update_backup_schedule_with_metadata` interceptor runs after the
        `post_update_backup_schedule` interceptor. The (possibly modified) response returned by
        `post_update_backup_schedule` will be passed to
        `post_update_backup_schedule_with_metadata`.
        """
        return response, metadata

    def pre_update_database(
        self,
        request: firestore_admin.UpdateDatabaseRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.UpdateDatabaseRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for update_database

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_update_database(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for update_database

        DEPRECATED. Please use the `post_update_database_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_update_database` interceptor runs
        before the `post_update_database_with_metadata` interceptor.
        """
        return response

    def post_update_database_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for update_database

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_update_database_with_metadata`
        interceptor in new development instead of the `post_update_database` interceptor.
        When both interceptors are used, this `post_update_database_with_metadata` interceptor runs after the
        `post_update_database` interceptor. The (possibly modified) response returned by
        `post_update_database` will be passed to
        `post_update_database_with_metadata`.
        """
        return response, metadata

    def pre_update_field(
        self,
        request: firestore_admin.UpdateFieldRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore_admin.UpdateFieldRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for update_field

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_update_field(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for update_field

        DEPRECATED. Please use the `post_update_field_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code. This `post_update_field` interceptor runs
        before the `post_update_field_with_metadata` interceptor.
        """
        return response

    def post_update_field_with_metadata(
        self,
        response: operations_pb2.Operation,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[operations_pb2.Operation, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for update_field

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the FirestoreAdmin server but before it is returned to user code.

        We recommend only using this `post_update_field_with_metadata`
        interceptor in new development instead of the `post_update_field` interceptor.
        When both interceptors are used, this `post_update_field_with_metadata` interceptor runs after the
        `post_update_field` interceptor. The (possibly modified) response returned by
        `post_update_field` will be passed to
        `post_update_field_with_metadata`.
        """
        return response, metadata

    def pre_cancel_operation(
        self,
        request: operations_pb2.CancelOperationRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        operations_pb2.CancelOperationRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for cancel_operation

        Override in a subclass to manipulate the request or metadata
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_cancel_operation(self, response: None) -> None:
        """Post-rpc interceptor for cancel_operation

        Override in a subclass to manipulate the response
        after it is returned by the FirestoreAdmin server but before
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
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_delete_operation(self, response: None) -> None:
        """Post-rpc interceptor for delete_operation

        Override in a subclass to manipulate the response
        after it is returned by the FirestoreAdmin server but before
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
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_get_operation(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for get_operation

        Override in a subclass to manipulate the response
        after it is returned by the FirestoreAdmin server but before
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
        before they are sent to the FirestoreAdmin server.
        """
        return request, metadata

    def post_list_operations(
        self, response: operations_pb2.ListOperationsResponse
    ) -> operations_pb2.ListOperationsResponse:
        """Post-rpc interceptor for list_operations

        Override in a subclass to manipulate the response
        after it is returned by the FirestoreAdmin server but before
        it is returned to user code.
        """
        return response


@dataclasses.dataclass
class FirestoreAdminRestStub:
    _session: AuthorizedSession
    _host: str
    _interceptor: FirestoreAdminRestInterceptor


class FirestoreAdminRestTransport(_BaseFirestoreAdminRestTransport):
    """REST backend synchronous transport for FirestoreAdmin.

    The Cloud Firestore Admin API.

    This API provides several administrative services for Cloud
    Firestore.

    Project, Database, Namespace, Collection, Collection Group, and
    Document are used as defined in the Google Cloud Firestore API.

    Operation: An Operation represents work being performed in the
    background.

    The index service manages Cloud Firestore indexes.

    Index creation is performed asynchronously. An Operation resource is
    created for each such asynchronous operation. The state of the
    operation (including any errors encountered) may be queried via the
    Operation resource.

    The Operations collection provides a record of actions performed for
    the specified Project (including any Operations in progress).
    Operations are not created directly but through calls on other
    collections or resources.

    An Operation that is done may be deleted so that it is no longer
    listed as part of the Operation collection. Operations are garbage
    collected after 30 days. By default, ListOperations will only return
    in progress and failed operations. To list completed operation,
    issue a ListOperations request with the filter ``done: true``.

    Operations are created by service ``FirestoreAdmin``, but are
    accessed via service ``google.longrunning.Operations``.

    This class defines the same methods as the primary client, so the
    primary client can load the underlying transport implementation
    and call it.

    It sends JSON representations of protocol buffers over HTTP/1.1
    """

    def __init__(
        self,
        *,
        host: str = "firestore.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        client_cert_source_for_mtls: Optional[Callable[[], Tuple[bytes, bytes]]] = None,
        quota_project_id: Optional[str] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
        always_use_jwt_access: Optional[bool] = False,
        url_scheme: str = "https",
        interceptor: Optional[FirestoreAdminRestInterceptor] = None,
        api_audience: Optional[str] = None,
    ) -> None:
        """Instantiate the transport.

        Args:
            host (Optional[str]):
                 The hostname to connect to (default: 'firestore.googleapis.com').
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
        self._interceptor = interceptor or FirestoreAdminRestInterceptor()
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
                        "uri": "/v1/{name=projects/*/databases/*/operations/*}:cancel",
                        "body": "*",
                    },
                ],
                "google.longrunning.Operations.DeleteOperation": [
                    {
                        "method": "delete",
                        "uri": "/v1/{name=projects/*/databases/*/operations/*}",
                    },
                ],
                "google.longrunning.Operations.GetOperation": [
                    {
                        "method": "get",
                        "uri": "/v1/{name=projects/*/databases/*/operations/*}",
                    },
                ],
                "google.longrunning.Operations.ListOperations": [
                    {
                        "method": "get",
                        "uri": "/v1/{name=projects/*/databases/*}/operations",
                    },
                ],
            }

            rest_transport = operations_v1.OperationsRestTransport(
                host=self._host,
                # use the credentials which are saved
                credentials=self._credentials,
                scopes=self._scopes,
                http_options=http_options,
                path_prefix="v1",
            )

            self._operations_client = operations_v1.AbstractOperationsClient(
                transport=rest_transport
            )

        # Return the client from cache.
        return self._operations_client

    class _BulkDeleteDocuments(
        _BaseFirestoreAdminRestTransport._BaseBulkDeleteDocuments,
        FirestoreAdminRestStub,
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.BulkDeleteDocuments")

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
            request: firestore_admin.BulkDeleteDocumentsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the bulk delete documents method over HTTP.

            Args:
                request (~.firestore_admin.BulkDeleteDocumentsRequest):
                    The request object. The request for
                [FirestoreAdmin.BulkDeleteDocuments][google.firestore.admin.v1.FirestoreAdmin.BulkDeleteDocuments].

                When both collection_ids and namespace_ids are set, only
                documents satisfying both conditions will be deleted.

                Requests with namespace_ids and collection_ids both
                empty will be rejected. Please use
                [FirestoreAdmin.DeleteDatabase][google.firestore.admin.v1.FirestoreAdmin.DeleteDatabase]
                instead.
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
                _BaseFirestoreAdminRestTransport._BaseBulkDeleteDocuments._get_http_options()
            )

            request, metadata = self._interceptor.pre_bulk_delete_documents(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseBulkDeleteDocuments._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseBulkDeleteDocuments._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseBulkDeleteDocuments._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.BulkDeleteDocuments",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "BulkDeleteDocuments",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._BulkDeleteDocuments._get_response(
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

            resp = self._interceptor.post_bulk_delete_documents(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_bulk_delete_documents_with_metadata(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.bulk_delete_documents",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "BulkDeleteDocuments",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateBackupSchedule(
        _BaseFirestoreAdminRestTransport._BaseCreateBackupSchedule,
        FirestoreAdminRestStub,
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.CreateBackupSchedule")

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
            request: firestore_admin.CreateBackupScheduleRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> schedule.BackupSchedule:
            r"""Call the create backup schedule method over HTTP.

            Args:
                request (~.firestore_admin.CreateBackupScheduleRequest):
                    The request object. The request for
                [FirestoreAdmin.CreateBackupSchedule][google.firestore.admin.v1.FirestoreAdmin.CreateBackupSchedule].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.schedule.BackupSchedule:
                    A backup schedule for a Cloud
                Firestore Database.
                This resource is owned by the database
                it is backing up, and is deleted along
                with the database. The actual backups
                are not though.

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseCreateBackupSchedule._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_backup_schedule(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseCreateBackupSchedule._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseCreateBackupSchedule._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseCreateBackupSchedule._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.CreateBackupSchedule",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "CreateBackupSchedule",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._CreateBackupSchedule._get_response(
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
            resp = schedule.BackupSchedule()
            pb_resp = schedule.BackupSchedule.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_create_backup_schedule(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_backup_schedule_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = schedule.BackupSchedule.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.create_backup_schedule",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "CreateBackupSchedule",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateDatabase(
        _BaseFirestoreAdminRestTransport._BaseCreateDatabase, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.CreateDatabase")

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
            request: firestore_admin.CreateDatabaseRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the create database method over HTTP.

            Args:
                request (~.firestore_admin.CreateDatabaseRequest):
                    The request object. The request for
                [FirestoreAdmin.CreateDatabase][google.firestore.admin.v1.FirestoreAdmin.CreateDatabase].
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
                _BaseFirestoreAdminRestTransport._BaseCreateDatabase._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_database(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseCreateDatabase._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseCreateDatabase._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseCreateDatabase._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.CreateDatabase",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "CreateDatabase",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._CreateDatabase._get_response(
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

            resp = self._interceptor.post_create_database(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_database_with_metadata(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.create_database",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "CreateDatabase",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateIndex(
        _BaseFirestoreAdminRestTransport._BaseCreateIndex, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.CreateIndex")

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
            request: firestore_admin.CreateIndexRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the create index method over HTTP.

            Args:
                request (~.firestore_admin.CreateIndexRequest):
                    The request object. The request for
                [FirestoreAdmin.CreateIndex][google.firestore.admin.v1.FirestoreAdmin.CreateIndex].
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
                _BaseFirestoreAdminRestTransport._BaseCreateIndex._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_index(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseCreateIndex._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseCreateIndex._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseCreateIndex._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.CreateIndex",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "CreateIndex",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._CreateIndex._get_response(
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

            resp = self._interceptor.post_create_index(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_index_with_metadata(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.create_index",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "CreateIndex",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateUserCreds(
        _BaseFirestoreAdminRestTransport._BaseCreateUserCreds, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.CreateUserCreds")

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
            request: firestore_admin.CreateUserCredsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> gfa_user_creds.UserCreds:
            r"""Call the create user creds method over HTTP.

            Args:
                request (~.firestore_admin.CreateUserCredsRequest):
                    The request object. The request for
                [FirestoreAdmin.CreateUserCreds][google.firestore.admin.v1.FirestoreAdmin.CreateUserCreds].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.gfa_user_creds.UserCreds:
                    A Cloud Firestore User Creds.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseCreateUserCreds._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_user_creds(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseCreateUserCreds._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseCreateUserCreds._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseCreateUserCreds._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.CreateUserCreds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "CreateUserCreds",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._CreateUserCreds._get_response(
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
            resp = gfa_user_creds.UserCreds()
            pb_resp = gfa_user_creds.UserCreds.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_create_user_creds(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_user_creds_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = gfa_user_creds.UserCreds.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.create_user_creds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "CreateUserCreds",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _DeleteBackup(
        _BaseFirestoreAdminRestTransport._BaseDeleteBackup, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.DeleteBackup")

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
            request: firestore_admin.DeleteBackupRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the delete backup method over HTTP.

            Args:
                request (~.firestore_admin.DeleteBackupRequest):
                    The request object. The request for
                [FirestoreAdmin.DeleteBackup][google.firestore.admin.v1.FirestoreAdmin.DeleteBackup].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseDeleteBackup._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_backup(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseDeleteBackup._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseDeleteBackup._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.DeleteBackup",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "DeleteBackup",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._DeleteBackup._get_response(
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

    class _DeleteBackupSchedule(
        _BaseFirestoreAdminRestTransport._BaseDeleteBackupSchedule,
        FirestoreAdminRestStub,
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.DeleteBackupSchedule")

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
            request: firestore_admin.DeleteBackupScheduleRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the delete backup schedule method over HTTP.

            Args:
                request (~.firestore_admin.DeleteBackupScheduleRequest):
                    The request object. The request for
                [FirestoreAdmin.DeleteBackupSchedules][].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseDeleteBackupSchedule._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_backup_schedule(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseDeleteBackupSchedule._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseDeleteBackupSchedule._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.DeleteBackupSchedule",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "DeleteBackupSchedule",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._DeleteBackupSchedule._get_response(
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

    class _DeleteDatabase(
        _BaseFirestoreAdminRestTransport._BaseDeleteDatabase, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.DeleteDatabase")

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
            request: firestore_admin.DeleteDatabaseRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the delete database method over HTTP.

            Args:
                request (~.firestore_admin.DeleteDatabaseRequest):
                    The request object. The request for
                [FirestoreAdmin.DeleteDatabase][google.firestore.admin.v1.FirestoreAdmin.DeleteDatabase].
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
                _BaseFirestoreAdminRestTransport._BaseDeleteDatabase._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_database(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseDeleteDatabase._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseDeleteDatabase._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.DeleteDatabase",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "DeleteDatabase",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._DeleteDatabase._get_response(
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

            resp = self._interceptor.post_delete_database(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_delete_database_with_metadata(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.delete_database",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "DeleteDatabase",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _DeleteIndex(
        _BaseFirestoreAdminRestTransport._BaseDeleteIndex, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.DeleteIndex")

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
            request: firestore_admin.DeleteIndexRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the delete index method over HTTP.

            Args:
                request (~.firestore_admin.DeleteIndexRequest):
                    The request object. The request for
                [FirestoreAdmin.DeleteIndex][google.firestore.admin.v1.FirestoreAdmin.DeleteIndex].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseDeleteIndex._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_index(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseDeleteIndex._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseDeleteIndex._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.DeleteIndex",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "DeleteIndex",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._DeleteIndex._get_response(
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

    class _DeleteUserCreds(
        _BaseFirestoreAdminRestTransport._BaseDeleteUserCreds, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.DeleteUserCreds")

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
            request: firestore_admin.DeleteUserCredsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the delete user creds method over HTTP.

            Args:
                request (~.firestore_admin.DeleteUserCredsRequest):
                    The request object. The request for
                [FirestoreAdmin.DeleteUserCreds][google.firestore.admin.v1.FirestoreAdmin.DeleteUserCreds].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseDeleteUserCreds._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_user_creds(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseDeleteUserCreds._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseDeleteUserCreds._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.DeleteUserCreds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "DeleteUserCreds",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._DeleteUserCreds._get_response(
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

    class _DisableUserCreds(
        _BaseFirestoreAdminRestTransport._BaseDisableUserCreds, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.DisableUserCreds")

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
            request: firestore_admin.DisableUserCredsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> user_creds.UserCreds:
            r"""Call the disable user creds method over HTTP.

            Args:
                request (~.firestore_admin.DisableUserCredsRequest):
                    The request object. The request for
                [FirestoreAdmin.DisableUserCreds][google.firestore.admin.v1.FirestoreAdmin.DisableUserCreds].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.user_creds.UserCreds:
                    A Cloud Firestore User Creds.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseDisableUserCreds._get_http_options()
            )

            request, metadata = self._interceptor.pre_disable_user_creds(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseDisableUserCreds._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseDisableUserCreds._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseDisableUserCreds._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.DisableUserCreds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "DisableUserCreds",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._DisableUserCreds._get_response(
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
            resp = user_creds.UserCreds()
            pb_resp = user_creds.UserCreds.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_disable_user_creds(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_disable_user_creds_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = user_creds.UserCreds.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.disable_user_creds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "DisableUserCreds",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _EnableUserCreds(
        _BaseFirestoreAdminRestTransport._BaseEnableUserCreds, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.EnableUserCreds")

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
            request: firestore_admin.EnableUserCredsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> user_creds.UserCreds:
            r"""Call the enable user creds method over HTTP.

            Args:
                request (~.firestore_admin.EnableUserCredsRequest):
                    The request object. The request for
                [FirestoreAdmin.EnableUserCreds][google.firestore.admin.v1.FirestoreAdmin.EnableUserCreds].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.user_creds.UserCreds:
                    A Cloud Firestore User Creds.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseEnableUserCreds._get_http_options()
            )

            request, metadata = self._interceptor.pre_enable_user_creds(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseEnableUserCreds._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseEnableUserCreds._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseEnableUserCreds._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.EnableUserCreds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "EnableUserCreds",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._EnableUserCreds._get_response(
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
            resp = user_creds.UserCreds()
            pb_resp = user_creds.UserCreds.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_enable_user_creds(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_enable_user_creds_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = user_creds.UserCreds.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.enable_user_creds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "EnableUserCreds",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ExportDocuments(
        _BaseFirestoreAdminRestTransport._BaseExportDocuments, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.ExportDocuments")

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
            request: firestore_admin.ExportDocumentsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the export documents method over HTTP.

            Args:
                request (~.firestore_admin.ExportDocumentsRequest):
                    The request object. The request for
                [FirestoreAdmin.ExportDocuments][google.firestore.admin.v1.FirestoreAdmin.ExportDocuments].
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
                _BaseFirestoreAdminRestTransport._BaseExportDocuments._get_http_options()
            )

            request, metadata = self._interceptor.pre_export_documents(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseExportDocuments._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseExportDocuments._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseExportDocuments._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.ExportDocuments",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ExportDocuments",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._ExportDocuments._get_response(
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

            resp = self._interceptor.post_export_documents(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_export_documents_with_metadata(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.export_documents",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ExportDocuments",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetBackup(
        _BaseFirestoreAdminRestTransport._BaseGetBackup, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.GetBackup")

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
            request: firestore_admin.GetBackupRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> backup.Backup:
            r"""Call the get backup method over HTTP.

            Args:
                request (~.firestore_admin.GetBackupRequest):
                    The request object. The request for
                [FirestoreAdmin.GetBackup][google.firestore.admin.v1.FirestoreAdmin.GetBackup].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.backup.Backup:
                    A Backup of a Cloud Firestore
                Database.
                The backup contains all documents and
                index configurations for the given
                database at a specific point in time.

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseGetBackup._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_backup(request, metadata)
            transcoded_request = (
                _BaseFirestoreAdminRestTransport._BaseGetBackup._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreAdminRestTransport._BaseGetBackup._get_query_params_json(
                    transcoded_request
                )
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.GetBackup",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetBackup",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._GetBackup._get_response(
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
            resp = backup.Backup()
            pb_resp = backup.Backup.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_backup(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_backup_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = backup.Backup.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.get_backup",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetBackup",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetBackupSchedule(
        _BaseFirestoreAdminRestTransport._BaseGetBackupSchedule, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.GetBackupSchedule")

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
            request: firestore_admin.GetBackupScheduleRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> schedule.BackupSchedule:
            r"""Call the get backup schedule method over HTTP.

            Args:
                request (~.firestore_admin.GetBackupScheduleRequest):
                    The request object. The request for
                [FirestoreAdmin.GetBackupSchedule][google.firestore.admin.v1.FirestoreAdmin.GetBackupSchedule].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.schedule.BackupSchedule:
                    A backup schedule for a Cloud
                Firestore Database.
                This resource is owned by the database
                it is backing up, and is deleted along
                with the database. The actual backups
                are not though.

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseGetBackupSchedule._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_backup_schedule(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseGetBackupSchedule._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseGetBackupSchedule._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.GetBackupSchedule",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetBackupSchedule",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._GetBackupSchedule._get_response(
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
            resp = schedule.BackupSchedule()
            pb_resp = schedule.BackupSchedule.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_backup_schedule(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_backup_schedule_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = schedule.BackupSchedule.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.get_backup_schedule",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetBackupSchedule",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetDatabase(
        _BaseFirestoreAdminRestTransport._BaseGetDatabase, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.GetDatabase")

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
            request: firestore_admin.GetDatabaseRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> database.Database:
            r"""Call the get database method over HTTP.

            Args:
                request (~.firestore_admin.GetDatabaseRequest):
                    The request object. The request for
                [FirestoreAdmin.GetDatabase][google.firestore.admin.v1.FirestoreAdmin.GetDatabase].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.database.Database:
                    A Cloud Firestore Database.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseGetDatabase._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_database(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseGetDatabase._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseGetDatabase._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.GetDatabase",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetDatabase",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._GetDatabase._get_response(
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
            resp = database.Database()
            pb_resp = database.Database.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_database(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_database_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = database.Database.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.get_database",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetDatabase",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetField(
        _BaseFirestoreAdminRestTransport._BaseGetField, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.GetField")

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
            request: firestore_admin.GetFieldRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> field.Field:
            r"""Call the get field method over HTTP.

            Args:
                request (~.firestore_admin.GetFieldRequest):
                    The request object. The request for
                [FirestoreAdmin.GetField][google.firestore.admin.v1.FirestoreAdmin.GetField].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.field.Field:
                    Represents a single field in the
                database.
                Fields are grouped by their "Collection
                Group", which represent all collections
                in the database with the same ID.

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseGetField._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_field(request, metadata)
            transcoded_request = (
                _BaseFirestoreAdminRestTransport._BaseGetField._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreAdminRestTransport._BaseGetField._get_query_params_json(
                    transcoded_request
                )
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.GetField",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetField",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._GetField._get_response(
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
            resp = field.Field()
            pb_resp = field.Field.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_field(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_field_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = field.Field.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.get_field",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetField",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetIndex(
        _BaseFirestoreAdminRestTransport._BaseGetIndex, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.GetIndex")

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
            request: firestore_admin.GetIndexRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> index.Index:
            r"""Call the get index method over HTTP.

            Args:
                request (~.firestore_admin.GetIndexRequest):
                    The request object. The request for
                [FirestoreAdmin.GetIndex][google.firestore.admin.v1.FirestoreAdmin.GetIndex].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.index.Index:
                    Cloud Firestore indexes enable simple
                and complex queries against documents in
                a database.

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseGetIndex._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_index(request, metadata)
            transcoded_request = (
                _BaseFirestoreAdminRestTransport._BaseGetIndex._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreAdminRestTransport._BaseGetIndex._get_query_params_json(
                    transcoded_request
                )
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.GetIndex",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetIndex",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._GetIndex._get_response(
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
            resp = index.Index()
            pb_resp = index.Index.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_index(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_index_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = index.Index.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.get_index",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetIndex",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetUserCreds(
        _BaseFirestoreAdminRestTransport._BaseGetUserCreds, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.GetUserCreds")

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
            request: firestore_admin.GetUserCredsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> user_creds.UserCreds:
            r"""Call the get user creds method over HTTP.

            Args:
                request (~.firestore_admin.GetUserCredsRequest):
                    The request object. The request for
                [FirestoreAdmin.GetUserCreds][google.firestore.admin.v1.FirestoreAdmin.GetUserCreds].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.user_creds.UserCreds:
                    A Cloud Firestore User Creds.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseGetUserCreds._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_user_creds(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseGetUserCreds._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseGetUserCreds._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.GetUserCreds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetUserCreds",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._GetUserCreds._get_response(
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
            resp = user_creds.UserCreds()
            pb_resp = user_creds.UserCreds.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_user_creds(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_user_creds_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = user_creds.UserCreds.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.get_user_creds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetUserCreds",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ImportDocuments(
        _BaseFirestoreAdminRestTransport._BaseImportDocuments, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.ImportDocuments")

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
            request: firestore_admin.ImportDocumentsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the import documents method over HTTP.

            Args:
                request (~.firestore_admin.ImportDocumentsRequest):
                    The request object. The request for
                [FirestoreAdmin.ImportDocuments][google.firestore.admin.v1.FirestoreAdmin.ImportDocuments].
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
                _BaseFirestoreAdminRestTransport._BaseImportDocuments._get_http_options()
            )

            request, metadata = self._interceptor.pre_import_documents(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseImportDocuments._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseImportDocuments._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseImportDocuments._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.ImportDocuments",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ImportDocuments",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._ImportDocuments._get_response(
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

            resp = self._interceptor.post_import_documents(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_import_documents_with_metadata(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.import_documents",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ImportDocuments",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListBackups(
        _BaseFirestoreAdminRestTransport._BaseListBackups, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.ListBackups")

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
            request: firestore_admin.ListBackupsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore_admin.ListBackupsResponse:
            r"""Call the list backups method over HTTP.

            Args:
                request (~.firestore_admin.ListBackupsRequest):
                    The request object. The request for
                [FirestoreAdmin.ListBackups][google.firestore.admin.v1.FirestoreAdmin.ListBackups].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore_admin.ListBackupsResponse:
                    The response for
                [FirestoreAdmin.ListBackups][google.firestore.admin.v1.FirestoreAdmin.ListBackups].

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseListBackups._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_backups(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseListBackups._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseListBackups._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.ListBackups",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListBackups",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._ListBackups._get_response(
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
            resp = firestore_admin.ListBackupsResponse()
            pb_resp = firestore_admin.ListBackupsResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_backups(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_backups_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore_admin.ListBackupsResponse.to_json(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.list_backups",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListBackups",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListBackupSchedules(
        _BaseFirestoreAdminRestTransport._BaseListBackupSchedules,
        FirestoreAdminRestStub,
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.ListBackupSchedules")

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
            request: firestore_admin.ListBackupSchedulesRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore_admin.ListBackupSchedulesResponse:
            r"""Call the list backup schedules method over HTTP.

            Args:
                request (~.firestore_admin.ListBackupSchedulesRequest):
                    The request object. The request for
                [FirestoreAdmin.ListBackupSchedules][google.firestore.admin.v1.FirestoreAdmin.ListBackupSchedules].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore_admin.ListBackupSchedulesResponse:
                    The response for
                [FirestoreAdmin.ListBackupSchedules][google.firestore.admin.v1.FirestoreAdmin.ListBackupSchedules].

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseListBackupSchedules._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_backup_schedules(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseListBackupSchedules._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseListBackupSchedules._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.ListBackupSchedules",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListBackupSchedules",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._ListBackupSchedules._get_response(
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
            resp = firestore_admin.ListBackupSchedulesResponse()
            pb_resp = firestore_admin.ListBackupSchedulesResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_backup_schedules(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_backup_schedules_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = (
                        firestore_admin.ListBackupSchedulesResponse.to_json(response)
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.list_backup_schedules",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListBackupSchedules",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListDatabases(
        _BaseFirestoreAdminRestTransport._BaseListDatabases, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.ListDatabases")

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
            request: firestore_admin.ListDatabasesRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore_admin.ListDatabasesResponse:
            r"""Call the list databases method over HTTP.

            Args:
                request (~.firestore_admin.ListDatabasesRequest):
                    The request object. A request to list the Firestore
                Databases in all locations for a
                project.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore_admin.ListDatabasesResponse:
                    The list of databases for a project.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseListDatabases._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_databases(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseListDatabases._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseListDatabases._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.ListDatabases",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListDatabases",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._ListDatabases._get_response(
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
            resp = firestore_admin.ListDatabasesResponse()
            pb_resp = firestore_admin.ListDatabasesResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_databases(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_databases_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore_admin.ListDatabasesResponse.to_json(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.list_databases",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListDatabases",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListFields(
        _BaseFirestoreAdminRestTransport._BaseListFields, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.ListFields")

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
            request: firestore_admin.ListFieldsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore_admin.ListFieldsResponse:
            r"""Call the list fields method over HTTP.

            Args:
                request (~.firestore_admin.ListFieldsRequest):
                    The request object. The request for
                [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore_admin.ListFieldsResponse:
                    The response for
                [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields].

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseListFields._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_fields(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseListFields._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreAdminRestTransport._BaseListFields._get_query_params_json(
                    transcoded_request
                )
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.ListFields",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListFields",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._ListFields._get_response(
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
            resp = firestore_admin.ListFieldsResponse()
            pb_resp = firestore_admin.ListFieldsResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_fields(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_fields_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore_admin.ListFieldsResponse.to_json(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.list_fields",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListFields",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListIndexes(
        _BaseFirestoreAdminRestTransport._BaseListIndexes, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.ListIndexes")

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
            request: firestore_admin.ListIndexesRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore_admin.ListIndexesResponse:
            r"""Call the list indexes method over HTTP.

            Args:
                request (~.firestore_admin.ListIndexesRequest):
                    The request object. The request for
                [FirestoreAdmin.ListIndexes][google.firestore.admin.v1.FirestoreAdmin.ListIndexes].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore_admin.ListIndexesResponse:
                    The response for
                [FirestoreAdmin.ListIndexes][google.firestore.admin.v1.FirestoreAdmin.ListIndexes].

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseListIndexes._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_indexes(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseListIndexes._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseListIndexes._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.ListIndexes",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListIndexes",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._ListIndexes._get_response(
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
            resp = firestore_admin.ListIndexesResponse()
            pb_resp = firestore_admin.ListIndexesResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_indexes(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_indexes_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore_admin.ListIndexesResponse.to_json(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.list_indexes",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListIndexes",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListUserCreds(
        _BaseFirestoreAdminRestTransport._BaseListUserCreds, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.ListUserCreds")

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
            request: firestore_admin.ListUserCredsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore_admin.ListUserCredsResponse:
            r"""Call the list user creds method over HTTP.

            Args:
                request (~.firestore_admin.ListUserCredsRequest):
                    The request object. The request for
                [FirestoreAdmin.ListUserCreds][google.firestore.admin.v1.FirestoreAdmin.ListUserCreds].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore_admin.ListUserCredsResponse:
                    The response for
                [FirestoreAdmin.ListUserCreds][google.firestore.admin.v1.FirestoreAdmin.ListUserCreds].

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseListUserCreds._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_user_creds(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseListUserCreds._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseListUserCreds._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.ListUserCreds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListUserCreds",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._ListUserCreds._get_response(
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
            resp = firestore_admin.ListUserCredsResponse()
            pb_resp = firestore_admin.ListUserCredsResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_user_creds(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_user_creds_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore_admin.ListUserCredsResponse.to_json(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.list_user_creds",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListUserCreds",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ResetUserPassword(
        _BaseFirestoreAdminRestTransport._BaseResetUserPassword, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.ResetUserPassword")

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
            request: firestore_admin.ResetUserPasswordRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> user_creds.UserCreds:
            r"""Call the reset user password method over HTTP.

            Args:
                request (~.firestore_admin.ResetUserPasswordRequest):
                    The request object. The request for
                [FirestoreAdmin.ResetUserPassword][google.firestore.admin.v1.FirestoreAdmin.ResetUserPassword].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.user_creds.UserCreds:
                    A Cloud Firestore User Creds.
            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseResetUserPassword._get_http_options()
            )

            request, metadata = self._interceptor.pre_reset_user_password(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseResetUserPassword._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseResetUserPassword._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseResetUserPassword._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.ResetUserPassword",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ResetUserPassword",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._ResetUserPassword._get_response(
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
            resp = user_creds.UserCreds()
            pb_resp = user_creds.UserCreds.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_reset_user_password(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_reset_user_password_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = user_creds.UserCreds.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.reset_user_password",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ResetUserPassword",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _RestoreDatabase(
        _BaseFirestoreAdminRestTransport._BaseRestoreDatabase, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.RestoreDatabase")

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
            request: firestore_admin.RestoreDatabaseRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the restore database method over HTTP.

            Args:
                request (~.firestore_admin.RestoreDatabaseRequest):
                    The request object. The request message for
                [FirestoreAdmin.RestoreDatabase][google.firestore.admin.v1.FirestoreAdmin.RestoreDatabase].
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
                _BaseFirestoreAdminRestTransport._BaseRestoreDatabase._get_http_options()
            )

            request, metadata = self._interceptor.pre_restore_database(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseRestoreDatabase._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseRestoreDatabase._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseRestoreDatabase._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.RestoreDatabase",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "RestoreDatabase",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._RestoreDatabase._get_response(
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

            resp = self._interceptor.post_restore_database(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_restore_database_with_metadata(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.restore_database",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "RestoreDatabase",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _UpdateBackupSchedule(
        _BaseFirestoreAdminRestTransport._BaseUpdateBackupSchedule,
        FirestoreAdminRestStub,
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.UpdateBackupSchedule")

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
            request: firestore_admin.UpdateBackupScheduleRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> schedule.BackupSchedule:
            r"""Call the update backup schedule method over HTTP.

            Args:
                request (~.firestore_admin.UpdateBackupScheduleRequest):
                    The request object. The request for
                [FirestoreAdmin.UpdateBackupSchedule][google.firestore.admin.v1.FirestoreAdmin.UpdateBackupSchedule].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.schedule.BackupSchedule:
                    A backup schedule for a Cloud
                Firestore Database.
                This resource is owned by the database
                it is backing up, and is deleted along
                with the database. The actual backups
                are not though.

            """

            http_options = (
                _BaseFirestoreAdminRestTransport._BaseUpdateBackupSchedule._get_http_options()
            )

            request, metadata = self._interceptor.pre_update_backup_schedule(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseUpdateBackupSchedule._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseUpdateBackupSchedule._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseUpdateBackupSchedule._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.UpdateBackupSchedule",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "UpdateBackupSchedule",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._UpdateBackupSchedule._get_response(
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
            resp = schedule.BackupSchedule()
            pb_resp = schedule.BackupSchedule.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_update_backup_schedule(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_update_backup_schedule_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = schedule.BackupSchedule.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.update_backup_schedule",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "UpdateBackupSchedule",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _UpdateDatabase(
        _BaseFirestoreAdminRestTransport._BaseUpdateDatabase, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.UpdateDatabase")

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
            request: firestore_admin.UpdateDatabaseRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the update database method over HTTP.

            Args:
                request (~.firestore_admin.UpdateDatabaseRequest):
                    The request object. The request for
                [FirestoreAdmin.UpdateDatabase][google.firestore.admin.v1.FirestoreAdmin.UpdateDatabase].
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
                _BaseFirestoreAdminRestTransport._BaseUpdateDatabase._get_http_options()
            )

            request, metadata = self._interceptor.pre_update_database(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseUpdateDatabase._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseUpdateDatabase._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseUpdateDatabase._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.UpdateDatabase",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "UpdateDatabase",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._UpdateDatabase._get_response(
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

            resp = self._interceptor.post_update_database(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_update_database_with_metadata(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.update_database",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "UpdateDatabase",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _UpdateField(
        _BaseFirestoreAdminRestTransport._BaseUpdateField, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.UpdateField")

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
            request: firestore_admin.UpdateFieldRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the update field method over HTTP.

            Args:
                request (~.firestore_admin.UpdateFieldRequest):
                    The request object. The request for
                [FirestoreAdmin.UpdateField][google.firestore.admin.v1.FirestoreAdmin.UpdateField].
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
                _BaseFirestoreAdminRestTransport._BaseUpdateField._get_http_options()
            )

            request, metadata = self._interceptor.pre_update_field(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseUpdateField._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseUpdateField._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseUpdateField._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.UpdateField",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "UpdateField",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._UpdateField._get_response(
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

            resp = self._interceptor.post_update_field(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_update_field_with_metadata(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminClient.update_field",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "UpdateField",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    @property
    def bulk_delete_documents(
        self,
    ) -> Callable[
        [firestore_admin.BulkDeleteDocumentsRequest], operations_pb2.Operation
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._BulkDeleteDocuments(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_backup_schedule(
        self,
    ) -> Callable[
        [firestore_admin.CreateBackupScheduleRequest], schedule.BackupSchedule
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateBackupSchedule(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_database(
        self,
    ) -> Callable[[firestore_admin.CreateDatabaseRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateDatabase(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_index(
        self,
    ) -> Callable[[firestore_admin.CreateIndexRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateIndex(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_user_creds(
        self,
    ) -> Callable[[firestore_admin.CreateUserCredsRequest], gfa_user_creds.UserCreds]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateUserCreds(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_backup(
        self,
    ) -> Callable[[firestore_admin.DeleteBackupRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteBackup(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_backup_schedule(
        self,
    ) -> Callable[[firestore_admin.DeleteBackupScheduleRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteBackupSchedule(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_database(
        self,
    ) -> Callable[[firestore_admin.DeleteDatabaseRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteDatabase(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_index(
        self,
    ) -> Callable[[firestore_admin.DeleteIndexRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteIndex(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_user_creds(
        self,
    ) -> Callable[[firestore_admin.DeleteUserCredsRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteUserCreds(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def disable_user_creds(
        self,
    ) -> Callable[[firestore_admin.DisableUserCredsRequest], user_creds.UserCreds]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DisableUserCreds(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def enable_user_creds(
        self,
    ) -> Callable[[firestore_admin.EnableUserCredsRequest], user_creds.UserCreds]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._EnableUserCreds(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def export_documents(
        self,
    ) -> Callable[[firestore_admin.ExportDocumentsRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ExportDocuments(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_backup(self) -> Callable[[firestore_admin.GetBackupRequest], backup.Backup]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetBackup(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_backup_schedule(
        self,
    ) -> Callable[[firestore_admin.GetBackupScheduleRequest], schedule.BackupSchedule]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetBackupSchedule(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_database(
        self,
    ) -> Callable[[firestore_admin.GetDatabaseRequest], database.Database]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetDatabase(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_field(self) -> Callable[[firestore_admin.GetFieldRequest], field.Field]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetField(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_index(self) -> Callable[[firestore_admin.GetIndexRequest], index.Index]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetIndex(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_user_creds(
        self,
    ) -> Callable[[firestore_admin.GetUserCredsRequest], user_creds.UserCreds]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetUserCreds(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def import_documents(
        self,
    ) -> Callable[[firestore_admin.ImportDocumentsRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ImportDocuments(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_backups(
        self,
    ) -> Callable[
        [firestore_admin.ListBackupsRequest], firestore_admin.ListBackupsResponse
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListBackups(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_backup_schedules(
        self,
    ) -> Callable[
        [firestore_admin.ListBackupSchedulesRequest],
        firestore_admin.ListBackupSchedulesResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListBackupSchedules(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_databases(
        self,
    ) -> Callable[
        [firestore_admin.ListDatabasesRequest], firestore_admin.ListDatabasesResponse
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListDatabases(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_fields(
        self,
    ) -> Callable[
        [firestore_admin.ListFieldsRequest], firestore_admin.ListFieldsResponse
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListFields(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_indexes(
        self,
    ) -> Callable[
        [firestore_admin.ListIndexesRequest], firestore_admin.ListIndexesResponse
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListIndexes(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_user_creds(
        self,
    ) -> Callable[
        [firestore_admin.ListUserCredsRequest], firestore_admin.ListUserCredsResponse
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListUserCreds(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def reset_user_password(
        self,
    ) -> Callable[[firestore_admin.ResetUserPasswordRequest], user_creds.UserCreds]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ResetUserPassword(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def restore_database(
        self,
    ) -> Callable[[firestore_admin.RestoreDatabaseRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._RestoreDatabase(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def update_backup_schedule(
        self,
    ) -> Callable[
        [firestore_admin.UpdateBackupScheduleRequest], schedule.BackupSchedule
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._UpdateBackupSchedule(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def update_database(
        self,
    ) -> Callable[[firestore_admin.UpdateDatabaseRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._UpdateDatabase(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def update_field(
        self,
    ) -> Callable[[firestore_admin.UpdateFieldRequest], operations_pb2.Operation]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._UpdateField(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def cancel_operation(self):
        return self._CancelOperation(self._session, self._host, self._interceptor)  # type: ignore

    class _CancelOperation(
        _BaseFirestoreAdminRestTransport._BaseCancelOperation, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.CancelOperation")

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
                _BaseFirestoreAdminRestTransport._BaseCancelOperation._get_http_options()
            )

            request, metadata = self._interceptor.pre_cancel_operation(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseCancelOperation._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreAdminRestTransport._BaseCancelOperation._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseCancelOperation._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.CancelOperation",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "CancelOperation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._CancelOperation._get_response(
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
        _BaseFirestoreAdminRestTransport._BaseDeleteOperation, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.DeleteOperation")

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
                _BaseFirestoreAdminRestTransport._BaseDeleteOperation._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_operation(
                request, metadata
            )
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseDeleteOperation._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseDeleteOperation._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.DeleteOperation",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "DeleteOperation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._DeleteOperation._get_response(
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
        _BaseFirestoreAdminRestTransport._BaseGetOperation, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.GetOperation")

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
                _BaseFirestoreAdminRestTransport._BaseGetOperation._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_operation(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseGetOperation._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseGetOperation._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.GetOperation",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "GetOperation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._GetOperation._get_response(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminAsyncClient.GetOperation",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
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
        _BaseFirestoreAdminRestTransport._BaseListOperations, FirestoreAdminRestStub
    ):
        def __hash__(self):
            return hash("FirestoreAdminRestTransport.ListOperations")

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
                _BaseFirestoreAdminRestTransport._BaseListOperations._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_operations(request, metadata)
            transcoded_request = _BaseFirestoreAdminRestTransport._BaseListOperations._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreAdminRestTransport._BaseListOperations._get_query_params_json(
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
                    f"Sending request for google.firestore.admin_v1.FirestoreAdminClient.ListOperations",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListOperations",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreAdminRestTransport._ListOperations._get_response(
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
                    "Received response for google.firestore.admin_v1.FirestoreAdminAsyncClient.ListOperations",
                    extra={
                        "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                        "rpcName": "ListOperations",
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


__all__ = ("FirestoreAdminRestTransport",)
