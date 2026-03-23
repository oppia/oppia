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
from collections import OrderedDict
import functools
import re
from typing import Dict, Mapping, Optional, Sequence, Tuple, Type, Union
import pkg_resources

from google.api_core.client_options import ClientOptions
from google.api_core import exceptions as core_exceptions
from google.api_core import gapic_v1
from google.api_core import retry as retries
from google.auth import credentials as ga_credentials  # type: ignore
from google.oauth2 import service_account  # type: ignore

try:
    OptionalRetry = Union[retries.Retry, gapic_v1.method._MethodDefault]
except AttributeError:  # pragma: NO COVER
    OptionalRetry = Union[retries.Retry, object]  # type: ignore

from google.api_core import operation  # type: ignore
from google.api_core import operation_async  # type: ignore
from google.cloud.recommendationengine_v1beta1.services.catalog_service import pagers
from google.cloud.recommendationengine_v1beta1.types import catalog
from google.cloud.recommendationengine_v1beta1.types import catalog_service
from google.cloud.recommendationengine_v1beta1.types import common
from google.cloud.recommendationengine_v1beta1.types import import_
from google.protobuf import field_mask_pb2  # type: ignore
from .transports.base import CatalogServiceTransport, DEFAULT_CLIENT_INFO
from .transports.grpc_asyncio import CatalogServiceGrpcAsyncIOTransport
from .client import CatalogServiceClient


