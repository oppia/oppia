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

from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.admin.v1",
    manifest={
        "Backup",
    },
)


class Backup(proto.Message):
    r"""A Backup of a Cloud Firestore Database.

    The backup contains all documents and index configurations for
    the given database at a specific point in time.

    Attributes:
        name (str):
            Output only. The unique resource name of the Backup.

            Format is
            ``projects/{project}/locations/{location}/backups/{backup}``.
        database (str):
            Output only. Name of the Firestore database that the backup
            is from.

            Format is ``projects/{project}/databases/{database}``.
        database_uid (str):
            Output only. The system-generated UUID4 for
            the Firestore database that the backup is from.
        snapshot_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The backup contains an
            externally consistent copy of the database at
            this time.
        expire_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The timestamp at which this
            backup expires.
        stats (google.cloud.firestore_admin_v1.types.Backup.Stats):
            Output only. Statistics about the backup.

            This data only becomes available after the
            backup is fully materialized to secondary
            storage. This field will be empty till then.
        state (google.cloud.firestore_admin_v1.types.Backup.State):
            Output only. The current state of the backup.
    """

    class State(proto.Enum):
        r"""Indicate the current state of the backup.

        Values:
            STATE_UNSPECIFIED (0):
                The state is unspecified.
            CREATING (1):
                The pending backup is still being created.
                Operations on the backup will be rejected in
                this state.
            READY (2):
                The backup is complete and ready to use.
            NOT_AVAILABLE (3):
                The backup is not available at this moment.
        """
        STATE_UNSPECIFIED = 0
        CREATING = 1
        READY = 2
        NOT_AVAILABLE = 3

    class Stats(proto.Message):
        r"""Backup specific statistics.

        Attributes:
            size_bytes (int):
                Output only. Summation of the size of all
                documents and index entries in the backup,
                measured in bytes.
            document_count (int):
                Output only. The total number of documents
                contained in the backup.
            index_count (int):
                Output only. The total number of index
                entries contained in the backup.
        """

        size_bytes: int = proto.Field(
            proto.INT64,
            number=1,
        )
        document_count: int = proto.Field(
            proto.INT64,
            number=2,
        )
        index_count: int = proto.Field(
            proto.INT64,
            number=3,
        )

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    database: str = proto.Field(
        proto.STRING,
        number=2,
    )
    database_uid: str = proto.Field(
        proto.STRING,
        number=7,
    )
    snapshot_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    expire_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )
    stats: Stats = proto.Field(
        proto.MESSAGE,
        number=6,
        message=Stats,
    )
    state: State = proto.Field(
        proto.ENUM,
        number=8,
        enum=State,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
