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

from __future__ import unicode_literals

from typing import (
    Collection,
    Any,
    Optional,
    Union,
    Dict,
    List,
    Tuple,
    Callable,
    TypeVar,
)
from ..client import Elasticsearch
from ..serializer import Serializer
from ..transport import Transport

T = TypeVar("T")
SKIP_IN_PATH: Collection[Any]

def _normalize_hosts(
    hosts: Optional[Union[str, Collection[Union[str, Dict[str, Any]]]]]
) -> List[Dict[str, Any]]: ...
def _escape(value: Any) -> str: ...
def _make_path(*parts: Any) -> str: ...

GLOBAL_PARAMS: Tuple[str, ...]

def query_params(
    *es_query_params: str,
) -> Callable[[Callable[..., T]], Callable[..., T]]: ...
def _bulk_body(
    serializer: Serializer, body: Union[str, bytes, Collection[Any]]
) -> str: ...

class NamespacedClient:
    client: Elasticsearch
    def __init__(self, client: Elasticsearch) -> None: ...
    @property
    def transport(self) -> Transport: ...
