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

from google.protobuf import field_mask_pb2  # type: ignore
import proto  # type: ignore

from google.cloud.tasks_v2.types import queue as gct_queue
from google.cloud.tasks_v2.types import task as gct_task

__protobuf__ = proto.module(
    package="google.cloud.tasks.v2",
    manifest={
        "ListQueuesRequest",
        "ListQueuesResponse",
        "GetQueueRequest",
        "CreateQueueRequest",
        "UpdateQueueRequest",
        "DeleteQueueRequest",
        "PurgeQueueRequest",
        "PauseQueueRequest",
        "ResumeQueueRequest",
        "ListTasksRequest",
        "ListTasksResponse",
        "GetTaskRequest",
        "CreateTaskRequest",
        "DeleteTaskRequest",
        "RunTaskRequest",
    },
)


class ListQueuesRequest(proto.Message):
    r"""Request message for
    [ListQueues][google.cloud.tasks.v2.CloudTasks.ListQueues].

    Attributes:
        parent (str):
            Required. The location name. For example:
            ``projects/PROJECT_ID/locations/LOCATION_ID``
        filter (str):
            ``filter`` can be used to specify a subset of queues. Any
            [Queue][google.cloud.tasks.v2.Queue] field can be used as a
            filter and several operators as supported. For example:
            ``<=, <, >=, >, !=, =, :``. The filter syntax is the same as
            described in `Stackdriver's Advanced Logs
            Filters <https://cloud.google.com/logging/docs/view/advanced_filters>`__.

            Sample filter "state: PAUSED".

            Note that using filters might cause fewer queues than the
            requested page_size to be returned.
        page_size (int):
            Requested page size.

            The maximum page size is 9800. If unspecified, the page size
            will be the maximum. Fewer queues than requested might be
            returned, even if more queues exist; use the
            [next_page_token][google.cloud.tasks.v2.ListQueuesResponse.next_page_token]
            in the response to determine if more queues exist.
        page_token (str):
            A token identifying the page of results to return.

            To request the first page results, page_token must be empty.
            To request the next page of results, page_token must be the
            value of
            [next_page_token][google.cloud.tasks.v2.ListQueuesResponse.next_page_token]
            returned from the previous call to
            [ListQueues][google.cloud.tasks.v2.CloudTasks.ListQueues]
            method. It is an error to switch the value of the
            [filter][google.cloud.tasks.v2.ListQueuesRequest.filter]
            while iterating through pages.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    filter: str = proto.Field(
        proto.STRING,
        number=2,
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=3,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=4,
    )


class ListQueuesResponse(proto.Message):
    r"""Response message for
    [ListQueues][google.cloud.tasks.v2.CloudTasks.ListQueues].

    Attributes:
        queues (MutableSequence[google.cloud.tasks_v2.types.Queue]):
            The list of queues.
        next_page_token (str):
            A token to retrieve next page of results.

            To return the next page of results, call
            [ListQueues][google.cloud.tasks.v2.CloudTasks.ListQueues]
            with this value as the
            [page_token][google.cloud.tasks.v2.ListQueuesRequest.page_token].

            If the next_page_token is empty, there are no more results.

            The page token is valid for only 2 hours.
    """

    @property
    def raw_page(self):
        return self

    queues: MutableSequence[gct_queue.Queue] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gct_queue.Queue,
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class GetQueueRequest(proto.Message):
    r"""Request message for
    [GetQueue][google.cloud.tasks.v2.CloudTasks.GetQueue].

    Attributes:
        name (str):
            Required. The resource name of the queue. For example:
            ``projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class CreateQueueRequest(proto.Message):
    r"""Request message for
    [CreateQueue][google.cloud.tasks.v2.CloudTasks.CreateQueue].

    Attributes:
        parent (str):
            Required. The location name in which the queue will be
            created. For example:
            ``projects/PROJECT_ID/locations/LOCATION_ID``

            The list of allowed locations can be obtained by calling
            Cloud Tasks' implementation of
            [ListLocations][google.cloud.location.Locations.ListLocations].
        queue (google.cloud.tasks_v2.types.Queue):
            Required. The queue to create.

            [Queue's name][google.cloud.tasks.v2.Queue.name] cannot be
            the same as an existing queue.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    queue: gct_queue.Queue = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gct_queue.Queue,
    )


class UpdateQueueRequest(proto.Message):
    r"""Request message for
    [UpdateQueue][google.cloud.tasks.v2.CloudTasks.UpdateQueue].

    Attributes:
        queue (google.cloud.tasks_v2.types.Queue):
            Required. The queue to create or update.

            The queue's [name][google.cloud.tasks.v2.Queue.name] must be
            specified.

            Output only fields cannot be modified using UpdateQueue. Any
            value specified for an output only field will be ignored.
            The queue's [name][google.cloud.tasks.v2.Queue.name] cannot
            be changed.
        update_mask (google.protobuf.field_mask_pb2.FieldMask):
            A mask used to specify which fields of the
            queue are being updated.
            If empty, then all fields will be updated.
    """

    queue: gct_queue.Queue = proto.Field(
        proto.MESSAGE,
        number=1,
        message=gct_queue.Queue,
    )
    update_mask: field_mask_pb2.FieldMask = proto.Field(
        proto.MESSAGE,
        number=2,
        message=field_mask_pb2.FieldMask,
    )


class DeleteQueueRequest(proto.Message):
    r"""Request message for
    [DeleteQueue][google.cloud.tasks.v2.CloudTasks.DeleteQueue].

    Attributes:
        name (str):
            Required. The queue name. For example:
            ``projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class PurgeQueueRequest(proto.Message):
    r"""Request message for
    [PurgeQueue][google.cloud.tasks.v2.CloudTasks.PurgeQueue].

    Attributes:
        name (str):
            Required. The queue name. For example:
            ``projects/PROJECT_ID/location/LOCATION_ID/queues/QUEUE_ID``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class PauseQueueRequest(proto.Message):
    r"""Request message for
    [PauseQueue][google.cloud.tasks.v2.CloudTasks.PauseQueue].

    Attributes:
        name (str):
            Required. The queue name. For example:
            ``projects/PROJECT_ID/location/LOCATION_ID/queues/QUEUE_ID``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ResumeQueueRequest(proto.Message):
    r"""Request message for
    [ResumeQueue][google.cloud.tasks.v2.CloudTasks.ResumeQueue].

    Attributes:
        name (str):
            Required. The queue name. For example:
            ``projects/PROJECT_ID/location/LOCATION_ID/queues/QUEUE_ID``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ListTasksRequest(proto.Message):
    r"""Request message for listing tasks using
    [ListTasks][google.cloud.tasks.v2.CloudTasks.ListTasks].

    Attributes:
        parent (str):
            Required. The queue name. For example:
            ``projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID``
        response_view (google.cloud.tasks_v2.types.Task.View):
            The response_view specifies which subset of the
            [Task][google.cloud.tasks.v2.Task] will be returned.

            By default response_view is
            [BASIC][google.cloud.tasks.v2.Task.View.BASIC]; not all
            information is retrieved by default because some data, such
            as payloads, might be desirable to return only when needed
            because of its large size or because of the sensitivity of
            data that it contains.

            Authorization for
            [FULL][google.cloud.tasks.v2.Task.View.FULL] requires
            ``cloudtasks.tasks.fullView`` `Google
            IAM <https://cloud.google.com/iam/>`__ permission on the
            [Task][google.cloud.tasks.v2.Task] resource.
        page_size (int):
            Maximum page size.

            Fewer tasks than requested might be returned, even if more
            tasks exist; use
            [next_page_token][google.cloud.tasks.v2.ListTasksResponse.next_page_token]
            in the response to determine if more tasks exist.

            The maximum page size is 1000. If unspecified, the page size
            will be the maximum.
        page_token (str):
            A token identifying the page of results to return.

            To request the first page results, page_token must be empty.
            To request the next page of results, page_token must be the
            value of
            [next_page_token][google.cloud.tasks.v2.ListTasksResponse.next_page_token]
            returned from the previous call to
            [ListTasks][google.cloud.tasks.v2.CloudTasks.ListTasks]
            method.

            The page token is valid for only 2 hours.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    response_view: gct_task.Task.View = proto.Field(
        proto.ENUM,
        number=2,
        enum=gct_task.Task.View,
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=3,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=4,
    )


