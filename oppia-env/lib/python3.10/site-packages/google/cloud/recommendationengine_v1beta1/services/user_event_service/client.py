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
from typing import Dict, Mapping, Optional, Sequence, Tuple, Type, Union
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

from google.api import httpbody_pb2  # type: ignore
from google.api_core import operation  # type: ignore
from google.api_core import operation_async  # type: ignore
from google.cloud.recommendationengine_v1beta1.services.user_event_service import pagers
from google.cloud.recommendationengine_v1beta1.types import import_
from google.cloud.recommendationengine_v1beta1.types import user_event
from google.cloud.recommendationengine_v1beta1.types import user_event as gcr_user_event
from google.cloud.recommendationengine_v1beta1.types import user_event_service
from google.protobuf import any_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
from .transports.base import UserEventServiceTransport, DEFAULT_CLIENT_INFO
from .transports.grpc import UserEventServiceGrpcTransport
from .transports.grpc_asyncio import UserEventServiceGrpcAsyncIOTransport


class UserEventServiceClientMeta(type):
    """Metaclass for the UserEventService client.

    This provides class-level methods for building and retrieving
    support objects (e.g. transport) without polluting the client instance
    objects.
    """

    _transport_registry = (
        OrderedDict()
    )  # type: Dict[str, Type[UserEventServiceTransport]]
    _transport_registry["grpc"] = UserEventServiceGrpcTransport
    _transport_registry["grpc_asyncio"] = UserEventServiceGrpcAsyncIOTransport

    def get_transport_class(
        cls,
        label: str = None,
    ) -> Type[UserEventServiceTransport]:
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


