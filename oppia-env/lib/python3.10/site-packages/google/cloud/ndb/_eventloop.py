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

"""Event loop for running callbacks.

This should handle both asynchronous ``ndb`` objects and arbitrary callbacks.
"""
import collections
import logging
import uuid
import time

import queue

from google.cloud.ndb import utils

log = logging.getLogger(__name__)

_Event = collections.namedtuple("_Event", ("when", "callback", "args", "kwargs"))


class EventLoop(object):
    """An event loop.

    Instances of ``EventLoop`` are used to coordinate single threaded execution
    of tasks and RPCs scheduled asynchronously.

    Since the the ``EventLoop`` runs in the same thread as user code, it's best
    to think of it as running tasks "on demand". Generally, when some piece of
    code needs a result from a future, the future's
    :meth:`~tasklets.Future.wait` method will end up calling
    :meth:`~EventLoop.run1`, which will attempt to execute a single task that
    is queued in the loop. The future will continue to call
    :meth:`~EventLoop.run1` until one of the callbacks ultimately puts that
    future into it's ``done`` state, either by setting the result or setting an
    exception.

    The :meth:`~EventLoop.run` method, which consumes the entire queue before
    returning, is usually only run when the end of the containing context is
    reached. At this point, there can't be any code waiting for results from
    the event loop, so any tasks still queued on the loop at this point, are
    just being run without regard for their results. For example, a request
    handler for a web application might write some objects to Datastore. This
    makes sure those writes complete before we exit from the current context.

    Ultimately, all data flows from calls to gRPC. gRPC handles asynchronous
    API calls in its own handler thread, so we use a synchronized queue to
    coordinate with gRPC. When a future from a gRPC call is added with
    :meth:`~EventLoop.queue_rpc`, a done callback is added to the gRPC future
    which causes it to push itself onto the synchronized queue when it is
    finished, so we can process the result here in the event loop. From the
    finished gRPC call, results will flow back up through whatever series of
    other futures were waiting on those results and results derived from those
    results.

    Currently, these are the separate queues used by the event loop in the
    order they are checked by :meth:`~EventLoop.run1`. For each call to
    :meth:`~EventLoop.run1`, the first thing it finds is called:

        current: These callbacks are called first, if there are any. Currently
            this is used to schedule calls to
            :meth:`tasklets.TaskletFuture._advance_tasklet` when it's time to
            send a tasklet a value that it was previously waiting on.

        idlers: Effectively, these are the same as ``current``, but just get
            called afterwards. These currently are used for batching certain
            calls to the back end. For example, if you call
            :func:`_datastore_api.lookup`, a new batch is created, and the key
            you're requesting is added to it. Subsequent calls add keys to the
            same batch. When the batch is initialized, an idler is added to the
            event loop which issues a single Datastore Lookup call for the
            entire batch. Because the event loop is called "on demand", this
            means this idler won't get called until something needs a result
            out of the event loop, and the actual gRPC call is made at that
            time.

        queue: These are callbacks that are supposed to be run at (or after) a
            certain time. This is used by :function:`tasklets.sleep`.

        rpcs: If all other queues are empty, and we are waiting on results of a
            gRPC call, then we'll call :method:`queue.Queue.get` on the
            synchronized queue, :attr:`~EventLoop.rpc_results`, to get the next
            finished gRPC call. This is the only point where
            :method:`~EventLoop.run1` might block. If the only thing to do is
            wait for a gRPC call to finish, we may as well wait.

    Attributes:
        current (deque): a FIFO list of (callback, args, kwds). These callbacks
            run immediately when the eventloop runs. Used by tasklets to
            schedule calls to :meth:`tasklets.TaskletFuture._advance_tasklet`.
        idlers (deque): a FIFO list of (callback, args, kwds). These callbacks
            run only when no other RPCs need to be fired first. Used for
            batching calls to the Datastore back end.
        inactive (int): Number of consecutive idlers that were noops. Reset
            to 0 whenever work is done by any callback, not necessarily by an
            idler. Not currently used.
        queue (list): a sorted list of (absolute time in sec, callback, args,
            kwds), sorted by time. These callbacks run only after the said
            time. Used by :func:`tasklets.sleep`.
        rpcs (dict): a map from RPC to callback. Callback is called when the
            RPC finishes.
        rpc_results (queue.Queue): A synchronized queue used to coordinate with
            gRPC. As gRPC futures that we're waiting on are finished, they will
            get added to this queue and then processed by the event loop.
    """

    def __init__(self):
        self.current = collections.deque()
        self.idlers = collections.deque()
        self.inactive = 0
        self.queue = []
        self.rpcs = {}
        self.rpc_results = queue.Queue()

    def clear(self):
        """Remove all pending events without running any."""
        while self.current or self.idlers or self.queue or self.rpcs:
            current = self.current
            idlers = self.idlers
            queue = self.queue
            rpcs = self.rpcs
            utils.logging_debug(log, "Clearing stale EventLoop instance...")
            if current:
                utils.logging_debug(log, "  current = {}", current)
            if idlers:
                utils.logging_debug(log, "  idlers = {}", idlers)
            if queue:
                utils.logging_debug(log, "  queue = {}", queue)
            if rpcs:
                utils.logging_debug(log, "  rpcs = {}", rpcs)
            self.__init__()
            current.clear()
            idlers.clear()
            queue[:] = []
            rpcs.clear()
            utils.logging_debug(log, "Cleared")

    def insort_event_right(self, event):
        """Insert event in queue with sorting.

        This function assumes the queue is already sorted by ``event.when`` and
        inserts ``event`` in the queue, maintaining the sort.

        For events with same `event.when`, new events are inserted to the
        right, to keep FIFO order.

        Args:
            event (_Event): The event to insert.
        """
        queue = self.queue
        low = 0
        high = len(queue)
        while low < high:
            mid = (low + high) // 2
            if event.when < queue[mid].when:
                high = mid
            else:
                low = mid + 1
        queue.insert(low, event)

    def call_soon(self, callback, *args, **kwargs):
        """Schedule a function to be called soon, without a delay.

        Arguments:
            callback (callable): The function to eventually call.
            *args: Positional arguments to be passed to callback.
            **kwargs: Keyword arguments to be passed to callback.
        """
        self.current.append((callback, args, kwargs))

    def queue_call(self, delay, callback, *args, **kwargs):
        """Schedule a function call at a specific time in the future.

        Arguments:
            delay (float): Time in seconds to delay running the callback.
                Times over a billion seconds are assumed to be absolute
                timestamps rather than delays.
            callback (callable): The function to eventually call.
            *args: Positional arguments to be passed to callback.
            **kwargs: Keyword arguments to be passed to callback.
        """
        when = time.time() + delay if delay < 1e9 else delay
        event = _Event(when, callback, args, kwargs)
        self.insort_event_right(event)

    def queue_rpc(self, rpc, callback):
        """Add a gRPC call to the queue.

        Args:
            rpc (:class:`_remote.RemoteCall`): The future for the gRPC
                call.
            callback (Callable[[:class:`_remote.RemoteCall`], None]):
                Callback function to execute when gRPC call has finished.

        gRPC handles its asynchronous calls in a separate processing thread, so
        we add our own callback to `rpc` which adds `rpc` to a synchronized
        queue when it has finished. The event loop consumes the synchronized
        queue and calls `callback` with the finished gRPC future.
        """
        rpc_id = uuid.uuid1()
        self.rpcs[rpc_id] = callback

        def rpc_callback(rpc):
            self.rpc_results.put((rpc_id, rpc))

        rpc.add_done_callback(rpc_callback)

    def add_idle(self, callback, *args, **kwargs):
        """Add an idle callback.

        An idle callback is a low priority task which is executed when
        there aren't other events scheduled for immediate execution.

        An idle callback can return True, False or None. These mean:

        - None: remove the callback (don't reschedule)
        - False: the callback did no work; reschedule later
        - True: the callback did some work; reschedule soon

        If the callback raises an exception, the traceback is logged and
        the callback is removed.

        Arguments:
            callback (callable): The function to eventually call.
            *args: Positional arguments to be passed to callback.
            **kwargs: Keyword arguments to be passed to callback.
        """
        self.idlers.append((callback, args, kwargs))

    def run_idle(self):
        """Run one of the idle callbacks.

        Returns:
            bool: Indicates if an idle callback was called.
        """
        if not self.idlers or self.inactive >= len(self.idlers):
            return False
        idler = self.idlers.popleft()
        callback, args, kwargs = idler
        utils.logging_debug(log, "idler: {}", callback.__name__)
        result = callback(*args, **kwargs)

        # See add_idle() for meaning of callback return value.
        if result is None:
            utils.logging_debug(log, "idler {} removed", callback.__name__)
        else:
            if result:
                self.inactive = 0
            else:
                self.inactive += 1
            self.idlers.append(idler)
        return True

    def _run_current(self):
        """Run one current item.

        Returns:
            bool: Indicates if an idle callback was called.
        """
        if not self.current:
            return False

        self.inactive = 0
        callback, args, kwargs = self.current.popleft()
        callback(*args, **kwargs)
        return True

    def run0(self):
        """Run one item (a callback or an RPC wait_any).

        Returns:
            float: A time to sleep if something happened (may be 0);
              None if all queues are empty.
        """
        if self._run_current() or self.run_idle():
            return 0

        delay = None
        if self.queue:
            delay = self.queue[0][0] - time.time()
            if delay <= 0:
                self.inactive = 0
                _, callback, args, kwargs = self.queue.pop(0)
                utils.logging_debug(log, "event: {}", callback.__name__)
                callback(*args, **kwargs)
                return 0

        if self.rpcs:
            # Avoid circular import
            from google.cloud.ndb import context as context_module

            context = context_module.get_toplevel_context()

            # This potentially blocks, waiting for an rpc to finish and put its
            # result on the queue. Functionally equivalent to the ``wait_any``
            # call that was used here in legacy NDB.
            start_time = time.time()
            rpc_id, rpc = self.rpc_results.get()
            elapsed = time.time() - start_time
            utils.logging_debug(log, "Blocked for {}s awaiting RPC results.", elapsed)
            context.wait_time += elapsed

            callback = self.rpcs.pop(rpc_id)
            callback(rpc)
            return 0

        return delay

    def run1(self):
        """Run one item (a callback or an RPC wait_any) or sleep.

        Returns:
            bool: True if something happened; False if all queues are empty.
        """
        delay = self.run0()
        if delay is None:
            return False
        if delay > 0:
            time.sleep(delay)
        return True

    def run(self):
        """Run until there's nothing left to do."""
        self.inactive = 0
        while True:
            if not self.run1():
                break


