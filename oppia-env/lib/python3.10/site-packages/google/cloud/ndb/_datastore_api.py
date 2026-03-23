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

"""Functions that interact with Datastore backend."""

import grpc
import itertools
import logging

from google.api_core import exceptions as core_exceptions
from google.api_core import gapic_v1
from google.cloud.datastore import helpers
from google.cloud.datastore_v1.types import datastore as datastore_pb2
from google.cloud.datastore_v1.types import entity as entity_pb2

from google.cloud.ndb import context as context_module
from google.cloud.ndb import _batch
from google.cloud.ndb import _cache
from google.cloud.ndb import _eventloop
from google.cloud.ndb import _options
from google.cloud.ndb import _remote
from google.cloud.ndb import _retry
from google.cloud.ndb import tasklets
from google.cloud.ndb import utils

EVENTUAL = datastore_pb2.ReadOptions.ReadConsistency.EVENTUAL
EVENTUAL_CONSISTENCY = EVENTUAL  # Legacy NDB
STRONG = datastore_pb2.ReadOptions.ReadConsistency.STRONG

_DEFAULT_TIMEOUT = None
_NOT_FOUND = object()

log = logging.getLogger(__name__)


def stub():
    """Get the stub for the `Google Datastore` API.

    Gets the stub from the current context.

    Returns:
        :class:`~google.cloud.datastore_v1.proto.datastore_pb2_grpc.DatastoreStub`:
            The stub instance.
    """
    context = context_module.get_context()
    return context.client.stub


def make_call(rpc_name, request, retries=None, timeout=None, metadata=()):
    """Make a call to the Datastore API.

    Args:
        rpc_name (str): Name of the remote procedure to call on Datastore.
        request (Any): An appropriate request object for the call, eg,
            `entity_pb2.LookupRequest` for calling ``Lookup``.
        retries (int): Number of times to potentially retry the call. If
            :data:`None` is passed, will use :data:`_retry._DEFAULT_RETRIES`.
            If :data:`0` is passed, the call is attempted only once.
        timeout (float): Timeout, in seconds, to pass to gRPC call. If
            :data:`None` is passed, will use :data:`_DEFAULT_TIMEOUT`.
        metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

    Returns:
        tasklets.Future: Future for the eventual response for the API call.
    """
    api = stub()
    method = getattr(api, rpc_name)

    if retries is None:
        retries = _retry._DEFAULT_RETRIES

    if timeout is None:
        timeout = _DEFAULT_TIMEOUT

    @tasklets.tasklet
    def rpc_call():
        context = context_module.get_toplevel_context()

        call = method.future(request, timeout=timeout, metadata=metadata)
        rpc = _remote.RemoteCall(call, rpc_name)
        utils.logging_debug(log, rpc)
        utils.logging_debug(log, "timeout={}", timeout)
        utils.logging_debug(log, request)

        try:
            result = yield rpc
        except Exception as error:
            if isinstance(error, grpc.Call):
                error = core_exceptions.from_grpc_error(error)
            raise error
        finally:
            context.rpc_time += rpc.elapsed_time

        raise tasklets.Return(result)

    if retries:
        rpc_call = _retry.retry_async(rpc_call, retries=retries)

    return rpc_call()


@tasklets.tasklet
def lookup(key, options):
    """Look up a Datastore entity.

    Gets an entity from Datastore, asynchronously. Checks the global cache,
    first, if appropriate. Uses batching.

    Args:
        key (~datastore.Key): The key for the entity to retrieve.
        options (_options.ReadOptions): The options for the request. For
            example, ``{"read_consistency": EVENTUAL}``.

    Returns:
        :class:`~tasklets.Future`: If not an exception, future's result will be
            either an entity protocol buffer or _NOT_FOUND.
    """
    context = context_module.get_context()
    use_datastore = context._use_datastore(key, options)
    if use_datastore and options.transaction:
        use_global_cache = False
    else:
        use_global_cache = context._use_global_cache(key, options)

    if not (use_global_cache or use_datastore):
        raise TypeError("use_global_cache and use_datastore can't both be False")

    entity_pb = _NOT_FOUND
    key_locked = False

    if use_global_cache:
        cache_key = _cache.global_cache_key(key)
        result = yield _cache.global_get(cache_key)
        key_locked = _cache.is_locked_value(result)
        if not key_locked:
            if result:
                entity_pb = entity_pb2.Entity()
                entity_pb._pb.MergeFromString(result)

            elif use_datastore:
                lock = yield _cache.global_lock_for_read(cache_key, result)
                if lock:
                    yield _cache.global_watch(cache_key, lock)

                else:
                    # Another thread locked or wrote to this key after the call to
                    # _cache.global_get above. Behave as though the key was locked by
                    # another thread and don't attempt to write our value below
                    key_locked = True

    if entity_pb is _NOT_FOUND and use_datastore:
        batch = _batch.get_batch(_LookupBatch, options)
        entity_pb = yield batch.add(key)

        # Do not cache misses
        if use_global_cache and not key_locked:
            if entity_pb is not _NOT_FOUND:
                expires = context._global_cache_timeout(key, options)
                serialized = entity_pb._pb.SerializeToString()
                yield _cache.global_compare_and_swap(
                    cache_key, serialized, expires=expires
                )
            else:
                yield _cache.global_unwatch(cache_key)

    raise tasklets.Return(entity_pb)


