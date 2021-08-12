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

import logging

from typing import (
    Union,
    Optional,
    Mapping,
    Tuple,
    List,
    NoReturn,
    Dict,
    Sequence,
    Any,
    AnyStr,
    Collection,
)

logger: logging.Logger
tracer: logging.Logger

class Connection(object):
    headers: Dict[str, str]
    use_ssl: bool
    http_compress: bool
    scheme: str
    hostname: str
    port: Optional[int]
    host: str
    url_prefix: str
    timeout: Optional[Union[float, int]]
    def __init__(
        self,
        host: str = ...,
        port: Optional[int] = ...,
        use_ssl: bool = ...,
        url_prefix: str = ...,
        timeout: Optional[Union[float, int]] = ...,
        headers: Optional[Mapping[str, str]] = ...,
        http_compress: Optional[bool] = ...,
        cloud_id: Optional[str] = ...,
        api_key: Optional[Union[Tuple[str, str], List[str], str]] = ...,
        opaque_id: Optional[str] = ...,
        **kwargs: Any
    ) -> None: ...
    def __repr__(self) -> str: ...
    def __eq__(self, other: object) -> bool: ...
    def __hash__(self) -> int: ...
    def _gzip_compress(self, body: bytes) -> bytes: ...
    def _raise_warnings(self, warning_headers: Sequence[str]) -> None: ...
    def _pretty_json(self, data: Any) -> str: ...
    def _log_trace(
        self,
        method: Any,
        path: Any,
        body: Any,
        status_code: Any,
        response: Any,
        duration: Any,
    ) -> None: ...
    def perform_request(
        self,
        method: str,
        url: str,
        params: Optional[Mapping[str, Any]] = ...,
        body: Optional[bytes] = ...,
        timeout: Optional[Union[int, float]] = ...,
        ignore: Collection[int] = ...,
        headers: Optional[Mapping[str, str]] = ...,
    ) -> Tuple[int, Mapping[str, str], str]: ...
    def log_request_success(
        self,
        method: str,
        full_url: str,
        path: str,
        body: Optional[bytes],
        status_code: int,
        response: str,
        duration: float,
    ) -> None: ...
    def log_request_fail(
        self,
        method: str,
        full_url: str,
        path: str,
        body: Optional[bytes],
        duration: float,
        status_code: Optional[int] = ...,
        response: Optional[str] = ...,
        exception: Optional[Exception] = ...,
    ) -> None: ...
    def _raise_error(self, status_code: int, raw_data: str) -> NoReturn: ...
    def _get_default_user_agent(self) -> str: ...
    def _get_api_key_header_val(self, api_key: Any) -> str: ...
