# Copyright 2014 Google LLC
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

"""Create / interact with a batch of updates / deletes.

Batches provide the ability to execute multiple operations
in a single request to the Cloud Datastore API.

See
https://cloud.google.com/datastore/docs/concepts/entities#batch_operations
"""

from google.cloud.datastore import helpers
from google.cloud.datastore_v1.types import datastore as _datastore_pb2


class Batch(object):
    """An abstraction representing a collected group of updates / deletes.

    Used to build up a bulk mutation.

    For example, the following snippet of code will put the two ``save``
    operations and the ``delete`` operation into the same mutation, and send
    them to the server in a single API request:

    .. testsetup:: batch

        import uuid

        from google.cloud import datastore

        unique = str(uuid.uuid4())[0:8]
        client = datastore.Client(namespace='ns{}'.format(unique))

    .. doctest:: batch

        >>> entity1 = datastore.Entity(client.key('EntityKind', 1234))
        >>> entity2 = datastore.Entity(client.key('EntityKind', 2345))
        >>> key3 = client.key('EntityKind', 3456)
        >>> batch = client.batch()
        >>> batch.begin()
        >>> batch.put(entity1)
        >>> batch.put(entity2)
        >>> batch.delete(key3)
        >>> batch.commit()

    You can also use a batch as a context manager, in which case
    :meth:`commit` will be called automatically if its block exits without
    raising an exception:

    .. doctest:: batch

        >>> with client.batch() as batch:
        ...     batch.put(entity1)
        ...     batch.put(entity2)
        ...     batch.delete(key3)

    By default, no updates will be sent if the block exits with an error:

    .. doctest:: batch

        >>> def do_some_work(batch):
        ...    return
        >>> with client.batch() as batch:
        ...     do_some_work(batch)
        ...     raise Exception()  # rolls back
        Traceback (most recent call last):
          ...
        Exception

    .. testcleanup:: txn

        with client.batch() as batch:
            batch.delete(client.key('EntityKind', 1234))
            batch.delete(client.key('EntityKind', 2345))

    :type client: :class:`google.cloud.datastore.client.Client`
    :param client: The client used to connect to datastore.
    """

    _id = None  # "protected" attribute, always None for non-transactions

    _INITIAL = 0
    """Enum value for _INITIAL status of batch/transaction."""

    _IN_PROGRESS = 1
    """Enum value for _IN_PROGRESS status of batch/transaction."""

    _ABORTED = 2
    """Enum value for _ABORTED status of batch/transaction."""

    _FINISHED = 3
    """Enum value for _FINISHED status of batch/transaction."""

    def __init__(self, client):
        self._client = client
        self._mutations = []
        self._partial_key_entities = []
        self._status = self._INITIAL

    def current(self):
        """Return the topmost batch / transaction, or None."""
        return self._client.current_batch

    @property
    def project(self):
        """Getter for project in which the batch will run.

        :rtype: :class:`str`
        :returns: The project in which the batch will run.
        """
        return self._client.project

    @property
    def database(self):
        """Getter for database in which the batch will run.

        :rtype: :class:`str`
        :returns: The database in which the batch will run.
        """
        return self._client.database

    @property
    def namespace(self):
        """Getter for namespace in which the batch will run.

        :rtype: :class:`str`
        :returns: The namespace in which the batch will run.
        """
        return self._client.namespace

    def _add_partial_key_entity_pb(self):
        """Adds a new mutation for an entity with a partial key.

        :rtype: :class:`.entity_pb2.Entity`
        :returns: The newly created entity protobuf that will be
                  updated and sent with a commit.
        """
        new_mutation = _datastore_pb2.Mutation()
        self._mutations.append(new_mutation)
        return new_mutation.insert

    def _add_complete_key_entity_pb(self):
        """Adds a new mutation for an entity with a completed key.

        :rtype: :class:`.entity_pb2.Entity`
        :returns: The newly created entity protobuf that will be
                  updated and sent with a commit.
        """
        # We use ``upsert`` for entities with completed keys, rather than
        # ``insert`` or ``update``, in order not to create race conditions
        # based on prior existence / removal of the entity.
        new_mutation = _datastore_pb2.Mutation()
        self._mutations.append(new_mutation)
        return new_mutation.upsert

    def _add_delete_key_pb(self):
        """Adds a new mutation for a key to be deleted.

        :rtype: :class:`.entity_pb2.Key`
        :returns: The newly created key protobuf that will be
                  deleted when sent with a commit.
        """
        new_mutation = _datastore_pb2.Mutation()
        self._mutations.append(new_mutation)
        return new_mutation.delete

    @property
    def mutations(self):
        """Getter for the changes accumulated by this batch.

        Every batch is committed with a single commit request containing all
        the work to be done as mutations. Inside a batch, calling :meth:`put`
        with an entity, or :meth:`delete` with a key, builds up the request by
        adding a new mutation. This getter returns the protobuf that has been
        built-up so far.

        :rtype: iterable
        :returns: The list of :class:`.datastore_pb2.Mutation`
                  protobufs to be sent in the commit request.
        """
        return self._mutations

    def _allow_mutations(self) -> bool:
        """
        This method is called to see if the batch is in a proper state to allow
        `put` and `delete` operations.

        the Transaction subclass overrides this method to support
        the `begin_later` flag.

        :rtype: bool
        :returns: True if the batch is in a state to allow mutations.
        """
        return self._status == self._IN_PROGRESS

    def put(self, entity):
        """Remember an entity's state to be saved during :meth:`commit`.

        .. note::
           Any existing properties for the entity will be replaced by those
           currently set on this instance.  Already-stored properties which do
           not correspond to keys set on this instance will be removed from
           the datastore.

        .. note::
           Property values which are "text" ('unicode' in Python2, 'str' in
           Python3) map to 'string_value' in the datastore;  values which are
           "bytes" ('str' in Python2, 'bytes' in Python3) map to 'blob_value'.

        When an entity has a partial key, calling :meth:`commit` sends it as
        an ``insert`` mutation and the key is completed. On return,
        the key for the ``entity`` passed in is updated to match the key ID
        assigned by the server.

        :type entity: :class:`google.cloud.datastore.entity.Entity`
        :param entity: the entity to be saved.

        :raises: :class:`~exceptions.ValueError` if the batch is not in
                 progress, if entity has no key assigned, or if the key's
                 ``project`` does not match ours.
        """
        if not self._allow_mutations():
            raise ValueError("Batch must be in progress to put()")

        if entity.key is None:
            raise ValueError("Entity must have a key")

        if self.project != entity.key.project:
            raise ValueError("Key must be from same project as batch")

        if self.database != entity.key.database:
            raise ValueError("Key must be from same database as batch")

        if entity.key.is_partial:
            entity_pb = self._add_partial_key_entity_pb()
            self._partial_key_entities.append(entity)
        else:
            entity_pb = self._add_complete_key_entity_pb()

        _assign_entity_to_pb(entity_pb, entity)

    def delete(self, key):
        """Remember a key to be deleted during :meth:`commit`.

        :type key: :class:`google.cloud.datastore.key.Key`
        :param key: the key to be deleted.

        :raises: :class:`~exceptions.ValueError` if the batch is not in
                 progress, if key is not complete, or if the key's
                 ``project`` does not match ours.
        """
        if not self._allow_mutations():
            raise ValueError("Batch must be in progress to delete()")

        if key.is_partial:
            raise ValueError("Key must be complete")

        if self.project != key.project:
            raise ValueError("Key must be from same project as batch")

        if self.database != key.database:
            raise ValueError("Key must be from same database as batch")

        key_pb = key.to_protobuf()
        self._add_delete_key_pb()._pb.CopyFrom(key_pb._pb)

    def begin(self):
        """Begins a batch.

        This method is called automatically when entering a with
        statement, however it can be called explicitly if you don't want
        to use a context manager.

        Overridden by :class:`google.cloud.datastore.transaction.Transaction`.

        :raises: :class:`ValueError` if the batch has already begun.
        """
        if self._status != self._INITIAL:
            raise ValueError("Batch already started previously.")
        self._status = self._IN_PROGRESS

    def _commit(self, retry, timeout):
        """Commits the batch.

        This is called by :meth:`commit`.
        """
        if self._id is None:
            mode = _datastore_pb2.CommitRequest.Mode.NON_TRANSACTIONAL
        else:
            mode = _datastore_pb2.CommitRequest.Mode.TRANSACTIONAL

        kwargs = {}

        if retry is not None:
            kwargs["retry"] = retry

        if timeout is not None:
            kwargs["timeout"] = timeout

        request = {
            "project_id": self.project,
            "mode": mode,
            "transaction": self._id,
            "mutations": self._mutations,
        }

        helpers.set_database_id_to_request(request, self._client.database)

        commit_response_pb = self._client._datastore_api.commit(
            request=request,
            **kwargs,
        )

        _, updated_keys = _parse_commit_response(commit_response_pb)
        # If the back-end returns without error, we are guaranteed that
        # ``commit`` will return keys that match (length and
        # order) directly ``_partial_key_entities``.
        for new_key_pb, entity in zip(updated_keys, self._partial_key_entities):
            new_id = new_key_pb.path[-1].id
            entity.key = entity.key.completed_key(new_id)

    def commit(self, retry=None, timeout=None):
        """Commits the batch.

        This is called automatically upon exiting a with statement,
        however it can be called explicitly if you don't want to use a
        context manager.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry:
            A retry object used to retry requests. If ``None`` is specified,
            requests will be retried using a default configuration.

        :type timeout: float
        :param timeout:
            Time, in seconds, to wait for the request to complete.
            Note that if ``retry`` is specified, the timeout applies
            to each individual attempt.

        :raises: :class:`~exceptions.ValueError` if the batch is not
                 in progress.
        """
        if self._status != self._IN_PROGRESS:
            raise ValueError("Batch must be in progress to commit()")

        try:
            self._commit(retry=retry, timeout=timeout)
        finally:
            self._status = self._FINISHED

    def rollback(self):
        """Rolls back the current batch.

        Marks the batch as aborted (can't be used again).

        Overridden by :class:`google.cloud.datastore.transaction.Transaction`.

        :raises: :class:`~exceptions.ValueError` if the batch is not
                 in progress.
        """
        if self._status != self._IN_PROGRESS:
            raise ValueError("Batch must be in progress to rollback()")

        self._status = self._ABORTED

    def __enter__(self):
        self.begin()
        # NOTE: We make sure begin() succeeds before pushing onto the stack.
        self._client._push_batch(self)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            # commit or rollback if not in terminal state
            if self._status not in (self._ABORTED, self._FINISHED):
                if exc_type is None:
                    self.commit()
                else:
                    self.rollback()
        finally:
            self._client._pop_batch()


