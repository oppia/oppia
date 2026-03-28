# Copyright 2021 Google LLC All rights reserved.
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

"""Helpers for efficiently writing large amounts of data to the Google Cloud
Firestore API."""

import bisect
import collections
import concurrent.futures
import datetime
import enum
import functools
import logging
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING, Callable, Deque, Dict, List, Optional, Union

from google.rpc import status_pb2  # type: ignore

from google.cloud.firestore_v1 import _helpers
from google.cloud.firestore_v1.base_document import BaseDocumentReference
from google.cloud.firestore_v1.bulk_batch import BulkWriteBatch
from google.cloud.firestore_v1.rate_limiter import RateLimiter
from google.cloud.firestore_v1.types.firestore import BatchWriteResponse
from google.cloud.firestore_v1.types.write import WriteResult

if TYPE_CHECKING:
    from google.cloud.firestore_v1.base_client import BaseClient  # pragma: NO COVER


logger = logging.getLogger(__name__)


class BulkRetry(enum.Enum):
    """Indicator for what retry strategy the BulkWriter should use."""

    # Common exponential backoff algorithm. This strategy is largely incompatible
    # with the default retry limit of 15, so use with caution.
    exponential = enum.auto()

    # Default strategy that adds 1 second of delay per retry.
    linear = enum.auto()

    # Immediate retries with no growing delays.
    immediate = enum.auto()


class SendMode(enum.Enum):
    """Indicator for whether a BulkWriter should commit batches in the main
    thread or hand that work off to an executor."""

    # Default strategy that parallelizes network I/O on an executor. You almost
    # certainly want this.
    parallel = enum.auto()

    # Alternate strategy which blocks during all network I/O. Much slower, but
    # assures all batches are sent to the server in order. Note that
    # `SendMode.serial` is extremely susceptible to slowdowns from retries if
    # there are a lot of errors.
    serial = enum.auto()


class AsyncBulkWriterMixin:
    """
    Mixin which contains the methods on `BulkWriter` which must only be
    submitted to the executor (or called by functions submitted to the executor).
    This mixin exists purely for organization and clarity of implementation
    (e.g., there is no metaclass magic).

    The entrypoint to the parallelizable code path is `_send_batch()`, which is
    wrapped in a decorator which ensures that the `SendMode` is honored.
    """

    def _with_send_mode(fn: Callable):  # type: ignore
        """Decorates a method to ensure it is only called via the executor
        (IFF the SendMode value is SendMode.parallel!).

        Usage:

            @_with_send_mode
            def my_method(self):
                parallel_stuff()

            def something_else(self):
                # Because of the decorator around `my_method`, the following
                # method invocation:
                self.my_method()
                # becomes equivalent to `self._executor.submit(self.my_method)`
                # when the send mode is `SendMode.parallel`.

        Use on entrypoint methods for code paths that *must* be parallelized.
        """

        @functools.wraps(fn)
        def wrapper(self, *args, **kwargs):
            if self._send_mode == SendMode.parallel:
                return self._executor.submit(lambda: fn(self, *args, **kwargs))
            else:
                # For code parity, even `SendMode.serial` scenarios should return
                # a future here. Anything else would badly complicate calling code.
                result = fn(self, *args, **kwargs)
                future = concurrent.futures.Future()
                future.set_result(result)
                return future

        return wrapper

    @_with_send_mode
    def _send_batch(  # type: ignore
        self: "BulkWriter",
        batch: BulkWriteBatch,
        operations: List["BulkWriterOperation"],
    ):
        """Sends a batch without regard to rate limits, meaning limits must have
        already been checked. To that end, do not call this directly; instead,
        call `_send_until_queue_is_empty`.

        Args:
            batch(:class:`~google.cloud.firestore_v1.base_batch.BulkWriteBatch`)
        """
        _len_batch: int = len(batch)
        self._in_flight_documents += _len_batch
        response: BatchWriteResponse = self._send(batch)
        self._in_flight_documents -= _len_batch

        # Update bookkeeping totals
        self._total_batches_sent += 1
        self._total_write_operations += _len_batch

        self._process_response(batch, response, operations)

    def _process_response(  # type: ignore
        self: "BulkWriter",
        batch: BulkWriteBatch,
        response: BatchWriteResponse,
        operations: List["BulkWriterOperation"],
    ):
        """Invokes submitted callbacks for each batch and each operation within
        each batch. As this is called from `_send_batch()`, this is parallelized
        if we are in that mode.
        """
        batch_references: List[BaseDocumentReference] = list(
            batch._document_references.values(),
        )
        self._batch_callback(batch, response, self)

        status: status_pb2.Status
        for index, status in enumerate(response.status):
            if status.code == 0:
                self._success_callback(
                    # DocumentReference
                    batch_references[index],
                    # WriteResult
                    response.write_results[index],
                    # BulkWriter
                    self,
                )
            else:
                operation: BulkWriterOperation = operations[index]
                should_retry: bool = self._error_callback(
                    # BulkWriteFailure
                    BulkWriteFailure(
                        operation=operation,
                        code=status.code,
                        message=status.message,
                    ),
                    # BulkWriter
                    self,
                )
                if should_retry:
                    operation.attempts += 1
                    self._retry_operation(operation)

    def _retry_operation(  # type: ignore
        self: "BulkWriter",
        operation: "BulkWriterOperation",
    ):
        delay: int = 0
        if self._options.retry == BulkRetry.exponential:
            delay = operation.attempts**2  # pragma: NO COVER
        elif self._options.retry == BulkRetry.linear:
            delay = operation.attempts

        run_at = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(
            seconds=delay
        )

        # Use of `bisect.insort` maintains the requirement that `self._retries`
        # always remain sorted by each object's `run_at` time. Note that it is
        # able to do this because `OperationRetry` instances are entirely sortable
        # by their `run_at` value.
        bisect.insort(
            self._retries,
            OperationRetry(operation=operation, run_at=run_at),
        )

    def _send(self, batch: BulkWriteBatch) -> BatchWriteResponse:
        """Hook for overwriting the sending of batches. As this is only called
        from `_send_batch()`, this is parallelized if we are in that mode.
        """
        return batch.commit()  # pragma: NO COVER


