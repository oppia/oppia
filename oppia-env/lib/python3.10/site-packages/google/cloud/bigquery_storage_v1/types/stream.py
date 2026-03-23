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

from google.cloud.bigquery_storage_v1.types import arrow
from google.cloud.bigquery_storage_v1.types import avro
from google.cloud.bigquery_storage_v1.types import table as gcbs_table
from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.cloud.bigquery.storage.v1",
    manifest={
        "DataFormat",
        "ReadSession",
        "ReadStream",
        "WriteStream",
    },
)


class DataFormat(proto.Enum):
    r"""Data format for input or output data."""
    DATA_FORMAT_UNSPECIFIED = 0
    AVRO = 1
    ARROW = 2


class ReadSession(proto.Message):
    r"""Information about the ReadSession.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            Output only. Unique identifier for the session, in the form
            ``projects/{project_id}/locations/{location}/sessions/{session_id}``.
        expire_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. Time at which the session becomes invalid.
            After this time, subsequent requests to read this Session
            will return errors. The expire_time is automatically
            assigned and currently cannot be specified or updated.
        data_format (google.cloud.bigquery_storage_v1.types.DataFormat):
            Immutable. Data format of the output data.
        avro_schema (google.cloud.bigquery_storage_v1.types.AvroSchema):
            Output only. Avro schema.

            This field is a member of `oneof`_ ``schema``.
        arrow_schema (google.cloud.bigquery_storage_v1.types.ArrowSchema):
            Output only. Arrow schema.

            This field is a member of `oneof`_ ``schema``.
        table (str):
            Immutable. Table that this ReadSession is reading from, in
            the form
            ``projects/{project_id}/datasets/{dataset_id}/tables/{table_id}``
        table_modifiers (google.cloud.bigquery_storage_v1.types.ReadSession.TableModifiers):
            Optional. Any modifiers which are applied
            when reading from the specified table.
        read_options (google.cloud.bigquery_storage_v1.types.ReadSession.TableReadOptions):
            Optional. Read options for this session (e.g.
            column selection, filters).
        streams (Sequence[google.cloud.bigquery_storage_v1.types.ReadStream]):
            Output only. A list of streams created with the session.

            At least one stream is created with the session. In the
            future, larger request_stream_count values *may* result in
            this list being unpopulated, in that case, the user will
            need to use a List method to get the streams instead, which
            is not yet available.
        estimated_total_bytes_scanned (int):
            Output only. An estimate on the number of
            bytes this session will scan when all streams
            are completely consumed. This estimate is based
            on metadata from the table which might be
            incomplete or stale.
        trace_id (str):
            Optional. ID set by client to annotate a
            session identity.  This does not need to be
            strictly unique, but instead the same ID should
            be used to group logically connected sessions
            (e.g. All using the same ID for all sessions
            needed to complete a Spark SQL query is
            reasonable).
            Maximum length is 256 bytes.
    """

    class TableModifiers(proto.Message):
        r"""Additional attributes when reading a table.

        Attributes:
            snapshot_time (google.protobuf.timestamp_pb2.Timestamp):
                The snapshot time of the table. If not set,
                interpreted as now.
        """

        snapshot_time = proto.Field(
            proto.MESSAGE,
            number=1,
            message=timestamp_pb2.Timestamp,
        )

    class TableReadOptions(proto.Message):
        r"""Options dictating how we read a table.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            selected_fields (Sequence[str]):
                Names of the fields in the table that should be read. If
                empty, all fields will be read. If the specified field is a
                nested field, all the sub-fields in the field will be
                selected. The output field order is unrelated to the order
                of fields in selected_fields.
            row_restriction (str):
                SQL text filtering statement, similar to a WHERE clause in a
                query. Aggregates are not supported.

                Examples: "int_field > 5" "date_field = CAST('2014-9-27' as
                DATE)" "nullable_field is not NULL" "st_equals(geo_field,
                st_geofromtext("POINT(2, 2)"))" "numeric_field BETWEEN 1.0
                AND 5.0"

                Restricted to a maximum length for 1 MB.
            arrow_serialization_options (google.cloud.bigquery_storage_v1.types.ArrowSerializationOptions):
                Optional. Options specific to the Apache
                Arrow output format.

                This field is a member of `oneof`_ ``output_format_serialization_options``.
        """

        selected_fields = proto.RepeatedField(
            proto.STRING,
            number=1,
        )
        row_restriction = proto.Field(
            proto.STRING,
            number=2,
        )
        arrow_serialization_options = proto.Field(
            proto.MESSAGE,
            number=3,
            oneof="output_format_serialization_options",
            message=arrow.ArrowSerializationOptions,
        )

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    expire_time = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    data_format = proto.Field(
        proto.ENUM,
        number=3,
        enum="DataFormat",
    )
    avro_schema = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="schema",
        message=avro.AvroSchema,
    )
    arrow_schema = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="schema",
        message=arrow.ArrowSchema,
    )
    table = proto.Field(
        proto.STRING,
        number=6,
    )
    table_modifiers = proto.Field(
        proto.MESSAGE,
        number=7,
        message=TableModifiers,
    )
    read_options = proto.Field(
        proto.MESSAGE,
        number=8,
        message=TableReadOptions,
    )
    streams = proto.RepeatedField(
        proto.MESSAGE,
        number=10,
        message="ReadStream",
    )
    estimated_total_bytes_scanned = proto.Field(
        proto.INT64,
        number=12,
    )
    trace_id = proto.Field(
        proto.STRING,
        number=13,
    )


