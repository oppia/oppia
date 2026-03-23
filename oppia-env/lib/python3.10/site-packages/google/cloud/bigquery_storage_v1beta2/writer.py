# Copyright 2021 Google LLC
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


from __future__ import division

import itertools
import logging
import queue
import time
import threading
from typing import Callable, Optional, Sequence, Tuple

from google.api_core import bidi
from google.api_core.future import polling as polling_future
from google.api_core import exceptions
import google.api_core.retry
import grpc

from google.cloud.bigquery_storage_v1beta2 import exceptions as bqstorage_exceptions
from google.cloud.bigquery_storage_v1beta2 import types as gapic_types
from google.cloud.bigquery_storage_v1beta2.services import big_query_write

_LOGGER = logging.getLogger(__name__)
_RPC_ERROR_THREAD_NAME = "Thread-OnRpcTerminated"

# _open() takes between 0.25 and 0.4 seconds to be ready. Wait each loop before
# checking again. This interval was chosen to result in about 3 loops.
_WRITE_OPEN_INTERVAL = 0.08

# Use a default timeout that is quite long to avoid potential infinite loops,
# but still work for all expected requests
_DEFAULT_TIMEOUT = 600


def _wrap_as_exception(maybe_exception) -> Exception:
    """Wrap an object as a Python exception, if needed.
    Args:
        maybe_exception (Any): The object to wrap, usually a gRPC exception class.
    Returns:
         The argument itself if an instance of ``BaseException``, otherwise
         the argument represented as an instance of ``Exception`` (sub)class.
    """
    if isinstance(maybe_exception, grpc.RpcError):
        return exceptions.from_grpc_error(maybe_exception)
    elif isinstance(maybe_exception, BaseException):
        return maybe_exception

    return Exception(maybe_exception)


