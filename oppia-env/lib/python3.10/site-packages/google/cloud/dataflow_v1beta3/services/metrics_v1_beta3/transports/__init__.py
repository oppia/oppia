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
from collections import OrderedDict
from typing import Dict, Type

from .base import MetricsV1Beta3Transport
from .grpc import MetricsV1Beta3GrpcTransport
from .grpc_asyncio import MetricsV1Beta3GrpcAsyncIOTransport
from .rest import MetricsV1Beta3RestInterceptor, MetricsV1Beta3RestTransport

# Compile a registry of transports.
_transport_registry = OrderedDict()  # type: Dict[str, Type[MetricsV1Beta3Transport]]
_transport_registry["grpc"] = MetricsV1Beta3GrpcTransport
_transport_registry["grpc_asyncio"] = MetricsV1Beta3GrpcAsyncIOTransport
_transport_registry["rest"] = MetricsV1Beta3RestTransport

__all__ = (
    "MetricsV1Beta3Transport",
    "MetricsV1Beta3GrpcTransport",
    "MetricsV1Beta3GrpcAsyncIOTransport",
    "MetricsV1Beta3RestTransport",
    "MetricsV1Beta3RestInterceptor",
)
