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

from typing import Optional, Any, Mapping
import requests
from .base import Connection

class RequestsHttpConnection(Connection):
    session: requests.Session
    def __init__(
        self,
        host: str = ...,
        port: Optional[int] = ...,
        http_auth: Optional[Any] = ...,
        use_ssl: bool = ...,
        verify_certs: bool = ...,
        ssl_show_warn: bool = ...,
        ca_certs: Optional[Any] = ...,
        client_cert: Optional[Any] = ...,
        client_key: Optional[Any] = ...,
        headers: Optional[Mapping[str, str]] = ...,
        http_compress: Optional[bool] = ...,
        cloud_id: Optional[str] = ...,
        api_key: Optional[Any] = ...,
        opaque_id: Optional[str] = ...,
        **kwargs: Any
    ) -> None: ...
