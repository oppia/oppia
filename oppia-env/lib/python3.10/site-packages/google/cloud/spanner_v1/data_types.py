# Copyright 2021 Google LLC
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

"""Custom data types for spanner."""

import json


class JsonObject(dict):
    """
    Provides functionality of JSON data type in Cloud Spanner
    API, mimicking simple `dict()` behaviour and making
    all the necessary conversions under the hood.
    """

    def __init__(self, *args, **kwargs):
        self._is_null = (args, kwargs) == ((), {}) or args == (None,)
        self._is_array = len(args) and isinstance(args[0], (list, tuple))

        # if the JSON object is represented with an array,
        # the value is contained separately
        if self._is_array:
            self._array_value = args[0]
            return

        if not self._is_null:
            super(JsonObject, self).__init__(*args, **kwargs)

    def __repr__(self):
        if self._is_array:
            return str(self._array_value)

        return super(JsonObject, self).__repr__()

    @classmethod
    def from_str(cls, str_repr):
        """Initiate an object from its `str` representation.

        Args:
            str_repr (str): JSON text representation.

        Returns:
            JsonObject: JSON object.
        """
        if str_repr == "null":
            return cls()

        return cls(json.loads(str_repr))

    def serialize(self):
        """Return the object text representation.

        Returns:
            str: JSON object text representation.
        """
        if self._is_null:
            return None

        if self._is_array:
            return json.dumps(self._array_value, sort_keys=True, separators=(",", ":"))

        return json.dumps(self, sort_keys=True, separators=(",", ":"))
