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
import dataclasses
import json  # type: ignore
import logging
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple, Union
import warnings

from google.api_core import exceptions as core_exceptions
from google.api_core import gapic_v1, rest_helpers, rest_streaming
from google.api_core import retry as retries
from google.auth import credentials as ga_credentials  # type: ignore
from google.auth.transport.requests import AuthorizedSession  # type: ignore
import google.protobuf
from google.protobuf import json_format
from requests import __version__ as requests_version

from google.cloud.dataflow_v1beta3.types import metrics

from .base import DEFAULT_CLIENT_INFO as BASE_DEFAULT_CLIENT_INFO
from .rest_base import _BaseMetricsV1Beta3RestTransport

try:
    OptionalRetry = Union[retries.Retry, gapic_v1.method._MethodDefault, None]
except AttributeError:  # pragma: NO COVER
    OptionalRetry = Union[retries.Retry, object, None]  # type: ignore

try:
    from google.api_core import client_logging  # type: ignore

    CLIENT_LOGGING_SUPPORTED = True  # pragma: NO COVER
except ImportError:  # pragma: NO COVER
    CLIENT_LOGGING_SUPPORTED = False

_LOGGER = logging.getLogger(__name__)

DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
    gapic_version=BASE_DEFAULT_CLIENT_INFO.gapic_version,
    grpc_version=None,
    rest_version=f"requests@{requests_version}",
)

if hasattr(DEFAULT_CLIENT_INFO, "protobuf_runtime_version"):  # pragma: NO COVER
    DEFAULT_CLIENT_INFO.protobuf_runtime_version = google.protobuf.__version__


