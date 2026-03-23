# -*- coding: utf-8 -*-
# Copyright 2024 Google LLC
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

import collections
from typing import Sequence


class Vector(collections.abc.Sequence):
    r"""A class to represent Firestore Vector in python.

    Underlying object will be converted to a map representation in Firestore API.
    """

    _value: Sequence[float] = ()

    def __init__(self, value: Sequence[float]):
        self._value = tuple([float(v) for v in value])

    def __getitem__(self, arg):
        return self._value[arg]

    def __len__(self):
        return len(self._value)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Vector):
            return False
        return self._value == other._value

    def __repr__(self):
        return f"Vector<{str(self._value)[1:-1]}>"

    def to_map_value(self):
        return {"__type__": "__vector__", "value": self._value}
