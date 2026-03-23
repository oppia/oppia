# -*- coding: utf-8 -*-

# Copyright 2019 Google LLC
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


"""Python idiomatic client for Google Cloud Firestore."""


from google.cloud.firestore_v1 import gapic_version as package_version

__version__: str = package_version.__version__

from typing import List

from google.cloud.firestore_v1 import types
from google.cloud.firestore_v1._helpers import (
    ExistsOption,
    GeoPoint,
    LastUpdateOption,
    ReadAfterWriteError,
    WriteOption,
)
from google.cloud.firestore_v1.async_batch import AsyncWriteBatch
from google.cloud.firestore_v1.async_client import AsyncClient
from google.cloud.firestore_v1.async_collection import AsyncCollectionReference
from google.cloud.firestore_v1.async_document import AsyncDocumentReference
from google.cloud.firestore_v1.async_query import AsyncQuery
from google.cloud.firestore_v1.async_transaction import (
    AsyncTransaction,
    async_transactional,
)
from google.cloud.firestore_v1.base_aggregation import CountAggregation
from google.cloud.firestore_v1.base_document import DocumentSnapshot
from google.cloud.firestore_v1.base_query import And, FieldFilter, Or
from google.cloud.firestore_v1.batch import WriteBatch
from google.cloud.firestore_v1.client import Client
from google.cloud.firestore_v1.collection import CollectionReference
from google.cloud.firestore_v1.document import DocumentReference
from google.cloud.firestore_v1.query import CollectionGroup, Query
from google.cloud.firestore_v1.query_profile import ExplainOptions
from google.cloud.firestore_v1.transaction import Transaction, transactional
from google.cloud.firestore_v1.transforms import (
    DELETE_FIELD,
    SERVER_TIMESTAMP,
    ArrayRemove,
    ArrayUnion,
    Increment,
    Maximum,
    Minimum,
)
from google.cloud.firestore_v1.watch import Watch

# TODO(https://github.com/googleapis/python-firestore/issues/93): this is all on the generated surface. We require this to match
# firestore.py. So comment out until needed on customer level for certain.
# from .services.firestore import FirestoreClient
# from .types.common import DocumentMask
# from .types.common import Precondition
# from .types.common import TransactionOptions
# from .types.document import ArrayValue
# from .types.document import Document
# from .types.document import MapValue
# from .types.document import Value
# from .types.firestore import BatchGetDocumentsRequest
# from .types.firestore import BatchGetDocumentsResponse
# from .types.firestore import BatchWriteRequest
# from .types.firestore import BatchWriteResponse
# from .types.firestore import BeginTransactionRequest
# from .types.firestore import BeginTransactionResponse
# from .types.firestore import CommitRequest
# from .types.firestore import CommitResponse
# from .types.firestore import CreateDocumentRequest
# from .types.firestore import DeleteDocumentRequest
# from .types.firestore import GetDocumentRequest
# from .types.firestore import ListCollectionIdsRequest
# from .types.firestore import ListCollectionIdsResponse
# from .types.firestore import ListDocumentsRequest
# from .types.firestore import ListDocumentsResponse
# from .types.firestore import ListenRequest
# from .types.firestore import ListenResponse
# from .types.firestore import PartitionQueryRequest
# from .types.firestore import PartitionQueryResponse
# from .types.firestore import RollbackRequest
# from .types.firestore import RunQueryRequest
# from .types.firestore import RunQueryResponse
# from .types.firestore import Target
# from .types.firestore import TargetChange
# from .types.firestore import UpdateDocumentRequest
# from .types.firestore import WriteRequest
# from .types.firestore import WriteResponse
# from .types.query import Cursor
# from .types.query import StructuredQuery
# from .types.write import DocumentChange
# from .types.write import DocumentDelete
# from .types.write import DocumentRemove
from .types.write import DocumentTransform

# from .types.write import ExistenceFilter
# from .types.write import Write
# from .types.write import WriteResult

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
