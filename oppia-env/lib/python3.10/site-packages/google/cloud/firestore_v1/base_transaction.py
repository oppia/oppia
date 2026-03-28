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

from typing import (
    TYPE_CHECKING,
    Any,
    AsyncGenerator,
    Coroutine,
    Generator,
    Optional,
    Union,
)

from google.api_core import retry as retries

from google.cloud.firestore_v1 import types

# Types needed only for Type Hints
if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1.async_stream_generator import AsyncStreamGenerator
    from google.cloud.firestore_v1.document import DocumentSnapshot
    from google.cloud.firestore_v1.query_profile import ExplainOptions
    from google.cloud.firestore_v1.stream_generator import StreamGenerator
    from google.cloud.firestore_v1.types import write as write_pb


MAX_ATTEMPTS = 5
"""int: Default number of transaction attempts (with retries)."""
_CANT_BEGIN: str = "The transaction has already begun. Current transaction ID: {!r}."
_MISSING_ID_TEMPLATE: str = "The transaction has no transaction ID, so it cannot be {}."
_CANT_ROLLBACK: str = _MISSING_ID_TEMPLATE.format("rolled back")
_CANT_COMMIT: str = _MISSING_ID_TEMPLATE.format("committed")
_WRITE_READ_ONLY: str = "Cannot perform write operation in read-only transaction."
_EXCEED_ATTEMPTS_TEMPLATE: str = "Failed to commit transaction in {:d} attempts."
_CANT_RETRY_READ_ONLY: str = "Only read-write transactions can be retried."


class BaseTransaction(object):
    """Accumulate read-and-write operations to be sent in a transaction.

    Args:
        max_attempts (Optional[int]): The maximum number of attempts for
            the transaction (i.e. allowing retries). Defaults to
            :attr:`~google.cloud.firestore_v1.transaction.MAX_ATTEMPTS`.
        read_only (Optional[bool]): Flag indicating if the transaction
            should be read-only or should allow writes. Defaults to
            :data:`False`.
    """

    def __init__(self, max_attempts=MAX_ATTEMPTS, read_only=False) -> None:
        self._max_attempts = max_attempts
        self._read_only = read_only
        self._id = None

    def _add_write_pbs(self, write_pbs: list[write_pb.Write]):
        raise NotImplementedError

    def _options_protobuf(
        self, retry_id: Union[bytes, None]
    ) -> Optional[types.common.TransactionOptions]:
        """Convert the current object to protobuf.

        The ``retry_id`` value is used when retrying a transaction that
        failed (e.g. due to contention). It is intended to be the "first"
        transaction that failed (i.e. if multiple retries are needed).

        Args:
            retry_id (Union[bytes, NoneType]): Transaction ID of a transaction
                to be retried.

        Returns:
            Optional[google.cloud.firestore_v1.types.TransactionOptions]:
            The protobuf ``TransactionOptions`` if ``read_only==True`` or if
            there is a transaction ID to be retried, else :data:`None`.

        Raises:
            ValueError: If ``retry_id`` is not :data:`None` but the
                transaction is read-only.
        """
        if retry_id is not None:
            if self._read_only:
                raise ValueError(_CANT_RETRY_READ_ONLY)

            return types.TransactionOptions(
                read_write=types.TransactionOptions.ReadWrite(
                    retry_transaction=retry_id
                )
            )
        elif self._read_only:
            return types.TransactionOptions(
                read_only=types.TransactionOptions.ReadOnly()
            )
        else:
            return None

    @property
    def in_progress(self):
        """Determine if this transaction has already begun.

        Returns:
            bool: Indicates if the transaction has started.
        """
        return self._id is not None

    @property
    def id(self):
        """Get the current transaction ID.

        Returns:
            Optional[bytes]: The transaction ID (or :data:`None` if the
            current transaction is not in progress).
        """
        return self._id

    def _clean_up(self) -> None:
        """Clean up the instance after :meth:`_rollback`` or :meth:`_commit``.

        This intended to occur on success or failure of the associated RPCs.
        """
        self._write_pbs: list[write_pb.Write] = []
        self._id = None

    def _begin(self, retry_id=None):
        raise NotImplementedError

    def _rollback(self):
        raise NotImplementedError

    def _commit(self) -> Union[list, Coroutine[Any, Any, list]]:
        raise NotImplementedError

    def get_all(
        self,
        references: list,
        retry: retries.Retry | retries.AsyncRetry | object | None = None,
        timeout: float | None = None,
    ) -> (
        Generator[DocumentSnapshot, Any, None]
        | Coroutine[Any, Any, AsyncGenerator[DocumentSnapshot, Any]]
    ):
        raise NotImplementedError

    def get(
        self,
        ref_or_query,
        retry: retries.Retry | retries.AsyncRetry | object | None = None,
        timeout: float | None = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> (
        StreamGenerator[DocumentSnapshot]
        | Generator[DocumentSnapshot, Any, None]
        | Coroutine[Any, Any, AsyncGenerator[DocumentSnapshot, Any]]
        | Coroutine[Any, Any, AsyncStreamGenerator[DocumentSnapshot]]
    ):
        raise NotImplementedError


class _BaseTransactional(object):
    """Provide a callable object to use as a transactional decorater.

    This is surfaced via
    :func:`~google.cloud.firestore_v1.transaction.transactional`.

    Args:
        to_wrap (Callable[[:class:`~google.cloud.firestore_v1.transaction.Transaction`, ...], Any]):
            A callable that should be run (and retried) in a transaction.
    """

    def __init__(self, to_wrap) -> None:
        self.to_wrap = to_wrap
        self.current_id = None
        """Optional[bytes]: The current transaction ID."""
        self.retry_id = None
        """Optional[bytes]: The ID of the first attempted transaction."""

    def _reset(self) -> None:
        """Unset the transaction IDs."""
        self.current_id = None
        self.retry_id = None

    def _pre_commit(self, transaction, *args, **kwargs):
        raise NotImplementedError

    def __call__(self, transaction, *args, **kwargs):
        raise NotImplementedError
