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
    package="google.spanner.v1",
    manifest={
        "TypeCode",
        "TypeAnnotationCode",
        "Type",
        "StructType",
    },
)


class TypeCode(proto.Enum):
    r"""``TypeCode`` is used as part of [Type][google.spanner.v1.Type] to
    indicate the type of a Cloud Spanner value.

    Each legal value of a type can be encoded to or decoded from a JSON
    value, using the encodings described below. All Cloud Spanner values
    can be ``null``, regardless of type; ``null``\ s are always encoded
    as a JSON ``null``.
    """
    TYPE_CODE_UNSPECIFIED = 0
    BOOL = 1
    INT64 = 2
    FLOAT64 = 3
    TIMESTAMP = 4
    DATE = 5
    STRING = 6
    BYTES = 7
    ARRAY = 8
    STRUCT = 9
    NUMERIC = 10
    JSON = 11


class TypeAnnotationCode(proto.Enum):
    r"""``TypeAnnotationCode`` is used as a part of
    [Type][google.spanner.v1.Type] to disambiguate SQL types that should
    be used for a given Cloud Spanner value. Disambiguation is needed
    because the same Cloud Spanner type can be mapped to different SQL
    types depending on SQL dialect. TypeAnnotationCode doesn't affect
    the way value is serialized.
    """
    TYPE_ANNOTATION_CODE_UNSPECIFIED = 0
    PG_NUMERIC = 2
    PG_JSONB = 3


class Type(proto.Message):
    r"""``Type`` indicates the type of a Cloud Spanner value, as might be
    stored in a table cell or returned from an SQL query.

    Attributes:
        code (google.cloud.spanner_v1.types.TypeCode):
            Required. The [TypeCode][google.spanner.v1.TypeCode] for
            this type.
        array_element_type (google.cloud.spanner_v1.types.Type):
            If [code][google.spanner.v1.Type.code] ==
            [ARRAY][google.spanner.v1.TypeCode.ARRAY], then
            ``array_element_type`` is the type of the array elements.
        struct_type (google.cloud.spanner_v1.types.StructType):
            If [code][google.spanner.v1.Type.code] ==
            [STRUCT][google.spanner.v1.TypeCode.STRUCT], then
            ``struct_type`` provides type information for the struct's
            fields.
        type_annotation (google.cloud.spanner_v1.types.TypeAnnotationCode):
            The
            [TypeAnnotationCode][google.spanner.v1.TypeAnnotationCode]
            that disambiguates SQL type that Spanner will use to
            represent values of this type during query processing. This
            is necessary for some type codes because a single
            [TypeCode][google.spanner.v1.TypeCode] can be mapped to
            different SQL types depending on the SQL dialect.
            [type_annotation][google.spanner.v1.Type.type_annotation]
            typically is not needed to process the content of a value
            (it doesn't affect serialization) and clients can ignore it
            on the read path.
    """

    code = proto.Field(
        proto.ENUM,
        number=1,
        enum="TypeCode",
    )
    array_element_type = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Type",
    )
    struct_type = proto.Field(
        proto.MESSAGE,
        number=3,
        message="StructType",
    )
    type_annotation = proto.Field(
        proto.ENUM,
        number=4,
        enum="TypeAnnotationCode",
    )


class StructType(proto.Message):
    r"""``StructType`` defines the fields of a
    [STRUCT][google.spanner.v1.TypeCode.STRUCT] type.

    Attributes:
        fields (Sequence[google.cloud.spanner_v1.types.StructType.Field]):
            The list of fields that make up this struct. Order is
            significant, because values of this struct type are
            represented as lists, where the order of field values
            matches the order of fields in the
            [StructType][google.spanner.v1.StructType]. In turn, the
            order of fields matches the order of columns in a read
            request, or the order of fields in the ``SELECT`` clause of
            a query.
    """

    class Field(proto.Message):
        r"""Message representing a single field of a struct.

        Attributes:
            name (str):
                The name of the field. For reads, this is the column name.
                For SQL queries, it is the column alias (e.g., ``"Word"`` in
                the query ``"SELECT 'hello' AS Word"``), or the column name
                (e.g., ``"ColName"`` in the query
                ``"SELECT ColName FROM Table"``). Some columns might have an
                empty name (e.g., ``"SELECT UPPER(ColName)"``). Note that a
                query result can contain multiple fields with the same name.
            type_ (google.cloud.spanner_v1.types.Type):
                The type of the field.
        """

        name = proto.Field(
            proto.STRING,
            number=1,
        )
        type_ = proto.Field(
            proto.MESSAGE,
            number=2,
            message="Type",
        )

    fields = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=Field,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