class _LookupBatch(object):
    """Batch for Lookup requests.

    Attributes:
        options (Dict[str, Any]): See Args.
        todo (Dict[bytes, List[tasklets.Future]]: Mapping of serialized key
            protocol buffers to dependent futures.

    Args:
        options (_options.ReadOptions): The options for the request. Calls with
            different options will be placed in different batches.
    """

    def __init__(self, options):
        self.options = options
        self.todo = {}

    def full(self):

        """Indicates whether more work can be added to this batch.

        Returns:
            boolean: `True` if number of keys to be looked up has reached 1000,
                else `False`.
        """
        return len(self.todo) >= 1000

    def add(self, key):
        """Add a key to the batch to look up.

        Args:
            key (datastore.Key): The key to look up.

        Returns:
            tasklets.Future: A future for the eventual result.
        """
        todo_key = key.to_protobuf()._pb.SerializeToString()
        future = tasklets.Future(info="Lookup({})".format(key))
        self.todo.setdefault(todo_key, []).append(future)
        return future

    def idle_callback(self):
        """Perform a Datastore Lookup on all batched Lookup requests."""
        keys = []
        for todo_key in self.todo.keys():
            key_pb = entity_pb2.Key()
            key_pb._pb.ParseFromString(todo_key)
            keys.append(key_pb)

        read_options = get_read_options(self.options)
        rpc = _datastore_lookup(
            keys,
            read_options,
            retries=self.options.retries,
            timeout=self.options.timeout,
        )
        rpc.add_done_callback(self.lookup_callback)

    def lookup_callback(self, rpc):
        """Process the results of a call to Datastore Lookup.

        Each key in the batch will be in one of `found`, `missing`, or
        `deferred`. `found` keys have their futures' results set with the
        protocol buffers for their entities. `missing` keys have their futures'
        results with `_NOT_FOUND`, a sentinel value. `deferrred` keys are
        loaded into a new batch so they can be tried again.

        Args:
            rpc (tasklets.Future): If not an exception, the result will be
                an instance of
                :class:`google.cloud.datastore_v1.datastore_pb.LookupResponse`
        """
        # If RPC has resulted in an exception, propagate that exception to all
        # waiting futures.
        exception = rpc.exception()
        if exception is not None:
            for future in itertools.chain(*self.todo.values()):
                future.set_exception(exception)
            return

        # Process results, which are divided into found, missing, and deferred
        results = rpc.result()
        utils.logging_debug(log, results)

        # For all deferred keys, batch them up again with their original
        # futures
        if results.deferred:
            next_batch = _batch.get_batch(type(self), self.options)
            for key in results.deferred:
                todo_key = key._pb.SerializeToString()
                next_batch.todo.setdefault(todo_key, []).extend(self.todo[todo_key])

        # For all missing keys, set result to _NOT_FOUND and let callers decide
        # how to handle
        for result in results.missing:
            todo_key = result.entity.key._pb.SerializeToString()
            for future in self.todo[todo_key]:
                future.set_result(_NOT_FOUND)

        # For all found entities, set the result on their corresponding futures
        for result in results.found:
            entity = result.entity
            todo_key = entity.key._pb.SerializeToString()
            for future in self.todo[todo_key]:
                future.set_result(entity)


