# Copyright 2017 Google LLC All rights reserved.
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

"""Helpers for applying Google Cloud Firestore changes in a transaction."""
from __future__ import annotations

from typing import TYPE_CHECKING, Any, Callable, Generator, Optional

from google.api_core import exceptions, gapic_v1
from google.api_core import retry as retries

from google.cloud.firestore_v1 import _helpers, batch
from google.cloud.firestore_v1.base_transaction import (
    _CANT_BEGIN,
    _CANT_COMMIT,
    _CANT_ROLLBACK,
    _EXCEED_ATTEMPTS_TEMPLATE,
    _WRITE_READ_ONLY,
    MAX_ATTEMPTS,
    BaseTransaction,
    _BaseTransactional,
)
from google.cloud.firestore_v1.document import DocumentReference
from google.cloud.firestore_v1.query import Query

# Types needed only for Type Hints
if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1.base_document import DocumentSnapshot
    from google.cloud.firestore_v1.query_profile import ExplainOptions
    from google.cloud.firestore_v1.stream_generator import StreamGenerator


class Transaction(batch.WriteBatch, BaseTransaction):
    """Accumulate read-and-write operations to be sent in a transaction.

    Args:
        client (:class:`~google.cloud.firestore_v1.client.Client`):
            The client that created this transaction.
        max_attempts (Optional[int]): The maximum number of attempts for
            the transaction (i.e. allowing retries). Defaults to
            :attr:`~google.cloud.firestore_v1.transaction.MAX_ATTEMPTS`.
        read_only (Optional[bool]): Flag indicating if the transaction
            should be read-only or should allow writes. Defaults to
            :data:`False`.
    """

    def __init__(self, client, max_attempts=MAX_ATTEMPTS, read_only=False) -> None:
        super(Transaction, self).__init__(client)
        BaseTransaction.__init__(self, max_attempts, read_only)

    def _add_write_pbs(self, write_pbs: list) -> None:
        """Add `Write`` protobufs to this transaction.

        Args:
            write_pbs (List[google.cloud.firestore_v1.\
                write.Write]): A list of write protobufs to be added.

        Raises:
            ValueError: If this transaction is read-only.
        """
        if self._read_only:
            raise ValueError(_WRITE_READ_ONLY)

        super(Transaction, self)._add_write_pbs(write_pbs)

    def _begin(self, retry_id: bytes | None = None) -> None:
        """Begin the transaction.

        Args:
            retry_id (Optional[bytes]): Transaction ID of a transaction to be
                retried.

        Raises:
            ValueError: If the current transaction has already begun.
        """
        if self.in_progress:
            msg = _CANT_BEGIN.format(self._id)
            raise ValueError(msg)

        transaction_response = self._client._firestore_api.begin_transaction(
            request={
                "database": self._client._database_string,
                "options": self._options_protobuf(retry_id),
            },
            metadata=self._client._rpc_metadata,
        )
        self._id = transaction_response.transaction

    def _rollback(self) -> None:
        """Roll back the transaction.

        Raises:
            ValueError: If no transaction is in progress.
            google.api_core.exceptions.GoogleAPICallError: If the rollback fails.
        """
        if not self.in_progress:
            raise ValueError(_CANT_ROLLBACK)

        try:
            # NOTE: The response is just ``google.protobuf.Empty``.
            self._client._firestore_api.rollback(
                request={
                    "database": self._client._database_string,
                    "transaction": self._id,
                },
                metadata=self._client._rpc_metadata,
            )
        finally:
            # clean up, even if rollback fails
            self._clean_up()

    def _commit(self) -> list:
        """Transactionally commit the changes accumulated.

        Returns:
            List[:class:`google.cloud.firestore_v1.write.WriteResult`, ...]:
            The write results corresponding to the changes committed, returned
            in the same order as the changes were applied to this transaction.
            A write result contains an ``update_time`` field.

        Raises:
            ValueError: If no transaction is in progress.
        """
        if not self.in_progress:
            raise ValueError(_CANT_COMMIT)

        commit_response = self._client._firestore_api.commit(
            request={
                "database": self._client._database_string,
                "writes": self._write_pbs,
                "transaction": self._id,
            },
            metadata=self._client._rpc_metadata,
        )

        self._clean_up()
        self.write_results = list(commit_response.write_results)
        self.commit_time = commit_response.commit_time
        return self.write_results

    def get_all(
        self,
        references: list,
        retry: retries.Retry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> Generator[DocumentSnapshot, Any, None]:
        """Retrieves multiple documents from Firestore.

        Args:
            references (List[.DocumentReference, ...]): Iterable of document
                references to be retrieved.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Yields:
            .DocumentSnapshot: The next document snapshot that fulfills the
            query, or :data:`None` if the document does not exist.
        """
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)
        return self._client.get_all(references, transaction=self, **kwargs)

    def get(
        self,
        ref_or_query: DocumentReference | Query,
        retry: retries.Retry | object | None = gapic_v1.method.DEFAULT,
        timeout: Optional[float] = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> StreamGenerator[DocumentSnapshot] | Generator[DocumentSnapshot, Any, None]:
        """Retrieve a document or a query result from the database.

        Args:
            ref_or_query (DocumentReference | Query):
                The document references or query object to return.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.
            explain_options
                (Optional[:class:`~google.cloud.firestore_v1.query_profile.ExplainOptions`]):
                Options to enable query profiling for this query. When set,
                explain_metrics will be available on the returned generator.
                Can only be used when running a query, not a document reference.

        Yields:
            .DocumentSnapshot: The next document snapshot that fulfills the
            query, or :data:`None` if the document does not exist.

        Raises:
            ValueError: if `ref_or_query` is not one of the supported types, or
            explain_options is provided when `ref_or_query` is a document
            reference.
        """
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)
        if isinstance(ref_or_query, DocumentReference):
            if explain_options is not None:
                raise ValueError(
                    "When type of `ref_or_query` is `AsyncDocumentReference`, "
                    "`explain_options` cannot be provided."
                )
            return self._client.get_all([ref_or_query], transaction=self, **kwargs)
        elif isinstance(ref_or_query, Query):
            if explain_options is not None:
                kwargs["explain_options"] = explain_options
            return ref_or_query.stream(transaction=self, **kwargs)
        else:
            raise ValueError(
                'Value for argument "ref_or_query" must be a DocumentReference or a Query.'
            )


