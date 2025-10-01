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
# limitations under the License.

"""Unit tests for cloud_task_domain.py"""

from __future__ import annotations

import datetime
import uuid

from core.domain import cloud_task_domain
from core.tests import test_utils


class CloudTaskDomainTests(test_utils.GenericTestBase):
    """Unit tests for CloudTaskRun domain object."""

    def test_that_domain_object_is_created_correctly(self) -> None:
        cloud_task_run_id = 'cloud_task_run_id'
        project_id = 'dev-project-id'
        location_id = 'us-central'
        task_id = uuid.uuid4().hex
        queue_name = 'test_queue_name'
        current_run_state = 'running'
        last_updated = datetime.datetime.utcnow()
        created_on = datetime.datetime.utcnow()
        task_name = (
            'projects/%s/locations/%s/queues/%s/tasks/%s' % (
                project_id, location_id, queue_name, task_id
            )
        )
        function_id = 'delete_exps_from_user_models'

        cloud_task_run = cloud_task_domain.CloudTaskRun(
            cloud_task_run_id, task_name, task_id, queue_name,
            current_run_state, function_id, [], 0, last_updated, created_on)

        self.assertEqual(cloud_task_run.task_run_id, cloud_task_run_id)
        self.assertEqual(cloud_task_run.cloud_task_name, task_name)
        self.assertEqual(cloud_task_run.task_id, task_id)
        self.assertEqual(cloud_task_run.queue_id, queue_name)
        self.assertEqual(cloud_task_run.latest_job_state, current_run_state)
        self.assertEqual(cloud_task_run.function_id, function_id)
        self.assertEqual(
            cloud_task_run.exception_messages_for_failed_runs, [])
        self.assertEqual(cloud_task_run.current_retry_attempt, 0)
        self.assertEqual(cloud_task_run.last_updated, last_updated)
        self.assertEqual(cloud_task_run.created_on, created_on)

    def test_should_create_domain_object_from_dict(self) -> None:
        cloud_task_run_id = 'cloud_task_run_id'
        project_id = 'dev-project-id'
        location_id = 'us-central'
        task_id = uuid.uuid4().hex
        queue_name = 'test_queue_name'
        current_run_state = 'running'
        last_updated = datetime.datetime.utcnow()
        created_on = datetime.datetime.utcnow()
        task_name = (
            'projects/%s/locations/%s/queues/%s/tasks/%s' % (
                project_id, location_id, queue_name, task_id
            )
        )
        function_id = 'delete_exps_from_user_models'

        cloud_task_run_dict: cloud_task_domain.CloudTaskRunDict = {
            'task_run_id': cloud_task_run_id,
            'cloud_task_name': task_name,
            'task_id': task_id,
            'queue_id': queue_name,
            'latest_job_state': current_run_state,
            'function_id': function_id,
            'exception_messages_for_failed_runs': [],
            'current_retry_attempt': 0,
            'last_updated': last_updated.isoformat(),
            'created_on': created_on.isoformat()
        }

        cloud_task_run = cloud_task_domain.CloudTaskRun.from_dict(
            cloud_task_run_dict)

        self.assertEqual(cloud_task_run.to_dict(), cloud_task_run_dict)