class BulkWriter(AsyncBulkWriterMixin):
    """
    Accumulate and efficiently save large amounts of document write operations
    to the server.

    BulkWriter can handle large data migrations or updates, buffering records
    in memory and submitting them to the server in batches of 20.

    The submission of batches is internally parallelized with a ThreadPoolExecutor,
    meaning end developers do not need to manage an event loop or worry about asyncio
    to see parallelization speed ups (which can easily 10x throughput). Because
    of this, there is no companion `AsyncBulkWriter` class, as is usually seen
    with other utility classes.

    Usage:

    .. code-block:: python

        # Instantiate the BulkWriter. This works from either `Client` or
        # `AsyncClient`.
        db = firestore.Client()
        bulk_writer = db.bulk_writer()

        # Attach an optional success listener to be called once per document.
        bulk_writer.on_write_result(
            lambda reference, result, bulk_writer: print(f'Saved {reference._document_path}')
        )

        # Queue an arbitrary amount of write operations.
        # Assume `my_new_records` is a list of (DocumentReference, dict,)
        # tuple-pairs that you supply.

        reference: DocumentReference
        data: dict
        for reference, data in my_new_records:
            bulk_writer.create(reference, data)

        # Block until all pooled writes are complete.
        bulk_writer.flush()

    Args:
        client(:class:`~google.cloud.firestore_v1.client.Client`):
            The client that created this BulkWriter.
    """

    batch_size: int = 20

    def __init__(
        self,
        client: Optional["BaseClient"] = None,
        options: Optional["BulkWriterOptions"] = None,
    ):
        # Because `BulkWriter` instances are all synchronous/blocking on the
        # main thread (instead using other threads for asynchrony), it is
        # incompatible with AsyncClient's various methods that return Futures.
        # `BulkWriter` parallelizes all of its network I/O without the developer
        # having to worry about awaiting async methods, so we must convert an
        # AsyncClient instance into a plain Client instance.
        if type(client).__name__ == "AsyncClient":
            self._client = client._to_sync_copy()  # type: ignore
        else:
            self._client = client
        self._options = options or BulkWriterOptions()
        self._send_mode = self._options.mode

        self._operations: List[BulkWriterOperation]
        # List of the `_document_path` attribute for each DocumentReference
        # contained in the current `self._operations`. This is reset every time
        # `self._operations` is reset.
        self._operations_document_paths: List[BaseDocumentReference]
        self._reset_operations()

        # List of all `BulkWriterOperation` objects that are waiting to be retried.
        # Each such object is wrapped in an `OperationRetry` object which pairs
        # the raw operation with the `datetime` of its next scheduled attempt.
        # `self._retries` must always remain sorted for efficient reads, so it is
        # required to only ever add elements via `bisect.insort`.
        self._retries: Deque["OperationRetry"] = collections.deque([])

        self._queued_batches: Deque[List[BulkWriterOperation]] = collections.deque([])
        self._is_open: bool = True

        # This list will go on to store the future returned from each submission
        # to the executor, for the purpose of awaiting all of those futures'
        # completions in the `flush` method.
        self._pending_batch_futures: List[concurrent.futures.Future] = []

        self._success_callback: Callable[
            [BaseDocumentReference, WriteResult, "BulkWriter"], None
        ] = BulkWriter._default_on_success
        self._batch_callback: Callable[
            [BulkWriteBatch, BatchWriteResponse, "BulkWriter"], None
        ] = BulkWriter._default_on_batch
        self._error_callback: Callable[
            [BulkWriteFailure, BulkWriter], bool
        ] = BulkWriter._default_on_error

        self._in_flight_documents: int = 0
        self._rate_limiter = RateLimiter(
            initial_tokens=self._options.initial_ops_per_second,
            global_max_tokens=self._options.max_ops_per_second,
        )

        # Keep track of progress as batches and write operations are completed
        self._total_batches_sent: int = 0
        self._total_write_operations: int = 0

        self._ensure_executor()

    @staticmethod
    def _default_on_batch(
        batch: BulkWriteBatch,
        response: BatchWriteResponse,
        bulk_writer: "BulkWriter",
    ) -> None:
        pass

    @staticmethod
    def _default_on_success(
        reference: BaseDocumentReference,
        result: WriteResult,
        bulk_writer: "BulkWriter",
    ) -> None:
        pass

    @staticmethod
    def _default_on_error(error: "BulkWriteFailure", bulk_writer: "BulkWriter") -> bool:
        # Default number of retries for each operation is 15. This is a scary
        # number to combine with an exponential backoff, and as such, our default
        # backoff strategy is linear instead of exponential.
        return error.attempts < 15

    def _reset_operations(self) -> None:
        self._operations = []
        self._operations_document_paths = []

    def _ensure_executor(self):
        """Reboots the executor used to send batches if it has been shutdown."""
        if getattr(self, "_executor", None) is None or self._executor._shutdown:
            self._executor = self._instantiate_executor()

    def _ensure_sending(self):
        self._ensure_executor()
        self._send_until_queue_is_empty()

    def _instantiate_executor(self):
        return concurrent.futures.ThreadPoolExecutor()

    def flush(self):
        """
        Block until all pooled write operations are complete and then resume
        accepting new write operations.
        """
        # Calling `flush` consecutively is a no-op.
        if self._executor._shutdown:
            return

        while True:
            # Queue any waiting operations and try our luck again.
            # This can happen if users add a number of records not divisible by
            # 20 and then call flush (which should be ~19 out of 20 use cases).
            # Execution will arrive here and find the leftover operations that
            # never filled up a batch organically, and so we must send them here.
            if self._operations:
                self._enqueue_current_batch()
                continue

            # If we find queued but unsent batches or pending retries, begin
            # sending immediately. Note that if we are waiting on retries, but
            # they have longer to wait as specified by the retry backoff strategy,
            # we may have to make several passes through this part of the loop.
            # (This is related to the sleep and its explanation below.)
            if self._queued_batches or self._retries:
                self._ensure_sending()

                # This sleep prevents max-speed laps through this loop, which can
                # and will happen if the BulkWriter is doing nothing except waiting
                # on retries to be ready to re-send. Removing this sleep will cause
                # whatever thread is running this code to sit near 100% CPU until
                # all retries are abandoned or successfully resolved.
                time.sleep(0.1)
                continue

            # We store the executor's Future from each batch send operation, so
            # the first pass through here, we are guaranteed to find "pending"
            # batch futures and have to wait. However, the second pass through
            # will be fast unless the last batch introduced more retries.
            if self._pending_batch_futures:
                _batches = self._pending_batch_futures
                self._pending_batch_futures = []
                concurrent.futures.wait(_batches)

                # Continuing is critical here (as opposed to breaking) because
                # the final batch may have introduced retries which is most
                # straightforwardly verified by heading back to the top of the loop.
                continue

            break

        # We no longer expect to have any queued batches or pending futures,
        # so the executor can be shutdown.
        self._executor.shutdown()

    def close(self):
        """
        Block until all pooled write operations are complete and then reject
        any further write operations.
        """
        self._is_open = False
        self.flush()

    def _maybe_enqueue_current_batch(self):
        """
        Checks to see whether the in-progress batch is full and, if it is,
        adds it to the sending queue.
        """
        if len(self._operations) >= self.batch_size:
            self._enqueue_current_batch()

    def _enqueue_current_batch(self):
        """Adds the current batch to the back of the sending line, resets the
        list of queued ops, and begins the process of actually sending whatever
        batch is in the front of the line, which will often be a different batch.
        """
        # Put our batch in the back of the sending line
        self._queued_batches.append(self._operations)

        # Reset the local store of operations
        self._reset_operations()

        # The sending loop powers off upon reaching the end of the queue, so
        # here we make sure that is running.
        self._ensure_sending()

    def _send_until_queue_is_empty(self) -> None:
        """First domino in the sending codepath. This does not need to be
        parallelized for two reasons:

            1) Putting this on a worker thread could lead to two running in parallel
            and thus unpredictable commit ordering or failure to adhere to
            rate limits.
            2) This method only blocks when `self._request_send()` does not immediately
            return, and in that case, the BulkWriter's ramp-up / throttling logic
            has determined that it is attempting to exceed the maximum write speed,
            and so parallelizing this method would not increase performance anyway.

        Once `self._request_send()` returns, this method calls `self._send_batch()`,
        which parallelizes itself if that is our SendMode value.

        And once `self._send_batch()` is called (which does not block if we are
        sending in parallel), jumps back to the top and re-checks for any queued
        batches.

        Note that for sufficiently large data migrations, this can block the
        submission of additional write operations (e.g., the CRUD methods);
        but again, that is only if the maximum write speed is being exceeded,
        and thus this scenario does not actually further reduce performance.
        """
        self._schedule_ready_retries()

        while self._queued_batches:
            # For FIFO order, add to the right of this deque (via `append`) and take
            # from the left (via `popleft`).
            operations: List[BulkWriterOperation] = self._queued_batches.popleft()

            # Block until we are cleared for takeoff, which is fine because this
            # returns instantly unless the rate limiting logic determines that we
            # are attempting to exceed the maximum write speed.
            self._request_send(len(operations))

            # Handle some bookkeeping, and ultimately put these bits on the wire.
            batch = BulkWriteBatch(client=self._client)
            op: BulkWriterOperation
            for op in operations:
                op.add_to_batch(batch)

            # `_send_batch` is optionally parallelized by `@_with_send_mode`.
            future = self._send_batch(batch=batch, operations=operations)
            self._pending_batch_futures.append(future)

            self._schedule_ready_retries()
        return None

    def _schedule_ready_retries(self) -> None:
        """Grabs all ready retries and re-queues them."""

        # Because `self._retries` always exists in a sorted state (thanks to only
        # ever adding to it via `bisect.insort`), and because `OperationRetry`
        # objects are comparable against `datetime` objects, this bisect functionally
        # returns the number of retires that are ready for immediate reenlistment.
        take_until_index = bisect.bisect(
            self._retries, datetime.datetime.now(tz=datetime.timezone.utc)
        )

        for _ in range(take_until_index):
            retry: OperationRetry = self._retries.popleft()
            retry.retry(self)
        return None

    def _request_send(self, batch_size: int) -> bool:
        # Set up this boolean to avoid repeatedly taking tokens if we're only
        # waiting on the `max_in_flight` limit.
        have_received_tokens: bool = False

        while True:
            # To avoid bottlenecks on the server, an additional limit is that no
            # more write operations can be "in flight" (sent but still awaiting
            # response) at any given point than the maximum number of writes per
            # second.
            under_threshold: bool = (
                self._in_flight_documents <= self._rate_limiter._maximum_tokens
            )
            # Ask for tokens each pass through this loop until they are granted,
            # and then stop.
            have_received_tokens = have_received_tokens or bool(
                self._rate_limiter.take_tokens(batch_size)
            )
            if not under_threshold or not have_received_tokens:
                # Try again until both checks are true.
                # Note that this sleep is helpful to prevent the main BulkWriter
                # thread from spinning through this loop as fast as possible and
                # pointlessly burning CPU while we wait for the arrival of a
                # fixed moment in the future.
                time.sleep(0.01)
                continue

            return True

    def create(
        self,
        reference: BaseDocumentReference,
        document_data: Dict,
        attempts: int = 0,
    ) -> None:
        """Adds a `create` pb to the in-progress batch.

        If the in-progress batch already contains a write operation involving
        this document reference, the batch will be sealed and added to the commit
        queue, and a new batch will be created with this operation as its first
        entry.

        If this create operation results in the in-progress batch reaching full
        capacity, then the batch will be similarly added to the commit queue, and
        a new batch will be created for future operations.

        Args:
            reference (:class:`~google.cloud.firestore_v1.base_document.BaseDocumentReference`):
                Pointer to the document that should be created.
            document_data (dict):
                Raw data to save to the server.
        """
        self._verify_not_closed()

        if reference._document_path in self._operations_document_paths:
            self._enqueue_current_batch()

        self._operations.append(
            BulkWriterCreateOperation(
                reference=reference,
                document_data=document_data,
                attempts=attempts,
            ),
        )
        self._operations_document_paths.append(reference._document_path)

        self._maybe_enqueue_current_batch()

    def delete(
        self,
        reference: BaseDocumentReference,
        option: Optional[_helpers.WriteOption] = None,
        attempts: int = 0,
    ) -> None:
        """Adds a `delete` pb to the in-progress batch.

        If the in-progress batch already contains a write operation involving
        this document reference, the batch will be sealed and added to the commit
        queue, and a new batch will be created with this operation as its first
        entry.

        If this delete operation results in the in-progress batch reaching full
        capacity, then the batch will be similarly added to the commit queue, and
        a new batch will be created for future operations.

        Args:
            reference (:class:`~google.cloud.firestore_v1.base_document.BaseDocumentReference`):
                Pointer to the document that should be created.
            option (:class:`~google.cloud.firestore_v1._helpers.WriteOption`):
                Optional flag to modify the nature of this write.
        """
        self._verify_not_closed()

        if reference._document_path in self._operations_document_paths:
            self._enqueue_current_batch()

        self._operations.append(
            BulkWriterDeleteOperation(
                reference=reference,
                option=option,
                attempts=attempts,
            ),
        )
        self._operations_document_paths.append(reference._document_path)

        self._maybe_enqueue_current_batch()

    def set(
        self,
        reference: BaseDocumentReference,
        document_data: Dict,
        merge: Union[bool, list] = False,
        attempts: int = 0,
    ) -> None:
        """Adds a `set` pb to the in-progress batch.

        If the in-progress batch already contains a write operation involving
        this document reference, the batch will be sealed and added to the commit
        queue, and a new batch will be created with this operation as its first
        entry.

        If this set operation results in the in-progress batch reaching full
        capacity, then the batch will be similarly added to the commit queue, and
        a new batch will be created for future operations.

        Args:
            reference (:class:`~google.cloud.firestore_v1.base_document.BaseDocumentReference`):
                Pointer to the document that should be created.
            document_data (dict):
                Raw data to save to the server.
            merge (bool):
                Whether or not to completely overwrite any existing data with
                the supplied data.
        """
        self._verify_not_closed()

        if reference._document_path in self._operations_document_paths:
            self._enqueue_current_batch()

        self._operations.append(
            BulkWriterSetOperation(
                reference=reference,
                document_data=document_data,
                merge=merge,
                attempts=attempts,
            )
        )
        self._operations_document_paths.append(reference._document_path)

        self._maybe_enqueue_current_batch()

    def update(
        self,
        reference: BaseDocumentReference,
        field_updates: dict,
        option: Optional[_helpers.WriteOption] = None,
        attempts: int = 0,
    ) -> None:
        """Adds an `update` pb to the in-progress batch.

        If the in-progress batch already contains a write operation involving
        this document reference, the batch will be sealed and added to the commit
        queue, and a new batch will be created with this operation as its first
        entry.

        If this update operation results in the in-progress batch reaching full
        capacity, then the batch will be similarly added to the commit queue, and
        a new batch will be created for future operations.

        Args:
            reference (:class:`~google.cloud.firestore_v1.base_document.BaseDocumentReference`):
                Pointer to the document that should be created.
            field_updates (dict):
                Key paths to specific nested data that should be upated.
            option (:class:`~google.cloud.firestore_v1._helpers.WriteOption`):
                Optional flag to modify the nature of this write.
        """
        # This check is copied from other Firestore classes for the purposes of
        # surfacing the error immediately.
        if option.__class__.__name__ == "ExistsOption":
            raise ValueError("you must not pass an explicit write option to update.")

        self._verify_not_closed()

        if reference._document_path in self._operations_document_paths:
            self._enqueue_current_batch()

        self._operations.append(
            BulkWriterUpdateOperation(
                reference=reference,
                field_updates=field_updates,
                option=option,
                attempts=attempts,
            )
        )
        self._operations_document_paths.append(reference._document_path)

        self._maybe_enqueue_current_batch()

    def on_write_result(
        self,
        callback: Optional[
            Callable[[BaseDocumentReference, WriteResult, "BulkWriter"], None]
        ],
    ) -> None:
        """Sets a callback that will be invoked once for every successful operation."""
        self._success_callback = callback or BulkWriter._default_on_success

    def on_batch_result(
        self,
        callback: Optional[
            Callable[[BulkWriteBatch, BatchWriteResponse, "BulkWriter"], None]
        ],
    ) -> None:
        """Sets a callback that will be invoked once for every successful batch."""
        self._batch_callback = callback or BulkWriter._default_on_batch

    def on_write_error(
        self, callback: Optional[Callable[["BulkWriteFailure", "BulkWriter"], bool]]
    ) -> None:
        """Sets a callback that will be invoked once for every batch that contains
        an error."""
        self._error_callback = callback or BulkWriter._default_on_error

    def _verify_not_closed(self):
        if not self._is_open:
            raise Exception("BulkWriter is closed and cannot accept new operations")


