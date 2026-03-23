# Copyright 2014 Google LLC
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

"""Connections to Google Cloud Datastore API servers."""

from google.rpc import status_pb2  # type: ignore

from google.cloud import _http as connection_module
from google.cloud import exceptions
from google.cloud.datastore_v1.types import datastore as _datastore_pb2


DATASTORE_API_HOST = "datastore.googleapis.com"
"""Datastore API request host."""
API_BASE_URL = "https://" + DATASTORE_API_HOST
"""The base of the API call URL."""
API_VERSION = "v1"
"""The version of the API, used in building the API call's URL."""
API_URL_TEMPLATE = "{api_base}/{api_version}/projects" "/{project}:{method}"
"""A template for the URL of a particular API call."""


def _make_retry_timeout_kwargs(retry, timeout):
    """Helper for methods taking optional retry / timeout args."""
    kwargs = {}

    if retry is not None:
        kwargs["retry"] = retry

    if timeout is not None:
        kwargs["timeout"] = timeout

    return kwargs


def _make_request_pb(request, request_pb_type):
    """Helper for converting dicts to request messages."""
    if not isinstance(request, request_pb_type):
        request = request_pb_type(**request)

    return request


def _request(
    http,
    project,
    method,
    data,
    base_url,
    client_info,
    database,
    retry=None,
    timeout=None,
):
    """Make a request over the Http transport to the Cloud Datastore API.

    :type http: :class:`requests.Session`
    :param http: HTTP object to make requests.

    :type project: str
    :param project: The project to make the request for.

    :type method: str
    :param method: The API call method name (ie, ``runQuery``,
                   ``lookup``, etc)

    :type data: str
    :param data: The data to send with the API call.
                 Typically this is a serialized Protobuf string.

    :type base_url: str
    :param base_url: The base URL where the API lives.

    :type client_info: :class:`google.api_core.client_info.ClientInfo`
    :param client_info: used to generate user agent.

    :type database: str
    :param database: The database to make the request for.

    :type retry: :class:`google.api_core.retry.Retry`
    :param retry: (Optional) retry policy for the request

    :type timeout: float or tuple(float, float)
    :param timeout: (Optional) timeout for the request

    :rtype: str
    :returns: The string response content from the API call.
    :raises: :class:`google.cloud.exceptions.GoogleCloudError` if the
             response code is not 200 OK.
    """
    user_agent = client_info.to_user_agent()
    headers = {
        "Content-Type": "application/x-protobuf",
        "User-Agent": user_agent,
        connection_module.CLIENT_INFO_HEADER: user_agent,
    }
    _update_headers(headers, project, database)
    api_url = build_api_url(project, method, base_url)

    requester = http.request

    if retry is not None:
        requester = retry(requester)

    if timeout is not None:
        response = requester(
            url=api_url,
            method="POST",
            headers=headers,
            data=data,
            timeout=timeout,
        )
    else:
        response = requester(url=api_url, method="POST", headers=headers, data=data)

    if response.status_code != 200:
        error_status = status_pb2.Status.FromString(response.content)
        raise exceptions.from_http_status(
            response.status_code, error_status.message, errors=[error_status]
        )

    return response.content


def _rpc(
    http,
    project,
    method,
    base_url,
    client_info,
    request_pb,
    response_pb_cls,
    database,
    retry=None,
    timeout=None,
):
    """Make a protobuf RPC request.

    :type http: :class:`requests.Session`
    :param http: HTTP object to make requests.

    :type project: str
    :param project: The project to connect to. This is
                    usually your project name in the cloud console.

    :type method: str
    :param method: The name of the method to invoke.

    :type base_url: str
    :param base_url: The base URL where the API lives.

    :type client_info: :class:`google.api_core.client_info.ClientInfo`
    :param client_info: used to generate user agent.

    :type request_pb: :class:`google.protobuf.message.Message` instance
    :param request_pb: the protobuf instance representing the request.

    :type response_pb_cls: A :class:`google.protobuf.message.Message`
                           subclass.
    :param response_pb_cls: The class used to unmarshall the response
                            protobuf.

    :type database: str
    :param database: The database to make the request for.

    :type retry: :class:`google.api_core.retry.Retry`
    :param retry: (Optional) retry policy for the request

    :type timeout: float or tuple(float, float)
    :param timeout: (Optional) timeout for the request

    :rtype: :class:`google.protobuf.message.Message`
    :returns: The RPC message parsed from the response.
    """
    req_data = request_pb._pb.SerializeToString()
    kwargs = _make_retry_timeout_kwargs(retry, timeout)
    response = _request(
        http, project, method, req_data, base_url, client_info, database, **kwargs
    )
    return response_pb_cls.deserialize(response)


