# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
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
#
from __future__ import annotations

from typing import MutableMapping, MutableSequence

from google.protobuf import duration_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
import proto  # type: ignore

from google.cloud.tasks_v2beta2.types import target

__protobuf__ = proto.module(
    package="google.cloud.tasks.v2beta2",
    manifest={
        "Queue",
        "RateLimits",
        "RetryConfig",
        "QueueStats",
    },
)


class Queue(proto.Message):
    r"""A queue is a container of related tasks. Queues are
    configured to manage how those tasks are dispatched.
    Configurable properties include rate limits, retry options,
    target types, and others.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            Caller-specified and required in
            [CreateQueue][google.cloud.tasks.v2beta2.CloudTasks.CreateQueue],
            after which it becomes output only.

            The queue name.

            The queue name must have the following format:
            ``projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID``

            -  ``PROJECT_ID`` can contain letters ([A-Za-z]), numbers
               ([0-9]), hyphens (-), colons (:), or periods (.). For
               more information, see `Identifying
               projects <https://cloud.google.com/resource-manager/docs/creating-managing-projects#identifying_projects>`__
            -  ``LOCATION_ID`` is the canonical ID for the queue's
               location. The list of available locations can be obtained
               by calling
               [ListLocations][google.cloud.location.Locations.ListLocations].
               For more information, see
               https://cloud.google.com/about/locations/.
            -  ``QUEUE_ID`` can contain letters ([A-Za-z]), numbers
               ([0-9]), or hyphens (-). The maximum length is 100
               characters.
        app_engine_http_target (google.cloud.tasks_v2beta2.types.AppEngineHttpTarget):
            App Engine HTTP target.

            An App Engine queue is a queue that has an
            [AppEngineHttpTarget][google.cloud.tasks.v2beta2.AppEngineHttpTarget].

            This field is a member of `oneof`_ ``target_type``.
        pull_target (google.cloud.tasks_v2beta2.types.PullTarget):
            Pull target.

            A pull queue is a queue that has a
            [PullTarget][google.cloud.tasks.v2beta2.PullTarget].

            This field is a member of `oneof`_ ``target_type``.
        http_target (google.cloud.tasks_v2beta2.types.HttpTarget):
            An http_target is used to override the target values for
            HTTP tasks.

            This field is a member of `oneof`_ ``target_type``.
        rate_limits (google.cloud.tasks_v2beta2.types.RateLimits):
            Rate limits for task dispatches.

            [rate_limits][google.cloud.tasks.v2beta2.Queue.rate_limits]
            and
            [retry_config][google.cloud.tasks.v2beta2.Queue.retry_config]
            are related because they both control task attempts however
            they control how tasks are attempted in different ways:

            -  [rate_limits][google.cloud.tasks.v2beta2.Queue.rate_limits]
               controls the total rate of dispatches from a queue (i.e.
               all traffic dispatched from the queue, regardless of
               whether the dispatch is from a first attempt or a retry).
            -  [retry_config][google.cloud.tasks.v2beta2.Queue.retry_config]
               controls what happens to particular a task after its
               first attempt fails. That is,
               [retry_config][google.cloud.tasks.v2beta2.Queue.retry_config]
               controls task retries (the second attempt, third attempt,
               etc).
        retry_config (google.cloud.tasks_v2beta2.types.RetryConfig):
            Settings that determine the retry behavior.

            -  For tasks created using Cloud Tasks: the queue-level
               retry settings apply to all tasks in the queue that were
               created using Cloud Tasks. Retry settings cannot be set
               on individual tasks.
            -  For tasks created using the App Engine SDK: the
               queue-level retry settings apply to all tasks in the
               queue which do not have retry settings explicitly set on
               the task and were created by the App Engine SDK. See `App
               Engine
               documentation <https://cloud.google.com/appengine/docs/standard/python/taskqueue/push/retrying-tasks>`__.
        state (google.cloud.tasks_v2beta2.types.Queue.State):
            Output only. The state of the queue.

            ``state`` can only be changed by called
            [PauseQueue][google.cloud.tasks.v2beta2.CloudTasks.PauseQueue],
            [ResumeQueue][google.cloud.tasks.v2beta2.CloudTasks.ResumeQueue],
            or uploading
            `queue.yaml/xml <https://cloud.google.com/appengine/docs/python/config/queueref>`__.
            [UpdateQueue][google.cloud.tasks.v2beta2.CloudTasks.UpdateQueue]
            cannot be used to change ``state``.
        purge_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The last time this queue was purged.

            All tasks that were
            [created][google.cloud.tasks.v2beta2.Task.create_time]
            before this time were purged.

            A queue can be purged using
            [PurgeQueue][google.cloud.tasks.v2beta2.CloudTasks.PurgeQueue],
            the `App Engine Task Queue SDK, or the Cloud
            Console <https://cloud.google.com/appengine/docs/standard/python/taskqueue/push/deleting-tasks-and-queues#purging_all_tasks_from_a_queue>`__.

            Purge time will be truncated to the nearest microsecond.
            Purge time will be unset if the queue has never been purged.
        task_ttl (google.protobuf.duration_pb2.Duration):
            The maximum amount of time that a task will be retained in
            this queue.

            Queues created by Cloud Tasks have a default ``task_ttl`` of
            31 days. After a task has lived for ``task_ttl``, the task
            will be deleted regardless of whether it was dispatched or
            not.

            The ``task_ttl`` for queues created via queue.yaml/xml is
            equal to the maximum duration because there is a `storage
            quota <https://cloud.google.com/appengine/quotas#Task_Queue>`__
            for these queues. To view the maximum valid duration, see
            the documentation for [Duration][google.protobuf.Duration].
        tombstone_ttl (google.protobuf.duration_pb2.Duration):
            The task tombstone time to live (TTL).

            After a task is deleted or completed, the task's tombstone
            is retained for the length of time specified by
            ``tombstone_ttl``. The tombstone is used by task
            de-duplication; another task with the same name can't be
            created until the tombstone has expired. For more
            information about task de-duplication, see the documentation
            for
            [CreateTaskRequest][google.cloud.tasks.v2beta2.CreateTaskRequest.task].

            Queues created by Cloud Tasks have a default
            ``tombstone_ttl`` of 1 hour.
        stats (google.cloud.tasks_v2beta2.types.QueueStats):
            Output only. The realtime, informational
            statistics for a queue. In order to receive the
            statistics the caller should include this field
            in the FieldMask.
    """

    class State(proto.Enum):
        r"""State of the queue.

        Values:
            STATE_UNSPECIFIED (0):
                Unspecified state.
            RUNNING (1):
                The queue is running. Tasks can be dispatched.

                If the queue was created using Cloud Tasks and the queue has
                had no activity (method calls or task dispatches) for 30
                days, the queue may take a few minutes to re-activate. Some
                method calls may return
                [NOT_FOUND][google.rpc.Code.NOT_FOUND] and tasks may not be
                dispatched for a few minutes until the queue has been
                re-activated.
            PAUSED (2):
                Tasks are paused by the user. If the queue is paused then
                Cloud Tasks will stop delivering tasks from it, but more
                tasks can still be added to it by the user. When a pull
                queue is paused, all
                [LeaseTasks][google.cloud.tasks.v2beta2.CloudTasks.LeaseTasks]
                calls will return a
                [FAILED_PRECONDITION][google.rpc.Code.FAILED_PRECONDITION].
            DISABLED (3):
                The queue is disabled.

                A queue becomes ``DISABLED`` when
                `queue.yaml <https://cloud.google.com/appengine/docs/python/config/queueref>`__
                or
                `queue.xml <https://cloud.google.com/appengine/docs/standard/java/config/queueref>`__
                is uploaded which does not contain the queue. You cannot
                directly disable a queue.

                When a queue is disabled, tasks can still be added to a
                queue but the tasks are not dispatched and
                [LeaseTasks][google.cloud.tasks.v2beta2.CloudTasks.LeaseTasks]
                calls return a ``FAILED_PRECONDITION`` error.

                To permanently delete this queue and all of its tasks, call
                [DeleteQueue][google.cloud.tasks.v2beta2.CloudTasks.DeleteQueue].
        """
        STATE_UNSPECIFIED = 0
        RUNNING = 1
        PAUSED = 2
        DISABLED = 3

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    app_engine_http_target: target.AppEngineHttpTarget = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="target_type",
        message=target.AppEngineHttpTarget,
    )
    pull_target: target.PullTarget = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="target_type",
        message=target.PullTarget,
    )
    http_target: target.HttpTarget = proto.Field(
        proto.MESSAGE,
        number=17,
        oneof="target_type",
        message=target.HttpTarget,
    )
    rate_limits: "RateLimits" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="RateLimits",
    )
    retry_config: "RetryConfig" = proto.Field(
        proto.MESSAGE,
        number=6,
        message="RetryConfig",
    )
    state: State = proto.Field(
        proto.ENUM,
        number=7,
        enum=State,
    )
    purge_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=8,
        message=timestamp_pb2.Timestamp,
    )
    task_ttl: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=9,
        message=duration_pb2.Duration,
    )
    tombstone_ttl: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=10,
        message=duration_pb2.Duration,
    )
    stats: "QueueStats" = proto.Field(
        proto.MESSAGE,
        number=16,
        message="QueueStats",
    )


