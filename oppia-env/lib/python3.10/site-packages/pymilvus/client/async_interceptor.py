from typing import (
    Any,
    Callable,
    List,
    Union,
)

from grpc.aio import (
    ClientCallDetails,
    StreamStreamClientInterceptor,
    StreamUnaryClientInterceptor,
    UnaryStreamClientInterceptor,
    UnaryUnaryClientInterceptor,
)
from grpc.aio._call import (
    StreamStreamCall,
    StreamUnaryCall,
    UnaryStreamCall,
    UnaryUnaryCall,
)
from grpc.aio._typing import (
    RequestIterableType,
    RequestType,
    ResponseIterableType,
    ResponseType,
)


class _GenericAsyncClientInterceptor(
    UnaryUnaryClientInterceptor,
    UnaryStreamClientInterceptor,
    StreamUnaryClientInterceptor,
    StreamStreamClientInterceptor,
):
    def __init__(self, interceptor_function: Callable):
        self._fn = interceptor_function

    async def intercept_unary_unary(
        self,
        continuation: Callable[[ClientCallDetails, RequestType], UnaryUnaryCall],
        client_call_details: ClientCallDetails,
        request: RequestType,
    ) -> Union[UnaryUnaryCall, ResponseType]:
        new_details, new_request = self._fn(client_call_details, request)
        return await continuation(new_details, new_request)

    async def intercept_unary_stream(
        self,
        continuation: Callable[[ClientCallDetails, RequestType], UnaryStreamCall],
        client_call_details: ClientCallDetails,
        request: RequestType,
    ) -> Union[ResponseIterableType, UnaryStreamCall]:
        new_details, new_request = self._fn(client_call_details, request)
        return await continuation(new_details, new_request)

    async def intercept_stream_unary(
        self,
        continuation: Callable[[ClientCallDetails, RequestType], StreamUnaryCall],
        client_call_details: ClientCallDetails,
        request_iterator: RequestIterableType,
    ) -> StreamUnaryCall:
        new_details, new_request_iterator = self._fn(client_call_details, request_iterator)
        return await continuation(new_details, new_request_iterator)

    async def intercept_stream_stream(
        self,
        continuation: Callable[[ClientCallDetails, RequestType], StreamStreamCall],
        client_call_details: ClientCallDetails,
        request_iterator: RequestIterableType,
    ) -> Union[ResponseIterableType, StreamStreamCall]:
        new_details, new_request_iterator = self._fn(client_call_details, request_iterator)
        return await continuation(new_details, new_request_iterator)


def async_header_adder_interceptor(headers: List[str], values: Union[List[str], List[bytes]]):
    def intercept_call(client_call_details: ClientCallDetails, request: Any):
        metadata = []
        if client_call_details.metadata:
            metadata = list(client_call_details.metadata)

        for header, value in zip(headers, values):
            metadata.append((header, value))

        new_details = ClientCallDetails(
            method=client_call_details.method,
            timeout=client_call_details.timeout,
            metadata=metadata,
            credentials=client_call_details.credentials,
            wait_for_ready=client_call_details.wait_for_ready,
        )

        return new_details, request

    return _GenericAsyncClientInterceptor(intercept_call)
