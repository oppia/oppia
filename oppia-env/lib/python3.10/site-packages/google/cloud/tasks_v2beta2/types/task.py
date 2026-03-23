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

from google.protobuf import timestamp_pb2  # type: ignore
from google.rpc import status_pb2  # type: ignore
import proto  # type: ignore

from google.cloud.tasks_v2beta2.types import target

__protobuf__ = proto.module(
    package="google.cloud.tasks.v2beta2",
    manifest={
        "Task",
        "TaskStatus",
        "AttemptStatus",
    },
)


class Task(proto.Message):
    r"""A unit of scheduled work.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            Optionally caller-specified in
            [CreateTask][google.cloud.tasks.v2beta2.CloudTasks.CreateTask].

            The task name.

            The task name must have the following format:
            ``projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID/tasks/TASK_ID``

            -  ``PROJECT_ID`` can contain letters ([A-Za-z]), numbers
               ([0-9]), hyphens (-), colons (:), or periods (.). For
               more information, see `Identifying
               projects <https://cloud.google.com/resource-manager/docs/creating-managing-projects#identifying_projects>`__
            -  ``LOCATION_ID`` is the canonical ID for the task's
               location. The list of available locations can be obtained
               by calling
               [ListLocations][google.cloud.location.Locations.ListLocations].
               For more information, see
               https://cloud.google.com/about/locations/.
            -  ``QUEUE_ID`` can contain letters ([A-Za-z]), numbers
               ([0-9]), or hyphens (-). The maximum length is 100
               characters.
            -  ``TASK_ID`` can contain only letters ([A-Za-z]), numbers
               ([0-9]), hyphens (-), or underscores (_). The maximum
               length is 500 characters.
        app_engine_http_request (google.cloud.tasks_v2beta2.types.AppEngineHttpRequest):
            App Engine HTTP request that is sent to the task's target.
            Can be set only if
            [app_engine_http_target][google.cloud.tasks.v2beta2.Queue.app_engine_http_target]
            is set on the queue.

            An App Engine task is a task that has
            [AppEngineHttpRequest][google.cloud.tasks.v2beta2.AppEngineHttpRequest]
            set.

            This field is a member of `oneof`_ ``payload_type``.
        pull_message (google.cloud.tasks_v2beta2.types.PullMessage):
            [LeaseTasks][google.cloud.tasks.v2beta2.CloudTasks.LeaseTasks]
            to process the task. Can be set only if
            [pull_target][google.cloud.tasks.v2beta2.Queue.pull_target]
            is set on the queue.

            A pull task is a task that has
            [PullMessage][google.cloud.tasks.v2beta2.PullMessage] set.

            This field is a member of `oneof`_ ``payload_type``.
        http_request (google.cloud.tasks_v2beta2.types.HttpRequest):
            HTTP request that is sent to the task's target.

            An HTTP task is a task that has
            [HttpRequest][google.cloud.tasks.v2beta2.HttpRequest] set.

            This field is a member of `oneof`_ ``payload_type``.
        schedule_time (google.protobuf.timestamp_pb2.Timestamp):
            The time when the task is scheduled to be attempted.

            For App Engine queues, this is when the task will be
            attempted or retried.

            For pull queues, this is the time when the task is available
            to be leased; if a task is currently leased, this is the
            time when the current lease expires, that is, the time that
            the task was leased plus the
            [lease_duration][google.cloud.tasks.v2beta2.LeaseTasksRequest.lease_duration].

            ``schedule_time`` will be truncated to the nearest
            microsecond.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The time that the task was created.

            ``create_time`` will be truncated to the nearest second.
        status (google.cloud.tasks_v2beta2.types.TaskStatus):
            Output only. The task status.
        view (google.cloud.tasks_v2beta2.types.Task.View):
            Output only. The view specifies which subset of the
            [Task][google.cloud.tasks.v2beta2.Task] has been returned.
    """

    class View(proto.Enum):
        r"""The view specifies a subset of
        [Task][google.cloud.tasks.v2beta2.Task] data.

        When a task is returned in a response, not all information is
        retrieved by default because some data, such as payloads, might be
        desirable to return only when needed because of its large size or
        because of the sensitivity of data that it contains.

        Values:
            VIEW_UNSPECIFIED (0):
                Unspecified. Defaults to BASIC.
            BASIC (1):
                The basic view omits fields which can be large or can
                contain sensitive data.

                This view does not include the ([payload in
                AppEngineHttpRequest][google.cloud.tasks.v2beta2.AppEngineHttpRequest]
                and [payload in
                PullMessage][google.cloud.tasks.v2beta2.PullMessage.payload]).
                These payloads are desirable to return only when needed,
                because they can be large and because of the sensitivity of
                the data that you choose to store in it.
            FULL (2):
                All information is returned.

                Authorization for
                [FULL][google.cloud.tasks.v2beta2.Task.View.FULL] requires
                ``cloudtasks.tasks.fullView`` `Google
                IAM <https://cloud.google.com/iam/>`__ permission on the
                [Queue][google.cloud.tasks.v2beta2.Queue] resource.
        """
        VIEW_UNSPECIFIED = 0
        BASIC = 1
        FULL = 2

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    app_engine_http_request: target.AppEngineHttpRequest = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="payload_type",
        message=target.AppEngineHttpRequest,
    )
    pull_message: target.PullMessage = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="payload_type",
        message=target.PullMessage,
    )
    http_request: target.HttpRequest = proto.Field(
        proto.MESSAGE,
        number=13,
        oneof="payload_type",
        message=target.HttpRequest,
    )
    schedule_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=5,
        message=timestamp_pb2.Timestamp,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=6,
        message=timestamp_pb2.Timestamp,
    )
    status: "TaskStatus" = proto.Field(
        proto.MESSAGE,
        number=7,
        message="TaskStatus",
    )
    view: View = proto.Field(
        proto.ENUM,
        number=8,
        enum=View,
    )