class RateLimits(proto.Message):
    r"""Rate limits.

    This message determines the maximum rate that tasks can be
    dispatched by a queue, regardless of whether the dispatch is a first
    task attempt or a retry.

    Note: The debugging command,
    [RunTask][google.cloud.tasks.v2beta2.CloudTasks.RunTask], will run a
    task even if the queue has reached its
    [RateLimits][google.cloud.tasks.v2beta2.RateLimits].

    Attributes:
        max_tasks_dispatched_per_second (float):
            The maximum rate at which tasks are dispatched from this
            queue.

            If unspecified when the queue is created, Cloud Tasks will
            pick the default.

            -  For [App Engine
               queues][google.cloud.tasks.v2beta2.AppEngineHttpTarget],
               the maximum allowed value is 500.
            -  This field is output only for [pull
               queues][google.cloud.tasks.v2beta2.PullTarget]. In
               addition to the ``max_tasks_dispatched_per_second``
               limit, a maximum of 10 QPS of
               [LeaseTasks][google.cloud.tasks.v2beta2.CloudTasks.LeaseTasks]
               requests are allowed per pull queue.

            This field has the same meaning as `rate in
            queue.yaml/xml <https://cloud.google.com/appengine/docs/standard/python/config/queueref#rate>`__.
        max_burst_size (int):
            The max burst size.

            Max burst size limits how fast tasks in queue are processed
            when many tasks are in the queue and the rate is high. This
            field allows the queue to have a high rate so processing
            starts shortly after a task is enqueued, but still limits
            resource usage when many tasks are enqueued in a short
            period of time.

            The `token
            bucket <https://wikipedia.org/wiki/Token_Bucket>`__
            algorithm is used to control the rate of task dispatches.
            Each queue has a token bucket that holds tokens, up to the
            maximum specified by ``max_burst_size``. Each time a task is
            dispatched, a token is removed from the bucket. Tasks will
            be dispatched until the queue's bucket runs out of tokens.
            The bucket will be continuously refilled with new tokens
            based on
            [max_dispatches_per_second][RateLimits.max_dispatches_per_second].

            The default value of ``max_burst_size`` is picked by Cloud
            Tasks based on the value of
            [max_dispatches_per_second][RateLimits.max_dispatches_per_second].

            The maximum value of ``max_burst_size`` is 500.

            For App Engine queues that were created or updated using
            ``queue.yaml/xml``, ``max_burst_size`` is equal to
            `bucket_size <https://cloud.google.com/appengine/docs/standard/python/config/queueref#bucket_size>`__.
            If
            [UpdateQueue][google.cloud.tasks.v2beta2.CloudTasks.UpdateQueue]
            is called on a queue without explicitly setting a value for
            ``max_burst_size``, ``max_burst_size`` value will get
            updated if
            [UpdateQueue][google.cloud.tasks.v2beta2.CloudTasks.UpdateQueue]
            is updating
            [max_dispatches_per_second][RateLimits.max_dispatches_per_second].
        max_concurrent_tasks (int):
            The maximum number of concurrent tasks that Cloud Tasks
            allows to be dispatched for this queue. After this threshold
            has been reached, Cloud Tasks stops dispatching tasks until
            the number of concurrent requests decreases.

            If unspecified when the queue is created, Cloud Tasks will
            pick the default.

            The maximum allowed value is 5,000.

            This field is output only for [pull
            queues][google.cloud.tasks.v2beta2.PullTarget] and always
            -1, which indicates no limit. No other queue types can have
            ``max_concurrent_tasks`` set to -1.

            This field has the same meaning as `max_concurrent_requests
            in
            queue.yaml/xml <https://cloud.google.com/appengine/docs/standard/python/config/queueref#max_concurrent_requests>`__.
    """

    max_tasks_dispatched_per_second: float = proto.Field(
        proto.DOUBLE,
        number=1,
    )
    max_burst_size: int = proto.Field(
        proto.INT32,
        number=2,
    )
    max_concurrent_tasks: int = proto.Field(
        proto.INT32,
        number=3,
    )


