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
from .utils import SKIP_IN_PATH, _quote, _rewrite_parameters


class IlmClient(NamespacedClient):

    @_rewrite_parameters()
    def delete_lifecycle(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Delete a lifecycle policy. You cannot delete policies that are currently in use.
        If the policy is being used to manage any indices, the request fails and returns
        an error.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-delete-lifecycle.html>`_

        :param name: Identifier for the policy.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"policy": _quote(name)}
        __path = f'/_ilm/policy/{__path_parts["policy"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "DELETE",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ilm.delete_lifecycle",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def explain_lifecycle(
        self,
        *,
        index: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        only_errors: t.Optional[bool] = None,
        only_managed: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Explain the lifecycle state. Get the current lifecycle status for one or more
        indices. For data streams, the API retrieves the current lifecycle status for
        the stream's backing indices. The response indicates when the index entered each
        lifecycle state, provides the definition of the running phase, and information
        about any failures.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-explain-lifecycle.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases to target.
            Supports wildcards (`*`). To target all data streams and indices, use `*`
            or `_all`.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param only_errors: Filters the returned indices to only indices that are managed
            by ILM and are in an error state, either due to an encountering an error
            while executing the policy, or attempting to use a policy that does not exist.
        :param only_managed: Filters the returned indices to only indices that are managed
            by ILM.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_ilm/explain'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if only_errors is not None:
            __query["only_errors"] = only_errors
        if only_managed is not None:
            __query["only_managed"] = only_managed
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ilm.explain_lifecycle",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def get_lifecycle(
        self,
        *,
        name: t.Optional[str] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get lifecycle policies.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-get-lifecycle.html>`_

        :param name: Identifier for the policy.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        __path_parts: t.Dict[str, str]
        if name not in SKIP_IN_PATH:
            __path_parts = {"policy": _quote(name)}
            __path = f'/_ilm/policy/{__path_parts["policy"]}'
        else:
            __path_parts = {}
            __path = "/_ilm/policy"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ilm.get_lifecycle",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def get_status(
        self,
        *,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get the ILM status. Get the current index lifecycle management status.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-get-status.html>`_
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_ilm/status"
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
            endpoint_id="ilm.get_status",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("legacy_template_to_delete", "node_attribute"),
    )
    def migrate_to_data_tiers(
        self,
        *,
        dry_run: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        legacy_template_to_delete: t.Optional[str] = None,
        node_attribute: t.Optional[str] = None,
        pretty: t.Optional[bool] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Migrate to data tiers routing. Switch the indices, ILM policies, and legacy,
        composable, and component templates from using custom node attributes and attribute-based
        allocation filters to using data tiers. Optionally, delete one legacy index template.
        Using node roles enables ILM to automatically move the indices between data tiers.
        Migrating away from custom node attributes routing can be manually performed.
        This API provides an automated way of performing three out of the four manual
        steps listed in the migration guide: 1. Stop setting the custom hot attribute
        on new indices. 1. Remove custom allocation settings from existing ILM policies.
        1. Replace custom allocation settings from existing indices with the corresponding
        tier preference. ILM must be stopped before performing the migration. Use the
        stop ILM and get ILM status APIs to wait until the reported operation mode is
        `STOPPED`.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-migrate-to-data-tiers.html>`_

        :param dry_run: If true, simulates the migration from node attributes based allocation
            filters to data tiers, but does not perform the migration. This provides
            a way to retrieve the indices and ILM policies that need to be migrated.
        :param legacy_template_to_delete:
        :param node_attribute:
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_ilm/migrate_to_data_tiers"
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if dry_run is not None:
            __query["dry_run"] = dry_run
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        if not __body:
            if legacy_template_to_delete is not None:
                __body["legacy_template_to_delete"] = legacy_template_to_delete
            if node_attribute is not None:
                __body["node_attribute"] = node_attribute
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="ilm.migrate_to_data_tiers",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("current_step", "next_step"),
    )
    def move_to_step(
        self,
        *,
        index: str,
        current_step: t.Optional[t.Mapping[str, t.Any]] = None,
        next_step: t.Optional[t.Mapping[str, t.Any]] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Move to a lifecycle step. Manually move an index into a specific step in the
        lifecycle policy and run that step. WARNING: This operation can result in the
        loss of data. Manually moving an index into a specific step runs that step even
        if it has already been performed. This is a potentially destructive action and
        this should be considered an expert level API. You must specify both the current
        step and the step to be executed in the body of the request. The request will
        fail if the current step does not match the step currently running for the index
        This is to prevent the index from being moved from an unexpected step into the
        next step. When specifying the target (`next_step`) to which the index will be
        moved, either the name or both the action and name fields are optional. If only
        the phase is specified, the index will move to the first step of the first action
        in the target phase. If the phase and action are specified, the index will move
        to the first step of the specified action in the specified phase. Only actions
        specified in the ILM policy are considered valid. An index cannot move to a step
        that is not part of its policy.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-move-to-step.html>`_

        :param index: The name of the index whose lifecycle step is to change
        :param current_step:
        :param next_step:
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        if current_step is None and body is None:
            raise ValueError("Empty value passed for parameter 'current_step'")
        if next_step is None and body is None:
            raise ValueError("Empty value passed for parameter 'next_step'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/_ilm/move/{__path_parts["index"]}'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        if not __body:
            if current_step is not None:
                __body["current_step"] = current_step
            if next_step is not None:
                __body["next_step"] = next_step
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="ilm.move_to_step",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("policy",),
    )
    def put_lifecycle(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        policy: t.Optional[t.Mapping[str, t.Any]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Create or update a lifecycle policy. If the specified policy exists, it is replaced
        and the policy version is incremented. NOTE: Only the latest version of the policy
        is stored, you cannot revert to previous versions.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-put-lifecycle.html>`_

        :param name: Identifier for the policy.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param policy:
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"policy": _quote(name)}
        __path = f'/_ilm/policy/{__path_parts["policy"]}'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if not __body:
            if policy is not None:
                __body["policy"] = policy
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
            endpoint_id="ilm.put_lifecycle",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def remove_policy(
        self,
        *,
        index: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Remove policies from an index. Remove the assigned lifecycle policies from an
        index or a data stream's backing indices. It also stops managing the indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-remove-policy.html>`_

        :param index: The name of the index to remove policy on
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_ilm/remove'
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
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ilm.remove_policy",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def retry(
        self,
        *,
        index: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Retry a policy. Retry running the lifecycle policy for an index that is in the
        ERROR step. The API sets the policy back to the step where the error occurred
        and runs the step. Use the explain lifecycle state API to determine whether an
        index is in the ERROR step.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-retry-policy.html>`_

        :param index: The name of the indices (comma-separated) whose failed lifecycle
            step is to be retry
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_ilm/retry'
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
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ilm.retry",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def start(
        self,
        *,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Start the ILM plugin. Start the index lifecycle management plugin if it is currently
        stopped. ILM is started automatically when the cluster is formed. Restarting
        ILM is necessary only when it has been stopped using the stop ILM API.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-start.html>`_

        :param master_timeout:
        :param timeout:
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_ilm/start"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ilm.start",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def stop(
        self,
        *,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Stop the ILM plugin. Halt all lifecycle management operations and stop the index
        lifecycle management plugin. This is useful when you are performing maintenance
        on the cluster and need to prevent ILM from performing any actions on your indices.
        The API returns as soon as the stop request has been acknowledged, but the plugin
        might continue to run until in-progress operations complete and the plugin can
        be safely stopped. Use the get ILM status API to check whether ILM is running.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ilm-stop.html>`_

        :param master_timeout:
        :param timeout:
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_ilm/stop"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ilm.stop",
            path_parts=__path_parts,
        )
