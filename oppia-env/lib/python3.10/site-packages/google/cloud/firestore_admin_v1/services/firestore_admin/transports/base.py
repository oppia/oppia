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
import abc
from typing import Awaitable, Callable, Dict, Optional, Sequence, Union

from google.cloud.firestore_admin_v1 import gapic_version as package_version

import google.auth  # type: ignore
import google.api_core
from google.api_core import exceptions as core_exceptions
from google.api_core import gapic_v1
from google.api_core import retry as retries
from google.api_core import operations_v1
from google.auth import credentials as ga_credentials  # type: ignore
from google.oauth2 import service_account  # type: ignore
import google.protobuf

from google.cloud.firestore_admin_v1.types import backup
from google.cloud.firestore_admin_v1.types import database
from google.cloud.firestore_admin_v1.types import field
from google.cloud.firestore_admin_v1.types import firestore_admin
from google.cloud.firestore_admin_v1.types import index
from google.cloud.firestore_admin_v1.types import schedule
from google.cloud.firestore_admin_v1.types import user_creds
from google.cloud.firestore_admin_v1.types import user_creds as gfa_user_creds
from google.cloud.location import locations_pb2  # type: ignore
from google.longrunning import operations_pb2  # type: ignore
from google.protobuf import empty_pb2  # type: ignore

DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
    gapic_version=package_version.__version__
)

if hasattr(DEFAULT_CLIENT_INFO, "protobuf_runtime_version"):  # pragma: NO COVER
    DEFAULT_CLIENT_INFO.protobuf_runtime_version = google.protobuf.__version__