def _assign_entity_to_pb(entity_pb, entity):
    """Copy ``entity`` into ``entity_pb``.

    Helper method for ``Batch.put``.

    :type entity_pb: :class:`.entity_pb2.Entity`
    :param entity_pb: The entity owned by a mutation.

    :type entity: :class:`google.cloud.datastore.entity.Entity`
    :param entity: The entity being updated within the batch / transaction.
    """
    bare_entity_pb = helpers.entity_to_protobuf(entity)
    bare_entity_pb._pb.key.CopyFrom(bare_entity_pb._pb.key)
    entity_pb._pb.CopyFrom(bare_entity_pb._pb)


def _parse_commit_response(commit_response):
    """Extract response data from a commit response.

    :type commit_response_pb: :class:`.datastore_pb2.CommitResponse`
    :param commit_response_pb: The protobuf response from a commit request.

    :rtype: tuple
    :returns: The pair of the number of index updates and a list of
              :class:`.entity_pb2.Key` for each incomplete key
              that was completed in the commit.
    """
    commit_response_pb = commit_response._pb
    mut_results = commit_response_pb.mutation_results
    index_updates = commit_response_pb.index_updates
    completed_keys = [
        mut_result.key for mut_result in mut_results if mut_result.HasField("key")
    ]  # Message field (Key)
    return index_updates, completed_keys