def build_api_url(project, method, base_url):
    """Construct the URL for a particular API call.

    This method is used internally to come up with the URL to use when
    making RPCs to the Cloud Datastore API.

    :type project: str
    :param project: The project to connect to. This is
                    usually your project name in the cloud console.

    :type method: str
    :param method: The API method to call (e.g. 'runQuery', 'lookup').

    :type base_url: str
    :param base_url: The base URL where the API lives.

    :rtype: str
    :returns: The API URL created.
    """
    return API_URL_TEMPLATE.format(
        api_base=base_url, api_version=API_VERSION, project=project, method=method
    )


class HTTPDatastoreAPI(object):
    """An API object that sends proto-over-HTTP requests.

    Intended to provide the same methods as the GAPIC ``DatastoreClient``.

    :type client: :class:`~google.cloud.datastore.client.Client`
    :param client: The client that provides configuration.
    """

    def __init__(self, client):
        self.client = client

    def lookup(self, request, retry=None, timeout=None):
        """Perform a ``lookup`` request.

        :type request: :class:`_datastore_pb2.LookupRequest` or dict
        :param request:
            Parameter bundle for API request.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry: (Optional) retry policy for the request

        :type timeout: float or tuple(float, float)
        :param timeout: (Optional) timeout for the request

        :rtype: :class:`.datastore_pb2.LookupResponse`
        :returns: The returned protobuf response object.
        """
        request_pb = _make_request_pb(request, _datastore_pb2.LookupRequest)
        project_id = request_pb.project_id
        database_id = request_pb.database_id

        return _rpc(
            self.client._http,
            project_id,
            "lookup",
            self.client._base_url,
            self.client._client_info,
            request_pb,
            _datastore_pb2.LookupResponse,
            database_id,
            retry=retry,
            timeout=timeout,
        )

    def run_query(self, request, retry=None, timeout=None):
        """Perform a ``runQuery`` request.

        :type request: :class:`_datastore_pb2.BeginTransactionRequest` or dict
        :param request:
            Parameter bundle for API request.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry: (Optional) retry policy for the request

        :type timeout: float or tuple(float, float)
        :param timeout: (Optional) timeout for the request

        :rtype: :class:`.datastore_pb2.RunQueryResponse`
        :returns: The returned protobuf response object.
        """
        request_pb = _make_request_pb(request, _datastore_pb2.RunQueryRequest)
        project_id = request_pb.project_id
        database_id = request_pb.database_id

        return _rpc(
            self.client._http,
            project_id,
            "runQuery",
            self.client._base_url,
            self.client._client_info,
            request_pb,
            _datastore_pb2.RunQueryResponse,
            database_id,
            retry=retry,
            timeout=timeout,
        )

    def run_aggregation_query(self, request, retry=None, timeout=None):
        """Perform a ``runAggregationQuery`` request.

        :type request: :class:`_datastore_pb2.BeginTransactionRequest` or dict
        :param request:
            Parameter bundle for API request.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry: (Optional) retry policy for the request

        :type timeout: float or tuple(float, float)
        :param timeout: (Optional) timeout for the request

        :rtype: :class:`.datastore_pb2.RunAggregationQueryResponse`
        :returns: The returned protobuf response object.
        """
        request_pb = _make_request_pb(
            request, _datastore_pb2.RunAggregationQueryRequest
        )
        project_id = request_pb.project_id
        database_id = request_pb.database_id

        return _rpc(
            self.client._http,
            project_id,
            "runAggregationQuery",
            self.client._base_url,
            self.client._client_info,
            request_pb,
            _datastore_pb2.RunAggregationQueryResponse,
            database_id,
            retry=retry,
            timeout=timeout,
        )

    def begin_transaction(self, request, retry=None, timeout=None):
        """Perform a ``beginTransaction`` request.

        :type request: :class:`_datastore_pb2.BeginTransactionRequest` or dict
        :param request:
            Parameter bundle for API request.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry: (Optional) retry policy for the request

        :type timeout: float or tuple(float, float)
        :param timeout: (Optional) timeout for the request

        :rtype: :class:`.datastore_pb2.BeginTransactionResponse`
        :returns: The returned protobuf response object.
        """
        request_pb = _make_request_pb(request, _datastore_pb2.BeginTransactionRequest)
        project_id = request_pb.project_id
        database_id = request_pb.database_id

        return _rpc(
            self.client._http,
            project_id,
            "beginTransaction",
            self.client._base_url,
            self.client._client_info,
            request_pb,
            _datastore_pb2.BeginTransactionResponse,
            database_id,
            retry=retry,
            timeout=timeout,
        )

    def commit(self, request, retry=None, timeout=None):
        """Perform a ``commit`` request.

        :type request: :class:`_datastore_pb2.CommitRequest` or dict
        :param request:
            Parameter bundle for API request.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry: (Optional) retry policy for the request

        :type timeout: float or tuple(float, float)
        :param timeout: (Optional) timeout for the request

        :rtype: :class:`.datastore_pb2.CommitResponse`
        :returns: The returned protobuf response object.
        """
        request_pb = _make_request_pb(request, _datastore_pb2.CommitRequest)
        project_id = request_pb.project_id
        database_id = request_pb.database_id

        return _rpc(
            self.client._http,
            project_id,
            "commit",
            self.client._base_url,
            self.client._client_info,
            request_pb,
            _datastore_pb2.CommitResponse,
            database_id,
            retry=retry,
            timeout=timeout,
        )

    def rollback(self, request, retry=None, timeout=None):
        """Perform a ``rollback`` request.

        :type request: :class:`_datastore_pb2.RollbackRequest` or dict
        :param request:
            Parameter bundle for API request.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry: (Optional) retry policy for the request

        :type timeout: float or tuple(float, float)
        :param timeout: (Optional) timeout for the request

        :rtype: :class:`.datastore_pb2.RollbackResponse`
        :returns: The returned protobuf response object.
        """
        request_pb = _make_request_pb(request, _datastore_pb2.RollbackRequest)
        project_id = request_pb.project_id
        database_id = request_pb.database_id

        return _rpc(
            self.client._http,
            project_id,
            "rollback",
            self.client._base_url,
            self.client._client_info,
            request_pb,
            _datastore_pb2.RollbackResponse,
            database_id,
            retry=retry,
            timeout=timeout,
        )

    def allocate_ids(self, request, retry=None, timeout=None):
        """Perform an ``allocateIds`` request.

        :type request: :class:`_datastore_pb2.AllocateIdsRequest` or dict
        :param request:
            Parameter bundle for API request.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry: (Optional) retry policy for the request

        :type timeout: float or tuple(float, float)
        :param timeout: (Optional) timeout for the request

        :rtype: :class:`.datastore_pb2.AllocateIdsResponse`
        :returns: The returned protobuf response object.
        """
        request_pb = _make_request_pb(request, _datastore_pb2.AllocateIdsRequest)
        project_id = request_pb.project_id
        database_id = request_pb.database_id

        return _rpc(
            self.client._http,
            project_id,
            "allocateIds",
            self.client._base_url,
            self.client._client_info,
            request_pb,
            _datastore_pb2.AllocateIdsResponse,
            database_id,
            retry=retry,
            timeout=timeout,
        )

    def reserve_ids(self, request, retry=None, timeout=None):
        """Perform an ``reserveIds`` request.

        :type request: :class:`_datastore_pb2.ReserveIdsRequest` or dict
        :param request:
            Parameter bundle for API request.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry: (Optional) retry policy for the request

        :type timeout: float or tuple(float, float)
        :param timeout: (Optional) timeout for the request

        :rtype: :class:`.datastore_pb2.ReserveIdsResponse`
        :returns: The returned protobuf response object.
        """
        request_pb = _make_request_pb(request, _datastore_pb2.ReserveIdsRequest)
        project_id = request_pb.project_id
        database_id = request_pb.database_id

        return _rpc(
            self.client._http,
            project_id,
            "reserveIds",
            self.client._base_url,
            self.client._client_info,
            request_pb,
            _datastore_pb2.ReserveIdsResponse,
            database_id,
            retry=retry,
            timeout=timeout,
        )


def _update_headers(headers, project_id, database_id=None):
    """Update the request headers.
    Pass the project id, or optionally the database_id if provided.
    """
    headers["x-goog-request-params"] = f"project_id={project_id}"
    if database_id:
        headers[
            "x-goog-request-params"
        ] = f"project_id={project_id}&database_id={database_id}"