class BulkWriterOperation:
    """Parent class for all operation container classes.

    `BulkWriterOperation` exists to house all the necessary information for a
    specific write task, including meta information like the current number of
    attempts. If a write fails, it is its wrapper `BulkWriteOperation` class
    that ferries it into its next retry without getting confused with other
    similar writes to the same document.
    """

    def __init__(self, attempts: int = 0):
        self.attempts = attempts

    def add_to_batch(self, batch: BulkWriteBatch):
        """Adds `self` to the supplied batch."""
        assert isinstance(batch, BulkWriteBatch)
        if isinstance(self, BulkWriterCreateOperation):
            return batch.create(
                reference=self.reference,
                document_data=self.document_data,
            )

        if isinstance(self, BulkWriterDeleteOperation):
            return batch.delete(
                reference=self.reference,
                option=self.option,
            )

        if isinstance(self, BulkWriterSetOperation):
            return batch.set(
                reference=self.reference,
                document_data=self.document_data,
                merge=self.merge,
            )

        if isinstance(self, BulkWriterUpdateOperation):
            return batch.update(
                reference=self.reference,
                field_updates=self.field_updates,
                option=self.option,
            )
        raise TypeError(
            f"Unexpected type of {self.__class__.__name__} for batch"
        )  # pragma: NO COVER


