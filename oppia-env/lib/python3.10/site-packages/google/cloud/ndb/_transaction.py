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

import functools
import logging

from google.cloud.ndb import exceptions
from google.cloud.ndb import _retry
from google.cloud.ndb import tasklets
from google.cloud.ndb import utils

log = logging.getLogger(__name__)


class _Propagation(object):
    """This class aims to emulate the same behaviour as was provided by the old
    Datastore RPC library.

    https://cloud.google.com/appengine/docs/standard/python/ndb/functions#context_options

    It provides limited support for transactions within transactions. It has a
    single public method func:`handle_propagation`.

    Args:
        propagation (int): The desired `propagation` option, corresponding
            to a class:`TransactionOptions` option.
        join (:obj:`bool`, optional): If the provided join argument must be
            changed to conform to the requested propagation option then a
            warning will be emitted. If it is not provided, it will be set
            according to the propagation option but no warning is emitted.
    """

    def __init__(self, propagation, join=None):
        # Avoid circular import in Python 2.7
        from google.cloud.ndb import context as context_module

        propagation_options = context_module.TransactionOptions._PROPAGATION
        if propagation is None or propagation in propagation_options:
            self.propagation = propagation
        else:
            raise ValueError(
                "Unexpected value for propagation. Got: {}. Expected one of: "
                "{}".format(propagation, propagation_options)
            )

        propagation_names = context_module.TransactionOptions._INT_TO_NAME
        self.propagation_name = propagation_names.get(self.propagation)

        self.join = join
        joinable_options = context_module.TransactionOptions._JOINABLE
        self.joinable = propagation in joinable_options

    def _handle_nested(self):
        """The NESTED propagation policy would commit all changes in the outer
        and inner transactions together when the outer policy commits. However,
        if an exception is thrown in the inner transaction all changes there
        would get thrown out but allow the outer transaction to optionally
        recover and continue. The NESTED policy is not supported. If you use
        this policy, your code will throw a BadRequestError exception.
        """
        raise exceptions.BadRequestError("Nested transactions are not supported.")

    def _handle_mandatory(self):
        """Always propagate an existing transaction; throw an exception if
        there is no existing transaction. If a function that uses this policy
        throws an exception, it's probably not safe to catch the exception and
        commit the outer transaction; the function may have left the outer
        transaction in a bad state.
        """
        if not in_transaction():
            raise exceptions.BadRequestError("Requires an existing transaction.")

    def _handle_allowed(self):
        """If there is an existing transaction, propagate it. If a function
        that uses this policy throws an exception, it's probably not safe to
        catch the exception and commit the outer transaction; the function may
        have left the outer transaction in a bad state.
        """
        # no special handling needed.
        pass

    def _handle_independent(self):
        """Always use a new transaction, "pausing" any existing transactions.
        A function that uses this policy should not return any entities read in
        the new transaction, as the entities are not transactionally consistent
        with the caller's transaction.
        """
        if in_transaction():
            # Avoid circular import in Python 2.7
            from google.cloud.ndb import context as context_module

            context = context_module.get_context()
            new_context = context.new(transaction=None)
            return new_context

    def _handle_join(self):
        change_to = self.joinable
        if self.join != change_to:
            if self.join is not None:
                logging.warning(
                    "Modifying join behaviour to maintain old NDB behaviour. "
                    "Setting join to {} for propagation value: {} ({})".format(
                        change_to, self.propagation, self.propagation_name
                    )
                )
            self.join = change_to

    def handle_propagation(self):
        """Ensure the conditions needed to maintain legacy NDB behaviour are
        met.

        Returns:
            Context: A new :class:`Context` instance that should be
                used to run the transaction in or :data:`None` if the
                transaction should run in the existing :class:`Context`.
            bool: :data:`True` if the new transaction is to be joined to an
                existing one otherwise :data:`False`.
        """
        context = None
        if self.propagation:
            # ensure we use the correct joining method.
            context = getattr(self, "_handle_{}".format(self.propagation_name))()
            self._handle_join()
        return context, self.join


def in_transaction():
    """Determine if there is a currently active transaction.

    Returns:
        bool: :data:`True` if there is a transaction for the current context,
            otherwise :data:`False`.
    """
    # Avoid circular import in Python 2.7
    from google.cloud.ndb import context as context_module

    return context_module.get_context().transaction is not None


