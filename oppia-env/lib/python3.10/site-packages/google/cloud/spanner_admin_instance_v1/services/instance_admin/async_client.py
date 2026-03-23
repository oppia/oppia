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
from google.cloud.spanner_admin_instance_v1.services.instance_admin import pagers
from google.cloud.spanner_admin_instance_v1.types import spanner_instance_admin
from google.iam.v1 import iam_policy_pb2  # type: ignore
from google.iam.v1 import policy_pb2  # type: ignore
from google.longrunning import operations_pb2  # type: ignore
from google.protobuf import field_mask_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
from .transports.base import InstanceAdminTransport, DEFAULT_CLIENT_INFO
from .transports.grpc_asyncio import InstanceAdminGrpcAsyncIOTransport
from .client import InstanceAdminClient


class InstanceAdminAsyncClient:
    """Cloud Spanner Instance Admin API
    The Cloud Spanner Instance Admin API can be used to create,
    delete, modify and list instances. Instances are dedicated Cloud
    Spanner serving and storage resources to be used by Cloud
    Spanner databases.
    Each instance has a "configuration", which dictates where the
    serving resources for the Cloud Spanner instance are located
    (e.g., US-central, Europe). Configurations are created by Google
    based on resource availability.

    Cloud Spanner billing is based on the instances that exist and
    their sizes. After an instance exists, there are no additional
    per-database or per-operation charges for use of the instance
    (though there may be additional network bandwidth charges).
    Instances offer isolation: problems with databases in one
    instance will not affect other instances. However, within an
    instance databases can affect each other. For example, if one
    database in an instance receives a lot of requests and consumes
    most of the instance resources, fewer resources are available
    for other databases in that instance, and their performance may
    suffer.
    """

    _client: InstanceAdminClient

    DEFAULT_ENDPOINT = InstanceAdminClient.DEFAULT_ENDPOINT
    DEFAULT_MTLS_ENDPOINT = InstanceAdminClient.DEFAULT_MTLS_ENDPOINT

    instance_path = staticmethod(InstanceAdminClient.instance_path)
    parse_instance_path = staticmethod(InstanceAdminClient.parse_instance_path)
    instance_config_path = staticmethod(InstanceAdminClient.instance_config_path)
    parse_instance_config_path = staticmethod(
        InstanceAdminClient.parse_instance_config_path
    )
    common_billing_account_path = staticmethod(
        InstanceAdminClient.common_billing_account_path
    )
    parse_common_billing_account_path = staticmethod(
        InstanceAdminClient.parse_common_billing_account_path
    )
    common_folder_path = staticmethod(InstanceAdminClient.common_folder_path)
    parse_common_folder_path = staticmethod(
        InstanceAdminClient.parse_common_folder_path
    )
    common_organization_path = staticmethod(
        InstanceAdminClient.common_organization_path
    )
    parse_common_organization_path = staticmethod(
        InstanceAdminClient.parse_common_organization_path
    )
    common_project_path = staticmethod(InstanceAdminClient.common_project_path)
    parse_common_project_path = staticmethod(
        InstanceAdminClient.parse_common_project_path
    )
    common_location_path = staticmethod(InstanceAdminClient.common_location_path)
    parse_common_location_path = staticmethod(
        InstanceAdminClient.parse_common_location_path
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
            InstanceAdminAsyncClient: The constructed client.
        """
        return InstanceAdminClient.from_service_account_info.__func__(InstanceAdminAsyncClient, info, *args, **kwargs)  # type: ignore

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
            InstanceAdminAsyncClient: The constructed client.
        """
        return InstanceAdminClient.from_service_account_file.__func__(InstanceAdminAsyncClient, filename, *args, **kwargs)  # type: ignore

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
        return InstanceAdminClient.get_mtls_endpoint_and_cert_source(client_options)  # type: ignore

    @property
    def transport(self) -> InstanceAdminTransport:
        """Returns the transport used by the client instance.

        Returns:
            InstanceAdminTransport: The transport used by the client instance.
        """
        return self._client.transport

    get_transport_class = functools.partial(
        type(InstanceAdminClient).get_transport_class, type(InstanceAdminClient)
    )

    def __init__(
        self,
        *,
        credentials: ga_credentials.Credentials = None,
        transport: Union[str, InstanceAdminTransport] = "grpc_asyncio",
        client_options: ClientOptions = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
    ) -> None:
        """Instantiates the instance admin client.

        Args:
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
            transport (Union[str, ~.InstanceAdminTransport]): The
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
        self._client = InstanceAdminClient(
            credentials=credentials,
            transport=transport,
            client_options=client_options,
            client_info=client_info,
        )

    async def list_instance_configs(
        self,
        request: Union[spanner_instance_admin.ListInstanceConfigsRequest, dict] = None,
        *,
        parent: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> pagers.ListInstanceConfigsAsyncPager:
        r"""Lists the supported instance configurations for a
        given project.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_list_instance_configs():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = spanner_admin_instance_v1.ListInstanceConfigsRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_instance_configs(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigsRequest, dict]):
                The request object. The request for
                [ListInstanceConfigs][google.spanner.admin.instance.v1.InstanceAdmin.ListInstanceConfigs].
            parent (:class:`str`):
                Required. The name of the project for which a list of
                supported instance configurations is requested. Values
                are of the form ``projects/<project>``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.spanner_admin_instance_v1.services.instance_admin.pagers.ListInstanceConfigsAsyncPager:
                The response for
                   [ListInstanceConfigs][google.spanner.admin.instance.v1.InstanceAdmin.ListInstanceConfigs].

                Iterating over this object will yield results and
                resolve additional pages automatically.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = spanner_instance_admin.ListInstanceConfigsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.list_instance_configs,
            default_retry=retries.Retry(
                initial=1.0,
                maximum=32.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=3600.0,
            ),
            default_timeout=3600.0,
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
        response = pagers.ListInstanceConfigsAsyncPager(
            method=rpc,
            request=request,
            response=response,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def get_instance_config(
        self,
        request: Union[spanner_instance_admin.GetInstanceConfigRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> spanner_instance_admin.InstanceConfig:
        r"""Gets information about a particular instance
        configuration.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_get_instance_config():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = spanner_admin_instance_v1.GetInstanceConfigRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_instance_config(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.GetInstanceConfigRequest, dict]):
                The request object. The request for
                [GetInstanceConfigRequest][google.spanner.admin.instance.v1.InstanceAdmin.GetInstanceConfig].
            name (:class:`str`):
                Required. The name of the requested instance
                configuration. Values are of the form
                ``projects/<project>/instanceConfigs/<config>``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.spanner_admin_instance_v1.types.InstanceConfig:
                A possible configuration for a Cloud
                Spanner instance. Configurations define
                the geographic placement of nodes and
                their replication.

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

        request = spanner_instance_admin.GetInstanceConfigRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.get_instance_config,
            default_retry=retries.Retry(
                initial=1.0,
                maximum=32.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=3600.0,
            ),
            default_timeout=3600.0,
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

    async def create_instance_config(
        self,
        request: Union[spanner_instance_admin.CreateInstanceConfigRequest, dict] = None,
        *,
        parent: str = None,
        instance_config: spanner_instance_admin.InstanceConfig = None,
        instance_config_id: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Creates an instance config and begins preparing it to be used.
        The returned [long-running
        operation][google.longrunning.Operation] can be used to track
        the progress of preparing the new instance config. The instance
        config name is assigned by the caller. If the named instance
        config already exists, ``CreateInstanceConfig`` returns
        ``ALREADY_EXISTS``.

        Immediately after the request returns:

        -  The instance config is readable via the API, with all
           requested attributes. The instance config's
           [reconciling][google.spanner.admin.instance.v1.InstanceConfig.reconciling]
           field is set to true. Its state is ``CREATING``.

        While the operation is pending:

        -  Cancelling the operation renders the instance config
           immediately unreadable via the API.
        -  Except for deleting the creating resource, all other attempts
           to modify the instance config are rejected.

        Upon completion of the returned operation:

        -  Instances can be created using the instance configuration.
        -  The instance config's
           [reconciling][google.spanner.admin.instance.v1.InstanceConfig.reconciling]
           field becomes false. Its state becomes ``READY``.

        The returned [long-running
        operation][google.longrunning.Operation] will have a name of the
        format ``<instance_config_name>/operations/<operation_id>`` and
        can be used to track creation of the instance config. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [CreateInstanceConfigMetadata][google.spanner.admin.instance.v1.CreateInstanceConfigMetadata].
        The [response][google.longrunning.Operation.response] field type
        is
        [InstanceConfig][google.spanner.admin.instance.v1.InstanceConfig],
        if successful.

        Authorization requires ``spanner.instanceConfigs.create``
        permission on the resource
        [parent][google.spanner.admin.instance.v1.CreateInstanceConfigRequest.parent].

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_create_instance_config():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = spanner_admin_instance_v1.CreateInstanceConfigRequest(
                    parent="parent_value",
                    instance_config_id="instance_config_id_value",
                )

                # Make the request
                operation = client.create_instance_config(request=request)

                print("Waiting for operation to complete...")

                response = await operation.result()

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.CreateInstanceConfigRequest, dict]):
                The request object. The request for
                [CreateInstanceConfigRequest][InstanceAdmin.CreateInstanceConfigRequest].
            parent (:class:`str`):
                Required. The name of the project in which to create the
                instance config. Values are of the form
                ``projects/<project>``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            instance_config (:class:`google.cloud.spanner_admin_instance_v1.types.InstanceConfig`):
                Required. The InstanceConfig proto of the configuration
                to create. instance_config.name must be
                ``<parent>/instanceConfigs/<instance_config_id>``.
                instance_config.base_config must be a Google managed
                configuration name, e.g. /instanceConfigs/us-east1,
                /instanceConfigs/nam3.

                This corresponds to the ``instance_config`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            instance_config_id (:class:`str`):
                Required. The ID of the instance config to create. Valid
                identifiers are of the form
                ``custom-[-a-z0-9]*[a-z0-9]`` and must be between 2 and
                64 characters in length. The ``custom-`` prefix is
                required to avoid name conflicts with Google managed
                configurations.

                This corresponds to the ``instance_config_id`` field
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

                The result type for the operation will be :class:`google.cloud.spanner_admin_instance_v1.types.InstanceConfig` A possible configuration for a Cloud Spanner instance. Configurations
                   define the geographic placement of nodes and their
                   replication.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, instance_config, instance_config_id])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = spanner_instance_admin.CreateInstanceConfigRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if instance_config is not None:
            request.instance_config = instance_config
        if instance_config_id is not None:
            request.instance_config_id = instance_config_id

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.create_instance_config,
            default_timeout=None,
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
            spanner_instance_admin.InstanceConfig,
            metadata_type=spanner_instance_admin.CreateInstanceConfigMetadata,
        )

        # Done; return the response.
        return response

    async def update_instance_config(
        self,
        request: Union[spanner_instance_admin.UpdateInstanceConfigRequest, dict] = None,
        *,
        instance_config: spanner_instance_admin.InstanceConfig = None,
        update_mask: field_mask_pb2.FieldMask = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Updates an instance config. The returned [long-running
        operation][google.longrunning.Operation] can be used to track
        the progress of updating the instance. If the named instance
        config does not exist, returns ``NOT_FOUND``.

        Only user managed configurations can be updated.

        Immediately after the request returns:

        -  The instance config's
           [reconciling][google.spanner.admin.instance.v1.InstanceConfig.reconciling]
           field is set to true.

        While the operation is pending:

        -  Cancelling the operation sets its metadata's
           [cancel_time][google.spanner.admin.instance.v1.UpdateInstanceConfigMetadata.cancel_time].
           The operation is guaranteed to succeed at undoing all
           changes, after which point it terminates with a ``CANCELLED``
           status.
        -  All other attempts to modify the instance config are
           rejected.
        -  Reading the instance config via the API continues to give the
           pre-request values.

        Upon completion of the returned operation:

        -  Creating instances using the instance configuration uses the
           new values.
        -  The instance config's new values are readable via the API.
        -  The instance config's
           [reconciling][google.spanner.admin.instance.v1.InstanceConfig.reconciling]
           field becomes false.

        The returned [long-running
        operation][google.longrunning.Operation] will have a name of the
        format ``<instance_config_name>/operations/<operation_id>`` and
        can be used to track the instance config modification. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [UpdateInstanceConfigMetadata][google.spanner.admin.instance.v1.UpdateInstanceConfigMetadata].
        The [response][google.longrunning.Operation.response] field type
        is
        [InstanceConfig][google.spanner.admin.instance.v1.InstanceConfig],
        if successful.

        Authorization requires ``spanner.instanceConfigs.update``
        permission on the resource
        [name][google.spanner.admin.instance.v1.InstanceConfig.name].

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_update_instance_config():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = spanner_admin_instance_v1.UpdateInstanceConfigRequest(
                )

                # Make the request
                operation = client.update_instance_config(request=request)

                print("Waiting for operation to complete...")

                response = await operation.result()

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.UpdateInstanceConfigRequest, dict]):
                The request object. The request for
                [UpdateInstanceConfigRequest][InstanceAdmin.UpdateInstanceConfigRequest].
            instance_config (:class:`google.cloud.spanner_admin_instance_v1.types.InstanceConfig`):
                Required. The user instance config to update, which must
                always include the instance config name. Otherwise, only
                fields mentioned in
                [update_mask][google.spanner.admin.instance.v1.UpdateInstanceConfigRequest.update_mask]
                need be included. To prevent conflicts of concurrent
                updates,
                [etag][google.spanner.admin.instance.v1.InstanceConfig.reconciling]
                can be used.

                This corresponds to the ``instance_config`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            update_mask (:class:`google.protobuf.field_mask_pb2.FieldMask`):
                Required. A mask specifying which fields in
                [InstanceConfig][google.spanner.admin.instance.v1.InstanceConfig]
                should be updated. The field mask must always be
                specified; this prevents any future fields in
                [InstanceConfig][google.spanner.admin.instance.v1.InstanceConfig]
                from being erased accidentally by clients that do not
                know about them. Only display_name and labels can be
                updated.

                This corresponds to the ``update_mask`` field
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

                The result type for the operation will be :class:`google.cloud.spanner_admin_instance_v1.types.InstanceConfig` A possible configuration for a Cloud Spanner instance. Configurations
                   define the geographic placement of nodes and their
                   replication.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([instance_config, update_mask])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = spanner_instance_admin.UpdateInstanceConfigRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if instance_config is not None:
            request.instance_config = instance_config
        if update_mask is not None:
            request.update_mask = update_mask

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.update_instance_config,
            default_timeout=None,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata(
                (("instance_config.name", request.instance_config.name),)
            ),
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
            spanner_instance_admin.InstanceConfig,
            metadata_type=spanner_instance_admin.UpdateInstanceConfigMetadata,
        )

        # Done; return the response.
        return response

    async def delete_instance_config(
        self,
        request: Union[spanner_instance_admin.DeleteInstanceConfigRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> None:
        r"""Deletes the instance config. Deletion is only allowed when no
        instances are using the configuration. If any instances are
        using the config, returns ``FAILED_PRECONDITION``.

        Only user managed configurations can be deleted.

        Authorization requires ``spanner.instanceConfigs.delete``
        permission on the resource
        [name][google.spanner.admin.instance.v1.InstanceConfig.name].

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_delete_instance_config():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = spanner_admin_instance_v1.DeleteInstanceConfigRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_instance_config(request=request)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.DeleteInstanceConfigRequest, dict]):
                The request object. The request for
                [DeleteInstanceConfigRequest][InstanceAdmin.DeleteInstanceConfigRequest].
            name (:class:`str`):
                Required. The name of the instance configuration to be
                deleted. Values are of the form
                ``projects/<project>/instanceConfigs/<instance_config>``

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

        request = spanner_instance_admin.DeleteInstanceConfigRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.delete_instance_config,
            default_timeout=None,
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

    async def list_instance_config_operations(
        self,
        request: Union[
            spanner_instance_admin.ListInstanceConfigOperationsRequest, dict
        ] = None,
        *,
        parent: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> pagers.ListInstanceConfigOperationsAsyncPager:
        r"""Lists the user-managed instance config [long-running
        operations][google.longrunning.Operation] in the given project.
        An instance config operation has a name of the form
        ``projects/<project>/instanceConfigs/<instance_config>/operations/<operation>``.
        The long-running operation
        [metadata][google.longrunning.Operation.metadata] field type
        ``metadata.type_url`` describes the type of the metadata.
        Operations returned include those that have
        completed/failed/canceled within the last 7 days, and pending
        operations. Operations returned are ordered by
        ``operation.metadata.value.start_time`` in descending order
        starting from the most recently started operation.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_list_instance_config_operations():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = spanner_admin_instance_v1.ListInstanceConfigOperationsRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_instance_config_operations(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.ListInstanceConfigOperationsRequest, dict]):
                The request object. The request for
                [ListInstanceConfigOperations][google.spanner.admin.instance.v1.InstanceAdmin.ListInstanceConfigOperations].
            parent (:class:`str`):
                Required. The project of the instance config operations.
                Values are of the form ``projects/<project>``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.spanner_admin_instance_v1.services.instance_admin.pagers.ListInstanceConfigOperationsAsyncPager:
                The response for
                   [ListInstanceConfigOperations][google.spanner.admin.instance.v1.InstanceAdmin.ListInstanceConfigOperations].

                Iterating over this object will yield results and
                resolve additional pages automatically.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = spanner_instance_admin.ListInstanceConfigOperationsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.list_instance_config_operations,
            default_timeout=None,
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
        response = pagers.ListInstanceConfigOperationsAsyncPager(
            method=rpc,
            request=request,
            response=response,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def list_instances(
        self,
        request: Union[spanner_instance_admin.ListInstancesRequest, dict] = None,
        *,
        parent: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> pagers.ListInstancesAsyncPager:
        r"""Lists all instances in the given project.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_list_instances():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = spanner_admin_instance_v1.ListInstancesRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_instances(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.ListInstancesRequest, dict]):
                The request object. The request for
                [ListInstances][google.spanner.admin.instance.v1.InstanceAdmin.ListInstances].
            parent (:class:`str`):
                Required. The name of the project for which a list of
                instances is requested. Values are of the form
                ``projects/<project>``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.spanner_admin_instance_v1.services.instance_admin.pagers.ListInstancesAsyncPager:
                The response for
                   [ListInstances][google.spanner.admin.instance.v1.InstanceAdmin.ListInstances].

                Iterating over this object will yield results and
                resolve additional pages automatically.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = spanner_instance_admin.ListInstancesRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.list_instances,
            default_retry=retries.Retry(
                initial=1.0,
                maximum=32.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=3600.0,
            ),
            default_timeout=3600.0,
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
        response = pagers.ListInstancesAsyncPager(
            method=rpc,
            request=request,
            response=response,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def get_instance(
        self,
        request: Union[spanner_instance_admin.GetInstanceRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> spanner_instance_admin.Instance:
        r"""Gets information about a particular instance.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_get_instance():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = spanner_admin_instance_v1.GetInstanceRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_instance(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.GetInstanceRequest, dict]):
                The request object. The request for
                [GetInstance][google.spanner.admin.instance.v1.InstanceAdmin.GetInstance].
            name (:class:`str`):
                Required. The name of the requested instance. Values are
                of the form ``projects/<project>/instances/<instance>``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.spanner_admin_instance_v1.types.Instance:
                An isolated set of Cloud Spanner
                resources on which databases can be
                hosted.

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

        request = spanner_instance_admin.GetInstanceRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.get_instance,
            default_retry=retries.Retry(
                initial=1.0,
                maximum=32.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=3600.0,
            ),
            default_timeout=3600.0,
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

    async def create_instance(
        self,
        request: Union[spanner_instance_admin.CreateInstanceRequest, dict] = None,
        *,
        parent: str = None,
        instance_id: str = None,
        instance: spanner_instance_admin.Instance = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Creates an instance and begins preparing it to begin serving.
        The returned [long-running
        operation][google.longrunning.Operation] can be used to track
        the progress of preparing the new instance. The instance name is
        assigned by the caller. If the named instance already exists,
        ``CreateInstance`` returns ``ALREADY_EXISTS``.

        Immediately upon completion of this request:

        -  The instance is readable via the API, with all requested
           attributes but no allocated resources. Its state is
           ``CREATING``.

        Until completion of the returned operation:

        -  Cancelling the operation renders the instance immediately
           unreadable via the API.
        -  The instance can be deleted.
        -  All other attempts to modify the instance are rejected.

        Upon completion of the returned operation:

        -  Billing for all successfully-allocated resources begins (some
           types may have lower than the requested levels).
        -  Databases can be created in the instance.
        -  The instance's allocated resource levels are readable via the
           API.
        -  The instance's state becomes ``READY``.

        The returned [long-running
        operation][google.longrunning.Operation] will have a name of the
        format ``<instance_name>/operations/<operation_id>`` and can be
        used to track creation of the instance. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [CreateInstanceMetadata][google.spanner.admin.instance.v1.CreateInstanceMetadata].
        The [response][google.longrunning.Operation.response] field type
        is [Instance][google.spanner.admin.instance.v1.Instance], if
        successful.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_create_instance():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                instance = spanner_admin_instance_v1.Instance()
                instance.name = "name_value"
                instance.config = "config_value"
                instance.display_name = "display_name_value"

                request = spanner_admin_instance_v1.CreateInstanceRequest(
                    parent="parent_value",
                    instance_id="instance_id_value",
                    instance=instance,
                )

                # Make the request
                operation = client.create_instance(request=request)

                print("Waiting for operation to complete...")

                response = await operation.result()

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.CreateInstanceRequest, dict]):
                The request object. The request for
                [CreateInstance][google.spanner.admin.instance.v1.InstanceAdmin.CreateInstance].
            parent (:class:`str`):
                Required. The name of the project in which to create the
                instance. Values are of the form ``projects/<project>``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            instance_id (:class:`str`):
                Required. The ID of the instance to create. Valid
                identifiers are of the form ``[a-z][-a-z0-9]*[a-z0-9]``
                and must be between 2 and 64 characters in length.

                This corresponds to the ``instance_id`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            instance (:class:`google.cloud.spanner_admin_instance_v1.types.Instance`):
                Required. The instance to create. The name may be
                omitted, but if specified must be
                ``<parent>/instances/<instance_id>``.

                This corresponds to the ``instance`` field
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

                The result type for the operation will be
                :class:`google.cloud.spanner_admin_instance_v1.types.Instance`
                An isolated set of Cloud Spanner resources on which
                databases can be hosted.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, instance_id, instance])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = spanner_instance_admin.CreateInstanceRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if instance_id is not None:
            request.instance_id = instance_id
        if instance is not None:
            request.instance = instance

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.create_instance,
            default_timeout=3600.0,
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
            spanner_instance_admin.Instance,
            metadata_type=spanner_instance_admin.CreateInstanceMetadata,
        )

        # Done; return the response.
        return response

    async def update_instance(
        self,
        request: Union[spanner_instance_admin.UpdateInstanceRequest, dict] = None,
        *,
        instance: spanner_instance_admin.Instance = None,
        field_mask: field_mask_pb2.FieldMask = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> operation_async.AsyncOperation:
        r"""Updates an instance, and begins allocating or releasing
        resources as requested. The returned [long-running
        operation][google.longrunning.Operation] can be used to track
        the progress of updating the instance. If the named instance
        does not exist, returns ``NOT_FOUND``.

        Immediately upon completion of this request:

        -  For resource types for which a decrease in the instance's
           allocation has been requested, billing is based on the
           newly-requested level.

        Until completion of the returned operation:

        -  Cancelling the operation sets its metadata's
           [cancel_time][google.spanner.admin.instance.v1.UpdateInstanceMetadata.cancel_time],
           and begins restoring resources to their pre-request values.
           The operation is guaranteed to succeed at undoing all
           resource changes, after which point it terminates with a
           ``CANCELLED`` status.
        -  All other attempts to modify the instance are rejected.
        -  Reading the instance via the API continues to give the
           pre-request resource levels.

        Upon completion of the returned operation:

        -  Billing begins for all successfully-allocated resources (some
           types may have lower than the requested levels).
        -  All newly-reserved resources are available for serving the
           instance's tables.
        -  The instance's new resource levels are readable via the API.

        The returned [long-running
        operation][google.longrunning.Operation] will have a name of the
        format ``<instance_name>/operations/<operation_id>`` and can be
        used to track the instance modification. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [UpdateInstanceMetadata][google.spanner.admin.instance.v1.UpdateInstanceMetadata].
        The [response][google.longrunning.Operation.response] field type
        is [Instance][google.spanner.admin.instance.v1.Instance], if
        successful.

        Authorization requires ``spanner.instances.update`` permission
        on the resource
        [name][google.spanner.admin.instance.v1.Instance.name].

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_update_instance():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                instance = spanner_admin_instance_v1.Instance()
                instance.name = "name_value"
                instance.config = "config_value"
                instance.display_name = "display_name_value"

                request = spanner_admin_instance_v1.UpdateInstanceRequest(
                    instance=instance,
                )

                # Make the request
                operation = client.update_instance(request=request)

                print("Waiting for operation to complete...")

                response = await operation.result()

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.UpdateInstanceRequest, dict]):
                The request object. The request for
                [UpdateInstance][google.spanner.admin.instance.v1.InstanceAdmin.UpdateInstance].
            instance (:class:`google.cloud.spanner_admin_instance_v1.types.Instance`):
                Required. The instance to update, which must always
                include the instance name. Otherwise, only fields
                mentioned in
                [field_mask][google.spanner.admin.instance.v1.UpdateInstanceRequest.field_mask]
                need be included.

                This corresponds to the ``instance`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            field_mask (:class:`google.protobuf.field_mask_pb2.FieldMask`):
                Required. A mask specifying which fields in
                [Instance][google.spanner.admin.instance.v1.Instance]
                should be updated. The field mask must always be
                specified; this prevents any future fields in
                [Instance][google.spanner.admin.instance.v1.Instance]
                from being erased accidentally by clients that do not
                know about them.

                This corresponds to the ``field_mask`` field
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

                The result type for the operation will be
                :class:`google.cloud.spanner_admin_instance_v1.types.Instance`
                An isolated set of Cloud Spanner resources on which
                databases can be hosted.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([instance, field_mask])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = spanner_instance_admin.UpdateInstanceRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if instance is not None:
            request.instance = instance
        if field_mask is not None:
            request.field_mask = field_mask

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.update_instance,
            default_timeout=3600.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata(
                (("instance.name", request.instance.name),)
            ),
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
            spanner_instance_admin.Instance,
            metadata_type=spanner_instance_admin.UpdateInstanceMetadata,
        )

        # Done; return the response.
        return response

    async def delete_instance(
        self,
        request: Union[spanner_instance_admin.DeleteInstanceRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> None:
        r"""Deletes an instance.

        Immediately upon completion of the request:

        -  Billing ceases for all of the instance's reserved resources.

        Soon afterward:

        -  The instance and *all of its databases* immediately and
           irrevocably disappear from the API. All data in the databases
           is permanently deleted.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1

            async def sample_delete_instance():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = spanner_admin_instance_v1.DeleteInstanceRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_instance(request=request)

        Args:
            request (Union[google.cloud.spanner_admin_instance_v1.types.DeleteInstanceRequest, dict]):
                The request object. The request for
                [DeleteInstance][google.spanner.admin.instance.v1.InstanceAdmin.DeleteInstance].
            name (:class:`str`):
                Required. The name of the instance to be deleted. Values
                are of the form
                ``projects/<project>/instances/<instance>``

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

        request = spanner_instance_admin.DeleteInstanceRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.delete_instance,
            default_retry=retries.Retry(
                initial=1.0,
                maximum=32.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=3600.0,
            ),
            default_timeout=3600.0,
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

    async def set_iam_policy(
        self,
        request: Union[iam_policy_pb2.SetIamPolicyRequest, dict] = None,
        *,
        resource: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> policy_pb2.Policy:
        r"""Sets the access control policy on an instance resource. Replaces
        any existing policy.

        Authorization requires ``spanner.instances.setIamPolicy`` on
        [resource][google.iam.v1.SetIamPolicyRequest.resource].

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1
            from google.iam.v1 import iam_policy_pb2  # type: ignore

            async def sample_set_iam_policy():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = iam_policy_pb2.SetIamPolicyRequest(
                    resource="resource_value",
                )

                # Make the request
                response = await client.set_iam_policy(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.iam.v1.iam_policy_pb2.SetIamPolicyRequest, dict]):
                The request object. Request message for `SetIamPolicy`
                method.
            resource (:class:`str`):
                REQUIRED: The resource for which the
                policy is being specified. See the
                operation documentation for the
                appropriate value for this field.

                This corresponds to the ``resource`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.iam.v1.policy_pb2.Policy:
                An Identity and Access Management (IAM) policy, which specifies access
                   controls for Google Cloud resources.

                   A Policy is a collection of bindings. A binding binds
                   one or more members, or principals, to a single role.
                   Principals can be user accounts, service accounts,
                   Google groups, and domains (such as G Suite). A role
                   is a named list of permissions; each role can be an
                   IAM predefined role or a user-created custom role.

                   For some types of Google Cloud resources, a binding
                   can also specify a condition, which is a logical
                   expression that allows access to a resource only if
                   the expression evaluates to true. A condition can add
                   constraints based on attributes of the request, the
                   resource, or both. To learn which resources support
                   conditions in their IAM policies, see the [IAM
                   documentation](\ https://cloud.google.com/iam/help/conditions/resource-policies).

                   **JSON example:**

                      {
                         "bindings": [
                            {
                               "role":
                               "roles/resourcemanager.organizationAdmin",
                               "members": [ "user:mike@example.com",
                               "group:admins@example.com",
                               "domain:google.com",
                               "serviceAccount:my-project-id@appspot.gserviceaccount.com"
                               ]

                            }, { "role":
                            "roles/resourcemanager.organizationViewer",
                            "members": [ "user:eve@example.com" ],
                            "condition": { "title": "expirable access",
                            "description": "Does not grant access after
                            Sep 2020", "expression": "request.time <
                            timestamp('2020-10-01T00:00:00.000Z')", } }

                         ], "etag": "BwWWja0YfJA=", "version": 3

                      }

                   **YAML example:**

                      bindings: - members: - user:\ mike@example.com -
                      group:\ admins@example.com - domain:google.com -
                      serviceAccount:\ my-project-id@appspot.gserviceaccount.com
                      role: roles/resourcemanager.organizationAdmin -
                      members: - user:\ eve@example.com role:
                      roles/resourcemanager.organizationViewer
                      condition: title: expirable access description:
                      Does not grant access after Sep 2020 expression:
                      request.time <
                      timestamp('2020-10-01T00:00:00.000Z') etag:
                      BwWWja0YfJA= version: 3

                   For a description of IAM and its features, see the
                   [IAM
                   documentation](\ https://cloud.google.com/iam/docs/).

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([resource])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # The request isn't a proto-plus wrapped type,
        # so it must be constructed via keyword expansion.
        if isinstance(request, dict):
            request = iam_policy_pb2.SetIamPolicyRequest(**request)
        elif not request:
            request = iam_policy_pb2.SetIamPolicyRequest(
                resource=resource,
            )

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.set_iam_policy,
            default_timeout=30.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("resource", request.resource),)),
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

    async def get_iam_policy(
        self,
        request: Union[iam_policy_pb2.GetIamPolicyRequest, dict] = None,
        *,
        resource: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> policy_pb2.Policy:
        r"""Gets the access control policy for an instance resource. Returns
        an empty policy if an instance exists but does not have a policy
        set.

        Authorization requires ``spanner.instances.getIamPolicy`` on
        [resource][google.iam.v1.GetIamPolicyRequest.resource].

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1
            from google.iam.v1 import iam_policy_pb2  # type: ignore

            async def sample_get_iam_policy():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = iam_policy_pb2.GetIamPolicyRequest(
                    resource="resource_value",
                )

                # Make the request
                response = await client.get_iam_policy(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.iam.v1.iam_policy_pb2.GetIamPolicyRequest, dict]):
                The request object. Request message for `GetIamPolicy`
                method.
            resource (:class:`str`):
                REQUIRED: The resource for which the
                policy is being requested. See the
                operation documentation for the
                appropriate value for this field.

                This corresponds to the ``resource`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.iam.v1.policy_pb2.Policy:
                An Identity and Access Management (IAM) policy, which specifies access
                   controls for Google Cloud resources.

                   A Policy is a collection of bindings. A binding binds
                   one or more members, or principals, to a single role.
                   Principals can be user accounts, service accounts,
                   Google groups, and domains (such as G Suite). A role
                   is a named list of permissions; each role can be an
                   IAM predefined role or a user-created custom role.

                   For some types of Google Cloud resources, a binding
                   can also specify a condition, which is a logical
                   expression that allows access to a resource only if
                   the expression evaluates to true. A condition can add
                   constraints based on attributes of the request, the
                   resource, or both. To learn which resources support
                   conditions in their IAM policies, see the [IAM
                   documentation](\ https://cloud.google.com/iam/help/conditions/resource-policies).

                   **JSON example:**

                      {
                         "bindings": [
                            {
                               "role":
                               "roles/resourcemanager.organizationAdmin",
                               "members": [ "user:mike@example.com",
                               "group:admins@example.com",
                               "domain:google.com",
                               "serviceAccount:my-project-id@appspot.gserviceaccount.com"
                               ]

                            }, { "role":
                            "roles/resourcemanager.organizationViewer",
                            "members": [ "user:eve@example.com" ],
                            "condition": { "title": "expirable access",
                            "description": "Does not grant access after
                            Sep 2020", "expression": "request.time <
                            timestamp('2020-10-01T00:00:00.000Z')", } }

                         ], "etag": "BwWWja0YfJA=", "version": 3

                      }

                   **YAML example:**

                      bindings: - members: - user:\ mike@example.com -
                      group:\ admins@example.com - domain:google.com -
                      serviceAccount:\ my-project-id@appspot.gserviceaccount.com
                      role: roles/resourcemanager.organizationAdmin -
                      members: - user:\ eve@example.com role:
                      roles/resourcemanager.organizationViewer
                      condition: title: expirable access description:
                      Does not grant access after Sep 2020 expression:
                      request.time <
                      timestamp('2020-10-01T00:00:00.000Z') etag:
                      BwWWja0YfJA= version: 3

                   For a description of IAM and its features, see the
                   [IAM
                   documentation](\ https://cloud.google.com/iam/docs/).

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([resource])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # The request isn't a proto-plus wrapped type,
        # so it must be constructed via keyword expansion.
        if isinstance(request, dict):
            request = iam_policy_pb2.GetIamPolicyRequest(**request)
        elif not request:
            request = iam_policy_pb2.GetIamPolicyRequest(
                resource=resource,
            )

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.get_iam_policy,
            default_retry=retries.Retry(
                initial=1.0,
                maximum=32.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=30.0,
            ),
            default_timeout=30.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("resource", request.resource),)),
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

    async def test_iam_permissions(
        self,
        request: Union[iam_policy_pb2.TestIamPermissionsRequest, dict] = None,
        *,
        resource: str = None,
        permissions: Sequence[str] = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> iam_policy_pb2.TestIamPermissionsResponse:
        r"""Returns permissions that the caller has on the specified
        instance resource.

        Attempting this RPC on a non-existent Cloud Spanner instance
        resource will result in a NOT_FOUND error if the user has
        ``spanner.instances.list`` permission on the containing Google
        Cloud Project. Otherwise returns an empty set of permissions.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import spanner_admin_instance_v1
            from google.iam.v1 import iam_policy_pb2  # type: ignore

            async def sample_test_iam_permissions():
                # Create a client
                client = spanner_admin_instance_v1.InstanceAdminAsyncClient()

                # Initialize request argument(s)
                request = iam_policy_pb2.TestIamPermissionsRequest(
                    resource="resource_value",
                    permissions=['permissions_value1', 'permissions_value2'],
                )

                # Make the request
                response = await client.test_iam_permissions(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.iam.v1.iam_policy_pb2.TestIamPermissionsRequest, dict]):
                The request object. Request message for
                `TestIamPermissions` method.
            resource (:class:`str`):
                REQUIRED: The resource for which the
                policy detail is being requested. See
                the operation documentation for the
                appropriate value for this field.

                This corresponds to the ``resource`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            permissions (:class:`Sequence[str]`):
                The set of permissions to check for the ``resource``.
                Permissions with wildcards (such as '*' or 'storage.*')
                are not allowed. For more information see `IAM
                Overview <https://cloud.google.com/iam/docs/overview#permissions>`__.

                This corresponds to the ``permissions`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.iam.v1.iam_policy_pb2.TestIamPermissionsResponse:
                Response message for TestIamPermissions method.
        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([resource, permissions])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # The request isn't a proto-plus wrapped type,
        # so it must be constructed via keyword expansion.
        if isinstance(request, dict):
            request = iam_policy_pb2.TestIamPermissionsRequest(**request)
        elif not request:
            request = iam_policy_pb2.TestIamPermissionsRequest(
                resource=resource,
                permissions=permissions,
            )

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.test_iam_permissions,
            default_timeout=30.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("resource", request.resource),)),
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

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.transport.close()


try:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
        gapic_version=pkg_resources.get_distribution(
            "google-cloud-spanner-admin-instance",
        ).version,
    )
except pkg_resources.DistributionNotFound:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo()


__all__ = ("InstanceAdminAsyncClient",)
