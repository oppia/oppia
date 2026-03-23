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

"""Create / interact with Google Cloud Datastore transactions."""
from google.cloud.datastore.batch import Batch
from google.cloud.datastore_v1.types import TransactionOptions
from google.protobuf import timestamp_pb2

from google.cloud.datastore.helpers import set_database_id_to_request


def _make_retry_timeout_kwargs(retry, timeout):
    """Helper: make optional retry / timeout kwargs dict."""
    kwargs = {}

    if retry is not None:
        kwargs["retry"] = retry

    if timeout is not None:
        kwargs["timeout"] = timeout

    return kwargs


class Transaction(Batch):
    """An abstraction representing datastore Transactions.

    Transactions can be used to build up a bulk mutation and ensure all
    or none succeed (transactionally).

    For example, the following snippet of code will put the two ``save``
    operations (either ``insert`` or ``upsert``) into the same
    mutation, and execute those within a transaction:

    .. testsetup:: txn

        import uuid

        from google.cloud import datastore

        unique = str(uuid.uuid4())[0:8]
        client = datastore.Client(namespace='ns{}'.format(unique))

    .. doctest:: txn

        >>> entity1 = datastore.Entity(client.key('EntityKind', 1234))
        >>> entity2 = datastore.Entity(client.key('EntityKind', 2345))
        >>> with client.transaction():
        ...     client.put_multi([entity1, entity2])

    Because it derives from :class:`~google.cloud.datastore.batch.Batch`,
    :class:`Transaction` also provides :meth:`put` and :meth:`delete` methods:

    .. doctest:: txn

       >>> with client.transaction() as xact:
       ...     xact.put(entity1)
       ...     xact.delete(entity2.key)

    By default, the transaction is rolled back if the transaction block
    exits with an error:

    .. doctest:: txn

        >>> def do_some_work():
        ...    return
        >>> class SomeException(Exception):
        ...    pass
        >>> with client.transaction():
        ...     do_some_work()
        ...     raise SomeException  # rolls back
        Traceback (most recent call last):
          ...
        SomeException

    If the transaction block exits without an exception, it will commit
    by default.

    .. warning::

        Inside a transaction, automatically assigned IDs for
        entities will not be available at save time!  That means, if you
        try:

        .. doctest:: txn

            >>> with client.transaction():
            ...     thing1 = datastore.Entity(key=client.key('Thing'))
            ...     client.put(thing1)

       ``thing1`` won't have a complete key until the transaction is
       committed.

       Once you exit the transaction (or call :meth:`commit`), the
       automatically generated ID will be assigned to the entity:

       .. doctest:: txn

          >>> with client.transaction():
          ...     thing2 = datastore.Entity(key=client.key('Thing'))
          ...     client.put(thing2)
          ...     print(thing2.key.is_partial)  # There is no ID on this key.
          ...
          True
          >>> print(thing2.key.is_partial)  # There *is* an ID.
          False

    If you don't want to use the context manager you can initialize a
    transaction manually:

    .. doctest:: txn

       >>> transaction = client.transaction()
       >>> transaction.begin()
       >>>
       >>> thing3 = datastore.Entity(key=client.key('Thing'))
       >>> transaction.put(thing3)
       >>>
       >>> transaction.commit()

    .. testcleanup:: txn

        with client.batch() as batch:
            batch.delete(client.key('EntityKind', 1234))
            batch.delete(client.key('EntityKind', 2345))
            batch.delete(thing1.key)
            batch.delete(thing2.key)
            batch.delete(thing3.key)

    :type client: :class:`google.cloud.datastore.client.Client`
    :param client: the client used to connect to datastore.

    :type read_only: bool
    :param read_only: indicates the transaction is read only.

    :type read_time: datetime
    :param read_time: (Optional) Time at which the transaction reads entities.
                      Only allowed when ``read_only=True``. This feature is in private preview.

    :type begin_later: bool
    :param begin_later: (Optional) If True, the transaction will be started
                        lazily (i.e. when the first RPC is made). If False,
                        the transaction will be started as soon as the context manager
                        is entered. `self.begin()` can also be called manually to begin
                        the transaction at any time. Default is False.

    :raises: :class:`ValueError` if read_time is specified when
             ``read_only=False``.
    """

    _status = None

    def __init__(self, client, read_only=False, read_time=None, begin_later=False):
        super(Transaction, self).__init__(client)
        self._id = None
        self._begin_later = begin_later

        if read_only:
            if read_time is not None:
                read_time_pb = timestamp_pb2.Timestamp()
                read_time_pb.FromDatetime(read_time)
                options = TransactionOptions(
                    read_only=TransactionOptions.ReadOnly(read_time=read_time_pb)
                )
            else:
                options = TransactionOptions(read_only=TransactionOptions.ReadOnly())
        else:
            if read_time is not None:
                raise ValueError("read_time is only allowed in read only transaction.")
            else:
                options = TransactionOptions()

        self._options = options

    @property
    def id(self):
        """Getter for the transaction ID.

        :rtype: bytes or None
        :returns: The ID of the current transaction, or None if not started.
        """
        return self._id

    def current(self):
        """Return the topmost transaction.

        .. note::

            If the topmost element on the stack is not a transaction,
            returns None.

        :rtype: :class:`google.cloud.datastore.transaction.Transaction` or None
        :returns: The current transaction (if any are active).
        """
        top = super(Transaction, self).current()
        if isinstance(top, Transaction):
            return top

    def begin(self, retry=None, timeout=None):
        """Begins a transaction.

        This method is called automatically when entering a with
        statement, however it can be called explicitly if you don't want
        to use a context manager.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry:
            A retry object used to retry requests. If ``None`` is specified,
            requests will be retried using a default configuration.

        :type timeout: float
        :param timeout:
            Time, in seconds, to wait for the request to complete.
            Note that if ``retry`` is specified, the timeout applies
            to each individual attempt.

        :raises: :class:`~exceptions.ValueError` if the transaction has
                 already begun.
        """
        super(Transaction, self).begin()

        kwargs = _make_retry_timeout_kwargs(retry, timeout)

        request = {
            "project_id": self.project,
            "transaction_options": self._options,
        }
        set_database_id_to_request(request, self._client.database)

        try:
            response_pb = self._client._datastore_api.begin_transaction(
                request=request, **kwargs
            )
            self._id = response_pb.transaction
        except:  # noqa: E722 do not use bare except, specify exception instead
            self._status = self._ABORTED
            raise

    def _begin_with_id(self, transaction_id):
        """
        Attach newly created transaction to an existing transaction ID.

        This is used when begin_later is True, when the first lookup request
        associated with this transaction creates a new transaction ID.

        :type transaction_id: bytes
        :param transaction_id: ID of the transaction to attach to.
        """
        if self._status is not self._INITIAL:
            raise ValueError("Transaction already begun.")
        self._id = transaction_id
        self._status = self._IN_PROGRESS

    def rollback(self, retry=None, timeout=None):
        """Rolls back the current transaction.

        This method has necessary side-effects:

        - Sets the current transaction's ID to None.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry:
            A retry object used to retry requests. If ``None`` is specified,
            requests will be retried using a default configuration.

        :type timeout: float
        :param timeout:
            Time, in seconds, to wait for the request to complete.
            Note that if ``retry`` is specified, the timeout applies
            to each individual attempt.
        """
        # if transaction has not started, abort it
        if self._status == self._INITIAL:
            self._status = self._ABORTED
            self._id = None
            return None

        kwargs = _make_retry_timeout_kwargs(retry, timeout)

        try:
            # No need to use the response it contains nothing.
            request = {
                "project_id": self.project,
                "transaction": self._id,
            }

            set_database_id_to_request(request, self._client.database)
            self._client._datastore_api.rollback(request=request, **kwargs)
        finally:
            super(Transaction, self).rollback()
            # Clear our own ID in case this gets accidentally reused.
            self._id = None

    def commit(self, retry=None, timeout=None):
        """Commits the transaction.

        This is called automatically upon exiting a with statement,
        however it can be called explicitly if you don't want to use a
        context manager.

        This method has necessary side-effects:

        - Sets the current transaction's ID to None.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry:
            A retry object used to retry requests. If ``None`` is specified,
            requests will be retried using a default configuration.

        :type timeout: float
        :param timeout:
            Time, in seconds, to wait for the request to complete.
            Note that if ``retry`` is specified, the timeout applies
            to each individual attempt.
        """
        # if transaction has not begun, either begin now, or abort if empty
        if self._status == self._INITIAL:
            if not self._mutations:
                self._status = self._ABORTED
                self._id = None
                return None
            else:
                self.begin()

        kwargs = _make_retry_timeout_kwargs(retry, timeout)

        try:
            super(Transaction, self).commit(**kwargs)
        finally:
            # Clear our own ID in case this gets accidentally reused.
            self._id = None

    def put(self, entity):
        """Adds an entity to be committed.

        Ensures the transaction is not marked readonly.
        Please see documentation at
        :meth:`~google.cloud.datastore.batch.Batch.put`

        :type entity: :class:`~google.cloud.datastore.entity.Entity`
        :param entity: the entity to be saved.

        :raises: :class:`RuntimeError` if the transaction
                 is marked ReadOnly
        """
        if "read_only" in self._options:
            raise RuntimeError("Transaction is read only")
        else:
            super(Transaction, self).put(entity)

    def __enter__(self):
        if not self._begin_later:
            self.begin()
        self._client._push_batch(self)
        return self

    def _allow_mutations(self):
        """
        Mutations can be added to a transaction if it is in IN_PROGRESS state,
        or if it is in INITIAL state and the begin_later flag is set.
        """
        return self._status == self._IN_PROGRESS or (
            self._begin_later and self._status == self._INITIAL
        )