class MetricsV1Beta3RestInterceptor:
    """Interceptor for MetricsV1Beta3.

    Interceptors are used to manipulate requests, request metadata, and responses
    in arbitrary ways.
    Example use cases include:
    * Logging
    * Verifying requests according to service or custom semantics
    * Stripping extraneous information from responses

    These use cases and more can be enabled by injecting an
    instance of a custom subclass when constructing the MetricsV1Beta3RestTransport.

    .. code-block:: python
        class MyCustomMetricsV1Beta3Interceptor(MetricsV1Beta3RestInterceptor):
            def pre_get_job_execution_details(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_job_execution_details(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_job_metrics(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_job_metrics(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_stage_execution_details(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_stage_execution_details(self, response):
                logging.log(f"Received response: {response}")
                return response

        transport = MetricsV1Beta3RestTransport(interceptor=MyCustomMetricsV1Beta3Interceptor())
        client = MetricsV1Beta3Client(transport=transport)


    """

    def pre_get_job_execution_details(
        self,
        request: metrics.GetJobExecutionDetailsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        metrics.GetJobExecutionDetailsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_job_execution_details

        Override in a subclass to manipulate the request or metadata
        before they are sent to the MetricsV1Beta3 server.
        """
        return request, metadata

    def post_get_job_execution_details(
        self, response: metrics.JobExecutionDetails
    ) -> metrics.JobExecutionDetails:
        """Post-rpc interceptor for get_job_execution_details

        DEPRECATED. Please use the `post_get_job_execution_details_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the MetricsV1Beta3 server but before
        it is returned to user code. This `post_get_job_execution_details` interceptor runs
        before the `post_get_job_execution_details_with_metadata` interceptor.
        """
        return response

    def post_get_job_execution_details_with_metadata(
        self,
        response: metrics.JobExecutionDetails,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[metrics.JobExecutionDetails, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_job_execution_details

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the MetricsV1Beta3 server but before it is returned to user code.

        We recommend only using this `post_get_job_execution_details_with_metadata`
        interceptor in new development instead of the `post_get_job_execution_details` interceptor.
        When both interceptors are used, this `post_get_job_execution_details_with_metadata` interceptor runs after the
        `post_get_job_execution_details` interceptor. The (possibly modified) response returned by
        `post_get_job_execution_details` will be passed to
        `post_get_job_execution_details_with_metadata`.
        """
        return response, metadata

    def pre_get_job_metrics(
        self,
        request: metrics.GetJobMetricsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[metrics.GetJobMetricsRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for get_job_metrics

        Override in a subclass to manipulate the request or metadata
        before they are sent to the MetricsV1Beta3 server.
        """
        return request, metadata

    def post_get_job_metrics(self, response: metrics.JobMetrics) -> metrics.JobMetrics:
        """Post-rpc interceptor for get_job_metrics

        DEPRECATED. Please use the `post_get_job_metrics_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the MetricsV1Beta3 server but before
        it is returned to user code. This `post_get_job_metrics` interceptor runs
        before the `post_get_job_metrics_with_metadata` interceptor.
        """
        return response

    def post_get_job_metrics_with_metadata(
        self,
        response: metrics.JobMetrics,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[metrics.JobMetrics, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_job_metrics

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the MetricsV1Beta3 server but before it is returned to user code.

        We recommend only using this `post_get_job_metrics_with_metadata`
        interceptor in new development instead of the `post_get_job_metrics` interceptor.
        When both interceptors are used, this `post_get_job_metrics_with_metadata` interceptor runs after the
        `post_get_job_metrics` interceptor. The (possibly modified) response returned by
        `post_get_job_metrics` will be passed to
        `post_get_job_metrics_with_metadata`.
        """
        return response, metadata

    def pre_get_stage_execution_details(
        self,
        request: metrics.GetStageExecutionDetailsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        metrics.GetStageExecutionDetailsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_stage_execution_details

        Override in a subclass to manipulate the request or metadata
        before they are sent to the MetricsV1Beta3 server.
        """
        return request, metadata

    def post_get_stage_execution_details(
        self, response: metrics.StageExecutionDetails
    ) -> metrics.StageExecutionDetails:
        """Post-rpc interceptor for get_stage_execution_details

        DEPRECATED. Please use the `post_get_stage_execution_details_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the MetricsV1Beta3 server but before
        it is returned to user code. This `post_get_stage_execution_details` interceptor runs
        before the `post_get_stage_execution_details_with_metadata` interceptor.
        """
        return response

    def post_get_stage_execution_details_with_metadata(
        self,
        response: metrics.StageExecutionDetails,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[metrics.StageExecutionDetails, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_stage_execution_details

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the MetricsV1Beta3 server but before it is returned to user code.

        We recommend only using this `post_get_stage_execution_details_with_metadata`
        interceptor in new development instead of the `post_get_stage_execution_details` interceptor.
        When both interceptors are used, this `post_get_stage_execution_details_with_metadata` interceptor runs after the
        `post_get_stage_execution_details` interceptor. The (possibly modified) response returned by
        `post_get_stage_execution_details` will be passed to
        `post_get_stage_execution_details_with_metadata`.
        """
        return response, metadata


@dataclasses.dataclass
class MetricsV1Beta3RestStub:
    _session: AuthorizedSession
    _host: str
    _interceptor: MetricsV1Beta3RestInterceptor


class MetricsV1Beta3RestTransport(_BaseMetricsV1Beta3RestTransport):
    """REST backend synchronous transport for MetricsV1Beta3.

    The Dataflow Metrics API lets you monitor the progress of
    Dataflow jobs.

    This class defines the same methods as the primary client, so the
    primary client can load the underlying transport implementation
    and call it.

    It sends JSON representations of protocol buffers over HTTP/1.1
    """

    def __init__(
        self,
        *,
        host: str = "dataflow.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        client_cert_source_for_mtls: Optional[Callable[[], Tuple[bytes, bytes]]] = None,
        quota_project_id: Optional[str] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
        always_use_jwt_access: Optional[bool] = False,
        url_scheme: str = "https",
        interceptor: Optional[MetricsV1Beta3RestInterceptor] = None,
        api_audience: Optional[str] = None,
    ) -> None:
        """Instantiate the transport.

        Args:
            host (Optional[str]):
                 The hostname to connect to (default: 'dataflow.googleapis.com').
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.

            credentials_file (Optional[str]): A file with credentials that can
                be loaded with :func:`google.auth.load_credentials_from_file`.
                This argument is ignored if ``channel`` is provided.
            scopes (Optional(Sequence[str])): A list of scopes. This argument is
                ignored if ``channel`` is provided.
            client_cert_source_for_mtls (Callable[[], Tuple[bytes, bytes]]): Client
                certificate to configure mutual TLS HTTP channel. It is ignored
                if ``channel`` is provided.
            quota_project_id (Optional[str]): An optional project to use for billing
                and quota.
            client_info (google.api_core.gapic_v1.client_info.ClientInfo):
                The client info used to send a user-agent string along with
                API requests. If ``None``, then default info will be used.
                Generally, you only need to set this if you are developing
                your own client library.
            always_use_jwt_access (Optional[bool]): Whether self signed JWT should
                be used for service account credentials.
            url_scheme: the protocol scheme for the API endpoint.  Normally
                "https", but for testing or local servers,
                "http" can be specified.
        """
        # Run the base constructor
        # TODO(yon-mg): resolve other ctor params i.e. scopes, quota, etc.
        # TODO: When custom host (api_endpoint) is set, `scopes` must *also* be set on the
        # credentials object
        super().__init__(
            host=host,
            credentials=credentials,
            client_info=client_info,
            always_use_jwt_access=always_use_jwt_access,
            url_scheme=url_scheme,
            api_audience=api_audience,
        )
        self._session = AuthorizedSession(
            self._credentials, default_host=self.DEFAULT_HOST
        )
        if client_cert_source_for_mtls:
            self._session.configure_mtls_channel(client_cert_source_for_mtls)
        self._interceptor = interceptor or MetricsV1Beta3RestInterceptor()
        self._prep_wrapped_messages(client_info)

    class _GetJobExecutionDetails(
        _BaseMetricsV1Beta3RestTransport._BaseGetJobExecutionDetails,
        MetricsV1Beta3RestStub,
    ):
        def __hash__(self):
            return hash("MetricsV1Beta3RestTransport.GetJobExecutionDetails")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: metrics.GetJobExecutionDetailsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> metrics.JobExecutionDetails:
            r"""Call the get job execution details method over HTTP.

            Args:
                request (~.metrics.GetJobExecutionDetailsRequest):
                    The request object. Request to get job execution details.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.metrics.JobExecutionDetails:
                    Information about the execution of a
                job.

            """

            http_options = (
                _BaseMetricsV1Beta3RestTransport._BaseGetJobExecutionDetails._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_job_execution_details(
                request, metadata
            )
            transcoded_request = _BaseMetricsV1Beta3RestTransport._BaseGetJobExecutionDetails._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseMetricsV1Beta3RestTransport._BaseGetJobExecutionDetails._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.dataflow_v1beta3.MetricsV1Beta3Client.GetJobExecutionDetails",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.MetricsV1Beta3",
                        "rpcName": "GetJobExecutionDetails",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                MetricsV1Beta3RestTransport._GetJobExecutionDetails._get_response(
                    self._host,
                    metadata,
                    query_params,
                    self._session,
                    timeout,
                    transcoded_request,
                )
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = metrics.JobExecutionDetails()
            pb_resp = metrics.JobExecutionDetails.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_job_execution_details(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_job_execution_details_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = metrics.JobExecutionDetails.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.dataflow_v1beta3.MetricsV1Beta3Client.get_job_execution_details",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.MetricsV1Beta3",
                        "rpcName": "GetJobExecutionDetails",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetJobMetrics(
        _BaseMetricsV1Beta3RestTransport._BaseGetJobMetrics, MetricsV1Beta3RestStub
    ):
        def __hash__(self):
            return hash("MetricsV1Beta3RestTransport.GetJobMetrics")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: metrics.GetJobMetricsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> metrics.JobMetrics:
            r"""Call the get job metrics method over HTTP.

            Args:
                request (~.metrics.GetJobMetricsRequest):
                    The request object. Request to get job metrics.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.metrics.JobMetrics:
                    JobMetrics contains a collection of metrics describing
                the detailed progress of a Dataflow job. Metrics
                correspond to user-defined and system-defined metrics in
                the job. For more information, see [Dataflow job
                metrics]
                (https://cloud.google.com/dataflow/docs/guides/using-monitoring-intf).

                This resource captures only the most recent values of
                each metric; time-series data can be queried for them
                (under the same metric names) from Cloud Monitoring.

            """

            http_options = (
                _BaseMetricsV1Beta3RestTransport._BaseGetJobMetrics._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_job_metrics(request, metadata)
            transcoded_request = _BaseMetricsV1Beta3RestTransport._BaseGetJobMetrics._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseMetricsV1Beta3RestTransport._BaseGetJobMetrics._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.dataflow_v1beta3.MetricsV1Beta3Client.GetJobMetrics",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.MetricsV1Beta3",
                        "rpcName": "GetJobMetrics",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = MetricsV1Beta3RestTransport._GetJobMetrics._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = metrics.JobMetrics()
            pb_resp = metrics.JobMetrics.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_job_metrics(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_job_metrics_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = metrics.JobMetrics.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.dataflow_v1beta3.MetricsV1Beta3Client.get_job_metrics",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.MetricsV1Beta3",
                        "rpcName": "GetJobMetrics",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetStageExecutionDetails(
        _BaseMetricsV1Beta3RestTransport._BaseGetStageExecutionDetails,
        MetricsV1Beta3RestStub,
    ):
        def __hash__(self):
            return hash("MetricsV1Beta3RestTransport.GetStageExecutionDetails")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: metrics.GetStageExecutionDetailsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> metrics.StageExecutionDetails:
            r"""Call the get stage execution
            details method over HTTP.

                Args:
                    request (~.metrics.GetStageExecutionDetailsRequest):
                        The request object. Request to get information about a
                    particular execution stage of a job.
                    Currently only tracked for Batch jobs.
                    retry (google.api_core.retry.Retry): Designation of what errors, if any,
                        should be retried.
                    timeout (float): The timeout for this request.
                    metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                        sent along with the request as metadata. Normally, each value must be of type `str`,
                        but for metadata keys ending with the suffix `-bin`, the corresponding values must
                        be of type `bytes`.

                Returns:
                    ~.metrics.StageExecutionDetails:
                        Information about the workers and
                    work items within a stage.

            """

            http_options = (
                _BaseMetricsV1Beta3RestTransport._BaseGetStageExecutionDetails._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_stage_execution_details(
                request, metadata
            )
            transcoded_request = _BaseMetricsV1Beta3RestTransport._BaseGetStageExecutionDetails._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseMetricsV1Beta3RestTransport._BaseGetStageExecutionDetails._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.dataflow_v1beta3.MetricsV1Beta3Client.GetStageExecutionDetails",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.MetricsV1Beta3",
                        "rpcName": "GetStageExecutionDetails",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = (
                MetricsV1Beta3RestTransport._GetStageExecutionDetails._get_response(
                    self._host,
                    metadata,
                    query_params,
                    self._session,
                    timeout,
                    transcoded_request,
                )
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = metrics.StageExecutionDetails()
            pb_resp = metrics.StageExecutionDetails.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_stage_execution_details(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_stage_execution_details_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = metrics.StageExecutionDetails.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.dataflow_v1beta3.MetricsV1Beta3Client.get_stage_execution_details",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.MetricsV1Beta3",
                        "rpcName": "GetStageExecutionDetails",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    @property
    def get_job_execution_details(
        self,
    ) -> Callable[[metrics.GetJobExecutionDetailsRequest], metrics.JobExecutionDetails]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetJobExecutionDetails(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_job_metrics(
        self,
    ) -> Callable[[metrics.GetJobMetricsRequest], metrics.JobMetrics]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetJobMetrics(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_stage_execution_details(
        self,
    ) -> Callable[
        [metrics.GetStageExecutionDetailsRequest], metrics.StageExecutionDetails
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetStageExecutionDetails(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def kind(self) -> str:
        return "rest"

    def close(self):
        self._session.close()


__all__ = ("MetricsV1Beta3RestTransport",)