class ListTasksResponse(proto.Message):
    r"""Response message for listing tasks using
    [ListTasks][google.cloud.tasks.v2.CloudTasks.ListTasks].

    Attributes:
        tasks (MutableSequence[google.cloud.tasks_v2.types.Task]):
            The list of tasks.
        next_page_token (str):
            A token to retrieve next page of results.

            To return the next page of results, call
            [ListTasks][google.cloud.tasks.v2.CloudTasks.ListTasks] with
            this value as the
            [page_token][google.cloud.tasks.v2.ListTasksRequest.page_token].

            If the next_page_token is empty, there are no more results.
    """

    @property
    def raw_page(self):
        return self

    tasks: MutableSequence[gct_task.Task] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gct_task.Task,
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class GetTaskRequest(proto.Message):
    r"""Request message for getting a task using
    [GetTask][google.cloud.tasks.v2.CloudTasks.GetTask].

    Attributes:
        name (str):
            Required. The task name. For example:
            ``projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID/tasks/TASK_ID``
        response_view (google.cloud.tasks_v2.types.Task.View):
            The response_view specifies which subset of the
            [Task][google.cloud.tasks.v2.Task] will be returned.

            By default response_view is
            [BASIC][google.cloud.tasks.v2.Task.View.BASIC]; not all
            information is retrieved by default because some data, such
            as payloads, might be desirable to return only when needed
            because of its large size or because of the sensitivity of
            data that it contains.

            Authorization for
            [FULL][google.cloud.tasks.v2.Task.View.FULL] requires
            ``cloudtasks.tasks.fullView`` `Google
            IAM <https://cloud.google.com/iam/>`__ permission on the
            [Task][google.cloud.tasks.v2.Task] resource.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    response_view: gct_task.Task.View = proto.Field(
        proto.ENUM,
        number=2,
        enum=gct_task.Task.View,
    )


class CreateTaskRequest(proto.Message):
    r"""Request message for
    [CreateTask][google.cloud.tasks.v2.CloudTasks.CreateTask].

    Attributes:
        parent (str):
            Required. The queue name. For example:
            ``projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID``

            The queue must already exist.
        task (google.cloud.tasks_v2.types.Task):
            Required. The task to add.

            Task names have the following format:
            ``projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID/tasks/TASK_ID``.
            The user can optionally specify a task
            [name][google.cloud.tasks.v2.Task.name]. If a name is not
            specified then the system will generate a random unique task
            id, which will be set in the task returned in the
            [response][google.cloud.tasks.v2.Task.name].

            If [schedule_time][google.cloud.tasks.v2.Task.schedule_time]
            is not set or is in the past then Cloud Tasks will set it to
            the current time.

            Task De-duplication:

            Explicitly specifying a task ID enables task de-duplication.
            If a task's ID is identical to that of an existing task or a
            task that was deleted or executed recently then the call
            will fail with
            [ALREADY_EXISTS][google.rpc.Code.ALREADY_EXISTS]. If the
            task's queue was created using Cloud Tasks, then another
            task with the same name can't be created for ~1hour after
            the original task was deleted or executed. If the task's
            queue was created using queue.yaml or queue.xml, then
            another task with the same name can't be created for ~9days
            after the original task was deleted or executed.

            Because there is an extra lookup cost to identify duplicate
            task names, these
            [CreateTask][google.cloud.tasks.v2.CloudTasks.CreateTask]
            calls have significantly increased latency. Using hashed
            strings for the task id or for the prefix of the task id is
            recommended. Choosing task ids that are sequential or have
            sequential prefixes, for example using a timestamp, causes
            an increase in latency and error rates in all task commands.
            The infrastructure relies on an approximately uniform
            distribution of task ids to store and serve tasks
            efficiently.
        response_view (google.cloud.tasks_v2.types.Task.View):
            The response_view specifies which subset of the
            [Task][google.cloud.tasks.v2.Task] will be returned.

            By default response_view is
            [BASIC][google.cloud.tasks.v2.Task.View.BASIC]; not all
            information is retrieved by default because some data, such
            as payloads, might be desirable to return only when needed
            because of its large size or because of the sensitivity of
            data that it contains.

            Authorization for
            [FULL][google.cloud.tasks.v2.Task.View.FULL] requires
            ``cloudtasks.tasks.fullView`` `Google
            IAM <https://cloud.google.com/iam/>`__ permission on the
            [Task][google.cloud.tasks.v2.Task] resource.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    task: gct_task.Task = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gct_task.Task,
    )
    response_view: gct_task.Task.View = proto.Field(
        proto.ENUM,
        number=3,
        enum=gct_task.Task.View,
    )