class AppendRowsStream(object):
    """A manager object which can append rows to a stream."""

    def __init__(
        self,
        client: big_query_write.BigQueryWriteClient,
        initial_request_template: gapic_types.AppendRowsRequest,
        metadata: Sequence[Tuple[str, str]] = (),
    ):
        """Construct a stream manager.

        Args:
            client:
                Client responsible for making requests.
            initial_request_template:
                Data to include in the first request sent to the stream. This
                must contain
                :attr:`google.cloud.bigquery_storage_v1beta2.types.AppendRowsRequest.write_stream`
                and
                :attr:`google.cloud.bigquery_storage_v1beta2.types.AppendRowsRequest.ProtoData.writer_schema`.
            metadata:
                Extra headers to include when sending the streaming request.
        """
        self._client = client
        self._closing = threading.Lock()
        self._closed = False
        self._close_callbacks = []
        self._futures_queue = queue.Queue()
        self._inital_request_template = initial_request_template
        self._metadata = metadata

        # Only one call to `send()` should attempt to open the RPC.
        self._opening = threading.Lock()

        self._rpc = None
        self._stream_name = None

        # The threads created in ``._open()``.
        self._consumer = None

    @property
    def is_active(self) -> bool:
        """bool: True if this manager is actively streaming.

        Note that ``False`` does not indicate this is complete shut down,
        just that it stopped getting new messages.
        """
        return self._consumer is not None and self._consumer.is_active

    def add_close_callback(self, callback: Callable):
        """Schedules a callable when the manager closes.
        Args:
            callback (Callable): The method to call.
        """
        self._close_callbacks.append(callback)

    def _open(
        self,
        initial_request: gapic_types.AppendRowsRequest,
        timeout: float = _DEFAULT_TIMEOUT,
    ) -> "AppendRowsFuture":
        """Open an append rows stream.

        This is automatically called by the first call to the
        :attr:`google.cloud.bigquery_storage_v1beta2.writer.AppendRowsStream.send`
        method.

        Args:
            initial_request:
                The initial request to start the stream. Must have
                :attr:`google.cloud.bigquery_storage_v1beta2.types.AppendRowsRequest.write_stream`
                and ``proto_rows.writer_schema.proto_descriptor`` and
                properties populated.
            timeout:
                How long (in seconds) to wait for the stream to be ready.

        Returns:
            A future, which can be used to process the response to the initial
            request when it arrives.
        """
        if self.is_active:
            raise ValueError("This manager is already open.")

        if self._closed:
            raise bqstorage_exceptions.StreamClosedError(
                "This manager has been closed and can not be re-used."
            )

        start_time = time.monotonic()
        request = gapic_types.AppendRowsRequest()
        gapic_types.AppendRowsRequest.copy_from(request, self._inital_request_template)
        request._pb.MergeFrom(initial_request._pb)
        self._stream_name = request.write_stream

        inital_response_future = AppendRowsFuture(self)
        self._futures_queue.put(inital_response_future)

        self._rpc = bidi.BidiRpc(
            self._client.append_rows,
            initial_request=request,
            # TODO: pass in retry and timeout. Blocked by
            # https://github.com/googleapis/python-api-core/issues/262
            metadata=tuple(
                itertools.chain(
                    self._metadata,
                    # This header is required so that the BigQuery Storage API
                    # knows which region to route the request to.
                    (("x-goog-request-params", f"write_stream={self._stream_name}"),),
                )
            ),
        )
        self._rpc.add_done_callback(self._on_rpc_done)

        self._consumer = bidi.BackgroundConsumer(self._rpc, self._on_response)
        self._consumer.start()

        # Make sure RPC has started before returning.
        # Without this, consumers may get:
        #
        # ValueError: Can not send() on an RPC that has never been open()ed.
        #
        # when they try to send a request.
        while not self._rpc.is_active and self._consumer.is_active:
            # Avoid 100% CPU while waiting for RPC to be ready.
            time.sleep(_WRITE_OPEN_INTERVAL)

            # TODO: Check retry.deadline instead of (per-request) timeout.
            # Blocked by
            # https://github.com/googleapis/python-api-core/issues/262
            if timeout is None:
                continue
            current_time = time.monotonic()
            if current_time - start_time > timeout:
                break

        # Something went wrong when opening the RPC.
        if not self._consumer.is_active:
            # TODO: Share the exception from _rpc.open(). Blocked by
            # https://github.com/googleapis/python-api-core/issues/268
            request_exception = exceptions.Unknown(
                "There was a problem opening the stream. "
                "Try turning on DEBUG level logs to see the error."
            )
            self.close(reason=request_exception)
            raise request_exception

        return inital_response_future

    def send(self, request: gapic_types.AppendRowsRequest) -> "AppendRowsFuture":
        """Send an append rows request to the open stream.

        Args:
            request:
                The request to add to the stream.

        Returns:
            A future, which can be used to process the response when it
            arrives.
        """
        if self._closed:
            raise bqstorage_exceptions.StreamClosedError(
                "This manager has been closed and can not be used."
            )

        # If the manager hasn't been openned yet, automatically open it. Only
        # one call to `send()` should attempt to open the RPC. After `_open()`,
        # the stream is active, unless something went wrong with the first call
        # to open, in which case this send will fail anyway due to a closed
        # RPC.
        with self._opening:
            if not self.is_active:
                return self._open(request)

        # For each request, we expect exactly one response (in order). Add a
        # future to the queue so that when the response comes, the callback can
        # pull it off and notify completion.
        future = AppendRowsFuture(self)
        self._futures_queue.put(future)
        self._rpc.send(request)
        return future

    def _on_response(self, response: gapic_types.AppendRowsResponse):
        """Process a response from a consumer callback."""
        # If the stream has closed, but somehow we still got a response message
        # back, discard it. The response futures queue has been drained, with
        # an exception reported.
        if self._closed:
            raise bqstorage_exceptions.StreamClosedError(
                f"Stream closed before receiving response: {response}"
            )

        # Since we have 1 response per request, if we get here from a response
        # callback, the queue should never be empty.
        future: AppendRowsFuture = self._futures_queue.get_nowait()
        if response.error.code:
            exc = exceptions.from_grpc_status(
                response.error.code, response.error.message
            )
            future.set_exception(exc)
        else:
            future.set_result(response)

    def close(self, reason: Optional[Exception] = None):
        """Stop consuming messages and shutdown all helper threads.

        This method is idempotent. Additional calls will have no effect.

        Args:
            reason: The reason to close this. If ``None``, this is considered
                an "intentional" shutdown. This is passed to the callbacks
                specified via :meth:`add_close_callback`.
        """
        self._shutdown(reason=reason)

    def _shutdown(self, reason: Optional[Exception] = None):
        """Run the actual shutdown sequence (stop the stream and all helper threads).

        Args:
            reason:
                The reason to close the stream. If ``None``, this is
                considered an "intentional" shutdown.
        """
        with self._closing:
            if self._closed:
                return

            # Stop consuming messages.
            if self.is_active:
                _LOGGER.debug("Stopping consumer.")
                self._consumer.stop()
            self._consumer = None

            if self._rpc is not None:
                self._rpc.close()
            self._rpc = None
            self._closed = True
            _LOGGER.debug("Finished stopping manager.")

            # We know that no new items will be added to the queue because
            # we've marked the stream as closed.
            while not self._futures_queue.empty():
                # Mark each future as failed. Since the consumer thread has
                # stopped (or at least is attempting to stop), we won't get
                # response callbacks to populate the remaining futures.
                future = self._futures_queue.get_nowait()
                if reason is None:
                    exc = bqstorage_exceptions.StreamClosedError(
                        "Stream closed before receiving a response."
                    )
                else:
                    exc = reason
                future.set_exception(exc)

            for callback in self._close_callbacks:
                callback(self, reason)

    def _on_rpc_done(self, future):
        """Triggered whenever the underlying RPC terminates without recovery.

        This is typically triggered from one of two threads: the background
        consumer thread (when calling ``recv()`` produces a non-recoverable
        error) or the grpc management thread (when cancelling the RPC).

        This method is *non-blocking*. It will start another thread to deal
        with shutting everything down. This is to prevent blocking in the
        background consumer and preventing it from being ``joined()``.
        """
        _LOGGER.info("RPC termination has signaled streaming pull manager shutdown.")
        error = _wrap_as_exception(future)
        thread = threading.Thread(
            name=_RPC_ERROR_THREAD_NAME, target=self._shutdown, kwargs={"reason": error}
        )
        thread.daemon = True
        thread.start()


