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

from google.protobuf import struct_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
from google.type import latlng_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.v1",
    manifest={
        "Document",
        "Value",
        "ArrayValue",
        "MapValue",
    },
)


class Document(proto.Message):
    r"""A Firestore document.

    Must not exceed 1 MiB - 4 bytes.

    Attributes:
        name (str):
            The resource name of the document, for example
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.
        fields (MutableMapping[str, google.cloud.firestore_v1.types.Value]):
            The document's fields.

            The map keys represent field names.

            Field names matching the regular expression ``__.*__`` are
            reserved. Reserved field names are forbidden except in
            certain documented contexts. The field names, represented as
            UTF-8, must not exceed 1,500 bytes and cannot be empty.

            Field paths may be used in other contexts to refer to
            structured fields defined here. For ``map_value``, the field
            path is represented by a dot-delimited (``.``) string of
            segments. Each segment is either a simple field name
            (defined below) or a quoted field name. For example, the
            structured field
            ``"foo" : { map_value: { "x&y" : { string_value: "hello" }}}``
            would be represented by the field path
            :literal:`foo.`x&y\``.

            A simple field name contains only characters ``a`` to ``z``,
            ``A`` to ``Z``, ``0`` to ``9``, or ``_``, and must not start
            with ``0`` to ``9``. For example, ``foo_bar_17``.

            A quoted field name starts and ends with :literal:`\`` and
            may contain any character. Some characters, including
            :literal:`\``, must be escaped using a ``\``. For example,
            :literal:`\`x&y\`` represents ``x&y`` and
            :literal:`\`bak\`tik\`` represents :literal:`bak`tik`.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The time at which the document was created.

            This value increases monotonically when a document is
            deleted then recreated. It can also be compared to values
            from other documents and the ``read_time`` of a query.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The time at which the document was last
            changed.

            This value is initially set to the ``create_time`` then
            increases monotonically with each change to the document. It
            can also be compared to values from other documents and the
            ``read_time`` of a query.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    fields: MutableMapping[str, "Value"] = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=2,
        message="Value",
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )


class Value(proto.Message):
    r"""A message that can hold any of the supported value types.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        null_value (google.protobuf.struct_pb2.NullValue):
            A null value.

            This field is a member of `oneof`_ ``value_type``.
        boolean_value (bool):
            A boolean value.

            This field is a member of `oneof`_ ``value_type``.
        integer_value (int):
            An integer value.

            This field is a member of `oneof`_ ``value_type``.
        double_value (float):
            A double value.

            This field is a member of `oneof`_ ``value_type``.
        timestamp_value (google.protobuf.timestamp_pb2.Timestamp):
            A timestamp value.

            Precise only to microseconds. When stored, any
            additional precision is rounded down.

            This field is a member of `oneof`_ ``value_type``.
        string_value (str):
            A string value.

            The string, represented as UTF-8, must not
            exceed 1 MiB - 89 bytes. Only the first 1,500
            bytes of the UTF-8 representation are considered
            by queries.

            This field is a member of `oneof`_ ``value_type``.
        bytes_value (bytes):
            A bytes value.

            Must not exceed 1 MiB - 89 bytes.
            Only the first 1,500 bytes are considered by
            queries.

            This field is a member of `oneof`_ ``value_type``.
        reference_value (str):
            A reference to a document. For example:
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.

            This field is a member of `oneof`_ ``value_type``.
        geo_point_value (google.type.latlng_pb2.LatLng):
            A geo point value representing a point on the
            surface of Earth.

            This field is a member of `oneof`_ ``value_type``.
        array_value (google.cloud.firestore_v1.types.ArrayValue):
            An array value.

            Cannot directly contain another array value,
            though can contain a map which contains another
            array.

            This field is a member of `oneof`_ ``value_type``.
        map_value (google.cloud.firestore_v1.types.MapValue):
            A map value.

            This field is a member of `oneof`_ ``value_type``.
    """

    null_value: struct_pb2.NullValue = proto.Field(
        proto.ENUM,
        number=11,
        oneof="value_type",
        enum=struct_pb2.NullValue,
    )
    boolean_value: bool = proto.Field(
        proto.BOOL,
        number=1,
        oneof="value_type",
    )
    integer_value: int = proto.Field(
        proto.INT64,
        number=2,
        oneof="value_type",
    )
    double_value: float = proto.Field(
        proto.DOUBLE,
        number=3,
        oneof="value_type",
    )
    timestamp_value: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=10,
        oneof="value_type",
        message=timestamp_pb2.Timestamp,
    )
    string_value: str = proto.Field(
        proto.STRING,
        number=17,
        oneof="value_type",
    )
    bytes_value: bytes = proto.Field(
        proto.BYTES,
        number=18,
        oneof="value_type",
    )
    reference_value: str = proto.Field(
        proto.STRING,
        number=5,
        oneof="value_type",
    )
    geo_point_value: latlng_pb2.LatLng = proto.Field(
        proto.MESSAGE,
        number=8,
        oneof="value_type",
        message=latlng_pb2.LatLng,
    )
    array_value: "ArrayValue" = proto.Field(
        proto.MESSAGE,
        number=9,
        oneof="value_type",
        message="ArrayValue",
    )
    map_value: "MapValue" = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="value_type",
        message="MapValue",
    )


class ArrayValue(proto.Message):
    r"""An array value.

    Attributes:
        values (MutableSequence[google.cloud.firestore_v1.types.Value]):
            Values in the array.
    """

    values: MutableSequence["Value"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Value",
    )


class MapValue(proto.Message):
    r"""A map value.

    Attributes:
        fields (MutableMapping[str, google.cloud.firestore_v1.types.Value]):
            The map's fields.

            The map keys represent field names. Field names matching the
            regular expression ``__.*__`` are reserved. Reserved field
            names are forbidden except in certain documented contexts.
            The map keys, represented as UTF-8, must not exceed 1,500
            bytes and cannot be empty.
    """

    fields: MutableMapping[str, "Value"] = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=1,
        message="Value",
    )


__all__ = tuple(sorted(__protobuf__.manifest))
