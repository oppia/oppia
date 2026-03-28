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

from google.protobuf import duration_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.admin.v1",
    manifest={
        "Database",
    },
)


class Database(proto.Message):
    r"""A Cloud Firestore Database.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            The resource name of the Database. Format:
            ``projects/{project}/databases/{database}``
        uid (str):
            Output only. The system-generated UUID4 for
            this Database.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The timestamp at which this database was
            created. Databases created before 2016 do not populate
            create_time.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The timestamp at which this
            database was most recently updated. Note this
            only includes updates to the database resource
            and not data contained by the database.
        delete_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The timestamp at which this
            database was deleted. Only set if the database
            has been deleted.
        location_id (str):
            The location of the database. Available
            locations are listed at
            https://cloud.google.com/firestore/docs/locations.
        type_ (google.cloud.firestore_admin_v1.types.Database.DatabaseType):
            The type of the database.
            See
            https://cloud.google.com/datastore/docs/firestore-or-datastore
            for information about how to choose.
        concurrency_mode (google.cloud.firestore_admin_v1.types.Database.ConcurrencyMode):
            The concurrency control mode to use for this
            database.
        version_retention_period (google.protobuf.duration_pb2.Duration):
            Output only. The period during which past versions of data
            are retained in the database.

            Any [read][google.firestore.v1.GetDocumentRequest.read_time]
            or
            [query][google.firestore.v1.ListDocumentsRequest.read_time]
            can specify a ``read_time`` within this window, and will
            read the state of the database at that time.

            If the PITR feature is enabled, the retention period is 7
            days. Otherwise, the retention period is 1 hour.
        earliest_version_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The earliest timestamp at which older versions
            of the data can be read from the database. See
            [version_retention_period] above; this field is populated
            with ``now - version_retention_period``.

            This value is continuously updated, and becomes stale the
            moment it is queried. If you are using this value to recover
            data, make sure to account for the time from the moment when
            the value is queried to the moment when you initiate the
            recovery.
        point_in_time_recovery_enablement (google.cloud.firestore_admin_v1.types.Database.PointInTimeRecoveryEnablement):
            Whether to enable the PITR feature on this
            database.
        app_engine_integration_mode (google.cloud.firestore_admin_v1.types.Database.AppEngineIntegrationMode):
            The App Engine integration mode to use for
            this database.
        key_prefix (str):
            Output only. The key_prefix for this database. This
            key_prefix is used, in combination with the project ID ("~")
            to construct the application ID that is returned from the
            Cloud Datastore APIs in Google App Engine first generation
            runtimes.

            This value may be empty in which case the appid to use for
            URL-encoded keys is the project_id (eg: foo instead of
            v~foo).
        delete_protection_state (google.cloud.firestore_admin_v1.types.Database.DeleteProtectionState):
            State of delete protection for the database.
        cmek_config (google.cloud.firestore_admin_v1.types.Database.CmekConfig):
            Optional. Presence indicates CMEK is enabled
            for this database.
        previous_id (str):
            Output only. The database resource's prior
            database ID. This field is only populated for
            deleted databases.
        source_info (google.cloud.firestore_admin_v1.types.Database.SourceInfo):
            Output only. Information about the provenance
            of this database.
        free_tier (bool):
            Output only. Background: Free tier is the
            ability of a Firestore database to use a small
            amount of resources every day without being
            charged. Once usage exceeds the free tier limit
            further usage is charged.

            Whether this database can make use of the free
            tier. Only one database per project can be
            eligible for the free tier.

            The first (or next) database that is created in
            a project without a free tier database will be
            marked as eligible for the free tier. Databases
            that are created while there is a free tier
            database will not be eligible for the free tier.

            This field is a member of `oneof`_ ``_free_tier``.
        etag (str):
            This checksum is computed by the server based
            on the value of other fields, and may be sent on
            update and delete requests to ensure the client
            has an up-to-date value before proceeding.
        database_edition (google.cloud.firestore_admin_v1.types.Database.DatabaseEdition):
            Immutable. The edition of the database.
    """

    class DatabaseType(proto.Enum):
        r"""The type of the database.
        See
        https://cloud.google.com/datastore/docs/firestore-or-datastore
        for information about how to choose.

        Mode changes are only allowed if the database is empty.

        Values:
            DATABASE_TYPE_UNSPECIFIED (0):
                Not used.
            FIRESTORE_NATIVE (1):
                Firestore Native Mode
            DATASTORE_MODE (2):
                Firestore in Datastore Mode.
        """
        DATABASE_TYPE_UNSPECIFIED = 0
        FIRESTORE_NATIVE = 1
        DATASTORE_MODE = 2

    class ConcurrencyMode(proto.Enum):
        r"""The type of concurrency control mode for transactions.

        Values:
            CONCURRENCY_MODE_UNSPECIFIED (0):
                Not used.
            OPTIMISTIC (1):
                Use optimistic concurrency control by
                default. This mode is available for Cloud
                Firestore databases.
            PESSIMISTIC (2):
                Use pessimistic concurrency control by
                default. This mode is available for Cloud
                Firestore databases.

                This is the default setting for Cloud Firestore.
            OPTIMISTIC_WITH_ENTITY_GROUPS (3):
                Use optimistic concurrency control with
                entity groups by default.
                This is the only available mode for Cloud
                Datastore.

                This mode is also available for Cloud Firestore
                with Datastore Mode but is not recommended.
        """
        CONCURRENCY_MODE_UNSPECIFIED = 0
        OPTIMISTIC = 1
        PESSIMISTIC = 2
        OPTIMISTIC_WITH_ENTITY_GROUPS = 3

    class PointInTimeRecoveryEnablement(proto.Enum):
        r"""Point In Time Recovery feature enablement.

        Values:
            POINT_IN_TIME_RECOVERY_ENABLEMENT_UNSPECIFIED (0):
                Not used.
            POINT_IN_TIME_RECOVERY_ENABLED (1):
                Reads are supported on selected versions of the data from
                within the past 7 days:

                -  Reads against any timestamp within the past hour
                -  Reads against 1-minute snapshots beyond 1 hour and within
                   7 days

                ``version_retention_period`` and ``earliest_version_time``
                can be used to determine the supported versions.
            POINT_IN_TIME_RECOVERY_DISABLED (2):
                Reads are supported on any version of the
                data from within the past 1 hour.
        """
        POINT_IN_TIME_RECOVERY_ENABLEMENT_UNSPECIFIED = 0
        POINT_IN_TIME_RECOVERY_ENABLED = 1
        POINT_IN_TIME_RECOVERY_DISABLED = 2

    class AppEngineIntegrationMode(proto.Enum):
        r"""The type of App Engine integration mode.

        Values:
            APP_ENGINE_INTEGRATION_MODE_UNSPECIFIED (0):
                Not used.
            ENABLED (1):
                If an App Engine application exists in the
                same region as this database, App Engine
                configuration will impact this database. This
                includes disabling of the application &
                database, as well as disabling writes to the
                database.
            DISABLED (2):
                App Engine has no effect on the ability of
                this database to serve requests.

                This is the default setting for databases
                created with the Firestore API.
        """
        APP_ENGINE_INTEGRATION_MODE_UNSPECIFIED = 0
        ENABLED = 1
        DISABLED = 2

    class DeleteProtectionState(proto.Enum):
        r"""The delete protection state of the database.

        Values:
            DELETE_PROTECTION_STATE_UNSPECIFIED (0):
                The default value. Delete protection type is
                not specified
            DELETE_PROTECTION_DISABLED (1):
                Delete protection is disabled
            DELETE_PROTECTION_ENABLED (2):
                Delete protection is enabled
        """
        DELETE_PROTECTION_STATE_UNSPECIFIED = 0
        DELETE_PROTECTION_DISABLED = 1
        DELETE_PROTECTION_ENABLED = 2

    class DatabaseEdition(proto.Enum):
        r"""The edition of the database.

        Values:
            DATABASE_EDITION_UNSPECIFIED (0):
                Not used.
            STANDARD (1):
                Standard edition.

                This is the default setting if not specified.
            ENTERPRISE (2):
                Enterprise edition.
        """
        DATABASE_EDITION_UNSPECIFIED = 0
        STANDARD = 1
        ENTERPRISE = 2

    class CmekConfig(proto.Message):
        r"""The CMEK (Customer Managed Encryption Key) configuration for
        a Firestore database. If not present, the database is secured by
        the default Google encryption key.

        Attributes:
            kms_key_name (str):
                Required. Only keys in the same location as this database
                are allowed to be used for encryption.

                For Firestore's nam5 multi-region, this corresponds to Cloud
                KMS multi-region us. For Firestore's eur3 multi-region, this
                corresponds to Cloud KMS multi-region europe. See
                https://cloud.google.com/kms/docs/locations.

                The expected format is
                ``projects/{project_id}/locations/{kms_location}/keyRings/{key_ring}/cryptoKeys/{crypto_key}``.
            active_key_version (MutableSequence[str]):
                Output only. Currently in-use `KMS key
                versions <https://cloud.google.com/kms/docs/resource-hierarchy#key_versions>`__.
                During `key
                rotation <https://cloud.google.com/kms/docs/key-rotation>`__,
                there can be multiple in-use key versions.

                The expected format is
                ``projects/{project_id}/locations/{kms_location}/keyRings/{key_ring}/cryptoKeys/{crypto_key}/cryptoKeyVersions/{key_version}``.
        """

        kms_key_name: str = proto.Field(
            proto.STRING,
            number=1,
        )
        active_key_version: MutableSequence[str] = proto.RepeatedField(
            proto.STRING,
            number=2,
        )

    class SourceInfo(proto.Message):
        r"""Information about the provenance of this database.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            backup (google.cloud.firestore_admin_v1.types.Database.SourceInfo.BackupSource):
                If set, this database was restored from the
                specified backup (or a snapshot thereof).

                This field is a member of `oneof`_ ``source``.
            operation (str):
                The associated long-running operation. This field may not be
                set after the operation has completed. Format:
                ``projects/{project}/databases/{database}/operations/{operation}``.
        """

        class BackupSource(proto.Message):
            r"""Information about a backup that was used to restore a
            database.

            Attributes:
                backup (str):
                    The resource name of the backup that was used to restore
                    this database. Format:
                    ``projects/{project}/locations/{location}/backups/{backup}``.
            """

            backup: str = proto.Field(
                proto.STRING,
                number=1,
            )

        backup: "Database.SourceInfo.BackupSource" = proto.Field(
            proto.MESSAGE,
            number=1,
            oneof="source",
            message="Database.SourceInfo.BackupSource",
        )
        operation: str = proto.Field(
            proto.STRING,
            number=3,
        )

    class EncryptionConfig(proto.Message):
        r"""Encryption configuration for a new database being created from
        another source.

        The source could be a [Backup][google.firestore.admin.v1.Backup] .

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            google_default_encryption (google.cloud.firestore_admin_v1.types.Database.EncryptionConfig.GoogleDefaultEncryptionOptions):
                Use Google default encryption.

                This field is a member of `oneof`_ ``encryption_type``.
            use_source_encryption (google.cloud.firestore_admin_v1.types.Database.EncryptionConfig.SourceEncryptionOptions):
                The database will use the same encryption
                configuration as the source.

                This field is a member of `oneof`_ ``encryption_type``.
            customer_managed_encryption (google.cloud.firestore_admin_v1.types.Database.EncryptionConfig.CustomerManagedEncryptionOptions):
                Use Customer Managed Encryption Keys (CMEK)
                for encryption.

                This field is a member of `oneof`_ ``encryption_type``.
        """

        class GoogleDefaultEncryptionOptions(proto.Message):
            r"""The configuration options for using Google default
            encryption.

            """

        class SourceEncryptionOptions(proto.Message):
            r"""The configuration options for using the same encryption
            method as the source.

            """

        class CustomerManagedEncryptionOptions(proto.Message):
            r"""The configuration options for using CMEK (Customer Managed
            Encryption Key) encryption.

            Attributes:
                kms_key_name (str):
                    Required. Only keys in the same location as the database are
                    allowed to be used for encryption.

                    For Firestore's nam5 multi-region, this corresponds to Cloud
                    KMS multi-region us. For Firestore's eur3 multi-region, this
                    corresponds to Cloud KMS multi-region europe. See
                    https://cloud.google.com/kms/docs/locations.

                    The expected format is
                    ``projects/{project_id}/locations/{kms_location}/keyRings/{key_ring}/cryptoKeys/{crypto_key}``.
            """

            kms_key_name: str = proto.Field(
                proto.STRING,
                number=1,
            )

        google_default_encryption: "Database.EncryptionConfig.GoogleDefaultEncryptionOptions" = proto.Field(
            proto.MESSAGE,
            number=1,
            oneof="encryption_type",
            message="Database.EncryptionConfig.GoogleDefaultEncryptionOptions",
        )
        use_source_encryption: "Database.EncryptionConfig.SourceEncryptionOptions" = (
            proto.Field(
                proto.MESSAGE,
                number=2,
                oneof="encryption_type",
                message="Database.EncryptionConfig.SourceEncryptionOptions",
            )
        )
        customer_managed_encryption: "Database.EncryptionConfig.CustomerManagedEncryptionOptions" = proto.Field(
            proto.MESSAGE,
            number=3,
            oneof="encryption_type",
            message="Database.EncryptionConfig.CustomerManagedEncryptionOptions",
        )

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    uid: str = proto.Field(
        proto.STRING,
        number=3,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=5,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=6,
        message=timestamp_pb2.Timestamp,
    )
    delete_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=7,
        message=timestamp_pb2.Timestamp,
    )
    location_id: str = proto.Field(
        proto.STRING,
        number=9,
    )
    type_: DatabaseType = proto.Field(
        proto.ENUM,
        number=10,
        enum=DatabaseType,
    )
    concurrency_mode: ConcurrencyMode = proto.Field(
        proto.ENUM,
        number=15,
        enum=ConcurrencyMode,
    )
    version_retention_period: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=17,
        message=duration_pb2.Duration,
    )
    earliest_version_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=18,
        message=timestamp_pb2.Timestamp,
    )
    point_in_time_recovery_enablement: PointInTimeRecoveryEnablement = proto.Field(
        proto.ENUM,
        number=21,
        enum=PointInTimeRecoveryEnablement,
    )
    app_engine_integration_mode: AppEngineIntegrationMode = proto.Field(
        proto.ENUM,
        number=19,
        enum=AppEngineIntegrationMode,
    )
    key_prefix: str = proto.Field(
        proto.STRING,
        number=20,
    )
    delete_protection_state: DeleteProtectionState = proto.Field(
        proto.ENUM,
        number=22,
        enum=DeleteProtectionState,
    )
    cmek_config: CmekConfig = proto.Field(
        proto.MESSAGE,
        number=23,
        message=CmekConfig,
    )
    previous_id: str = proto.Field(
        proto.STRING,
        number=25,
    )
    source_info: SourceInfo = proto.Field(
        proto.MESSAGE,
        number=26,
        message=SourceInfo,
    )
    free_tier: bool = proto.Field(
        proto.BOOL,
        number=30,
        optional=True,
    )
    etag: str = proto.Field(
        proto.STRING,
        number=99,
    )
    database_edition: DatabaseEdition = proto.Field(
        proto.ENUM,
        number=28,
        enum=DatabaseEdition,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