def transaction(
    callback,
    retries=_retry._DEFAULT_RETRIES,
    read_only=False,
    join=False,
    xg=True,
    propagation=None,
):
    """Run a callback in a transaction.

    Args:
        callback (Callable): The function or tasklet to be called.
        retries (int): Number of times to potentially retry the callback in
            case of transient server errors.
        read_only (bool): Whether to run the transaction in read only mode.
        join (bool): In the event of an already running transaction, if `join`
            is `True`, `callback` will be run in the already running
            transaction, otherwise an exception will be raised. Transactions
            cannot be nested.
        xg (bool): Enable cross-group transactions. This argument is included
            for backwards compatibility reasons and is ignored. All Datastore
            transactions are cross-group, up to 25 entity groups, all the time.
        propagation (int): An element from :class:`ndb.TransactionOptions`.
            This parameter controls what happens if you try to start a new
            transaction within an existing transaction. If this argument is
            provided, the `join` argument will be ignored.
    """
    future = transaction_async(
        callback,
        retries=retries,
        read_only=read_only,
        join=join,
        xg=xg,
        propagation=propagation,
    )
    return future.result()


def transaction_async(
    callback,
    retries=_retry._DEFAULT_RETRIES,
    read_only=False,
    join=False,
    xg=True,
    propagation=None,
):
    new_context, join = _Propagation(propagation, join).handle_propagation()
    args = (callback, retries, read_only, join, xg, None)
    if new_context is None:
        transaction_return_value = transaction_async_(*args)
    else:
        with new_context.use() as context:
            transaction_return_value = transaction_async_(*args)
            context.flush()
    return transaction_return_value


def transaction_async_(
    callback,
    retries=_retry._DEFAULT_RETRIES,
    read_only=False,
    join=False,
    xg=True,
    propagation=None,
):
    """Run a callback in a transaction.

    This is the asynchronous version of :func:`transaction`.
    """
    # Avoid circular import in Python 2.7
    from google.cloud.ndb import context as context_module

    if propagation is not None:
        raise exceptions.NoLongerImplementedError()

    context = context_module.get_context()
    if context.transaction:
        if join:
            result = callback()
            if not isinstance(result, tasklets.Future):
                future = tasklets.Future()
                future.set_result(result)
                result = future
            return result
        else:
            raise NotImplementedError(
                "Transactions may not be nested. Pass 'join=True' in order to "
                "join an already running transaction."
            )

    tasklet = functools.partial(
        _transaction_async, context, callback, read_only=read_only
    )
    if retries:
        tasklet = _retry.retry_async(tasklet, retries=retries)

    return tasklet()


@tasklets.tasklet
def _transaction_async(context, callback, read_only=False):
    # Avoid circular import in Python 2.7
    from google.cloud.ndb import _datastore_api

    # Start the transaction
    utils.logging_debug(log, "Start transaction")
    transaction_id = yield _datastore_api.begin_transaction(read_only, retries=0)
    utils.logging_debug(log, "Transaction Id: {}", transaction_id)

    on_commit_callbacks = []
    transaction_complete_callbacks = []
    tx_context = context.new(
        transaction=transaction_id,
        on_commit_callbacks=on_commit_callbacks,
        transaction_complete_callbacks=transaction_complete_callbacks,
        batches=None,
        commit_batches=None,
        cache=None,
        # We could just pass `None` here and let the `Context` constructor
        # instantiate a new event loop, but our unit tests inject a subclass of
        # `EventLoop` that makes testing a little easier. This makes sure the
        # new event loop is of the same type as the current one, to propagate
        # the event loop class used for testing.
        eventloop=type(context.eventloop)(),
        retry=context.get_retry_state(),
    )

    # The outer loop is dependent on the inner loop
    def run_inner_loop(inner_context):
        with inner_context.use():
            if inner_context.eventloop.run1():
                return True  # schedule again

    context.eventloop.add_idle(run_inner_loop, tx_context)

    with tx_context.use():
        try:
            try:
                # Run the callback
                result = callback()
                if isinstance(result, tasklets.Future):
                    result = yield result

                # Make sure we've run everything we can run before calling commit
                _datastore_api.prepare_to_commit(transaction_id)
                tx_context.eventloop.run()

                # Commit the transaction
                yield _datastore_api.commit(transaction_id, retries=0)

            # Rollback if there is an error
            except Exception as e:  # noqa: E722
                tx_context.cache.clear()
                yield _datastore_api.rollback(transaction_id)
                raise e

            for callback in on_commit_callbacks:
                callback()

        finally:
            for callback in transaction_complete_callbacks:
                callback()

    raise tasklets.Return(result)


