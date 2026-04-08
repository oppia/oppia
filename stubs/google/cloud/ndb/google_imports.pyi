from google3.apphosting.api import (
    apiproxy_rpc as apiproxy_rpc,
)
from google3.apphosting.api import (
    apiproxy_stub_map as apiproxy_stub_map,
)
from google3.apphosting.api import (
    datastore as datastore,
)
from google3.apphosting.api import (
    datastore_errors as datastore_errors,
)
from google3.apphosting.api import (
    datastore_types as datastore_types,
)
from google3.apphosting.api import (
    memcache as memcache,
)
from google3.apphosting.api import (
    namespace_manager as namespace_manager,
)
from google3.apphosting.api import (
    taskqueue as taskqueue,
)
from google3.apphosting.api import (
    urlfetch as urlfetch,
)
from google3.apphosting.api import (
    users as users,
)
from google3.apphosting.datastore import (
    datastore_pbs as datastore_pbs,
)
from google3.apphosting.datastore import (
    datastore_query as datastore_query,
)
from google3.apphosting.datastore import (
    datastore_rpc as datastore_rpc,
)
from google3.apphosting.ext import db as db
from google3.apphosting.ext import gql as gql
from google3.apphosting.ext.vmruntime import callback as callback
from google3.apphosting.runtime import apiproxy_errors as apiproxy_errors
from google3.net.proto import ProtocolBuffer as ProtocolBuffer
from google3.storage.onestore.v3 import entity_pb as entity_pb
from typing import Any

GOOGLE_PACKAGE_PATH: Any

def set_appengine_imports() -> None: ...

normal_environment: bool
