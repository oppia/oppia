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


__protobuf__ = proto.module(
    package="google.cloud.bigquery.storage.v1",
    manifest={
        "ArrowSchema",
        "ArrowRecordBatch",
        "ArrowSerializationOptions",
    },
)


class ArrowSchema(proto.Message):
    r"""Arrow schema as specified in
    https://arrow.apache.org/docs/python/api/datatypes.html and
    serialized to bytes using IPC:
    https://arrow.apache.org/docs/format/Columnar.html#serialization-and-interprocess-communication-ipc
    See code samples on how this message can be deserialized.

    Attributes:
        serialized_schema (bytes):
            IPC serialized Arrow schema.
    """

    serialized_schema = proto.Field(
        proto.BYTES,
        number=1,
    )


class ArrowRecordBatch(proto.Message):
    r"""Arrow RecordBatch.

    Attributes:
        serialized_record_batch (bytes):
            IPC-serialized Arrow RecordBatch.
        row_count (int):
            [Deprecated] The count of rows in
            ``serialized_record_batch``. Please use the
            format-independent ReadRowsResponse.row_count instead.
    """

    serialized_record_batch = proto.Field(
        proto.BYTES,
        number=1,
    )
    row_count = proto.Field(
        proto.INT64,
        number=2,
    )


class ArrowSerializationOptions(proto.Message):
    r"""Contains options specific to Arrow Serialization.

    Attributes:
        buffer_compression (google.cloud.bigquery_storage_v1.types.ArrowSerializationOptions.CompressionCodec):
            The compression codec to use for Arrow
            buffers in serialized record batches.
    """

    class CompressionCodec(proto.Enum):
        r"""Compression codec's supported by Arrow."""
        COMPRESSION_UNSPECIFIED = 0
        LZ4_FRAME = 1
        ZSTD = 2

    buffer_compression = proto.Field(
        proto.ENUM,
        number=2,
        enum=CompressionCodec,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