def _datastore_lookup(keys, read_options, retries=None, timeout=None, metadata=()):
    """Issue a Lookup call to Datastore using gRPC.

    Args:
        keys (Iterable[entity_pb2.Key]): The entity keys to
            look up.
        read_options (Union[datastore_pb2.ReadOptions, NoneType]): Options for
            the request.
        retries (int): Number of times to potentially retry the call. If
            :data:`None` is passed, will use :data:`_retry._DEFAULT_RETRIES`.
            If :data:`0` is passed, the call is attempted only once.
        timeout (float): Timeout, in seconds, to pass to gRPC call. If
            :data:`None` is passed, will use :data:`_DEFAULT_TIMEOUT`.
        metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

    Returns:
        tasklets.Future: Future object for eventual result of lookup.
    """
    client = context_module.get_context().client
    request = datastore_pb2.LookupRequest(
        project_id=client.project,
        database_id=client.database,
        keys=[key for key in keys],
        read_options=read_options,
    )
    metadata = _add_routing_info(metadata, request)

    return make_call(
        "lookup", request, retries=retries, timeout=timeout, metadata=metadata
    )


def get_read_options(options, default_read_consistency=None):
    """Get the read options for a request.

    Args:
        options (_options.ReadOptions): The options for the request. May
            contain options unrelated to creating a
            :class:`datastore_pb2.ReadOptions` instance, which will be ignored.
        default_read_consistency: Use this value for ``read_consistency`` if
            neither ``transaction`` nor ``read_consistency`` are otherwise
            specified.

    Returns:
        datastore_pb2.ReadOptions: The options instance for passing to the
            Datastore gRPC API.

    Raises:
        ValueError: When ``read_consistency`` is set to ``EVENTUAL`` and there
            is a transaction.
    """
    transaction = options.transaction
    read_consistency = options.read_consistency

    if transaction is None:
        if read_consistency is None:
            read_consistency = default_read_consistency

    elif read_consistency is EVENTUAL:
        raise ValueError("read_consistency must not be EVENTUAL when in transaction")

    return datastore_pb2.ReadOptions(
        read_consistency=read_consistency, transaction=transaction
    )


@tasklets.tasklet
def put(entity, options):
    """Store an entity in datastore.

    The entity can be a new entity to be saved for the first time or an
    existing entity that has been updated.

    Args:
        entity_pb (datastore.Entity): The entity to be stored.
        options (_options.Options): Options for this request.

    Returns:
        tasklets.Future: Result will be completed datastore key
            (datastore.Key) for the entity.
    """
    context = context_module.get_context()
    use_global_cache = context._use_global_cache(entity.key, options)
    use_datastore = context._use_datastore(entity.key, options)
    if not (use_global_cache or use_datastore):
        raise TypeError("use_global_cache and use_datastore can't both be False")

    if not use_datastore and entity.key.is_partial:
        raise TypeError("Can't store partial keys when use_datastore is False")

    lock = None
    entity_pb = helpers.entity_to_protobuf(entity)
    cache_key = _cache.global_cache_key(entity.key)
    if use_global_cache and not entity.key.is_partial:
        if use_datastore:
            lock = yield _cache.global_lock_for_write(cache_key)
        else:
            expires = context._global_cache_timeout(entity.key, options)
            cache_value = entity_pb._pb.SerializeToString()
            yield _cache.global_set(cache_key, cache_value, expires=expires)

    if use_datastore:
        transaction = context.transaction
        if transaction:
            batch = _get_commit_batch(transaction, options)
        else:
            batch = _batch.get_batch(_NonTransactionalCommitBatch, options)

        key_pb = yield batch.put(entity_pb)
        if key_pb:
            key = helpers.key_from_protobuf(key_pb)
        else:
            key = None

        if lock:
            if transaction:

                def callback():
                    _cache.global_unlock_for_write(cache_key, lock).result()

                context.call_on_transaction_complete(callback)

            else:
                yield _cache.global_unlock_for_write(cache_key, lock)

        raise tasklets.Return(key)


@tasklets.tasklet
def delete(key, options):
    """Delete an entity from Datastore.

    Deleting an entity that doesn't exist does not result in an error. The
    result is the same regardless.

    Args:
        key (datastore.Key): The key for the entity to be deleted.
        options (_options.Options): Options for this request.

    Returns:
        tasklets.Future: Will be finished when entity is deleted. Result will
            always be :data:`None`.
    """
    context = context_module.get_context()
    use_global_cache = context._use_global_cache(key, options)
    use_datastore = context._use_datastore(key, options)
    transaction = context.transaction

    if use_global_cache:
        cache_key = _cache.global_cache_key(key)

    if use_datastore:
        if use_global_cache:
            lock = yield _cache.global_lock_for_write(cache_key)

        if transaction:
            batch = _get_commit_batch(transaction, options)
        else:
            batch = _batch.get_batch(_NonTransactionalCommitBatch, options)

        yield batch.delete(key)

    if use_global_cache:
        if transaction:

            def callback():
                _cache.global_unlock_for_write(cache_key, lock).result()

            context.call_on_transaction_complete(callback)

        elif use_datastore:
            yield _cache.global_unlock_for_write(cache_key, lock)

        else:
            yield _cache.global_delete(cache_key)


