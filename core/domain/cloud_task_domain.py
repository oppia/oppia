# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.]

"""Domain objects for Cloud task run."""

from __future__ import annotations
import datetime

from typing import List, TypedDict


class CloudTaskRunDict(TypedDict):
    """Dictionary representing the CloudTaskRun object."""

    task_run_id: str
    cloud_task_name: str
    task_id: str
    queue_id: str
    latest_job_state: str
    function_id: str
    exception_messages_for_failed_runs: List[str]
    last_updated: str
    current_retry_attempt: int
    created_on: str


class CloudTaskRun:
    """Domain object for the execution of an individual Cloud task."""

    def __init__(
        self,
        task_run_id: str,
        cloud_task_name: str,
        task_id: str,
        queue_id: str,
        latest_job_state: str,
        function_id: str,
        exception_messages_for_failed_runs: List[str],
        current_retry_attempt: int,
        last_updated: datetime.datetime,
        created_on: datetime.datetime
    ) -> None:
        self.task_run_id = task_run_id
        self.cloud_task_name = cloud_task_name
        self.task_id = task_id
        self.queue_id = queue_id
        self.latest_job_state = latest_job_state
        self.function_id = function_id
        self.exception_messages_for_failed_runs = (
            exception_messages_for_failed_runs)
        self.current_retry_attempt = current_retry_attempt
        self.last_updated = last_updated
        self.created_on = created_on

    def to_dict(self) -> CloudTaskRunDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            CloudTaskRunDict. A dictionary representation of the CloudTaskRun
            object, with keys matching the attributes of the object.
        """
        return {
            'task_run_id': self.task_run_id,
            'cloud_task_name': self.cloud_task_name,
            'task_id': self.task_id,
            'queue_id': self.queue_id,
            'latest_job_state': self.latest_job_state,
            'function_id': self.function_id,
            'exception_messages_for_failed_runs': (
                self.exception_messages_for_failed_runs),
            'current_retry_attempt': self.current_retry_attempt,
            'last_updated': self.last_updated.isoformat(),
            'created_on': self.created_on.isoformat()
        }

    @classmethod
    def from_dict(cls, cloud_task_run_dict: CloudTaskRunDict) -> CloudTaskRun:
        """Returns a domain object from a dictionary.

        Args:
            cloud_task_run_dict: CloudTaskRunDict. A dictionary representation
                of the CloudTaskRun object.

        Returns:
            CloudTaskRun. A CloudTaskRun domain object created from the given
            dictionary.
        """
        return cls(
            task_run_id=cloud_task_run_dict['task_run_id'],
            cloud_task_name=cloud_task_run_dict['cloud_task_name'],
            task_id=cloud_task_run_dict['task_id'],
            queue_id=cloud_task_run_dict['queue_id'],
            latest_job_state=cloud_task_run_dict['latest_job_state'],
            function_id=cloud_task_run_dict['function_id'],
            exception_messages_for_failed_runs=cloud_task_run_dict[
                'exception_messages_for_failed_runs'],
            current_retry_attempt=cloud_task_run_dict['current_retry_attempt'],
            last_updated=datetime.datetime.fromisoformat(
                cloud_task_run_dict['last_updated']),
            created_on=datetime.datetime.fromisoformat(
                cloud_task_run_dict['created_on'])
        )
