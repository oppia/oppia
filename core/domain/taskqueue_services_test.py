# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for the domain taskqueue services."""

from __future__ import annotations

import datetime
import uuid

from core import feconf
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, List, Optional, Set

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import cloud_task_models, platform_taskqueue_services

platform_taskqueue_services = models.Registry.import_taskqueue_services()

(cloud_task_models,) = models.Registry.import_models([
    models.Names.CLOUD_TASK])


class TaskqueueDomainServicesUnitTests(test_utils.TestBase):
    """Tests for domain taskqueue services."""

    def test_exception_raised_when_deferred_payload_is_not_serializable(
        self
    ) -> None:
        class NonSerializableArgs:
            """Object that is not JSON serializable."""

            def __init__(self) -> None:
                self.x = 1
                self.y = 2

        arg1 = NonSerializableArgs()
        serialization_exception = self.assertRaisesRegex(
            ValueError,
            'The args or kwargs passed to the deferred call with '
            'function_identifier, %s, are not json serializable.' %
            feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                'FUNCTION_ID_UPDATE_STATS'])
        with serialization_exception:
            taskqueue_services.defer(
                feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                    'FUNCTION_ID_UPDATE_STATS'],
                taskqueue_services.QUEUE_NAME_DEFAULT, arg1)

    def test_exception_raised_when_email_task_params_is_not_serializable(
        self
    ) -> None:
        params: Dict[str, Set[str]] = {
            'param1': set()
        }
        serialization_exception = self.assertRaisesRegex(
            ValueError,
            'The params added to the email task call cannot be json serialized')
        with serialization_exception:
            taskqueue_services.enqueue_task(
                feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS,
                params,
                0)

    def test_defer_makes_the_correct_request(self) -> None:
        correct_fn_identifier = 'delete_exps_from_activities'
        correct_args = (1, 2, 3)
        correct_kwargs = {'a': 'b', 'c': 'd'}

        taskqueue_services.defer(
            correct_fn_identifier,
            taskqueue_services.QUEUE_NAME_EMAILS,
            *correct_args, **correct_kwargs
        )

        cloud_task_run_model: cloud_task_models.CloudTaskRunModel = (
            cloud_task_models.CloudTaskRunModel.get_all().fetch())[0]
        assert cloud_task_run_model is not None
        self.assertEqual(
            cloud_task_run_model.function_id, correct_fn_identifier)

    def test_enqueue_task_makes_the_correct_request(self) -> None:
        correct_payload = {
            'user_id': '1'
        }
        correct_url = feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS
        correct_queue_name = taskqueue_services.QUEUE_NAME_EMAILS

        def mock_create_http_task(
            queue_name: str,
            url: str,
            payload: Optional[Dict[str, str]] = None,
            scheduled_for: Optional[datetime.datetime] = None,
            task_name: Optional[str] = None
        ) -> None:
            self.assertEqual(queue_name, correct_queue_name)
            self.assertEqual(url, correct_url)
            self.assertEqual(payload, correct_payload)
            self.assertIsNotNone(scheduled_for)
            self.assertIsNone(task_name)

        swap_create_http_task = self.swap(
            platform_taskqueue_services, 'create_http_task',
            mock_create_http_task)

        with swap_create_http_task:
            taskqueue_services.enqueue_task(
                correct_url, correct_payload, 0)

    def test_should_create_new_cloud_task_run_model(self) -> None:
        new_model_id = cloud_task_models.CloudTaskRunModel.get_new_id()
        project_id = 'dev-project-id'
        location_id = 'us-central'
        task_id = uuid.uuid4().hex
        queue_name = 'test_queue_name'

        task_name = (
            'projects/%s/locations/%s/queues/%s/tasks/%s' % (
                project_id, location_id, queue_name, task_id
            )
        )
        function_id = 'delete_exps_from_user_models'

        taskqueue_services.create_new_cloud_task_model(
            new_model_id, task_name, function_id)

        cloud_task_run_models: List[cloud_task_models.CloudTaskRunModel] = list(
            cloud_task_models.CloudTaskRunModel.get_all().fetch())
        self.assertIsNotNone(cloud_task_run_models)
        self.assertEqual(len(cloud_task_run_models), 1)

        self.assertEqual(
            cloud_task_run_models[0].id, new_model_id)
        self.assertEqual(
            cloud_task_run_models[0].cloud_task_name, task_name)
        self.assertEqual(
            cloud_task_run_models[0].function_id, function_id)
        self.assertEqual(
            cloud_task_run_models[0].latest_job_state,
            cloud_task_models.CloudTaskState.PENDING.value)
        self.assertEqual(
            cloud_task_run_models[0].current_retry_attempt, 0)

    def test_should_update_cloud_task_run_model(self) -> None:
        new_model_id = cloud_task_models.CloudTaskRunModel.get_new_id()
        project_id = 'dev-project-id'
        location_id = 'us-central'
        task_id = uuid.uuid4().hex
        queue_name = 'test_queue_name'

        task_name = (
            'projects/%s/locations/%s/queues/%s/tasks/%s' % (
                project_id, location_id, queue_name, task_id
            )
        )
        function_id = 'delete_exps_from_user_models'

        taskqueue_services.create_new_cloud_task_model(
            new_model_id, task_name, function_id)

        cloud_task_run = taskqueue_services.get_cloud_task_run_by_model_id(
            new_model_id)
        assert cloud_task_run is not None
        self.assertIsNotNone(cloud_task_run)

        cloud_task_run.current_retry_attempt = 1
        cloud_task_run.latest_job_state = (
            cloud_task_models.CloudTaskState.SUCCEEDED.value)
        cloud_task_run.exception_messages_for_failed_runs = (
            ['Timeout error occurred.'])

        taskqueue_services.update_cloud_task_run_model(cloud_task_run)

        updated_cloud_task_run = (
            taskqueue_services.get_cloud_task_run_by_model_id(new_model_id))
        assert updated_cloud_task_run is not None

        self.assertEqual(
            updated_cloud_task_run.current_retry_attempt, 1)
        self.assertEqual(
            updated_cloud_task_run.latest_job_state,
            cloud_task_models.CloudTaskState.SUCCEEDED.value)
        self.assertEqual(
            updated_cloud_task_run.exception_messages_for_failed_runs,
            ['Timeout error occurred.'])

    def test_should_not_update_for_incorrect_model_id(self) -> None:
        new_model_id = cloud_task_models.CloudTaskRunModel.get_new_id()
        project_id = 'dev-project-id'
        location_id = 'us-central'
        task_id = uuid.uuid4().hex
        queue_name = 'test_queue_name'

        task_name = (
            'projects/%s/locations/%s/queues/%s/tasks/%s' % (
                project_id, location_id, queue_name, task_id
            )
        )
        function_id = 'delete_exps_from_user_models'

        taskqueue_services.create_new_cloud_task_model(
            new_model_id, task_name, function_id)

        cloud_task_run = taskqueue_services.get_cloud_task_run_by_model_id(
            new_model_id)
        assert cloud_task_run is not None

        # Updating the ID for testing error handling.
        cloud_task_run.task_run_id = 'incorrect_model_id'
        with self.assertRaisesRegex(
            ValueError,
            'CloudTaskRunModel with id incorrect_model_id does not exist.'
        ):
            taskqueue_services.update_cloud_task_run_model(cloud_task_run)

    def test_should_fetch_cloud_task_run_model(self) -> None:
        new_model_id = cloud_task_models.CloudTaskRunModel.get_new_id()
        project_id = 'dev-project-id'
        location_id = 'us-central'
        task_id = uuid.uuid4().hex
        queue_name = 'test_queue_name'

        task_name = (
            'projects/%s/locations/%s/queues/%s/tasks/%s' % (
                project_id, location_id, queue_name, task_id
            )
        )
        function_id = 'delete_exps_from_user_models'

        taskqueue_services.create_new_cloud_task_model(
            new_model_id, task_name, function_id)

        cloud_task_run = taskqueue_services.get_cloud_task_run_by_model_id(
            new_model_id)
        self.assertIsNotNone(cloud_task_run)

        cloud_task_run = taskqueue_services.get_cloud_task_run_by_model_id(
            'incorrect_model_id')
        self.assertIsNone(cloud_task_run)

    def test_should_get_cloud_task_run_models_by_params(self) -> None:
        new_model_id = cloud_task_models.CloudTaskRunModel.get_new_id()
        project_id = 'dev-project-id'
        location_id = 'us-central'
        task_id = uuid.uuid4().hex
        queue_name = 'test_queue_name'

        task_name = (
            'projects/%s/locations/%s/queues/%s/tasks/%s' % (
                project_id, location_id, queue_name, task_id
            )
        )
        function_id = 'delete_exps_from_user_models'

        taskqueue_services.create_new_cloud_task_model(
            new_model_id, task_name, function_id)

        cloud_task_run = taskqueue_services.get_cloud_task_run_by_model_id(
            new_model_id)
        assert cloud_task_run is not None

        start_datetime = cloud_task_run.last_updated.replace(
            tzinfo=datetime.timezone.utc)
        end_datetime = cloud_task_run.last_updated.replace(
            tzinfo=datetime.timezone.utc)

        cloud_task_run = taskqueue_services.get_cloud_task_run_by_given_params(
            queue_name, start_datetime, end_datetime)[0]

        self.assertEqual(cloud_task_run.cloud_task_name, task_name)
        self.assertEqual(cloud_task_run.function_id, function_id)