class _NonTransactionalCommitBatch(object):
    """Batch for tracking a set of mutations for a non-transactional commit.

    Attributes:
        options (_options.Options): See Args.
        mutations (List[datastore_pb2.Mutation]): Sequence of mutation protocol
            buffers accumumlated for this batch.
        futures (List[tasklets.Future]): Sequence of futures for return results
            of the commit. The i-th element of ``futures`` corresponds to the
            i-th element of ``mutations``.

    Args:
        options (_options.Options): The options for the request. Calls with
            different options will be placed in different batches.
    """

    def __init__(self, options):
        self.options = options
        self.mutations = []
        self.futures = []

    def full(self):
        """Indicates whether more work can be added to this batch.

        Returns:
            boolean: `True` if number of mutations has reached 500, else
                `False`.
        """
        return len(self.mutations) >= 500

    def put(self, entity_pb):
        """Add an entity to batch to be stored.

        Args:
            entity_pb (datastore_v1.types.Entity): The entity to be stored.

        Returns:
            tasklets.Future: Result will be completed datastore key
                (entity_pb2.Key) for the entity.
        """
        future = tasklets.Future(info="put({})".format(entity_pb))
        mutation = datastore_pb2.Mutation(upsert=entity_pb)
        self.mutations.append(mutation)
        self.futures.append(future)
        return future

    def delete(self, key):
        """Add a key to batch to be deleted.

        Args:
            entity_pb (datastore.Key): The entity's key to be deleted.

        Returns:
            tasklets.Future: Result will be :data:`None`, always.
        """
        key_pb = key.to_protobuf()
        future = tasklets.Future(info="delete({})".format(key_pb))
        mutation = datastore_pb2.Mutation(delete=key_pb)
        self.mutations.append(mutation)
        self.futures.append(future)
        return future

    def idle_callback(self):
        """Send the commit for this batch to Datastore."""
        futures = self.futures

        def commit_callback(rpc):
            _process_commit(rpc, futures)

        rpc = _datastore_commit(
            self.mutations,
            None,
            retries=self.options.retries,
            timeout=self.options.timeout,
        )
        rpc.add_done_callback(commit_callback)


def prepare_to_commit(transaction):
    """Signal that we're ready to commit a transaction.

    Currently just used to signal to the commit batch that we're not going to
    need to call `AllocateIds`, because we're ready to commit now.

    Args:
        transaction (bytes): The transaction id about to be committed.
    """
    batch = _get_commit_batch(transaction, _options.Options())
    batch.preparing_to_commit = True


def commit(transaction, retries=None, timeout=None):
    """Commit a transaction.

    Args:
        transaction (bytes): The transaction id to commit.
        retries (int): Number of times to potentially retry the call. If
            :data:`None` is passed, will use :data:`_retry._DEFAULT_RETRIES`.
            If :data:`0` is passed, the call is attempted only once.
        timeout (float): Timeout, in seconds, to pass to gRPC call. If
            :data:`None` is passed, will use :data:`_DEFAULT_TIMEOUT`.

    Returns:
        tasklets.Future: Result will be none, will finish when the transaction
            is committed.
    """
    batch = _get_commit_batch(transaction, _options.Options())
    return batch.commit(retries=retries, timeout=timeout)


def _get_commit_batch(transaction, options):
    """Get the commit batch for the current context and transaction.

    Args:
        transaction (bytes): The transaction id. Different transactions will
            have different batchs.
        options (_options.Options): Options for the batch. Not supported at
            this time.

    Returns:
        _TransactionalCommitBatch: The batch.
    """
    # Support for different options will be tricky if we're in a transaction,
    # since we can only do one commit, so any options that affect that gRPC
    # call would all need to be identical. For now, no options are supported
    # here.
    for key, value in options.items():
        if key != "transaction" and value:
            raise NotImplementedError("Passed bad option: {!r}".format(key))

    # Since we're in a transaction, we need to hang on to the batch until
    # commit time, so we need to store it separately from other batches.
    context = context_module.get_context()
    batch = context.commit_batches.get(transaction)
    if batch is None:
        batch = _TransactionalCommitBatch(transaction, options)
        context.commit_batches[transaction] = batch

    return batch


