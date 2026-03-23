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
import logging as std_logging
from collections import OrderedDict
import re
from typing import (
    Dict,
    Callable,
    Mapping,
    MutableMapping,
    MutableSequence,
    Optional,
    Sequence,
    Tuple,
    Type,
    Union,
)

from google.cloud.firestore_admin_v1 import gapic_version as package_version

from google.api_core.client_options import ClientOptions
from google.api_core import exceptions as core_exceptions
from google.api_core import gapic_v1
from google.api_core import retry_async as retries
from google.auth import credentials as ga_credentials  # type: ignore
from google.oauth2 import service_account  # type: ignore
import google.protobuf


try:
    OptionalRetry = Union[retries.AsyncRetry, gapic_v1.method._MethodDefault, None]
except AttributeError:  # pragma: NO COVER
    OptionalRetry = Union[retries.AsyncRetry, object, None]  # type: ignore

from google.api_core import operation as gac_operation  # type: ignore
from google.api_core import operation_async  # type: ignore
from google.cloud.firestore_admin_v1.services.firestore_admin import pagers
from google.cloud.firestore_admin_v1.types import backup
from google.cloud.firestore_admin_v1.types import database
from google.cloud.firestore_admin_v1.types import database as gfa_database
from google.cloud.firestore_admin_v1.types import field
from google.cloud.firestore_admin_v1.types import field as gfa_field
from google.cloud.firestore_admin_v1.types import firestore_admin
from google.cloud.firestore_admin_v1.types import index
from google.cloud.firestore_admin_v1.types import index as gfa_index
from google.cloud.firestore_admin_v1.types import operation as gfa_operation
from google.cloud.firestore_admin_v1.types import schedule
from google.cloud.firestore_admin_v1.types import user_creds
from google.cloud.firestore_admin_v1.types import user_creds as gfa_user_creds
from google.cloud.location import locations_pb2  # type: ignore
from google.longrunning import operations_pb2  # type: ignore
from google.protobuf import duration_pb2  # type: ignore
from google.protobuf import empty_pb2  # type: ignore
from google.protobuf import field_mask_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
from .transports.base import FirestoreAdminTransport, DEFAULT_CLIENT_INFO
from .transports.grpc_asyncio import FirestoreAdminGrpcAsyncIOTransport
from .client import FirestoreAdminClient

try:
    from google.api_core import client_logging  # type: ignore

    CLIENT_LOGGING_SUPPORTED = True  # pragma: NO COVER
except ImportError:  # pragma: NO COVER
    CLIENT_LOGGING_SUPPORTED = False

_LOGGER = std_logging.getLogger(__name__)


