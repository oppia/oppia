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
import os
import re
from typing import Dict, Mapping, Optional, Iterable, Sequence, Tuple, Type, Union
import pkg_resources

from google.api_core import client_options as client_options_lib
from google.api_core import exceptions as core_exceptions
from google.api_core import gapic_v1
from google.api_core import retry as retries
from google.auth import credentials as ga_credentials  # type: ignore
from google.auth.transport import mtls  # type: ignore
from google.auth.transport.grpc import SslCredentials  # type: ignore
from google.auth.exceptions import MutualTLSChannelError  # type: ignore
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
from .transports.grpc import BigQueryReadGrpcTransport
from .transports.grpc_asyncio import BigQueryReadGrpcAsyncIOTransport


class BigQueryReadClientMeta(type):
    """Metaclass for the BigQueryRead client.

    This provides class-level methods for building and retrieving
    support objects (e.g. transport) without polluting the client instance
    objects.
    """

    _transport_registry = OrderedDict()  # type: Dict[str, Type[BigQueryReadTransport]]
    _transport_registry["grpc"] = BigQueryReadGrpcTransport
    _transport_registry["grpc_asyncio"] = BigQueryReadGrpcAsyncIOTransport

    def get_transport_class(
        cls,
        label: str = None,
    ) -> Type[BigQueryReadTransport]:
        """Returns an appropriate transport class.

        Args:
            label: The name of the desired transport. If none is
                provided, then the first transport in the registry is used.

        Returns:
            The transport class to use.
        """
        # If a specific transport is requested, return that one.
        if label:
            return cls._transport_registry[label]

        # No transport is requested; return the default (that is, the first one
        # in the dictionary).
        return next(iter(cls._transport_registry.values()))