class RetryConfig(proto.Message):
    r"""Retry config.

    These settings determine how a failed task attempt is retried.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        max_attempts (int):
            The maximum number of attempts for a task.

            Cloud Tasks will attempt the task ``max_attempts`` times
            (that is, if the first attempt fails, then there will be
            ``max_attempts - 1`` retries). Must be > 0.

            This field is a member of `oneof`_ ``num_attempts``.
        unlimited_attempts (bool):
            If true, then the number of attempts is
            unlimited.

            This field is a member of `oneof`_ ``num_attempts``.
        max_retry_duration (google.protobuf.duration_pb2.Duration):
            If positive, ``max_retry_duration`` specifies the time limit
            for retrying a failed task, measured from when the task was
            first attempted. Once ``max_retry_duration`` time has passed
            *and* the task has been attempted
            [max_attempts][google.cloud.tasks.v2beta2.RetryConfig.max_attempts]
            times, no further attempts will be made and the task will be
            deleted.

            If zero, then the task age is unlimited.

            If unspecified when the queue is created, Cloud Tasks will
            pick the default.

            This field is output only for [pull
            queues][google.cloud.tasks.v2beta2.PullTarget].

            ``max_retry_duration`` will be truncated to the nearest
            second.

            This field has the same meaning as `task_age_limit in
            queue.yaml/xml <https://cloud.google.com/appengine/docs/standard/python/config/queueref#retry_parameters>`__.
        min_backoff (google.protobuf.duration_pb2.Duration):
            A task will be
            [scheduled][google.cloud.tasks.v2beta2.Task.schedule_time]
            for retry between
            [min_backoff][google.cloud.tasks.v2beta2.RetryConfig.min_backoff]
            and
            [max_backoff][google.cloud.tasks.v2beta2.RetryConfig.max_backoff]
            duration after it fails, if the queue's
            [RetryConfig][google.cloud.tasks.v2beta2.RetryConfig]
            specifies that the task should be retried.

            If unspecified when the queue is created, Cloud Tasks will
            pick the default.

            This field is output only for [pull
            queues][google.cloud.tasks.v2beta2.PullTarget].

            ``min_backoff`` will be truncated to the nearest second.

            This field has the same meaning as `min_backoff_seconds in
            queue.yaml/xml <https://cloud.google.com/appengine/docs/standard/python/config/queueref#retry_parameters>`__.
        max_backoff (google.protobuf.duration_pb2.Duration):
            A task will be
            [scheduled][google.cloud.tasks.v2beta2.Task.schedule_time]
            for retry between
            [min_backoff][google.cloud.tasks.v2beta2.RetryConfig.min_backoff]
            and
            [max_backoff][google.cloud.tasks.v2beta2.RetryConfig.max_backoff]
            duration after it fails, if the queue's
            [RetryConfig][google.cloud.tasks.v2beta2.RetryConfig]
            specifies that the task should be retried.

            If unspecified when the queue is created, Cloud Tasks will
            pick the default.

            This field is output only for [pull
            queues][google.cloud.tasks.v2beta2.PullTarget].

            ``max_backoff`` will be truncated to the nearest second.

            This field has the same meaning as `max_backoff_seconds in
            queue.yaml/xml <https://cloud.google.com/appengine/docs/standard/python/config/queueref#retry_parameters>`__.
        max_doublings (int):
            The time between retries will double ``max_doublings``
            times.

            A task's retry interval starts at
            [min_backoff][google.cloud.tasks.v2beta2.RetryConfig.min_backoff],
            then doubles ``max_doublings`` times, then increases
            linearly, and finally retries at intervals of
            [max_backoff][google.cloud.tasks.v2beta2.RetryConfig.max_backoff]
            up to
            [max_attempts][google.cloud.tasks.v2beta2.RetryConfig.max_attempts]
            times.

            For example, if
            [min_backoff][google.cloud.tasks.v2beta2.RetryConfig.min_backoff]
            is 10s,
            [max_backoff][google.cloud.tasks.v2beta2.RetryConfig.max_backoff]
            is 300s, and ``max_doublings`` is 3, then the a task will
            first be retried in 10s. The retry interval will double
            three times, and then increase linearly by 2^3 \* 10s.
            Finally, the task will retry at intervals of
            [max_backoff][google.cloud.tasks.v2beta2.RetryConfig.max_backoff]
            until the task has been attempted
            [max_attempts][google.cloud.tasks.v2beta2.RetryConfig.max_attempts]
            times. Thus, the requests will retry at 10s, 20s, 40s, 80s,
            160s, 240s, 300s, 300s, ....

            If unspecified when the queue is created, Cloud Tasks will
            pick the default.

            This field is output only for [pull
            queues][google.cloud.tasks.v2beta2.PullTarget].

            This field has the same meaning as `max_doublings in
            queue.yaml/xml <https://cloud.google.com/appengine/docs/standard/python/config/queueref#retry_parameters>`__.
    """

    max_attempts: int = proto.Field(
        proto.INT32,
        number=1,
        oneof="num_attempts",
    )
    unlimited_attempts: bool = proto.Field(
        proto.BOOL,
        number=2,
        oneof="num_attempts",
    )
    max_retry_duration: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=3,
        message=duration_pb2.Duration,
    )
    min_backoff: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=4,
        message=duration_pb2.Duration,
    )
    max_backoff: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=5,
        message=duration_pb2.Duration,
    )
    max_doublings: int = proto.Field(
        proto.INT32,
        number=6,
    )