class CatalogServiceAsyncClient:
    """Service for ingesting catalog information of the customer's
    website.
    """

    _client: CatalogServiceClient

    DEFAULT_ENDPOINT = CatalogServiceClient.DEFAULT_ENDPOINT
    DEFAULT_MTLS_ENDPOINT = CatalogServiceClient.DEFAULT_MTLS_ENDPOINT

    catalog_path = staticmethod(CatalogServiceClient.catalog_path)
    parse_catalog_path = staticmethod(CatalogServiceClient.parse_catalog_path)

    common_billing_account_path = staticmethod(
        CatalogServiceClient.common_billing_account_path
    )
    parse_common_billing_account_path = staticmethod(
        CatalogServiceClient.parse_common_billing_account_path
    )
    common_folder_path = staticmethod(CatalogServiceClient.common_folder_path)
    parse_common_folder_path = staticmethod(
        CatalogServiceClient.parse_common_folder_path
    )
    common_organization_path = staticmethod(
        CatalogServiceClient.common_organization_path
    )
    parse_common_organization_path = staticmethod(
        CatalogServiceClient.parse_common_organization_path
    )
    common_project_path = staticmethod(CatalogServiceClient.common_project_path)
    parse_common_project_path = staticmethod(
        CatalogServiceClient.parse_common_project_path
    )
    common_location_path = staticmethod(CatalogServiceClient.common_location_path)
    parse_common_location_path = staticmethod(
        CatalogServiceClient.parse_common_location_path
    )

    @classmethod
    def from_service_account_info(cls, info: dict, *args, **kwargs):
        """Creates an instance of this client using the provided credentials
            info.

        Args:
            info (dict): The service account private key info.
            args: Additional arguments to pass to the constructor.
            kwargs: Additional arguments to pass to the constructor.

        Returns:
            CatalogServiceAsyncClient: The constructed client.
        """
        return CatalogServiceClient.from_service_account_info.__func__(CatalogServiceAsyncClient, info, *args, **kwargs)  # type: ignore

    @classmethod
    def from_service_account_file(cls, filename: str, *args, **kwargs):
        """Creates an instance of this client using the provided credentials
            file.

        Args:
            filename (str): The path to the service account private key json
                file.
            args: Additional arguments to pass to the constructor.
            kwargs: Additional arguments to pass to the constructor.

        Returns:
            CatalogServiceAsyncClient: The constructed client.
        """
        return CatalogServiceClient.from_service_account_file.__func__(CatalogServiceAsyncClient, filename, *args, **kwargs)  # type: ignore

    from_service_account_json = from_service_account_file

    @classmethod
    def get_mtls_endpoint_and_cert_source(
        cls, client_options: Optional[ClientOptions] = None
    ):
        """Return the API endpoint and client cert source for mutual TLS.

        The client cert source is determined in the following order:
        (1) if `GOOGLE_API_USE_CLIENT_CERTIFICATE` environment variable is not "true", the
        client cert source is None.
        (2) if `client_options.client_cert_source` is provided, use the provided one; if the
        default client cert source exists, use the default one; otherwise the client cert
        source is None.

        The API endpoint is determined in the following order:
        (1) if `client_options.api_endpoint` if provided, use the provided one.
        (2) if `GOOGLE_API_USE_CLIENT_CERTIFICATE` environment variable is "always", use the
        default mTLS endpoint; if the environment variabel is "never", use the default API
        endpoint; otherwise if client cert source exists, use the default mTLS endpoint, otherwise
        use the default API endpoint.

        More details can be found at https://google.aip.dev/auth/4114.

        Args:
            client_options (google.api_core.client_options.ClientOptions): Custom options for the
                client. Only the `api_endpoint` and `client_cert_source` properties may be used
                in this method.

        Returns:
            Tuple[str, Callable[[], Tuple[bytes, bytes]]]: returns the API endpoint and the
                client cert source to use.

        Raises:
            google.auth.exceptions.MutualTLSChannelError: If any errors happen.
        """
        return CatalogServiceClient.get_mtls_endpoint_and_cert_source(client_options)  # type: ignore

    @property
    def transport(self) -> CatalogServiceTransport:
        """Returns the transport used by the client instance.

        Returns:
            CatalogServiceTransport: The transport used by the client instance.
        """
        return self._client.transport

    get_transport_class = functools.partial(
        type(CatalogServiceClient).get_transport_class, type(CatalogServiceClient)
    )

    def __init__(
        self,
        *,
        credentials: ga_credentials.Credentials = None,
        transport: Union[str, CatalogServiceTransport] = "grpc_asyncio",
        client_options: ClientOptions = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
    ) -> None:
        """Instantiates the catalog service client.

        Args:
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
            transport (Union[str, ~.CatalogServiceTransport]): The
                transport to use. If set to None, a transport is chosen
                automatically.
            client_options (ClientOptions): Custom options for the client. It
                won't take effect if a ``transport`` instance is provided.
                (1) The ``api_endpoint`` property can be used to override the
                default endpoint provided by the client. GOOGLE_API_USE_MTLS_ENDPOINT
                environment variable can also be used to override the endpoint:
                "always" (always use the default mTLS endpoint), "never" (always
                use the default regular endpoint) and "auto" (auto switch to the
                default mTLS endpoint if client certificate is present, this is
                the default value). However, the ``api_endpoint`` property takes
                precedence if provided.
                (2) If GOOGLE_API_USE_CLIENT_CERTIFICATE environment variable
                is "true", then the ``client_cert_source`` property can be used
                to provide client certificate for mutual TLS transport. If
                not provided, the default SSL client certificate will be used if
                present. If GOOGLE_API_USE_CLIENT_CERTIFICATE is "false" or not
                set, no client certificate will be used.

        Raises:
            google.auth.exceptions.MutualTlsChannelError: If mutual TLS transport
                creation failed for any reason.
        """
        self._client = CatalogServiceClient(
            credentials=credentials,
            transport=transport,
            client_options=client_options,
            client_info=client_info,
        )

    async def create_catalog_item(
        self,
        request: Union[catalog_service.CreateCatalogItemRequest, dict] = None,
        *,
        parent: str = None,
        catalog_item: catalog.CatalogItem = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> catalog.CatalogItem:
        r"""Creates a catalog item.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            async def sample_create_catalog_item():
                # Create a client
                client = recommendationengine_v1beta1.CatalogServiceAsyncClient()

                # Initialize request argument(s)
                catalog_item = recommendationengine_v1beta1.CatalogItem()
                catalog_item.id = "id_value"
                catalog_item.category_hierarchies.categories = ['categories_value_1', 'categories_value_2']
                catalog_item.title = "title_value"

                request = recommendationengine_v1beta1.CreateCatalogItemRequest(
                    parent="parent_value",
                    catalog_item=catalog_item,
                )

                # Make the request
                response = await client.create_catalog_item(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.CreateCatalogItemRequest, dict]):
                The request object. Request message for
                CreateCatalogItem method.
            parent (:class:`str`):
                Required. The parent catalog resource name, such as
                ``projects/*/locations/global/catalogs/default_catalog``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            catalog_item (:class:`google.cloud.recommendationengine_v1beta1.types.CatalogItem`):
                Required. The catalog item to create.
                This corresponds to the ``catalog_item`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.recommendationengine_v1beta1.types.CatalogItem:
                CatalogItem captures all metadata
                information of items to be recommended.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, catalog_item])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = catalog_service.CreateCatalogItemRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if catalog_item is not None:
            request.catalog_item = catalog_item

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.create_catalog_item,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=600.0,
            ),
            default_timeout=600.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def get_catalog_item(
        self,
        request: Union[catalog_service.GetCatalogItemRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> catalog.CatalogItem:
        r"""Gets a specific catalog item.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            async def sample_get_catalog_item():
                # Create a client
                client = recommendationengine_v1beta1.CatalogServiceAsyncClient()

                # Initialize request argument(s)
                request = recommendationengine_v1beta1.GetCatalogItemRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_catalog_item(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.GetCatalogItemRequest, dict]):
                The request object. Request message for GetCatalogItem
                method.
            name (:class:`str`):
                Required. Full resource name of catalog item, such as
                ``projects/*/locations/global/catalogs/default_catalog/catalogitems/some_catalog_item_id``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.recommendationengine_v1beta1.types.CatalogItem:
                CatalogItem captures all metadata
                information of items to be recommended.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([name])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = catalog_service.GetCatalogItemRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.get_catalog_item,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=600.0,
            ),
            default_timeout=600.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def list_catalog_items(
        self,
        request: Union[catalog_service.ListCatalogItemsRequest, dict] = None,
        *,
        parent: str = None,
        filter: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> pagers.ListCatalogItemsAsyncPager:
        r"""Gets a list of catalog items.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            async def sample_list_catalog_items():
                # Create a client
                client = recommendationengine_v1beta1.CatalogServiceAsyncClient()

                # Initialize request argument(s)
                request = recommendationengine_v1beta1.ListCatalogItemsRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_catalog_items(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.ListCatalogItemsRequest, dict]):
                The request object. Request message for ListCatalogItems
                method.
            parent (:class:`str`):
                Required. The parent catalog resource name, such as
                ``projects/*/locations/global/catalogs/default_catalog``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            filter (:class:`str`):
                Optional. A filter to apply on the
                list results.

                This corresponds to the ``filter`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.recommendationengine_v1beta1.services.catalog_service.pagers.ListCatalogItemsAsyncPager:
                Response message for ListCatalogItems
                method.
                Iterating over this object will yield
                results and resolve additional pages
                automatically.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, filter])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = catalog_service.ListCatalogItemsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if filter is not None:
            request.filter = filter

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.list_catalog_items,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=600.0,
            ),
            default_timeout=600.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # This method is paged; wrap the response in a pager, which provides
        # an `__aiter__` convenience method.
        response = pagers.ListCatalogItemsAsyncPager(
            method=rpc,
            request=request,
            response=response,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def update_catalog_item(
        self,
        request: Union[catalog_service.UpdateCatalogItemRequest, dict] = None,
        *,
        name: str = None,
        catalog_item: catalog.CatalogItem = None,
        update_mask: field_mask_pb2.FieldMask = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> catalog.CatalogItem:
        r"""Updates a catalog item. Partial updating is
        supported. Non-existing items will be created.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            async def sample_update_catalog_item():
                # Create a client
                client = recommendationengine_v1beta1.CatalogServiceAsyncClient()

                # Initialize request argument(s)
                catalog_item = recommendationengine_v1beta1.CatalogItem()
                catalog_item.id = "id_value"
                catalog_item.category_hierarchies.categories = ['categories_value_1', 'categories_value_2']
                catalog_item.title = "title_value"

                request = recommendationengine_v1beta1.UpdateCatalogItemRequest(
                    name="name_value",
                    catalog_item=catalog_item,
                )

                # Make the request
                response = await client.update_catalog_item(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.UpdateCatalogItemRequest, dict]):
                The request object. Request message for
                UpdateCatalogItem method.
            name (:class:`str`):
                Required. Full resource name of catalog item, such as
                ``projects/*/locations/global/catalogs/default_catalog/catalogItems/some_catalog_item_id``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            catalog_item (:class:`google.cloud.recommendationengine_v1beta1.types.CatalogItem`):
                Required. The catalog item to update/create. The
                'catalog_item_id' field has to match that in the 'name'.

                This corresponds to the ``catalog_item`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            update_mask (:class:`google.protobuf.field_mask_pb2.FieldMask`):
                Optional. Indicates which fields in
                the provided 'item' to update. If not
                set, will by default update all fields.

                This corresponds to the ``update_mask`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.recommendationengine_v1beta1.types.CatalogItem:
                CatalogItem captures all metadata
                information of items to be recommended.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([name, catalog_item, update_mask])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = catalog_service.UpdateCatalogItemRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name
        if catalog_item is not None:
            request.catalog_item = catalog_item
        if update_mask is not None:
            request.update_mask = update_mask

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.update_catalog_item,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=600.0,
            ),
            default_timeout=600.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def delete_catalog_item(
        self,
        request: Union[catalog_service.DeleteCatalogItemRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> None:
        r"""Deletes a catalog item.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            async def sample_delete_catalog_item():
                # Create a client
                client = recommendationengine_v1beta1.CatalogServiceAsyncClient()

                # Initialize request argument(s)
                request = recommendationengine_v1beta1.DeleteCatalogItemRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_catalog_item(request=request)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.DeleteCatalogItemRequest, dict]):
                The request object. Request message for
                DeleteCatalogItem method.
            name (:class:`str`):
                Required. Full resource name of catalog item, such as
                ``projects/*/locations/global/catalogs/default_catalog/catalogItems/some_catalog_item_id``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([name])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = catalog_service.DeleteCatalogItemRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.delete_catalog_item,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=600.0,
            ),
            default_timeout=600.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Send the request.
        await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

    async def import_catalog_items(
        self,
        request: Union[import_.ImportCatalogItemsRequest, dict] = None,
        *,
        parent: str = None,
        request_id: str = None,
        input_config: import_.InputConfig = None,
        errors_config: import_.ImportErrorsConfig = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Bulk import of multiple catalog items. Request
        processing may be synchronous. No partial updating
        supported. Non-existing items will be created.

        Operation.response is of type ImportResponse. Note that
        it is possible for a subset of the items to be
        successfully updated.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            async def sample_import_catalog_items():
                # Create a client
                client = recommendationengine_v1beta1.CatalogServiceAsyncClient()

                # Initialize request argument(s)
                request = recommendationengine_v1beta1.ImportCatalogItemsRequest(
                    parent="parent_value",
                )

                # Make the request
                operation = client.import_catalog_items(request=request)

                print("Waiting for operation to complete...")

                response = await operation.result()

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.ImportCatalogItemsRequest, dict]):
                The request object. Request message for Import methods.
            parent (:class:`str`):
                Required.
                ``projects/1234/locations/global/catalogs/default_catalog``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            request_id (:class:`str`):
                Optional. Unique identifier provided
                by client, within the ancestor dataset
                scope. Ensures idempotency and used for
                request deduplication. Server-generated
                if unspecified. Up to 128 characters
                long. This is returned as
                google.longrunning.Operation.name in the
                response.

                This corresponds to the ``request_id`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            input_config (:class:`google.cloud.recommendationengine_v1beta1.types.InputConfig`):
                Required. The desired input location
                of the data.

                This corresponds to the ``input_config`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            errors_config (:class:`google.cloud.recommendationengine_v1beta1.types.ImportErrorsConfig`):
                Optional. The desired location of
                errors incurred during the Import.

                This corresponds to the ``errors_config`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.api_core.operation_async.AsyncOperation:
                An object representing a long-running operation.

                The result type for the operation will be :class:`google.cloud.recommendationengine_v1beta1.types.ImportCatalogItemsResponse` Response of the ImportCatalogItemsRequest. If the long running
                   operation is done, then this message is returned by
                   the google.longrunning.Operations.response field if
                   the operation was successful.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, request_id, input_config, errors_config])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = import_.ImportCatalogItemsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if request_id is not None:
            request.request_id = request_id
        if input_config is not None:
            request.input_config = input_config
        if errors_config is not None:
            request.errors_config = errors_config

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.import_catalog_items,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=600.0,
            ),
            default_timeout=600.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Wrap the response in an operation future.
        response = operation_async.from_gapic(
            response,
            self._client._transport.operations_client,
            import_.ImportCatalogItemsResponse,
            metadata_type=import_.ImportMetadata,
        )

        # Done; return the response.
        return response

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.transport.close()


try:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
        gapic_version=pkg_resources.get_distribution(
            "google-cloud-recommendations-ai",
        ).version,
    )
except pkg_resources.DistributionNotFound:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo()


__all__ = ("CatalogServiceAsyncClient",)