class DeleteTaskRequest(proto.Message):
    r"""Request message for deleting a task using
    [DeleteTask][google.cloud.tasks.v2.CloudTasks.DeleteTask].

    Attributes:
        name (str):
            Required. The task name. For example:
            ``projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID/tasks/TASK_ID``
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class RunTaskRequest(proto.Message):
    r"""Request message for forcing a task to run now using
    [RunTask][google.cloud.tasks.v2.CloudTasks.RunTask].

    Attributes:
        name (str):
            Required. The task name. For example:
            ``projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID/tasks/TASK_ID``
        response_view (google.cloud.tasks_v2.types.Task.View):
            The response_view specifies which subset of the
            [Task][google.cloud.tasks.v2.Task] will be returned.

            By default response_view is
            [BASIC][google.cloud.tasks.v2.Task.View.BASIC]; not all
            information is retrieved by default because some data, such
            as payloads, might be desirable to return only when needed
            because of its large size or because of the sensitivity of
            data that it contains.

            Authorization for
            [FULL][google.cloud.tasks.v2.Task.View.FULL] requires
            ``cloudtasks.tasks.fullView`` `Google
            IAM <https://cloud.google.com/iam/>`__ permission on the
            [Task][google.cloud.tasks.v2.Task] resource.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    response_view: gct_task.Task.View = proto.Field(
        proto.ENUM,
        number=2,
        enum=gct_task.Task.View,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
