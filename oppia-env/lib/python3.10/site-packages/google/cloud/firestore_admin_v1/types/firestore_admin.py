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
from __future__ import annotations

from typing import MutableMapping, MutableSequence

import proto  # type: ignore

from google.cloud.firestore_admin_v1.types import backup as gfa_backup
from google.cloud.firestore_admin_v1.types import database as gfa_database
from google.cloud.firestore_admin_v1.types import field as gfa_field
from google.cloud.firestore_admin_v1.types import index as gfa_index
from google.cloud.firestore_admin_v1.types import schedule
from google.cloud.firestore_admin_v1.types import user_creds as gfa_user_creds
from google.protobuf import field_mask_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.admin.v1",
    manifest={
        "ListDatabasesRequest",
        "CreateDatabaseRequest",
        "CreateDatabaseMetadata",
        "ListDatabasesResponse",
        "GetDatabaseRequest",
        "UpdateDatabaseRequest",
        "UpdateDatabaseMetadata",
        "DeleteDatabaseRequest",
        "DeleteDatabaseMetadata",
        "CreateUserCredsRequest",
        "GetUserCredsRequest",
        "ListUserCredsRequest",
        "ListUserCredsResponse",
        "EnableUserCredsRequest",
        "DisableUserCredsRequest",
        "ResetUserPasswordRequest",
        "DeleteUserCredsRequest",
        "CreateBackupScheduleRequest",
        "GetBackupScheduleRequest",
        "UpdateBackupScheduleRequest",
        "ListBackupSchedulesRequest",
        "ListBackupSchedulesResponse",
        "DeleteBackupScheduleRequest",
        "CreateIndexRequest",
        "ListIndexesRequest",
        "ListIndexesResponse",
        "GetIndexRequest",
        "DeleteIndexRequest",
        "UpdateFieldRequest",
        "GetFieldRequest",
        "ListFieldsRequest",
        "ListFieldsResponse",
        "ExportDocumentsRequest",
        "ImportDocumentsRequest",
        "BulkDeleteDocumentsRequest",
        "BulkDeleteDocumentsResponse",
        "GetBackupRequest",
        "ListBackupsRequest",
        "ListBackupsResponse",
        "DeleteBackupRequest",
        "RestoreDatabaseRequest",
    },
)


class ListDatabasesRequest(proto.Message):
    r"""A request to list the Firestore Databases in all locations
    for a project.

    Attributes:
        parent (str):
            Required. A parent name of the form
            ``projects/{project_id}``
        show_deleted (bool):
            If true, also returns deleted resources.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    show_deleted: bool = proto.Field(
        proto.BOOL,
        number=4,
    )


class CreateDatabaseRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.CreateDatabase][google.firestore.admin.v1.FirestoreAdmin.CreateDatabase].

    Attributes:
        parent (str):
            Required. A parent name of the form
            ``projects/{project_id}``
        database (google.cloud.firestore_admin_v1.types.Database):
            Required. The Database to create.
        database_id (str):
            Required. The ID to use for the database, which will become
            the final component of the database's resource name.

            This value should be 4-63 characters. Valid characters are
            /[a-z][0-9]-/ with first character a letter and the last a
            letter or a number. Must not be UUID-like
            /[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/.

            "(default)" database ID is also valid.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    database: gfa_database.Database = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gfa_database.Database,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=3,
    )


class CreateDatabaseMetadata(proto.Message):
    r"""Metadata related to the create database operation."""


class ListDatabasesResponse(proto.Message):
    r"""The list of databases for a project.

    Attributes:
        databases (MutableSequence[google.cloud.firestore_admin_v1.types.Database]):
            The databases in the project.
        unreachable (MutableSequence[str]):
            In the event that data about individual databases cannot be
            listed they will be recorded here.

            An example entry might be:
            projects/some_project/locations/some_location This can
            happen if the Cloud Region that the Database resides in is
            currently unavailable. In this case we can't fetch all the
            details about the database. You may be able to get a more
            detailed error message (or possibly fetch the resource) by
            sending a 'Get' request for the resource or a 'List' request
            for the specific location.
    """

    databases: MutableSequence[gfa_database.Database] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gfa_database.Database,
    )
    unreachable: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=3,
    )


class GetDatabaseRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.GetDatabase][google.firestore.admin.v1.FirestoreAdmin.GetDatabase].

    Attributes:
        name (str):
            Required. A name of the form
            ``projects/{project_id}/databases/{database_id}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class UpdateDatabaseRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.UpdateDatabase][google.firestore.admin.v1.FirestoreAdmin.UpdateDatabase].

    Attributes:
        database (google.cloud.firestore_admin_v1.types.Database):
            Required. The database to update.
        update_mask (google.protobuf.field_mask_pb2.FieldMask):
            The list of fields to be updated.
    """

    database: gfa_database.Database = proto.Field(
        proto.MESSAGE,
        number=1,
        message=gfa_database.Database,
    )
    update_mask: field_mask_pb2.FieldMask = proto.Field(
        proto.MESSAGE,
        number=2,
        message=field_mask_pb2.FieldMask,
    )


