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
from .errors import BulkIndexError as BulkIndexError, ScanError as ScanError
from .actions import (
    expand_action as expand_action,
    streaming_bulk as streaming_bulk,
    bulk as bulk,
    parallel_bulk as parallel_bulk,
    scan as scan,
    reindex as reindex,
    _chunk_actions as _chunk_actions,
    _process_bulk_chunk as _process_bulk_chunk,
)

try:
    # Asyncio only supported on Python 3.6+
    if sys.version_info < (3, 6):
        raise ImportError

    from .._async.helpers import (
        async_scan as async_scan,
        async_bulk as async_bulk,
        async_reindex as async_reindex,
        async_streaming_bulk as async_streaming_bulk,
    )
except (ImportError, SyntaxError):
    pass
