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

from google.api_core import exceptions as core_exceptions
from google.api_core import gapic_v1
from google.api_core import retry as retries
from google.api_core.client_options import ClientOptions
from google.auth import credentials as ga_credentials  # type: ignore
from google.oauth2 import service_account  # type: ignore
import pkg_resources

try:
    OptionalRetry = Union[retries.Retry, gapic_v1.method._MethodDefault]
except AttributeError:  # pragma: NO COVER
    OptionalRetry = Union[retries.Retry, object]  # type: ignore

from google.protobuf import field_mask_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore

from google.cloud.dlp_v2.services.dlp_service import pagers
from google.cloud.dlp_v2.types import dlp

from .client import DlpServiceClient
from .transports.base import DEFAULT_CLIENT_INFO, DlpServiceTransport
from .transports.grpc_asyncio import DlpServiceGrpcAsyncIOTransport


class DlpServiceAsyncClient:
    """The Cloud Data Loss Prevention (DLP) API is a service that
    allows clients to detect the presence of Personally Identifiable
    Information (PII) and other privacy-sensitive data in
    user-supplied, unstructured data streams, like text blocks or
    images.
    The service also includes methods for sensitive data redaction
    and scheduling of data scans on Google Cloud Platform based data
    sets.
    To learn more about concepts and find how-to guides see
    https://cloud.google.com/dlp/docs/.
    """

    _client: DlpServiceClient

    DEFAULT_ENDPOINT = DlpServiceClient.DEFAULT_ENDPOINT
    DEFAULT_MTLS_ENDPOINT = DlpServiceClient.DEFAULT_MTLS_ENDPOINT

    deidentify_template_path = staticmethod(DlpServiceClient.deidentify_template_path)
    parse_deidentify_template_path = staticmethod(
        DlpServiceClient.parse_deidentify_template_path
    )
    dlp_content_path = staticmethod(DlpServiceClient.dlp_content_path)
    parse_dlp_content_path = staticmethod(DlpServiceClient.parse_dlp_content_path)
    dlp_job_path = staticmethod(DlpServiceClient.dlp_job_path)
    parse_dlp_job_path = staticmethod(DlpServiceClient.parse_dlp_job_path)
    finding_path = staticmethod(DlpServiceClient.finding_path)
    parse_finding_path = staticmethod(DlpServiceClient.parse_finding_path)
    inspect_template_path = staticmethod(DlpServiceClient.inspect_template_path)
    parse_inspect_template_path = staticmethod(
        DlpServiceClient.parse_inspect_template_path
    )
    job_trigger_path = staticmethod(DlpServiceClient.job_trigger_path)
    parse_job_trigger_path = staticmethod(DlpServiceClient.parse_job_trigger_path)
    stored_info_type_path = staticmethod(DlpServiceClient.stored_info_type_path)
    parse_stored_info_type_path = staticmethod(
        DlpServiceClient.parse_stored_info_type_path
    )
    common_billing_account_path = staticmethod(
        DlpServiceClient.common_billing_account_path
    )
    parse_common_billing_account_path = staticmethod(
        DlpServiceClient.parse_common_billing_account_path
    )
    common_folder_path = staticmethod(DlpServiceClient.common_folder_path)
    parse_common_folder_path = staticmethod(DlpServiceClient.parse_common_folder_path)
    common_organization_path = staticmethod(DlpServiceClient.common_organization_path)
    parse_common_organization_path = staticmethod(
        DlpServiceClient.parse_common_organization_path
    )
    common_project_path = staticmethod(DlpServiceClient.common_project_path)
    parse_common_project_path = staticmethod(DlpServiceClient.parse_common_project_path)
    common_location_path = staticmethod(DlpServiceClient.common_location_path)
    parse_common_location_path = staticmethod(
        DlpServiceClient.parse_common_location_path
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
            DlpServiceAsyncClient: The constructed client.
        """
        return DlpServiceClient.from_service_account_info.__func__(DlpServiceAsyncClient, info, *args, **kwargs)  # type: ignore

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
            DlpServiceAsyncClient: The constructed client.
        """
        return DlpServiceClient.from_service_account_file.__func__(DlpServiceAsyncClient, filename, *args, **kwargs)  # type: ignore

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
        return DlpServiceClient.get_mtls_endpoint_and_cert_source(client_options)  # type: ignore

    @property
    def transport(self) -> DlpServiceTransport:
        """Returns the transport used by the client instance.

        Returns:
            DlpServiceTransport: The transport used by the client instance.
        """
        return self._client.transport

    get_transport_class = functools.partial(
        type(DlpServiceClient).get_transport_class, type(DlpServiceClient)
    )

    def __init__(
        self,
        *,
        credentials: ga_credentials.Credentials = None,
        transport: Union[str, DlpServiceTransport] = "grpc_asyncio",
        client_options: ClientOptions = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
    ) -> None:
        """Instantiates the dlp service client.

        Args:
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
            transport (Union[str, ~.DlpServiceTransport]): The
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
        self._client = DlpServiceClient(
            credentials=credentials,
            transport=transport,
            client_options=client_options,
            client_info=client_info,
        )

    async def inspect_content(
        self,
        request: Union[dlp.InspectContentRequest, dict] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.InspectContentResponse:
        r"""Finds potentially sensitive info in content.
        This method has limits on input size, processing time,
        and output size.
        When no InfoTypes or CustomInfoTypes are specified in
        this request, the system will automatically choose what
        detectors to run. By default this may be all types, but
        may change over time as detectors are updated.
        For how to guides, see
        https://cloud.google.com/dlp/docs/inspecting-images and
        https://cloud.google.com/dlp/docs/inspecting-text,

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_inspect_content():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.InspectContentRequest(
                )

                # Make the request
                response = await client.inspect_content(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.InspectContentRequest, dict]):
                The request object. Request to search for potentially
                sensitive info in a ContentItem.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.InspectContentResponse:
                Results of inspecting an item.
        """
        # Create or coerce a protobuf request object.
        request = dlp.InspectContentRequest(request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.inspect_content,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def redact_image(
        self,
        request: Union[dlp.RedactImageRequest, dict] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.RedactImageResponse:
        r"""Redacts potentially sensitive info from an image.
        This method has limits on input size, processing time,
        and output size. See
        https://cloud.google.com/dlp/docs/redacting-sensitive-data-images
        to learn more.

        When no InfoTypes or CustomInfoTypes are specified in
        this request, the system will automatically choose what
        detectors to run. By default this may be all types, but
        may change over time as detectors are updated.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_redact_image():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.RedactImageRequest(
                )

                # Make the request
                response = await client.redact_image(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.RedactImageRequest, dict]):
                The request object. Request to search for potentially
                sensitive info in an image and redact it by covering it
                with a colored rectangle.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.RedactImageResponse:
                Results of redacting an image.
        """
        # Create or coerce a protobuf request object.
        request = dlp.RedactImageRequest(request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.redact_image,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def deidentify_content(
        self,
        request: Union[dlp.DeidentifyContentRequest, dict] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.DeidentifyContentResponse:
        r"""De-identifies potentially sensitive info from a
        ContentItem. This method has limits on input size and
        output size. See
        https://cloud.google.com/dlp/docs/deidentify-sensitive-data
        to learn more.

        When no InfoTypes or CustomInfoTypes are specified in
        this request, the system will automatically choose what
        detectors to run. By default this may be all types, but
        may change over time as detectors are updated.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_deidentify_content():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.DeidentifyContentRequest(
                )

                # Make the request
                response = await client.deidentify_content(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.DeidentifyContentRequest, dict]):
                The request object. Request to de-identify a
                ContentItem.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.DeidentifyContentResponse:
                Results of de-identifying a
                ContentItem.

        """
        # Create or coerce a protobuf request object.
        request = dlp.DeidentifyContentRequest(request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.deidentify_content,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def reidentify_content(
        self,
        request: Union[dlp.ReidentifyContentRequest, dict] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.ReidentifyContentResponse:
        r"""Re-identifies content that has been de-identified. See
        https://cloud.google.com/dlp/docs/pseudonymization#re-identification_in_free_text_code_example
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_reidentify_content():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.ReidentifyContentRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.reidentify_content(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.ReidentifyContentRequest, dict]):
                The request object. Request to re-identify an item.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.ReidentifyContentResponse:
                Results of re-identifying an item.
        """
        # Create or coerce a protobuf request object.
        request = dlp.ReidentifyContentRequest(request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.reidentify_content,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def list_info_types(
        self,
        request: Union[dlp.ListInfoTypesRequest, dict] = None,
        *,
        parent: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.ListInfoTypesResponse:
        r"""Returns a list of the sensitive information types
        that DLP API supports. See
        https://cloud.google.com/dlp/docs/infotypes-reference to
        learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_list_info_types():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.ListInfoTypesRequest(
                )

                # Make the request
                response = await client.list_info_types(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.ListInfoTypesRequest, dict]):
                The request object. Request for the list of infoTypes.
            parent (:class:`str`):
                The parent resource name.

                The format of this value is as follows:

                ::

                    locations/<var>LOCATION_ID</var>

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.ListInfoTypesResponse:
                Response to the ListInfoTypes
                request.

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

        request = dlp.ListInfoTypesRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.list_info_types,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
            client_info=DEFAULT_CLIENT_INFO,
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

    async def create_inspect_template(
        self,
        request: Union[dlp.CreateInspectTemplateRequest, dict] = None,
        *,
        parent: str = None,
        inspect_template: dlp.InspectTemplate = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.InspectTemplate:
        r"""Creates an InspectTemplate for reusing frequently
        used configuration for inspecting content, images, and
        storage. See
        https://cloud.google.com/dlp/docs/creating-templates to
        learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_create_inspect_template():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.CreateInspectTemplateRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.create_inspect_template(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.CreateInspectTemplateRequest, dict]):
                The request object. Request message for
                CreateInspectTemplate.
            parent (:class:`str`):
                Required. Parent resource name.

                The format of this value varies depending on the scope
                of the request (project or organization) and whether you
                have `specified a processing
                location <https://cloud.google.com/dlp/docs/specifying-location>`__:

                -  Projects scope, location specified:
                   ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
                -  Projects scope, no location specified (defaults to
                   global): ``projects/``\ PROJECT_ID
                -  Organizations scope, location specified:
                   ``organizations/``\ ORG_ID\ ``/locations/``\ LOCATION_ID
                -  Organizations scope, no location specified (defaults
                   to global): ``organizations/``\ ORG_ID

                The following example ``parent`` string specifies a
                parent project with the identifier ``example-project``,
                and specifies the ``europe-west3`` location for
                processing data:

                ::

                    parent=projects/example-project/locations/europe-west3

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            inspect_template (:class:`google.cloud.dlp_v2.types.InspectTemplate`):
                Required. The InspectTemplate to
                create.

                This corresponds to the ``inspect_template`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.InspectTemplate:
                The inspectTemplate contains a
                configuration (set of types of sensitive
                data to be detected) to be used anywhere
                you otherwise would normally specify
                InspectConfig. See
                https://cloud.google.com/dlp/docs/concepts-templates
                to learn more.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, inspect_template])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = dlp.CreateInspectTemplateRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if inspect_template is not None:
            request.inspect_template = inspect_template

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.create_inspect_template,
            default_timeout=300.0,
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

    async def update_inspect_template(
        self,
        request: Union[dlp.UpdateInspectTemplateRequest, dict] = None,
        *,
        name: str = None,
        inspect_template: dlp.InspectTemplate = None,
        update_mask: field_mask_pb2.FieldMask = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.InspectTemplate:
        r"""Updates the InspectTemplate.
        See https://cloud.google.com/dlp/docs/creating-templates
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_update_inspect_template():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.UpdateInspectTemplateRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.update_inspect_template(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.UpdateInspectTemplateRequest, dict]):
                The request object. Request message for
                UpdateInspectTemplate.
            name (:class:`str`):
                Required. Resource name of organization and
                inspectTemplate to be updated, for example
                ``organizations/433245324/inspectTemplates/432452342``
                or projects/project-id/inspectTemplates/432452342.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            inspect_template (:class:`google.cloud.dlp_v2.types.InspectTemplate`):
                New InspectTemplate value.
                This corresponds to the ``inspect_template`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            update_mask (:class:`google.protobuf.field_mask_pb2.FieldMask`):
                Mask to control which fields get
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
            google.cloud.dlp_v2.types.InspectTemplate:
                The inspectTemplate contains a
                configuration (set of types of sensitive
                data to be detected) to be used anywhere
                you otherwise would normally specify
                InspectConfig. See
                https://cloud.google.com/dlp/docs/concepts-templates
                to learn more.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([name, inspect_template, update_mask])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = dlp.UpdateInspectTemplateRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name
        if inspect_template is not None:
            request.inspect_template = inspect_template
        if update_mask is not None:
            request.update_mask = update_mask

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.update_inspect_template,
            default_timeout=300.0,
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

    async def get_inspect_template(
        self,
        request: Union[dlp.GetInspectTemplateRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.InspectTemplate:
        r"""Gets an InspectTemplate.
        See https://cloud.google.com/dlp/docs/creating-templates
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_get_inspect_template():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.GetInspectTemplateRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_inspect_template(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.GetInspectTemplateRequest, dict]):
                The request object. Request message for
                GetInspectTemplate.
            name (:class:`str`):
                Required. Resource name of the organization and
                inspectTemplate to be read, for example
                ``organizations/433245324/inspectTemplates/432452342``
                or projects/project-id/inspectTemplates/432452342.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.InspectTemplate:
                The inspectTemplate contains a
                configuration (set of types of sensitive
                data to be detected) to be used anywhere
                you otherwise would normally specify
                InspectConfig. See
                https://cloud.google.com/dlp/docs/concepts-templates
                to learn more.

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

        request = dlp.GetInspectTemplateRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.get_inspect_template,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def list_inspect_templates(
        self,
        request: Union[dlp.ListInspectTemplatesRequest, dict] = None,
        *,
        parent: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> pagers.ListInspectTemplatesAsyncPager:
        r"""Lists InspectTemplates.
        See https://cloud.google.com/dlp/docs/creating-templates
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_list_inspect_templates():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.ListInspectTemplatesRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_inspect_templates(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.ListInspectTemplatesRequest, dict]):
                The request object. Request message for
                ListInspectTemplates.
            parent (:class:`str`):
                Required. Parent resource name.

                The format of this value varies depending on the scope
                of the request (project or organization) and whether you
                have `specified a processing
                location <https://cloud.google.com/dlp/docs/specifying-location>`__:

                -  Projects scope, location specified:
                   ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
                -  Projects scope, no location specified (defaults to
                   global): ``projects/``\ PROJECT_ID
                -  Organizations scope, location specified:
                   ``organizations/``\ ORG_ID\ ``/locations/``\ LOCATION_ID
                -  Organizations scope, no location specified (defaults
                   to global): ``organizations/``\ ORG_ID

                The following example ``parent`` string specifies a
                parent project with the identifier ``example-project``,
                and specifies the ``europe-west3`` location for
                processing data:

                ::

                    parent=projects/example-project/locations/europe-west3

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.services.dlp_service.pagers.ListInspectTemplatesAsyncPager:
                Response message for
                ListInspectTemplates.
                Iterating over this object will yield
                results and resolve additional pages
                automatically.

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

        request = dlp.ListInspectTemplatesRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.list_inspect_templates,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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
        response = pagers.ListInspectTemplatesAsyncPager(
            method=rpc,
            request=request,
            response=response,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def delete_inspect_template(
        self,
        request: Union[dlp.DeleteInspectTemplateRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> None:
        r"""Deletes an InspectTemplate.
        See https://cloud.google.com/dlp/docs/creating-templates
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_delete_inspect_template():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.DeleteInspectTemplateRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_inspect_template(request=request)

        Args:
            request (Union[google.cloud.dlp_v2.types.DeleteInspectTemplateRequest, dict]):
                The request object. Request message for
                DeleteInspectTemplate.
            name (:class:`str`):
                Required. Resource name of the organization and
                inspectTemplate to be deleted, for example
                ``organizations/433245324/inspectTemplates/432452342``
                or projects/project-id/inspectTemplates/432452342.

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

        request = dlp.DeleteInspectTemplateRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.delete_inspect_template,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def create_deidentify_template(
        self,
        request: Union[dlp.CreateDeidentifyTemplateRequest, dict] = None,
        *,
        parent: str = None,
        deidentify_template: dlp.DeidentifyTemplate = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.DeidentifyTemplate:
        r"""Creates a DeidentifyTemplate for reusing frequently
        used configuration for de-identifying content, images,
        and storage. See
        https://cloud.google.com/dlp/docs/creating-templates-deid
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_create_deidentify_template():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.CreateDeidentifyTemplateRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.create_deidentify_template(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.CreateDeidentifyTemplateRequest, dict]):
                The request object. Request message for
                CreateDeidentifyTemplate.
            parent (:class:`str`):
                Required. Parent resource name.

                The format of this value varies depending on the scope
                of the request (project or organization) and whether you
                have `specified a processing
                location <https://cloud.google.com/dlp/docs/specifying-location>`__:

                -  Projects scope, location specified:
                   ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
                -  Projects scope, no location specified (defaults to
                   global): ``projects/``\ PROJECT_ID
                -  Organizations scope, location specified:
                   ``organizations/``\ ORG_ID\ ``/locations/``\ LOCATION_ID
                -  Organizations scope, no location specified (defaults
                   to global): ``organizations/``\ ORG_ID

                The following example ``parent`` string specifies a
                parent project with the identifier ``example-project``,
                and specifies the ``europe-west3`` location for
                processing data:

                ::

                    parent=projects/example-project/locations/europe-west3

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            deidentify_template (:class:`google.cloud.dlp_v2.types.DeidentifyTemplate`):
                Required. The DeidentifyTemplate to
                create.

                This corresponds to the ``deidentify_template`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.DeidentifyTemplate:
                DeidentifyTemplates contains
                instructions on how to de-identify
                content. See
                https://cloud.google.com/dlp/docs/concepts-templates
                to learn more.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, deidentify_template])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = dlp.CreateDeidentifyTemplateRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if deidentify_template is not None:
            request.deidentify_template = deidentify_template

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.create_deidentify_template,
            default_timeout=300.0,
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

    async def update_deidentify_template(
        self,
        request: Union[dlp.UpdateDeidentifyTemplateRequest, dict] = None,
        *,
        name: str = None,
        deidentify_template: dlp.DeidentifyTemplate = None,
        update_mask: field_mask_pb2.FieldMask = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.DeidentifyTemplate:
        r"""Updates the DeidentifyTemplate.
        See
        https://cloud.google.com/dlp/docs/creating-templates-deid
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_update_deidentify_template():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.UpdateDeidentifyTemplateRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.update_deidentify_template(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.UpdateDeidentifyTemplateRequest, dict]):
                The request object. Request message for
                UpdateDeidentifyTemplate.
            name (:class:`str`):
                Required. Resource name of organization and deidentify
                template to be updated, for example
                ``organizations/433245324/deidentifyTemplates/432452342``
                or projects/project-id/deidentifyTemplates/432452342.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            deidentify_template (:class:`google.cloud.dlp_v2.types.DeidentifyTemplate`):
                New DeidentifyTemplate value.
                This corresponds to the ``deidentify_template`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            update_mask (:class:`google.protobuf.field_mask_pb2.FieldMask`):
                Mask to control which fields get
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
            google.cloud.dlp_v2.types.DeidentifyTemplate:
                DeidentifyTemplates contains
                instructions on how to de-identify
                content. See
                https://cloud.google.com/dlp/docs/concepts-templates
                to learn more.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([name, deidentify_template, update_mask])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = dlp.UpdateDeidentifyTemplateRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name
        if deidentify_template is not None:
            request.deidentify_template = deidentify_template
        if update_mask is not None:
            request.update_mask = update_mask

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.update_deidentify_template,
            default_timeout=300.0,
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

    async def get_deidentify_template(
        self,
        request: Union[dlp.GetDeidentifyTemplateRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.DeidentifyTemplate:
        r"""Gets a DeidentifyTemplate.
        See
        https://cloud.google.com/dlp/docs/creating-templates-deid
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_get_deidentify_template():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.GetDeidentifyTemplateRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_deidentify_template(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.GetDeidentifyTemplateRequest, dict]):
                The request object. Request message for
                GetDeidentifyTemplate.
            name (:class:`str`):
                Required. Resource name of the organization and
                deidentify template to be read, for example
                ``organizations/433245324/deidentifyTemplates/432452342``
                or projects/project-id/deidentifyTemplates/432452342.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.DeidentifyTemplate:
                DeidentifyTemplates contains
                instructions on how to de-identify
                content. See
                https://cloud.google.com/dlp/docs/concepts-templates
                to learn more.

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

        request = dlp.GetDeidentifyTemplateRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.get_deidentify_template,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def list_deidentify_templates(
        self,
        request: Union[dlp.ListDeidentifyTemplatesRequest, dict] = None,
        *,
        parent: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> pagers.ListDeidentifyTemplatesAsyncPager:
        r"""Lists DeidentifyTemplates.
        See
        https://cloud.google.com/dlp/docs/creating-templates-deid
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_list_deidentify_templates():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.ListDeidentifyTemplatesRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_deidentify_templates(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.ListDeidentifyTemplatesRequest, dict]):
                The request object. Request message for
                ListDeidentifyTemplates.
            parent (:class:`str`):
                Required. Parent resource name.

                The format of this value varies depending on the scope
                of the request (project or organization) and whether you
                have `specified a processing
                location <https://cloud.google.com/dlp/docs/specifying-location>`__:

                -  Projects scope, location specified:
                   ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
                -  Projects scope, no location specified (defaults to
                   global): ``projects/``\ PROJECT_ID
                -  Organizations scope, location specified:
                   ``organizations/``\ ORG_ID\ ``/locations/``\ LOCATION_ID
                -  Organizations scope, no location specified (defaults
                   to global): ``organizations/``\ ORG_ID

                The following example ``parent`` string specifies a
                parent project with the identifier ``example-project``,
                and specifies the ``europe-west3`` location for
                processing data:

                ::

                    parent=projects/example-project/locations/europe-west3

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.services.dlp_service.pagers.ListDeidentifyTemplatesAsyncPager:
                Response message for
                ListDeidentifyTemplates.
                Iterating over this object will yield
                results and resolve additional pages
                automatically.

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

        request = dlp.ListDeidentifyTemplatesRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.list_deidentify_templates,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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
        response = pagers.ListDeidentifyTemplatesAsyncPager(
            method=rpc,
            request=request,
            response=response,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def delete_deidentify_template(
        self,
        request: Union[dlp.DeleteDeidentifyTemplateRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> None:
        r"""Deletes a DeidentifyTemplate.
        See
        https://cloud.google.com/dlp/docs/creating-templates-deid
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_delete_deidentify_template():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.DeleteDeidentifyTemplateRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_deidentify_template(request=request)

        Args:
            request (Union[google.cloud.dlp_v2.types.DeleteDeidentifyTemplateRequest, dict]):
                The request object. Request message for
                DeleteDeidentifyTemplate.
            name (:class:`str`):
                Required. Resource name of the organization and
                deidentify template to be deleted, for example
                ``organizations/433245324/deidentifyTemplates/432452342``
                or projects/project-id/deidentifyTemplates/432452342.

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

        request = dlp.DeleteDeidentifyTemplateRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.delete_deidentify_template,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def create_job_trigger(
        self,
        request: Union[dlp.CreateJobTriggerRequest, dict] = None,
        *,
        parent: str = None,
        job_trigger: dlp.JobTrigger = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.JobTrigger:
        r"""Creates a job trigger to run DLP actions such as
        scanning storage for sensitive information on a set
        schedule. See
        https://cloud.google.com/dlp/docs/creating-job-triggers
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_create_job_trigger():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                job_trigger = dlp_v2.JobTrigger()
                job_trigger.status = "CANCELLED"

                request = dlp_v2.CreateJobTriggerRequest(
                    parent="parent_value",
                    job_trigger=job_trigger,
                )

                # Make the request
                response = await client.create_job_trigger(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.CreateJobTriggerRequest, dict]):
                The request object. Request message for
                CreateJobTrigger.
            parent (:class:`str`):
                Required. Parent resource name.

                The format of this value varies depending on whether you
                have `specified a processing
                location <https://cloud.google.com/dlp/docs/specifying-location>`__:

                -  Projects scope, location specified:
                   ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
                -  Projects scope, no location specified (defaults to
                   global): ``projects/``\ PROJECT_ID

                The following example ``parent`` string specifies a
                parent project with the identifier ``example-project``,
                and specifies the ``europe-west3`` location for
                processing data:

                ::

                    parent=projects/example-project/locations/europe-west3

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            job_trigger (:class:`google.cloud.dlp_v2.types.JobTrigger`):
                Required. The JobTrigger to create.
                This corresponds to the ``job_trigger`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.JobTrigger:
                Contains a configuration to make dlp
                api calls on a repeating basis. See
                https://cloud.google.com/dlp/docs/concepts-job-triggers
                to learn more.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, job_trigger])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = dlp.CreateJobTriggerRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if job_trigger is not None:
            request.job_trigger = job_trigger

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.create_job_trigger,
            default_timeout=300.0,
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

    async def update_job_trigger(
        self,
        request: Union[dlp.UpdateJobTriggerRequest, dict] = None,
        *,
        name: str = None,
        job_trigger: dlp.JobTrigger = None,
        update_mask: field_mask_pb2.FieldMask = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.JobTrigger:
        r"""Updates a job trigger.
        See
        https://cloud.google.com/dlp/docs/creating-job-triggers
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_update_job_trigger():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.UpdateJobTriggerRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.update_job_trigger(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.UpdateJobTriggerRequest, dict]):
                The request object. Request message for
                UpdateJobTrigger.
            name (:class:`str`):
                Required. Resource name of the project and the
                triggeredJob, for example
                ``projects/dlp-test-project/jobTriggers/53234423``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            job_trigger (:class:`google.cloud.dlp_v2.types.JobTrigger`):
                New JobTrigger value.
                This corresponds to the ``job_trigger`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            update_mask (:class:`google.protobuf.field_mask_pb2.FieldMask`):
                Mask to control which fields get
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
            google.cloud.dlp_v2.types.JobTrigger:
                Contains a configuration to make dlp
                api calls on a repeating basis. See
                https://cloud.google.com/dlp/docs/concepts-job-triggers
                to learn more.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([name, job_trigger, update_mask])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = dlp.UpdateJobTriggerRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name
        if job_trigger is not None:
            request.job_trigger = job_trigger
        if update_mask is not None:
            request.update_mask = update_mask

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.update_job_trigger,
            default_timeout=300.0,
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

    async def hybrid_inspect_job_trigger(
        self,
        request: Union[dlp.HybridInspectJobTriggerRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.HybridInspectResponse:
        r"""Inspect hybrid content and store findings to a
        trigger. The inspection will be processed
        asynchronously. To review the findings monitor the jobs
        within the trigger.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_hybrid_inspect_job_trigger():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.HybridInspectJobTriggerRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.hybrid_inspect_job_trigger(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.HybridInspectJobTriggerRequest, dict]):
                The request object. Request to search for potentially
                sensitive info in a custom location.
            name (:class:`str`):
                Required. Resource name of the trigger to execute a
                hybrid inspect on, for example
                ``projects/dlp-test-project/jobTriggers/53234423``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.HybridInspectResponse:
                Quota exceeded errors will be thrown
                once quota has been met.

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

        request = dlp.HybridInspectJobTriggerRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.hybrid_inspect_job_trigger,
            default_timeout=300.0,
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

    async def get_job_trigger(
        self,
        request: Union[dlp.GetJobTriggerRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.JobTrigger:
        r"""Gets a job trigger.
        See
        https://cloud.google.com/dlp/docs/creating-job-triggers
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_get_job_trigger():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.GetJobTriggerRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_job_trigger(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.GetJobTriggerRequest, dict]):
                The request object. Request message for GetJobTrigger.
            name (:class:`str`):
                Required. Resource name of the project and the
                triggeredJob, for example
                ``projects/dlp-test-project/jobTriggers/53234423``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.JobTrigger:
                Contains a configuration to make dlp
                api calls on a repeating basis. See
                https://cloud.google.com/dlp/docs/concepts-job-triggers
                to learn more.

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

        request = dlp.GetJobTriggerRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.get_job_trigger,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def list_job_triggers(
        self,
        request: Union[dlp.ListJobTriggersRequest, dict] = None,
        *,
        parent: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> pagers.ListJobTriggersAsyncPager:
        r"""Lists job triggers.
        See
        https://cloud.google.com/dlp/docs/creating-job-triggers
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_list_job_triggers():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.ListJobTriggersRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_job_triggers(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.ListJobTriggersRequest, dict]):
                The request object. Request message for ListJobTriggers.
            parent (:class:`str`):
                Required. Parent resource name.

                The format of this value varies depending on whether you
                have `specified a processing
                location <https://cloud.google.com/dlp/docs/specifying-location>`__:

                -  Projects scope, location specified:
                   ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
                -  Projects scope, no location specified (defaults to
                   global): ``projects/``\ PROJECT_ID

                The following example ``parent`` string specifies a
                parent project with the identifier ``example-project``,
                and specifies the ``europe-west3`` location for
                processing data:

                ::

                    parent=projects/example-project/locations/europe-west3

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.services.dlp_service.pagers.ListJobTriggersAsyncPager:
                Response message for ListJobTriggers.
                Iterating over this object will yield
                results and resolve additional pages
                automatically.

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

        request = dlp.ListJobTriggersRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.list_job_triggers,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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
        response = pagers.ListJobTriggersAsyncPager(
            method=rpc,
            request=request,
            response=response,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def delete_job_trigger(
        self,
        request: Union[dlp.DeleteJobTriggerRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> None:
        r"""Deletes a job trigger.
        See
        https://cloud.google.com/dlp/docs/creating-job-triggers
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_delete_job_trigger():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.DeleteJobTriggerRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_job_trigger(request=request)

        Args:
            request (Union[google.cloud.dlp_v2.types.DeleteJobTriggerRequest, dict]):
                The request object. Request message for
                DeleteJobTrigger.
            name (:class:`str`):
                Required. Resource name of the project and the
                triggeredJob, for example
                ``projects/dlp-test-project/jobTriggers/53234423``.

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

        request = dlp.DeleteJobTriggerRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.delete_job_trigger,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def activate_job_trigger(
        self,
        request: Union[dlp.ActivateJobTriggerRequest, dict] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.DlpJob:
        r"""Activate a job trigger. Causes the immediate execute
        of a trigger instead of waiting on the trigger event to
        occur.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_activate_job_trigger():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.ActivateJobTriggerRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.activate_job_trigger(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.ActivateJobTriggerRequest, dict]):
                The request object. Request message for
                ActivateJobTrigger.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.DlpJob:
                Combines all of the information about
                a DLP job.

        """
        # Create or coerce a protobuf request object.
        request = dlp.ActivateJobTriggerRequest(request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.activate_job_trigger,
            default_timeout=300.0,
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

    async def create_dlp_job(
        self,
        request: Union[dlp.CreateDlpJobRequest, dict] = None,
        *,
        parent: str = None,
        inspect_job: dlp.InspectJobConfig = None,
        risk_job: dlp.RiskAnalysisJobConfig = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.DlpJob:
        r"""Creates a new job to inspect storage or calculate
        risk metrics. See
        https://cloud.google.com/dlp/docs/inspecting-storage and
        https://cloud.google.com/dlp/docs/compute-risk-analysis
        to learn more.
        When no InfoTypes or CustomInfoTypes are specified in
        inspect jobs, the system will automatically choose what
        detectors to run. By default this may be all types, but
        may change over time as detectors are updated.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_create_dlp_job():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.CreateDlpJobRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.create_dlp_job(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.CreateDlpJobRequest, dict]):
                The request object. Request message for
                CreateDlpJobRequest. Used to initiate long running jobs
                such as calculating risk metrics or inspecting Google
                Cloud Storage.
            parent (:class:`str`):
                Required. Parent resource name.

                The format of this value varies depending on whether you
                have `specified a processing
                location <https://cloud.google.com/dlp/docs/specifying-location>`__:

                -  Projects scope, location specified:
                   ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
                -  Projects scope, no location specified (defaults to
                   global): ``projects/``\ PROJECT_ID

                The following example ``parent`` string specifies a
                parent project with the identifier ``example-project``,
                and specifies the ``europe-west3`` location for
                processing data:

                ::

                    parent=projects/example-project/locations/europe-west3

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            inspect_job (:class:`google.cloud.dlp_v2.types.InspectJobConfig`):
                An inspection job scans a storage
                repository for InfoTypes.

                This corresponds to the ``inspect_job`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            risk_job (:class:`google.cloud.dlp_v2.types.RiskAnalysisJobConfig`):
                A risk analysis job calculates
                re-identification risk metrics for a
                BigQuery table.

                This corresponds to the ``risk_job`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.DlpJob:
                Combines all of the information about
                a DLP job.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, inspect_job, risk_job])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = dlp.CreateDlpJobRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if inspect_job is not None:
            request.inspect_job = inspect_job
        if risk_job is not None:
            request.risk_job = risk_job

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.create_dlp_job,
            default_timeout=300.0,
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

    async def list_dlp_jobs(
        self,
        request: Union[dlp.ListDlpJobsRequest, dict] = None,
        *,
        parent: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> pagers.ListDlpJobsAsyncPager:
        r"""Lists DlpJobs that match the specified filter in the
        request. See
        https://cloud.google.com/dlp/docs/inspecting-storage and
        https://cloud.google.com/dlp/docs/compute-risk-analysis
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_list_dlp_jobs():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.ListDlpJobsRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_dlp_jobs(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.ListDlpJobsRequest, dict]):
                The request object. The request message for listing DLP
                jobs.
            parent (:class:`str`):
                Required. Parent resource name.

                The format of this value varies depending on whether you
                have `specified a processing
                location <https://cloud.google.com/dlp/docs/specifying-location>`__:

                -  Projects scope, location specified:
                   ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
                -  Projects scope, no location specified (defaults to
                   global): ``projects/``\ PROJECT_ID

                The following example ``parent`` string specifies a
                parent project with the identifier ``example-project``,
                and specifies the ``europe-west3`` location for
                processing data:

                ::

                    parent=projects/example-project/locations/europe-west3

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.services.dlp_service.pagers.ListDlpJobsAsyncPager:
                The response message for listing DLP
                jobs.
                Iterating over this object will yield
                results and resolve additional pages
                automatically.

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

        request = dlp.ListDlpJobsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.list_dlp_jobs,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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
        response = pagers.ListDlpJobsAsyncPager(
            method=rpc,
            request=request,
            response=response,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def get_dlp_job(
        self,
        request: Union[dlp.GetDlpJobRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.DlpJob:
        r"""Gets the latest state of a long-running DlpJob.
        See https://cloud.google.com/dlp/docs/inspecting-storage
        and
        https://cloud.google.com/dlp/docs/compute-risk-analysis
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_get_dlp_job():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.GetDlpJobRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_dlp_job(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.GetDlpJobRequest, dict]):
                The request object. The request message for
                [DlpJobs.GetDlpJob][].
            name (:class:`str`):
                Required. The name of the DlpJob
                resource.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.DlpJob:
                Combines all of the information about
                a DLP job.

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

        request = dlp.GetDlpJobRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.get_dlp_job,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def delete_dlp_job(
        self,
        request: Union[dlp.DeleteDlpJobRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> None:
        r"""Deletes a long-running DlpJob. This method indicates
        that the client is no longer interested in the DlpJob
        result. The job will be canceled if possible.
        See https://cloud.google.com/dlp/docs/inspecting-storage
        and
        https://cloud.google.com/dlp/docs/compute-risk-analysis
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_delete_dlp_job():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.DeleteDlpJobRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_dlp_job(request=request)

        Args:
            request (Union[google.cloud.dlp_v2.types.DeleteDlpJobRequest, dict]):
                The request object. The request message for deleting a
                DLP job.
            name (:class:`str`):
                Required. The name of the DlpJob
                resource to be deleted.

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

        request = dlp.DeleteDlpJobRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.delete_dlp_job,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def cancel_dlp_job(
        self,
        request: Union[dlp.CancelDlpJobRequest, dict] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> None:
        r"""Starts asynchronous cancellation on a long-running
        DlpJob. The server makes a best effort to cancel the
        DlpJob, but success is not guaranteed.
        See https://cloud.google.com/dlp/docs/inspecting-storage
        and
        https://cloud.google.com/dlp/docs/compute-risk-analysis
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_cancel_dlp_job():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.CancelDlpJobRequest(
                    name="name_value",
                )

                # Make the request
                await client.cancel_dlp_job(request=request)

        Args:
            request (Union[google.cloud.dlp_v2.types.CancelDlpJobRequest, dict]):
                The request object. The request message for canceling a
                DLP job.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        # Create or coerce a protobuf request object.
        request = dlp.CancelDlpJobRequest(request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.cancel_dlp_job,
            default_timeout=300.0,
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

    async def create_stored_info_type(
        self,
        request: Union[dlp.CreateStoredInfoTypeRequest, dict] = None,
        *,
        parent: str = None,
        config: dlp.StoredInfoTypeConfig = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.StoredInfoType:
        r"""Creates a pre-built stored infoType to be used for
        inspection. See
        https://cloud.google.com/dlp/docs/creating-stored-infotypes
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_create_stored_info_type():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.CreateStoredInfoTypeRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.create_stored_info_type(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.CreateStoredInfoTypeRequest, dict]):
                The request object. Request message for
                CreateStoredInfoType.
            parent (:class:`str`):
                Required. Parent resource name.

                The format of this value varies depending on the scope
                of the request (project or organization) and whether you
                have `specified a processing
                location <https://cloud.google.com/dlp/docs/specifying-location>`__:

                -  Projects scope, location specified:
                   ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
                -  Projects scope, no location specified (defaults to
                   global): ``projects/``\ PROJECT_ID
                -  Organizations scope, location specified:
                   ``organizations/``\ ORG_ID\ ``/locations/``\ LOCATION_ID
                -  Organizations scope, no location specified (defaults
                   to global): ``organizations/``\ ORG_ID

                The following example ``parent`` string specifies a
                parent project with the identifier ``example-project``,
                and specifies the ``europe-west3`` location for
                processing data:

                ::

                    parent=projects/example-project/locations/europe-west3

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            config (:class:`google.cloud.dlp_v2.types.StoredInfoTypeConfig`):
                Required. Configuration of the
                storedInfoType to create.

                This corresponds to the ``config`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.StoredInfoType:
                StoredInfoType resource message that
                contains information about the current
                version and any pending updates.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, config])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = dlp.CreateStoredInfoTypeRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if config is not None:
            request.config = config

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.create_stored_info_type,
            default_timeout=300.0,
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

    async def update_stored_info_type(
        self,
        request: Union[dlp.UpdateStoredInfoTypeRequest, dict] = None,
        *,
        name: str = None,
        config: dlp.StoredInfoTypeConfig = None,
        update_mask: field_mask_pb2.FieldMask = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.StoredInfoType:
        r"""Updates the stored infoType by creating a new
        version. The existing version will continue to be used
        until the new version is ready. See
        https://cloud.google.com/dlp/docs/creating-stored-infotypes
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_update_stored_info_type():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.UpdateStoredInfoTypeRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.update_stored_info_type(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.UpdateStoredInfoTypeRequest, dict]):
                The request object. Request message for
                UpdateStoredInfoType.
            name (:class:`str`):
                Required. Resource name of organization and
                storedInfoType to be updated, for example
                ``organizations/433245324/storedInfoTypes/432452342`` or
                projects/project-id/storedInfoTypes/432452342.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            config (:class:`google.cloud.dlp_v2.types.StoredInfoTypeConfig`):
                Updated configuration for the
                storedInfoType. If not provided, a new
                version of the storedInfoType will be
                created with the existing configuration.

                This corresponds to the ``config`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            update_mask (:class:`google.protobuf.field_mask_pb2.FieldMask`):
                Mask to control which fields get
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
            google.cloud.dlp_v2.types.StoredInfoType:
                StoredInfoType resource message that
                contains information about the current
                version and any pending updates.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([name, config, update_mask])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = dlp.UpdateStoredInfoTypeRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name
        if config is not None:
            request.config = config
        if update_mask is not None:
            request.update_mask = update_mask

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.update_stored_info_type,
            default_timeout=300.0,
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

    async def get_stored_info_type(
        self,
        request: Union[dlp.GetStoredInfoTypeRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.StoredInfoType:
        r"""Gets a stored infoType.
        See
        https://cloud.google.com/dlp/docs/creating-stored-infotypes
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_get_stored_info_type():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.GetStoredInfoTypeRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.get_stored_info_type(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.GetStoredInfoTypeRequest, dict]):
                The request object. Request message for
                GetStoredInfoType.
            name (:class:`str`):
                Required. Resource name of the organization and
                storedInfoType to be read, for example
                ``organizations/433245324/storedInfoTypes/432452342`` or
                projects/project-id/storedInfoTypes/432452342.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.StoredInfoType:
                StoredInfoType resource message that
                contains information about the current
                version and any pending updates.

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

        request = dlp.GetStoredInfoTypeRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.get_stored_info_type,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def list_stored_info_types(
        self,
        request: Union[dlp.ListStoredInfoTypesRequest, dict] = None,
        *,
        parent: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> pagers.ListStoredInfoTypesAsyncPager:
        r"""Lists stored infoTypes.
        See
        https://cloud.google.com/dlp/docs/creating-stored-infotypes
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_list_stored_info_types():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.ListStoredInfoTypesRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_stored_info_types(request=request)

                # Handle the response
                async for response in page_result:
                    print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.ListStoredInfoTypesRequest, dict]):
                The request object. Request message for
                ListStoredInfoTypes.
            parent (:class:`str`):
                Required. Parent resource name.

                The format of this value varies depending on the scope
                of the request (project or organization) and whether you
                have `specified a processing
                location <https://cloud.google.com/dlp/docs/specifying-location>`__:

                -  Projects scope, location specified:
                   ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
                -  Projects scope, no location specified (defaults to
                   global): ``projects/``\ PROJECT_ID

                The following example ``parent`` string specifies a
                parent project with the identifier ``example-project``,
                and specifies the ``europe-west3`` location for
                processing data:

                ::

                    parent=projects/example-project/locations/europe-west3

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.services.dlp_service.pagers.ListStoredInfoTypesAsyncPager:
                Response message for
                ListStoredInfoTypes.
                Iterating over this object will yield
                results and resolve additional pages
                automatically.

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

        request = dlp.ListStoredInfoTypesRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.list_stored_info_types,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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
        response = pagers.ListStoredInfoTypesAsyncPager(
            method=rpc,
            request=request,
            response=response,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def delete_stored_info_type(
        self,
        request: Union[dlp.DeleteStoredInfoTypeRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> None:
        r"""Deletes a stored infoType.
        See
        https://cloud.google.com/dlp/docs/creating-stored-infotypes
        to learn more.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_delete_stored_info_type():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.DeleteStoredInfoTypeRequest(
                    name="name_value",
                )

                # Make the request
                await client.delete_stored_info_type(request=request)

        Args:
            request (Union[google.cloud.dlp_v2.types.DeleteStoredInfoTypeRequest, dict]):
                The request object. Request message for
                DeleteStoredInfoType.
            name (:class:`str`):
                Required. Resource name of the organization and
                storedInfoType to be deleted, for example
                ``organizations/433245324/storedInfoTypes/432452342`` or
                projects/project-id/storedInfoTypes/432452342.

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

        request = dlp.DeleteStoredInfoTypeRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.delete_stored_info_type,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.DeadlineExceeded,
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=300.0,
            ),
            default_timeout=300.0,
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

    async def hybrid_inspect_dlp_job(
        self,
        request: Union[dlp.HybridInspectDlpJobRequest, dict] = None,
        *,
        name: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> dlp.HybridInspectResponse:
        r"""Inspect hybrid content and store findings to a job.
        To review the findings, inspect the job. Inspection will
        occur asynchronously.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_hybrid_inspect_dlp_job():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.HybridInspectDlpJobRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.hybrid_inspect_dlp_job(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.dlp_v2.types.HybridInspectDlpJobRequest, dict]):
                The request object. Request to search for potentially
                sensitive info in a custom location.
            name (:class:`str`):
                Required. Resource name of the job to execute a hybrid
                inspect on, for example
                ``projects/dlp-test-project/dlpJob/53234423``.

                This corresponds to the ``name`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.dlp_v2.types.HybridInspectResponse:
                Quota exceeded errors will be thrown
                once quota has been met.

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

        request = dlp.HybridInspectDlpJobRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if name is not None:
            request.name = name

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.hybrid_inspect_dlp_job,
            default_timeout=300.0,
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

    async def finish_dlp_job(
        self,
        request: Union[dlp.FinishDlpJobRequest, dict] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> None:
        r"""Finish a running hybrid DlpJob. Triggers the
        finalization steps and running of any enabled actions
        that have not yet run.

        .. code-block:: python

            # This snippet has been automatically generated and should be regarded as a
            # code template only.
            # It will require modifications to work:
            # - It may require correct/in-range values for request initialization.
            # - It may require specifying regional endpoints when creating the service
            #   client as shown in:
            #   https://googleapis.dev/python/google-api-core/latest/client_options.html
            from google.cloud import dlp_v2

            async def sample_finish_dlp_job():
                # Create a client
                client = dlp_v2.DlpServiceAsyncClient()

                # Initialize request argument(s)
                request = dlp_v2.FinishDlpJobRequest(
                    name="name_value",
                )

                # Make the request
                await client.finish_dlp_job(request=request)

        Args:
            request (Union[google.cloud.dlp_v2.types.FinishDlpJobRequest, dict]):
                The request object. The request message for finishing a
                DLP hybrid job.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.
        """
        # Create or coerce a protobuf request object.
        request = dlp.FinishDlpJobRequest(request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.finish_dlp_job,
            default_timeout=300.0,
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

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.transport.close()


try:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
        gapic_version=pkg_resources.get_distribution(
            "google-cloud-dlp",
        ).version,
    )
except pkg_resources.DistributionNotFound:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo()


__all__ = ("DlpServiceAsyncClient",)
