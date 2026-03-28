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
    Iterator,
    Optional,
    Sequence,
    Tuple,
)

from google.cloud.dlp_v2.types import dlp


class ListInspectTemplatesPager:
    """A pager for iterating through ``list_inspect_templates`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.dlp_v2.types.ListInspectTemplatesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``inspect_templates`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListInspectTemplates`` requests and continue to iterate
    through the ``inspect_templates`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.dlp_v2.types.ListInspectTemplatesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., dlp.ListInspectTemplatesResponse],
        request: dlp.ListInspectTemplatesRequest,
        response: dlp.ListInspectTemplatesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.dlp_v2.types.ListInspectTemplatesRequest):
                The initial request object.
            response (google.cloud.dlp_v2.types.ListInspectTemplatesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = dlp.ListInspectTemplatesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[dlp.ListInspectTemplatesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[dlp.InspectTemplate]:
        for page in self.pages:
            yield from page.inspect_templates

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListInspectTemplatesAsyncPager:
    """A pager for iterating through ``list_inspect_templates`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.dlp_v2.types.ListInspectTemplatesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``inspect_templates`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListInspectTemplates`` requests and continue to iterate
    through the ``inspect_templates`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.dlp_v2.types.ListInspectTemplatesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[dlp.ListInspectTemplatesResponse]],
        request: dlp.ListInspectTemplatesRequest,
        response: dlp.ListInspectTemplatesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.dlp_v2.types.ListInspectTemplatesRequest):
                The initial request object.
            response (google.cloud.dlp_v2.types.ListInspectTemplatesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = dlp.ListInspectTemplatesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[dlp.ListInspectTemplatesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[dlp.InspectTemplate]:
        async def async_generator():
            async for page in self.pages:
                for response in page.inspect_templates:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListDeidentifyTemplatesPager:
    """A pager for iterating through ``list_deidentify_templates`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.dlp_v2.types.ListDeidentifyTemplatesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``deidentify_templates`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListDeidentifyTemplates`` requests and continue to iterate
    through the ``deidentify_templates`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.dlp_v2.types.ListDeidentifyTemplatesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., dlp.ListDeidentifyTemplatesResponse],
        request: dlp.ListDeidentifyTemplatesRequest,
        response: dlp.ListDeidentifyTemplatesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.dlp_v2.types.ListDeidentifyTemplatesRequest):
                The initial request object.
            response (google.cloud.dlp_v2.types.ListDeidentifyTemplatesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = dlp.ListDeidentifyTemplatesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[dlp.ListDeidentifyTemplatesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[dlp.DeidentifyTemplate]:
        for page in self.pages:
            yield from page.deidentify_templates

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListDeidentifyTemplatesAsyncPager:
    """A pager for iterating through ``list_deidentify_templates`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.dlp_v2.types.ListDeidentifyTemplatesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``deidentify_templates`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListDeidentifyTemplates`` requests and continue to iterate
    through the ``deidentify_templates`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.dlp_v2.types.ListDeidentifyTemplatesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[dlp.ListDeidentifyTemplatesResponse]],
        request: dlp.ListDeidentifyTemplatesRequest,
        response: dlp.ListDeidentifyTemplatesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.dlp_v2.types.ListDeidentifyTemplatesRequest):
                The initial request object.
            response (google.cloud.dlp_v2.types.ListDeidentifyTemplatesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = dlp.ListDeidentifyTemplatesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[dlp.ListDeidentifyTemplatesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[dlp.DeidentifyTemplate]:
        async def async_generator():
            async for page in self.pages:
                for response in page.deidentify_templates:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListJobTriggersPager:
    """A pager for iterating through ``list_job_triggers`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.dlp_v2.types.ListJobTriggersResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``job_triggers`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListJobTriggers`` requests and continue to iterate
    through the ``job_triggers`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.dlp_v2.types.ListJobTriggersResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., dlp.ListJobTriggersResponse],
        request: dlp.ListJobTriggersRequest,
        response: dlp.ListJobTriggersResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.dlp_v2.types.ListJobTriggersRequest):
                The initial request object.
            response (google.cloud.dlp_v2.types.ListJobTriggersResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = dlp.ListJobTriggersRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[dlp.ListJobTriggersResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[dlp.JobTrigger]:
        for page in self.pages:
            yield from page.job_triggers

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListJobTriggersAsyncPager:
    """A pager for iterating through ``list_job_triggers`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.dlp_v2.types.ListJobTriggersResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``job_triggers`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListJobTriggers`` requests and continue to iterate
    through the ``job_triggers`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.dlp_v2.types.ListJobTriggersResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[dlp.ListJobTriggersResponse]],
        request: dlp.ListJobTriggersRequest,
        response: dlp.ListJobTriggersResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.dlp_v2.types.ListJobTriggersRequest):
                The initial request object.
            response (google.cloud.dlp_v2.types.ListJobTriggersResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = dlp.ListJobTriggersRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[dlp.ListJobTriggersResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[dlp.JobTrigger]:
        async def async_generator():
            async for page in self.pages:
                for response in page.job_triggers:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListDlpJobsPager:
    """A pager for iterating through ``list_dlp_jobs`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.dlp_v2.types.ListDlpJobsResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``jobs`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListDlpJobs`` requests and continue to iterate
    through the ``jobs`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.dlp_v2.types.ListDlpJobsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., dlp.ListDlpJobsResponse],
        request: dlp.ListDlpJobsRequest,
        response: dlp.ListDlpJobsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.dlp_v2.types.ListDlpJobsRequest):
                The initial request object.
            response (google.cloud.dlp_v2.types.ListDlpJobsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = dlp.ListDlpJobsRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[dlp.ListDlpJobsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[dlp.DlpJob]:
        for page in self.pages:
            yield from page.jobs

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListDlpJobsAsyncPager:
    """A pager for iterating through ``list_dlp_jobs`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.dlp_v2.types.ListDlpJobsResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``jobs`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListDlpJobs`` requests and continue to iterate
    through the ``jobs`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.dlp_v2.types.ListDlpJobsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[dlp.ListDlpJobsResponse]],
        request: dlp.ListDlpJobsRequest,
        response: dlp.ListDlpJobsResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.dlp_v2.types.ListDlpJobsRequest):
                The initial request object.
            response (google.cloud.dlp_v2.types.ListDlpJobsResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = dlp.ListDlpJobsRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[dlp.ListDlpJobsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[dlp.DlpJob]:
        async def async_generator():
            async for page in self.pages:
                for response in page.jobs:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListStoredInfoTypesPager:
    """A pager for iterating through ``list_stored_info_types`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.dlp_v2.types.ListStoredInfoTypesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``stored_info_types`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListStoredInfoTypes`` requests and continue to iterate
    through the ``stored_info_types`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.dlp_v2.types.ListStoredInfoTypesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., dlp.ListStoredInfoTypesResponse],
        request: dlp.ListStoredInfoTypesRequest,
        response: dlp.ListStoredInfoTypesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.dlp_v2.types.ListStoredInfoTypesRequest):
                The initial request object.
            response (google.cloud.dlp_v2.types.ListStoredInfoTypesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = dlp.ListStoredInfoTypesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[dlp.ListStoredInfoTypesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(self._request, metadata=self._metadata)
            yield self._response

    def __iter__(self) -> Iterator[dlp.StoredInfoType]:
        for page in self.pages:
            yield from page.stored_info_types

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListStoredInfoTypesAsyncPager:
    """A pager for iterating through ``list_stored_info_types`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.dlp_v2.types.ListStoredInfoTypesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``stored_info_types`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListStoredInfoTypes`` requests and continue to iterate
    through the ``stored_info_types`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.dlp_v2.types.ListStoredInfoTypesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[dlp.ListStoredInfoTypesResponse]],
        request: dlp.ListStoredInfoTypesRequest,
        response: dlp.ListStoredInfoTypesResponse,
        *,
        metadata: Sequence[Tuple[str, str]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.dlp_v2.types.ListStoredInfoTypesRequest):
                The initial request object.
            response (google.cloud.dlp_v2.types.ListStoredInfoTypesResponse):
                The initial response object.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        self._method = method
        self._request = dlp.ListStoredInfoTypesRequest(request)
        self._response = response
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[dlp.ListStoredInfoTypesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(self._request, metadata=self._metadata)
            yield self._response

    def __aiter__(self) -> AsyncIterator[dlp.StoredInfoType]:
        async def async_generator():
            async for page in self.pages:
                for response in page.stored_info_types:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)