class _TransactionalCommitBatch(_NonTransactionalCommitBatch):
    """Batch for tracking a set of mutations to be committed for a transaction.

    Attributes:
        options (_options.Options): See Args.
        mutations (List[datastore_pb2.Mutation]): Sequence of mutation protocol
            buffers accumumlated for this batch.
        futures (List[tasklets.Future]): Sequence of futures for return results
            of the commit. The i-th element of ``futures`` corresponds to the
            i-th element of ``mutations``.
        transaction (bytes): The transaction id of the transaction for this
            commit.
        allocating_ids (List[tasklets.Future]): Futures for any calls to
            AllocateIds that are fired off before commit.
        incomplete_mutations (List[datastore_pb2.Mutation]): List of mutations
            with keys which will need ids allocated. Incomplete keys will be
            allocated by an idle callback. Any keys still incomplete at commit
            time will be allocated by the call to Commit. Only used when in a
            transaction.
        incomplete_futures (List[tasklets.Future]): List of futures
            corresponding to keys in ``incomplete_mutations``. Futures will
            receive results of id allocation.

    Args:
        transaction (bytes): The transaction id of the transaction for this
            commit.
        options (_options.Options): The options for the request. Calls with
            different options will be placed in different batches.
    """

    def __init__(self, transaction, options):
        super(_TransactionalCommitBatch, self).__init__(options)
        self.transaction = transaction
        self.allocating_ids = []
        self.incomplete_mutations = []
        self.incomplete_futures = []
        self.preparing_to_commit = False

    def put(self, entity_pb):
        """Add an entity to batch to be stored.

        Args:
            entity_pb (datastore_v1.types.Entity): The entity to be stored.

        Returns:
            tasklets.Future: Result will be completed datastore key
                (entity_pb2.Key) for the entity.
        """
        future = tasklets.Future("put({})".format(entity_pb))
        self.futures.append(future)
        mutation = datastore_pb2.Mutation(upsert=entity_pb)
        self.mutations.append(mutation)

        # If we have an incomplete key, add the incomplete key to a batch for a
        # call to AllocateIds, since the call to actually store the entity
        # won't happen until the end of the transaction.
        if not _complete(entity_pb.key):
            # If this is the first key in the batch, we also need to
            # schedule our idle handler to get called
            if not self.incomplete_mutations:
                _eventloop.add_idle(self.idle_callback)

            self.incomplete_mutations.append(mutation)
            self.incomplete_futures.append(future)

        # Can't wait for result, since batch won't be sent until transaction
        # has ended. Complete keys get passed back None.
        else:
            future.set_result(None)

        return future

    def delete(self, key):
        """Add a key to batch to be deleted.

        Args:
            entity_pb (datastore.Key): The entity's key to be deleted.

        Returns:
            tasklets.Future: Result will be :data:`None`, always.
        """
        # Can't wait for result, since batch won't be sent until transaction
        # has ended.
        future = super(_TransactionalCommitBatch, self).delete(key)
        future.set_result(None)
        return future

    def idle_callback(self):
        """Call AllocateIds on any incomplete keys in the batch."""
        # If there are no incomplete mutations, or if we're already preparing
        # to commit, there's no need to allocate ids.
        if self.preparing_to_commit or not self.incomplete_mutations:
            return

        # Signal to a future commit that there is an id allocation in
        # progress and it should wait.
        allocating_ids = tasklets.Future("AllocateIds")
        self.allocating_ids.append(allocating_ids)

        mutations = self.incomplete_mutations
        futures = self.incomplete_futures

        def callback(rpc):
            self.allocate_ids_callback(rpc, mutations, futures)

            # Signal that we're done allocating these ids
            allocating_ids.set_result(None)

        keys = [mutation.upsert.key for mutation in mutations]
        rpc = _datastore_allocate_ids(
            keys, retries=self.options.retries, timeout=self.options.timeout
        )
        rpc.add_done_callback(callback)

        self.incomplete_mutations = []
        self.incomplete_futures = []

    def allocate_ids_callback(self, rpc, mutations, futures):
        """Process the results of a call to AllocateIds."""
        # If RPC has resulted in an exception, propagate that exception to
        # all waiting futures.
        exception = rpc.exception()
        if exception is not None:
            for future in futures:
                future.set_exception(exception)
            return

        # Update mutations with complete keys
        response = rpc.result()
        for mutation, key, future in zip(mutations, response.keys, futures):
            mutation.upsert.key._pb.CopyFrom(key._pb)
            future.set_result(key)

    @tasklets.tasklet
    def commit(self, retries=None, timeout=None):
        """Commit transaction.

        Args:
            retries (int): Number of times to potentially retry the call. If
                :data:`None` is passed, will use
                :data:`_retry._DEFAULT_RETRIES`.  If :data:`0` is passed, the
                call is attempted only once.
            timeout (float): Timeout, in seconds, to pass to gRPC call. If
                :data:`None` is passed, will use :data:`_DEFAULT_TIMEOUT`.
        """
        # It's tempting to do something like:
        #
        #     if not self.mutations:
        #         return
        #
        # However, even if there are no mutations to save, we still need to
        # send a COMMIT to the Datastore. It would appear that failing to do so
        # will make subsequent writes hang indefinitely as Datastore apparently
        # achieves consistency during a transaction by preventing writes.

        # Wait for any calls to AllocateIds that have been fired off so we
        # don't allocate ids again in the commit.
        for future in self.allocating_ids:
            if not future.done():
                yield future

        future = tasklets.Future("Commit")
        futures = self.futures

        def commit_callback(rpc):
            _process_commit(rpc, futures)

            exception = rpc.exception()
            if exception:
                future.set_exception(exception)
            else:
                future.set_result(None)

        rpc = _datastore_commit(
            self.mutations,
            transaction=self.transaction,
            retries=retries,
            timeout=timeout,
        )
        rpc.add_done_callback(commit_callback)

        yield future