class _Transactional(_BaseTransactional):
    """Provide a callable object to use as a transactional decorater.

    This is surfaced via
    :func:`~google.cloud.firestore_v1.transaction.transactional`.

    Args:
        to_wrap (Callable[[:class:`~google.cloud.firestore_v1.transaction.Transaction`, ...], Any]):
            A callable that should be run (and retried) in a transaction.
    """

    def __init__(self, to_wrap) -> None:
        super(_Transactional, self).__init__(to_wrap)

    def _pre_commit(self, transaction: Transaction, *args, **kwargs) -> Any:
        """Begin transaction and call the wrapped callable.

        Args:
            transaction
                (:class:`~google.cloud.firestore_v1.transaction.Transaction`):
                A transaction to execute the callable within.
            args (Tuple[Any, ...]): The extra positional arguments to pass
                along to the wrapped callable.
            kwargs (Dict[str, Any]): The extra keyword arguments to pass
                along to the wrapped callable.

        Returns:
            Any: result of the wrapped callable.

        Raises:
            Exception: Any failure caused by ``to_wrap``.
        """
        # Force the ``transaction`` to be not "in progress".
        transaction._clean_up()
        transaction._begin(retry_id=self.retry_id)

        # Update the stored transaction IDs.
        self.current_id = transaction._id
        if self.retry_id is None:
            self.retry_id = self.current_id
        return self.to_wrap(transaction, *args, **kwargs)

    def __call__(self, transaction: Transaction, *args, **kwargs):
        """Execute the wrapped callable within a transaction.

        Args:
            transaction
                (:class:`~google.cloud.firestore_v1.transaction.Transaction`):
                A transaction to execute the callable within.
            args (Tuple[Any, ...]): The extra positional arguments to pass
                along to the wrapped callable.
            kwargs (Dict[str, Any]): The extra keyword arguments to pass
                along to the wrapped callable.

        Returns:
            Any: The result of the wrapped callable.

        Raises:
            ValueError: If the transaction does not succeed in
                ``max_attempts``.
        """
        self._reset()
        retryable_exceptions = (
            (exceptions.Aborted) if not transaction._read_only else ()
        )
        last_exc = None

        try:
            for attempt in range(transaction._max_attempts):
                result = self._pre_commit(transaction, *args, **kwargs)
                try:
                    transaction._commit()
                    return result
                except retryable_exceptions as exc:
                    last_exc = exc
                # Retry attempts that result in retryable exceptions
                # Subsequent requests will use the failed transaction ID as part of
                # the ``BeginTransactionRequest`` when restarting this transaction
                # (via ``options.retry_transaction``). This preserves the "spot in
                # line" of the transaction, so exponential backoff is not required
                # in this case.
            # retries exhausted
            # wrap the last exception in a ValueError before raising
            msg = _EXCEED_ATTEMPTS_TEMPLATE.format(transaction._max_attempts)
            raise ValueError(msg) from last_exc
        except BaseException:  # noqa: B901
            # rollback the transaction on any error
            # errors raised during _rollback will be chained to the original error through __context__
            transaction._rollback()
            raise


def transactional(to_wrap: Callable) -> _Transactional:
    """Decorate a callable so that it runs in a transaction.

    Args:
        to_wrap
            (Callable[[:class:`~google.cloud.firestore_v1.transaction.Transaction`, ...], Any]):
            A callable that should be run (and retried) in a transaction.

    Returns:
        Callable[[:class:`~google.cloud.firestore_v1.transaction.Transaction`, ...], Any]:
        the wrapped callable.
    """
    return _Transactional(to_wrap)
