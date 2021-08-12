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

import sys
from typing import Tuple

from .client import Elasticsearch as Elasticsearch
from .transport import Transport as Transport
from .connection_pool import (
    ConnectionPool as ConnectionPool,
    ConnectionSelector as ConnectionSelector,
    RoundRobinSelector as RoundRobinSelector,
)
from .serializer import JSONSerializer as JSONSerializer
from .connection import (
    Connection as Connection,
    RequestsHttpConnection as RequestsHttpConnection,
    Urllib3HttpConnection as Urllib3HttpConnection,
)
from .exceptions import (
    ImproperlyConfigured as ImproperlyConfigured,
    ElasticsearchException as ElasticsearchException,
    SerializationError as SerializationError,
    TransportError as TransportError,
    NotFoundError as NotFoundError,
    ConflictError as ConflictError,
    RequestError as RequestError,
    ConnectionError as ConnectionError,
    SSLError as SSLError,
    ConnectionTimeout as ConnectionTimeout,
    AuthenticationException as AuthenticationException,
    AuthorizationException as AuthorizationException,
    ElasticsearchDeprecationWarning as ElasticsearchDeprecationWarning,
)

try:
    if sys.version_info < (3, 6):
        raise ImportError

    from ._async.http_aiohttp import AIOHttpConnection as AIOHttpConnection
    from ._async.transport import AsyncTransport as AsyncTransport
    from ._async.client import AsyncElasticsearch as AsyncElasticsearch
except (ImportError, SyntaxError):
    pass

VERSION: Tuple[int, int, int]
__version__: Tuple[int, int, int]
__versionstr__: str
