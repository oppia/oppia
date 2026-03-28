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

from google.cloud.firestore_admin_v1.types import index as gfa_index
from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.admin.v1",
    manifest={
        "OperationState",
        "IndexOperationMetadata",
        "FieldOperationMetadata",
        "ExportDocumentsMetadata",
        "ImportDocumentsMetadata",
        "BulkDeleteDocumentsMetadata",
        "ExportDocumentsResponse",
        "RestoreDatabaseMetadata",
        "Progress",
    },
)


class OperationState(proto.Enum):
    r"""Describes the state of the operation.

    Values:
        OPERATION_STATE_UNSPECIFIED (0):
            Unspecified.
        INITIALIZING (1):
            Request is being prepared for processing.
        PROCESSING (2):
            Request is actively being processed.
        CANCELLING (3):
            Request is in the process of being cancelled
            after user called
            google.longrunning.Operations.CancelOperation on
            the operation.
        FINALIZING (4):
            Request has been processed and is in its
            finalization stage.
        SUCCESSFUL (5):
            Request has completed successfully.
        FAILED (6):
            Request has finished being processed, but
            encountered an error.
        CANCELLED (7):
            Request has finished being cancelled after
            user called
            google.longrunning.Operations.CancelOperation.
    """
    OPERATION_STATE_UNSPECIFIED = 0
    INITIALIZING = 1
    PROCESSING = 2
    CANCELLING = 3
    FINALIZING = 4
    SUCCESSFUL = 5
    FAILED = 6
    CANCELLED = 7


class IndexOperationMetadata(proto.Message):
    r"""Metadata for
    [google.longrunning.Operation][google.longrunning.Operation] results
    from
    [FirestoreAdmin.CreateIndex][google.firestore.admin.v1.FirestoreAdmin.CreateIndex].

    Attributes:
        start_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this operation started.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this operation completed. Will be
            unset if operation still in progress.
        index (str):
            The index resource that this operation is acting on. For
            example:
            ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{index_id}``
        state (google.cloud.firestore_admin_v1.types.OperationState):
            The state of the operation.
        progress_documents (google.cloud.firestore_admin_v1.types.Progress):
            The progress, in documents, of this
            operation.
        progress_bytes (google.cloud.firestore_admin_v1.types.Progress):
            The progress, in bytes, of this operation.
    """

    start_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=1,
        message=timestamp_pb2.Timestamp,
    )
    end_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    index: str = proto.Field(
        proto.STRING,
        number=3,
    )
    state: "OperationState" = proto.Field(
        proto.ENUM,
        number=4,
        enum="OperationState",
    )
    progress_documents: "Progress" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="Progress",
    )
    progress_bytes: "Progress" = proto.Field(
        proto.MESSAGE,
        number=6,
        message="Progress",
    )