def _process_commit(rpc, futures):
    """Process the results of a commit request.

    For each mutation, set the result to the key handed back from
        Datastore. If a key wasn't allocated for the mutation, this will be
        :data:`None`.

    Args:
        rpc (tasklets.Tasklet): If not an exception, the result will be an
            instance of
            :class:`google.cloud.datastore_v1.datastore_pb2.CommitResponse`
        futures (List[tasklets.Future]): List of futures waiting on results.
    """
    # If RPC has resulted in an exception, propagate that exception to all
    # waiting futures.
    exception = rpc.exception()
    if exception is not None:
        for future in futures:
            if not future.done():
                future.set_exception(exception)
        return

    # "The i-th mutation result corresponds to the i-th mutation in the
    # request."
    #
    # https://github.com/googleapis/googleapis/blob/master/google/datastore/v1/datastore.proto#L241
    response = rpc.result()
    utils.logging_debug(log, response)

    results_futures = zip(response.mutation_results, futures)
    for mutation_result, future in results_futures:
        if future.done():
            continue

        # Datastore only sends a key if one is allocated for the
        # mutation. Confusingly, though, if a key isn't allocated, instead
        # of getting None, we get a key with an empty path.
        if mutation_result.key.path:
            key = mutation_result.key
        else:
            key = None
        future.set_result(key)


def _complete(key_pb):
    """Determines whether a key protocol buffer is complete.
    A new key may be left incomplete so that the id can be allocated by the
    database. A key is considered incomplete if the last element of the path
    has neither a ``name`` or an ``id``.

    Args:
        key_pb (entity_pb2.Key): The key to check.

    Returns:
        boolean: :data:`True` if key is incomplete, otherwise :data:`False`.
    """
    if key_pb.path:
        element = key_pb.path[-1]
        if element.id or element.name:
            return True

    return False


def _datastore_commit(mutations, transaction, retries=None, timeout=None, metadata=()):
    """Call Commit on Datastore.

    Args:
        mutations (List[datastore_pb2.Mutation]): The changes to persist to
            Datastore.
        transaction (Union[bytes, NoneType]): The identifier for the
            transaction for this commit, or :data:`None` if no transaction is
            being used.
        retries (int): Number of times to potentially retry the call. If
            :data:`None` is passed, will use :data:`_retry._DEFAULT_RETRIES`.
            If :data:`0` is passed, the call is attempted only once.
        timeout (float): Timeout, in seconds, to pass to gRPC call. If
            :data:`None` is passed, will use :data:`_DEFAULT_TIMEOUT`.
        metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

    Returns:
        tasklets.Tasklet: A future for
            :class:`google.cloud.datastore_v1.datastore_pb2.CommitResponse`
    """
    if transaction is None:
        mode = datastore_pb2.CommitRequest.Mode.NON_TRANSACTIONAL
    else:
        mode = datastore_pb2.CommitRequest.Mode.TRANSACTIONAL

    client = context_module.get_context().client
    request = datastore_pb2.CommitRequest(
        project_id=client.project,
        database_id=client.database,
        mode=mode,
        mutations=mutations,
        transaction=transaction,
    )
    metadata = _add_routing_info(metadata, request)

    return make_call(
        "commit", request, retries=retries, timeout=timeout, metadata=metadata
    )


