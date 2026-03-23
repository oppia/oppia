#  Licensed to Elasticsearch B.V. under one or more contributor
#  license agreements. See the NOTICE file distributed with
#  this work for additional information regarding copyright
#  ownership. Elasticsearch B.V. licenses this file to you under
#  the Apache License, Version 2.0 (the "License"); you may
#  not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
# 	http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing,
#  software distributed under the License is distributed on an
#  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
#  specific language governing permissions and limitations
#  under the License.

from typing import Any, Dict, List, Tuple, Type


class BulkIndexError(Exception):
    def __init__(self, message: str, errors: List[Dict[str, Any]]):
        super().__init__(message)
        self.errors: List[Dict[str, Any]] = errors

    def __reduce__(
        self,
    ) -> Tuple[Type["BulkIndexError"], Tuple[str, List[Dict[str, Any]]]]:
        return (self.__class__, (self.args[0], self.errors))


class ScanError(Exception):
    scroll_id: str

    def __init__(self, scroll_id: str, *args: Any) -> None:
        super().__init__(*args)
        self.scroll_id = scroll_id

    def __reduce__(self) -> Tuple[Type["ScanError"], Tuple[str, str]]:
        return (self.__class__, (self.scroll_id,) + self.args)