class FieldOperationMetadata(proto.Message):
    r"""Metadata for
    [google.longrunning.Operation][google.longrunning.Operation] results
    from
    [FirestoreAdmin.UpdateField][google.firestore.admin.v1.FirestoreAdmin.UpdateField].

    Attributes:
        start_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this operation started.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this operation completed. Will be
            unset if operation still in progress.
        field (str):
            The field resource that this operation is acting on. For
            example:
            ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/fields/{field_path}``
        index_config_deltas (MutableSequence[google.cloud.firestore_admin_v1.types.FieldOperationMetadata.IndexConfigDelta]):
            A list of
            [IndexConfigDelta][google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta],
            which describe the intent of this operation.
        state (google.cloud.firestore_admin_v1.types.OperationState):
            The state of the operation.
        progress_documents (google.cloud.firestore_admin_v1.types.Progress):
            The progress, in documents, of this
            operation.
        progress_bytes (google.cloud.firestore_admin_v1.types.Progress):
            The progress, in bytes, of this operation.
        ttl_config_delta (google.cloud.firestore_admin_v1.types.FieldOperationMetadata.TtlConfigDelta):
            Describes the deltas of TTL configuration.
    """

    class IndexConfigDelta(proto.Message):
        r"""Information about an index configuration change.

        Attributes:
            change_type (google.cloud.firestore_admin_v1.types.FieldOperationMetadata.IndexConfigDelta.ChangeType):
                Specifies how the index is changing.
            index (google.cloud.firestore_admin_v1.types.Index):
                The index being changed.
        """

        class ChangeType(proto.Enum):
            r"""Specifies how the index is changing.

            Values:
                CHANGE_TYPE_UNSPECIFIED (0):
                    The type of change is not specified or known.
                ADD (1):
                    The single field index is being added.
                REMOVE (2):
                    The single field index is being removed.
            """
            CHANGE_TYPE_UNSPECIFIED = 0
            ADD = 1
            REMOVE = 2

        change_type: "FieldOperationMetadata.IndexConfigDelta.ChangeType" = proto.Field(
            proto.ENUM,
            number=1,
            enum="FieldOperationMetadata.IndexConfigDelta.ChangeType",
        )
        index: gfa_index.Index = proto.Field(
            proto.MESSAGE,
            number=2,
            message=gfa_index.Index,
        )

    class TtlConfigDelta(proto.Message):
        r"""Information about a TTL configuration change.

        Attributes:
            change_type (google.cloud.firestore_admin_v1.types.FieldOperationMetadata.TtlConfigDelta.ChangeType):
                Specifies how the TTL configuration is
                changing.
        """

        class ChangeType(proto.Enum):
            r"""Specifies how the TTL config is changing.

            Values:
                CHANGE_TYPE_UNSPECIFIED (0):
                    The type of change is not specified or known.
                ADD (1):
                    The TTL config is being added.
                REMOVE (2):
                    The TTL config is being removed.
            """
            CHANGE_TYPE_UNSPECIFIED = 0
            ADD = 1
            REMOVE = 2

        change_type: "FieldOperationMetadata.TtlConfigDelta.ChangeType" = proto.Field(
            proto.ENUM,
            number=1,
            enum="FieldOperationMetadata.TtlConfigDelta.ChangeType",
        )

    start_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=1,
        message=timestamp_pb2.Timestamp,
    )
    end_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    field: str = proto.Field(
        proto.STRING,
        number=3,
    )
    index_config_deltas: MutableSequence[IndexConfigDelta] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message=IndexConfigDelta,
    )
    state: "OperationState" = proto.Field(
        proto.ENUM,
        number=5,
        enum="OperationState",
    )
    progress_documents: "Progress" = proto.Field(
        proto.MESSAGE,
        number=6,
        message="Progress",
    )
    progress_bytes: "Progress" = proto.Field(
        proto.MESSAGE,
        number=7,
        message="Progress",
    )
    ttl_config_delta: TtlConfigDelta = proto.Field(
        proto.MESSAGE,
        number=8,
        message=TtlConfigDelta,
    )


class ExportDocumentsMetadata(proto.Message):
    r"""Metadata for
    [google.longrunning.Operation][google.longrunning.Operation] results
    from
    [FirestoreAdmin.ExportDocuments][google.firestore.admin.v1.FirestoreAdmin.ExportDocuments].

    Attributes:
        start_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this operation started.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this operation completed. Will be
            unset if operation still in progress.
        operation_state (google.cloud.firestore_admin_v1.types.OperationState):
            The state of the export operation.
        progress_documents (google.cloud.firestore_admin_v1.types.Progress):
            The progress, in documents, of this
            operation.
        progress_bytes (google.cloud.firestore_admin_v1.types.Progress):
            The progress, in bytes, of this operation.
        collection_ids (MutableSequence[str]):
            Which collection IDs are being exported.
        output_uri_prefix (str):
            Where the documents are being exported to.
        namespace_ids (MutableSequence[str]):
            Which namespace IDs are being exported.
        snapshot_time (google.protobuf.timestamp_pb2.Timestamp):
            The timestamp that corresponds to the version
            of the database that is being exported. If
            unspecified, there are no guarantees about the
            consistency of the documents being exported.
    """

    start_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=1,
        message=timestamp_pb2.Timestamp,
    )
    end_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    operation_state: "OperationState" = proto.Field(
        proto.ENUM,
        number=3,
        enum="OperationState",
    )
    progress_documents: "Progress" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="Progress",
    )
    progress_bytes: "Progress" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="Progress",
    )
    collection_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=6,
    )
    output_uri_prefix: str = proto.Field(
        proto.STRING,
        number=7,
    )
    namespace_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=8,
    )
    snapshot_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=9,
        message=timestamp_pb2.Timestamp,
    )