class ReadStream(proto.Message):
    r"""Information about a single stream that gets data out of the storage
    system. Most of the information about ``ReadStream`` instances is
    aggregated, making ``ReadStream`` lightweight.

    Attributes:
        name (str):
            Output only. Name of the stream, in the form
            ``projects/{project_id}/locations/{location}/sessions/{session_id}/streams/{stream_id}``.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class WriteStream(proto.Message):
    r"""Information about a single stream that gets data inside the
    storage system.

    Attributes:
        name (str):
            Output only. Name of the stream, in the form
            ``projects/{project}/datasets/{dataset}/tables/{table}/streams/{stream}``.
        type_ (google.cloud.bigquery_storage_v1.types.WriteStream.Type):
            Immutable. Type of the stream.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. Create time of the stream. For the \_default
            stream, this is the creation_time of the table.
        commit_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. Commit time of the stream. If a stream is of
            ``COMMITTED`` type, then it will have a commit_time same as
            ``create_time``. If the stream is of ``PENDING`` type, empty
            commit_time means it is not committed.
        table_schema (google.cloud.bigquery_storage_v1.types.TableSchema):
            Output only. The schema of the destination table. It is only
            returned in ``CreateWriteStream`` response. Caller should
            generate data that's compatible with this schema to send in
            initial ``AppendRowsRequest``. The table schema could go out
            of date during the life time of the stream.
        write_mode (google.cloud.bigquery_storage_v1.types.WriteStream.WriteMode):
            Immutable. Mode of the stream.
    """

    class Type(proto.Enum):
        r"""Type enum of the stream."""
        TYPE_UNSPECIFIED = 0
        COMMITTED = 1
        PENDING = 2
        BUFFERED = 3

    class WriteMode(proto.Enum):
        r"""Mode enum of the stream."""
        WRITE_MODE_UNSPECIFIED = 0
        INSERT = 1

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    type_ = proto.Field(
        proto.ENUM,
        number=2,
        enum=Type,
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    commit_time = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )
    table_schema = proto.Field(
        proto.MESSAGE,
        number=5,
        message=gcbs_table.TableSchema,
    )
    write_mode = proto.Field(
        proto.ENUM,
        number=7,
        enum=WriteMode,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