class AppendRowsFuture(polling_future.PollingFuture):
    """Encapsulation of the asynchronous execution of an action.

    This object is returned from long-running BigQuery Storage API calls, and
    is the interface to determine the status of those calls.

    This object should not be created directly, but is returned by other
    methods in this library.
    """

    def __init__(self, manager: AppendRowsStream):
        super().__init__()
        self.__manager = manager
        self.__cancelled = False
        self._is_done = False

    def cancel(self):
        """Stops pulling messages and shutdowns the background thread consuming
         messages.

        The method does not block, it just triggers the shutdown and returns
        immediately. To block until the background stream is terminated, call
        :meth:`result()` after cancelling the future.
        """
        # NOTE: We circumvent the base future's self._state to track the cancellation
        # state, as this state has different meaning with streaming pull futures.
        # See: https://github.com/googleapis/python-pubsub/pull/397
        self.__cancelled = True
        return self.__manager.close()

    def cancelled(self):
        """
        returns:
            bool: ``True`` if the write stream has been cancelled.
        """
        return self.__cancelled

    def done(self, retry: Optional[google.api_core.retry.Retry] = None) -> bool:
        """Check the status of the future.

        Args:
            retry:
                Not used. Included for compatibility with base clase. Future
                status is updated by a background thread.

        Returns:
            ``True`` if the request has finished, otherwise ``False``.
        """
        # Consumer should call set_result or set_exception method, where this
        # gets set to True *after* first setting _result.
        #
        # Consumer runs in a background thread, but this access is thread-safe:
        # https://docs.python.org/3/faq/library.html#what-kinds-of-global-value-mutation-are-thread-safe
        return self._is_done

    def set_exception(self, exception):
        """Set the result of the future as being the given exception.

        Do not use this method, it should only be used internally by the library and its
        unit tests.
        """
        return_value = super().set_exception(exception=exception)
        self._is_done = True
        return return_value

    def set_result(self, result):
        """Set the return value of work associated with the future.

        Do not use this method, it should only be used internally by the library and its
        unit tests.
        """
        return_value = super().set_result(result=result)
        self._is_done = True
        return return_value
