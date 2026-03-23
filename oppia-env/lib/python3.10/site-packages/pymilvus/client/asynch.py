import abc
import inspect
import threading
from typing import Any, Callable, Optional

from pymilvus.exceptions import MilvusException
from pymilvus.grpc_gen import milvus_pb2

from .abstract import MutationResult
from .search_result import SearchResult
from .types import Status
from .utils import check_status


# TODO: remove this to a common util
def _parameter_is_empty(func: Callable):
    sig = inspect.signature(func)
    # todo: add more check to parameter, such as `default parameter`,
    #  `positional-only`, `positional-or-keyword`, `keyword-only`, `var-positional`, `var-keyword`
    # if len(params) == 0:
    # for param in params.values():
    #     if (param.kind == inspect.Parameter.POSITIONAL_ONLY or
    #             param.default == inspect._empty:
    return len(sig.parameters) == 0


class AbstractFuture:
    @abc.abstractmethod
    def result(self, **kwargs):
        """Return deserialized result.

        It's a synchronous interface. It will wait executing until
        server respond or timeout occur(if specified).

        This API is thread-safe.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def cancel(self):
        """Cancle gRPC future.

        This API is thread-safe.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def done(self):
        """Wait for request done.

        This API is thread-safe.
        """
        raise NotImplementedError


class Future(AbstractFuture):
    def __init__(
        self,
        future: Any,
        done_callback: Optional[Callable] = None,
        pre_exception: Optional[Callable] = None,
        **kwargs,
    ) -> None:
        self._future = future
        # keep compatible (such as Future(future, done_callback)), deprecated later
        self._done_cb = done_callback
        self._done_cb_list = []
        self.add_callback(done_callback)
        self._condition = threading.Condition()
        self._canceled = False
        self._done = False
        self._response = None
        self._results = None
        self._exception = pre_exception
        self._callback_called = False  # callback function should be called only once
        self._kwargs = kwargs

    def add_callback(self, func: Callable):
        self._done_cb_list.append(func)

    def __del__(self) -> None:
        self._future = None

    @abc.abstractmethod
    def on_response(self, response: Callable):
        """Parse response from gRPC server and return results."""
        raise NotImplementedError

    def _callback(self):
        if not self._callback_called:
            for cb in self._done_cb_list:
                if cb:
                    # necessary to check parameter signature of cb?
                    if isinstance(self._results, tuple):
                        cb(*self._results)
                    elif _parameter_is_empty(cb):
                        cb()
                    elif self._results is not None:
                        cb(self._results)
                    else:
                        raise MilvusException(message="callback function is not legal!")
        self._callback_called = True

    def result(self, **kwargs):
        self.exception()
        with self._condition:
            # future not finished. wait callback being called.
            to = kwargs.get("timeout")
            if to is None:
                to = self._kwargs.get("timeout", None)

            if self._future and self._results is None:
                try:
                    self._response = self._future.result(timeout=to)
                except Exception as e:
                    raise MilvusException(message=str(e)) from e
                self._results = self.on_response(self._response)

                self._callback()

            self._done = True

            self._condition.notify_all()

        self.exception()
        if kwargs.get("raw", False) is True:
            # just return response object received from gRPC
            return self._response

        if self._results:
            return self._results
        return self.on_response(self._response)

    def cancel(self):
        with self._condition:
            if self._future:
                self._future.cancel()
            self._condition.notify_all()

    def is_done(self):
        return self._done

    def done(self):
        with self._condition:
            if self._future and self._results is None:
                try:
                    self._response = self._future.result()
                    self._results = self.on_response(self._response)
                    self._callback()  # https://github.com/milvus-io/milvus/issues/6160
                except Exception as e:
                    self._exception = e

            self._done = True

            self._condition.notify_all()

    def exception(self):
        if self._exception:
            raise self._exception
        if self._future:
            self._future.exception()


class SearchFuture(Future):
    def on_response(self, response: milvus_pb2.SearchResults):
        check_status(response.status)
        return SearchResult(response.results, status=response.status)


class MutationFuture(Future):
    def on_response(self, response: Any):
        check_status(response.status)
        return MutationResult(response)


class CreateIndexFuture(Future):
    def on_response(self, response: Any):
        check_status(response)
        return Status(response.code, response.reason)


class CreateFlatIndexFuture(AbstractFuture):
    def __init__(
        self,
        res: Any,
        done_callback: Optional[Callable] = None,
        pre_exception: Optional[Callable] = None,
    ) -> None:
        self._results = res
        self._done_cb = done_callback
        self._done_cb_list = []
        self.add_callback(done_callback)
        self._condition = threading.Condition()
        self._exception = pre_exception

    def add_callback(self, func: Callable):
        self._done_cb_list.append(func)

    def __del__(self) -> None:
        self._results = None

    def on_response(self, response: Any):
        pass

    def result(self):
        self.exception()
        with self._condition:
            for cb in self._done_cb_list:
                if cb:
                    # necessary to check parameter signature of cb?
                    if isinstance(self._results, tuple):
                        cb(*self._results)
                    elif _parameter_is_empty(cb):
                        cb()
                    elif self._results is not None:
                        cb(self._results)
                    else:
                        raise MilvusException(message="callback function is not legal!")
            return self._results

    def cancel(self):
        with self._condition:
            self._condition.notify_all()

    def is_done(self):
        return True

    def done(self):
        with self._condition:
            self._condition.notify_all()

    def exception(self):
        if self._exception:
            raise self._exception


class FlushFuture(Future):
    def on_response(self, response: Any):
        check_status(response.status)


class LoadCollectionFuture(Future):
    def on_response(self, response: Any):
        check_status(response.status)


class LoadPartitionsFuture(Future):
    def on_response(self, response: Any):
        check_status(response.status)
