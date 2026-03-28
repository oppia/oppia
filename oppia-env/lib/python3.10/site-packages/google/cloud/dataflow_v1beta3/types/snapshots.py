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

from google.protobuf import duration_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
import proto  # type: ignore

__protobuf__ = proto.module(
    package="google.dataflow.v1beta3",
    manifest={
        "SnapshotState",
        "PubsubSnapshotMetadata",
        "Snapshot",
        "GetSnapshotRequest",
        "DeleteSnapshotRequest",
        "DeleteSnapshotResponse",
        "ListSnapshotsRequest",
        "ListSnapshotsResponse",
    },
)


class SnapshotState(proto.Enum):
    r"""Snapshot state.

    Values:
        UNKNOWN_SNAPSHOT_STATE (0):
            Unknown state.
        PENDING (1):
            Snapshot intent to create has been persisted,
            snapshotting of state has not yet started.
        RUNNING (2):
            Snapshotting is being performed.
        READY (3):
            Snapshot has been created and is ready to be
            used.
        FAILED (4):
            Snapshot failed to be created.
        DELETED (5):
            Snapshot has been deleted.
    """
    UNKNOWN_SNAPSHOT_STATE = 0
    PENDING = 1
    RUNNING = 2
    READY = 3
    FAILED = 4
    DELETED = 5


class PubsubSnapshotMetadata(proto.Message):
    r"""Represents a Pubsub snapshot.

    Attributes:
        topic_name (str):
            The name of the Pubsub topic.
        snapshot_name (str):
            The name of the Pubsub snapshot.
        expire_time (google.protobuf.timestamp_pb2.Timestamp):
            The expire time of the Pubsub snapshot.
    """

    topic_name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    snapshot_name: str = proto.Field(
        proto.STRING,
        number=2,
    )
    expire_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )


class Snapshot(proto.Message):
    r"""Represents a snapshot of a job.

    Attributes:
        id (str):
            The unique ID of this snapshot.
        project_id (str):
            The project this snapshot belongs to.
        source_job_id (str):
            The job this snapshot was created from.
        creation_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this snapshot was created.
        ttl (google.protobuf.duration_pb2.Duration):
            The time after which this snapshot will be
            automatically deleted.
        state (google.cloud.dataflow_v1beta3.types.SnapshotState):
            State of the snapshot.
        pubsub_metadata (MutableSequence[google.cloud.dataflow_v1beta3.types.PubsubSnapshotMetadata]):
            Pub/Sub snapshot metadata.
        description (str):
            User specified description of the snapshot.
            Maybe empty.
        disk_size_bytes (int):
            The disk byte size of the snapshot. Only
            available for snapshots in READY state.
        region (str):
            Cloud region where this snapshot lives in,
            e.g., "us-central1".
    """

    id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    project_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    source_job_id: str = proto.Field(
        proto.STRING,
        number=3,
    )
    creation_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )
    ttl: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=5,
        message=duration_pb2.Duration,
    )
    state: "SnapshotState" = proto.Field(
        proto.ENUM,
        number=6,
        enum="SnapshotState",
    )
    pubsub_metadata: MutableSequence["PubsubSnapshotMetadata"] = proto.RepeatedField(
        proto.MESSAGE,
        number=7,
        message="PubsubSnapshotMetadata",
    )
    description: str = proto.Field(
        proto.STRING,
        number=8,
    )
    disk_size_bytes: int = proto.Field(
        proto.INT64,
        number=9,
    )
    region: str = proto.Field(
        proto.STRING,
        number=10,
    )


class GetSnapshotRequest(proto.Message):
    r"""Request to get information about a snapshot

    Attributes:
        project_id (str):
            The ID of the Cloud Platform project that the
            snapshot belongs to.
        snapshot_id (str):
            The ID of the snapshot.
        location (str):
            The location that contains this snapshot.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    snapshot_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    location: str = proto.Field(
        proto.STRING,
        number=3,
    )


class DeleteSnapshotRequest(proto.Message):
    r"""Request to delete a snapshot.

    Attributes:
        project_id (str):
            The ID of the Cloud Platform project that the
            snapshot belongs to.
        snapshot_id (str):
            The ID of the snapshot.
        location (str):
            The location that contains this snapshot.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    snapshot_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    location: str = proto.Field(
        proto.STRING,
        number=3,
    )


class DeleteSnapshotResponse(proto.Message):
    r"""Response from deleting a snapshot."""


class ListSnapshotsRequest(proto.Message):
    r"""Request to list snapshots.

    Attributes:
        project_id (str):
            The project ID to list snapshots for.
        job_id (str):
            If specified, list snapshots created from
            this job.
        location (str):
            The location to list snapshots in.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    job_id: str = proto.Field(
        proto.STRING,
        number=3,
    )
    location: str = proto.Field(
        proto.STRING,
        number=2,
    )


class ListSnapshotsResponse(proto.Message):
    r"""List of snapshots.

    Attributes:
        snapshots (MutableSequence[google.cloud.dataflow_v1beta3.types.Snapshot]):
            Returned snapshots.
    """

    snapshots: MutableSequence["Snapshot"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Snapshot",
    )


__all__ = tuple(sorted(__protobuf__.manifest))
