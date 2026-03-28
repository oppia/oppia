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

from google.cloud.recommendationengine_v1beta1.types import catalog
from google.cloud.recommendationengine_v1beta1.types import user_event
from google.protobuf import timestamp_pb2  # type: ignore
from google.rpc import status_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.cloud.recommendationengine.v1beta1",
    manifest={
        "GcsSource",
        "CatalogInlineSource",
        "UserEventInlineSource",
        "ImportErrorsConfig",
        "ImportCatalogItemsRequest",
        "ImportUserEventsRequest",
        "InputConfig",
        "ImportMetadata",
        "ImportCatalogItemsResponse",
        "ImportUserEventsResponse",
        "UserEventImportSummary",
    },
)


class GcsSource(proto.Message):
    r"""Google Cloud Storage location for input content.
    format.

    Attributes:
        input_uris (Sequence[str]):
            Required. Google Cloud Storage URIs to input files. URI can
            be up to 2000 characters long. URIs can match the full
            object path (for example,
            ``gs://bucket/directory/object.json``) or a pattern matching
            one or more files, such as ````gs://bucket/directory/*.json````.
            A request can contain at most 100 files, and each file can
            be up to 2 GB. See `Importing catalog
            information </recommendations-ai/docs/upload-catalog>`__ for
            the expected file format and setup instructions.
    """

    input_uris = proto.RepeatedField(
        proto.STRING,
        number=1,
    )


class CatalogInlineSource(proto.Message):
    r"""The inline source for the input config for ImportCatalogItems
    method.

    Attributes:
        catalog_items (Sequence[google.cloud.recommendationengine_v1beta1.types.CatalogItem]):
            Optional. A list of catalog items to
            update/create. Recommended max of 10k items.
    """

    catalog_items = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=catalog.CatalogItem,
    )


class UserEventInlineSource(proto.Message):
    r"""The inline source for the input config for ImportUserEvents
    method.

    Attributes:
        user_events (Sequence[google.cloud.recommendationengine_v1beta1.types.UserEvent]):
            Optional. A list of user events to import.
            Recommended max of 10k items.
    """

    user_events = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=user_event.UserEvent,
    )


class ImportErrorsConfig(proto.Message):
    r"""Configuration of destination for Import related errors.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        gcs_prefix (str):
            Google Cloud Storage path for import errors. This must be an
            empty, existing Cloud Storage bucket. Import errors will be
            written to a file in this bucket, one per line, as a
            JSON-encoded ``google.rpc.Status`` message.

            This field is a member of `oneof`_ ``destination``.
    """

    gcs_prefix = proto.Field(
        proto.STRING,
        number=1,
        oneof="destination",
    )


class ImportCatalogItemsRequest(proto.Message):
    r"""Request message for Import methods.

    Attributes:
        parent (str):
            Required.
            ``projects/1234/locations/global/catalogs/default_catalog``
        request_id (str):
            Optional. Unique identifier provided by
            client, within the ancestor dataset scope.
            Ensures idempotency and used for request
            deduplication. Server-generated if unspecified.
            Up to 128 characters long. This is returned as
            google.longrunning.Operation.name in the
            response.
        input_config (google.cloud.recommendationengine_v1beta1.types.InputConfig):
            Required. The desired input location of the
            data.
        errors_config (google.cloud.recommendationengine_v1beta1.types.ImportErrorsConfig):
            Optional. The desired location of errors
            incurred during the Import.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    request_id = proto.Field(
        proto.STRING,
        number=2,
    )
    input_config = proto.Field(
        proto.MESSAGE,
        number=3,
        message="InputConfig",
    )
    errors_config = proto.Field(
        proto.MESSAGE,
        number=4,
        message="ImportErrorsConfig",
    )


class ImportUserEventsRequest(proto.Message):
    r"""Request message for the ImportUserEvents request.

    Attributes:
        parent (str):
            Required.
            ``projects/1234/locations/global/catalogs/default_catalog/eventStores/default_event_store``
        request_id (str):
            Optional. Unique identifier provided by client, within the
            ancestor dataset scope. Ensures idempotency for expensive
            long running operations. Server-generated if unspecified. Up
            to 128 characters long. This is returned as
            google.longrunning.Operation.name in the response. Note that
            this field must not be set if the desired input config is
            catalog_inline_source.
        input_config (google.cloud.recommendationengine_v1beta1.types.InputConfig):
            Required. The desired input location of the
            data.
        errors_config (google.cloud.recommendationengine_v1beta1.types.ImportErrorsConfig):
            Optional. The desired location of errors
            incurred during the Import.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    request_id = proto.Field(
        proto.STRING,
        number=2,
    )
    input_config = proto.Field(
        proto.MESSAGE,
        number=3,
        message="InputConfig",
    )
    errors_config = proto.Field(
        proto.MESSAGE,
        number=4,
        message="ImportErrorsConfig",
    )


