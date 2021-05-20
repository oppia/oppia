#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
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

"""
In-memory persistent stub for the Python datastore API. Gets, queries,
and searches are implemented as in-memory scans over all entities.

Stores entities across sessions as pickled proto bufs in a single file. On
startup, all entities are read from the file and loaded into memory. On
every Put(), the file is wiped and all entities are written from scratch.
Clients can also manually Read() and Write() the file themselves.

Transactions are serialized through __tx_lock. Each transaction acquires it
when it begins and releases it when it commits or rolls back. This is
important, since there are other member variables like __tx_snapshot that are
per-transaction, so they should only be used by one tx at a time.
"""

from core.platform.datastore import cloud_datastore_services

import contextlib
import six




class CloudDatastoreStub:
    """"""

    _DICT_OF_MODELS = {}

    class Key:
        def __new__(cls, model_class, id):
            instance = super().__new__(cls)
            instance._model_class = model_class
            instance._id = id
            return instance

    class Model:

        def __init__(self, **kwargs):
            pass


    _IMPLEMENTED_SDK_OBJECTS_NAMES = [
        'Model',
        'Key',
    ]

    _UNIMPLEMENTED_SDK_OBJECTS_NAMES = []

    def __init__(self):
        self._users_by_uid = {}
        self._uid_by_session_cookie = {}
        self._swap_stack = None
        self._test = None

    @contextlib.contextmanager
    def install(self, test):
        """Installs the stub on the given test instance. Idempotent.

        Args:
            test: test_utils.TestBase. The test to install the stub on.
        """
        self._test = test

        with contextlib.ExitStack() as swap_stack:
            for name in self._IMPLEMENTED_SDK_OBJECTS_NAMES:
                swap_stack.enter_context(test.swap(
                    cloud_datastore_services, name, getattr(self, name)))

            for name in self._UNIMPLEMENTED_SDK_OBJECTS_NAMES:
                swap_stack.enter_context(test.swap_to_always_raise(
                    cloud_datastore_services, name, NotImplementedError))

            yield swap_stack
