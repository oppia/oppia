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

from .base import FirestoreAdminTransport
from .grpc import FirestoreAdminGrpcTransport
from .grpc_asyncio import FirestoreAdminGrpcAsyncIOTransport
from .rest import FirestoreAdminRestTransport
from .rest import FirestoreAdminRestInterceptor


# Compile a registry of transports.
_transport_registry = OrderedDict()  # type: Dict[str, Type[FirestoreAdminTransport]]
_transport_registry["grpc"] = FirestoreAdminGrpcTransport
_transport_registry["grpc_asyncio"] = FirestoreAdminGrpcAsyncIOTransport
_transport_registry["rest"] = FirestoreAdminRestTransport

__all__ = (
    "FirestoreAdminTransport",
    "FirestoreAdminGrpcTransport",
    "FirestoreAdminGrpcAsyncIOTransport",
    "FirestoreAdminRestTransport",
    "FirestoreAdminRestInterceptor",
)