class BigQueryReadClient(metaclass=BigQueryReadClientMeta):
    """BigQuery Read API.
    The Read API can be used to read data from BigQuery.
    New code should use the v1 Read API going forward, if they don't
    use Write API at the same time.
    """

    @staticmethod
    def _get_default_mtls_endpoint(api_endpoint):
        """Converts api endpoint to mTLS endpoint.

        Convert "*.sandbox.googleapis.com" and "*.googleapis.com" to
        "*.mtls.sandbox.googleapis.com" and "*.mtls.googleapis.com" respectively.
        Args:
            api_endpoint (Optional[str]): the api endpoint to convert.
        Returns:
            str: converted mTLS api endpoint.
        """
        if not api_endpoint:
            return api_endpoint

        mtls_endpoint_re = re.compile(
            r"(?P<name>[^.]+)(?P<mtls>\.mtls)?(?P<sandbox>\.sandbox)?(?P<googledomain>\.googleapis\.com)?"
        )

        m = mtls_endpoint_re.match(api_endpoint)
        name, mtls, sandbox, googledomain = m.groups()
        if mtls or not googledomain:
            return api_endpoint

        if sandbox:
            return api_endpoint.replace(
                "sandbox.googleapis.com", "mtls.sandbox.googleapis.com"
            )

        return api_endpoint.replace(".googleapis.com", ".mtls.googleapis.com")

    DEFAULT_ENDPOINT = "bigquerystorage.googleapis.com"
    DEFAULT_MTLS_ENDPOINT = _get_default_mtls_endpoint.__func__(  # type: ignore
        DEFAULT_ENDPOINT
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
            BigQueryReadClient: The constructed client.
        """
        credentials = service_account.Credentials.from_service_account_info(info)
        kwargs["credentials"] = credentials
        return cls(*args, **kwargs)

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
            BigQueryReadClient: The constructed client.
        """
        credentials = service_account.Credentials.from_service_account_file(filename)
        kwargs["credentials"] = credentials
        return cls(*args, **kwargs)

    from_service_account_json = from_service_account_file

    @property
    def transport(self) -> BigQueryReadTransport:
        """Returns the transport used by the client instance.

        Returns:
            BigQueryReadTransport: The transport used by the client
                instance.
        """
        return self._transport

    @staticmethod
    def read_session_path(
        project: str,
        location: str,
        session: str,
    ) -> str:
        """Returns a fully-qualified read_session string."""
        return "projects/{project}/locations/{location}/sessions/{session}".format(
            project=project,
            location=location,
            session=session,
        )

    @staticmethod
    def parse_read_session_path(path: str) -> Dict[str, str]:
        """Parses a read_session path into its component segments."""
        m = re.match(
            r"^projects/(?P<project>.+?)/locations/(?P<location>.+?)/sessions/(?P<session>.+?)$",
            path,
        )
        return m.groupdict() if m else {}

    @staticmethod
    def read_stream_path(
        project: str,
        location: str,
        session: str,
        stream: str,
    ) -> str:
        """Returns a fully-qualified read_stream string."""
        return "projects/{project}/locations/{location}/sessions/{session}/streams/{stream}".format(
            project=project,
            location=location,
            session=session,
            stream=stream,
        )

    @staticmethod
    def parse_read_stream_path(path: str) -> Dict[str, str]:
        """Parses a read_stream path into its component segments."""
        m = re.match(
            r"^projects/(?P<project>.+?)/locations/(?P<location>.+?)/sessions/(?P<session>.+?)/streams/(?P<stream>.+?)$",
            path,
        )
        return m.groupdict() if m else {}

    @staticmethod
    def table_path(
        project: str,
        dataset: str,
        table: str,
    ) -> str:
        """Returns a fully-qualified table string."""
        return "projects/{project}/datasets/{dataset}/tables/{table}".format(
            project=project,
            dataset=dataset,
            table=table,
        )

    @staticmethod
    def parse_table_path(path: str) -> Dict[str, str]:
        """Parses a table path into its component segments."""
        m = re.match(
            r"^projects/(?P<project>.+?)/datasets/(?P<dataset>.+?)/tables/(?P<table>.+?)$",
            path,
        )
        return m.groupdict() if m else {}

    @staticmethod
    def common_billing_account_path(
        billing_account: str,
    ) -> str:
        """Returns a fully-qualified billing_account string."""
        return "billingAccounts/{billing_account}".format(
            billing_account=billing_account,
        )

    @staticmethod
    def parse_common_billing_account_path(path: str) -> Dict[str, str]:
        """Parse a billing_account path into its component segments."""
        m = re.match(r"^billingAccounts/(?P<billing_account>.+?)$", path)
        return m.groupdict() if m else {}

    @staticmethod
    def common_folder_path(
        folder: str,
    ) -> str:
        """Returns a fully-qualified folder string."""
        return "folders/{folder}".format(
            folder=folder,
        )

    @staticmethod
    def parse_common_folder_path(path: str) -> Dict[str, str]:
        """Parse a folder path into its component segments."""
        m = re.match(r"^folders/(?P<folder>.+?)$", path)
        return m.groupdict() if m else {}

    @staticmethod
    def common_organization_path(
        organization: str,
    ) -> str:
        """Returns a fully-qualified organization string."""
        return "organizations/{organization}".format(
            organization=organization,
        )

    @staticmethod
    def parse_common_organization_path(path: str) -> Dict[str, str]:
        """Parse a organization path into its component segments."""
        m = re.match(r"^organizations/(?P<organization>.+?)$", path)
        return m.groupdict() if m else {}

    @staticmethod
    def common_project_path(
        project: str,
    ) -> str:
        """Returns a fully-qualified project string."""
        return "projects/{project}".format(
            project=project,
        )

    @staticmethod
    def parse_common_project_path(path: str) -> Dict[str, str]:
        """Parse a project path into its component segments."""
        m = re.match(r"^projects/(?P<project>.+?)$", path)
        return m.groupdict() if m else {}

    @staticmethod
    def common_location_path(
        project: str,
        location: str,
    ) -> str:
        """Returns a fully-qualified location string."""
        return "projects/{project}/locations/{location}".format(
            project=project,
            location=location,
        )

    @staticmethod
    def parse_common_location_path(path: str) -> Dict[str, str]:
        """Parse a location path into its component segments."""
        m = re.match(r"^projects/(?P<project>.+?)/locations/(?P<location>.+?)$", path)
        return m.groupdict() if m else {}

    @classmethod
    def get_mtls_endpoint_and_cert_source(
        cls, client_options: Optional[client_options_lib.ClientOptions] = None
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
        if client_options is None:
            client_options = client_options_lib.ClientOptions()
        use_client_cert = os.getenv("GOOGLE_API_USE_CLIENT_CERTIFICATE", "false")
        use_mtls_endpoint = os.getenv("GOOGLE_API_USE_MTLS_ENDPOINT", "auto")
        if use_client_cert not in ("true", "false"):
            raise ValueError(
                "Environment variable `GOOGLE_API_USE_CLIENT_CERTIFICATE` must be either `true` or `false`"
            )
        if use_mtls_endpoint not in ("auto", "never", "always"):
            raise MutualTLSChannelError(
                "Environment variable `GOOGLE_API_USE_MTLS_ENDPOINT` must be `never`, `auto` or `always`"
            )

        # Figure out the client cert source to use.
        client_cert_source = None
        if use_client_cert == "true":
            if client_options.client_cert_source:
                client_cert_source = client_options.client_cert_source
            elif mtls.has_default_client_cert_source():
                client_cert_source = mtls.default_client_cert_source()

        # Figure out which api endpoint to use.
        if client_options.api_endpoint is not None:
            api_endpoint = client_options.api_endpoint
        elif use_mtls_endpoint == "always" or (
            use_mtls_endpoint == "auto" and client_cert_source
        ):
            api_endpoint = cls.DEFAULT_MTLS_ENDPOINT
        else:
            api_endpoint = cls.DEFAULT_ENDPOINT

        return api_endpoint, client_cert_source

    def __init__(
        self,
        *,
        credentials: Optional[ga_credentials.Credentials] = None,
        transport: Union[str, BigQueryReadTransport, None] = None,
        client_options: Optional[client_options_lib.ClientOptions] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
    ) -> None:
        """Instantiates the big query read client.

        Args:
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
            transport (Union[str, BigQueryReadTransport]): The
                transport to use. If set to None, a transport is chosen
                automatically.
            client_options (google.api_core.client_options.ClientOptions): Custom options for the
                client. It won't take effect if a ``transport`` instance is provided.
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
            client_info (google.api_core.gapic_v1.client_info.ClientInfo):
                The client info used to send a user-agent string along with
                API requests. If ``None``, then default info will be used.
                Generally, you only need to set this if you're developing
                your own client library.

        Raises:
            google.auth.exceptions.MutualTLSChannelError: If mutual TLS transport
                creation failed for any reason.
        """
        if isinstance(client_options, dict):
            client_options = client_options_lib.from_dict(client_options)
        if client_options is None:
            client_options = client_options_lib.ClientOptions()

        api_endpoint, client_cert_source_func = self.get_mtls_endpoint_and_cert_source(
            client_options
        )

        api_key_value = getattr(client_options, "api_key", None)
        if api_key_value and credentials:
            raise ValueError(
                "client_options.api_key and credentials are mutually exclusive"
            )

        # Save or instantiate the transport.
        # Ordinarily, we provide the transport, but allowing a custom transport
        # instance provides an extensibility point for unusual situations.
        if isinstance(transport, BigQueryReadTransport):
            # transport is a BigQueryReadTransport instance.
            if credentials or client_options.credentials_file or api_key_value:
                raise ValueError(
                    "When providing a transport instance, "
                    "provide its credentials directly."
                )
            if client_options.scopes:
                raise ValueError(
                    "When providing a transport instance, provide its scopes "
                    "directly."
                )
            self._transport = transport
        else:
            import google.auth._default  # type: ignore

            if api_key_value and hasattr(
                google.auth._default, "get_api_key_credentials"
            ):
                credentials = google.auth._default.get_api_key_credentials(
                    api_key_value
                )

            Transport = type(self).get_transport_class(transport)
            self._transport = Transport(
                credentials=credentials,
                credentials_file=client_options.credentials_file,
                host=api_endpoint,
                scopes=client_options.scopes,
                client_cert_source_for_mtls=client_cert_source_func,
                quota_project_id=client_options.quota_project_id,
                client_info=client_info,
                always_use_jwt_access=True,
            )

    def create_read_session(
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

            def sample_create_read_session():
                # Create a client
                client = bigquery_storage_v1beta2.BigQueryReadClient()

                # Initialize request argument(s)
                request = bigquery_storage_v1beta2.CreateReadSessionRequest(
                    parent="parent_value",
                )

                # Make the request
                response = client.create_read_session(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.bigquery_storage_v1beta2.types.CreateReadSessionRequest, dict]):
                The request object. Request message for
                `CreateReadSession`.
            parent (str):
                Required. The request project that owns the session, in
                the form of ``projects/{project_id}``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            read_session (google.cloud.bigquery_storage_v1beta2.types.ReadSession):
                Required. Session to be created.
                This corresponds to the ``read_session`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            max_stream_count (int):
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

        # Minor optimization to avoid making a copy if the user passes
        # in a storage.CreateReadSessionRequest.
        # There's no risk of modifying the input as we've already verified
        # there are no flattened fields.
        if not isinstance(request, storage.CreateReadSessionRequest):
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
        rpc = self._transport._wrapped_methods[self._transport.create_read_session]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata(
                (("read_session.table", request.read_session.table),)
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

    def read_rows(
        self,
        request: Union[storage.ReadRowsRequest, dict] = None,
        *,
        read_stream: str = None,
        offset: int = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> Iterable[storage.ReadRowsResponse]:
        r"""Reads rows from the stream in the format prescribed
        by the ReadSession. Each response contains one or more
        table rows, up to a maximum of 100 MiB per response;
        read requests which attempt to read individual rows
        larger than 100 MiB will fail.

        Each request also returns a set of stream statistics
        reflecting the current state of the stream.

        .. code-block:: python

            from google.cloud import bigquery_storage_v1beta2

            def sample_read_rows():
                # Create a client
                client = bigquery_storage_v1beta2.BigQueryReadClient()

                # Initialize request argument(s)
                request = bigquery_storage_v1beta2.ReadRowsRequest(
                    read_stream="read_stream_value",
                )

                # Make the request
                stream = client.read_rows(request=request)

                # Handle the response
                for response in stream:
                    print(response)

        Args:
            request (Union[google.cloud.bigquery_storage_v1beta2.types.ReadRowsRequest, dict]):
                The request object. Request message for `ReadRows`.
            read_stream (str):
                Required. Stream to read rows from.
                This corresponds to the ``read_stream`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            offset (int):
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
            Iterable[google.cloud.bigquery_storage_v1beta2.types.ReadRowsResponse]:
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

        # Minor optimization to avoid making a copy if the user passes
        # in a storage.ReadRowsRequest.
        # There's no risk of modifying the input as we've already verified
        # there are no flattened fields.
        if not isinstance(request, storage.ReadRowsRequest):
            request = storage.ReadRowsRequest(request)
            # If we have keyword arguments corresponding to fields on the
            # request, apply these.
            if read_stream is not None:
                request.read_stream = read_stream
            if offset is not None:
                request.offset = offset

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._transport._wrapped_methods[self._transport.read_rows]

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

    def split_read_stream(
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

            def sample_split_read_stream():
                # Create a client
                client = bigquery_storage_v1beta2.BigQueryReadClient()

                # Initialize request argument(s)
                request = bigquery_storage_v1beta2.SplitReadStreamRequest(
                    name="name_value",
                )

                # Make the request
                response = client.split_read_stream(request=request)

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
        # Minor optimization to avoid making a copy if the user passes
        # in a storage.SplitReadStreamRequest.
        # There's no risk of modifying the input as we've already verified
        # there are no flattened fields.
        if not isinstance(request, storage.SplitReadStreamRequest):
            request = storage.SplitReadStreamRequest(request)

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._transport._wrapped_methods[self._transport.split_read_stream]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("name", request.name),)),
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

    def __enter__(self):
        return self

    def __exit__(self, type, value, traceback):
        """Releases underlying transport's resources.

        .. warning::
            ONLY use as a context manager if the transport is NOT shared
            with other clients! Exiting the with block will CLOSE the transport
            and may cause errors in other clients!
        """
        self.transport.close()


try:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
        gapic_version=pkg_resources.get_distribution(
            "google-cloud-bigquery-storage",
        ).version,
    )
except pkg_resources.DistributionNotFound:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo()


__all__ = ("BigQueryReadClient",)
