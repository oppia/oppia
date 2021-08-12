#  Licensed to Elasticsearch B.V. under one or more contributor
#  license agreements. See the NOTICE file distributed with
#  this work for additional information regarding copyright
#  ownership. Elasticsearch B.V. licenses this file to you under
#  the Apache License, Version 2.0 (the "License"); you may
#  not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing,
#  software distributed under the License is distributed on an
#  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
#  specific language governing permissions and limitations
#  under the License.

import logging
from typing import Sequence, Optional, Type, Any, Union, List, Tuple, Dict
from .connection import Connection

try:
    from Queue import PriorityQueue
except ImportError:
    from queue import PriorityQueue

logger: logging.Logger

class ConnectionSelector(object):
    connection_opts: Sequence[Tuple[Connection, Any]]
    def __init__(self, opts: Sequence[Tuple[Connection, Any]]) -> None: ...
    def select(self, connections: Sequence[Connection]) -> Connection: ...

class RandomSelector(ConnectionSelector): ...
class RoundRobinSelector(ConnectionSelector): ...

class ConnectionPool(object):
    connections_opts: Sequence[Tuple[Connection, Any]]
    connections: Sequence[Connection]
    orig_connections: Tuple[Connection, ...]
    dead: PriorityQueue
    dead_count: Dict[Connection, int]
    dead_timeout: float
    timeout_cutoff: int
    selector: ConnectionSelector
    def __init__(
        self,
        connections: Sequence[Tuple[Connection, Any]],
        dead_timeout: float = ...,
        timeout_cutoff: int = ...,
        selector_class: Type[ConnectionSelector] = ...,
        randomize_hosts: bool = ...,
        **kwargs: Any
    ) -> None: ...
    def mark_dead(self, connection: Connection, now: Optional[float] = ...) -> None: ...
    def mark_live(self, connection: Connection) -> None: ...
    def resurrect(self, force: bool = ...) -> Optional[Connection]: ...
    def get_connection(self) -> Connection: ...
    def close(self) -> None: ...
    def __repr__(self) -> str: ...

class DummyConnectionPool(ConnectionPool):
    def __init__(
        self, connections: Sequence[Tuple[Connection, Any]], **kwargs: Any
    ) -> None: ...
    def get_connection(self) -> Connection: ...
    def close(self) -> None: ...
    def _noop(self, *args: Any, **kwargs: Any) -> Any: ...
    mark_dead = mark_live = resurrect = _noop

class EmptyConnectionPool(ConnectionPool):
    def __init__(self, *_: Any, **__: Any) -> None: ...
    def get_connection(self) -> Connection: ...
    def _noop(self, *args: Any, **kwargs: Any) -> Any: ...
    close = mark_dead = mark_live = resurrect = _noop
