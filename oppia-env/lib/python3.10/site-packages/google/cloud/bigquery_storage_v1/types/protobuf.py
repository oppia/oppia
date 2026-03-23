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

from google.protobuf import descriptor_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.cloud.bigquery.storage.v1",
    manifest={
        "ProtoSchema",
        "ProtoRows",
    },
)


class ProtoSchema(proto.Message):
    r"""ProtoSchema describes the schema of the serialized protocol
    buffer data rows.

    Attributes:
        proto_descriptor (google.protobuf.descriptor_pb2.DescriptorProto):
            Descriptor for input message. The provided descriptor must
            be self contained, such that data rows sent can be fully
            decoded using only the single descriptor. For data rows that
            are compositions of multiple independent messages, this
            means the descriptor may need to be transformed to only use
            nested types:
            https://developers.google.com/protocol-buffers/docs/proto#nested

            For additional information for how proto types and values
            map onto BigQuery see:
            https://cloud.google.com/bigquery/docs/write-api#data_type_conversions
    """

    proto_descriptor = proto.Field(
        proto.MESSAGE,
        number=1,
        message=descriptor_pb2.DescriptorProto,
    )


class ProtoRows(proto.Message):
    r"""

    Attributes:
        serialized_rows (Sequence[bytes]):
            A sequence of rows serialized as a Protocol
            Buffer.
            See
            https://developers.google.com/protocol-buffers/docs/overview
            for more information on deserializing this
            field.
    """

    serialized_rows = proto.RepeatedField(
        proto.BYTES,
        number=1,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