def allocate(keys, options):
    """Allocate ids for incomplete keys.

    Args:
        key (key.Key): The incomplete key.
        options (_options.Options): The options for the request.

    Returns:
        tasklets.Future: A future for the key completed with the allocated id.
    """
    futures = []
    while keys:
        batch = _batch.get_batch(_AllocateIdsBatch, options)
        room_left = batch.room_left()
        batch_keys = keys[:room_left]
        futures.extend(batch.add(batch_keys))
        keys = keys[room_left:]

    return tasklets._MultiFuture(futures)


class _AllocateIdsBatch(object):
    """Batch for AllocateIds requests.

    Not related to batch used by transactions to allocate ids for upserts
    before committing, although they do both eventually call
    ``_datastore_allocate_ids``.

    Args:
        options (_options.Options): The options for the request. Calls with
            different options will be placed in different batches.
    """

    def __init__(self, options):
        self.options = options
        self.keys = []
        self.futures = []

    def full(self):
        """Indicates whether more work can be added to this batch.

        Returns:
            boolean: `True` if number of keys has reached 500, else `False`.
        """
        return len(self.keys) >= 500

    def room_left(self):
        """Get how many more keys can be added to this batch.

        Returns:
            int: 500 - number of keys already in batch
        """
        return 500 - len(self.keys)

    def add(self, keys):
        """Add incomplete keys to batch to allocate.

        Args:
            keys (list(datastore.key)): Allocate ids for these keys.

        Returns:
            tasklets.Future: A future for the eventual keys completed with
                allocated ids.
        """
        futures = []
        for key in keys:
            future = tasklets.Future(info="AllocateIds({})".format(key))
            futures.append(future)
            self.keys.append(key)

        self.futures.extend(futures)
        return futures

    def idle_callback(self):
        """Perform a Datastore AllocateIds request on all batched keys."""
        key_pbs = [key.to_protobuf() for key in self.keys]
        rpc = _datastore_allocate_ids(
            key_pbs, retries=self.options.retries, timeout=self.options.timeout
        )
        rpc.add_done_callback(self.allocate_ids_callback)

    def allocate_ids_callback(self, rpc):
        """Process the results of a call to AllocateIds."""
        # If RPC has resulted in an exception, propagate that exception to all
        # waiting futures.
        exception = rpc.exception()
        if exception is not None:
            for future in self.futures:
                future.set_exception(exception)
            return

        for key, future in zip(rpc.result().keys, self.futures):
            future.set_result(key)


def _datastore_allocate_ids(keys, retries=None, timeout=None, metadata=()):
    """Calls ``AllocateIds`` on Datastore.

    Args:
        keys (List[google.cloud.datastore_v1.entity_pb2.Key]): List of
            incomplete keys to allocate.
        retries (int): Number of times to potentially retry the call. If
            :data:`None` is passed, will use :data:`_retry._DEFAULT_RETRIES`.
            If :data:`0` is passed, the call is attempted only once.
        timeout (float): Timeout, in seconds, to pass to gRPC call. If
            :data:`None` is passed, will use :data:`_DEFAULT_TIMEOUT`.
        metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

    Returns:
        tasklets.Future: A future for
            :class:`google.cloud.datastore_v1.datastore_pb2.AllocateIdsResponse`
    """
    client = context_module.get_context().client
    request = datastore_pb2.AllocateIdsRequest(
        project_id=client.project, database_id=client.database, keys=keys
    )
    metadata = _add_routing_info(metadata, request)

    return make_call(
        "allocate_ids", request, retries=retries, timeout=timeout, metadata=metadata
    )