def get_event_loop():
    """Get the current event loop.

    This function should be called within a context established by
    :func:`~google.cloud.ndb.ndb_context`.

    Returns:
        EventLoop: The event loop for the current context.
    """
    # Prevent circular import in Python 2.7
    from google.cloud.ndb import context as context_module

    context = context_module.get_context()
    return context.eventloop


def add_idle(callback, *args, **kwargs):
    """Calls :method:`EventLoop.add_idle` on current event loop."""
    loop = get_event_loop()
    loop.add_idle(callback, *args, **kwargs)


def call_soon(callback, *args, **kwargs):
    """Calls :method:`EventLoop.call_soon` on current event loop."""
    loop = get_event_loop()
    loop.call_soon(callback, *args, **kwargs)


def queue_call(delay, callback, *args, **kwargs):
    """Calls :method:`EventLoop.queue_call` on current event loop."""
    loop = get_event_loop()
    loop.queue_call(delay, callback, *args, **kwargs)


def queue_rpc(future, rpc):
    """Calls :method:`EventLoop.queue_rpc` on current event loop."""
    loop = get_event_loop()
    loop.queue_rpc(future, rpc)


def run():
    """Calls :method:`EventLoop.run` on current event loop."""
    loop = get_event_loop()
    loop.run()


def run1():
    """Calls :method:`EventLoop.run1` on current event loop."""
    loop = get_event_loop()
    return loop.run1()