class QueueStats(proto.Message):
    r"""Statistics for a queue.

    Attributes:
        tasks_count (int):
            Output only. An estimation of the number of
            tasks in the queue, that is, the tasks in the
            queue that haven't been executed, the tasks in
            the queue which the queue has dispatched but has
            not yet received a reply for, and the failed
            tasks that the queue is retrying.
        oldest_estimated_arrival_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. An estimation of the nearest
            time in the future where a task in the queue is
            scheduled to be executed.
        executed_last_minute_count (int):
            Output only. The number of tasks that the
            queue has dispatched and received a reply for
            during the last minute. This variable counts
            both successful and non-successful executions.
        concurrent_dispatches_count (int):
            Output only. The number of requests that the
            queue has dispatched but has not received a
            reply for yet.
        effective_execution_rate (float):
            Output only. The current maximum number of
            tasks per second executed by the queue. The
            maximum value of this variable is controlled by
            the RateLimits of the Queue. However, this value
            could be less to avoid overloading the endpoints
            tasks in the queue are targeting.
    """

    tasks_count: int = proto.Field(
        proto.INT64,
        number=1,
    )
    oldest_estimated_arrival_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    executed_last_minute_count: int = proto.Field(
        proto.INT64,
        number=3,
    )
    concurrent_dispatches_count: int = proto.Field(
        proto.INT64,
        number=4,
    )
    effective_execution_rate: float = proto.Field(
        proto.DOUBLE,
        number=5,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
