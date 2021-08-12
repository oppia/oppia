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

from typing import Any, MutableMapping, Optional, Union, Collection
from .utils import NamespacedClient

class RemoteClient(NamespacedClient):
    def info(
        self,
        *,
        timeout: Optional[Any] = None,
        pretty: Optional[bool] = None,
        human: Optional[bool] = None,
        error_trace: Optional[bool] = None,
        format: Optional[str] = None,
        filter_path: Optional[Union[str, Collection[str]]] = None,
        params: Optional[MutableMapping[str, Any]] = None,
        headers: Optional[MutableMapping[str, str]] = None,
    ) -> Any: ...
