# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
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
    Union,
)

from google.api_core import gapic_v1
from google.api_core import retry as retries
from google.api_core import retry_async as retries_async

try:
    OptionalRetry = Union[retries.Retry, gapic_v1.method._MethodDefault, None]
    OptionalAsyncRetry = Union[
        retries_async.AsyncRetry, gapic_v1.method._MethodDefault, None
    ]
except AttributeError:  # pragma: NO COVER
    OptionalRetry = Union[retries.Retry, object, None]  # type: ignore
    OptionalAsyncRetry = Union[retries_async.AsyncRetry, object, None]  # type: ignore

from google.cloud.translate_v3.types import (
    adaptive_mt,
    automl_translation,
    common,
    translation_service,
)


class ListGlossariesPager:
    """A pager for iterating through ``list_glossaries`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListGlossariesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``glossaries`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListGlossaries`` requests and continue to iterate
    through the ``glossaries`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListGlossariesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., translation_service.ListGlossariesResponse],
        request: translation_service.ListGlossariesRequest,
        response: translation_service.ListGlossariesResponse,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListGlossariesRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListGlossariesResponse):
                The initial response object.
            retry (google.api_core.retry.Retry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = translation_service.ListGlossariesRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[translation_service.ListGlossariesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __iter__(self) -> Iterator[translation_service.Glossary]:
        for page in self.pages:
            yield from page.glossaries

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListGlossariesAsyncPager:
    """A pager for iterating through ``list_glossaries`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListGlossariesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``glossaries`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListGlossaries`` requests and continue to iterate
    through the ``glossaries`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListGlossariesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[translation_service.ListGlossariesResponse]],
        request: translation_service.ListGlossariesRequest,
        response: translation_service.ListGlossariesResponse,
        *,
        retry: OptionalAsyncRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListGlossariesRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListGlossariesResponse):
                The initial response object.
            retry (google.api_core.retry.AsyncRetry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = translation_service.ListGlossariesRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[translation_service.ListGlossariesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __aiter__(self) -> AsyncIterator[translation_service.Glossary]:
        async def async_generator():
            async for page in self.pages:
                for response in page.glossaries:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListGlossaryEntriesPager:
    """A pager for iterating through ``list_glossary_entries`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListGlossaryEntriesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``glossary_entries`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListGlossaryEntries`` requests and continue to iterate
    through the ``glossary_entries`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListGlossaryEntriesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., translation_service.ListGlossaryEntriesResponse],
        request: translation_service.ListGlossaryEntriesRequest,
        response: translation_service.ListGlossaryEntriesResponse,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListGlossaryEntriesRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListGlossaryEntriesResponse):
                The initial response object.
            retry (google.api_core.retry.Retry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = translation_service.ListGlossaryEntriesRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[translation_service.ListGlossaryEntriesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __iter__(self) -> Iterator[common.GlossaryEntry]:
        for page in self.pages:
            yield from page.glossary_entries

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListGlossaryEntriesAsyncPager:
    """A pager for iterating through ``list_glossary_entries`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListGlossaryEntriesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``glossary_entries`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListGlossaryEntries`` requests and continue to iterate
    through the ``glossary_entries`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListGlossaryEntriesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[
            ..., Awaitable[translation_service.ListGlossaryEntriesResponse]
        ],
        request: translation_service.ListGlossaryEntriesRequest,
        response: translation_service.ListGlossaryEntriesResponse,
        *,
        retry: OptionalAsyncRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListGlossaryEntriesRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListGlossaryEntriesResponse):
                The initial response object.
            retry (google.api_core.retry.AsyncRetry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = translation_service.ListGlossaryEntriesRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(
        self,
    ) -> AsyncIterator[translation_service.ListGlossaryEntriesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __aiter__(self) -> AsyncIterator[common.GlossaryEntry]:
        async def async_generator():
            async for page in self.pages:
                for response in page.glossary_entries:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListDatasetsPager:
    """A pager for iterating through ``list_datasets`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListDatasetsResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``datasets`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListDatasets`` requests and continue to iterate
    through the ``datasets`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListDatasetsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., automl_translation.ListDatasetsResponse],
        request: automl_translation.ListDatasetsRequest,
        response: automl_translation.ListDatasetsResponse,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListDatasetsRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListDatasetsResponse):
                The initial response object.
            retry (google.api_core.retry.Retry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = automl_translation.ListDatasetsRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[automl_translation.ListDatasetsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __iter__(self) -> Iterator[automl_translation.Dataset]:
        for page in self.pages:
            yield from page.datasets

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListDatasetsAsyncPager:
    """A pager for iterating through ``list_datasets`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListDatasetsResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``datasets`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListDatasets`` requests and continue to iterate
    through the ``datasets`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListDatasetsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[automl_translation.ListDatasetsResponse]],
        request: automl_translation.ListDatasetsRequest,
        response: automl_translation.ListDatasetsResponse,
        *,
        retry: OptionalAsyncRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListDatasetsRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListDatasetsResponse):
                The initial response object.
            retry (google.api_core.retry.AsyncRetry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = automl_translation.ListDatasetsRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[automl_translation.ListDatasetsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __aiter__(self) -> AsyncIterator[automl_translation.Dataset]:
        async def async_generator():
            async for page in self.pages:
                for response in page.datasets:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListAdaptiveMtDatasetsPager:
    """A pager for iterating through ``list_adaptive_mt_datasets`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListAdaptiveMtDatasetsResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``adaptive_mt_datasets`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListAdaptiveMtDatasets`` requests and continue to iterate
    through the ``adaptive_mt_datasets`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListAdaptiveMtDatasetsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., adaptive_mt.ListAdaptiveMtDatasetsResponse],
        request: adaptive_mt.ListAdaptiveMtDatasetsRequest,
        response: adaptive_mt.ListAdaptiveMtDatasetsResponse,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListAdaptiveMtDatasetsRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListAdaptiveMtDatasetsResponse):
                The initial response object.
            retry (google.api_core.retry.Retry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = adaptive_mt.ListAdaptiveMtDatasetsRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[adaptive_mt.ListAdaptiveMtDatasetsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __iter__(self) -> Iterator[adaptive_mt.AdaptiveMtDataset]:
        for page in self.pages:
            yield from page.adaptive_mt_datasets

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListAdaptiveMtDatasetsAsyncPager:
    """A pager for iterating through ``list_adaptive_mt_datasets`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListAdaptiveMtDatasetsResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``adaptive_mt_datasets`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListAdaptiveMtDatasets`` requests and continue to iterate
    through the ``adaptive_mt_datasets`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListAdaptiveMtDatasetsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[adaptive_mt.ListAdaptiveMtDatasetsResponse]],
        request: adaptive_mt.ListAdaptiveMtDatasetsRequest,
        response: adaptive_mt.ListAdaptiveMtDatasetsResponse,
        *,
        retry: OptionalAsyncRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListAdaptiveMtDatasetsRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListAdaptiveMtDatasetsResponse):
                The initial response object.
            retry (google.api_core.retry.AsyncRetry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = adaptive_mt.ListAdaptiveMtDatasetsRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[adaptive_mt.ListAdaptiveMtDatasetsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __aiter__(self) -> AsyncIterator[adaptive_mt.AdaptiveMtDataset]:
        async def async_generator():
            async for page in self.pages:
                for response in page.adaptive_mt_datasets:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListAdaptiveMtFilesPager:
    """A pager for iterating through ``list_adaptive_mt_files`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListAdaptiveMtFilesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``adaptive_mt_files`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListAdaptiveMtFiles`` requests and continue to iterate
    through the ``adaptive_mt_files`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListAdaptiveMtFilesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., adaptive_mt.ListAdaptiveMtFilesResponse],
        request: adaptive_mt.ListAdaptiveMtFilesRequest,
        response: adaptive_mt.ListAdaptiveMtFilesResponse,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListAdaptiveMtFilesRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListAdaptiveMtFilesResponse):
                The initial response object.
            retry (google.api_core.retry.Retry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = adaptive_mt.ListAdaptiveMtFilesRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[adaptive_mt.ListAdaptiveMtFilesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __iter__(self) -> Iterator[adaptive_mt.AdaptiveMtFile]:
        for page in self.pages:
            yield from page.adaptive_mt_files

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListAdaptiveMtFilesAsyncPager:
    """A pager for iterating through ``list_adaptive_mt_files`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListAdaptiveMtFilesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``adaptive_mt_files`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListAdaptiveMtFiles`` requests and continue to iterate
    through the ``adaptive_mt_files`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListAdaptiveMtFilesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[adaptive_mt.ListAdaptiveMtFilesResponse]],
        request: adaptive_mt.ListAdaptiveMtFilesRequest,
        response: adaptive_mt.ListAdaptiveMtFilesResponse,
        *,
        retry: OptionalAsyncRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListAdaptiveMtFilesRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListAdaptiveMtFilesResponse):
                The initial response object.
            retry (google.api_core.retry.AsyncRetry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = adaptive_mt.ListAdaptiveMtFilesRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[adaptive_mt.ListAdaptiveMtFilesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __aiter__(self) -> AsyncIterator[adaptive_mt.AdaptiveMtFile]:
        async def async_generator():
            async for page in self.pages:
                for response in page.adaptive_mt_files:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListAdaptiveMtSentencesPager:
    """A pager for iterating through ``list_adaptive_mt_sentences`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListAdaptiveMtSentencesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``adaptive_mt_sentences`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListAdaptiveMtSentences`` requests and continue to iterate
    through the ``adaptive_mt_sentences`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListAdaptiveMtSentencesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., adaptive_mt.ListAdaptiveMtSentencesResponse],
        request: adaptive_mt.ListAdaptiveMtSentencesRequest,
        response: adaptive_mt.ListAdaptiveMtSentencesResponse,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListAdaptiveMtSentencesRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListAdaptiveMtSentencesResponse):
                The initial response object.
            retry (google.api_core.retry.Retry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = adaptive_mt.ListAdaptiveMtSentencesRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[adaptive_mt.ListAdaptiveMtSentencesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __iter__(self) -> Iterator[adaptive_mt.AdaptiveMtSentence]:
        for page in self.pages:
            yield from page.adaptive_mt_sentences

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListAdaptiveMtSentencesAsyncPager:
    """A pager for iterating through ``list_adaptive_mt_sentences`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListAdaptiveMtSentencesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``adaptive_mt_sentences`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListAdaptiveMtSentences`` requests and continue to iterate
    through the ``adaptive_mt_sentences`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListAdaptiveMtSentencesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[adaptive_mt.ListAdaptiveMtSentencesResponse]],
        request: adaptive_mt.ListAdaptiveMtSentencesRequest,
        response: adaptive_mt.ListAdaptiveMtSentencesResponse,
        *,
        retry: OptionalAsyncRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListAdaptiveMtSentencesRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListAdaptiveMtSentencesResponse):
                The initial response object.
            retry (google.api_core.retry.AsyncRetry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = adaptive_mt.ListAdaptiveMtSentencesRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[adaptive_mt.ListAdaptiveMtSentencesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __aiter__(self) -> AsyncIterator[adaptive_mt.AdaptiveMtSentence]:
        async def async_generator():
            async for page in self.pages:
                for response in page.adaptive_mt_sentences:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListExamplesPager:
    """A pager for iterating through ``list_examples`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListExamplesResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``examples`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListExamples`` requests and continue to iterate
    through the ``examples`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListExamplesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., automl_translation.ListExamplesResponse],
        request: automl_translation.ListExamplesRequest,
        response: automl_translation.ListExamplesResponse,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListExamplesRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListExamplesResponse):
                The initial response object.
            retry (google.api_core.retry.Retry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = automl_translation.ListExamplesRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[automl_translation.ListExamplesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __iter__(self) -> Iterator[automl_translation.Example]:
        for page in self.pages:
            yield from page.examples

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListExamplesAsyncPager:
    """A pager for iterating through ``list_examples`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListExamplesResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``examples`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListExamples`` requests and continue to iterate
    through the ``examples`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListExamplesResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[automl_translation.ListExamplesResponse]],
        request: automl_translation.ListExamplesRequest,
        response: automl_translation.ListExamplesResponse,
        *,
        retry: OptionalAsyncRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListExamplesRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListExamplesResponse):
                The initial response object.
            retry (google.api_core.retry.AsyncRetry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = automl_translation.ListExamplesRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[automl_translation.ListExamplesResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __aiter__(self) -> AsyncIterator[automl_translation.Example]:
        async def async_generator():
            async for page in self.pages:
                for response in page.examples:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListModelsPager:
    """A pager for iterating through ``list_models`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListModelsResponse` object, and
    provides an ``__iter__`` method to iterate through its
    ``models`` field.

    If there are more pages, the ``__iter__`` method will make additional
    ``ListModels`` requests and continue to iterate
    through the ``models`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListModelsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., automl_translation.ListModelsResponse],
        request: automl_translation.ListModelsRequest,
        response: automl_translation.ListModelsResponse,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiate the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListModelsRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListModelsResponse):
                The initial response object.
            retry (google.api_core.retry.Retry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = automl_translation.ListModelsRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    def pages(self) -> Iterator[automl_translation.ListModelsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __iter__(self) -> Iterator[automl_translation.Model]:
        for page in self.pages:
            yield from page.models

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)


class ListModelsAsyncPager:
    """A pager for iterating through ``list_models`` requests.

    This class thinly wraps an initial
    :class:`google.cloud.translate_v3.types.ListModelsResponse` object, and
    provides an ``__aiter__`` method to iterate through its
    ``models`` field.

    If there are more pages, the ``__aiter__`` method will make additional
    ``ListModels`` requests and continue to iterate
    through the ``models`` field on the
    corresponding responses.

    All the usual :class:`google.cloud.translate_v3.types.ListModelsResponse`
    attributes are available on the pager. If multiple requests are made, only
    the most recent response is retained, and thus used for attribute lookup.
    """

    def __init__(
        self,
        method: Callable[..., Awaitable[automl_translation.ListModelsResponse]],
        request: automl_translation.ListModelsRequest,
        response: automl_translation.ListModelsResponse,
        *,
        retry: OptionalAsyncRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ()
    ):
        """Instantiates the pager.

        Args:
            method (Callable): The method that was originally called, and
                which instantiated this pager.
            request (google.cloud.translate_v3.types.ListModelsRequest):
                The initial request object.
            response (google.cloud.translate_v3.types.ListModelsResponse):
                The initial response object.
            retry (google.api_core.retry.AsyncRetry): Designation of what errors,
                if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        self._method = method
        self._request = automl_translation.ListModelsRequest(request)
        self._response = response
        self._retry = retry
        self._timeout = timeout
        self._metadata = metadata

    def __getattr__(self, name: str) -> Any:
        return getattr(self._response, name)

    @property
    async def pages(self) -> AsyncIterator[automl_translation.ListModelsResponse]:
        yield self._response
        while self._response.next_page_token:
            self._request.page_token = self._response.next_page_token
            self._response = await self._method(
                self._request,
                retry=self._retry,
                timeout=self._timeout,
                metadata=self._metadata,
            )
            yield self._response

    def __aiter__(self) -> AsyncIterator[automl_translation.Model]:
        async def async_generator():
            async for page in self.pages:
                for response in page.models:
                    yield response

        return async_generator()

    def __repr__(self) -> str:
        return "{0}<{1!r}>".format(self.__class__.__name__, self._response)
