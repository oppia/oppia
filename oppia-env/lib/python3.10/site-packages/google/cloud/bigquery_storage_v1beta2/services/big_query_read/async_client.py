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
from typing import (
    Dict,
    Mapping,
    Optional,
    AsyncIterable,
    Awaitable,
    Sequence,
    Tuple,
    Type,
    Union,
)
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

from google.cloud.bigquery_storage_v1beta2.types import arrow
from google.cloud.bigquery_storage_v1beta2.types import avro
from google.cloud.bigquery_storage_v1beta2.types import storage
from google.cloud.bigquery_storage_v1beta2.types import stream
from google.protobuf import timestamp_pb2  # type: ignore
from .transports.base import BigQueryReadTransport, DEFAULT_CLIENT_INFO
from .transports.grpc_asyncio import BigQueryReadGrpcAsyncIOTransport
from .client import BigQueryReadClient


class BigQueryReadAsyncClient:
    """BigQuery Read API.
    The Read API can be used to read data from BigQuery.
    New code should use the v1 Read API going forward, if they don't
    use Write API at the same time.
    """

    _client: BigQueryReadClient

    DEFAULT_ENDPOINT = BigQueryReadClient.DEFAULT_ENDPOINT
    DEFAULT_MTLS_ENDPOINT = BigQueryReadClient.DEFAULT_MTLS_ENDPOINT

    read_session_path = staticmethod(BigQueryReadClient.read_session_path)
    parse_read_session_path = staticmethod(BigQueryReadClient.parse_read_session_path)
    read_stream_path = staticmethod(BigQueryReadClient.read_stream_path)
    parse_read_stream_path = staticmethod(BigQueryReadClient.parse_read_stream_path)
    table_path = staticmethod(BigQueryReadClient.table_path)
    parse_table_path = staticmethod(BigQueryReadClient.parse_table_path)
    common_billing_account_path = staticmethod(
        BigQueryReadClient.common_billing_account_path
    )
    parse_common_billing_account_path = staticmethod(
        BigQueryReadClient.parse_common_billing_account_path
    )
    common_folder_path = staticmethod(BigQueryReadClient.common_folder_path)
    parse_common_folder_path = staticmethod(BigQueryReadClient.parse_common_folder_path)
    common_organization_path = staticmethod(BigQueryReadClient.common_organization_path)
    parse_common_organization_path = staticmethod(
        BigQueryReadClient.parse_common_organization_path
    )
    common_project_path = staticmethod(BigQueryReadClient.common_project_path)
    parse_common_project_path = staticmethod(
        BigQueryReadClient.parse_common_project_path
    )
    common_location_path = staticmethod(BigQueryReadClient.common_location_path)
    parse_common_location_path = staticmethod(
        BigQueryReadClient.parse_common_location_path
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
            BigQueryReadAsyncClient: The constructed client.
        """
        return BigQueryReadClient.from_service_account_info.__func__(BigQueryReadAsyncClient, info, *args, **kwargs)  # type: ignore

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
            BigQueryReadAsyncClient: The constructed client.
        """
        return BigQueryReadClient.from_service_account_file.__func__(BigQueryReadAsyncClient, filename, *args, **kwargs)  # type: ignore

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
        return BigQueryReadClient.get_mtls_endpoint_and_cert_source(client_options)  # type: ignore

    @property
    def transport(self) -> BigQueryReadTransport:
        """Returns the transport used by the client instance.

        Returns:
            BigQueryReadTransport: The transport used by the client instance.
        """
        return self._client.transport

    get_transport_class = functools.partial(
        type(BigQueryReadClient).get_transport_class, type(BigQueryReadClient)
    )

    def __init__(
        self,
        *,
        credentials: ga_credentials.Credentials = None,
        transport: Union[str, BigQueryReadTransport] = "grpc_asyncio",
        client_options: ClientOptions = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
    ) -> None:
        """Instantiates the big query read client.

        Args:
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
            transport (Union[str, ~.BigQueryReadTransport]): The
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
        self._client = BigQueryReadClient(
            credentials=credentials,
            transport=transport,
            client_options=client_options,
            client_info=client_info,
        )

    async def create_read_session(
        self,
        request: Union[storage.CreateReadSessionRequest, dict] = None,
        *,
        parent: str = None,
        read_session: stream.ReadSession = None,
        max_stream_count: int = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> stream.ReadSession:
        r"""Creates a new read session. A read session divides
        the contents of a BigQuery table into one or more
        streams, which can then be used to read data from the
        table. The read session also specifies properties of the
        data to be read, such as a list of columns or a
        push-down filter describing the rows to be returned.

        A particular row can be read by at most one stream. When
        the caller has reached the end of each stream in the
        session, then all the data in the table has been read.

        Data is assigned to each stream such that roughly the
        same number of rows can be read from each stream.
        Because the server-side unit for assigning data is
        collections of rows, the API does not guarantee that
        each stream will return the same number or rows.
        Additionally, the limits are enforced based on the
        number of pre-filtered rows, so some filters can lead to
        lopsided assignments.

        Read sessions automatically expire 6 hours after they
        are created and do not require manual clean-up by the
        caller.

        .. code-block:: python

            from google.cloud import bigquery_storage_v1beta2

            async def sample_create_read_session():
                # Create a client
                client = bigquery_storage_v1beta2.BigQueryReadAsyncClient()

                # Initialize request argument(s)
                request = bigquery_storage_v1beta2.CreateReadSessionRequest(
                    parent="parent_value",
                )

                # Make the request
                response = await client.create_read_session(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.bigquery_storage_v1beta2.types.CreateReadSessionRequest, dict]):
                The request object. Request message for
                `CreateReadSession`.
            parent (:class:`str`):
                Required. The request project that owns the session, in
                the form of ``projects/{project_id}``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            read_session (:class:`google.cloud.bigquery_storage_v1beta2.types.ReadSession`):
                Required. Session to be created.
                This corresponds to the ``read_session`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            max_stream_count (:class:`int`):
                Max initial number of streams. If
                unset or zero, the server will provide a
                value of streams so as to produce
                reasonable throughput. Must be
                non-negative. The number of streams may
                be lower than the requested number,
                depending on the amount parallelism that
                is reasonable for the table. Error will
                be returned if the max count is greater
                than the current system max limit of
                1,000.

                Streams must be read starting from
                offset 0.

                This corresponds to the ``max_stream_count`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.bigquery_storage_v1beta2.types.ReadSession:
                Information about the ReadSession.
        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, read_session, max_stream_count])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = storage.CreateReadSessionRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if parent is not None:
            request.parent = parent
        if read_session is not None:
            request.read_session = read_session
        if max_stream_count is not None:
            request.max_stream_count = max_stream_count

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.create_read_session,
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
            gapic_v1.routing_header.to_grpc_metadata(
                (("read_session.table", request.read_session.table),)
            ),
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

    def read_rows(
        self,
        request: Union[storage.ReadRowsRequest, dict] = None,
        *,
        read_stream: str = None,
        offset: int = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> Awaitable[AsyncIterable[storage.ReadRowsResponse]]:
        r"""Reads rows from the stream in the format prescribed
        by the ReadSession. Each response contains one or more
        table rows, up to a maximum of 100 MiB per response;
        read requests which attempt to read individual rows
        larger than 100 MiB will fail.

        Each request also returns a set of stream statistics
        reflecting the current state of the stream.

        .. code-block:: python

            from google.cloud import bigquery_storage_v1beta2

            async def sample_read_rows():
                # Create a client
                client = bigquery_storage_v1beta2.BigQueryReadAsyncClient()

                # Initialize request argument(s)
                request = bigquery_storage_v1beta2.ReadRowsRequest(
                    read_stream="read_stream_value",
                )

                # Make the request
                stream = await client.read_rows(request=request)

                # Handle the response
                async for response in stream:
                    print(response)

        Args:
            request (Union[google.cloud.bigquery_storage_v1beta2.types.ReadRowsRequest, dict]):
                The request object. Request message for `ReadRows`.
            read_stream (:class:`str`):
                Required. Stream to read rows from.
                This corresponds to the ``read_stream`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            offset (:class:`int`):
                The offset requested must be less
                than the last row read from Read.
                Requesting a larger offset is undefined.
                If not specified, start reading from
                offset zero.

                This corresponds to the ``offset`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            AsyncIterable[google.cloud.bigquery_storage_v1beta2.types.ReadRowsResponse]:
                Response from calling ReadRows may include row data, progress and
                   throttling information.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([read_stream, offset])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        request = storage.ReadRowsRequest(request)

        # If we have keyword arguments corresponding to fields on the
        # request, apply these.
        if read_stream is not None:
            request.read_stream = read_stream
        if offset is not None:
            request.offset = offset

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.read_rows,
            default_retry=retries.Retry(
                initial=0.1,
                maximum=60.0,
                multiplier=1.3,
                predicate=retries.if_exception_type(
                    core_exceptions.ServiceUnavailable,
                ),
                deadline=86400.0,
            ),
            default_timeout=86400.0,
            client_info=DEFAULT_CLIENT_INFO,
        )

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata(
                (("read_stream", request.read_stream),)
            ),
        )

        # Send the request.
        response = rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    async def split_read_stream(
        self,
        request: Union[storage.SplitReadStreamRequest, dict] = None,
        *,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> storage.SplitReadStreamResponse:
        r"""Splits a given ``ReadStream`` into two ``ReadStream`` objects.
        These ``ReadStream`` objects are referred to as the primary and
        the residual streams of the split. The original ``ReadStream``
        can still be read from in the same manner as before. Both of the
        returned ``ReadStream`` objects can also be read from, and the
        rows returned by both child streams will be the same as the rows
        read from the original stream.

        Moreover, the two child streams will be allocated back-to-back
        in the original ``ReadStream``. Concretely, it is guaranteed
        that for streams original, primary, and residual, that
        original[0-j] = primary[0-j] and original[j-n] = residual[0-m]
        once the streams have been read to completion.

        .. code-block:: python

            from google.cloud import bigquery_storage_v1beta2

            async def sample_split_read_stream():
                # Create a client
                client = bigquery_storage_v1beta2.BigQueryReadAsyncClient()

                # Initialize request argument(s)
                request = bigquery_storage_v1beta2.SplitReadStreamRequest(
                    name="name_value",
                )

                # Make the request
                response = await client.split_read_stream(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.bigquery_storage_v1beta2.types.SplitReadStreamRequest, dict]):
                The request object. Request message for
                `SplitReadStream`.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.bigquery_storage_v1beta2.types.SplitReadStreamResponse:

        """
        # Create or coerce a protobuf request object.
        request = storage.SplitReadStreamRequest(request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = gapic_v1.method_async.wrap_method(
            self._client._transport.split_read_stream,
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

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.transport.close()


try:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
        gapic_version=pkg_resources.get_distribution(
            "google-cloud-bigquery-storage",
        ).version,
    )
except pkg_resources.DistributionNotFound:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo()


__all__ = ("BigQueryReadAsyncClient",)
