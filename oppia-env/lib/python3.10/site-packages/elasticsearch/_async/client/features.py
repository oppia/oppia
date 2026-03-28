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
from .utils import Stability, _rewrite_parameters, _stability_warning


class FeaturesClient(NamespacedClient):

    @_rewrite_parameters()
    async def get_features(
        self,
        *,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get the features. Get a list of features that can be included in snapshots using
        the `feature_states` field when creating a snapshot. You can use this API to
        determine which feature states to include when taking a snapshot. By default,
        all feature states are included in a snapshot if that snapshot includes the global
        state, or none if it does not. A feature state includes one or more system indices
        necessary for a given feature to function. In order to ensure data integrity,
        all system indices that comprise a feature state are snapshotted and restored
        together. The features listed by this API are a combination of built-in features
        and features defined by plugins. In order for a feature state to be listed in
        this API and recognized as a valid feature state by the create snapshot API,
        the plugin that defines that feature must be installed on the master node.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/get-features-api.html>`_
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_features"
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
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="features.get_features",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    @_stability_warning(Stability.EXPERIMENTAL)
    async def reset_features(
        self,
        *,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Reset the features. Clear all of the state information stored in system indices
        by Elasticsearch features, including the security and machine learning indices.
        WARNING: Intended for development and testing use only. Do not reset features
        on a production cluster. Return a cluster to the same state as a new installation
        by resetting the feature state for all Elasticsearch features. This deletes all
        state information stored in system indices. The response code is HTTP 200 if
        the state is successfully reset for all features. It is HTTP 500 if the reset
        operation failed for any feature. Note that select features might provide a way
        to reset particular system indices. Using this API resets all features, both
        those that are built-in and implemented as plugins. To list the features that
        will be affected, use the get features API. IMPORTANT: The features installed
        on the node you submit this request to are the features that will be reset. Run
        on the master node if you have any doubts about which plugins are installed on
        individual nodes.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/modules-snapshots.html>`_
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_features/_reset"
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
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="features.reset_features",
            path_parts=__path_parts,
        )
