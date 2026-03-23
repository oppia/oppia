# Copyright 2017 Google LLC All rights reserved.
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

"""Python idiomatic client for Google Cloud Firestore."""


from google.cloud.firestore_v1 import gapic_version as package_version

__version__ = package_version.__version__

from google.cloud.firestore_v1 import And
from google.cloud.firestore_v1 import ArrayRemove
from google.cloud.firestore_v1 import ArrayUnion
from google.cloud.firestore_v1 import AsyncClient
from google.cloud.firestore_v1 import AsyncCollectionReference
from google.cloud.firestore_v1 import AsyncDocumentReference
from google.cloud.firestore_v1 import AsyncQuery
from google.cloud.firestore_v1 import async_transactional
from google.cloud.firestore_v1 import AsyncTransaction
from google.cloud.firestore_v1 import AsyncWriteBatch
from google.cloud.firestore_v1 import Client
from google.cloud.firestore_v1 import CountAggregation
from google.cloud.firestore_v1 import CollectionGroup
from google.cloud.firestore_v1 import CollectionReference
from google.cloud.firestore_v1 import DELETE_FIELD
from google.cloud.firestore_v1 import DocumentReference
from google.cloud.firestore_v1 import DocumentSnapshot
from google.cloud.firestore_v1 import DocumentTransform
from google.cloud.firestore_v1 import ExistsOption
from google.cloud.firestore_v1 import ExplainOptions
from google.cloud.firestore_v1 import FieldFilter
from google.cloud.firestore_v1 import GeoPoint
from google.cloud.firestore_v1 import Increment
from google.cloud.firestore_v1 import LastUpdateOption
from google.cloud.firestore_v1 import Maximum
from google.cloud.firestore_v1 import Minimum
from google.cloud.firestore_v1 import Or
from google.cloud.firestore_v1 import Query
from google.cloud.firestore_v1 import ReadAfterWriteError
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from google.cloud.firestore_v1 import Transaction
from google.cloud.firestore_v1 import transactional
from google.cloud.firestore_v1 import types
from google.cloud.firestore_v1 import Watch
from google.cloud.firestore_v1 import WriteBatch
from google.cloud.firestore_v1 import WriteOption
from typing import List


__all__: List[str] = [
    "__version__",
    "And",
    "ArrayRemove",
    "ArrayUnion",
    "AsyncClient",
    "AsyncCollectionReference",
    "AsyncDocumentReference",
    "AsyncQuery",
    "async_transactional",
    "AsyncTransaction",
    "AsyncWriteBatch",
    "Client",
    "CountAggregation",
    "CollectionGroup",
    "CollectionReference",
    "DELETE_FIELD",
    "DocumentReference",
    "DocumentSnapshot",
    "DocumentTransform",
    "ExistsOption",
    "ExplainOptions",
    "FieldFilter",
    "GeoPoint",
    "Increment",
    "LastUpdateOption",
    "Maximum",
    "Minimum",
    "Or",
    "Query",
    "ReadAfterWriteError",
    "SERVER_TIMESTAMP",
    "Transaction",
    "transactional",
    "types",
    "Watch",
    "WriteBatch",
    "WriteOption",
]
