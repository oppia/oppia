# Copyright (C) 2019-2021 Zilliz. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

from typing import Any


class MutationResult:
    def __init__(self, mr: Any) -> None:
        self._mr = mr

    @property
    def primary_keys(self):
        return self._mr.primary_keys if self._mr else []

    @property
    def insert_count(self):
        return self._mr.insert_count if self._mr else 0

    @property
    def delete_count(self):
        return self._mr.delete_count if self._mr else 0

    @property
    def upsert_count(self):
        return self._mr.upsert_count if self._mr else 0

    @property
    def timestamp(self):
        return self._mr.timestamp if self._mr else 0

    @property
    def succ_count(self):
        return self._mr.succ_count if self._mr else 0

    @property
    def err_count(self):
        return self._mr.err_count if self._mr else 0

    @property
    def succ_index(self):
        return self._mr.succ_index if self._mr else []

    @property
    def err_index(self):
        return self._mr.err_index if self._mr else []

    # The unit of this cost is vcu, similar to token
    @property
    def cost(self):
        return self._mr.cost if self._mr else 0

    def __str__(self) -> str:
        """
        Return the information of mutation result

        :return str:
            The information of mutation result.
        """
        return self._mr.__str__() if self._mr else ""

    __repr__ = __str__