@functools.total_ordering
class BaseOperationRetry:
    """Parent class for both the @dataclass and old-style `OperationRetry`
    classes.

    Methods on this class be moved directly to `OperationRetry` when support for
    Python 3.6 is dropped and `dataclasses` becomes universal.
    """

    def __lt__(self: "OperationRetry", other: "OperationRetry"):  # type: ignore
        """Allows use of `bisect` to maintain a sorted list of `OperationRetry`
        instances, which in turn allows us to cheaply grab all that are ready to
        run."""
        if isinstance(other, OperationRetry):
            return self.run_at < other.run_at
        elif isinstance(other, datetime.datetime):
            return self.run_at < other
        return NotImplemented  # pragma: NO COVER

    def retry(self: "OperationRetry", bulk_writer: BulkWriter) -> None:  # type: ignore
        """Call this after waiting any necessary time to re-add the enclosed
        operation to the supplied BulkWriter's internal queue."""
        if isinstance(self.operation, BulkWriterCreateOperation):
            bulk_writer.create(
                reference=self.operation.reference,
                document_data=self.operation.document_data,
                attempts=self.operation.attempts,
            )

        elif isinstance(self.operation, BulkWriterDeleteOperation):
            bulk_writer.delete(
                reference=self.operation.reference,
                option=self.operation.option,
                attempts=self.operation.attempts,
            )

        elif isinstance(self.operation, BulkWriterSetOperation):
            bulk_writer.set(
                reference=self.operation.reference,
                document_data=self.operation.document_data,
                merge=self.operation.merge,
                attempts=self.operation.attempts,
            )

        elif isinstance(self.operation, BulkWriterUpdateOperation):
            bulk_writer.update(
                reference=self.operation.reference,
                field_updates=self.operation.field_updates,
                option=self.operation.option,
                attempts=self.operation.attempts,
            )
        else:
            raise TypeError(
                f"Unexpected type of {self.operation.__class__.__name__} for OperationRetry.retry"
            )  # pragma: NO COVER


