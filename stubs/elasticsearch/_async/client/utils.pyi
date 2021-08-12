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

from ...client.utils import (  # noqa
    _make_path as _make_path,
    _normalize_hosts as _normalize_hosts,
    _escape as _escape,
    _bulk_body as _bulk_body,
    query_params as query_params,
    SKIP_IN_PATH as SKIP_IN_PATH,
)
from ..transport import AsyncTransport
from ..client import AsyncElasticsearch

class NamespacedClient:
    client: AsyncElasticsearch
    def __init__(self, client: AsyncElasticsearch) -> None: ...
    @property
    def transport(self) -> AsyncTransport: ...