class ImportDocumentsMetadata(proto.Message):
    r"""Metadata for
    [google.longrunning.Operation][google.longrunning.Operation] results
    from
    [FirestoreAdmin.ImportDocuments][google.firestore.admin.v1.FirestoreAdmin.ImportDocuments].

    Attributes:
        start_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this operation started.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this operation completed. Will be
            unset if operation still in progress.
        operation_state (google.cloud.firestore_admin_v1.types.OperationState):
            The state of the import operation.
        progress_documents (google.cloud.firestore_admin_v1.types.Progress):
            The progress, in documents, of this
            operation.
        progress_bytes (google.cloud.firestore_admin_v1.types.Progress):
            The progress, in bytes, of this operation.
        collection_ids (MutableSequence[str]):
            Which collection IDs are being imported.
        input_uri_prefix (str):
            The location of the documents being imported.
        namespace_ids (MutableSequence[str]):
            Which namespace IDs are being imported.
    """

    start_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=1,
        message=timestamp_pb2.Timestamp,
    )
    end_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    operation_state: "OperationState" = proto.Field(
        proto.ENUM,
        number=3,
        enum="OperationState",
    )
    progress_documents: "Progress" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="Progress",
    )
    progress_bytes: "Progress" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="Progress",
    )
    collection_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=6,
    )
    input_uri_prefix: str = proto.Field(
        proto.STRING,
        number=7,
    )
    namespace_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=8,
    )


class BulkDeleteDocumentsMetadata(proto.Message):
    r"""Metadata for
    [google.longrunning.Operation][google.longrunning.Operation] results
    from
    [FirestoreAdmin.BulkDeleteDocuments][google.firestore.admin.v1.FirestoreAdmin.BulkDeleteDocuments].

    Attributes:
        start_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this operation started.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            The time this operation completed. Will be
            unset if operation still in progress.
        operation_state (google.cloud.firestore_admin_v1.types.OperationState):
            The state of the operation.
        progress_documents (google.cloud.firestore_admin_v1.types.Progress):
            The progress, in documents, of this
            operation.
        progress_bytes (google.cloud.firestore_admin_v1.types.Progress):
            The progress, in bytes, of this operation.
        collection_ids (MutableSequence[str]):
            The IDs of the collection groups that are
            being deleted.
        namespace_ids (MutableSequence[str]):
            Which namespace IDs are being deleted.
        snapshot_time (google.protobuf.timestamp_pb2.Timestamp):
            The timestamp that corresponds to the version
            of the database that is being read to get the
            list of documents to delete. This time can also
            be used as the timestamp of PITR in case of
            disaster recovery (subject to PITR window
            limit).
    """

    start_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=1,
        message=timestamp_pb2.Timestamp,
    )
    end_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    operation_state: "OperationState" = proto.Field(
        proto.ENUM,
        number=3,
        enum="OperationState",
    )
    progress_documents: "Progress" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="Progress",
    )
    progress_bytes: "Progress" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="Progress",
    )
    collection_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=6,
    )
    namespace_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=7,
    )
    snapshot_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=8,
        message=timestamp_pb2.Timestamp,
    )


class ExportDocumentsResponse(proto.Message):
    r"""Returned in the
    [google.longrunning.Operation][google.longrunning.Operation]
    response field.

    Attributes:
        output_uri_prefix (str):
            Location of the output files. This can be
            used to begin an import into Cloud Firestore
            (this project or another project) after the
            operation completes successfully.
    """

    output_uri_prefix: str = proto.Field(
        proto.STRING,
        number=1,
    )


class RestoreDatabaseMetadata(proto.Message):
    r"""Metadata for the [long-running
    operation][google.longrunning.Operation] from the
    [RestoreDatabase][google.firestore.admin.v1.RestoreDatabase]
    request.

    Attributes:
        start_time (google.protobuf.timestamp_pb2.Timestamp):
            The time the restore was started.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            The time the restore finished, unset for
            ongoing restores.
        operation_state (google.cloud.firestore_admin_v1.types.OperationState):
            The operation state of the restore.
        database (str):
            The name of the database being restored to.
        backup (str):
            The name of the backup restoring from.
        progress_percentage (google.cloud.firestore_admin_v1.types.Progress):
            How far along the restore is as an estimated
            percentage of remaining time.
    """

    start_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=1,
        message=timestamp_pb2.Timestamp,
    )
    end_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    operation_state: "OperationState" = proto.Field(
        proto.ENUM,
        number=3,
        enum="OperationState",
    )
    database: str = proto.Field(
        proto.STRING,
        number=4,
    )
    backup: str = proto.Field(
        proto.STRING,
        number=5,
    )
    progress_percentage: "Progress" = proto.Field(
        proto.MESSAGE,
        number=8,
        message="Progress",
    )


class Progress(proto.Message):
    r"""Describes the progress of the operation. Unit of work is generic and
    must be interpreted based on where
    [Progress][google.firestore.admin.v1.Progress] is used.

    Attributes:
        estimated_work (int):
            The amount of work estimated.
        completed_work (int):
            The amount of work completed.
    """

    estimated_work: int = proto.Field(
        proto.INT64,
        number=1,
    )
    completed_work: int = proto.Field(
        proto.INT64,
        number=2,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