class TaskStatus(proto.Message):
    r"""Status of the task.

    Attributes:
        attempt_dispatch_count (int):
            Output only. The number of attempts
            dispatched.
            This count includes attempts which have been
            dispatched but haven't received a response.
        attempt_response_count (int):
            Output only. The number of attempts which have received a
            response.

            This field is not calculated for [pull
            tasks][google.cloud.tasks.v2beta2.PullMessage].
        first_attempt_status (google.cloud.tasks_v2beta2.types.AttemptStatus):
            Output only. The status of the task's first attempt.

            Only
            [dispatch_time][google.cloud.tasks.v2beta2.AttemptStatus.dispatch_time]
            will be set. The other
            [AttemptStatus][google.cloud.tasks.v2beta2.AttemptStatus]
            information is not retained by Cloud Tasks.

            This field is not calculated for [pull
            tasks][google.cloud.tasks.v2beta2.PullMessage].
        last_attempt_status (google.cloud.tasks_v2beta2.types.AttemptStatus):
            Output only. The status of the task's last attempt.

            This field is not calculated for [pull
            tasks][google.cloud.tasks.v2beta2.PullMessage].
    """

    attempt_dispatch_count: int = proto.Field(
        proto.INT32,
        number=1,
    )
    attempt_response_count: int = proto.Field(
        proto.INT32,
        number=2,
    )
    first_attempt_status: "AttemptStatus" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="AttemptStatus",
    )
    last_attempt_status: "AttemptStatus" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="AttemptStatus",
    )


class AttemptStatus(proto.Message):
    r"""The status of a task attempt.

    Attributes:
        schedule_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The time that this attempt was scheduled.

            ``schedule_time`` will be truncated to the nearest
            microsecond.
        dispatch_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The time that this attempt was dispatched.

            ``dispatch_time`` will be truncated to the nearest
            microsecond.
        response_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The time that this attempt response was
            received.

            ``response_time`` will be truncated to the nearest
            microsecond.
        response_status (google.rpc.status_pb2.Status):
            Output only. The response from the target for
            this attempt.
            If the task has not been attempted or the task
            is currently running then the response status is
            unset.
    """

    schedule_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=1,
        message=timestamp_pb2.Timestamp,
    )
    dispatch_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    response_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    response_status: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=4,
        message=status_pb2.Status,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