class InputConfig(proto.Message):
    r"""The input config source.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        catalog_inline_source (google.cloud.recommendationengine_v1beta1.types.CatalogInlineSource):
            The Inline source for the input content for
            Catalog items.

            This field is a member of `oneof`_ ``source``.
        gcs_source (google.cloud.recommendationengine_v1beta1.types.GcsSource):
            Google Cloud Storage location for the input
            content.

            This field is a member of `oneof`_ ``source``.
        user_event_inline_source (google.cloud.recommendationengine_v1beta1.types.UserEventInlineSource):
            The Inline source for the input content for
            UserEvents.

            This field is a member of `oneof`_ ``source``.
    """

    catalog_inline_source = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="source",
        message="CatalogInlineSource",
    )
    gcs_source = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="source",
        message="GcsSource",
    )
    user_event_inline_source = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="source",
        message="UserEventInlineSource",
    )


class ImportMetadata(proto.Message):
    r"""Metadata related to the progress of the Import operation.
    This will be returned by the
    google.longrunning.Operation.metadata field.

    Attributes:
        operation_name (str):
            Name of the operation.
        request_id (str):
            Id of the request / operation. This is
            parroting back the requestId that was passed in
            the request.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Operation create time.
        success_count (int):
            Count of entries that were processed
            successfully.
        failure_count (int):
            Count of entries that encountered errors
            while processing.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Operation last update time. If the operation
            is done, this is also the finish time.
    """

    operation_name = proto.Field(
        proto.STRING,
        number=5,
    )
    request_id = proto.Field(
        proto.STRING,
        number=3,
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )
    success_count = proto.Field(
        proto.INT64,
        number=1,
    )
    failure_count = proto.Field(
        proto.INT64,
        number=2,
    )
    update_time = proto.Field(
        proto.MESSAGE,
        number=6,
        message=timestamp_pb2.Timestamp,
    )


class ImportCatalogItemsResponse(proto.Message):
    r"""Response of the ImportCatalogItemsRequest. If the long
    running operation is done, then this message is returned by the
    google.longrunning.Operations.response field if the operation
    was successful.

    Attributes:
        error_samples (Sequence[google.rpc.status_pb2.Status]):
            A sample of errors encountered while
            processing the request.
        errors_config (google.cloud.recommendationengine_v1beta1.types.ImportErrorsConfig):
            Echoes the destination for the complete
            errors in the request if set.
    """

    error_samples = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=status_pb2.Status,
    )
    errors_config = proto.Field(
        proto.MESSAGE,
        number=2,
        message="ImportErrorsConfig",
    )


class ImportUserEventsResponse(proto.Message):
    r"""Response of the ImportUserEventsRequest. If the long running
    operation was successful, then this message is returned by the
    google.longrunning.Operations.response field if the operation
    was successful.

    Attributes:
        error_samples (Sequence[google.rpc.status_pb2.Status]):
            A sample of errors encountered while
            processing the request.
        errors_config (google.cloud.recommendationengine_v1beta1.types.ImportErrorsConfig):
            Echoes the destination for the complete
            errors if this field was set in the request.
        import_summary (google.cloud.recommendationengine_v1beta1.types.UserEventImportSummary):
            Aggregated statistics of user event import
            status.
    """

    error_samples = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=status_pb2.Status,
    )
    errors_config = proto.Field(
        proto.MESSAGE,
        number=2,
        message="ImportErrorsConfig",
    )
    import_summary = proto.Field(
        proto.MESSAGE,
        number=3,
        message="UserEventImportSummary",
    )


class UserEventImportSummary(proto.Message):
    r"""A summary of import result. The UserEventImportSummary
    summarizes the import status for user events.

    Attributes:
        joined_events_count (int):
            Count of user events imported with complete
            existing catalog information.
        unjoined_events_count (int):
            Count of user events imported, but with
            catalog information not found in the imported
            catalog.
    """

    joined_events_count = proto.Field(
        proto.INT64,
        number=1,
    )
    unjoined_events_count = proto.Field(
        proto.INT64,
        number=2,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
