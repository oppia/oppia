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
from __future__ import annotations

from typing import MutableMapping, MutableSequence

import proto  # type: ignore


__protobuf__ = proto.module(
    package="google.cloud.aiplatform.v1",
    manifest={
        "PSCAutomationConfig",
        "PrivateServiceConnectConfig",
        "PscAutomatedEndpoints",
    },
)


class PSCAutomationConfig(proto.Message):
    r"""PSC config that is used to automatically create forwarding
    rule via ServiceConnectionMap.

    Attributes:
        project_id (str):
            Required. Project id used to create
            forwarding rule.
        network (str):
            Required. The full name of the Google Compute Engine
            `network <https://cloud.google.com/compute/docs/networks-and-firewalls#networks>`__.
            `Format <https://cloud.google.com/compute/docs/reference/rest/v1/networks/insert>`__:
            ``projects/{project}/global/networks/{network}``. Where
            {project} is a project number, as in '12345', and {network}
            is network name.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    network: str = proto.Field(
        proto.STRING,
        number=2,
    )


class PrivateServiceConnectConfig(proto.Message):
    r"""Represents configuration for private service connect.

    Attributes:
        enable_private_service_connect (bool):
            Required. If true, expose the IndexEndpoint
            via private service connect.
        project_allowlist (MutableSequence[str]):
            A list of Projects from which the forwarding
            rule will target the service attachment.
        service_attachment (str):
            Output only. The name of the generated
            service attachment resource. This is only
            populated if the endpoint is deployed with
            PrivateServiceConnect.
    """

    enable_private_service_connect: bool = proto.Field(
        proto.BOOL,
        number=1,
    )
    project_allowlist: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=2,
    )
    service_attachment: str = proto.Field(
        proto.STRING,
        number=5,
    )


class PscAutomatedEndpoints(proto.Message):
    r"""PscAutomatedEndpoints defines the output of the forwarding
    rule automatically created by each PscAutomationConfig.

    Attributes:
        project_id (str):
            Corresponding project_id in pscAutomationConfigs
        network (str):
            Corresponding network in
            pscAutomationConfigs.
        match_address (str):
            Ip Address created by the automated
            forwarding rule.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    network: str = proto.Field(
        proto.STRING,
        number=2,
    )
    match_address: str = proto.Field(
        proto.STRING,
        number=3,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
