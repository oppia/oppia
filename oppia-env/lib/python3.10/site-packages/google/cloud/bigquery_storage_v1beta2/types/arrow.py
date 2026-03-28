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
    package="google.cloud.bigquery.storage.v1beta2",
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
    """

    serialized_record_batch = proto.Field(
        proto.BYTES,
        number=1,
    )


class ArrowSerializationOptions(proto.Message):
    r"""Contains options specific to Arrow Serialization.

    Attributes:
        format_ (google.cloud.bigquery_storage_v1beta2.types.ArrowSerializationOptions.Format):
            The Arrow IPC format to use.
    """

    class Format(proto.Enum):
        r"""The IPC format to use when serializing Arrow streams."""
        FORMAT_UNSPECIFIED = 0
        ARROW_0_14 = 1
        ARROW_0_15 = 2

    format_ = proto.Field(
        proto.ENUM,
        number=1,
        enum=Format,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
