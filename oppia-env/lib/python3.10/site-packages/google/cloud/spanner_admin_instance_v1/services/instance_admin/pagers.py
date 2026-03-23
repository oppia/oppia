# -*- coding: utf-8 -*-
# Copyright 2022 Google LLC
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
#
from typing import (
    Any,
    AsyncIterator,
    Awaitable,
    Callable,
    Sequence,
    Tuple,
    Optional,
    Iterator,
)

from google.cloud.spanner_admin_instance_v1.types import spanner_instance_admin
from google.longrunning import operations_pb2  # type: ignore


class ListInstanceConfigsPager:
    """A pager for iterating through ``list_instance_configs`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigsResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``instance_configs`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListInstanceConfigs`` requests and continue to iterate
    through the ``instance_configs`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., spanner_instance_admin.ListInstanceConfigsResponse],
        request: spanner_instance_admin.ListInstanceConfigsRequest,
        response: spanner_instance_admin.ListInstanceConfigsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigsRequest):
                The initial request object.
            response (google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_instance_admin.ListInstanceConfigsRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[spanner_instance_admin.ListInstanceConfigsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[spanner_instance_admin.InstanceConfig]:
        for page in self.pages:
            yield from page.instance_configs

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListInstanceConfigsAsyncPager:
    """A pager for iterating through ``list_instance_configs`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigsResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``instance_configs`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListInstanceConfigs`` requests and continue to iterate
    through the ``instance_configs`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[
            ..., Awaitable[spanner_instance_admin.ListInstanceConfigsResponse]
        ],
        request: spanner_instance_admin.ListInstanceConfigsRequest,
        response: spanner_instance_admin.ListInstanceConfigsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigsRequest):
                The initial request object.
            response (google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_instance_admin.ListInstanceConfigsRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(
        self,
    ) -> AsyncIterator[spanner_instance_admin.ListInstanceConfigsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[spanner_instance_admin.InstanceConfig]:
        async def async_generator():
            async for page in self.pages:
                for response in page.instance_configs:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListInstanceConfigOperationsPager:
    """A pager for iterating through ``list_instance_config_operations`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigOperationsResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``operations`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListInstanceConfigOperations`` requests and continue to iterate
    through the ``operations`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigOperationsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[
            ..., spanner_instance_admin.ListInstanceConfigOperationsResponse
        ],
        request: spanner_instance_admin.ListInstanceConfigOperationsRequest,
        response: spanner_instance_admin.ListInstanceConfigOperationsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigOperationsRequest):
                The initial request object.
            response (google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigOperationsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_instance_admin.ListInstanceConfigOperationsRequest(
            request
        )
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(
        self,
    ) -> Iterator[spanner_instance_admin.ListInstanceConfigOperationsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[operations_pb2.Operation]:
        for page in self.pages:
            yield from page.operations

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListInstanceConfigOperationsAsyncPager:
    """A pager for iterating through ``list_instance_config_operations`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigOperationsResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``operations`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListInstanceConfigOperations`` requests and continue to iterate
    through the ``operations`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigOperationsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[
            ..., Awaitable[spanner_instance_admin.ListInstanceConfigOperationsResponse]
        ],
        request: spanner_instance_admin.ListInstanceConfigOperationsRequest,
        response: spanner_instance_admin.ListInstanceConfigOperationsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigOperationsRequest):
                The initial request object.
            response (google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigOperationsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_instance_admin.ListInstanceConfigOperationsRequest(
            request
        )
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(
        self,
    ) -> AsyncIterator[spanner_instance_admin.ListInstanceConfigOperationsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[operations_pb2.Operation]:
        async def async_generator():
            async for page in self.pages:
                for response in page.operations:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListInstancesPager:
    """A pager for iterating through ``list_instances`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_instance_v1.types.ListInstancesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``instances`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListInstances`` requests and continue to iterate
    through the ``instances`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_instance_v1.types.ListInstancesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., spanner_instance_admin.ListInstancesResponse],
        request: spanner_instance_admin.ListInstancesRequest,
        response: spanner_instance_admin.ListInstancesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_instance_v1.types.ListInstancesRequest):
                The initial request object.
            response (google.cloud.spanner_admin_instance_v1.types.ListInstancesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_instance_admin.ListInstancesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[spanner_instance_admin.ListInstancesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[spanner_instance_admin.Instance]:
        for page in self.pages:
            yield from page.instances

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListInstancesAsyncPager:
    """A pager for iterating through ``list_instances`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_instance_v1.types.ListInstancesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``instances`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListInstances`` requests and continue to iterate
    through the ``instances`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_instance_v1.types.ListInstancesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[spanner_instance_admin.ListInstancesResponse]],
        request: spanner_instance_admin.ListInstancesRequest,
        response: spanner_instance_admin.ListInstancesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_instance_v1.types.ListInstancesRequest):
                The initial request object.
            response (google.cloud.spanner_admin_instance_v1.types.ListInstancesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_instance_admin.ListInstancesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(
        self,
    ) -> AsyncIterator[spanner_instance_admin.ListInstancesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[spanner_instance_admin.Instance]:
        async def async_generator():
            async for page in self.pages:
                for response in page.instances:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)
