# Copyright 2017 gRPC authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Base class for interceptors that operate on all RPC types."""

from typing import Any, Callable, List, NamedTuple, Optional, Tuple

import grpc


def _api_level_md(**kwargs) -> Optional[List[Tuple]]:
    metadata = None
    client_request_id = kwargs.get("client-request-id", kwargs.get("client_request_id"))
    if client_request_id:
        metadata = metadata if metadata else []
        metadata.append(("client-request-id", client_request_id))
    return metadata


class _GenericClientInterceptor(
    grpc.UnaryUnaryClientInterceptor,
    grpc.UnaryStreamClientInterceptor,
    grpc.StreamUnaryClientInterceptor,
    grpc.StreamStreamClientInterceptor,
):
    def __init__(self, interceptor_function: Callable) -> None:
        super().__init__()
        self._fn = interceptor_function

    def intercept_unary_unary(self, continuation: Callable, client_call_details: Any, request: Any):
        new_details, new_request_iterator, postprocess = self._fn(
            client_call_details, iter((request,))
        )
        response = continuation(new_details, next(new_request_iterator))
        return postprocess(response) if postprocess else response

    def intercept_unary_stream(
        self,
        continuation: Callable,
        client_call_details: Any,
        request: Any,
    ):
        new_details, new_request_iterator, postprocess = self._fn(
            client_call_details, iter((request,))
        )
        response_it = continuation(new_details, next(new_request_iterator))
        return postprocess(response_it) if postprocess else response_it

    def intercept_stream_unary(
        self,
        continuation: Callable,
        client_call_details: Any,
        request_iterator: Any,
    ):
        new_details, new_request_iterator, postprocess = self._fn(
            client_call_details, request_iterator
        )
        response = continuation(new_details, new_request_iterator)
        return postprocess(response) if postprocess else response

    def intercept_stream_stream(
        self,
        continuation: Callable,
        client_call_details: Any,
        request_iterator: Any,
    ):
        new_details, new_request_iterator, postprocess = self._fn(
            client_call_details, request_iterator
        )
        response_it = continuation(new_details, new_request_iterator)
        return postprocess(response_it) if postprocess else response_it


class ClientCallDetailsTuple(NamedTuple):
    method: Any
    timeout: Any
    metadata: Any
    credentials: Any


class _ClientCallDetails(ClientCallDetailsTuple, grpc.ClientCallDetails):
    pass


def header_adder_interceptor(headers: List, values: List):
    def intercept_call(
        client_call_details: Any,
        request_iterator: Any,
    ):
        metadata = []
        if client_call_details.metadata is not None:
            metadata = list(client_call_details.metadata)
        for item in zip(headers, values):
            metadata.append(item)
        client_call_details = _ClientCallDetails(
            client_call_details.method,
            client_call_details.timeout,
            metadata,
            client_call_details.credentials,
        )
        return client_call_details, request_iterator, None

    return _GenericClientInterceptor(intercept_call)
