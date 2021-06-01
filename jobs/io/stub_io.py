# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Provides stub implementations for io-based PTransforms."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import contextlib
import pickle
import threading
import xmlrpc.client

from jobs import job_utils
import python_utils

import apache_beam as beam


class DatastoreioStub(python_utils.OBJECT):
    """Stubs the apache_beam.io.gcp.datastore.v1new.datastoreio module.

    The PTransforms returned by this stub use an XML-RPC server to operate on
    models. It listens for read, write, and delete requests to be performed on
    the datastore; then applies them to a local stub (implemented with a simple
    dict object).

    The server is necessary because Apache Beam pipelines may be run
    across many different processes, threads, and even machines. Therefore,
    there isn't any state that can be shared between them.

    This restriction gives us the added benefit of being able to enforce tighter
    restrictions on how datastore operations are executed (since the real module
    behaves in the same way; i.e. communicating via RPC), specifically:
        1.  Reads should only occur at the very beginning of a Pipeline.
        2.  Writes/Deletes should only occur at the very end of a Pipeline.
        3.  Reads should never be performed after a Write or Delete (because
            the ordering of PTransform operations are not guaranteed).
    """

    def __init__(self):
        self._server = python_utils.SimpleXMLRPCServer(
            # Using 0 instructs the OS to acquire a free port on our behalf.
            ('localhost', 0),
            # We need to allow None because that is a valid NDB Property value.
            allow_none=True)
        self._server.register_function(
            self._read_from_datastore_handler, name='ReadFromDatastore')
        self._server.register_function(
            self._write_to_datastore_handler, name='WriteToDatastore')
        self._server.register_function(
            self._delete_from_datastore_handler, name='DeleteFromDatastore')

        self._server_port = self._server.server_address[1]
        self._server_context_is_acquired = False
        self._models = {}
        self._models_lock = threading.Lock()
        self._write_was_called = False
        self._delete_was_called = False

    @contextlib.contextmanager
    def context(self):
        """Returns a context in which the stub listens to XML-RPC requests."""
        self._server_context_is_acquired = True
        thread = threading.Thread(target=self._server.serve_forever)
        thread.start()
        try:
            yield
        finally:
            self._server.shutdown()
            thread.join()
            self._server_context_is_acquired = False

    def get(self, query):
        """Returns models in the stub that match the given query.

        Args:
            query: beam_datastore_types.Query. The model query to respect.

        Returns:
            list(Model). All of the models in the stub.
        """
        with self._models_lock:
            models = list(self._models.values())
        job_utils.apply_query_to_models(query, models)
        return models

    def put_multi(self, models):
        """Puts the input models into the stub.

        Args:
            models: list(Model). The NDB models to put into the stub.
        """
        with self._models_lock:
            self._models.update({model.key: model for model in models})

    def delete_multi(self, models):
        """Deletes the models from the stub, if they exist.

        Args:
            models: list(Model). The models to delete from the stub.
        """
        with self._models_lock:
            for model in models:
                self._models.pop(model.key, None)

    def ReadFromDatastore(self, query): # pylint: disable=invalid-name
        """Returns a PTransform which returns all models from the stub.

        NOTE: The name is in UpperCamelCase because that's the same name used by
        the real datastoreio module. Keeping the same name allows us to reduce
        the diffs we'll need to implement when we're ready to use the real
        module in Python 3.

        Args:
            query: beam_datastore_types.Query. The model query to respect.

        Returns:
            PTransform. A PTransform which returns all models in the stub.
        """
        self._assert_server_context_is_acquired()
        if self._write_was_called or self._delete_was_called:
            raise RuntimeError(
                'Cannot read from datastore after a mutation has occurred')

        return _ReadFromDatastore(query, self._server_port)

    def WriteToDatastore(self): # pylint: disable=invalid-name
        """Returns a PTransform which writes models to the stub.

        NOTE: The name is in UpperCamelCase because that's the same name used by
        the real datastoreio module. Keeping the same name allows us to reduce
        the diffs we'll need to implement when we're ready to use the real
        module in Python 3.

        Returns:
            PTransform. A PTransform which stores all models in the PCollection
            it receives as input into the datastore.
        """
        self._assert_server_context_is_acquired()
        if self._write_was_called:
            raise RuntimeError(
                'At most one WriteToDatastore may be executed in a pipeline')

        self._write_was_called = True
        return _WriteToDatastore(self._server_port)

    def DeleteFromDatastore(self): # pylint: disable=invalid-name
        """Returns a PTransform which deletes models from the stub.

        NOTE: The name is in UpperCamelCase because that's the same name used by
        the real datastoreio module. Keeping the same name allows us to reduce
        the diffs we'll need to implement when we're ready to use the real
        module in Python 3.

        Returns:
            PTransform. A PTransform which deletes all models in the PCollection
            it receives as input from the datastore.
        """
        self._assert_server_context_is_acquired()
        if self._delete_was_called:
            raise RuntimeError(
                'At most one DeleteFromDatastore may be executed in a pipeline')

        self._delete_was_called = True
        return _DeleteFromDatastore(self._server_port)

    def _assert_server_context_is_acquired(self):
        """Asserts that context() is currently acquired.

        Raises:
            RuntimeError. The context() is not acquired.
        """
        if not self._server_context_is_acquired:
            raise RuntimeError(
                'Must acquire context() before using datastore operations')

    def _read_from_datastore_handler(self, pickled_query):
        """XML-RPC handler for a ReadFromDatastore request.

        Args:
            pickled_query: str. The encoded Apache Beam query to respect.

        Returns:
            str. The list of all models encoded as a pickled list of Apache Beam
            entities.
        """
        return pickle.dumps([
            job_utils.get_beam_entity_from_model(m)
            for m in self.get(pickle.loads(pickled_query))
        ])

    def _write_to_datastore_handler(self, pickled_models):
        """XML-RPC handler for a WriteToDatastore request.

        IMPORTANT: This operation must be idempotent!

        Args:
            pickled_models: str. The list of models to put into the datastore,
                encoded as a pickled list of Apache Beam entities.
        """
        self.put_multi(
            job_utils.get_model_from_beam_entity(m)
            for m in pickle.loads(pickled_models))

    def _delete_from_datastore_handler(self, pickled_models):
        """XML-RPC handler for a DeleteFromDatastore request.

        IMPORTANT: This operation must be idempotent!

        Args:
            pickled_models: str. The list of models to delete from the
                datastore, encoded as a pickled list of Apache Beam entities.
        """
        self.delete_multi(
            job_utils.get_model_from_beam_entity(m)
            for m in pickle.loads(pickled_models))