@dataclass
class BulkWriterOptions:
    initial_ops_per_second: int = 500
    max_ops_per_second: int = 500
    mode: SendMode = SendMode.parallel
    retry: BulkRetry = BulkRetry.linear


@dataclass
class BulkWriteFailure:
    operation: BulkWriterOperation
    # https://grpc.github.io/grpc/core/md_doc_statuscodes.html
    code: int
    message: str

    @property
    def attempts(self) -> int:
        return self.operation.attempts


@dataclass
class OperationRetry(BaseOperationRetry):
    """Container for an additional attempt at an operation, scheduled for
    the future."""

    operation: BulkWriterOperation
    run_at: datetime.datetime


@dataclass
class BulkWriterCreateOperation(BulkWriterOperation):
    """Container for BulkWriter.create() operations."""

    reference: BaseDocumentReference
    document_data: Dict
    attempts: int = 0


@dataclass
class BulkWriterUpdateOperation(BulkWriterOperation):
    """Container for BulkWriter.update() operations."""

    reference: BaseDocumentReference
    field_updates: Dict
    option: Optional[_helpers.WriteOption]
    attempts: int = 0


@dataclass
class BulkWriterSetOperation(BulkWriterOperation):
    """Container for BulkWriter.set() operations."""

    reference: BaseDocumentReference
    document_data: Dict
    merge: Union[bool, list] = False
    attempts: int = 0


@dataclass
class BulkWriterDeleteOperation(BulkWriterOperation):
    """Container for BulkWriter.delete() operations."""

    reference: BaseDocumentReference
    option: Optional[_helpers.WriteOption]
    attempts: int = 0