@tasklets.tasklet
def begin_transaction(read_only, retries=None, timeout=None):
    """Start a new transaction.

    Args:
        read_only (bool): Whether to start a read-only or read-write
            transaction.
        retries (int): Number of times to potentially retry the call. If
            :data:`None` is passed, will use :data:`_retry._DEFAULT_RETRIES`.
            If :data:`0` is passed, the call is attempted only once.
        timeout (float): Timeout, in seconds, to pass to gRPC call. If
            :data:`None` is passed, will use :data:`_DEFAULT_TIMEOUT`.

    Returns:
        tasklets.Future: Result will be Transaction Id (bytes) of new
            transaction.
    """
    response = yield _datastore_begin_transaction(
        read_only, retries=retries, timeout=timeout
    )
    raise tasklets.Return(response.transaction)


def _datastore_begin_transaction(read_only, retries=None, timeout=None, metadata=()):
    """Calls ``BeginTransaction`` on Datastore.

    Args:
        read_only (bool): Whether to start a read-only or read-write
            transaction.
        retries (int): Number of times to potentially retry the call. If
            :data:`None` is passed, will use :data:`_retry._DEFAULT_RETRIES`.
            If :data:`0` is passed, the call is attempted only once.
        timeout (float): Timeout, in seconds, to pass to gRPC call. If
            :data:`None` is passed, will use :data:`_DEFAULT_TIMEOUT`.
        metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

    Returns:
        tasklets.Tasklet: A future for
            :class:`google.cloud.datastore_v1.datastore_pb2.BeginTransactionResponse`
    """
    client = context_module.get_context().client
    if read_only:
        options = datastore_pb2.TransactionOptions(
            read_only=datastore_pb2.TransactionOptions.ReadOnly()
        )
    else:
        options = datastore_pb2.TransactionOptions(
            read_write=datastore_pb2.TransactionOptions.ReadWrite()
        )

    request = datastore_pb2.BeginTransactionRequest(
        project_id=client.project,
        database_id=client.database,
        transaction_options=options,
    )
    metadata = _add_routing_info(metadata, request)

    return make_call(
        "begin_transaction",
        request,
        retries=retries,
        timeout=timeout,
        metadata=metadata,
    )


@tasklets.tasklet
def rollback(transaction, retries=None, timeout=None):
    """Rollback a transaction.

    Args:
        transaction (bytes): Transaction id.
        retries (int): Number of times to potentially retry the call. If
            :data:`None` is passed, will use :data:`_retry._DEFAULT_RETRIES`.
            If :data:`0` is passed, the call is attempted only once.
        timeout (float): Timeout, in seconds, to pass to gRPC call. If
            :data:`None` is passed, will use :data:`_DEFAULT_TIMEOUT`.

    Returns:
        tasklets.Future: Future completes when rollback is finished.
    """
    yield _datastore_rollback(transaction, retries=retries, timeout=timeout)


def _datastore_rollback(transaction, retries=None, timeout=None, metadata=()):
    """Calls Rollback in Datastore.

    Args:
        transaction (bytes): Transaction id.
        retries (int): Number of times to potentially retry the call. If
            :data:`None` is passed, will use :data:`_retry._DEFAULT_RETRIES`.
            If :data:`0` is passed, the call is attempted only once.
        timeout (float): Timeout, in seconds, to pass to gRPC call. If
            :data:`None` is passed, will use :data:`_DEFAULT_TIMEOUT`.
        metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

    Returns:
        tasklets.Tasklet: Future for
            :class:`google.cloud.datastore_v1.datastore_pb2.RollbackResponse`
    """
    client = context_module.get_context().client
    request = datastore_pb2.RollbackRequest(
        project_id=client.project,
        database_id=client.database,
        transaction=transaction,
    )
    metadata = _add_routing_info(metadata, request)

    return make_call(
        "rollback", request, retries=retries, timeout=timeout, metadata=metadata
    )


def _add_routing_info(metadata, request):
    """Adds routing header info to the given metadata.

    Args:
        metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata. Not modified.
        request (Any): An appropriate request object for the call, eg,
            `entity_pb2.LookupRequest` for calling ``Lookup``.

    Returns:
        Sequence[Tuple[str, str]]: Sequence with routing info added,
            if it is included in the request.
    """
    header_params = {}

    if request.project_id:
        header_params["project_id"] = request.project_id

    if request.database_id:
        header_params["database_id"] = request.database_id

    if header_params:
        return tuple(metadata) + (
            gapic_v1.routing_header.to_grpc_metadata(header_params),
        )

    return tuple(metadata)