class _DatastoreioTransform(beam.PTransform):
    """Base class for datastoreio stubs."""

    def __init__(self, port):
        """Initializes a new datastore operation.

        Args:
            port: int. The port number of the XML-RPC server to which datastore
                operation requests are sent to.
        """
        super(_DatastoreioTransform, self).__init__()
        self._port = port

    @property
    def server_proxy(self):
        """Returns a new ServerProxy for performing datastore operations.

        Returns:
            ServerProxy. An XML-RPC client that calls out to the specified port.
        """
        return xmlrpc.client.ServerProxy('http://localhost:%d' % self._port)


class _ReadFromDatastore(_DatastoreioTransform):
    """Stub implementation of Apache Beam's ReadFromDatastore PTransform."""

    def __init__(self, query, port):
        """Initializes a new ReadFromDatastore operation.

        Args:
            query: beam_datastore_types.Query. The model query to respect.
            port: int. The port number of the XML-RPC server to which datastore
                operation requests are sent to.
        """
        super(_ReadFromDatastore, self).__init__(port)
        self._pickled_query = pickle.dumps(query)

    def expand(self, pcoll):
        """Returns models from storage using the ReadFromDatastore endpoint.

        Args:
            pcoll: PCollection. The source PCollection to attach the fetched
                models onto.

        Returns:
            PCollection. The PCollection of models.
        """
        model_list = pickle.loads(
            self.server_proxy.ReadFromDatastore(self._pickled_query))

        return (
            pcoll
            | 'Get models from the ReadFromDatastore endpoint' >> (
                beam.Create(model_list))
            | 'Convert the Apache Beam entities into NDB models' >> (
                beam.Map(job_utils.get_model_from_beam_entity))
        )


class _WriteToDatastore(_DatastoreioTransform):
    """Stub implementation of Apache Beam's WriteToDatastore PTransform."""

    def expand(self, model_pcoll):
        """Puts models into storage using the WriteToDatastore endpoint.

        Args:
            model_pcoll: PCollection. The collection of models to put into
                storage.

        Returns:
            PCollection. An empty PCollection.
        """
        return (
            model_pcoll
            | 'Create Apache Beam entities for put operation' >> (
                beam.Map(job_utils.get_beam_entity_from_model))
            | 'Gather entities to put in a list' >> beam.combiners.ToList()
            | 'Encode the list of entities to put using pickle' >> (
                beam.Map(pickle.dumps))
            | 'Callout to the WriteToDatastore endpoint' >> beam.ParDo(
                # NOTE: We need to use this lambda because
                # ServerProxy.WriteToDatastore is not a real function.
                # server_proxy transforms it into an RPC request using Python
                # "magic". Apache Beam requires a genuine function, however, so
                # we pass a lambda to satisfy it.
                lambda pickled_models: ( # pylint: disable=unnecessary-lambda
                    self.server_proxy.WriteToDatastore(pickled_models)))
        )


class _DeleteFromDatastore(_DatastoreioTransform):
    """Stub implementation of Apache Beam's DeleteFromDatastore PTransform."""

    def expand(self, model_pcoll):
        """Deletes models from storage using the DeleteFromDatastore endpoint.

        Args:
            model_pcoll: PCollection. The collection of models to delete from
                storage.

        Returns:
            PCollection. An empty PCollection.
        """
        return (
            model_pcoll
            | 'Create Apache Beam entities for delete operation' >> (
                beam.Map(job_utils.get_beam_entity_from_model))
            | 'Gather entities to delete in a list' >> beam.combiners.ToList()
            | 'Encode the list of entities to delete using pickle' >> (
                beam.Map(pickle.dumps))
            | 'Callout to the DeleteFromDatastore endpoint' >> beam.ParDo(
                # NOTE: We need to use this lambda because
                # ServerProxy.DeleteFromDatastore is not a real function.
                # server_proxy transforms it into an RPC request using Python
                # "magic". Apache Beam requires a genuine function, however, so
                # we pass a lambda to satisfy it.
                lambda pickled_models: ( # pylint: disable=unnecessary-lambda
                    self.server_proxy.DeleteFromDatastore(pickled_models)))
        )
