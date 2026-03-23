# Copyright 2017 Google LLC All rights reserved.
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

import math
from enum import Enum
from typing import Any

from google.cloud.firestore_v1._helpers import decode_value
from google.cloud.firestore_v1._helpers import GeoPoint


class TypeOrder(Enum):
    """The supported Data Type.

    Note: The Enum value does not imply the sort order.
    """

    NULL = 0
    BOOLEAN = 1
    NUMBER = 2
    TIMESTAMP = 3
    STRING = 4
    BLOB = 5
    REF = 6
    GEO_POINT = 7
    ARRAY = 8
    OBJECT = 9
    VECTOR = 10

    @staticmethod
    def from_value(value) -> Any:
        v = value._pb.WhichOneof("value_type")
        lut = {
            "null_value": TypeOrder.NULL,
            "boolean_value": TypeOrder.BOOLEAN,
            "integer_value": TypeOrder.NUMBER,
            "double_value": TypeOrder.NUMBER,
            "timestamp_value": TypeOrder.TIMESTAMP,
            "string_value": TypeOrder.STRING,
            "bytes_value": TypeOrder.BLOB,
            "reference_value": TypeOrder.REF,
            "geo_point_value": TypeOrder.GEO_POINT,
            "array_value": TypeOrder.ARRAY,
            "map_value": TypeOrder.OBJECT,
        }

        if v not in lut:
            raise ValueError(f"Could not detect value type for {v}")

        if v == "map_value":
            if (
                "__type__" in value.map_value.fields
                and value.map_value.fields["__type__"].string_value == "__vector__"
            ):
                return TypeOrder.VECTOR
        return lut[v]


# NOTE: This order is defined by the backend and cannot be changed.
_TYPE_ORDER_MAP = {
    TypeOrder.NULL: 0,
    TypeOrder.BOOLEAN: 1,
    TypeOrder.NUMBER: 2,
    TypeOrder.TIMESTAMP: 3,
    TypeOrder.STRING: 4,
    TypeOrder.BLOB: 5,
    TypeOrder.REF: 6,
    TypeOrder.GEO_POINT: 7,
    TypeOrder.ARRAY: 8,
    TypeOrder.VECTOR: 9,
    TypeOrder.OBJECT: 10,
}


class Order(object):
    """
    Order implements the ordering semantics of the backend.
    """

    @classmethod
    def compare(cls, left, right) -> int:
        """
        Main comparison function for all Firestore types.
        @return -1 is left < right, 0 if left == right, otherwise 1
        """
        # First compare the types.
        leftType = TypeOrder.from_value(left)
        rightType = TypeOrder.from_value(right)
        if leftType != rightType:
            if _TYPE_ORDER_MAP[leftType] < _TYPE_ORDER_MAP[rightType]:
                return -1
            else:
                return 1

        if leftType == TypeOrder.NULL:
            return 0  # nulls are all equal
        elif leftType == TypeOrder.BOOLEAN:
            return cls._compare_to(left.boolean_value, right.boolean_value)
        elif leftType == TypeOrder.NUMBER:
            return cls.compare_numbers(left, right)
        elif leftType == TypeOrder.TIMESTAMP:
            return cls.compare_timestamps(left, right)
        elif leftType == TypeOrder.STRING:
            return cls._compare_to(left.string_value, right.string_value)
        elif leftType == TypeOrder.BLOB:
            return cls.compare_blobs(left, right)
        elif leftType == TypeOrder.REF:
            return cls.compare_resource_paths(left, right)
        elif leftType == TypeOrder.GEO_POINT:
            return cls.compare_geo_points(left, right)
        elif leftType == TypeOrder.ARRAY:
            return cls.compare_arrays(left, right)
        elif leftType == TypeOrder.VECTOR:
            # ARRAYs < VECTORs < MAPs
            return cls.compare_vectors(left, right)
        elif leftType == TypeOrder.OBJECT:
            return cls.compare_objects(left, right)
        else:
            raise ValueError(f"Unknown TypeOrder {leftType}")

    @staticmethod
    def compare_blobs(left, right) -> int:
        left_bytes = left.bytes_value
        right_bytes = right.bytes_value

        return Order._compare_to(left_bytes, right_bytes)

    @staticmethod
    def compare_timestamps(left, right) -> Any:
        left = left._pb.timestamp_value
        right = right._pb.timestamp_value

        seconds = Order._compare_to(left.seconds or 0, right.seconds or 0)
        if seconds != 0:
            return seconds

        return Order._compare_to(left.nanos or 0, right.nanos or 0)

    @staticmethod
    def compare_geo_points(left, right) -> Any:
        left_value = decode_value(left, None)
        right_value = decode_value(right, None)
        if not isinstance(left_value, GeoPoint) or not isinstance(
            right_value, GeoPoint
        ):
            raise AttributeError("invalid geopoint encountered")
        cmp = (left_value.latitude > right_value.latitude) - (
            left_value.latitude < right_value.latitude
        )

        if cmp != 0:
            return cmp
        return (left_value.longitude > right_value.longitude) - (
            left_value.longitude < right_value.longitude
        )

    @staticmethod
    def compare_resource_paths(left, right) -> int:
        left = left.reference_value
        right = right.reference_value

        left_segments = left.split("/")
        right_segments = right.split("/")
        shorter = min(len(left_segments), len(right_segments))
        # compare segments
        for i in range(shorter):
            if left_segments[i] < right_segments[i]:
                return -1
            if left_segments[i] > right_segments[i]:
                return 1

        left_length = len(left)
        right_length = len(right)
        return (left_length > right_length) - (left_length < right_length)

    @staticmethod
    def compare_arrays(left, right) -> int:
        l_values = left.array_value.values
        r_values = right.array_value.values

        length = min(len(l_values), len(r_values))
        for i in range(length):
            cmp = Order.compare(l_values[i], r_values[i])
            if cmp != 0:
                return cmp

        return Order._compare_to(len(l_values), len(r_values))

    @staticmethod
    def compare_vectors(left, right) -> int:
        # First compare the size of vector.
        l_values = left.map_value.fields["value"]
        r_values = right.map_value.fields["value"]

        left_length = len(l_values.array_value.values)
        right_length = len(r_values.array_value.values)

        if left_length != right_length:
            return Order._compare_to(left_length, right_length)

        # Compare element if the size matches.
        return Order.compare_arrays(l_values, r_values)

    @staticmethod
    def compare_objects(left, right) -> int:
        left_fields = left.map_value.fields
        right_fields = right.map_value.fields

        for left_key, right_key in zip(sorted(left_fields), sorted(right_fields)):
            keyCompare = Order._compare_to(left_key, right_key)
            if keyCompare != 0:
                return keyCompare

            value_compare = Order.compare(
                left_fields[left_key], right_fields[right_key]
            )
            if value_compare != 0:
                return value_compare

        return Order._compare_to(len(left_fields), len(right_fields))

    @staticmethod
    def compare_numbers(left, right) -> int:
        left_value = decode_value(left, None)
        right_value = decode_value(right, None)
        return Order.compare_doubles(left_value, right_value)

    @staticmethod
    def compare_doubles(left, right) -> int:
        if math.isnan(left):
            if math.isnan(right):
                return 0
            return -1
        if math.isnan(right):
            return 1

        return Order._compare_to(left, right)

    @staticmethod
    def _compare_to(left, right) -> int:
        # We can't just use cmp(left, right) because cmp doesn't exist
        # in Python 3, so this is an equivalent suggested by
        # https://docs.python.org/3.0/whatsnew/3.0.html#ordering-comparisons
        return (left > right) - (left < right)
