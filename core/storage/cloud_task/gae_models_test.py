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

"""Tests for cloud task run models."""

from __future__ import annotations

from core import utils
from core.platform import models
from core.tests import test_utils

from typing import List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import cloud_task_models

(base_models, cloud_task_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.CLOUD_TASK
])


class CloudTaskRunModelUnitTest(test_utils.GenericTestBase):
    """Test the ClassroomModel class."""

    def test_get_export_policy_not_applicable(self) -> None:
        self.assertEqual(
            cloud_task_models.CloudTaskRunModel.get_export_policy(), {
                'cloud_task_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'queue_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'task_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'current_retry_attempt': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE),
                'exception_messages_for_failed_runs': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE),
                'latest_job_state': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'function_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            }
        )

    def test_get_model_association_to_user_not_corresponding_to_user(
        self
    ) -> None:
        self.assertEqual(
            cloud_task_models.CloudTaskRunModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_deletion_policy_not_applicable(self) -> None:
        self.assertEqual(
            cloud_task_models.CloudTaskRunModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_new_model_successfully(self) -> None:

        model = cloud_task_models.CloudTaskRunModel.create_cloud_task_run_model(
            cloud_task_run_model_id=(
                cloud_task_models.CloudTaskRunModel.get_new_id()),
            cloud_task_name=(
                'projects/dev-project-id/locations/us-central1/queues/'
                'voiceover-regeneration/tasks/task1'),
            latest_job_state='RUNNING',
            function_id='update_stats',
            current_retry_attempt=1
        )
        retrieved_model = cloud_task_models.CloudTaskRunModel.get(model.id)

        self.assertIsNotNone(retrieved_model)
        self.assertEqual(
            retrieved_model.cloud_task_name, model.cloud_task_name)
        self.assertEqual(
            retrieved_model.queue_id, 'voiceover-regeneration')
        self.assertEqual(
            retrieved_model.task_id, 'task1')
        self.assertEqual(
            retrieved_model.latest_job_state, model.latest_job_state)
        self.assertEqual(retrieved_model.function_id, model.function_id)
        self.assertEqual(
            retrieved_model.exception_messages_for_failed_runs,
            model.exception_messages_for_failed_runs)
        self.assertEqual(retrieved_model.current_retry_attempt, 1)

    def test_get_queue_id_from_task_name(self) -> None:
        cloud_task_name = (
            'projects/dev-project-id/locations/us-central1/queues/'
            'voiceover-regeneration/tasks/task1')

        queue_id = (
            cloud_task_models.CloudTaskRunModel.get_queue_id_from_task_name(
                cloud_task_name))
        self.assertEqual(queue_id, 'voiceover-regeneration')

    def test_get_task_id_from_task_name(self) -> None:
        cloud_task_name = (
            'projects/dev-project-id/locations/us-central1/queues/'
            'voiceover-regeneration/tasks/task1')

        cloud_task_id = (
            cloud_task_models.CloudTaskRunModel.get_task_id_from_task_name(
                cloud_task_name))
        self.assertEqual(cloud_task_id, 'task1')

    def test_get_by_queue_id_returns_correct_models(self) -> None:
        cloud_task_models.CloudTaskRunModel.create_cloud_task_run_model(
            cloud_task_run_model_id=(
                cloud_task_models.CloudTaskRunModel.get_new_id()),
            cloud_task_name=(
                'projects/dev-project-id/locations/us-central1/queues/'
                'queueA/tasks/task1'),
            latest_job_state='RUNNING',
            function_id='update_stats',
            current_retry_attempt=0
        )
        cloud_task_models.CloudTaskRunModel.create_cloud_task_run_model(
            cloud_task_run_model_id=(
                cloud_task_models.CloudTaskRunModel.get_new_id()),
            cloud_task_name=(
                'projects/dev-project-id/locations/us-central1/queues/'
                'queueB/tasks/task2'),
            latest_job_state='SUCCEEDED',
            function_id='delete_exps_from_user_models',
            current_retry_attempt=0
        )
        cloud_task_models.CloudTaskRunModel.create_cloud_task_run_model(
            cloud_task_run_model_id=(
                cloud_task_models.CloudTaskRunModel.get_new_id()),
            cloud_task_name=(
                'projects/dev-project-id/locations/us-central1/queues/'
                'queueA/tasks/task3'),
            latest_job_state='FAILED_AND_AWAITING_RETRY',
            function_id='update_stats',
            current_retry_attempt=2
        )

        cloud_task_run_models: List[cloud_task_models.CloudTaskRunModel] = list(
            cloud_task_models.CloudTaskRunModel.get_all().fetch())
        assert cloud_task_run_models is not None
        self.assertEqual(len(cloud_task_run_models), 3)

        filtered_models = (
            cloud_task_models.CloudTaskRunModel.get_by_queue_id('queueA')
        )
        self.assertEqual(len(filtered_models), 2)
        fetched_task_names = [
            model.cloud_task_name for model in filtered_models
        ]
        expected_task_names = [
            'projects/dev-project-id/locations/us-central1/queues/queueA/'
            'tasks/task1',
            'projects/dev-project-id/locations/us-central1/queues/queueA/'
            'tasks/task3'
        ]
        self.assertItemsEqual(fetched_task_names, expected_task_names)

    def test_get_new_id_raises_error_after_too_many_failed_attempts(
        self
    ) -> None:
        cloud_task_model = (
            cloud_task_models.CloudTaskRunModel.create_cloud_task_run_model(
                cloud_task_run_model_id=(
                    cloud_task_models.CloudTaskRunModel.get_new_id()),
                cloud_task_name=(
                    'projects/dev-project-id/locations/us-central1/queues/'
                    'queueA/tasks/task3'),
                latest_job_state='FAILED_AND_AWAITING_RETRY',
                function_id='update_stats',
                current_retry_attempt=2
            ))

        collision_context = self.swap_to_always_return(
            utils, 'convert_to_hash', value=cloud_task_model.id)

        with collision_context:
            with self.assertRaisesRegex(
                RuntimeError,
                r'Failed to generate a unique ID after \d+ attempts'
            ):
                cloud_task_models.CloudTaskRunModel.get_new_id()
