# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""``ndb`` is a library for Google Cloud Firestore in Datastore Mode and Google Cloud Datastore.

It was originally included in the Google App Engine runtime as a "new"
version of the ``db`` API (hence ``ndb``).

.. autodata:: __version__
.. autodata:: __all__
"""

from google.cloud.ndb import version

__version__ = version.__version__

from google.cloud.ndb.client import Client
from google.cloud.ndb.context import AutoBatcher
from google.cloud.ndb.context import Context
from google.cloud.ndb.context import ContextOptions
from google.cloud.ndb.context import get_context
from google.cloud.ndb.context import get_toplevel_context
from google.cloud.ndb.context import TransactionOptions
from google.cloud.ndb._datastore_api import EVENTUAL
from google.cloud.ndb._datastore_api import EVENTUAL_CONSISTENCY
from google.cloud.ndb._datastore_api import STRONG
from google.cloud.ndb._datastore_query import Cursor
from google.cloud.ndb._datastore_query import QueryIterator
from google.cloud.ndb.global_cache import GlobalCache
from google.cloud.ndb.global_cache import MemcacheCache
from google.cloud.ndb.global_cache import RedisCache
from google.cloud.ndb.key import Key
from google.cloud.ndb.model import BlobKey
from google.cloud.ndb.model import BlobKeyProperty
from google.cloud.ndb.model import BlobProperty
from google.cloud.ndb.model import BooleanProperty
from google.cloud.ndb.model import ComputedProperty
from google.cloud.ndb.model import ComputedPropertyError
from google.cloud.ndb.model import DateProperty
from google.cloud.ndb.model import DateTimeProperty
from google.cloud.ndb.model import delete_multi
from google.cloud.ndb.model import delete_multi_async
from google.cloud.ndb.model import Expando
from google.cloud.ndb.model import FloatProperty
from google.cloud.ndb.model import GenericProperty
from google.cloud.ndb.model import GeoPt
from google.cloud.ndb.model import GeoPtProperty
from google.cloud.ndb.model import get_indexes
from google.cloud.ndb.model import get_indexes_async
from google.cloud.ndb.model import get_multi
from google.cloud.ndb.model import get_multi_async
from google.cloud.ndb.model import Index
from google.cloud.ndb.model import IndexProperty
from google.cloud.ndb.model import IndexState
from google.cloud.ndb.model import IntegerProperty
from google.cloud.ndb.model import InvalidPropertyError
from google.cloud.ndb.model import BadProjectionError
from google.cloud.ndb.model import JsonProperty
from google.cloud.ndb.model import KeyProperty
from google.cloud.ndb.model import KindError
from google.cloud.ndb.model import LocalStructuredProperty
from google.cloud.ndb.model import make_connection
from google.cloud.ndb.model import MetaModel
from google.cloud.ndb.model import Model
from google.cloud.ndb.model import ModelAdapter
from google.cloud.ndb.model import ModelAttribute
from google.cloud.ndb.model import ModelKey
from google.cloud.ndb.model import PickleProperty
from google.cloud.ndb.model import Property
from google.cloud.ndb.model import put_multi
from google.cloud.ndb.model import put_multi_async
from google.cloud.ndb.model import ReadonlyPropertyError
from google.cloud.ndb.model import Rollback
from google.cloud.ndb.model import StringProperty
from google.cloud.ndb.model import StructuredProperty
from google.cloud.ndb.model import TextProperty
from google.cloud.ndb.model import TimeProperty
from google.cloud.ndb.model import UnprojectedPropertyError
from google.cloud.ndb.model import User
from google.cloud.ndb.model import UserNotFoundError
from google.cloud.ndb.model import UserProperty
from google.cloud.ndb.polymodel import PolyModel
from google.cloud.ndb.query import ConjunctionNode
from google.cloud.ndb.query import AND
from google.cloud.ndb.query import DisjunctionNode
from google.cloud.ndb.query import OR
from google.cloud.ndb.query import FalseNode
from google.cloud.ndb.query import FilterNode
from google.cloud.ndb.query import gql
from google.cloud.ndb.query import Node
from google.cloud.ndb.query import Parameter
from google.cloud.ndb.query import ParameterizedFunction
from google.cloud.ndb.query import ParameterizedThing
from google.cloud.ndb.query import ParameterNode
from google.cloud.ndb.query import PostFilterNode
from google.cloud.ndb.query import Query
from google.cloud.ndb.query import QueryOptions
from google.cloud.ndb.query import RepeatedStructuredPropertyPredicate
from google.cloud.ndb.tasklets import add_flow_exception
from google.cloud.ndb.tasklets import Future
from google.cloud.ndb.tasklets import make_context
from google.cloud.ndb.tasklets import make_default_context
from google.cloud.ndb.tasklets import QueueFuture
from google.cloud.ndb.tasklets import ReducingFuture
from google.cloud.ndb.tasklets import Return
from google.cloud.ndb.tasklets import SerialQueueFuture
from google.cloud.ndb.tasklets import set_context
from google.cloud.ndb.tasklets import sleep
from google.cloud.ndb.tasklets import synctasklet
from google.cloud.ndb.tasklets import tasklet
from google.cloud.ndb.tasklets import toplevel
from google.cloud.ndb.tasklets import wait_all
from google.cloud.ndb.tasklets import wait_any
from google.cloud.ndb._transaction import in_transaction
from google.cloud.ndb._transaction import transaction
from google.cloud.ndb._transaction import transaction_async
from google.cloud.ndb._transaction import transactional
from google.cloud.ndb._transaction import transactional_async
from google.cloud.ndb._transaction import transactional_tasklet
from google.cloud.ndb._transaction import non_transactional

__all__ = [
    "__version__",
    "AutoBatcher",
    "Client",
    "Context",
    "ContextOptions",
    "EVENTUAL",
    "EVENTUAL_CONSISTENCY",
    "STRONG",
    "TransactionOptions",
    "Key",
    "BlobKey",
    "BlobKeyProperty",
    "BlobProperty",
    "BooleanProperty",
    "ComputedProperty",
    "ComputedPropertyError",
    "DateProperty",
    "DateTimeProperty",
    "delete_multi",
    "delete_multi_async",
    "Expando",
    "FloatProperty",
    "GenericProperty",
    "GeoPt",
    "GeoPtProperty",
    "get_indexes",
    "get_indexes_async",
    "get_multi",
    "get_multi_async",
    "GlobalCache",
    "in_transaction",
    "Index",
    "IndexProperty",
    "IndexState",
    "IntegerProperty",
    "InvalidPropertyError",
    "BadProjectionError",
    "JsonProperty",
    "KeyProperty",
    "KindError",
    "LocalStructuredProperty",
    "make_connection",
    "MemcacheCache",
    "MetaModel",
    "Model",
    "ModelAdapter",
    "ModelAttribute",
    "ModelKey",
    "non_transactional",
    "PickleProperty",
    "PolyModel",
    "Property",
    "put_multi",
    "put_multi_async",
    "ReadonlyPropertyError",
    "RedisCache",
    "Rollback",
    "StringProperty",
    "StructuredProperty",
    "TextProperty",
    "TimeProperty",
    "transaction",
    "transaction_async",
    "transactional",
    "transactional_async",
    "transactional_tasklet",
    "UnprojectedPropertyError",
    "User",
    "UserNotFoundError",
    "UserProperty",
    "ConjunctionNode",
    "AND",
    "Cursor",
    "DisjunctionNode",
    "OR",
    "FalseNode",
    "FilterNode",
    "gql",
    "Node",
    "Parameter",
    "ParameterizedFunction",
    "ParameterizedThing",
    "ParameterNode",
    "PostFilterNode",
    "Query",
    "QueryIterator",
    "QueryOptions",
    "RepeatedStructuredPropertyPredicate",
    "add_flow_exception",
    "Future",
    "get_context",
    "get_toplevel_context",
    "make_context",
    "make_default_context",
    "QueueFuture",
    "ReducingFuture",
    "Return",
    "SerialQueueFuture",
    "set_context",
    "sleep",
    "synctasklet",
    "tasklet",
    "toplevel",
    "wait_all",
    "wait_any",
]
