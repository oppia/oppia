#  Licensed to Elasticsearch B.V. under one or more contributor
#  license agreements. See the NOTICE file distributed with
#  this work for additional information regarding copyright
#  ownership. Elasticsearch B.V. licenses this file to you under
#  the Apache License, Version 2.0 (the "License"); you may
#  not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
# 	http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing,
#  software distributed under the License is distributed on an
#  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
#  specific language governing permissions and limitations
#  under the License.

import typing as t

from elastic_transport import ObjectApiResponse

from ._base import NamespacedClient
from .utils import _rewrite_parameters


class LicenseClient(NamespacedClient):

    @_rewrite_parameters()
    def delete(
        self,
        *,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Delete the license. When the license expires, your subscription level reverts
        to Basic. If the operator privileges feature is enabled, only operator users
        can use this API.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/delete-license.html>`_
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_license"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "DELETE",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="license.delete",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def get(
        self,
        *,
        accept_enterprise: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get license information. Get information about your Elastic license including
        its type, its status, when it was issued, and when it expires. NOTE: If the master
        node is generating a new cluster state, the get license API may return a `404
        Not Found` response. If you receive an unexpected 404 response after cluster
        startup, wait a short period and retry the request.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/get-license.html>`_

        :param accept_enterprise: If `true`, this parameter returns enterprise for Enterprise
            license types. If `false`, this parameter returns platinum for both platinum
            and enterprise license types. This behavior is maintained for backwards compatibility.
            This parameter is deprecated and will always be set to true in 8.x.
        :param local: Specifies whether to retrieve local information. The default value
            is `false`, which means the information is retrieved from the master node.
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_license"
        __query: t.Dict[str, t.Any] = {}
        if accept_enterprise is not None:
            __query["accept_enterprise"] = accept_enterprise
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if local is not None:
            __query["local"] = local
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="license.get",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def get_basic_status(
        self,
        *,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get the basic license status.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/get-basic-status.html>`_
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_license/basic_status"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="license.get_basic_status",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def get_trial_status(
        self,
        *,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get the trial status.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/get-trial-status.html>`_
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_license/trial_status"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="license.get_trial_status",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("license", "licenses"),
    )
    def post(
        self,
        *,
        acknowledge: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        license: t.Optional[t.Mapping[str, t.Any]] = None,
        licenses: t.Optional[t.Sequence[t.Mapping[str, t.Any]]] = None,
        pretty: t.Optional[bool] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Update the license. You can update your license at runtime without shutting down
        your nodes. License updates take effect immediately. If the license you are installing
        does not support all of the features that were available with your previous license,
        however, you are notified in the response. You must then re-submit the API request
        with the acknowledge parameter set to true. NOTE: If Elasticsearch security features
        are enabled and you are installing a gold or higher license, you must enable
        TLS on the transport networking layer before you install the license. If the
        operator privileges feature is enabled, only operator users can use this API.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/update-license.html>`_

        :param acknowledge: Specifies whether you acknowledge the license changes.
        :param license:
        :param licenses: A sequence of one or more JSON documents containing the license
            information.
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_license"
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if acknowledge is not None:
            __query["acknowledge"] = acknowledge
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        if not __body:
            if license is not None:
                __body["license"] = license
            if licenses is not None:
                __body["licenses"] = licenses
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="license.post",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def post_start_basic(
        self,
        *,
        acknowledge: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Start a basic license. Start an indefinite basic license, which gives access
        to all the basic features. NOTE: In order to start a basic license, you must
        not currently have a basic license. If the basic license does not support all
        of the features that are available with your current license, however, you are
        notified in the response. You must then re-submit the API request with the `acknowledge`
        parameter set to `true`. To check the status of your basic license, use the get
        basic license API.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/start-basic.html>`_

        :param acknowledge: whether the user has acknowledged acknowledge messages (default:
            false)
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_license/start_basic"
        __query: t.Dict[str, t.Any] = {}
        if acknowledge is not None:
            __query["acknowledge"] = acknowledge
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="license.post_start_basic",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def post_start_trial(
        self,
        *,
        acknowledge: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        type_query_string: t.Optional[str] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Start a trial. Start a 30-day trial, which gives access to all subscription features.
        NOTE: You are allowed to start a trial only if your cluster has not already activated
        a trial for the current major product version. For example, if you have already
        activated a trial for v8.0, you cannot start a new trial until v9.0. You can,
        however, request an extended trial at https://www.elastic.co/trialextension.
        To check the status of your trial, use the get trial status API.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/start-trial.html>`_

        :param acknowledge: whether the user has acknowledged acknowledge messages (default:
            false)
        :param type_query_string:
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_license/start_trial"
        __query: t.Dict[str, t.Any] = {}
        if acknowledge is not None:
            __query["acknowledge"] = acknowledge
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        if type_query_string is not None:
            __query["type_query_string"] = type_query_string
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="license.post_start_trial",
            path_parts=__path_parts,
        )