class FirestoreAdminTransport(abc.ABC):
    """Abstract transport class for FirestoreAdmin."""

    AUTH_SCOPES = (
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/datastore",
    )

    DEFAULT_HOST: str = "firestore.googleapis.com"

    def __init__(
        self,
        *,
        host: str = DEFAULT_HOST,
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        quota_project_id: Optional[str] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
        always_use_jwt_access: Optional[bool] = False,
        api_audience: Optional[str] = None,
        **kwargs,
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
                This argument is mutually exclusive with credentials.
            scopes (Optional[Sequence[str]]): A list of scopes.
            quota_project_id (Optional[str]): An optional project to use for billing
                and quota.
            client_info (google.api_core.gapic_v1.client_info.ClientInfo):
                The client info used to send a user-agent string along with
                API requests. If ``None``, then default info will be used.
                Generally, you only need to set this if you're developing
                your own client library.
            always_use_jwt_access (Optional[bool]): Whether self signed JWT should
                be used for service account credentials.
        """

        scopes_kwargs = {"scopes": scopes, "default_scopes": self.AUTH_SCOPES}

        # Save the scopes.
        self._scopes = scopes
        if not hasattr(self, "_ignore_credentials"):
            self._ignore_credentials: bool = False

        # If no credentials are provided, then determine the appropriate
        # defaults.
        if credentials and credentials_file:
            raise core_exceptions.DuplicateCredentialArgs(
                "'credentials_file' and 'credentials' are mutually exclusive"
            )

        if credentials_file is not None:
            credentials, _ = google.auth.load_credentials_from_file(
                credentials_file, **scopes_kwargs, quota_project_id=quota_project_id
            )
        elif credentials is None and not self._ignore_credentials:
            credentials, _ = google.auth.default(
                **scopes_kwargs, quota_project_id=quota_project_id
            )
            # Don't apply audience if the credentials file passed from user.
            if hasattr(credentials, "with_gdch_audience"):
                credentials = credentials.with_gdch_audience(
                    api_audience if api_audience else host
                )

        # If the credentials are service account credentials, then always try to use self signed JWT.
        if (
            always_use_jwt_access
            and isinstance(credentials, service_account.Credentials)
            and hasattr(service_account.Credentials, "with_always_use_jwt_access")
        ):
            credentials = credentials.with_always_use_jwt_access(True)

        # Save the credentials.
        self._credentials = credentials

        # Save the hostname. Default to port 443 (HTTPS) if none is specified.
        if ":" not in host:
            host += ":443"
        self._host = host

    @property
    def host(self):
        return self._host

    def _prep_wrapped_messages(self, client_info):
        # Precompute the wrapped methods.
        self._wrapped_methods = {
            self.create_index: gapic_v1.method.wrap_method(
                self.create_index,
                default_timeout=60.0,
                client_info=client_info,
            ),
            self.list_indexes: gapic_v1.method.wrap_method(
                self.list_indexes,
                default_retry=retries.Retry(
                    initial=0.1,
                    maximum=60.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.InternalServerError,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=60.0,
                ),
                default_timeout=60.0,
                client_info=client_info,
            ),
            self.get_index: gapic_v1.method.wrap_method(
                self.get_index,
                default_retry=retries.Retry(
                    initial=0.1,
                    maximum=60.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.InternalServerError,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=60.0,
                ),
                default_timeout=60.0,
                client_info=client_info,
            ),
            self.delete_index: gapic_v1.method.wrap_method(
                self.delete_index,
                default_retry=retries.Retry(
                    initial=0.1,
                    maximum=60.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.InternalServerError,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=60.0,
                ),
                default_timeout=60.0,
                client_info=client_info,
            ),
            self.get_field: gapic_v1.method.wrap_method(
                self.get_field,
                default_retry=retries.Retry(
                    initial=0.1,
                    maximum=60.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.InternalServerError,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=60.0,
                ),
                default_timeout=60.0,
                client_info=client_info,
            ),
            self.update_field: gapic_v1.method.wrap_method(
                self.update_field,
                default_timeout=60.0,
                client_info=client_info,
            ),
            self.list_fields: gapic_v1.method.wrap_method(
                self.list_fields,
                default_retry=retries.Retry(
                    initial=0.1,
                    maximum=60.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.InternalServerError,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=60.0,
                ),
                default_timeout=60.0,
                client_info=client_info,
            ),
            self.export_documents: gapic_v1.method.wrap_method(
                self.export_documents,
                default_timeout=60.0,
                client_info=client_info,
            ),
            self.import_documents: gapic_v1.method.wrap_method(
                self.import_documents,
                default_timeout=60.0,
                client_info=client_info,
            ),
            self.bulk_delete_documents: gapic_v1.method.wrap_method(
                self.bulk_delete_documents,
                default_timeout=60.0,
                client_info=client_info,
            ),
            self.create_database: gapic_v1.method.wrap_method(
                self.create_database,
                default_timeout=120.0,
                client_info=client_info,
            ),
            self.get_database: gapic_v1.method.wrap_method(
                self.get_database,
                default_timeout=None,
                client_info=client_info,
            ),
            self.list_databases: gapic_v1.method.wrap_method(
                self.list_databases,
                default_timeout=None,
                client_info=client_info,
            ),
            self.update_database: gapic_v1.method.wrap_method(
                self.update_database,
                default_timeout=None,
                client_info=client_info,
            ),
            self.delete_database: gapic_v1.method.wrap_method(
                self.delete_database,
                default_timeout=None,
                client_info=client_info,
            ),
            self.create_user_creds: gapic_v1.method.wrap_method(
                self.create_user_creds,
                default_timeout=None,
                client_info=client_info,
            ),
            self.get_user_creds: gapic_v1.method.wrap_method(
                self.get_user_creds,
                default_timeout=None,
                client_info=client_info,
            ),
            self.list_user_creds: gapic_v1.method.wrap_method(
                self.list_user_creds,
                default_timeout=None,
                client_info=client_info,
            ),
            self.enable_user_creds: gapic_v1.method.wrap_method(
                self.enable_user_creds,
                default_timeout=None,
                client_info=client_info,
            ),
            self.disable_user_creds: gapic_v1.method.wrap_method(
                self.disable_user_creds,
                default_timeout=None,
                client_info=client_info,
            ),
            self.reset_user_password: gapic_v1.method.wrap_method(
                self.reset_user_password,
                default_timeout=None,
                client_info=client_info,
            ),
            self.delete_user_creds: gapic_v1.method.wrap_method(
                self.delete_user_creds,
                default_timeout=None,
                client_info=client_info,
            ),
            self.get_backup: gapic_v1.method.wrap_method(
                self.get_backup,
                default_timeout=None,
                client_info=client_info,
            ),
            self.list_backups: gapic_v1.method.wrap_method(
                self.list_backups,
                default_timeout=None,
                client_info=client_info,
            ),
            self.delete_backup: gapic_v1.method.wrap_method(
                self.delete_backup,
                default_timeout=None,
                client_info=client_info,
            ),
            self.restore_database: gapic_v1.method.wrap_method(
                self.restore_database,
                default_timeout=120.0,
                client_info=client_info,
            ),
            self.create_backup_schedule: gapic_v1.method.wrap_method(
                self.create_backup_schedule,
                default_timeout=None,
                client_info=client_info,
            ),
            self.get_backup_schedule: gapic_v1.method.wrap_method(
                self.get_backup_schedule,
                default_timeout=None,
                client_info=client_info,
            ),
            self.list_backup_schedules: gapic_v1.method.wrap_method(
                self.list_backup_schedules,
                default_timeout=None,
                client_info=client_info,
            ),
            self.update_backup_schedule: gapic_v1.method.wrap_method(
                self.update_backup_schedule,
                default_timeout=None,
                client_info=client_info,
            ),
            self.delete_backup_schedule: gapic_v1.method.wrap_method(
                self.delete_backup_schedule,
                default_timeout=None,
                client_info=client_info,
            ),
            self.cancel_operation: gapic_v1.method.wrap_method(
                self.cancel_operation,
                default_timeout=None,
                client_info=client_info,
            ),
            self.delete_operation: gapic_v1.method.wrap_method(
                self.delete_operation,
                default_timeout=None,
                client_info=client_info,
            ),
            self.get_operation: gapic_v1.method.wrap_method(
                self.get_operation,
                default_timeout=None,
                client_info=client_info,
            ),
            self.list_operations: gapic_v1.method.wrap_method(
                self.list_operations,
                default_timeout=None,
                client_info=client_info,
            ),
        }

    def close(self):
        """Closes resources associated with the transport.

        .. warning::
             Only call this method if the transport is NOT shared
             with other clients - this may cause errors in other clients!
        """
        raise NotImplementedError()

    @property
    def operations_client(self):
        """Return the client designed to process long-running operations."""
        raise NotImplementedError()

    @property
    def create_index(
        self,
    ) -> Callable[
        [firestore_admin.CreateIndexRequest],
        Union[operations_pb2.Operation, Awaitable[operations_pb2.Operation]],
    ]:
        raise NotImplementedError()

    @property
    def list_indexes(
        self,
    ) -> Callable[
        [firestore_admin.ListIndexesRequest],
        Union[
            firestore_admin.ListIndexesResponse,
            Awaitable[firestore_admin.ListIndexesResponse],
        ],
    ]:
        raise NotImplementedError()

    @property
    def get_index(
        self,
    ) -> Callable[
        [firestore_admin.GetIndexRequest], Union[index.Index, Awaitable[index.Index]]
    ]:
        raise NotImplementedError()

    @property
    def delete_index(
        self,
    ) -> Callable[
        [firestore_admin.DeleteIndexRequest],
        Union[empty_pb2.Empty, Awaitable[empty_pb2.Empty]],
    ]:
        raise NotImplementedError()

    @property
    def get_field(
        self,
    ) -> Callable[
        [firestore_admin.GetFieldRequest], Union[field.Field, Awaitable[field.Field]]
    ]:
        raise NotImplementedError()

    @property
    def update_field(
        self,
    ) -> Callable[
        [firestore_admin.UpdateFieldRequest],
        Union[operations_pb2.Operation, Awaitable[operations_pb2.Operation]],
    ]:
        raise NotImplementedError()

    @property
    def list_fields(
        self,
    ) -> Callable[
        [firestore_admin.ListFieldsRequest],
        Union[
            firestore_admin.ListFieldsResponse,
            Awaitable[firestore_admin.ListFieldsResponse],
        ],
    ]:
        raise NotImplementedError()

    @property
    def export_documents(
        self,
    ) -> Callable[
        [firestore_admin.ExportDocumentsRequest],
        Union[operations_pb2.Operation, Awaitable[operations_pb2.Operation]],
    ]:
        raise NotImplementedError()

    @property
    def import_documents(
        self,
    ) -> Callable[
        [firestore_admin.ImportDocumentsRequest],
        Union[operations_pb2.Operation, Awaitable[operations_pb2.Operation]],
    ]:
        raise NotImplementedError()

    @property
    def bulk_delete_documents(
        self,
    ) -> Callable[
        [firestore_admin.BulkDeleteDocumentsRequest],
        Union[operations_pb2.Operation, Awaitable[operations_pb2.Operation]],
    ]:
        raise NotImplementedError()

    @property
    def create_database(
        self,
    ) -> Callable[
        [firestore_admin.CreateDatabaseRequest],
        Union[operations_pb2.Operation, Awaitable[operations_pb2.Operation]],
    ]:
        raise NotImplementedError()

    @property
    def get_database(
        self,
    ) -> Callable[
        [firestore_admin.GetDatabaseRequest],
        Union[database.Database, Awaitable[database.Database]],
    ]:
        raise NotImplementedError()

    @property
    def list_databases(
        self,
    ) -> Callable[
        [firestore_admin.ListDatabasesRequest],
        Union[
            firestore_admin.ListDatabasesResponse,
            Awaitable[firestore_admin.ListDatabasesResponse],
        ],
    ]:
        raise NotImplementedError()

    @property
    def update_database(
        self,
    ) -> Callable[
        [firestore_admin.UpdateDatabaseRequest],
        Union[operations_pb2.Operation, Awaitable[operations_pb2.Operation]],
    ]:
        raise NotImplementedError()

    @property
    def delete_database(
        self,
    ) -> Callable[
        [firestore_admin.DeleteDatabaseRequest],
        Union[operations_pb2.Operation, Awaitable[operations_pb2.Operation]],
    ]:
        raise NotImplementedError()

    @property
    def create_user_creds(
        self,
    ) -> Callable[
        [firestore_admin.CreateUserCredsRequest],
        Union[gfa_user_creds.UserCreds, Awaitable[gfa_user_creds.UserCreds]],
    ]:
        raise NotImplementedError()

    @property
    def get_user_creds(
        self,
    ) -> Callable[
        [firestore_admin.GetUserCredsRequest],
        Union[user_creds.UserCreds, Awaitable[user_creds.UserCreds]],
    ]:
        raise NotImplementedError()

    @property
    def list_user_creds(
        self,
    ) -> Callable[
        [firestore_admin.ListUserCredsRequest],
        Union[
            firestore_admin.ListUserCredsResponse,
            Awaitable[firestore_admin.ListUserCredsResponse],
        ],
    ]:
        raise NotImplementedError()

    @property
    def enable_user_creds(
        self,
    ) -> Callable[
        [firestore_admin.EnableUserCredsRequest],
        Union[user_creds.UserCreds, Awaitable[user_creds.UserCreds]],
    ]:
        raise NotImplementedError()

    @property
    def disable_user_creds(
        self,
    ) -> Callable[
        [firestore_admin.DisableUserCredsRequest],
        Union[user_creds.UserCreds, Awaitable[user_creds.UserCreds]],
    ]:
        raise NotImplementedError()

    @property
    def reset_user_password(
        self,
    ) -> Callable[
        [firestore_admin.ResetUserPasswordRequest],
        Union[user_creds.UserCreds, Awaitable[user_creds.UserCreds]],
    ]:
        raise NotImplementedError()

    @property
    def delete_user_creds(
        self,
    ) -> Callable[
        [firestore_admin.DeleteUserCredsRequest],
        Union[empty_pb2.Empty, Awaitable[empty_pb2.Empty]],
    ]:
        raise NotImplementedError()

    @property
    def get_backup(
        self,
    ) -> Callable[
        [firestore_admin.GetBackupRequest],
        Union[backup.Backup, Awaitable[backup.Backup]],
    ]:
        raise NotImplementedError()

    @property
    def list_backups(
        self,
    ) -> Callable[
        [firestore_admin.ListBackupsRequest],
        Union[
            firestore_admin.ListBackupsResponse,
            Awaitable[firestore_admin.ListBackupsResponse],
        ],
    ]:
        raise NotImplementedError()

    @property
    def delete_backup(
        self,
    ) -> Callable[
        [firestore_admin.DeleteBackupRequest],
        Union[empty_pb2.Empty, Awaitable[empty_pb2.Empty]],
    ]:
        raise NotImplementedError()

    @property
    def restore_database(
        self,
    ) -> Callable[
        [firestore_admin.RestoreDatabaseRequest],
        Union[operations_pb2.Operation, Awaitable[operations_pb2.Operation]],
    ]:
        raise NotImplementedError()

    @property
    def create_backup_schedule(
        self,
    ) -> Callable[
        [firestore_admin.CreateBackupScheduleRequest],
        Union[schedule.BackupSchedule, Awaitable[schedule.BackupSchedule]],
    ]:
        raise NotImplementedError()

    @property
    def get_backup_schedule(
        self,
    ) -> Callable[
        [firestore_admin.GetBackupScheduleRequest],
        Union[schedule.BackupSchedule, Awaitable[schedule.BackupSchedule]],
    ]:
        raise NotImplementedError()

    @property
    def list_backup_schedules(
        self,
    ) -> Callable[
        [firestore_admin.ListBackupSchedulesRequest],
        Union[
            firestore_admin.ListBackupSchedulesResponse,
            Awaitable[firestore_admin.ListBackupSchedulesResponse],
        ],
    ]:
        raise NotImplementedError()

    @property
    def update_backup_schedule(
        self,
    ) -> Callable[
        [firestore_admin.UpdateBackupScheduleRequest],
        Union[schedule.BackupSchedule, Awaitable[schedule.BackupSchedule]],
    ]:
        raise NotImplementedError()

    @property
    def delete_backup_schedule(
        self,
    ) -> Callable[
        [firestore_admin.DeleteBackupScheduleRequest],
        Union[empty_pb2.Empty, Awaitable[empty_pb2.Empty]],
    ]:
        raise NotImplementedError()

    @property
    def list_operations(
        self,
    ) -> Callable[
        [operations_pb2.ListOperationsRequest],
        Union[
            operations_pb2.ListOperationsResponse,
            Awaitable[operations_pb2.ListOperationsResponse],
        ],
    ]:
        raise NotImplementedError()

    @property
    def get_operation(
        self,
    ) -> Callable[
        [operations_pb2.GetOperationRequest],
        Union[operations_pb2.Operation, Awaitable[operations_pb2.Operation]],
    ]:
        raise NotImplementedError()

    @property
    def cancel_operation(
        self,
    ) -> Callable[[operations_pb2.CancelOperationRequest], None,]:
        raise NotImplementedError()

    @property
    def delete_operation(
        self,
    ) -> Callable[[operations_pb2.DeleteOperationRequest], None,]:
        raise NotImplementedError()

    @property
    def kind(self) -> str:
        raise NotImplementedError()


__all__ = ("FirestoreAdminTransport",)
