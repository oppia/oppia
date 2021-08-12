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

from typing import (
    Callable,
    Optional,
    Union,
    Collection,
    Type,
    Mapping,
    Any,
    Dict,
    List,
)

from .connection import Connection
from .connection_pool import ConnectionPool
from .serializer import Serializer, Deserializer

def get_host_info(
    node_info: Dict[str, Any], host: Optional[Dict[str, Any]]
) -> Optional[Dict[str, Any]]: ...

class Transport(object):
    DEFAULT_CONNECTION_CLASS: Type[Connection]
    connection_pool: ConnectionPool
    deserializer: Deserializer

    max_retries: int
    retry_on_timeout: bool
    retry_on_status: Collection[int]
    send_get_body_as: str
    serializer: Serializer
    connection_pool_class: Type[ConnectionPool]
    connection_class: Type[Connection]
    kwargs: Any
    hosts: Optional[List[Dict[str, Any]]]
    seed_connections: List[Connection]
    sniffer_timeout: Optional[float]
    sniff_on_start: bool
    sniff_on_connection_fail: bool
    last_sniff: float
    sniff_timeout: Optional[float]
    host_info_callback: Callable[
        [Dict[str, Any], Optional[Dict[str, Any]]], Optional[Dict[str, Any]]
    ]
    def __init__(
        self,
        hosts: Any,
        connection_class: Optional[Type[Any]] = ...,
        connection_pool_class: Type[ConnectionPool] = ...,
        host_info_callback: Callable[
            [Dict[str, Any], Optional[Dict[str, Any]]], Optional[Dict[str, Any]]
        ] = ...,
        sniff_on_start: bool = ...,
        sniffer_timeout: Optional[float] = ...,
        sniff_timeout: float = ...,
        sniff_on_connection_fail: bool = ...,
        serializer: Serializer = ...,
        serializers: Optional[Mapping[str, Serializer]] = ...,
        default_mimetype: str = ...,
        max_retries: int = ...,
        retry_on_status: Collection[int] = ...,
        retry_on_timeout: bool = ...,
        send_get_body_as: str = ...,
        **kwargs: Any
    ) -> None: ...
    def add_connection(self, host: Any) -> None: ...
    def set_connections(self, hosts: Collection[Any]) -> None: ...
    def get_connection(self) -> Connection: ...
    def sniff_hosts(self, initial: bool = ...) -> None: ...
    def mark_dead(self, connection: Connection) -> None: ...
    def perform_request(
        self,
        method: str,
        url: str,
        headers: Optional[Mapping[str, str]] = ...,
        params: Optional[Mapping[str, Any]] = ...,
        body: Optional[Any] = ...,
    ) -> Union[bool, Any]: ...
    def close(self) -> None: ...
