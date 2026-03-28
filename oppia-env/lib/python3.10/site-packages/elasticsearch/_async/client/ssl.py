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


class SslClient(NamespacedClient):

    @_rewrite_parameters()
    async def certificates(
        self,
        *,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get SSL certificates. Get information about the X.509 certificates that are used
        to encrypt communications in the cluster. The API returns a list that includes
        certificates from all TLS contexts including: - Settings for transport and HTTP
        interfaces - TLS settings that are used within authentication realms - TLS settings
        for remote monitoring exporters The list includes certificates that are used
        for configuring trust, such as those configured in the `xpack.security.transport.ssl.truststore`
        and `xpack.security.transport.ssl.certificate_authorities` settings. It also
        includes certificates that are used for configuring server identity, such as
        `xpack.security.http.ssl.keystore` and `xpack.security.http.ssl.certificate settings`.
        The list does not include certificates that are sourced from the default SSL
        context of the Java Runtime Environment (JRE), even if those certificates are
        in use within Elasticsearch. NOTE: When a PKCS#11 token is configured as the
        truststore of the JRE, the API returns all the certificates that are included
        in the PKCS#11 token irrespective of whether these are used in the Elasticsearch
        TLS configuration. If Elasticsearch is configured to use a keystore or truststore,
        the API output includes all certificates in that store, even though some of the
        certificates might not be in active use within the cluster.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/security-api-ssl.html>`_
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_ssl/certificates"
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
            endpoint_id="ssl.certificates",
            path_parts=__path_parts,
        )
