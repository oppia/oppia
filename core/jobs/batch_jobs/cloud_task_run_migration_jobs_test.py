# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for cloud_task_run_migration_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import cloud_task_run_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import cloud_task_models

(cloud_task_models,) = models.Registry.import_models([models.Names.CLOUD_TASK])


class MarkStaleCloudTaskRunModelsAsFailedJobTests(job_test_utils.JobTestBase):
    """Tests for MarkStaleCloudTaskRunModelsAsFailedJob."""

    JOB_CLASS: Type[
        cloud_task_run_migration_jobs.MarkStaleCloudTaskRunModelsAsFailedJob
    ] = cloud_task_run_migration_jobs.MarkStaleCloudTaskRunModelsAsFailedJob

    def test_empty_storage(self) -> None:
        """Test that the job runs successfully with empty storage."""
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 0.'
                )
            ]
        )

    def test_no_stale_models(self) -> None:
        """Test that the job doesn't update models that are not stale."""
        # Create a recent model in RUNNING state (should not be updated).
        recent_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='recent_model_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task1',
            task_id='task1',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.RUNNING.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=0,
            last_updated=datetime.datetime.now(datetime.timezone.utc).replace(
                tzinfo=None
            ),
        )

        # Create a model in SUCCEEDED state (should not be updated).
        succeeded_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='succeeded_model_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task2',
            task_id='task2',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.SUCCEEDED.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=0,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=4)
            ),
        )

        self.put_multi([recent_model, succeeded_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 0.'
                )
            ]
        )

        # Verify models were not updated.
        updated_recent_model = cloud_task_models.CloudTaskRunModel.get(
            'recent_model_id'
        )
        updated_succeeded_model = cloud_task_models.CloudTaskRunModel.get(
            'succeeded_model_id'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_recent_model is not None
        assert updated_succeeded_model is not None

        self.assertEqual(
            updated_recent_model.latest_job_state,
            cloud_task_models.CloudTaskState.RUNNING.value,
        )
        self.assertEqual(
            updated_succeeded_model.latest_job_state,
            cloud_task_models.CloudTaskState.SUCCEEDED.value,
        )

    def test_updates_stale_running_model(self) -> None:
        """Test that the job updates a model that has been RUNNING for more than 3 days."""
        stale_running_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='stale_running_model_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task3',
            task_id='task3',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.RUNNING.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=2,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=4)
            ),
        )

        self.put_multi([stale_running_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of CloudTaskRunModel with ID: stale_running_model_id.'
                ),
            ]
        )

        # Verify the model was updated correctly.
        updated_model = cloud_task_models.CloudTaskRunModel.get(
            'stale_running_model_id'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_model is not None

        self.assertEqual(
            updated_model.latest_job_state,
            cloud_task_models.CloudTaskState.PERMANENTLY_FAILED.value,
        )
        self.assertEqual(
            len(updated_model.exception_messages_for_failed_runs), 1
        )
        self.assertIn(
            'This CloudTaskRunModel was marked as PERMANENTLY_FAILED '
            'automatically since it has been in the RUNNING state for more than '
            'three days.',
            updated_model.exception_messages_for_failed_runs[0],
        )

    def test_updates_stale_pending_model(self) -> None:
        """Test that the job updates a model that has been PENDING for more than 3 days."""
        stale_pending_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='stale_pending_model_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task4',
            task_id='task4',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.PENDING.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=0,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=5)
            ),
        )

        self.put_multi([stale_pending_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of CloudTaskRunModel with ID: stale_pending_model_id.'
                ),
            ]
        )

        # Verify the model was updated correctly.
        updated_model = cloud_task_models.CloudTaskRunModel.get(
            'stale_pending_model_id'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_model is not None

        self.assertEqual(
            updated_model.latest_job_state,
            cloud_task_models.CloudTaskState.PERMANENTLY_FAILED.value,
        )
        self.assertEqual(
            len(updated_model.exception_messages_for_failed_runs), 1
        )
        self.assertIn(
            'This CloudTaskRunModel was marked as PERMANENTLY_FAILED '
            'automatically since it has been in the PENDING state for more than '
            'three days.',
            updated_model.exception_messages_for_failed_runs[0],
        )

    def test_updates_multiple_stale_models(self) -> None:
        """Test that the job updates multiple stale models correctly."""
        # Create multiple stale models.
        stale_running_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='stale_running_model_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task5',
            task_id='task5',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.RUNNING.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=1,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=4)
            ),
        )

        stale_pending_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='stale_pending_model_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task6',
            task_id='task6',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.PENDING.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=0,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=6)
            ),
        )

        # Create a non-stale model that should not be updated.
        fresh_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='fresh_model_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task7',
            task_id='task7',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.RUNNING.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=0,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(hours=12)
            ),
        )

        self.put_multi([stale_running_model, stale_pending_model, fresh_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 2.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of CloudTaskRunModel with ID: stale_running_model_id.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of CloudTaskRunModel with ID: stale_pending_model_id.'
                ),
            ]
        )

        # Verify the stale models were updated.
        updated_running_model = cloud_task_models.CloudTaskRunModel.get(
            'stale_running_model_id'
        )
        updated_pending_model = cloud_task_models.CloudTaskRunModel.get(
            'stale_pending_model_id'
        )
        updated_fresh_model = cloud_task_models.CloudTaskRunModel.get(
            'fresh_model_id'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_running_model is not None
        assert updated_pending_model is not None
        assert updated_fresh_model is not None

        # Check that stale models were updated.
        self.assertEqual(
            updated_running_model.latest_job_state,
            cloud_task_models.CloudTaskState.PERMANENTLY_FAILED.value,
        )
        self.assertEqual(
            updated_pending_model.latest_job_state,
            cloud_task_models.CloudTaskState.PERMANENTLY_FAILED.value,
        )

        # Check that the fresh model was not updated.
        self.assertEqual(
            updated_fresh_model.latest_job_state,
            cloud_task_models.CloudTaskState.RUNNING.value,
        )

    def test_preserves_existing_exception_messages(self) -> None:
        """Test that the job preserves existing exception messages when updating a model."""
        existing_exception_message = 'Previous error occurred'
        stale_model_with_exceptions = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='stale_model_with_exceptions_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task8',
            task_id='task8',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.RUNNING.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[existing_exception_message],
            current_retry_attempt=3,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=4)
            ),
        )

        self.put_multi([stale_model_with_exceptions])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of CloudTaskRunModel with ID: stale_model_with_exceptions_id.'
                ),
            ]
        )

        # Verify the model was updated and existing exception message was preserved.
        updated_model = cloud_task_models.CloudTaskRunModel.get(
            'stale_model_with_exceptions_id'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_model is not None

        self.assertEqual(
            updated_model.latest_job_state,
            cloud_task_models.CloudTaskState.PERMANENTLY_FAILED.value,
        )
        self.assertEqual(
            len(updated_model.exception_messages_for_failed_runs), 2
        )
        self.assertEqual(
            updated_model.exception_messages_for_failed_runs[0],
            existing_exception_message,
        )
        self.assertIn(
            'This CloudTaskRunModel was marked as PERMANENTLY_FAILED '
            'automatically since it has been in the RUNNING state for more than '
            'three days.',
            updated_model.exception_messages_for_failed_runs[1],
        )

    def test_should_update_model_that_is_exactly_three_days_old(self) -> None:
        """Test that a model that is exactly 3 days old gets updated."""
        exactly_three_days_old_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='exactly_three_days_old_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task10',
            task_id='task10',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.PENDING.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=0,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=3)
            ),
        )

        self.put_multi([exactly_three_days_old_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of CloudTaskRunModel with ID: exactly_three_days_old_id.'
                ),
            ]
        )

    def test_should_not_update_model_that_is_just_under_three_days_old(
        self,
    ) -> None:
        """Test that a model that is just under 3 days old does not get updated."""
        just_under_three_days_old_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='just_under_three_days_old_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task11',
            task_id='task11',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.RUNNING.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=0,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=3)
                + datetime.timedelta(minutes=1)
            ),
        )

        self.put_multi([just_under_three_days_old_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 0.'
                )
            ]
        )

        # Verify the model was not updated.
        updated_model = cloud_task_models.CloudTaskRunModel.get(
            'just_under_three_days_old_id'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_model is not None

        self.assertEqual(
            updated_model.latest_job_state,
            cloud_task_models.CloudTaskState.RUNNING.value,
        )

    def test_should_not_update_model_with_failed_and_awaiting_retry_state(
        self,
    ) -> None:
        """Test that models in FAILED_AND_AWAITING_RETRY state are not updated."""
        failed_and_awaiting_retry_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='failed_and_awaiting_retry_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task12',
            task_id='task12',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.FAILED_AND_AWAITING_RETRY.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=['Failed but will retry'],
            current_retry_attempt=1,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=5)
            ),
        )

        self.put_multi([failed_and_awaiting_retry_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 0.'
                )
            ]
        )

        # Verify the model was not updated.
        updated_model = cloud_task_models.CloudTaskRunModel.get(
            'failed_and_awaiting_retry_id'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_model is not None

        self.assertEqual(
            updated_model.latest_job_state,
            cloud_task_models.CloudTaskState.FAILED_AND_AWAITING_RETRY.value,
        )

    def test_should_not_update_model_with_permanently_failed_state(
        self,
    ) -> None:
        """Test that models already in PERMANENTLY_FAILED state are not updated."""
        permanently_failed_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='permanently_failed_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task13',
            task_id='task13',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.PERMANENTLY_FAILED.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=['Already failed permanently'],
            current_retry_attempt=3,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=10)
            ),
        )

        self.put_multi([permanently_failed_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 0.'
                )
            ]
        )

        # Verify the model was not updated.
        updated_model = cloud_task_models.CloudTaskRunModel.get(
            'permanently_failed_id'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_model is not None

        self.assertEqual(
            updated_model.latest_job_state,
            cloud_task_models.CloudTaskState.PERMANENTLY_FAILED.value,
        )
        # Should still have only the original exception message.
        self.assertEqual(
            len(updated_model.exception_messages_for_failed_runs), 1
        )
        self.assertEqual(
            updated_model.exception_messages_for_failed_runs[0],
            'Already failed permanently',
        )


class MarkStaleCloudTaskRunModelsAsFailedAuditJobTests(
    job_test_utils.JobTestBase
):
    """Tests for MarkStaleCloudTaskRunModelsAsFailedAuditJob."""

    JOB_CLASS: Type[
        cloud_task_run_migration_jobs.MarkStaleCloudTaskRunModelsAsFailedAuditJob
    ] = (
        cloud_task_run_migration_jobs.MarkStaleCloudTaskRunModelsAsFailedAuditJob
    )

    def test_audit_job_does_not_update_models(self) -> None:
        """Test that the audit job does not update any models and only logs the IDs of stale models."""
        # Create a stale model in RUNNING state (should be logged but not updated).
        stale_model = self.create_model(
            cloud_task_models.CloudTaskRunModel,
            id='stale_model_id',
            cloud_task_name='projects/test/locations/us-central1/queues/default/tasks/task14',
            task_id='task14',
            queue_id='default',
            latest_job_state=cloud_task_models.CloudTaskState.RUNNING.value,
            function_id='regenerate_voiceovers_on_exploration_update',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=0,
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=4)
            ),
        )

        self.put_multi([stale_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of CloudTaskRunModel with ID: stale_model_id.'
                ),
            ]
        )

        # Verify the model was not updated.
        updated_model = cloud_task_models.CloudTaskRunModel.get(
            'stale_model_id'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_model is not None

        self.assertEqual(
            updated_model.latest_job_state,
            cloud_task_models.CloudTaskState.RUNNING.value,
        )


class MarkStaleVoiceoverRegenerationJobModelsAsFailedJobTests(
    job_test_utils.JobTestBase
):
    """Tests for MarkStaleVoiceoverRegenerationJobModelsAsFailedJob."""

    JOB_CLASS: Type[
        cloud_task_run_migration_jobs.MarkStaleVoiceoverRegenerationJobModelsAsFailedJob
    ] = (
        cloud_task_run_migration_jobs.MarkStaleVoiceoverRegenerationJobModelsAsFailedJob
    )

    def test_empty_storage(self) -> None:
        """Test that the job runs successfully with empty storage."""
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of VoiceoverRegenerationJobModels updated to FAILED: 0.'
                )
            ]
        )

    def test_no_stale_models(self) -> None:
        """Test that the job does not update non-stale models."""
        fresh_model = self.create_model(
            cloud_task_models.VoiceoverRegenerationJobModel,
            id='exp1:taskrun1',
            exploration_id='exp1',
            cloud_task_run_id='taskrun1',
            language_accent_to_content_status_map={
                'en-us': {
                    'content_1': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    )
                }
            },
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=2)
            ),
        )

        self.put_multi([fresh_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of VoiceoverRegenerationJobModels updated to FAILED: 0.'
                )
            ]
        )

        updated_model = cloud_task_models.VoiceoverRegenerationJobModel.get(
            'exp1:taskrun1'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_model is not None

        self.assertEqual(
            updated_model.language_accent_to_content_status_map,
            {
                'en-us': {
                    'content_1': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    )
                }
            },
        )

    def test_updates_stale_model_generating_statuses_to_failed(self) -> None:
        """Test that stale GENERATING statuses are marked as FAILED."""
        stale_model = self.create_model(
            cloud_task_models.VoiceoverRegenerationJobModel,
            id='exp2:taskrun2',
            exploration_id='exp2',
            cloud_task_run_id='taskrun2',
            language_accent_to_content_status_map={
                'en-us': {
                    'content_1': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    ),
                    'content_2': (
                        feconf.VoiceoverRegenerationState.SUCCEEDED.value
                    ),
                },
                'hi-in': {
                    'content_3': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    )
                },
            },
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=4)
            ),
        )

        self.put_multi([stale_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of VoiceoverRegenerationJobModels updated to FAILED: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of VoiceoverRegenerationJobModel with ID: exp2:taskrun2.'
                ),
            ]
        )

        updated_model = cloud_task_models.VoiceoverRegenerationJobModel.get(
            'exp2:taskrun2'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_model is not None

        self.assertEqual(
            updated_model.language_accent_to_content_status_map,
            {
                'en-us': {
                    'content_1': feconf.VoiceoverRegenerationState.FAILED.value,
                    'content_2': (
                        feconf.VoiceoverRegenerationState.SUCCEEDED.value
                    ),
                },
                'hi-in': {
                    'content_3': feconf.VoiceoverRegenerationState.FAILED.value
                },
            },
        )

    def test_updates_multiple_stale_models(self) -> None:
        """Test that the job updates multiple stale models correctly."""
        stale_model_1 = self.create_model(
            cloud_task_models.VoiceoverRegenerationJobModel,
            id='exp3:taskrun3',
            exploration_id='exp3',
            cloud_task_run_id='taskrun3',
            language_accent_to_content_status_map={
                'en-us': {
                    'content_1': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    )
                }
            },
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=5)
            ),
        )

        stale_model_2 = self.create_model(
            cloud_task_models.VoiceoverRegenerationJobModel,
            id='exp4:taskrun4',
            exploration_id='exp4',
            cloud_task_run_id='taskrun4',
            language_accent_to_content_status_map={
                'hi-in': {
                    'content_2': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    )
                }
            },
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=4)
            ),
        )

        fresh_model = self.create_model(
            cloud_task_models.VoiceoverRegenerationJobModel,
            id='exp5:taskrun5',
            exploration_id='exp5',
            cloud_task_run_id='taskrun5',
            language_accent_to_content_status_map={
                'en-us': {
                    'content_3': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    )
                }
            },
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(hours=23)
            ),
        )

        self.put_multi([stale_model_1, stale_model_2, fresh_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of VoiceoverRegenerationJobModels updated to FAILED: 2.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of VoiceoverRegenerationJobModel with ID: exp3:taskrun3.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of VoiceoverRegenerationJobModel with ID: exp4:taskrun4.'
                ),
            ]
        )

        updated_stale_model_1 = (
            cloud_task_models.VoiceoverRegenerationJobModel.get('exp3:taskrun3')
        )
        updated_stale_model_2 = (
            cloud_task_models.VoiceoverRegenerationJobModel.get('exp4:taskrun4')
        )
        updated_fresh_model = (
            cloud_task_models.VoiceoverRegenerationJobModel.get('exp5:taskrun5')
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_stale_model_1 is not None
        assert updated_stale_model_2 is not None
        assert updated_fresh_model is not None

        self.assertEqual(
            updated_stale_model_1.language_accent_to_content_status_map,
            {
                'en-us': {
                    'content_1': feconf.VoiceoverRegenerationState.FAILED.value
                }
            },
        )
        self.assertEqual(
            updated_stale_model_2.language_accent_to_content_status_map,
            {
                'hi-in': {
                    'content_2': feconf.VoiceoverRegenerationState.FAILED.value
                }
            },
        )
        self.assertEqual(
            updated_fresh_model.language_accent_to_content_status_map,
            {
                'en-us': {
                    'content_3': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    )
                }
            },
        )

    def test_should_update_model_that_is_exactly_three_days_old(self) -> None:
        """Test that a model exactly three days old gets updated."""
        exactly_three_days_old_model = self.create_model(
            cloud_task_models.VoiceoverRegenerationJobModel,
            id='exp6:taskrun6',
            exploration_id='exp6',
            cloud_task_run_id='taskrun6',
            language_accent_to_content_status_map={
                'en-us': {
                    'content_1': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    )
                }
            },
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=3)
            ),
        )

        self.put_multi([exactly_three_days_old_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of VoiceoverRegenerationJobModels updated to FAILED: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of VoiceoverRegenerationJobModel with ID: exp6:taskrun6.'
                ),
            ]
        )