class FirestoreAdminAsyncClient:
    """The Cloud Firestore Admin API.

    This API provides several administrative services for Cloud
    Firestore.

    Project, Database, Namespace, Collection, Collection Group, and
    Document are used as defined in the Google Cloud Firestore API.

    Operation: An Operation represents work being performed in the
    background.

    The index service manages Cloud Firestore indexes.

    Index creation is performed asynchronously. An Operation resource is
    created for each such asynchronous operation. The state of the
    operation (including any errors encountered) may be queried via the
    Operation resource.

    The Operations collection provides a record of actions performed for
    the specified Project (including any Operations in progress).
    Operations are not created directly but through calls on other
    collections or resources.

    An Operation that is done may be deleted so that it is no longer
    listed as part of the Operation collection. Operations are garbage
    collected after 30 days. By default, ListOperations will only return
    in progress and failed operations. To list completed operation,
    issue a ListOperations request with the filter ``done: true``.

    Operations are created by service ``FirestoreAdmin``, but are
    accessed via service ``google.longrunning.Operations``.
    """

    _client: FirestoreAdminClient

    # Copy defaults from the synchronous client for use here.
    # Note: DEFAULT_ENDPOINT is deprecated. Use _DEFAULT_ENDPOINT_TEMPLATE instead.
    DEFAULT_ENDPOINT = FirestoreAdminClient.DEFAULT_ENDPOINT
    DEFAULT_MTLS_ENDPOINT = FirestoreAdminClient.DEFAULT_MTLS_ENDPOINT
    _DEFAULT_ENDPOINT_TEMPLATE = FirestoreAdminClient._DEFAULT_ENDPOINT_TEMPLATE
    _DEFAULT_UNIVERSE = FirestoreAdminClient._DEFAULT_UNIVERSE

    backup_path = staticmethod(FirestoreAdminClient.backup_path)
    parse_backup_path = staticmethod(FirestoreAdminClient.parse_backup_path)
    backup_schedule_path = staticmethod(FirestoreAdminClient.backup_schedule_path)
    parse_backup_schedule_path = staticmethod(
        FirestoreAdminClient.parse_backup_schedule_path
    )
    collection_group_path = staticmethod(FirestoreAdminClient.collection_group_path)
    parse_collection_group_path = staticmethod(
        FirestoreAdminClient.parse_collection_group_path
    )
    database_path = staticmethod(FirestoreAdminClient.database_path)
    parse_database_path = staticmethod(FirestoreAdminClient.parse_database_path)
    field_path = staticmethod(FirestoreAdminClient.field_path)
    parse_field_path = staticmethod(FirestoreAdminClient.parse_field_path)
    index_path = staticmethod(FirestoreAdminClient.index_path)
    parse_index_path = staticmethod(FirestoreAdminClient.parse_index_path)
    location_path = staticmethod(FirestoreAdminClient.location_path)
    parse_location_path = staticmethod(FirestoreAdminClient.parse_location_path)
    operation_path = staticmethod(FirestoreAdminClient.operation_path)
    parse_operation_path = staticmethod(FirestoreAdminClient.parse_operation_path)
    user_creds_path = staticmethod(FirestoreAdminClient.user_creds_path)
    parse_user_creds_path = staticmethod(FirestoreAdminClient.parse_user_creds_path)
    common_billing_account_path = staticmethod(
        FirestoreAdminClient.common_billing_account_path
    )
    parse_common_billing_account_path = staticmethod(
        FirestoreAdminClient.parse_common_billing_account_path
    )
    common_folder_path = staticmethod(FirestoreAdminClient.common_folder_path)
    parse_common_folder_path = staticmethod(
        FirestoreAdminClient.parse_common_folder_path
    )
    common_organization_path = staticmethod(
        FirestoreAdminClient.common_organization_path
    )
    parse_common_organization_path = staticmethod(
        FirestoreAdminClient.parse_common_organization_path
    )
    common_project_path = staticmethod(FirestoreAdminClient.common_project_path)
    parse_common_project_path = staticmethod(
        FirestoreAdminClient.parse_common_project_path
    )
    common_location_path = staticmethod(FirestoreAdminClient.common_location_path)
    parse_common_location_path = staticmethod(
        FirestoreAdminClient.parse_common_location_path
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
            FirestoreAdminAsyncClient: The constructed client.
        """
        return FirestoreAdminClient.from_service_account_info.__func__(FirestoreAdminAsyncClient, info, *args, **kwargs)  # type: ignore

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
            FirestoreAdminAsyncClient: The constructed client.
        """
        return FirestoreAdminClient.from_service_account_file.__func__(FirestoreAdminAsyncClient, filename, *args, **kwargs)  # type: ignore

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
        default mTLS endpoint; if the environment variable is "never", use the default API
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
        return FirestoreAdminClient.get_mtls_endpoint_and_cert_source(client_options)  # type: ignore

    @property
    def transport(self) -> FirestoreAdminTransport:
        """Returns the transport used by the client instance.

        Returns:
            FirestoreAdminTransport: The transport used by the client instance.
        """
        return self._client.transport

    @property
    def api_endpoint(self):
        """Return the API endpoint used by the client instance.

        Returns:
            str: The API endpoint used by the client instance.
        """
        return self._client._api_endpoint

    @property
    def universe_domain(self) -> str:
        """Return the universe domain used by the client instance.

        Returns:
            str: The universe domain used
                by the client instance.
        """
        return self._client._universe_domain

    get_transport_class = FirestoreAdminClient.get_transport_class

    def __init__(
        self,
        *,
        credentials: Optional[ga_credentials.Credentials] = None,
        transport: Optional[
            Union[str, FirestoreAdminTransport, Callable[..., FirestoreAdminTransport]]
        ] = "grpc_asyncio",
        client_options: Optional[ClientOptions] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
    ) -> None:
        """Instantiates the firestore admin async client.

        Args:
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
            transport (Optional[Union[str,FirestoreAdminTransport,Callable[..., FirestoreAdminTransport]]]):
                The transport to use, or a Callable that constructs and returns a new transport to use.
                If a Callable is given, it will be called with the same set of initialization
                arguments as used in the FirestoreAdminTransport constructor.
                If set to None, a transport is chosen automatically.
            client_options (Optional[Union[google.api_core.client_options.ClientOptions, dict]]):
                Custom options for the client.

                1. The ``api_endpoint`` property can be used to override the
                default endpoint provided by the client when ``transport`` is
                not explicitly provided. Only if this property is not set and
                ``transport`` was not explicitly provided, the endpoint is
                determined by the GOOGLE_API_USE_MTLS_ENDPOINT environment
                variable, which have one of the following values:
                "always" (always use the default mTLS endpoint), "never" (always
                use the default regular endpoint) and "auto" (auto-switch to the
                default mTLS endpoint if client certificate is present; this is
                the default value).

                2. If the GOOGLE_API_USE_CLIENT_CERTIFICATE environment variable
                is "true", then the ``client_cert_source`` property can be used
                to provide a client certificate for mTLS transport. If
                not provided, the default SSL client certificate will be used if
                present. If GOOGLE_API_USE_CLIENT_CERTIFICATE is "false" or not
                set, no client certificate will be used.

                3. The ``universe_domain`` property can be used to override the
                default "googleapis.com" universe. Note that ``api_endpoint``
                property still takes precedence; and ``universe_domain`` is
                currently not supported for mTLS.

            client_info (google.api_core.gapic_v1.client_info.ClientInfo):
                The client info used to send a user-agent string along with
                API requests. If ``None``, then default info will be used.
                Generally, you only need to set this if you're developing
                your own client library.

        Raises:
            google.auth.exceptions.MutualTlsChannelError: If mutual TLS transport
                creation failed for any reason.
        """
        self._client = FirestoreAdminClient(
            credentials=credentials,
            transport=transport,
            client_options=client_options,
            client_info=client_info,
        )

        if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
            std_logging.DEBUG
        ):  # pragma: NO COVER
            _LOGGER.debug(
                "Created client `google.firestore.admin_v1.FirestoreAdminAsyncClient`.",
                extra={
                    "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                    "universeDomain": getattr(
                        self._client._transport._credentials, "universe_domain", ""
                    ),
                    "credentialsType": f"{type(self._client._transport._credentials).__module__}.{type(self._client._transport._credentials).__qualname__}",
                    "credentialsInfo": getattr(
                        self.transport._credentials, "get_cred_info", lambda: None
                    )(),
                }
                if hasattr(self._client._transport, "_credentials")
                else {
                    "serviceName": "google.firestore.admin.v1.FirestoreAdmin",
                    "credentialsType": None,
                },
            )

    async def create_index(
        self,
        request: Optional[Union[firestore_admin.CreateIndexRequest, dict]] = None,
        *,
        parent: Optional[str] = None,
        index: Optional[gfa_index.Index] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Creates a composite index. This returns a
        [google.longrunning.Operation][google.longrunning.Operation]
        which may be used to track the status of the creation. The
        metadata for the operation will be the type
        [IndexOperationMetadata][google.firestore.admin.v1.IndexOperationMetadata].

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_create_index():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.CreateIndexRequest(
                    parent="parent_value",
                )

                # Make the request
                operation = client.create_index(request=request)

                print("Waiting for operation to complete...")

                response = (await operation).result()

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.CreateIndexRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.CreateIndex][google.firestore.admin.v1.FirestoreAdmin.CreateIndex].
            parent (:class:`str`):
                Required. A parent name of the form
                ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            index (:class:`google.cloud.firestore_admin_v1.types.Index`):
                Required. The composite index to
                create.

                This corresponds to the ``index`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.api_core.operation_async.AsyncOperation:
                An object representing a long-running operation.

                The result type for the operation will be :class:`google.cloud.firestore_admin_v1.types.Index` Cloud Firestore indexes enable simple and complex queries against
                   documents in a database.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [parent, index]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.CreateIndexRequest):
            request = firestore_admin.CreateIndexRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if index is not None:
            request.index = index

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.create_index
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

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
            gfa_index.Index,
            metadata_type=gfa_operation.IndexOperationMetadata,
        )

        # Done; return the response.
        return response

    async def list_indexes(
        self,
        request: Optional[Union[firestore_admin.ListIndexesRequest, dict]] = None,
        *,
        parent: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> pagers.ListIndexesAsyncPager:
        r"""Lists composite indexes.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_list_indexes():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.ListIndexesRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_indexes(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.ListIndexesRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.ListIndexes][google.firestore.admin.v1.FirestoreAdmin.ListIndexes].
            parent (:class:`str`):
                Required. A parent name of the form
                ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.services.firestore_admin.pagers.ListIndexesAsyncPager:
                The response for
                   [FirestoreAdmin.ListIndexes][google.firestore.admin.v1.FirestoreAdmin.ListIndexes].

                Iterating over this object will yield results and
                resolve additional pages automatically.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [parent]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.ListIndexesRequest):
            request = firestore_admin.ListIndexesRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.list_indexes
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # This method is paged; wrap the response in a pager, which provides
        # an `__aiter__` convenience method.
        response = pagers.ListIndexesAsyncPager(
            method=rpc,
            request=request,
            response=response,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def get_index(
        self,
        request: Optional[Union[firestore_admin.GetIndexRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> index.Index:
        r"""Gets a composite index.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_get_index():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.GetIndexRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_index(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.GetIndexRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.GetIndex][google.firestore.admin.v1.FirestoreAdmin.GetIndex].
            name (:class:`str`):
                Required. A name of the form
                ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{index_id}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.Index:
                Cloud Firestore indexes enable simple
                and complex queries against documents in
                a database.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.GetIndexRequest):
            request = firestore_admin.GetIndexRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.get_index
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def delete_index(
        self,
        request: Optional[Union[firestore_admin.DeleteIndexRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> None:
        r"""Deletes a composite index.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_delete_index():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.DeleteIndexRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_index(request=request)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.DeleteIndexRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.DeleteIndex][google.firestore.admin.v1.FirestoreAdmin.DeleteIndex].
            name (:class:`str`):
                Required. A name of the form
                ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{index_id}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.DeleteIndexRequest):
            request = firestore_admin.DeleteIndexRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.delete_index
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

    async def get_field(
        self,
        request: Optional[Union[firestore_admin.GetFieldRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> field.Field:
        r"""Gets the metadata and configuration for a Field.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_get_field():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.GetFieldRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_field(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.GetFieldRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.GetField][google.firestore.admin.v1.FirestoreAdmin.GetField].
            name (:class:`str`):
                Required. A name of the form
                ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/fields/{field_id}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.Field:
                Represents a single field in the
                database.
                Fields are grouped by their "Collection
                Group", which represent all collections
                in the database with the same ID.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.GetFieldRequest):
            request = firestore_admin.GetFieldRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.get_field
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def update_field(
        self,
        request: Optional[Union[firestore_admin.UpdateFieldRequest, dict]] = None,
        *,
        field: Optional[gfa_field.Field] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Updates a field configuration. Currently, field updates apply
        only to single field index configuration. However, calls to
        [FirestoreAdmin.UpdateField][google.firestore.admin.v1.FirestoreAdmin.UpdateField]
        should provide a field mask to avoid changing any configuration
        that the caller isn't aware of. The field mask should be
        specified as: ``{ paths: "index_config" }``.

        This call returns a
        [google.longrunning.Operation][google.longrunning.Operation]
        which may be used to track the status of the field update. The
        metadata for the operation will be the type
        [FieldOperationMetadata][google.firestore.admin.v1.FieldOperationMetadata].

        To configure the default field settings for the database, use
        the special ``Field`` with resource name:
        ``projects/{project_id}/databases/{database_id}/collectionGroups/__default__/fields/*``.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_update_field():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                field = firestore_admin_v1.Field()
                field.name = "name_value"

                request = firestore_admin_v1.UpdateFieldRequest(
                    field=field,
                )

                # Make the request
                operation = client.update_field(request=request)

                print("Waiting for operation to complete...")

                response = (await operation).result()

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.UpdateFieldRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.UpdateField][google.firestore.admin.v1.FirestoreAdmin.UpdateField].
            field (:class:`google.cloud.firestore_admin_v1.types.Field`):
                Required. The field to be updated.
                This corresponds to the ``field`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.api_core.operation_async.AsyncOperation:
                An object representing a long-running operation.

                The result type for the operation will be
                :class:`google.cloud.firestore_admin_v1.types.Field`
                Represents a single field in the database.

                   Fields are grouped by their "Collection Group", which
                   represent all collections in the database with the
                   same ID.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [field]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.UpdateFieldRequest):
            request = firestore_admin.UpdateFieldRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if field is not None:
            request.field = field

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.update_field
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata(
                (("field.name", request.field.name),)
            ),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

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
            gfa_field.Field,
            metadata_type=gfa_operation.FieldOperationMetadata,
        )

        # Done; return the response.
        return response

    async def list_fields(
        self,
        request: Optional[Union[firestore_admin.ListFieldsRequest, dict]] = None,
        *,
        parent: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> pagers.ListFieldsAsyncPager:
        r"""Lists the field configuration and metadata for this database.

        Currently,
        [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields]
        only supports listing fields that have been explicitly
        overridden. To issue this query, call
        [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields]
        with the filter set to ``indexConfig.usesAncestorConfig:false``
        or ``ttlConfig:*``.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_list_fields():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.ListFieldsRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_fields(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.ListFieldsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields].
            parent (:class:`str`):
                Required. A parent name of the form
                ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.services.firestore_admin.pagers.ListFieldsAsyncPager:
                The response for
                   [FirestoreAdmin.ListFields][google.firestore.admin.v1.FirestoreAdmin.ListFields].

                Iterating over this object will yield results and
                resolve additional pages automatically.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [parent]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.ListFieldsRequest):
            request = firestore_admin.ListFieldsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.list_fields
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # This method is paged; wrap the response in a pager, which provides
        # an `__aiter__` convenience method.
        response = pagers.ListFieldsAsyncPager(
            method=rpc,
            request=request,
            response=response,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def export_documents(
        self,
        request: Optional[Union[firestore_admin.ExportDocumentsRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Exports a copy of all or a subset of documents from
        Google Cloud Firestore to another storage system, such
        as Google Cloud Storage. Recent updates to documents may
        not be reflected in the export. The export occurs in the
        background and its progress can be monitored and managed
        via the Operation resource that is created. The output
        of an export may only be used once the associated
        operation is done. If an export operation is cancelled
        before completion it may leave partial data behind in
        Google Cloud Storage.

        For more details on export behavior and output format,
        refer to:

        https://cloud.google.com/firestore/docs/manage-data/export-import

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_export_documents():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.ExportDocumentsRequest(
                    name="name_value",
                )

                # Make the request
                operation = client.export_documents(request=request)

                print("Waiting for operation to complete...")

                response = (await operation).result()

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.ExportDocumentsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.ExportDocuments][google.firestore.admin.v1.FirestoreAdmin.ExportDocuments].
            name (:class:`str`):
                Required. Database to export. Should be of the form:
                ``projects/{project_id}/databases/{database_id}``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.api_core.operation_async.AsyncOperation:
                An object representing a long-running operation.

                The result type for the operation will be :class:`google.cloud.firestore_admin_v1.types.ExportDocumentsResponse` Returned in the [google.longrunning.Operation][google.longrunning.Operation]
                   response field.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.ExportDocumentsRequest):
            request = firestore_admin.ExportDocumentsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.export_documents
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

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
            gfa_operation.ExportDocumentsResponse,
            metadata_type=gfa_operation.ExportDocumentsMetadata,
        )

        # Done; return the response.
        return response

    async def import_documents(
        self,
        request: Optional[Union[firestore_admin.ImportDocumentsRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Imports documents into Google Cloud Firestore.
        Existing documents with the same name are overwritten.
        The import occurs in the background and its progress can
        be monitored and managed via the Operation resource that
        is created. If an ImportDocuments operation is
        cancelled, it is possible that a subset of the data has
        already been imported to Cloud Firestore.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_import_documents():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.ImportDocumentsRequest(
                    name="name_value",
                )

                # Make the request
                operation = client.import_documents(request=request)

                print("Waiting for operation to complete...")

                response = (await operation).result()

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.ImportDocumentsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.ImportDocuments][google.firestore.admin.v1.FirestoreAdmin.ImportDocuments].
            name (:class:`str`):
                Required. Database to import into. Should be of the
                form: ``projects/{project_id}/databases/{database_id}``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.api_core.operation_async.AsyncOperation:
                An object representing a long-running operation.

                The result type for the operation will be :class:`google.protobuf.empty_pb2.Empty` A generic empty message that you can re-use to avoid defining duplicated
                   empty messages in your APIs. A typical example is to
                   use it as the request or the response type of an API
                   method. For instance:

                      service Foo {
                         rpc Bar(google.protobuf.Empty) returns
                         (google.protobuf.Empty);

                      }

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.ImportDocumentsRequest):
            request = firestore_admin.ImportDocumentsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.import_documents
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

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
            empty_pb2.Empty,
            metadata_type=gfa_operation.ImportDocumentsMetadata,
        )

        # Done; return the response.
        return response

    async def bulk_delete_documents(
        self,
        request: Optional[
            Union[firestore_admin.BulkDeleteDocumentsRequest, dict]
        ] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Bulk deletes a subset of documents from Google Cloud
        Firestore. Documents created or updated after the
        underlying system starts to process the request will not
        be deleted. The bulk delete occurs in the background and
        its progress can be monitored and managed via the
        Operation resource that is created.

        For more details on bulk delete behavior, refer to:

        https://cloud.google.com/firestore/docs/manage-data/bulk-delete

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_bulk_delete_documents():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.BulkDeleteDocumentsRequest(
                    name="name_value",
                )

                # Make the request
                operation = client.bulk_delete_documents(request=request)

                print("Waiting for operation to complete...")

                response = (await operation).result()

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.BulkDeleteDocumentsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.BulkDeleteDocuments][google.firestore.admin.v1.FirestoreAdmin.BulkDeleteDocuments].

                When both collection_ids and namespace_ids are set, only
                documents satisfying both conditions will be deleted.

                Requests with namespace_ids and collection_ids both
                empty will be rejected. Please use
                [FirestoreAdmin.DeleteDatabase][google.firestore.admin.v1.FirestoreAdmin.DeleteDatabase]
                instead.
            name (:class:`str`):
                Required. Database to operate. Should be of the form:
                ``projects/{project_id}/databases/{database_id}``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.api_core.operation_async.AsyncOperation:
                An object representing a long-running operation.

                The result type for the operation will be :class:`google.cloud.firestore_admin_v1.types.BulkDeleteDocumentsResponse` The response for
                   [FirestoreAdmin.BulkDeleteDocuments][google.firestore.admin.v1.FirestoreAdmin.BulkDeleteDocuments].

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.BulkDeleteDocumentsRequest):
            request = firestore_admin.BulkDeleteDocumentsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.bulk_delete_documents
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

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
            firestore_admin.BulkDeleteDocumentsResponse,
            metadata_type=gfa_operation.BulkDeleteDocumentsMetadata,
        )

        # Done; return the response.
        return response

    async def create_database(
        self,
        request: Optional[Union[firestore_admin.CreateDatabaseRequest, dict]] = None,
        *,
        parent: Optional[str] = None,
        database: Optional[gfa_database.Database] = None,
        database_id: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Create a database.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_create_database():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.CreateDatabaseRequest(
                    parent="parent_value",
                    database_id="database_id_value",
                )

                # Make the request
                operation = client.create_database(request=request)

                print("Waiting for operation to complete...")

                response = (await operation).result()

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.CreateDatabaseRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.CreateDatabase][google.firestore.admin.v1.FirestoreAdmin.CreateDatabase].
            parent (:class:`str`):
                Required. A parent name of the form
                ``projects/{project_id}``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            database (:class:`google.cloud.firestore_admin_v1.types.Database`):
                Required. The Database to create.
                This corresponds to the ``database`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            database_id (:class:`str`):
                Required. The ID to use for the database, which will
                become the final component of the database's resource
                name.

                This value should be 4-63 characters. Valid characters
                are /[a-z][0-9]-/ with first character a letter and the
                last a letter or a number. Must not be UUID-like
                /[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/.

                "(default)" database ID is also valid.

                This corresponds to the ``database_id`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.api_core.operation_async.AsyncOperation:
                An object representing a long-running operation.

                The result type for the operation will be
                :class:`google.cloud.firestore_admin_v1.types.Database`
                A Cloud Firestore Database.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [parent, database, database_id]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.CreateDatabaseRequest):
            request = firestore_admin.CreateDatabaseRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if database is not None:
            request.database = database
        if database_id is not None:
            request.database_id = database_id

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.create_database
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

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
            gfa_database.Database,
            metadata_type=firestore_admin.CreateDatabaseMetadata,
        )

        # Done; return the response.
        return response

    async def get_database(
        self,
        request: Optional[Union[firestore_admin.GetDatabaseRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> database.Database:
        r"""Gets information about a database.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_get_database():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.GetDatabaseRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_database(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.GetDatabaseRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.GetDatabase][google.firestore.admin.v1.FirestoreAdmin.GetDatabase].
            name (:class:`str`):
                Required. A name of the form
                ``projects/{project_id}/databases/{database_id}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.Database:
                A Cloud Firestore Database.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.GetDatabaseRequest):
            request = firestore_admin.GetDatabaseRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.get_database
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def list_databases(
        self,
        request: Optional[Union[firestore_admin.ListDatabasesRequest, dict]] = None,
        *,
        parent: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> firestore_admin.ListDatabasesResponse:
        r"""List all the databases in the project.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_list_databases():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.ListDatabasesRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.list_databases(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.ListDatabasesRequest, dict]]):
                The request object. A request to list the Firestore
                Databases in all locations for a
                project.
            parent (:class:`str`):
                Required. A parent name of the form
                ``projects/{project_id}``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.ListDatabasesResponse:
                The list of databases for a project.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [parent]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.ListDatabasesRequest):
            request = firestore_admin.ListDatabasesRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.list_databases
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def update_database(
        self,
        request: Optional[Union[firestore_admin.UpdateDatabaseRequest, dict]] = None,
        *,
        database: Optional[gfa_database.Database] = None,
        update_mask: Optional[field_mask_pb2.FieldMask] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Updates a database.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_update_database():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.UpdateDatabaseRequest(
                )

                # Make the request
                operation = client.update_database(request=request)

                print("Waiting for operation to complete...")

                response = (await operation).result()

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.UpdateDatabaseRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.UpdateDatabase][google.firestore.admin.v1.FirestoreAdmin.UpdateDatabase].
            database (:class:`google.cloud.firestore_admin_v1.types.Database`):
                Required. The database to update.
                This corresponds to the ``database`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            update_mask (:class:`google.protobuf.field_mask_pb2.FieldMask`):
                The list of fields to be updated.
                This corresponds to the ``update_mask`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.api_core.operation_async.AsyncOperation:
                An object representing a long-running operation.

                The result type for the operation will be
                :class:`google.cloud.firestore_admin_v1.types.Database`
                A Cloud Firestore Database.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [database, update_mask]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.UpdateDatabaseRequest):
            request = firestore_admin.UpdateDatabaseRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if database is not None:
            request.database = database
        if update_mask is not None:
            request.update_mask = update_mask

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.update_database
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata(
                (("database.name", request.database.name),)
            ),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

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
            gfa_database.Database,
            metadata_type=firestore_admin.UpdateDatabaseMetadata,
        )

        # Done; return the response.
        return response

    async def delete_database(
        self,
        request: Optional[Union[firestore_admin.DeleteDatabaseRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Deletes a database.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_delete_database():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.DeleteDatabaseRequest(
                    name="name_value",
                )

                # Make the request
                operation = client.delete_database(request=request)

                print("Waiting for operation to complete...")

                response = (await operation).result()

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.DeleteDatabaseRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.DeleteDatabase][google.firestore.admin.v1.FirestoreAdmin.DeleteDatabase].
            name (:class:`str`):
                Required. A name of the form
                ``projects/{project_id}/databases/{database_id}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.api_core.operation_async.AsyncOperation:
                An object representing a long-running operation.

                The result type for the operation will be
                :class:`google.cloud.firestore_admin_v1.types.Database`
                A Cloud Firestore Database.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.DeleteDatabaseRequest):
            request = firestore_admin.DeleteDatabaseRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.delete_database
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

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
            database.Database,
            metadata_type=firestore_admin.DeleteDatabaseMetadata,
        )

        # Done; return the response.
        return response

    async def create_user_creds(
        self,
        request: Optional[Union[firestore_admin.CreateUserCredsRequest, dict]] = None,
        *,
        parent: Optional[str] = None,
        user_creds: Optional[gfa_user_creds.UserCreds] = None,
        user_creds_id: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> gfa_user_creds.UserCreds:
        r"""Create a user creds.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_create_user_creds():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.CreateUserCredsRequest(
                    parent="parent_value",
                    user_creds_id="user_creds_id_value",
                )

                # Make the request
                response = await client.create_user_creds(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.CreateUserCredsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.CreateUserCreds][google.firestore.admin.v1.FirestoreAdmin.CreateUserCreds].
            parent (:class:`str`):
                Required. A parent name of the form
                ``projects/{project_id}/databases/{database_id}``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            user_creds (:class:`google.cloud.firestore_admin_v1.types.UserCreds`):
                Required. The user creds to create.
                This corresponds to the ``user_creds`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            user_creds_id (:class:`str`):
                Required. The ID to use for the user creds, which will
                become the final component of the user creds's resource
                name.

                This value should be 4-63 characters. Valid characters
                are /[a-z][0-9]-/ with first character a letter and the
                last a letter or a number. Must not be UUID-like
                /[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/.

                This corresponds to the ``user_creds_id`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.UserCreds:
                A Cloud Firestore User Creds.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [parent, user_creds, user_creds_id]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.CreateUserCredsRequest):
            request = firestore_admin.CreateUserCredsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if user_creds is not None:
            request.user_creds = user_creds
        if user_creds_id is not None:
            request.user_creds_id = user_creds_id

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.create_user_creds
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def get_user_creds(
        self,
        request: Optional[Union[firestore_admin.GetUserCredsRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> user_creds.UserCreds:
        r"""Gets a user creds resource. Note that the returned
        resource does not contain the secret value itself.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_get_user_creds():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.GetUserCredsRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_user_creds(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.GetUserCredsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.GetUserCreds][google.firestore.admin.v1.FirestoreAdmin.GetUserCreds].
            name (:class:`str`):
                Required. A name of the form
                ``projects/{project_id}/databases/{database_id}/userCreds/{user_creds_id}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.UserCreds:
                A Cloud Firestore User Creds.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.GetUserCredsRequest):
            request = firestore_admin.GetUserCredsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.get_user_creds
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def list_user_creds(
        self,
        request: Optional[Union[firestore_admin.ListUserCredsRequest, dict]] = None,
        *,
        parent: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> firestore_admin.ListUserCredsResponse:
        r"""List all user creds in the database. Note that the
        returned resource does not contain the secret value
        itself.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_list_user_creds():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.ListUserCredsRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.list_user_creds(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.ListUserCredsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.ListUserCreds][google.firestore.admin.v1.FirestoreAdmin.ListUserCreds].
            parent (:class:`str`):
                Required. A parent database name of the form
                ``projects/{project_id}/databases/{database_id}``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.ListUserCredsResponse:
                The response for
                   [FirestoreAdmin.ListUserCreds][google.firestore.admin.v1.FirestoreAdmin.ListUserCreds].

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [parent]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.ListUserCredsRequest):
            request = firestore_admin.ListUserCredsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.list_user_creds
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def enable_user_creds(
        self,
        request: Optional[Union[firestore_admin.EnableUserCredsRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> user_creds.UserCreds:
        r"""Enables a user creds. No-op if the user creds are
        already enabled.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_enable_user_creds():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.EnableUserCredsRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.enable_user_creds(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.EnableUserCredsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.EnableUserCreds][google.firestore.admin.v1.FirestoreAdmin.EnableUserCreds].
            name (:class:`str`):
                Required. A name of the form
                ``projects/{project_id}/databases/{database_id}/userCreds/{user_creds_id}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.UserCreds:
                A Cloud Firestore User Creds.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.EnableUserCredsRequest):
            request = firestore_admin.EnableUserCredsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.enable_user_creds
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def disable_user_creds(
        self,
        request: Optional[Union[firestore_admin.DisableUserCredsRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> user_creds.UserCreds:
        r"""Disables a user creds. No-op if the user creds are
        already disabled.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_disable_user_creds():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.DisableUserCredsRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.disable_user_creds(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.DisableUserCredsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.DisableUserCreds][google.firestore.admin.v1.FirestoreAdmin.DisableUserCreds].
            name (:class:`str`):
                Required. A name of the form
                ``projects/{project_id}/databases/{database_id}/userCreds/{user_creds_id}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.UserCreds:
                A Cloud Firestore User Creds.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.DisableUserCredsRequest):
            request = firestore_admin.DisableUserCredsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.disable_user_creds
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def reset_user_password(
        self,
        request: Optional[Union[firestore_admin.ResetUserPasswordRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> user_creds.UserCreds:
        r"""Resets the password of a user creds.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_reset_user_password():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.ResetUserPasswordRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.reset_user_password(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.ResetUserPasswordRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.ResetUserPassword][google.firestore.admin.v1.FirestoreAdmin.ResetUserPassword].
            name (:class:`str`):
                Required. A name of the form
                ``projects/{project_id}/databases/{database_id}/userCreds/{user_creds_id}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.UserCreds:
                A Cloud Firestore User Creds.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.ResetUserPasswordRequest):
            request = firestore_admin.ResetUserPasswordRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.reset_user_password
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def delete_user_creds(
        self,
        request: Optional[Union[firestore_admin.DeleteUserCredsRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> None:
        r"""Deletes a user creds.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_delete_user_creds():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.DeleteUserCredsRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_user_creds(request=request)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.DeleteUserCredsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.DeleteUserCreds][google.firestore.admin.v1.FirestoreAdmin.DeleteUserCreds].
            name (:class:`str`):
                Required. A name of the form
                ``projects/{project_id}/databases/{database_id}/userCreds/{user_creds_id}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.DeleteUserCredsRequest):
            request = firestore_admin.DeleteUserCredsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.delete_user_creds
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

    async def get_backup(
        self,
        request: Optional[Union[firestore_admin.GetBackupRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> backup.Backup:
        r"""Gets information about a backup.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_get_backup():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.GetBackupRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_backup(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.GetBackupRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.GetBackup][google.firestore.admin.v1.FirestoreAdmin.GetBackup].
            name (:class:`str`):
                Required. Name of the backup to fetch.

                Format is
                ``projects/{project}/locations/{location}/backups/{backup}``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.Backup:
                A Backup of a Cloud Firestore
                Database.
                The backup contains all documents and
                index configurations for the given
                database at a specific point in time.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.GetBackupRequest):
            request = firestore_admin.GetBackupRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.get_backup
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def list_backups(
        self,
        request: Optional[Union[firestore_admin.ListBackupsRequest, dict]] = None,
        *,
        parent: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> firestore_admin.ListBackupsResponse:
        r"""Lists all the backups.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_list_backups():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.ListBackupsRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.list_backups(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.ListBackupsRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.ListBackups][google.firestore.admin.v1.FirestoreAdmin.ListBackups].
            parent (:class:`str`):
                Required. The location to list backups from.

                Format is ``projects/{project}/locations/{location}``.
                Use ``{location} = '-'`` to list backups from all
                locations for the given project. This allows listing
                backups from a single location or from all locations.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.ListBackupsResponse:
                The response for
                   [FirestoreAdmin.ListBackups][google.firestore.admin.v1.FirestoreAdmin.ListBackups].

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [parent]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.ListBackupsRequest):
            request = firestore_admin.ListBackupsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.list_backups
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def delete_backup(
        self,
        request: Optional[Union[firestore_admin.DeleteBackupRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> None:
        r"""Deletes a backup.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_delete_backup():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.DeleteBackupRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_backup(request=request)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.DeleteBackupRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.DeleteBackup][google.firestore.admin.v1.FirestoreAdmin.DeleteBackup].
            name (:class:`str`):
                Required. Name of the backup to delete.

                format is
                ``projects/{project}/locations/{location}/backups/{backup}``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.DeleteBackupRequest):
            request = firestore_admin.DeleteBackupRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.delete_backup
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

    async def restore_database(
        self,
        request: Optional[Union[firestore_admin.RestoreDatabaseRequest, dict]] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Creates a new database by restoring from an existing backup.

        The new database must be in the same cloud region or
        multi-region location as the existing backup. This behaves
        similar to
        [FirestoreAdmin.CreateDatabase][google.firestore.admin.v1.FirestoreAdmin.CreateDatabase]
        except instead of creating a new empty database, a new database
        is created with the database type, index configuration, and
        documents from an existing backup.

        The [long-running operation][google.longrunning.Operation] can
        be used to track the progress of the restore, with the
        Operation's [metadata][google.longrunning.Operation.metadata]
        field type being the
        [RestoreDatabaseMetadata][google.firestore.admin.v1.RestoreDatabaseMetadata].
        The [response][google.longrunning.Operation.response] type is
        the [Database][google.firestore.admin.v1.Database] if the
        restore was successful. The new database is not readable or
        writeable until the LRO has completed.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_restore_database():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.RestoreDatabaseRequest(
                    parent="parent_value",
                    database_id="database_id_value",
                    backup="backup_value",
                )

                # Make the request
                operation = client.restore_database(request=request)

                print("Waiting for operation to complete...")

                response = (await operation).result()

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.RestoreDatabaseRequest, dict]]):
                The request object. The request message for
                [FirestoreAdmin.RestoreDatabase][google.firestore.admin.v1.FirestoreAdmin.RestoreDatabase].
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.api_core.operation_async.AsyncOperation:
                An object representing a long-running operation.

                The result type for the operation will be
                :class:`google.cloud.firestore_admin_v1.types.Database`
                A Cloud Firestore Database.

        """
        # Create or coerce a protobuf request object.
        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.RestoreDatabaseRequest):
            request = firestore_admin.RestoreDatabaseRequest(request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.restore_database
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

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
            database.Database,
            metadata_type=gfa_operation.RestoreDatabaseMetadata,
        )

        # Done; return the response.
        return response

    async def create_backup_schedule(
        self,
        request: Optional[
            Union[firestore_admin.CreateBackupScheduleRequest, dict]
        ] = None,
        *,
        parent: Optional[str] = None,
        backup_schedule: Optional[schedule.BackupSchedule] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> schedule.BackupSchedule:
        r"""Creates a backup schedule on a database.
        At most two backup schedules can be configured on a
        database, one daily backup schedule and one weekly
        backup schedule.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_create_backup_schedule():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.CreateBackupScheduleRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.create_backup_schedule(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.CreateBackupScheduleRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.CreateBackupSchedule][google.firestore.admin.v1.FirestoreAdmin.CreateBackupSchedule].
            parent (:class:`str`):
                Required. The parent database.

                Format ``projects/{project}/databases/{database}``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            backup_schedule (:class:`google.cloud.firestore_admin_v1.types.BackupSchedule`):
                Required. The backup schedule to
                create.

                This corresponds to the ``backup_schedule`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.BackupSchedule:
                A backup schedule for a Cloud
                Firestore Database.
                This resource is owned by the database
                it is backing up, and is deleted along
                with the database. The actual backups
                are not though.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [parent, backup_schedule]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.CreateBackupScheduleRequest):
            request = firestore_admin.CreateBackupScheduleRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if backup_schedule is not None:
            request.backup_schedule = backup_schedule

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.create_backup_schedule
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def get_backup_schedule(
        self,
        request: Optional[Union[firestore_admin.GetBackupScheduleRequest, dict]] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> schedule.BackupSchedule:
        r"""Gets information about a backup schedule.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_get_backup_schedule():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.GetBackupScheduleRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_backup_schedule(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.GetBackupScheduleRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.GetBackupSchedule][google.firestore.admin.v1.FirestoreAdmin.GetBackupSchedule].
            name (:class:`str`):
                Required. The name of the backup schedule.

                Format
                ``projects/{project}/databases/{database}/backupSchedules/{backup_schedule}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.BackupSchedule:
                A backup schedule for a Cloud
                Firestore Database.
                This resource is owned by the database
                it is backing up, and is deleted along
                with the database. The actual backups
                are not though.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.GetBackupScheduleRequest):
            request = firestore_admin.GetBackupScheduleRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.get_backup_schedule
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def list_backup_schedules(
        self,
        request: Optional[
            Union[firestore_admin.ListBackupSchedulesRequest, dict]
        ] = None,
        *,
        parent: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> firestore_admin.ListBackupSchedulesResponse:
        r"""List backup schedules.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_list_backup_schedules():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.ListBackupSchedulesRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.list_backup_schedules(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.ListBackupSchedulesRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.ListBackupSchedules][google.firestore.admin.v1.FirestoreAdmin.ListBackupSchedules].
            parent (:class:`str`):
                Required. The parent database.

                Format is ``projects/{project}/databases/{database}``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.ListBackupSchedulesResponse:
                The response for
                   [FirestoreAdmin.ListBackupSchedules][google.firestore.admin.v1.FirestoreAdmin.ListBackupSchedules].

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [parent]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.ListBackupSchedulesRequest):
            request = firestore_admin.ListBackupSchedulesRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.list_backup_schedules
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def update_backup_schedule(
        self,
        request: Optional[
            Union[firestore_admin.UpdateBackupScheduleRequest, dict]
        ] = None,
        *,
        backup_schedule: Optional[schedule.BackupSchedule] = None,
        update_mask: Optional[field_mask_pb2.FieldMask] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> schedule.BackupSchedule:
        r"""Updates a backup schedule.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_update_backup_schedule():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.UpdateBackupScheduleRequest(
                )

                # Make the request
                response = await client.update_backup_schedule(request=request)

                # Handle the response
                print(response)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.UpdateBackupScheduleRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.UpdateBackupSchedule][google.firestore.admin.v1.FirestoreAdmin.UpdateBackupSchedule].
            backup_schedule (:class:`google.cloud.firestore_admin_v1.types.BackupSchedule`):
                Required. The backup schedule to
                update.

                This corresponds to the ``backup_schedule`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            update_mask (:class:`google.protobuf.field_mask_pb2.FieldMask`):
                The list of fields to be updated.
                This corresponds to the ``update_mask`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.

        Returns:
            google.cloud.firestore_admin_v1.types.BackupSchedule:
                A backup schedule for a Cloud
                Firestore Database.
                This resource is owned by the database
                it is backing up, and is deleted along
                with the database. The actual backups
                are not though.

        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [backup_schedule, update_mask]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.UpdateBackupScheduleRequest):
            request = firestore_admin.UpdateBackupScheduleRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if backup_schedule is not None:
            request.backup_schedule = backup_schedule
        if update_mask is not None:
            request.update_mask = update_mask

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.update_backup_schedule
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata(
                (("backup_schedule.name", request.backup_schedule.name),)
            ),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def delete_backup_schedule(
        self,
        request: Optional[
            Union[firestore_admin.DeleteBackupScheduleRequest, dict]
        ] = None,
        *,
        name: Optional[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> None:
        r"""Deletes a backup schedule.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import firestore_admin_v1

            async def sample_delete_backup_schedule():
                # Create a client
                client = firestore_admin_v1.FirestoreAdminAsyncClient()

                # Initialize request argument(s)
                request = firestore_admin_v1.DeleteBackupScheduleRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_backup_schedule(request=request)

        Args:
            request (Optional[Union[google.cloud.firestore_admin_v1.types.DeleteBackupScheduleRequest, dict]]):
                The request object. The request for
                [FirestoreAdmin.DeleteBackupSchedules][].
            name (:class:`str`):
                Required. The name of the backup schedule.

                Format
                ``projects/{project}/databases/{database}/backupSchedules/{backup_schedule}``

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        """
        # Create or coerce a protobuf request object.
        # - Quick check: If we got a request object, we should *not* have
        #   gotten any keyword arguments that map to the request.
        flattened_params = [name]
        has_flattened_params = (
            len([param for param in flattened_params if param is not None]) > 0
        )
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # - Use the request object if provided (there's no risk of modifying the input as
        #   there are no flattened fields), or create one.
        if not isinstance(request, firestore_admin.DeleteBackupScheduleRequest):
            request = firestore_admin.DeleteBackupScheduleRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._client._transport._wrapped_methods[
            self._client._transport.delete_backup_schedule
        ]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

    async def list_operations(
        self,
        request: Optional[operations_pb2.ListOperationsRequest] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operations_pb2.ListOperationsResponse:
        r"""Lists operations that match the specified filter in the request.

        Args:
            request (:class:`~.operations_pb2.ListOperationsRequest`):
                The request object. Request message for
                `ListOperations` method.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors,
                    if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        Returns:
            ~.operations_pb2.ListOperationsResponse:
                Response message for ``ListOperations`` method.
        """
        # Create or coerce a protobuf request object.
        # The request isn't a proto-plus wrapped type,
        # so it must be constructed via keyword expansion.
        if isinstance(request, dict):
            request = operations_pb2.ListOperationsRequest(**request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self.transport._wrapped_methods[self._client._transport.list_operations]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def get_operation(
        self,
        request: Optional[operations_pb2.GetOperationRequest] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> operations_pb2.Operation:
        r"""Gets the latest state of a long-running operation.

        Args:
            request (:class:`~.operations_pb2.GetOperationRequest`):
                The request object. Request message for
                `GetOperation` method.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors,
                    if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        Returns:
            ~.operations_pb2.Operation:
                An ``Operation`` object.
        """
        # Create or coerce a protobuf request object.
        # The request isn't a proto-plus wrapped type,
        # so it must be constructed via keyword expansion.
        if isinstance(request, dict):
            request = operations_pb2.GetOperationRequest(**request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self.transport._wrapped_methods[self._client._transport.get_operation]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        response = await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def delete_operation(
        self,
        request: Optional[operations_pb2.DeleteOperationRequest] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> None:
        r"""Deletes a long-running operation.

        This method indicates that the client is no longer interested
        in the operation result. It does not cancel the operation.
        If the server doesn't support this method, it returns
        `google.rpc.Code.UNIMPLEMENTED`.

        Args:
            request (:class:`~.operations_pb2.DeleteOperationRequest`):
                The request object. Request message for
                `DeleteOperation` method.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors,
                    if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        Returns:
            None
        """
        # Create or coerce a protobuf request object.
        # The request isn't a proto-plus wrapped type,
        # so it must be constructed via keyword expansion.
        if isinstance(request, dict):
            request = operations_pb2.DeleteOperationRequest(**request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self.transport._wrapped_methods[self._client._transport.delete_operation]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

    async def cancel_operation(
        self,
        request: Optional[operations_pb2.CancelOperationRequest] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: Union[float, object] = gapic_v1.method.DEFAULT,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
    ) -> None:
        r"""Starts asynchronous cancellation on a long-running operation.

        The server makes a best effort to cancel the operation, but success
        is not guaranteed.  If the server doesn't support this method, it returns
        `google.rpc.Code.UNIMPLEMENTED`.

        Args:
            request (:class:`~.operations_pb2.CancelOperationRequest`):
                The request object. Request message for
                `CancelOperation` method.
            retry (google.api_core.retry_async.AsyncRetry): Designation of what errors,
                    if any, should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                sent along with the request as metadata. Normally, each value must be of type `str`,
                but for metadata keys ending with the suffix `-bin`, the corresponding values must
                be of type `bytes`.
        Returns:
            None
        """
        # Create or coerce a protobuf request object.
        # The request isn't a proto-plus wrapped type,
        # so it must be constructed via keyword expansion.
        if isinstance(request, dict):
            request = operations_pb2.CancelOperationRequest(**request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self.transport._wrapped_methods[self._client._transport.cancel_operation]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
        )

        # Validate the universe domain.
        self._client._validate_universe_domain()

        # Send the request.
        await rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

    async def __aenter__(self) -> "FirestoreAdminAsyncClient":
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.transport.close()


DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
    gapic_version=package_version.__version__
)

if hasattr(DEFAULT_CLIENT_INFO, "protobuf_runtime_version"):  # pragma: NO COVER
    DEFAULT_CLIENT_INFO.protobuf_runtime_version = google.protobuf.__version__


__all__ = ("FirestoreAdminAsyncClient",)
