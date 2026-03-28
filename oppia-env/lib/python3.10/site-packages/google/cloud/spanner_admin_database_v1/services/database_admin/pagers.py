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

from google.cloud.spanner_admin_database_v1.types import backup
from google.cloud.spanner_admin_database_v1.types import spanner_database_admin
from google.longrunning import operations_pb2  # type: ignore


class ListDatabasesPager:
    """A pager for iterating through ``list_databases`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_database_v1.types.ListDatabasesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``databases`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListDatabases`` requests and continue to iterate
    through the ``databases`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_database_v1.types.ListDatabasesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., spanner_database_admin.ListDatabasesResponse],
        request: spanner_database_admin.ListDatabasesRequest,
        response: spanner_database_admin.ListDatabasesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_database_v1.types.ListDatabasesRequest):
                The initial request object.
            response (google.cloud.spanner_admin_database_v1.types.ListDatabasesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_database_admin.ListDatabasesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[spanner_database_admin.ListDatabasesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[spanner_database_admin.Database]:
        for page in self.pages:
            yield from page.databases

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListDatabasesAsyncPager:
    """A pager for iterating through ``list_databases`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_database_v1.types.ListDatabasesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``databases`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListDatabases`` requests and continue to iterate
    through the ``databases`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_database_v1.types.ListDatabasesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[spanner_database_admin.ListDatabasesResponse]],
        request: spanner_database_admin.ListDatabasesRequest,
        response: spanner_database_admin.ListDatabasesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_database_v1.types.ListDatabasesRequest):
                The initial request object.
            response (google.cloud.spanner_admin_database_v1.types.ListDatabasesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_database_admin.ListDatabasesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(
        self,
    ) -> AsyncIterator[spanner_database_admin.ListDatabasesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[spanner_database_admin.Database]:
        async def async_generator():
            async for page in self.pages:
                for response in page.databases:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListBackupsPager:
    """A pager for iterating through ``list_backups`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_database_v1.types.ListBackupsResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``backups`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListBackups`` requests and continue to iterate
    through the ``backups`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_database_v1.types.ListBackupsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., backup.ListBackupsResponse],
        request: backup.ListBackupsRequest,
        response: backup.ListBackupsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_database_v1.types.ListBackupsRequest):
                The initial request object.
            response (google.cloud.spanner_admin_database_v1.types.ListBackupsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = backup.ListBackupsRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[backup.ListBackupsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[backup.Backup]:
        for page in self.pages:
            yield from page.backups

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListBackupsAsyncPager:
    """A pager for iterating through ``list_backups`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_database_v1.types.ListBackupsResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``backups`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListBackups`` requests and continue to iterate
    through the ``backups`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_database_v1.types.ListBackupsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[backup.ListBackupsResponse]],
        request: backup.ListBackupsRequest,
        response: backup.ListBackupsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_database_v1.types.ListBackupsRequest):
                The initial request object.
            response (google.cloud.spanner_admin_database_v1.types.ListBackupsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = backup.ListBackupsRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[backup.ListBackupsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[backup.Backup]:
        async def async_generator():
            async for page in self.pages:
                for response in page.backups:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListDatabaseOperationsPager:
    """A pager for iterating through ``list_database_operations`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_database_v1.types.ListDatabaseOperationsResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``operations`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListDatabaseOperations`` requests and continue to iterate
    through the ``operations`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_database_v1.types.ListDatabaseOperationsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., spanner_database_admin.ListDatabaseOperationsResponse],
        request: spanner_database_admin.ListDatabaseOperationsRequest,
        response: spanner_database_admin.ListDatabaseOperationsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_database_v1.types.ListDatabaseOperationsRequest):
                The initial request object.
            response (google.cloud.spanner_admin_database_v1.types.ListDatabaseOperationsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_database_admin.ListDatabaseOperationsRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[spanner_database_admin.ListDatabaseOperationsResponse]:
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


class ListDatabaseOperationsAsyncPager:
    """A pager for iterating through ``list_database_operations`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_database_v1.types.ListDatabaseOperationsResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``operations`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListDatabaseOperations`` requests and continue to iterate
    through the ``operations`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_database_v1.types.ListDatabaseOperationsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[
            ..., Awaitable[spanner_database_admin.ListDatabaseOperationsResponse]
        ],
        request: spanner_database_admin.ListDatabaseOperationsRequest,
        response: spanner_database_admin.ListDatabaseOperationsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_database_v1.types.ListDatabaseOperationsRequest):
                The initial request object.
            response (google.cloud.spanner_admin_database_v1.types.ListDatabaseOperationsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_database_admin.ListDatabaseOperationsRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(
        self,
    ) -> AsyncIterator[spanner_database_admin.ListDatabaseOperationsResponse]:
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


class ListBackupOperationsPager:
    """A pager for iterating through ``list_backup_operations`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_database_v1.types.ListBackupOperationsResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``operations`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListBackupOperations`` requests and continue to iterate
    through the ``operations`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_database_v1.types.ListBackupOperationsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., backup.ListBackupOperationsResponse],
        request: backup.ListBackupOperationsRequest,
        response: backup.ListBackupOperationsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_database_v1.types.ListBackupOperationsRequest):
                The initial request object.
            response (google.cloud.spanner_admin_database_v1.types.ListBackupOperationsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = backup.ListBackupOperationsRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[backup.ListBackupOperationsResponse]:
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


class ListBackupOperationsAsyncPager:
    """A pager for iterating through ``list_backup_operations`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_database_v1.types.ListBackupOperationsResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``operations`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListBackupOperations`` requests and continue to iterate
    through the ``operations`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_database_v1.types.ListBackupOperationsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[backup.ListBackupOperationsResponse]],
        request: backup.ListBackupOperationsRequest,
        response: backup.ListBackupOperationsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_database_v1.types.ListBackupOperationsRequest):
                The initial request object.
            response (google.cloud.spanner_admin_database_v1.types.ListBackupOperationsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = backup.ListBackupOperationsRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[backup.ListBackupOperationsResponse]:
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


class ListDatabaseRolesPager:
    """A pager for iterating through ``list_database_roles`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_database_v1.types.ListDatabaseRolesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``database_roles`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListDatabaseRoles`` requests and continue to iterate
    through the ``database_roles`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_database_v1.types.ListDatabaseRolesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., spanner_database_admin.ListDatabaseRolesResponse],
        request: spanner_database_admin.ListDatabaseRolesRequest,
        response: spanner_database_admin.ListDatabaseRolesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_database_v1.types.ListDatabaseRolesRequest):
                The initial request object.
            response (google.cloud.spanner_admin_database_v1.types.ListDatabaseRolesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_database_admin.ListDatabaseRolesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[spanner_database_admin.ListDatabaseRolesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[spanner_database_admin.DatabaseRole]:
        for page in self.pages:
            yield from page.database_roles

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListDatabaseRolesAsyncPager:
    """A pager for iterating through ``list_database_roles`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.spanner_admin_database_v1.types.ListDatabaseRolesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``database_roles`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListDatabaseRoles`` requests and continue to iterate
    through the ``database_roles`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.spanner_admin_database_v1.types.ListDatabaseRolesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[
            ..., Awaitable[spanner_database_admin.ListDatabaseRolesResponse]
        ],
        request: spanner_database_admin.ListDatabaseRolesRequest,
        response: spanner_database_admin.ListDatabaseRolesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.spanner_admin_database_v1.types.ListDatabaseRolesRequest):
                The initial request object.
            response (google.cloud.spanner_admin_database_v1.types.ListDatabaseRolesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = spanner_database_admin.ListDatabaseRolesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(
        self,
    ) -> AsyncIterator[spanner_database_admin.ListDatabaseRolesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[spanner_database_admin.DatabaseRole]:
        async def async_generator():
            async for page in self.pages:
                for response in page.database_roles:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)