class MarkStaleVoiceoverRegenerationJobModelsAsFailedAuditJobTests(
    job_test_utils.JobTestBase
):
    """Tests for MarkStaleVoiceoverRegenerationJobModelsAsFailedAuditJob."""

    JOB_CLASS: Type[
        cloud_task_run_migration_jobs.MarkStaleVoiceoverRegenerationJobModelsAsFailedAuditJob
    ] = (
        cloud_task_run_migration_jobs.MarkStaleVoiceoverRegenerationJobModelsAsFailedAuditJob
    )

    def test_empty_storage(self) -> None:
        """Test that the audit job runs successfully with empty storage."""
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of VoiceoverRegenerationJobModels updated to FAILED: 0.'
                )
            ]
        )

    def test_audit_job_does_not_update_models(self) -> None:
        """Test that the audit job does not update stale models."""
        stale_model = self.create_model(
            cloud_task_models.VoiceoverRegenerationJobModel,
            id='exp7:taskrun7',
            exploration_id='exp7',
            cloud_task_run_id='taskrun7',
            language_accent_to_content_status_map={
                'en-us': {
                    'content_1': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    ),
                    'content_2': (
                        feconf.VoiceoverRegenerationState.SUCCEEDED.value
                    ),
                }
            },
            last_updated=(
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
                - datetime.timedelta(days=4)
            ),
        )

        self.put_multi([stale_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of VoiceoverRegenerationJobModels updated to FAILED: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of VoiceoverRegenerationJobModel with ID: exp7:taskrun7.'
                ),
            ]
        )

        updated_model = cloud_task_models.VoiceoverRegenerationJobModel.get(
            'exp7:taskrun7'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert updated_model is not None

        self.assertEqual(
            updated_model.language_accent_to_content_status_map,
            {
                'en-us': {
                    'content_1': (
                        feconf.VoiceoverRegenerationState.GENERATING.value
                    ),
                    'content_2': (
                        feconf.VoiceoverRegenerationState.SUCCEEDED.value
                    ),
                }
            },
        )
