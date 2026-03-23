# Copyright (C) 2019-2021 Zilliz. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

from typing import Any

from pymilvus.client.search_result import SearchResult
from pymilvus.grpc_gen import schema_pb2

from .mutation import MutationResult


# TODO(dragondriver): how could we inherit the docstring elegantly?
class BaseFuture:
    def __init__(self, future: Any) -> None:
        self._f = future if future is not None else _EmptySearchFuture()

    def result(self) -> Any:
        """Return the result from future object.

        It's a synchronous interface. It will wait executing until
        server respond or timeout occur(if specified).
        """
        return self.on_response(self._f.result())

    def on_response(self, res: Any):
        return res

    def cancel(self):
        """Cancel the request."""
        return self._f.cancel()

    def done(self):
        """Wait for request done."""
        return self._f.done()


class _EmptySearchFuture:
    def result(self) -> SearchResult:
        return SearchResult(schema_pb2.SearchResultData())

    def cancel(self) -> None:
        pass

    def done(self) -> None:
        pass


class MutationFuture(BaseFuture):
    def on_response(self, res: Any):
        return MutationResult(res)


class SearchFuture(BaseFuture):
    """SearchFuture of async already returns SearchResult, add BaseFuture
    functions into async.SearchFuture
    """