def transactional(
    retries=_retry._DEFAULT_RETRIES,
    read_only=False,
    join=True,
    xg=True,
    propagation=None,
):
    """A decorator to run a function automatically in a transaction.

    Usage example:

    @transactional(retries=1, read_only=False)
    def callback(args):
        ...

    Unlike func:`transaction`_, the ``join`` argument defaults to ``True``,
    making functions decorated with func:`transactional`_ composable, by
    default. IE, a function decorated with ``transactional`` can call another
    function decorated with ``transactional`` and the second function will be
    executed in the already running transaction.

    See google.cloud.ndb.transaction for available options.
    """

    def transactional_wrapper(wrapped):
        @functools.wraps(wrapped)
        def transactional_inner_wrapper(*args, **kwargs):
            def callback():
                return wrapped(*args, **kwargs)

            return transaction(
                callback,
                retries=retries,
                read_only=read_only,
                join=join,
                xg=xg,
                propagation=propagation,
            )

        return transactional_inner_wrapper

    return transactional_wrapper


def transactional_async(
    retries=_retry._DEFAULT_RETRIES,
    read_only=False,
    join=True,
    xg=True,
    propagation=None,
):
    """A decorator to run a function in an async transaction.

    Usage example:

    @transactional_async(retries=1, read_only=False)
    def callback(args):
        ...

    Unlike func:`transaction`_, the ``join`` argument defaults to ``True``,
    making functions decorated with func:`transactional`_ composable, by
    default. IE, a function decorated with ``transactional_async`` can call
    another function decorated with ``transactional_async`` and the second
    function will be executed in the already running transaction.

    See google.cloud.ndb.transaction above for available options.
    """

    def transactional_async_wrapper(wrapped):
        @functools.wraps(wrapped)
        def transactional_async_inner_wrapper(*args, **kwargs):
            def callback():
                return wrapped(*args, **kwargs)

            return transaction_async(
                callback,
                retries=retries,
                read_only=read_only,
                join=join,
                xg=xg,
                propagation=propagation,
            )

        return transactional_async_inner_wrapper

    return transactional_async_wrapper


def transactional_tasklet(
    retries=_retry._DEFAULT_RETRIES,
    read_only=False,
    join=True,
    xg=True,
    propagation=None,
):
    """A decorator that turns a function into a tasklet running in transaction.

    Wrapped function returns a Future.

    Unlike func:`transaction`_, the ``join`` argument defaults to ``True``,
    making functions decorated with func:`transactional`_ composable, by
    default. IE, a function decorated with ``transactional_tasklet`` can call
    another function decorated with ``transactional_tasklet`` and the second
    function will be executed in the already running transaction.

    See google.cloud.ndb.transaction above for available options.
    """

    def transactional_tasklet_wrapper(wrapped):
        @functools.wraps(wrapped)
        def transactional_tasklet_inner_wrapper(*args, **kwargs):
            def callback():
                tasklet = tasklets.tasklet(wrapped)
                return tasklet(*args, **kwargs)

            return transaction_async(
                callback,
                retries=retries,
                read_only=read_only,
                join=join,
                xg=xg,
                propagation=propagation,
            )

        return transactional_tasklet_inner_wrapper

    return transactional_tasklet_wrapper


def non_transactional(allow_existing=True):
    """A decorator that ensures a function is run outside a transaction.

    If there is an existing transaction (and allow_existing=True), the existing
    transaction is paused while the function is executed.

    Args:
        allow_existing: If false, an exception will be thrown when called from
            within a transaction. If true, a new non-transactional context will
            be created for running the function; the original transactional
            context will be saved and then restored after the function is
            executed. Defaults to True.
    """

    def non_transactional_wrapper(wrapped):
        @functools.wraps(wrapped)
        def non_transactional_inner_wrapper(*args, **kwargs):
            # Avoid circular import in Python 2.7
            from google.cloud.ndb import context as context_module

            context = context_module.get_context()
            if not context.in_transaction():
                return wrapped(*args, **kwargs)
            if not allow_existing:
                raise exceptions.BadRequestError(
                    "{} cannot be called within a transaction".format(wrapped.__name__)
                )
            new_context = context.new(transaction=None)
            with new_context.use():
                return wrapped(*args, **kwargs)

        return non_transactional_inner_wrapper

    return non_transactional_wrapper
