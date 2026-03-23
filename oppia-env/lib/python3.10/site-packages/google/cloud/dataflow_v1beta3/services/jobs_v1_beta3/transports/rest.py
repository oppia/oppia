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

from google.cloud.dataflow_v1beta3.types import jobs, snapshots

from .base import DEFAULT_CLIENT_INFO as BASE_DEFAULT_CLIENT_INFO
from .rest_base import _BaseJobsV1Beta3RestTransport

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


class JobsV1Beta3RestInterceptor:
    """Interceptor for JobsV1Beta3.

    Interceptors are used to manipulate requests, request metadata, and responses
    in arbitrary ways.
    Example use cases include:
    * Logging
    * Verifying requests according to service or custom semantics
    * Stripping extraneous information from responses

    These use cases and more can be enabled by injecting an
    instance of a custom subclass when constructing the JobsV1Beta3RestTransport.

    .. code-block:: python
        class MyCustomJobsV1Beta3Interceptor(JobsV1Beta3RestInterceptor):
            def pre_aggregated_list_jobs(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_aggregated_list_jobs(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_check_active_jobs(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_check_active_jobs(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_job(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_job(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_job(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_job(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_jobs(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_jobs(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_snapshot_job(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_snapshot_job(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_update_job(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_update_job(self, response):
                logging.log(f"Received response: {response}")
                return response

        transport = JobsV1Beta3RestTransport(interceptor=MyCustomJobsV1Beta3Interceptor())
        client = JobsV1Beta3Client(transport=transport)


    """

    def pre_aggregated_list_jobs(
        self,
        request: jobs.ListJobsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[jobs.ListJobsRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for aggregated_list_jobs

        Override in a subclass to manipulate the request or metadata
        before they are sent to the JobsV1Beta3 server.
        """
        return request, metadata

    def post_aggregated_list_jobs(
        self, response: jobs.ListJobsResponse
    ) -> jobs.ListJobsResponse:
        """Post-rpc interceptor for aggregated_list_jobs

        DEPRECATED. Please use the `post_aggregated_list_jobs_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the JobsV1Beta3 server but before
        it is returned to user code. This `post_aggregated_list_jobs` interceptor runs
        before the `post_aggregated_list_jobs_with_metadata` interceptor.
        """
        return response

    def post_aggregated_list_jobs_with_metadata(
        self,
        response: jobs.ListJobsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[jobs.ListJobsResponse, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for aggregated_list_jobs

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the JobsV1Beta3 server but before it is returned to user code.

        We recommend only using this `post_aggregated_list_jobs_with_metadata`
        interceptor in new development instead of the `post_aggregated_list_jobs` interceptor.
        When both interceptors are used, this `post_aggregated_list_jobs_with_metadata` interceptor runs after the
        `post_aggregated_list_jobs` interceptor. The (possibly modified) response returned by
        `post_aggregated_list_jobs` will be passed to
        `post_aggregated_list_jobs_with_metadata`.
        """
        return response, metadata

    def pre_create_job(
        self,
        request: jobs.CreateJobRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[jobs.CreateJobRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for create_job

        Override in a subclass to manipulate the request or metadata
        before they are sent to the JobsV1Beta3 server.
        """
        return request, metadata

    def post_create_job(self, response: jobs.Job) -> jobs.Job:
        """Post-rpc interceptor for create_job

        DEPRECATED. Please use the `post_create_job_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the JobsV1Beta3 server but before
        it is returned to user code. This `post_create_job` interceptor runs
        before the `post_create_job_with_metadata` interceptor.
        """
        return response

    def post_create_job_with_metadata(
        self, response: jobs.Job, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[jobs.Job, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_job

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the JobsV1Beta3 server but before it is returned to user code.

        We recommend only using this `post_create_job_with_metadata`
        interceptor in new development instead of the `post_create_job` interceptor.
        When both interceptors are used, this `post_create_job_with_metadata` interceptor runs after the
        `post_create_job` interceptor. The (possibly modified) response returned by
        `post_create_job` will be passed to
        `post_create_job_with_metadata`.
        """
        return response, metadata

    def pre_get_job(
        self,
        request: jobs.GetJobRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[jobs.GetJobRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for get_job

        Override in a subclass to manipulate the request or metadata
        before they are sent to the JobsV1Beta3 server.
        """
        return request, metadata

    def post_get_job(self, response: jobs.Job) -> jobs.Job:
        """Post-rpc interceptor for get_job

        DEPRECATED. Please use the `post_get_job_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the JobsV1Beta3 server but before
        it is returned to user code. This `post_get_job` interceptor runs
        before the `post_get_job_with_metadata` interceptor.
        """
        return response

    def post_get_job_with_metadata(
        self, response: jobs.Job, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[jobs.Job, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_job

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the JobsV1Beta3 server but before it is returned to user code.

        We recommend only using this `post_get_job_with_metadata`
        interceptor in new development instead of the `post_get_job` interceptor.
        When both interceptors are used, this `post_get_job_with_metadata` interceptor runs after the
        `post_get_job` interceptor. The (possibly modified) response returned by
        `post_get_job` will be passed to
        `post_get_job_with_metadata`.
        """
        return response, metadata

    def pre_list_jobs(
        self,
        request: jobs.ListJobsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[jobs.ListJobsRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for list_jobs

        Override in a subclass to manipulate the request or metadata
        before they are sent to the JobsV1Beta3 server.
        """
        return request, metadata

    def post_list_jobs(self, response: jobs.ListJobsResponse) -> jobs.ListJobsResponse:
        """Post-rpc interceptor for list_jobs

        DEPRECATED. Please use the `post_list_jobs_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the JobsV1Beta3 server but before
        it is returned to user code. This `post_list_jobs` interceptor runs
        before the `post_list_jobs_with_metadata` interceptor.
        """
        return response

    def post_list_jobs_with_metadata(
        self,
        response: jobs.ListJobsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[jobs.ListJobsResponse, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for list_jobs

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the JobsV1Beta3 server but before it is returned to user code.

        We recommend only using this `post_list_jobs_with_metadata`
        interceptor in new development instead of the `post_list_jobs` interceptor.
        When both interceptors are used, this `post_list_jobs_with_metadata` interceptor runs after the
        `post_list_jobs` interceptor. The (possibly modified) response returned by
        `post_list_jobs` will be passed to
        `post_list_jobs_with_metadata`.
        """
        return response, metadata

    def pre_snapshot_job(
        self,
        request: jobs.SnapshotJobRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[jobs.SnapshotJobRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for snapshot_job

        Override in a subclass to manipulate the request or metadata
        before they are sent to the JobsV1Beta3 server.
        """
        return request, metadata

    def post_snapshot_job(self, response: snapshots.Snapshot) -> snapshots.Snapshot:
        """Post-rpc interceptor for snapshot_job

        DEPRECATED. Please use the `post_snapshot_job_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the JobsV1Beta3 server but before
        it is returned to user code. This `post_snapshot_job` interceptor runs
        before the `post_snapshot_job_with_metadata` interceptor.
        """
        return response

    def post_snapshot_job_with_metadata(
        self,
        response: snapshots.Snapshot,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[snapshots.Snapshot, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for snapshot_job

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the JobsV1Beta3 server but before it is returned to user code.

        We recommend only using this `post_snapshot_job_with_metadata`
        interceptor in new development instead of the `post_snapshot_job` interceptor.
        When both interceptors are used, this `post_snapshot_job_with_metadata` interceptor runs after the
        `post_snapshot_job` interceptor. The (possibly modified) response returned by
        `post_snapshot_job` will be passed to
        `post_snapshot_job_with_metadata`.
        """
        return response, metadata

    def pre_update_job(
        self,
        request: jobs.UpdateJobRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[jobs.UpdateJobRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for update_job

        Override in a subclass to manipulate the request or metadata
        before they are sent to the JobsV1Beta3 server.
        """
        return request, metadata

    def post_update_job(self, response: jobs.Job) -> jobs.Job:
        """Post-rpc interceptor for update_job

        DEPRECATED. Please use the `post_update_job_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the JobsV1Beta3 server but before
        it is returned to user code. This `post_update_job` interceptor runs
        before the `post_update_job_with_metadata` interceptor.
        """
        return response

    def post_update_job_with_metadata(
        self, response: jobs.Job, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[jobs.Job, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for update_job

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the JobsV1Beta3 server but before it is returned to user code.

        We recommend only using this `post_update_job_with_metadata`
        interceptor in new development instead of the `post_update_job` interceptor.
        When both interceptors are used, this `post_update_job_with_metadata` interceptor runs after the
        `post_update_job` interceptor. The (possibly modified) response returned by
        `post_update_job` will be passed to
        `post_update_job_with_metadata`.
        """
        return response, metadata


@dataclasses.dataclass
class JobsV1Beta3RestStub:
    _session: AuthorizedSession
    _host: str
    _interceptor: JobsV1Beta3RestInterceptor


class JobsV1Beta3RestTransport(_BaseJobsV1Beta3RestTransport):
    """REST backend synchronous transport for JobsV1Beta3.

    Provides a method to create and modify Google Cloud Dataflow
    jobs. A Job is a multi-stage computation graph run by the Cloud
    Dataflow service.

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
        interceptor: Optional[JobsV1Beta3RestInterceptor] = None,
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
        self._interceptor = interceptor or JobsV1Beta3RestInterceptor()
        self._prep_wrapped_messages(client_info)

    class _AggregatedListJobs(
        _BaseJobsV1Beta3RestTransport._BaseAggregatedListJobs, JobsV1Beta3RestStub
    ):
        def __hash__(self):
            return hash("JobsV1Beta3RestTransport.AggregatedListJobs")

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
            request: jobs.ListJobsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> jobs.ListJobsResponse:
            r"""Call the aggregated list jobs method over HTTP.

            Args:
                request (~.jobs.ListJobsRequest):
                    The request object. Request to list Cloud Dataflow jobs.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.jobs.ListJobsResponse:
                    Response to a request to list Cloud
                Dataflow jobs in a project. This might
                be a partial response, depending on the
                page size in the ListJobsRequest.
                However, if the project does not have
                any jobs, an instance of
                ListJobsResponse is not returned and the
                requests's response body is empty {}.

            """

            http_options = (
                _BaseJobsV1Beta3RestTransport._BaseAggregatedListJobs._get_http_options()
            )

            request, metadata = self._interceptor.pre_aggregated_list_jobs(
                request, metadata
            )
            transcoded_request = _BaseJobsV1Beta3RestTransport._BaseAggregatedListJobs._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = _BaseJobsV1Beta3RestTransport._BaseAggregatedListJobs._get_query_params_json(
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
                    f"Sending request for google.dataflow_v1beta3.JobsV1Beta3Client.AggregatedListJobs",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "AggregatedListJobs",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = JobsV1Beta3RestTransport._AggregatedListJobs._get_response(
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
            resp = jobs.ListJobsResponse()
            pb_resp = jobs.ListJobsResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_aggregated_list_jobs(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_aggregated_list_jobs_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = jobs.ListJobsResponse.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.dataflow_v1beta3.JobsV1Beta3Client.aggregated_list_jobs",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "AggregatedListJobs",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CheckActiveJobs(
        _BaseJobsV1Beta3RestTransport._BaseCheckActiveJobs, JobsV1Beta3RestStub
    ):
        def __hash__(self):
            return hash("JobsV1Beta3RestTransport.CheckActiveJobs")

        def __call__(
            self,
            request: jobs.CheckActiveJobsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> jobs.CheckActiveJobsResponse:
            raise NotImplementedError(
                "Method CheckActiveJobs is not available over REST transport"
            )

    class _CreateJob(_BaseJobsV1Beta3RestTransport._BaseCreateJob, JobsV1Beta3RestStub):
        def __hash__(self):
            return hash("JobsV1Beta3RestTransport.CreateJob")

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
                data=body,
            )
            return response

        def __call__(
            self,
            request: jobs.CreateJobRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> jobs.Job:
            r"""Call the create job method over HTTP.

            Args:
                request (~.jobs.CreateJobRequest):
                    The request object. Request to create a Cloud Dataflow
                job.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.jobs.Job:
                    Defines a job to be run by the Cloud
                Dataflow service. Do not enter
                confidential information when you supply
                string values using the API.

            """

            http_options = (
                _BaseJobsV1Beta3RestTransport._BaseCreateJob._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_job(request, metadata)
            transcoded_request = (
                _BaseJobsV1Beta3RestTransport._BaseCreateJob._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseJobsV1Beta3RestTransport._BaseCreateJob._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseJobsV1Beta3RestTransport._BaseCreateJob._get_query_params_json(
                    transcoded_request
                )
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
                    f"Sending request for google.dataflow_v1beta3.JobsV1Beta3Client.CreateJob",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "CreateJob",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = JobsV1Beta3RestTransport._CreateJob._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = jobs.Job()
            pb_resp = jobs.Job.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_create_job(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_job_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = jobs.Job.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.dataflow_v1beta3.JobsV1Beta3Client.create_job",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "CreateJob",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetJob(_BaseJobsV1Beta3RestTransport._BaseGetJob, JobsV1Beta3RestStub):
        def __hash__(self):
            return hash("JobsV1Beta3RestTransport.GetJob")

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
            request: jobs.GetJobRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> jobs.Job:
            r"""Call the get job method over HTTP.

            Args:
                request (~.jobs.GetJobRequest):
                    The request object. Request to get the state of a Cloud
                Dataflow job.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.jobs.Job:
                    Defines a job to be run by the Cloud
                Dataflow service. Do not enter
                confidential information when you supply
                string values using the API.

            """

            http_options = _BaseJobsV1Beta3RestTransport._BaseGetJob._get_http_options()

            request, metadata = self._interceptor.pre_get_job(request, metadata)
            transcoded_request = (
                _BaseJobsV1Beta3RestTransport._BaseGetJob._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseJobsV1Beta3RestTransport._BaseGetJob._get_query_params_json(
                    transcoded_request
                )
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
                    f"Sending request for google.dataflow_v1beta3.JobsV1Beta3Client.GetJob",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "GetJob",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = JobsV1Beta3RestTransport._GetJob._get_response(
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
            resp = jobs.Job()
            pb_resp = jobs.Job.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_job(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_job_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = jobs.Job.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.dataflow_v1beta3.JobsV1Beta3Client.get_job",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "GetJob",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListJobs(_BaseJobsV1Beta3RestTransport._BaseListJobs, JobsV1Beta3RestStub):
        def __hash__(self):
            return hash("JobsV1Beta3RestTransport.ListJobs")

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
            request: jobs.ListJobsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> jobs.ListJobsResponse:
            r"""Call the list jobs method over HTTP.

            Args:
                request (~.jobs.ListJobsRequest):
                    The request object. Request to list Cloud Dataflow jobs.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.jobs.ListJobsResponse:
                    Response to a request to list Cloud
                Dataflow jobs in a project. This might
                be a partial response, depending on the
                page size in the ListJobsRequest.
                However, if the project does not have
                any jobs, an instance of
                ListJobsResponse is not returned and the
                requests's response body is empty {}.

            """

            http_options = (
                _BaseJobsV1Beta3RestTransport._BaseListJobs._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_jobs(request, metadata)
            transcoded_request = (
                _BaseJobsV1Beta3RestTransport._BaseListJobs._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseJobsV1Beta3RestTransport._BaseListJobs._get_query_params_json(
                    transcoded_request
                )
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
                    f"Sending request for google.dataflow_v1beta3.JobsV1Beta3Client.ListJobs",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "ListJobs",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = JobsV1Beta3RestTransport._ListJobs._get_response(
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
            resp = jobs.ListJobsResponse()
            pb_resp = jobs.ListJobsResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_jobs(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_jobs_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = jobs.ListJobsResponse.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.dataflow_v1beta3.JobsV1Beta3Client.list_jobs",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "ListJobs",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _SnapshotJob(
        _BaseJobsV1Beta3RestTransport._BaseSnapshotJob, JobsV1Beta3RestStub
    ):
        def __hash__(self):
            return hash("JobsV1Beta3RestTransport.SnapshotJob")

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
                data=body,
            )
            return response

        def __call__(
            self,
            request: jobs.SnapshotJobRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> snapshots.Snapshot:
            r"""Call the snapshot job method over HTTP.

            Args:
                request (~.jobs.SnapshotJobRequest):
                    The request object. Request to create a snapshot of a
                job.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.snapshots.Snapshot:
                    Represents a snapshot of a job.
            """

            http_options = (
                _BaseJobsV1Beta3RestTransport._BaseSnapshotJob._get_http_options()
            )

            request, metadata = self._interceptor.pre_snapshot_job(request, metadata)
            transcoded_request = (
                _BaseJobsV1Beta3RestTransport._BaseSnapshotJob._get_transcoded_request(
                    http_options, request
                )
            )

            body = (
                _BaseJobsV1Beta3RestTransport._BaseSnapshotJob._get_request_body_json(
                    transcoded_request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseJobsV1Beta3RestTransport._BaseSnapshotJob._get_query_params_json(
                    transcoded_request
                )
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
                    f"Sending request for google.dataflow_v1beta3.JobsV1Beta3Client.SnapshotJob",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "SnapshotJob",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = JobsV1Beta3RestTransport._SnapshotJob._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = snapshots.Snapshot()
            pb_resp = snapshots.Snapshot.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_snapshot_job(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_snapshot_job_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = snapshots.Snapshot.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.dataflow_v1beta3.JobsV1Beta3Client.snapshot_job",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "SnapshotJob",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _UpdateJob(_BaseJobsV1Beta3RestTransport._BaseUpdateJob, JobsV1Beta3RestStub):
        def __hash__(self):
            return hash("JobsV1Beta3RestTransport.UpdateJob")

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
                data=body,
            )
            return response

        def __call__(
            self,
            request: jobs.UpdateJobRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> jobs.Job:
            r"""Call the update job method over HTTP.

            Args:
                request (~.jobs.UpdateJobRequest):
                    The request object. Request to update a Cloud Dataflow
                job.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.jobs.Job:
                    Defines a job to be run by the Cloud
                Dataflow service. Do not enter
                confidential information when you supply
                string values using the API.

            """

            http_options = (
                _BaseJobsV1Beta3RestTransport._BaseUpdateJob._get_http_options()
            )

            request, metadata = self._interceptor.pre_update_job(request, metadata)
            transcoded_request = (
                _BaseJobsV1Beta3RestTransport._BaseUpdateJob._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseJobsV1Beta3RestTransport._BaseUpdateJob._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseJobsV1Beta3RestTransport._BaseUpdateJob._get_query_params_json(
                    transcoded_request
                )
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
                    f"Sending request for google.dataflow_v1beta3.JobsV1Beta3Client.UpdateJob",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "UpdateJob",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = JobsV1Beta3RestTransport._UpdateJob._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = jobs.Job()
            pb_resp = jobs.Job.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_update_job(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_update_job_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = jobs.Job.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.dataflow_v1beta3.JobsV1Beta3Client.update_job",
                    extra={
                        "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                        "rpcName": "UpdateJob",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    @property
    def aggregated_list_jobs(
        self,
    ) -> Callable[[jobs.ListJobsRequest], jobs.ListJobsResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._AggregatedListJobs(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def check_active_jobs(
        self,
    ) -> Callable[[jobs.CheckActiveJobsRequest], jobs.CheckActiveJobsResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CheckActiveJobs(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_job(self) -> Callable[[jobs.CreateJobRequest], jobs.Job]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateJob(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_job(self) -> Callable[[jobs.GetJobRequest], jobs.Job]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetJob(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_jobs(self) -> Callable[[jobs.ListJobsRequest], jobs.ListJobsResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListJobs(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def snapshot_job(self) -> Callable[[jobs.SnapshotJobRequest], snapshots.Snapshot]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._SnapshotJob(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def update_job(self) -> Callable[[jobs.UpdateJobRequest], jobs.Job]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._UpdateJob(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def kind(self) -> str:
        return "rest"

    def close(self):
        self._session.close()


__all__ = ("JobsV1Beta3RestTransport",)