class UpdateDatabaseMetadata(proto.Message):
    r"""Metadata related to the update database operation."""


class DeleteDatabaseRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.DeleteDatabase][google.firestore.admin.v1.FirestoreAdmin.DeleteDatabase].

    Attributes:
        name (str):
            Required. A name of the form
            ``projects/{project_id}/databases/{database_id}``
        etag (str):
            The current etag of the Database. If an etag is provided and
            does not match the current etag of the database, deletion
            will be blocked and a FAILED_PRECONDITION error will be
            returned.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    etag: str = proto.Field(
        proto.STRING,
        number=3,
    )


class DeleteDatabaseMetadata(proto.Message):
    r"""Metadata related to the delete database operation."""


class CreateUserCredsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.CreateUserCreds][google.firestore.admin.v1.FirestoreAdmin.CreateUserCreds].

    Attributes:
        parent (str):
            Required. A parent name of the form
            ``projects/{project_id}/databases/{database_id}``
        user_creds (google.cloud.firestore_admin_v1.types.UserCreds):
            Required. The user creds to create.
        user_creds_id (str):
            Required. The ID to use for the user creds, which will
            become the final component of the user creds's resource
            name.

            This value should be 4-63 characters. Valid characters are
            /[a-z][0-9]-/ with first character a letter and the last a
            letter or a number. Must not be UUID-like
            /[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    user_creds: gfa_user_creds.UserCreds = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gfa_user_creds.UserCreds,
    )
    user_creds_id: str = proto.Field(
        proto.STRING,
        number=3,
    )


class GetUserCredsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.GetUserCreds][google.firestore.admin.v1.FirestoreAdmin.GetUserCreds].

    Attributes:
        name (str):
            Required. A name of the form
            ``projects/{project_id}/databases/{database_id}/userCreds/{user_creds_id}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ListUserCredsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.ListUserCreds][google.firestore.admin.v1.FirestoreAdmin.ListUserCreds].

    Attributes:
        parent (str):
            Required. A parent database name of the form
            ``projects/{project_id}/databases/{database_id}``
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ListUserCredsResponse(proto.Message):
    r"""The response for
    [FirestoreAdmin.ListUserCreds][google.firestore.admin.v1.FirestoreAdmin.ListUserCreds].

    Attributes:
        user_creds (MutableSequence[google.cloud.firestore_admin_v1.types.UserCreds]):
            The user creds for the database.
    """

    user_creds: MutableSequence[gfa_user_creds.UserCreds] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gfa_user_creds.UserCreds,
    )


class EnableUserCredsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.EnableUserCreds][google.firestore.admin.v1.FirestoreAdmin.EnableUserCreds].

    Attributes:
        name (str):
            Required. A name of the form
            ``projects/{project_id}/databases/{database_id}/userCreds/{user_creds_id}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class DisableUserCredsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.DisableUserCreds][google.firestore.admin.v1.FirestoreAdmin.DisableUserCreds].

    Attributes:
        name (str):
            Required. A name of the form
            ``projects/{project_id}/databases/{database_id}/userCreds/{user_creds_id}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ResetUserPasswordRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.ResetUserPassword][google.firestore.admin.v1.FirestoreAdmin.ResetUserPassword].

    Attributes:
        name (str):
            Required. A name of the form
            ``projects/{project_id}/databases/{database_id}/userCreds/{user_creds_id}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class DeleteUserCredsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.DeleteUserCreds][google.firestore.admin.v1.FirestoreAdmin.DeleteUserCreds].

    Attributes:
        name (str):
            Required. A name of the form
            ``projects/{project_id}/databases/{database_id}/userCreds/{user_creds_id}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class CreateBackupScheduleRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.CreateBackupSchedule][google.firestore.admin.v1.FirestoreAdmin.CreateBackupSchedule].

    Attributes:
        parent (str):
            Required. The parent database.

            Format ``projects/{project}/databases/{database}``
        backup_schedule (google.cloud.firestore_admin_v1.types.BackupSchedule):
            Required. The backup schedule to create.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    backup_schedule: schedule.BackupSchedule = proto.Field(
        proto.MESSAGE,
        number=2,
        message=schedule.BackupSchedule,
    )


class GetBackupScheduleRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.GetBackupSchedule][google.firestore.admin.v1.FirestoreAdmin.GetBackupSchedule].

    Attributes:
        name (str):
            Required. The name of the backup schedule.

            Format
            ``projects/{project}/databases/{database}/backupSchedules/{backup_schedule}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class UpdateBackupScheduleRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.UpdateBackupSchedule][google.firestore.admin.v1.FirestoreAdmin.UpdateBackupSchedule].

    Attributes:
        backup_schedule (google.cloud.firestore_admin_v1.types.BackupSchedule):
            Required. The backup schedule to update.
        update_mask (google.protobuf.field_mask_pb2.FieldMask):
            The list of fields to be updated.
    """

    backup_schedule: schedule.BackupSchedule = proto.Field(
        proto.MESSAGE,
        number=1,
        message=schedule.BackupSchedule,
    )
    update_mask: field_mask_pb2.FieldMask = proto.Field(
        proto.MESSAGE,
        number=2,
        message=field_mask_pb2.FieldMask,
    )


class ListBackupSchedulesRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.ListBackupSchedules][google.firestore.admin.v1.FirestoreAdmin.ListBackupSchedules].

    Attributes:
        parent (str):
            Required. The parent database.

            Format is ``projects/{project}/databases/{database}``.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ListBackupSchedulesResponse(proto.Message):
    r"""The response for
    [FirestoreAdmin.ListBackupSchedules][google.firestore.admin.v1.FirestoreAdmin.ListBackupSchedules].

    Attributes:
        backup_schedules (MutableSequence[google.cloud.firestore_admin_v1.types.BackupSchedule]):
            List of all backup schedules.
    """

    backup_schedules: MutableSequence[schedule.BackupSchedule] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=schedule.BackupSchedule,
    )


class DeleteBackupScheduleRequest(proto.Message):
    r"""The request for [FirestoreAdmin.DeleteBackupSchedules][].

    Attributes:
        name (str):
            Required. The name of the backup schedule.

            Format
            ``projects/{project}/databases/{database}/backupSchedules/{backup_schedule}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class CreateIndexRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.CreateIndex][google.firestore.admin.v1.FirestoreAdmin.CreateIndex].

    Attributes:
        parent (str):
            Required. A parent name of the form
            ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}``
        index (google.cloud.firestore_admin_v1.types.Index):
            Required. The composite index to create.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    index: gfa_index.Index = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gfa_index.Index,
    )


class ListIndexesRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.ListIndexes][google.firestore.admin.v1.FirestoreAdmin.ListIndexes].

    Attributes:
        parent (str):
            Required. A parent name of the form
            ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}``
        filter (str):
            The filter to apply to list results.
        page_size (int):
            The number of results to return.
        page_token (str):
            A page token, returned from a previous call to
            [FirestoreAdmin.ListIndexes][google.firestore.admin.v1.FirestoreAdmin.ListIndexes],
            that may be used to get the next page of results.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    filter: str = proto.Field(
        proto.STRING,
        number=2,
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=3,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=4,
    )


class ListIndexesResponse(proto.Message):
    r"""The response for
    [FirestoreAdmin.ListIndexes][google.firestore.admin.v1.FirestoreAdmin.ListIndexes].

    Attributes:
        indexes (MutableSequence[google.cloud.firestore_admin_v1.types.Index]):
            The requested indexes.
        next_page_token (str):
            A page token that may be used to request
            another page of results. If blank, this is the
            last page.
    """

    @property
    def raw_page(self):
        return self

    indexes: MutableSequence[gfa_index.Index] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gfa_index.Index,
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class GetIndexRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.GetIndex][google.firestore.admin.v1.FirestoreAdmin.GetIndex].

    Attributes:
        name (str):
            Required. A name of the form
            ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{index_id}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class DeleteIndexRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.DeleteIndex][google.firestore.admin.v1.FirestoreAdmin.DeleteIndex].

    Attributes:
        name (str):
            Required. A name of the form
            ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{index_id}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class UpdateFieldRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.UpdateField][google.firestore.admin.v1.FirestoreAdmin.UpdateField].

    Attributes:
        field (google.cloud.firestore_admin_v1.types.Field):
            Required. The field to be updated.
        update_mask (google.protobuf.field_mask_pb2.FieldMask):
            A mask, relative to the field. If specified, only
            configuration specified by this field_mask will be updated
            in the field.
    """

    field: gfa_field.Field = proto.Field(
        proto.MESSAGE,
        number=1,
        message=gfa_field.Field,
    )
    update_mask: field_mask_pb2.FieldMask = proto.Field(
        proto.MESSAGE,
        number=2,
        message=field_mask_pb2.FieldMask,
    )


class GetFieldRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.GetField][google.firestore.admin.v1.FirestoreAdmin.GetField].

    Attributes:
        name (str):
            Required. A name of the form
            ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/fields/{field_id}``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ListFieldsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields].

    Attributes:
        parent (str):
            Required. A parent name of the form
            ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}``
        filter (str):
            The filter to apply to list results. Currently,
            [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields]
            only supports listing fields that have been explicitly
            overridden. To issue this query, call
            [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields]
            with a filter that includes
            ``indexConfig.usesAncestorConfig:false`` or ``ttlConfig:*``.
        page_size (int):
            The number of results to return.
        page_token (str):
            A page token, returned from a previous call to
            [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields],
            that may be used to get the next page of results.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    filter: str = proto.Field(
        proto.STRING,
        number=2,
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=3,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=4,
    )


class ListFieldsResponse(proto.Message):
    r"""The response for
    [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields].

    Attributes:
        fields (MutableSequence[google.cloud.firestore_admin_v1.types.Field]):
            The requested fields.
        next_page_token (str):
            A page token that may be used to request
            another page of results. If blank, this is the
            last page.
    """

    @property
    def raw_page(self):
        return self

    fields: MutableSequence[gfa_field.Field] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gfa_field.Field,
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class ExportDocumentsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.ExportDocuments][google.firestore.admin.v1.FirestoreAdmin.ExportDocuments].

    Attributes:
        name (str):
            Required. Database to export. Should be of the form:
            ``projects/{project_id}/databases/{database_id}``.
        collection_ids (MutableSequence[str]):
            Which collection IDs to export. Unspecified
            means all collections. Each collection ID in
            this list must be unique.
        output_uri_prefix (str):
            The output URI. Currently only supports Google Cloud Storage
            URIs of the form: ``gs://BUCKET_NAME[/NAMESPACE_PATH]``,
            where ``BUCKET_NAME`` is the name of the Google Cloud
            Storage bucket and ``NAMESPACE_PATH`` is an optional Google
            Cloud Storage namespace path. When choosing a name, be sure
            to consider Google Cloud Storage naming guidelines:
            https://cloud.google.com/storage/docs/naming. If the URI is
            a bucket (without a namespace path), a prefix will be
            generated based on the start time.
        namespace_ids (MutableSequence[str]):
            An empty list represents all namespaces. This
            is the preferred usage for databases that don't
            use namespaces.

            An empty string element represents the default
            namespace. This should be used if the database
            has data in non-default namespaces, but doesn't
            want to include them. Each namespace in this
            list must be unique.
        snapshot_time (google.protobuf.timestamp_pb2.Timestamp):
            The timestamp that corresponds to the version of the
            database to be exported. The timestamp must be in the past,
            rounded to the minute and not older than
            [earliestVersionTime][google.firestore.admin.v1.Database.earliest_version_time].
            If specified, then the exported documents will represent a
            consistent view of the database at the provided time.
            Otherwise, there are no guarantees about the consistency of
            the exported documents.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    collection_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=2,
    )
    output_uri_prefix: str = proto.Field(
        proto.STRING,
        number=3,
    )
    namespace_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=4,
    )
    snapshot_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=5,
        message=timestamp_pb2.Timestamp,
    )


class ImportDocumentsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.ImportDocuments][google.firestore.admin.v1.FirestoreAdmin.ImportDocuments].

    Attributes:
        name (str):
            Required. Database to import into. Should be of the form:
            ``projects/{project_id}/databases/{database_id}``.
        collection_ids (MutableSequence[str]):
            Which collection IDs to import. Unspecified
            means all collections included in the import.
            Each collection ID in this list must be unique.
        input_uri_prefix (str):
            Location of the exported files. This must match the
            output_uri_prefix of an ExportDocumentsResponse from an
            export that has completed successfully. See:
            [google.firestore.admin.v1.ExportDocumentsResponse.output_uri_prefix][google.firestore.admin.v1.ExportDocumentsResponse.output_uri_prefix].
        namespace_ids (MutableSequence[str]):
            An empty list represents all namespaces. This
            is the preferred usage for databases that don't
            use namespaces.

            An empty string element represents the default
            namespace. This should be used if the database
            has data in non-default namespaces, but doesn't
            want to include them. Each namespace in this
            list must be unique.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    collection_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=2,
    )
    input_uri_prefix: str = proto.Field(
        proto.STRING,
        number=3,
    )
    namespace_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=4,
    )


class BulkDeleteDocumentsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.BulkDeleteDocuments][google.firestore.admin.v1.FirestoreAdmin.BulkDeleteDocuments].

    When both collection_ids and namespace_ids are set, only documents
    satisfying both conditions will be deleted.

    Requests with namespace_ids and collection_ids both empty will be
    rejected. Please use
    [FirestoreAdmin.DeleteDatabase][google.firestore.admin.v1.FirestoreAdmin.DeleteDatabase]
    instead.

    Attributes:
        name (str):
            Required. Database to operate. Should be of the form:
            ``projects/{project_id}/databases/{database_id}``.
        collection_ids (MutableSequence[str]):
            Optional. IDs of the collection groups to
            delete. Unspecified means all collection groups.

            Each collection group in this list must be
            unique.
        namespace_ids (MutableSequence[str]):
            Optional. Namespaces to delete.

            An empty list means all namespaces. This is the
            recommended usage for databases that don't use
            namespaces.

            An empty string element represents the default
            namespace. This should be used if the database
            has data in non-default namespaces, but doesn't
            want to delete from them.

            Each namespace in this list must be unique.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    collection_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=2,
    )
    namespace_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=3,
    )


class BulkDeleteDocumentsResponse(proto.Message):
    r"""The response for
    [FirestoreAdmin.BulkDeleteDocuments][google.firestore.admin.v1.FirestoreAdmin.BulkDeleteDocuments].

    """


class GetBackupRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.GetBackup][google.firestore.admin.v1.FirestoreAdmin.GetBackup].

    Attributes:
        name (str):
            Required. Name of the backup to fetch.

            Format is
            ``projects/{project}/locations/{location}/backups/{backup}``.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ListBackupsRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.ListBackups][google.firestore.admin.v1.FirestoreAdmin.ListBackups].

    Attributes:
        parent (str):
            Required. The location to list backups from.

            Format is ``projects/{project}/locations/{location}``. Use
            ``{location} = '-'`` to list backups from all locations for
            the given project. This allows listing backups from a single
            location or from all locations.
        filter (str):
            An expression that filters the list of returned backups.

            A filter expression consists of a field name, a comparison
            operator, and a value for filtering. The value must be a
            string, a number, or a boolean. The comparison operator must
            be one of: ``<``, ``>``, ``<=``, ``>=``, ``!=``, ``=``, or
            ``:``. Colon ``:`` is the contains operator. Filter rules
            are not case sensitive.

            The following fields in the
            [Backup][google.firestore.admin.v1.Backup] are eligible for
            filtering:

            -  ``database_uid`` (supports ``=`` only)
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    filter: str = proto.Field(
        proto.STRING,
        number=2,
    )


class ListBackupsResponse(proto.Message):
    r"""The response for
    [FirestoreAdmin.ListBackups][google.firestore.admin.v1.FirestoreAdmin.ListBackups].

    Attributes:
        backups (MutableSequence[google.cloud.firestore_admin_v1.types.Backup]):
            List of all backups for the project.
        unreachable (MutableSequence[str]):
            List of locations that existing backups were
            not able to be fetched from.
            Instead of failing the entire requests when a
            single location is unreachable, this response
            returns a partial result set and list of
            locations unable to be reached here. The request
            can be retried against a single location to get
            a concrete error.
    """

    backups: MutableSequence[gfa_backup.Backup] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gfa_backup.Backup,
    )
    unreachable: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=3,
    )


class DeleteBackupRequest(proto.Message):
    r"""The request for
    [FirestoreAdmin.DeleteBackup][google.firestore.admin.v1.FirestoreAdmin.DeleteBackup].

    Attributes:
        name (str):
            Required. Name of the backup to delete.

            format is
            ``projects/{project}/locations/{location}/backups/{backup}``.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class RestoreDatabaseRequest(proto.Message):
    r"""The request message for
    [FirestoreAdmin.RestoreDatabase][google.firestore.admin.v1.FirestoreAdmin.RestoreDatabase].

    Attributes:
        parent (str):
            Required. The project to restore the database in. Format is
            ``projects/{project_id}``.
        database_id (str):
            Required. The ID to use for the database, which will become
            the final component of the database's resource name. This
            database ID must not be associated with an existing
            database.

            This value should be 4-63 characters. Valid characters are
            /[a-z][0-9]-/ with first character a letter and the last a
            letter or a number. Must not be UUID-like
            /[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/.

            "(default)" database ID is also valid.
        backup (str):
            Required. Backup to restore from. Must be from the same
            project as the parent.

            The restored database will be created in the same location
            as the source backup.

            Format is:
            ``projects/{project_id}/locations/{location}/backups/{backup}``
        encryption_config (google.cloud.firestore_admin_v1.types.Database.EncryptionConfig):
            Optional. Encryption configuration for the restored
            database.

            If this field is not specified, the restored database will
            use the same encryption configuration as the backup, namely
            [use_source_encryption][google.firestore.admin.v1.Database.EncryptionConfig.use_source_encryption].
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    backup: str = proto.Field(
        proto.STRING,
        number=3,
    )
    encryption_config: gfa_database.Database.EncryptionConfig = proto.Field(
        proto.MESSAGE,
        number=9,
        message=gfa_database.Database.EncryptionConfig,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
