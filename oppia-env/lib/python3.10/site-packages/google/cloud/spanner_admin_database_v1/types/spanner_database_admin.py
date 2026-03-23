# -*- coding: utf-8 -*-
# Copyright 2022 Google LLC
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
import proto  # type: ignore

from google.cloud.spanner_admin_database_v1.types import backup as gsad_backup
from google.cloud.spanner_admin_database_v1.types import common
from google.longrunning import operations_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.spanner.admin.database.v1",
    manifest={
        "RestoreSourceType",
        "RestoreInfo",
        "Database",
        "ListDatabasesRequest",
        "ListDatabasesResponse",
        "CreateDatabaseRequest",
        "CreateDatabaseMetadata",
        "GetDatabaseRequest",
        "UpdateDatabaseDdlRequest",
        "UpdateDatabaseDdlMetadata",
        "DropDatabaseRequest",
        "GetDatabaseDdlRequest",
        "GetDatabaseDdlResponse",
        "ListDatabaseOperationsRequest",
        "ListDatabaseOperationsResponse",
        "RestoreDatabaseRequest",
        "RestoreDatabaseEncryptionConfig",
        "RestoreDatabaseMetadata",
        "OptimizeRestoredDatabaseMetadata",
        "DatabaseRole",
        "ListDatabaseRolesRequest",
        "ListDatabaseRolesResponse",
    },
)


class RestoreSourceType(proto.Enum):
    r"""Indicates the type of the restore source."""
    TYPE_UNSPECIFIED = 0
    BACKUP = 1


class RestoreInfo(proto.Message):
    r"""Information about the database restore.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        source_type (google.cloud.spanner_admin_database_v1.types.RestoreSourceType):
            The type of the restore source.
        backup_info (google.cloud.spanner_admin_database_v1.types.BackupInfo):
            Information about the backup used to restore
            the database. The backup may no longer exist.

            This field is a member of `oneof`_ ``source_info``.
    """

    source_type = proto.Field(
        proto.ENUM,
        number=1,
        enum="RestoreSourceType",
    )
    backup_info = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="source_info",
        message=gsad_backup.BackupInfo,
    )