class UserEventServiceClient(metaclass=UserEventServiceClientMeta):
    """Service for ingesting end user actions on the customer
    website.
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

    DEFAULT_ENDPOINT = "recommendationengine.googleapis.com"
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
            UserEventServiceClient: The constructed client.
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
            UserEventServiceClient: The constructed client.
        """
        credentials = service_account.Credentials.from_service_account_file(filename)
        kwargs["credentials"] = credentials
        return cls(*args, **kwargs)

    from_service_account_json = from_service_account_file

    @property
    def transport(self) -> UserEventServiceTransport:
        """Returns the transport used by the client instance.

        Returns:
            UserEventServiceTransport: The transport used by the client
                instance.
        """
        return self._transport

    @staticmethod
    def event_store_path(
        project: str,
        location: str,
        catalog: str,
        event_store: str,
    ) -> str:
        """Returns a fully-qualified event_store string."""
        return "projects/{project}/locations/{location}/catalogs/{catalog}/eventStores/{event_store}".format(
            project=project,
            location=location,
            catalog=catalog,
            event_store=event_store,
        )

    @staticmethod
    def parse_event_store_path(path: str) -> Dict[str, str]:
        """Parses a event_store path into its component segments."""
        m = re.match(
            r"^projects/(?P<project>.+?)/locations/(?P<location>.+?)/catalogs/(?P<catalog>.+?)/eventStores/(?P<event_store>.+?)$",
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
        transport: Union[str, UserEventServiceTransport, None] = None,
        client_options: Optional[client_options_lib.ClientOptions] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
    ) -> None:
        """Instantiates the user event service client.

        Args:
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
            transport (Union[str, UserEventServiceTransport]): The
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
        if isinstance(transport, UserEventServiceTransport):
            # transport is a UserEventServiceTransport instance.
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
                api_audience=client_options.api_audience,
            )

    def write_user_event(
        self,
        request: Union[user_event_service.WriteUserEventRequest, dict] = None,
        *,
        parent: str = None,
        user_event: gcr_user_event.UserEvent = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> gcr_user_event.UserEvent:
        r"""Writes a single user event.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            def sample_write_user_event():
                # Create a client
                client = recommendationengine_v1beta1.UserEventServiceClient()

                # Initialize request argument(s)
                user_event = recommendationengine_v1beta1.UserEvent()
                user_event.event_type = "event_type_value"
                user_event.user_info.visitor_id = "visitor_id_value"

                request = recommendationengine_v1beta1.WriteUserEventRequest(
                    parent="parent_value",
                    user_event=user_event,
                )

                # Make the request
                response = client.write_user_event(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.WriteUserEventRequest, dict]):
                The request object. Request message for WriteUserEvent
                method.
            parent (str):
                Required. The parent eventStore resource name, such as
                ``projects/1234/locations/global/catalogs/default_catalog/eventStores/default_event_store``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            user_event (google.cloud.recommendationengine_v1beta1.types.UserEvent):
                Required. User event to write.
                This corresponds to the ``user_event`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.recommendationengine_v1beta1.types.UserEvent:
                UserEvent captures all metadata
                information recommendation engine needs
                to know about how end users interact
                with customers' website.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, user_event])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # Minor optimization to avoid making a copy if the user passes
        # in a user_event_service.WriteUserEventRequest.
        # There's no risk of modifying the input as we've already verified
        # there are no flattened fields.
        if not isinstance(request, user_event_service.WriteUserEventRequest):
            request = user_event_service.WriteUserEventRequest(request)
            # If we have keyword arguments corresponding to fields on the
            # request, apply these.
            if parent is not None:
                request.parent = parent
            if user_event is not None:
                request.user_event = user_event

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._transport._wrapped_methods[self._transport.write_user_event]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
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

    def collect_user_event(
        self,
        request: Union[user_event_service.CollectUserEventRequest, dict] = None,
        *,
        parent: str = None,
        user_event: str = None,
        uri: str = None,
        ets: int = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> httpbody_pb2.HttpBody:
        r"""Writes a single user event from the browser. This
        uses a GET request to due to browser restriction of
        POST-ing to a 3rd party domain.
        This method is used only by the Recommendations AI
        JavaScript pixel. Users should not call this method
        directly.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            def sample_collect_user_event():
                # Create a client
                client = recommendationengine_v1beta1.UserEventServiceClient()

                # Initialize request argument(s)
                request = recommendationengine_v1beta1.CollectUserEventRequest(
                    parent="parent_value",
                    user_event="user_event_value",
                )

                # Make the request
                response = client.collect_user_event(request=request)

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.CollectUserEventRequest, dict]):
                The request object. Request message for CollectUserEvent
                method.
            parent (str):
                Required. The parent eventStore name, such as
                ``projects/1234/locations/global/catalogs/default_catalog/eventStores/default_event_store``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            user_event (str):
                Required. URL encoded UserEvent
                proto.

                This corresponds to the ``user_event`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            uri (str):
                Optional. The url including
                cgi-parameters but excluding the hash
                fragment. The URL must be truncated to
                1.5K bytes to conservatively be under
                the 2K bytes. This is often more useful
                than the referer url, because many
                browsers only send the domain for 3rd
                party requests.

                This corresponds to the ``uri`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            ets (int):
                Optional. The event timestamp in
                milliseconds. This prevents browser
                caching of otherwise identical get
                requests. The name is abbreviated to
                reduce the payload bytes.

                This corresponds to the ``ets`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.api.httpbody_pb2.HttpBody:
                Message that represents an arbitrary HTTP body. It should only be used for
                   payload formats that can't be represented as JSON,
                   such as raw binary or an HTML page.

                   This message can be used both in streaming and
                   non-streaming API methods in the request as well as
                   the response.

                   It can be used as a top-level request field, which is
                   convenient if one wants to extract parameters from
                   either the URL or HTTP template into the request
                   fields and also want access to the raw HTTP body.

                   Example:

                      message GetResourceRequest {
                         // A unique request id. string request_id = 1;

                         // The raw HTTP body is bound to this field.
                         google.api.HttpBody http_body = 2;

                      }

                      service ResourceService {
                         rpc GetResource(GetResourceRequest)
                            returns (google.api.HttpBody);

                         rpc UpdateResource(google.api.HttpBody)
                            returns (google.protobuf.Empty);

                      }

                   Example with streaming methods:

                      service CaldavService {
                         rpc GetCalendar(stream google.api.HttpBody)
                            returns (stream google.api.HttpBody);

                         rpc UpdateCalendar(stream google.api.HttpBody)
                            returns (stream google.api.HttpBody);

                      }

                   Use of this type only changes how the request and
                   response bodies are handled, all other features will
                   continue to work unchanged.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, user_event, uri, ets])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # Minor optimization to avoid making a copy if the user passes
        # in a user_event_service.CollectUserEventRequest.
        # There's no risk of modifying the input as we've already verified
        # there are no flattened fields.
        if not isinstance(request, user_event_service.CollectUserEventRequest):
            request = user_event_service.CollectUserEventRequest(request)
            # If we have keyword arguments corresponding to fields on the
            # request, apply these.
            if parent is not None:
                request.parent = parent
            if user_event is not None:
                request.user_event = user_event
            if uri is not None:
                request.uri = uri
            if ets is not None:
                request.ets = ets

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._transport._wrapped_methods[self._transport.collect_user_event]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
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

    def list_user_events(
        self,
        request: Union[user_event_service.ListUserEventsRequest, dict] = None,
        *,
        parent: str = None,
        filter: str = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> pagers.ListUserEventsPager:
        r"""Gets a list of user events within a time range, with
        potential filtering.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            def sample_list_user_events():
                # Create a client
                client = recommendationengine_v1beta1.UserEventServiceClient()

                # Initialize request argument(s)
                request = recommendationengine_v1beta1.ListUserEventsRequest(
                    parent="parent_value",
                )

                # Make the request
                page_result = client.list_user_events(request=request)

                # Handle the response
                for response in page_result:
                    print(response)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.ListUserEventsRequest, dict]):
                The request object. Request message for ListUserEvents
                method.
            parent (str):
                Required. The parent eventStore resource name, such as
                ``projects/*/locations/*/catalogs/default_catalog/eventStores/default_event_store``.

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            filter (str):
                Optional. Filtering expression to specify restrictions
                over returned events. This is a sequence of terms, where
                each term applies some kind of a restriction to the
                returned user events. Use this expression to restrict
                results to a specific time range, or filter events by
                eventType. eg: eventTime > "2012-04-23T18:25:43.511Z"
                eventsMissingCatalogItems
                eventTime<"2012-04-23T18:25:43.511Z" eventType=search

                We expect only 3 types of fields:

                ::

                   * eventTime: this can be specified a maximum of 2 times, once with a
                     less than operator and once with a greater than operator. The
                     eventTime restrict should result in one contiguous valid eventTime
                     range.

                   * eventType: only 1 eventType restriction can be specified.

                   * eventsMissingCatalogItems: specififying this will restrict results
                     to events for which catalog items were not found in the catalog. The
                     default behavior is to return only those events for which catalog
                     items were found.

                Some examples of valid filters expressions:

                -  Example 1: eventTime > "2012-04-23T18:25:43.511Z"
                   eventTime < "2012-04-23T18:30:43.511Z"
                -  Example 2: eventTime > "2012-04-23T18:25:43.511Z"
                   eventType = detail-page-view
                -  Example 3: eventsMissingCatalogItems eventType =
                   search eventTime < "2018-04-23T18:30:43.511Z"
                -  Example 4: eventTime > "2012-04-23T18:25:43.511Z"
                -  Example 5: eventType = search
                -  Example 6: eventsMissingCatalogItems

                This corresponds to the ``filter`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.cloud.recommendationengine_v1beta1.services.user_event_service.pagers.ListUserEventsPager:
                Response message for ListUserEvents
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

        # Minor optimization to avoid making a copy if the user passes
        # in a user_event_service.ListUserEventsRequest.
        # There's no risk of modifying the input as we've already verified
        # there are no flattened fields.
        if not isinstance(request, user_event_service.ListUserEventsRequest):
            request = user_event_service.ListUserEventsRequest(request)
            # If we have keyword arguments corresponding to fields on the
            # request, apply these.
            if parent is not None:
                request.parent = parent
            if filter is not None:
                request.filter = filter

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._transport._wrapped_methods[self._transport.list_user_events]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Send the request.
        response = rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # This method is paged; wrap the response in a pager, which provides
        # an `__iter__` convenience method.
        response = pagers.ListUserEventsPager(
            method=rpc,
            request=request,
            response=response,
            metadata=metadata,
        )

        # Done; return the response.
        return response

    def purge_user_events(
        self,
        request: Union[user_event_service.PurgeUserEventsRequest, dict] = None,
        *,
        parent: str = None,
        filter: str = None,
        force: bool = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> operation.Operation:
        r"""Deletes permanently all user events specified by the
        filter provided. Depending on the number of events
        specified by the filter, this operation could take hours
        or days to complete. To test a filter, use the list
        command first.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            def sample_purge_user_events():
                # Create a client
                client = recommendationengine_v1beta1.UserEventServiceClient()

                # Initialize request argument(s)
                request = recommendationengine_v1beta1.PurgeUserEventsRequest(
                    parent="parent_value",
                    filter="filter_value",
                )

                # Make the request
                operation = client.purge_user_events(request=request)

                print("Waiting for operation to complete...")

                response = operation.result()

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.PurgeUserEventsRequest, dict]):
                The request object. Request message for PurgeUserEvents
                method.
            parent (str):
                Required. The resource name of the event_store under
                which the events are created. The format is
                ``projects/${projectId}/locations/global/catalogs/${catalogId}/eventStores/${eventStoreId}``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            filter (str):
                Required. The filter string to specify the events to be
                deleted. Empty string filter is not allowed. This filter
                can also be used with ListUserEvents API to list events
                that will be deleted. The eligible fields for filtering
                are:

                -  eventType - UserEvent.eventType field of type string.
                -  eventTime - in ISO 8601 "zulu" format.
                -  visitorId - field of type string. Specifying this
                   will delete all events associated with a visitor.
                -  userId - field of type string. Specifying this will
                   delete all events associated with a user. Example 1:
                   Deleting all events in a time range.
                   ``eventTime > "2012-04-23T18:25:43.511Z" eventTime < "2012-04-23T18:30:43.511Z"``
                   Example 2: Deleting specific eventType in time range.
                   ``eventTime > "2012-04-23T18:25:43.511Z" eventType = "detail-page-view"``
                   Example 3: Deleting all events for a specific visitor
                   ``visitorId = visitor1024`` The filtering fields are
                   assumed to have an implicit AND.

                This corresponds to the ``filter`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            force (bool):
                Optional. The default value is false.
                Override this flag to true to actually
                perform the purge. If the field is not
                set to true, a sampling of events to be
                deleted will be returned.

                This corresponds to the ``force`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            google.api_core.operation.Operation:
                An object representing a long-running operation.

                The result type for the operation will be :class:`google.cloud.recommendationengine_v1beta1.types.PurgeUserEventsResponse` Response of the PurgeUserEventsRequest. If the long running operation is
                   successfully done, then this message is returned by
                   the google.longrunning.Operations.response field.

        """
        # Create or coerce a protobuf request object.
        # Quick check: If we got a request object, we should *not* have
        # gotten any keyword arguments that map to the request.
        has_flattened_params = any([parent, filter, force])
        if request is not None and has_flattened_params:
            raise ValueError(
                "If the `request` argument is set, then none of "
                "the individual field arguments should be set."
            )

        # Minor optimization to avoid making a copy if the user passes
        # in a user_event_service.PurgeUserEventsRequest.
        # There's no risk of modifying the input as we've already verified
        # there are no flattened fields.
        if not isinstance(request, user_event_service.PurgeUserEventsRequest):
            request = user_event_service.PurgeUserEventsRequest(request)
            # If we have keyword arguments corresponding to fields on the
            # request, apply these.
            if parent is not None:
                request.parent = parent
            if filter is not None:
                request.filter = filter
            if force is not None:
                request.force = force

        # Wrap the RPC method; this adds retry and timeout information,
        # and friendly error handling.
        rpc = self._transport._wrapped_methods[self._transport.purge_user_events]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Send the request.
        response = rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Wrap the response in an operation future.
        response = operation.from_gapic(
            response,
            self._transport.operations_client,
            user_event_service.PurgeUserEventsResponse,
            metadata_type=user_event_service.PurgeUserEventsMetadata,
        )

        # Done; return the response.
        return response

    def import_user_events(
        self,
        request: Union[import_.ImportUserEventsRequest, dict] = None,
        *,
        parent: str = None,
        request_id: str = None,
        input_config: import_.InputConfig = None,
        errors_config: import_.ImportErrorsConfig = None,
        retry: OptionalRetry = gapic_v1.method.DEFAULT,
        timeout: float = None,
        metadata: Sequence[Tuple[str, str]] = (),
    ) -> operation.Operation:
        r"""Bulk import of User events. Request processing might
        be synchronous. Events that already exist are skipped.
        Use this method for backfilling historical user events.
        Operation.response is of type ImportResponse. Note that
        it is possible for a subset of the items to be
        successfully inserted. Operation.metadata is of type
        ImportMetadata.

        .. code-block:: python

            from google.cloud import recommendationengine_v1beta1

            def sample_import_user_events():
                # Create a client
                client = recommendationengine_v1beta1.UserEventServiceClient()

                # Initialize request argument(s)
                request = recommendationengine_v1beta1.ImportUserEventsRequest(
                    parent="parent_value",
                )

                # Make the request
                operation = client.import_user_events(request=request)

                print("Waiting for operation to complete...")

                response = operation.result()

                # Handle the response
                print(response)

        Args:
            request (Union[google.cloud.recommendationengine_v1beta1.types.ImportUserEventsRequest, dict]):
                The request object. Request message for the
                ImportUserEvents request.
            parent (str):
                Required.
                ``projects/1234/locations/global/catalogs/default_catalog/eventStores/default_event_store``

                This corresponds to the ``parent`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            request_id (str):
                Optional. Unique identifier provided by client, within
                the ancestor dataset scope. Ensures idempotency for
                expensive long running operations. Server-generated if
                unspecified. Up to 128 characters long. This is returned
                as google.longrunning.Operation.name in the response.
                Note that this field must not be set if the desired
                input config is catalog_inline_source.

                This corresponds to the ``request_id`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            input_config (google.cloud.recommendationengine_v1beta1.types.InputConfig):
                Required. The desired input location
                of the data.

                This corresponds to the ``input_config`` field
                on the ``request`` instance; if ``request`` is provided, this
                should not be set.
            errors_config (google.cloud.recommendationengine_v1beta1.types.ImportErrorsConfig):
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
            google.api_core.operation.Operation:
                An object representing a long-running operation.

                The result type for the operation will be :class:`google.cloud.recommendationengine_v1beta1.types.ImportUserEventsResponse` Response of the ImportUserEventsRequest. If the long running
                   operation was successful, then this message is
                   returned by the
                   google.longrunning.Operations.response field if the
                   operation was successful.

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

        # Minor optimization to avoid making a copy if the user passes
        # in a import_.ImportUserEventsRequest.
        # There's no risk of modifying the input as we've already verified
        # there are no flattened fields.
        if not isinstance(request, import_.ImportUserEventsRequest):
            request = import_.ImportUserEventsRequest(request)
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
        rpc = self._transport._wrapped_methods[self._transport.import_user_events]

        # Certain fields should be provided within the metadata header;
        # add these here.
        metadata = tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata((("parent", request.parent),)),
        )

        # Send the request.
        response = rpc(
            request,
            retry=retry,
            timeout=timeout,
            metadata=metadata,
        )

        # Wrap the response in an operation future.
        response = operation.from_gapic(
            response,
            self._transport.operations_client,
            import_.ImportUserEventsResponse,
            metadata_type=import_.ImportMetadata,
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
            "google-cloud-recommendations-ai",
        ).version,
    )
except pkg_resources.DistributionNotFound:
    DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo()


__all__ = ("UserEventServiceClient",)
