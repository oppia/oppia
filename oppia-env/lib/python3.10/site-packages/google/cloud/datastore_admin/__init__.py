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
from google.cloud.datastore_admin import gapic_version as package_version

__version__ = package_version.__version__


from google.cloud.datastore_admin_v1.services.datastore_admin.client import (
    DatastoreAdminClient,
)
from google.cloud.datastore_admin_v1.services.datastore_admin.async_client import (
    DatastoreAdminAsyncClient,
)

from google.cloud.datastore_admin_v1.types.datastore_admin import CommonMetadata
from google.cloud.datastore_admin_v1.types.datastore_admin import CreateIndexRequest
from google.cloud.datastore_admin_v1.types.datastore_admin import (
    DatastoreFirestoreMigrationMetadata,
)
from google.cloud.datastore_admin_v1.types.datastore_admin import DeleteIndexRequest
from google.cloud.datastore_admin_v1.types.datastore_admin import EntityFilter
from google.cloud.datastore_admin_v1.types.datastore_admin import ExportEntitiesMetadata
from google.cloud.datastore_admin_v1.types.datastore_admin import ExportEntitiesRequest
from google.cloud.datastore_admin_v1.types.datastore_admin import ExportEntitiesResponse
from google.cloud.datastore_admin_v1.types.datastore_admin import GetIndexRequest
from google.cloud.datastore_admin_v1.types.datastore_admin import ImportEntitiesMetadata
from google.cloud.datastore_admin_v1.types.datastore_admin import ImportEntitiesRequest
from google.cloud.datastore_admin_v1.types.datastore_admin import IndexOperationMetadata
from google.cloud.datastore_admin_v1.types.datastore_admin import ListIndexesRequest
from google.cloud.datastore_admin_v1.types.datastore_admin import ListIndexesResponse
from google.cloud.datastore_admin_v1.types.datastore_admin import Progress
from google.cloud.datastore_admin_v1.types.datastore_admin import OperationType
from google.cloud.datastore_admin_v1.types.index import Index
from google.cloud.datastore_admin_v1.types.migration import MigrationProgressEvent
from google.cloud.datastore_admin_v1.types.migration import MigrationStateEvent
from google.cloud.datastore_admin_v1.types.migration import MigrationState
from google.cloud.datastore_admin_v1.types.migration import MigrationStep

__all__ = (
    "DatastoreAdminClient",
    "DatastoreAdminAsyncClient",
    "CommonMetadata",
    "CreateIndexRequest",
    "DatastoreFirestoreMigrationMetadata",
    "DeleteIndexRequest",
    "EntityFilter",
    "ExportEntitiesMetadata",
    "ExportEntitiesRequest",
    "ExportEntitiesResponse",
    "GetIndexRequest",
    "ImportEntitiesMetadata",
    "ImportEntitiesRequest",
    "IndexOperationMetadata",
    "ListIndexesRequest",
    "ListIndexesResponse",
    "Progress",
    "OperationType",
    "Index",
    "MigrationProgressEvent",
    "MigrationStateEvent",
    "MigrationState",
    "MigrationStep",
)