class Database(proto.Message):
    r"""A Cloud Spanner database.

    Attributes:
        name (str):
            Required. The name of the database. Values are of the form
            ``projects/<project>/instances/<instance>/databases/<database>``,
            where ``<database>`` is as specified in the
            ``CREATE DATABASE`` statement. This name can be passed to
            other API methods to identify the database.
        state (google.cloud.spanner_admin_database_v1.types.Database.State):
            Output only. The current database state.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. If exists, the time at which the
            database creation started.
        restore_info (google.cloud.spanner_admin_database_v1.types.RestoreInfo):
            Output only. Applicable only for restored
            databases. Contains information about the
            restore source.
        encryption_config (google.cloud.spanner_admin_database_v1.types.EncryptionConfig):
            Output only. For databases that are using
            customer managed encryption, this field contains
            the encryption configuration for the database.
            For databases that are using Google default or
            other types of encryption, this field is empty.
        encryption_info (Sequence[google.cloud.spanner_admin_database_v1.types.EncryptionInfo]):
            Output only. For databases that are using
            customer managed encryption, this field contains
            the encryption information for the database,
            such as encryption state and the Cloud KMS key
            versions that are in use.
            For databases that are using Google default or
            other types of encryption, this field is empty.

            This field is propagated lazily from the
            backend. There might be a delay from when a key
            version is being used and when it appears in
            this field.
        version_retention_period (str):
            Output only. The period in which Cloud Spanner retains all
            versions of data for the database. This is the same as the
            value of version_retention_period database option set using
            [UpdateDatabaseDdl][google.spanner.admin.database.v1.DatabaseAdmin.UpdateDatabaseDdl].
            Defaults to 1 hour, if not set.
        earliest_version_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. Earliest timestamp at which
            older versions of the data can be read. This
            value is continuously updated by Cloud Spanner
            and becomes stale the moment it is queried. If
            you are using this value to recover data, make
            sure to account for the time from the moment
            when the value is queried to the moment when you
            initiate the recovery.
        default_leader (str):
            Output only. The read-write region which contains the
            database's leader replicas.

            This is the same as the value of default_leader database
            option set using DatabaseAdmin.CreateDatabase or
            DatabaseAdmin.UpdateDatabaseDdl. If not explicitly set, this
            is empty.
        database_dialect (google.cloud.spanner_admin_database_v1.types.DatabaseDialect):
            Output only. The dialect of the Cloud Spanner
            Database.
    """

    class State(proto.Enum):
        r"""Indicates the current state of the database."""
        STATE_UNSPECIFIED = 0
        CREATING = 1
        READY = 2
        READY_OPTIMIZING = 3

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    state = proto.Field(
        proto.ENUM,
        number=2,
        enum=State,
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    restore_info = proto.Field(
        proto.MESSAGE,
        number=4,
        message="RestoreInfo",
    )
    encryption_config = proto.Field(
        proto.MESSAGE,
        number=5,
        message=common.EncryptionConfig,
    )
    encryption_info = proto.RepeatedField(
        proto.MESSAGE,
        number=8,
        message=common.EncryptionInfo,
    )
    version_retention_period = proto.Field(
        proto.STRING,
        number=6,
    )
    earliest_version_time = proto.Field(
        proto.MESSAGE,
        number=7,
        message=timestamp_pb2.Timestamp,
    )
    default_leader = proto.Field(
        proto.STRING,
        number=9,
    )
    database_dialect = proto.Field(
        proto.ENUM,
        number=10,
        enum=common.DatabaseDialect,
    )


class ListDatabasesRequest(proto.Message):
    r"""The request for
    [ListDatabases][google.spanner.admin.database.v1.DatabaseAdmin.ListDatabases].

    Attributes:
        parent (str):
            Required. The instance whose databases should be listed.
            Values are of the form
            ``projects/<project>/instances/<instance>``.
        page_size (int):
            Number of databases to be returned in the
            response. If 0 or less, defaults to the server's
            maximum allowed page size.
        page_token (str):
            If non-empty, ``page_token`` should contain a
            [next_page_token][google.spanner.admin.database.v1.ListDatabasesResponse.next_page_token]
            from a previous
            [ListDatabasesResponse][google.spanner.admin.database.v1.ListDatabasesResponse].
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    page_size = proto.Field(
        proto.INT32,
        number=3,
    )
    page_token = proto.Field(
        proto.STRING,
        number=4,
    )


class ListDatabasesResponse(proto.Message):
    r"""The response for
    [ListDatabases][google.spanner.admin.database.v1.DatabaseAdmin.ListDatabases].

    Attributes:
        databases (Sequence[google.cloud.spanner_admin_database_v1.types.Database]):
            Databases that matched the request.
        next_page_token (str):
            ``next_page_token`` can be sent in a subsequent
            [ListDatabases][google.spanner.admin.database.v1.DatabaseAdmin.ListDatabases]
            call to fetch more of the matching databases.
    """

    @property
    def raw_page(self):
        return self

    databases = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Database",
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


class CreateDatabaseRequest(proto.Message):
    r"""The request for
    [CreateDatabase][google.spanner.admin.database.v1.DatabaseAdmin.CreateDatabase].

    Attributes:
        parent (str):
            Required. The name of the instance that will serve the new
            database. Values are of the form
            ``projects/<project>/instances/<instance>``.
        create_statement (str):
            Required. A ``CREATE DATABASE`` statement, which specifies
            the ID of the new database. The database ID must conform to
            the regular expression ``[a-z][a-z0-9_\-]*[a-z0-9]`` and be
            between 2 and 30 characters in length. If the database ID is
            a reserved word or if it contains a hyphen, the database ID
            must be enclosed in backticks (:literal:`\``).
        extra_statements (Sequence[str]):
            Optional. A list of DDL statements to run
            inside the newly created database. Statements
            can create tables, indexes, etc. These
            statements execute atomically with the creation
            of the database: if there is an error in any
            statement, the database is not created.
        encryption_config (google.cloud.spanner_admin_database_v1.types.EncryptionConfig):
            Optional. The encryption configuration for
            the database. If this field is not specified,
            Cloud Spanner will encrypt/decrypt all data at
            rest using Google default encryption.
        database_dialect (google.cloud.spanner_admin_database_v1.types.DatabaseDialect):
            Optional. The dialect of the Cloud Spanner
            Database.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    create_statement = proto.Field(
        proto.STRING,
        number=2,
    )
    extra_statements = proto.RepeatedField(
        proto.STRING,
        number=3,
    )
    encryption_config = proto.Field(
        proto.MESSAGE,
        number=4,
        message=common.EncryptionConfig,
    )
    database_dialect = proto.Field(
        proto.ENUM,
        number=5,
        enum=common.DatabaseDialect,
    )


class CreateDatabaseMetadata(proto.Message):
    r"""Metadata type for the operation returned by
    [CreateDatabase][google.spanner.admin.database.v1.DatabaseAdmin.CreateDatabase].

    Attributes:
        database (str):
            The database being created.
    """

    database = proto.Field(
        proto.STRING,
        number=1,
    )


class GetDatabaseRequest(proto.Message):
    r"""The request for
    [GetDatabase][google.spanner.admin.database.v1.DatabaseAdmin.GetDatabase].

    Attributes:
        name (str):
            Required. The name of the requested database. Values are of
            the form
            ``projects/<project>/instances/<instance>/databases/<database>``.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class UpdateDatabaseDdlRequest(proto.Message):
    r"""Enqueues the given DDL statements to be applied, in order but not
    necessarily all at once, to the database schema at some point (or
    points) in the future. The server checks that the statements are
    executable (syntactically valid, name tables that exist, etc.)
    before enqueueing them, but they may still fail upon later execution
    (e.g., if a statement from another batch of statements is applied
    first and it conflicts in some way, or if there is some data-related
    problem like a ``NULL`` value in a column to which ``NOT NULL``
    would be added). If a statement fails, all subsequent statements in
    the batch are automatically cancelled.

    Each batch of statements is assigned a name which can be used with
    the [Operations][google.longrunning.Operations] API to monitor
    progress. See the
    [operation_id][google.spanner.admin.database.v1.UpdateDatabaseDdlRequest.operation_id]
    field for more details.

    Attributes:
        database (str):
            Required. The database to update.
        statements (Sequence[str]):
            Required. DDL statements to be applied to the
            database.
        operation_id (str):
            If empty, the new update request is assigned an
            automatically-generated operation ID. Otherwise,
            ``operation_id`` is used to construct the name of the
            resulting [Operation][google.longrunning.Operation].

            Specifying an explicit operation ID simplifies determining
            whether the statements were executed in the event that the
            [UpdateDatabaseDdl][google.spanner.admin.database.v1.DatabaseAdmin.UpdateDatabaseDdl]
            call is replayed, or the return value is otherwise lost: the
            [database][google.spanner.admin.database.v1.UpdateDatabaseDdlRequest.database]
            and ``operation_id`` fields can be combined to form the
            [name][google.longrunning.Operation.name] of the resulting
            [longrunning.Operation][google.longrunning.Operation]:
            ``<database>/operations/<operation_id>``.

            ``operation_id`` should be unique within the database, and
            must be a valid identifier: ``[a-z][a-z0-9_]*``. Note that
            automatically-generated operation IDs always begin with an
            underscore. If the named operation already exists,
            [UpdateDatabaseDdl][google.spanner.admin.database.v1.DatabaseAdmin.UpdateDatabaseDdl]
            returns ``ALREADY_EXISTS``.
    """

    database = proto.Field(
        proto.STRING,
        number=1,
    )
    statements = proto.RepeatedField(
        proto.STRING,
        number=2,
    )
    operation_id = proto.Field(
        proto.STRING,
        number=3,
    )


class UpdateDatabaseDdlMetadata(proto.Message):
    r"""Metadata type for the operation returned by
    [UpdateDatabaseDdl][google.spanner.admin.database.v1.DatabaseAdmin.UpdateDatabaseDdl].

    Attributes:
        database (str):
            The database being modified.
        statements (Sequence[str]):
            For an update this list contains all the
            statements. For an individual statement, this
            list contains only that statement.
        commit_timestamps (Sequence[google.protobuf.timestamp_pb2.Timestamp]):
            Reports the commit timestamps of all statements that have
            succeeded so far, where ``commit_timestamps[i]`` is the
            commit timestamp for the statement ``statements[i]``.
        throttled (bool):
            Output only. When true, indicates that the
            operation is throttled e.g due to resource
            constraints. When resources become available the
            operation will resume and this field will be
            false again.
        progress (Sequence[google.cloud.spanner_admin_database_v1.types.OperationProgress]):
            The progress of the
            [UpdateDatabaseDdl][google.spanner.admin.database.v1.DatabaseAdmin.UpdateDatabaseDdl]
            operations. Currently, only index creation statements will
            have a continuously updating progress. For non-index
            creation statements, ``progress[i]`` will have start time
            and end time populated with commit timestamp of operation,
            as well as a progress of 100% once the operation has
            completed. ``progress[i]`` is the operation progress for
            ``statements[i]``.
    """

    database = proto.Field(
        proto.STRING,
        number=1,
    )
    statements = proto.RepeatedField(
        proto.STRING,
        number=2,
    )
    commit_timestamps = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    throttled = proto.Field(
        proto.BOOL,
        number=4,
    )
    progress = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message=common.OperationProgress,
    )


class DropDatabaseRequest(proto.Message):
    r"""The request for
    [DropDatabase][google.spanner.admin.database.v1.DatabaseAdmin.DropDatabase].

    Attributes:
        database (str):
            Required. The database to be dropped.
    """

    database = proto.Field(
        proto.STRING,
        number=1,
    )


class GetDatabaseDdlRequest(proto.Message):
    r"""The request for
    [GetDatabaseDdl][google.spanner.admin.database.v1.DatabaseAdmin.GetDatabaseDdl].

    Attributes:
        database (str):
            Required. The database whose schema we wish to get. Values
            are of the form
            ``projects/<project>/instances/<instance>/databases/<database>``
    """

    database = proto.Field(
        proto.STRING,
        number=1,
    )


class GetDatabaseDdlResponse(proto.Message):
    r"""The response for
    [GetDatabaseDdl][google.spanner.admin.database.v1.DatabaseAdmin.GetDatabaseDdl].

    Attributes:
        statements (Sequence[str]):
            A list of formatted DDL statements defining
            the schema of the database specified in the
            request.
    """

    statements = proto.RepeatedField(
        proto.STRING,
        number=1,
    )


class ListDatabaseOperationsRequest(proto.Message):
    r"""The request for
    [ListDatabaseOperations][google.spanner.admin.database.v1.DatabaseAdmin.ListDatabaseOperations].

    Attributes:
        parent (str):
            Required. The instance of the database operations. Values
            are of the form ``projects/<project>/instances/<instance>``.
        filter (str):
            An expression that filters the list of returned operations.

            A filter expression consists of a field name, a comparison
            operator, and a value for filtering. The value must be a
            string, a number, or a boolean. The comparison operator must
            be one of: ``<``, ``>``, ``<=``, ``>=``, ``!=``, ``=``, or
            ``:``. Colon ``:`` is the contains operator. Filter rules
            are not case sensitive.

            The following fields in the
            [Operation][google.longrunning.Operation] are eligible for
            filtering:

            -  ``name`` - The name of the long-running operation
            -  ``done`` - False if the operation is in progress, else
               true.
            -  ``metadata.@type`` - the type of metadata. For example,
               the type string for
               [RestoreDatabaseMetadata][google.spanner.admin.database.v1.RestoreDatabaseMetadata]
               is
               ``type.googleapis.com/google.spanner.admin.database.v1.RestoreDatabaseMetadata``.
            -  ``metadata.<field_name>`` - any field in metadata.value.
               ``metadata.@type`` must be specified first, if filtering
               on metadata fields.
            -  ``error`` - Error associated with the long-running
               operation.
            -  ``response.@type`` - the type of response.
            -  ``response.<field_name>`` - any field in response.value.

            You can combine multiple expressions by enclosing each
            expression in parentheses. By default, expressions are
            combined with AND logic. However, you can specify AND, OR,
            and NOT logic explicitly.

            Here are a few examples:

            -  ``done:true`` - The operation is complete.
            -  ``(metadata.@type=type.googleapis.com/google.spanner.admin.database.v1.RestoreDatabaseMetadata) AND``
               ``(metadata.source_type:BACKUP) AND``
               ``(metadata.backup_info.backup:backup_howl) AND``
               ``(metadata.name:restored_howl) AND``
               ``(metadata.progress.start_time < \"2018-03-28T14:50:00Z\") AND``
               ``(error:*)`` - Return operations where:

               -  The operation's metadata type is
                  [RestoreDatabaseMetadata][google.spanner.admin.database.v1.RestoreDatabaseMetadata].
               -  The database is restored from a backup.
               -  The backup name contains "backup_howl".
               -  The restored database's name contains "restored_howl".
               -  The operation started before 2018-03-28T14:50:00Z.
               -  The operation resulted in an error.
        page_size (int):
            Number of operations to be returned in the
            response. If 0 or less, defaults to the server's
            maximum allowed page size.
        page_token (str):
            If non-empty, ``page_token`` should contain a
            [next_page_token][google.spanner.admin.database.v1.ListDatabaseOperationsResponse.next_page_token]
            from a previous
            [ListDatabaseOperationsResponse][google.spanner.admin.database.v1.ListDatabaseOperationsResponse]
            to the same ``parent`` and with the same ``filter``.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    filter = proto.Field(
        proto.STRING,
        number=2,
    )
    page_size = proto.Field(
        proto.INT32,
        number=3,
    )
    page_token = proto.Field(
        proto.STRING,
        number=4,
    )


class ListDatabaseOperationsResponse(proto.Message):
    r"""The response for
    [ListDatabaseOperations][google.spanner.admin.database.v1.DatabaseAdmin.ListDatabaseOperations].

    Attributes:
        operations (Sequence[google.longrunning.operations_pb2.Operation]):
            The list of matching database [long-running
            operations][google.longrunning.Operation]. Each operation's
            name will be prefixed by the database's name. The
            operation's
            [metadata][google.longrunning.Operation.metadata] field type
            ``metadata.type_url`` describes the type of the metadata.
        next_page_token (str):
            ``next_page_token`` can be sent in a subsequent
            [ListDatabaseOperations][google.spanner.admin.database.v1.DatabaseAdmin.ListDatabaseOperations]
            call to fetch more of the matching metadata.
    """

    @property
    def raw_page(self):
        return self

    operations = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=operations_pb2.Operation,
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


class RestoreDatabaseRequest(proto.Message):
    r"""The request for
    [RestoreDatabase][google.spanner.admin.database.v1.DatabaseAdmin.RestoreDatabase].


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        parent (str):
            Required. The name of the instance in which to create the
            restored database. This instance must be in the same project
            and have the same instance configuration as the instance
            containing the source backup. Values are of the form
            ``projects/<project>/instances/<instance>``.
        database_id (str):
            Required. The id of the database to create and restore to.
            This database must not already exist. The ``database_id``
            appended to ``parent`` forms the full database name of the
            form
            ``projects/<project>/instances/<instance>/databases/<database_id>``.
        backup (str):
            Name of the backup from which to restore. Values are of the
            form
            ``projects/<project>/instances/<instance>/backups/<backup>``.

            This field is a member of `oneof`_ ``source``.
        encryption_config (google.cloud.spanner_admin_database_v1.types.RestoreDatabaseEncryptionConfig):
            Optional. An encryption configuration describing the
            encryption type and key resources in Cloud KMS used to
            encrypt/decrypt the database to restore to. If this field is
            not specified, the restored database will use the same
            encryption configuration as the backup by default, namely
            [encryption_type][google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig.encryption_type]
            = ``USE_CONFIG_DEFAULT_OR_BACKUP_ENCRYPTION``.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    database_id = proto.Field(
        proto.STRING,
        number=2,
    )
    backup = proto.Field(
        proto.STRING,
        number=3,
        oneof="source",
    )
    encryption_config = proto.Field(
        proto.MESSAGE,
        number=4,
        message="RestoreDatabaseEncryptionConfig",
    )


class RestoreDatabaseEncryptionConfig(proto.Message):
    r"""Encryption configuration for the restored database.

    Attributes:
        encryption_type (google.cloud.spanner_admin_database_v1.types.RestoreDatabaseEncryptionConfig.EncryptionType):
            Required. The encryption type of the restored
            database.
        kms_key_name (str):
            Optional. The Cloud KMS key that will be used to
            encrypt/decrypt the restored database. This field should be
            set only when
            [encryption_type][google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig.encryption_type]
            is ``CUSTOMER_MANAGED_ENCRYPTION``. Values are of the form
            ``projects/<project>/locations/<location>/keyRings/<key_ring>/cryptoKeys/<kms_key_name>``.
    """

    class EncryptionType(proto.Enum):
        r"""Encryption types for the database to be restored."""
        ENCRYPTION_TYPE_UNSPECIFIED = 0
        USE_CONFIG_DEFAULT_OR_BACKUP_ENCRYPTION = 1
        GOOGLE_DEFAULT_ENCRYPTION = 2
        CUSTOMER_MANAGED_ENCRYPTION = 3

    encryption_type = proto.Field(
        proto.ENUM,
        number=1,
        enum=EncryptionType,
    )
    kms_key_name = proto.Field(
        proto.STRING,
        number=2,
    )


class RestoreDatabaseMetadata(proto.Message):
    r"""Metadata type for the long-running operation returned by
    [RestoreDatabase][google.spanner.admin.database.v1.DatabaseAdmin.RestoreDatabase].


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            Name of the database being created and
            restored to.
        source_type (google.cloud.spanner_admin_database_v1.types.RestoreSourceType):
            The type of the restore source.
        backup_info (google.cloud.spanner_admin_database_v1.types.BackupInfo):
            Information about the backup used to restore
            the database.

            This field is a member of `oneof`_ ``source_info``.
        progress (google.cloud.spanner_admin_database_v1.types.OperationProgress):
            The progress of the
            [RestoreDatabase][google.spanner.admin.database.v1.DatabaseAdmin.RestoreDatabase]
            operation.
        cancel_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which cancellation of this operation was
            received.
            [Operations.CancelOperation][google.longrunning.Operations.CancelOperation]
            starts asynchronous cancellation on a long-running
            operation. The server makes a best effort to cancel the
            operation, but success is not guaranteed. Clients can use
            [Operations.GetOperation][google.longrunning.Operations.GetOperation]
            or other methods to check whether the cancellation succeeded
            or whether the operation completed despite cancellation. On
            successful cancellation, the operation is not deleted;
            instead, it becomes an operation with an
            [Operation.error][google.longrunning.Operation.error] value
            with a [google.rpc.Status.code][google.rpc.Status.code] of
            1, corresponding to ``Code.CANCELLED``.
        optimize_database_operation_name (str):
            If exists, the name of the long-running operation that will
            be used to track the post-restore optimization process to
            optimize the performance of the restored database, and
            remove the dependency on the restore source. The name is of
            the form
            ``projects/<project>/instances/<instance>/databases/<database>/operations/<operation>``
            where the is the name of database being created and restored
            to. The metadata type of the long-running operation is
            [OptimizeRestoredDatabaseMetadata][google.spanner.admin.database.v1.OptimizeRestoredDatabaseMetadata].
            This long-running operation will be automatically created by
            the system after the RestoreDatabase long-running operation
            completes successfully. This operation will not be created
            if the restore was not successful.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    source_type = proto.Field(
        proto.ENUM,
        number=2,
        enum="RestoreSourceType",
    )
    backup_info = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="source_info",
        message=gsad_backup.BackupInfo,
    )
    progress = proto.Field(
        proto.MESSAGE,
        number=4,
        message=common.OperationProgress,
    )
    cancel_time = proto.Field(
        proto.MESSAGE,
        number=5,
        message=timestamp_pb2.Timestamp,
    )
    optimize_database_operation_name = proto.Field(
        proto.STRING,
        number=6,
    )


class OptimizeRestoredDatabaseMetadata(proto.Message):
    r"""Metadata type for the long-running operation used to track
    the progress of optimizations performed on a newly restored
    database. This long-running operation is automatically created
    by the system after the successful completion of a database
    restore, and cannot be cancelled.

    Attributes:
        name (str):
            Name of the restored database being
            optimized.
        progress (google.cloud.spanner_admin_database_v1.types.OperationProgress):
            The progress of the post-restore
            optimizations.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    progress = proto.Field(
        proto.MESSAGE,
        number=2,
        message=common.OperationProgress,
    )


class DatabaseRole(proto.Message):
    r"""A Cloud Spanner database role.

    Attributes:
        name (str):
            Required. The name of the database role. Values are of the
            form
            ``projects/<project>/instances/<instance>/databases/<database>/databaseRoles/ {role}``,
            where ``<role>`` is as specified in the ``CREATE ROLE`` DDL
            statement. This name can be passed to Get/Set IAMPolicy
            methods to identify the database role.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class ListDatabaseRolesRequest(proto.Message):
    r"""The request for
    [ListDatabaseRoles][google.spanner.admin.database.v1.DatabaseAdmin.ListDatabaseRoles].

    Attributes:
        parent (str):
            Required. The database whose roles should be listed. Values
            are of the form
            ``projects/<project>/instances/<instance>/databases/<database>/databaseRoles``.
        page_size (int):
            Number of database roles to be returned in
            the response. If 0 or less, defaults to the
            server's maximum allowed page size.
        page_token (str):
            If non-empty, ``page_token`` should contain a
            [next_page_token][google.spanner.admin.database.v1.ListDatabaseRolesResponse.next_page_token]
            from a previous
            [ListDatabaseRolesResponse][google.spanner.admin.database.v1.ListDatabaseRolesResponse].
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    page_size = proto.Field(
        proto.INT32,
        number=2,
    )
    page_token = proto.Field(
        proto.STRING,
        number=3,
    )


class ListDatabaseRolesResponse(proto.Message):
    r"""The response for
    [ListDatabaseRoles][google.spanner.admin.database.v1.DatabaseAdmin.ListDatabaseRoles].

    Attributes:
        database_roles (Sequence[google.cloud.spanner_admin_database_v1.types.DatabaseRole]):
            Database roles that matched the request.
        next_page_token (str):
            ``next_page_token`` can be sent in a subsequent
            [ListDatabaseRoles][google.spanner.admin.database.v1.DatabaseAdmin.ListDatabaseRoles]
            call to fetch more of the matching roles.
    """

    @property
    def raw_page(self):
        return self

    database_roles = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="DatabaseRole",
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
