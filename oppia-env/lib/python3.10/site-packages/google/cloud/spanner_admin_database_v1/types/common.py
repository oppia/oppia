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

from google.protobuf import timestamp_pb2  # type: ignore
from google.rpc import status_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.spanner.admin.database.v1",
    manifest={
        "DatabaseDialect",
        "OperationProgress",
        "EncryptionConfig",
        "EncryptionInfo",
    },
)


class DatabaseDialect(proto.Enum):
    r"""Indicates the dialect type of a database."""
    DATABASE_DIALECT_UNSPECIFIED = 0
    GOOGLE_STANDARD_SQL = 1
    POSTGRESQL = 2


class OperationProgress(proto.Message):
    r"""Encapsulates progress related information for a Cloud Spanner
    long running operation.

    Attributes:
        progress_percent (int):
            Percent completion of the operation.
            Values are between 0 and 100 inclusive.
        start_time (google.protobuf.timestamp_pb2.Timestamp):
            Time the request was received.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            If set, the time at which this operation
            failed or was completed successfully.
    """

    progress_percent = proto.Field(
        proto.INT32,
        number=1,
    )
    start_time = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    end_time = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )


class EncryptionConfig(proto.Message):
    r"""Encryption configuration for a Cloud Spanner database.

    Attributes:
        kms_key_name (str):
            The Cloud KMS key to be used for encrypting and decrypting
            the database. Values are of the form
            ``projects/<project>/locations/<location>/keyRings/<key_ring>/cryptoKeys/<kms_key_name>``.
    """

    kms_key_name = proto.Field(
        proto.STRING,
        number=2,
    )


class EncryptionInfo(proto.Message):
    r"""Encryption information for a Cloud Spanner database or
    backup.

    Attributes:
        encryption_type (google.cloud.spanner_admin_database_v1.types.EncryptionInfo.Type):
            Output only. The type of encryption.
        encryption_status (google.rpc.status_pb2.Status):
            Output only. If present, the status of a
            recent encrypt/decrypt call on underlying data
            for this database or backup. Regardless of
            status, data is always encrypted at rest.
        kms_key_version (str):
            Output only. A Cloud KMS key version that is
            being used to protect the database or backup.
    """

    class Type(proto.Enum):
        r"""Possible encryption types."""
        TYPE_UNSPECIFIED = 0
        GOOGLE_DEFAULT_ENCRYPTION = 1
        CUSTOMER_MANAGED_ENCRYPTION = 2

    encryption_type = proto.Field(
        proto.ENUM,
        number=3,
        enum=Type,
    )
    encryption_status = proto.Field(
        proto.MESSAGE,
        number=4,
        message=status_pb2.Status,
    )
    kms_key_version = proto.Field(
        proto.STRING,
        number=2,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
