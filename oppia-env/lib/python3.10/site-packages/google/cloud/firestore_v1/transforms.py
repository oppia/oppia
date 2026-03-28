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

"""Helpful constants to use for Google Cloud Firestore."""


class Sentinel(object):
    """Sentinel objects used to signal special handling."""

    __slots__ = ("description",)

    def __init__(self, description) -> None:
        self.description = description

    def __repr__(self):
        return "Sentinel: {}".format(self.description)

    def __copy__(self):
        # Sentinel identity should be preserved across copies.
        return self

    def __deepcopy__(self, memo):
        # Sentinel identity should be preserved across deep copies.
        return self


DELETE_FIELD = Sentinel("Value used to delete a field in a document.")


SERVER_TIMESTAMP = Sentinel(
    "Value used to set a document field to the server timestamp."
)


class _ValueList(object):
    """Read-only list of values.

    Args:
        values (List | Tuple): values held in the helper.
    """

    slots = ("_values",)

    def __init__(self, values) -> None:
        if not isinstance(values, (list, tuple)):
            raise ValueError("'values' must be a list or tuple.")

        if len(values) == 0:
            raise ValueError("'values' must be non-empty.")

        self._values = list(values)

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self._values == other._values

    @property
    def values(self):
        """Values to append.

        Returns (List):
            values to be appended by the transform.
        """
        return self._values


class ArrayUnion(_ValueList):
    """Field transform: appends missing values to an array field.

    See:
    https://cloud.google.com/firestore/docs/reference/rpc/google.firestore.v1#google.firestore.v1.DocumentTransform.FieldTransform.FIELDS.google.firestore.v1.ArrayValue.google.firestore.v1.DocumentTransform.FieldTransform.append_missing_elements

    Args:
        values (List | Tuple): values to append.
    """


class ArrayRemove(_ValueList):
    """Field transform: remove values from an array field.

    See:
    https://cloud.google.com/firestore/docs/reference/rpc/google.firestore.v1#google.firestore.v1.DocumentTransform.FieldTransform.FIELDS.google.firestore.v1.ArrayValue.google.firestore.v1.DocumentTransform.FieldTransform.remove_all_from_array

    Args:
        values (List | Tuple): values to remove.
    """


class _NumericValue(object):
    """Hold a single integer / float value.

    Args:
        value (float): value held in the helper.
    """

    def __init__(self, value) -> None:
        if not isinstance(value, (int, float)):
            raise ValueError("Pass an integer / float value.")

        self._value = value

    @property
    def value(self):
        """Value used by the transform.

        Returns:
            (Lloat) value passed in the constructor.
        """
        return self._value

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self._value == other._value


class Increment(_NumericValue):
    """Field transform: increment a numeric field with specified value.

    See:
    https://cloud.google.com/firestore/docs/reference/rpc/google.firestore.v1#google.firestore.v1.DocumentTransform.FieldTransform.FIELDS.google.firestore.v1.ArrayValue.google.firestore.v1.DocumentTransform.FieldTransform.increment

    Args:
        value (float): value used to increment the field.
    """


class Maximum(_NumericValue):
    """Field transform: bound numeric field with specified value.

    See:
    https://cloud.google.com/firestore/docs/reference/rpc/google.firestore.v1#google.firestore.v1.DocumentTransform.FieldTransform.FIELDS.google.firestore.v1.ArrayValue.google.firestore.v1.DocumentTransform.FieldTransform.maximum

    Args:
        value (float): value used to bound the field.
    """


class Minimum(_NumericValue):
    """Field transform: bound numeric field with specified value.

    See:
    https://cloud.google.com/firestore/docs/reference/rpc/google.firestore.v1#google.firestore.v1.DocumentTransform.FieldTransform.FIELDS.google.firestore.v1.ArrayValue.google.firestore.v1.DocumentTransform.FieldTransform.minimum

    Args:
        value (float): value used to bound the field.
    """
