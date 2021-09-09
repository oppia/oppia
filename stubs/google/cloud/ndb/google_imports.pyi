from google3.apphosting.api import apiproxy_rpc as apiproxy_rpc, apiproxy_stub_map as apiproxy_stub_map, datastore as datastore, datastore_errors as datastore_errors, datastore_types as datastore_types, memcache as memcache, namespace_manager as namespace_manager, taskqueue as taskqueue, urlfetch as urlfetch, users as users
from google3.apphosting.datastore import datastore_pbs as datastore_pbs, datastore_query as datastore_query, datastore_rpc as datastore_rpc
from google3.apphosting.ext import db as db, gql as gql
from google3.apphosting.ext.vmruntime import callback as callback
from google3.apphosting.runtime import apiproxy_errors as apiproxy_errors
from google3.net.proto import ProtocolBuffer as ProtocolBuffer
from google3.storage.onestore.v3 import entity_pb as entity_pb
from typing import Any

GOOGLE_PACKAGE_PATH: Any

def set_appengine_imports() -> None: ...

normal_environment: bool
