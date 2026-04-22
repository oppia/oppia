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

from typing import Dict


class CloudTaskDomainTests(test_utils.GenericTestBase):
    """Unit tests for CloudTaskRun domain object."""

    def test_should_create_domain_object_correctly(self) -> None:
        cloud_task_run_id = 'cloud_task_run_id'
        project_id = 'dev-project-id'
        location_id = 'us-central'
        task_id = uuid.uuid4().hex
        queue_name = 'test_queue_name'
        current_run_state = 'running'
        last_updated = datetime.datetime.utcnow()
        created_on = datetime.datetime.utcnow()
        task_name = 'projects/%s/locations/%s/queues/%s/tasks/%s' % (
            project_id,
            location_id,
            queue_name,
            task_id,
        )
        function_id = 'delete_exps_from_user_models'

        cloud_task_run = cloud_task_domain.CloudTaskRun(
            cloud_task_run_id,
            task_name,
            task_id,
            queue_name,
            current_run_state,
            function_id,
            [],
            0,
            last_updated,
            created_on,
        )

        self.assertEqual(cloud_task_run.task_run_id, cloud_task_run_id)
        self.assertEqual(cloud_task_run.cloud_task_name, task_name)
        self.assertEqual(cloud_task_run.task_id, task_id)
        self.assertEqual(cloud_task_run.queue_id, queue_name)
        self.assertEqual(cloud_task_run.latest_job_state, current_run_state)
        self.assertEqual(cloud_task_run.function_id, function_id)
        self.assertEqual(cloud_task_run.exception_messages_for_failed_runs, [])
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
        task_name = 'projects/%s/locations/%s/queues/%s/tasks/%s' % (
            project_id,
            location_id,
            queue_name,
            task_id,
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
            'created_on': created_on.isoformat(),
        }

        cloud_task_run = cloud_task_domain.CloudTaskRun.from_dict(
            cloud_task_run_dict
        )

        self.assertEqual(cloud_task_run.to_dict(), cloud_task_run_dict)

    def test_should_convert_datetime_fields_with_timezone_info(self) -> None:
        cloud_task_run = cloud_task_domain.CloudTaskRun(
            task_run_id='cloud_task_run_id',
            cloud_task_name='projects/dev-project-id/locations/us-central/'
            'queues/test_queue_name/tasks/task_id',
            task_id='task_id',
            queue_id='test_queue_name',
            latest_job_state='running',
            function_id='delete_exps_from_user_models',
            exception_messages_for_failed_runs=[],
            current_retry_attempt=0,
            last_updated=datetime.datetime(2026, 1, 2, 3, 4, 5),
            created_on=datetime.datetime(2026, 1, 2, 3, 4, 6),
        )

        cloud_task_run_dict = cloud_task_run.to_dict_with_timezone_info()

        self.assertEqual(
            cloud_task_run_dict['last_updated'], '2026-01-02T03:04:05+00:00'
        )
        self.assertEqual(
            cloud_task_run_dict['created_on'], '2026-01-02T03:04:06+00:00'
        )


class VoiceoverRegenerationJobTests(test_utils.GenericTestBase):
    """Unit tests for VoiceoverRegenerationJob domain object."""

    def test_should_create_domain_object_correctly(self) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'SUCCEEDED',
                'content_1': 'FAILED',
            }
        }

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id,
                task_run_id,
                language_accent_to_content_status_map,
            )
        )

        self.assertEqual(
            voiceover_regeneration_task_mapping.exploration_id, exploration_id
        )
        self.assertEqual(
            voiceover_regeneration_task_mapping.task_run_id, task_run_id
        )
        self.assertEqual(
            voiceover_regeneration_task_mapping.language_accent_to_content_status_map,
            language_accent_to_content_status_map,
        )

    def test_should_create_domain_object_from_dict(self) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'SUCCEEDED',
                'content_1': 'FAILED',
            }
        }

        voiceover_regeneration_task_mapping_dict: (
            cloud_task_domain.VoiceoverRegenerationJobDict
        ) = {
            'exploration_id': exploration_id,
            'task_run_id': task_run_id,
            'language_accent_to_content_status_map': (
                language_accent_to_content_status_map
            ),
        }

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob.from_dict(
                voiceover_regeneration_task_mapping_dict
            )
        )

        self.assertEqual(
            voiceover_regeneration_task_mapping.to_dict(),
            voiceover_regeneration_task_mapping_dict,
        )

    def test_should_be_able_to_create_default_object(self) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob.create_default(
                exploration_id, task_run_id
            )
        )

        self.assertEqual(
            voiceover_regeneration_task_mapping.exploration_id, exploration_id
        )
        self.assertEqual(
            voiceover_regeneration_task_mapping.task_run_id, task_run_id
        )
        self.assertEqual(
            voiceover_regeneration_task_mapping.language_accent_to_content_status_map,
            {},
        )

    def test_should_verify_if_all_voiceovers_are_generated(self) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'SUCCEEDED',
                'content_1': 'SUCCEEDED',
            },
            'hi-IN': {
                'content_0': 'SUCCEEDED',
                'content_1': 'SUCCEEDED',
            },
        }

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id,
                task_run_id,
                language_accent_to_content_status_map,
            )
        )

        self.assertTrue(
            voiceover_regeneration_task_mapping.are_all_voiceovers_generated()
        )

        voiceover_regeneration_task_mapping.language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'SUCCEEDED',
                'content_1': 'FAILED',
            }
        }

        self.assertFalse(
            voiceover_regeneration_task_mapping.are_all_voiceovers_generated()
        )

    def test_should_update_final_content_status_successfully(
        self,
    ) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'GENERATING',
                'content_1': 'GENERATING',
                'content_2': 'GENERATING',
            }
        }

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id,
                task_run_id,
                language_accent_to_content_status_map,
            )
        )
        self.assertFalse(
            voiceover_regeneration_task_mapping.are_all_voiceovers_attempted()
        )

        voiceover_regeneration_task_mapping.update_final_content_status(
            'en-US', ['content_1']
        )

        expected_language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'SUCCEEDED',
                'content_1': 'FAILED',
                'content_2': 'SUCCEEDED',
            }
        }

        self.assertEqual(
            voiceover_regeneration_task_mapping.language_accent_to_content_status_map,
            expected_language_accent_to_content_status_map,
        )
        self.assertTrue(
            voiceover_regeneration_task_mapping.are_all_voiceovers_attempted()
        )
        self.assertEqual(
            voiceover_regeneration_task_mapping.count_total_failed_contents(), 1
        )

    def test_should_add_language_accent_to_content_status_map(self) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map: Dict[str, Dict[str, str]] = {}

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id,
                task_run_id,
                language_accent_to_content_status_map,
            )
        )

        voiceover_regeneration_task_mapping.add_language_accent_to_content_status_map(
            'en-US', ['content_0', 'content_1']
        )

        expected_language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'GENERATING',
                'content_1': 'GENERATING',
            }
        }

        self.assertEqual(
            voiceover_regeneration_task_mapping.language_accent_to_content_status_map,
            expected_language_accent_to_content_status_map,
        )

    def test_should_successfully_update_status_of_contents(self) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'GENERATING',
                'content_1': 'GENERATING',
            }
        }

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id,
                task_run_id,
                language_accent_to_content_status_map,
            )
        )

        voiceover_regeneration_task_mapping.update_succeeded_content_status(
            'en-US', ['content_0']
        )
        voiceover_regeneration_task_mapping.update_failed_content_status(
            'en-US', ['content_1']
        )

        expected_language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'SUCCEEDED',
                'content_1': 'FAILED',
            }
        }

        self.assertEqual(
            voiceover_regeneration_task_mapping.language_accent_to_content_status_map,
            expected_language_accent_to_content_status_map,
        )

    def test_should_update_remaining_content_status_as_succeeded(self) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'GENERATING',
                'content_1': 'FAILED',
                'content_2': 'SUCCEEDED',
            },
            'hi-IN': {
                'content_3': 'GENERATING',
            },
        }

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id,
                task_run_id,
                language_accent_to_content_status_map,
            )
        )

        self.assertFalse(
            voiceover_regeneration_task_mapping.are_all_voiceovers_attempted()
        )

        (
            voiceover_regeneration_task_mapping.update_remaining_content_status_as_succeeded()
        )

        expected_language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'SUCCEEDED',
                'content_1': 'FAILED',
                'content_2': 'SUCCEEDED',
            },
            'hi-IN': {
                'content_3': 'SUCCEEDED',
            },
        }

        self.assertEqual(
            voiceover_regeneration_task_mapping.language_accent_to_content_status_map,
            expected_language_accent_to_content_status_map,
        )
        self.assertTrue(
            voiceover_regeneration_task_mapping.are_all_voiceovers_attempted()
        )


class VoiceoverRegenerationTaskBatchTests(test_utils.GenericTestBase):
    """Unit tests for VoiceoverRegenerationTaskBatch domain object."""

    def test_should_create_domain_object_correctly(self) -> None:
        parent_cloud_task_run_id = 'parent_task_run_id'
        child_cloud_task_run_id = 'child_task_run_id_1'
        exploration_id = 'exp_id'
        exploration_version = 1
        language_accent_code = 'en-US'
        content_ids_to_contents_map = {
            'content_0': 'This is content 0',
            'content_1': 'This is content 1',
        }

        voiceover_regeneration_task_batch = (
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_cloud_task_run_id,
                child_cloud_task_run_id,
                exploration_id,
                exploration_version,
                language_accent_code,
                content_ids_to_contents_map,
            )
        )

        self.assertEqual(
            voiceover_regeneration_task_batch.parent_cloud_task_run_id,
            parent_cloud_task_run_id,
        )
        self.assertEqual(
            voiceover_regeneration_task_batch.child_cloud_task_run_id,
            child_cloud_task_run_id,
        )
        self.assertEqual(
            voiceover_regeneration_task_batch.exploration_id, exploration_id
        )
        self.assertEqual(
            voiceover_regeneration_task_batch.exploration_version,
            exploration_version,
        )
        self.assertEqual(
            voiceover_regeneration_task_batch.language_accent_code,
            language_accent_code,
        )
        self.assertEqual(
            voiceover_regeneration_task_batch.content_ids_to_contents_map,
            content_ids_to_contents_map,
        )

    def test_should_create_domain_object_from_dict(self) -> None:
        parent_cloud_task_run_id = 'parent_task_run_id'
        child_cloud_task_run_id = 'child_task_run_id_1'
        exploration_id = 'exp_id'
        exploration_version = 1
        language_accent_code = 'en-US'
        content_ids_to_contents_map = {
            'content_0': 'This is content 0',
            'content_1': 'This is content 1',
        }

        voiceover_regeneration_task_batch_dict: (
            cloud_task_domain.VoiceoverRegenerationTaskBatchDict
        ) = {
            'parent_cloud_task_run_id': parent_cloud_task_run_id,
            'child_cloud_task_run_id': child_cloud_task_run_id,
            'exploration_id': exploration_id,
            'exploration_version': exploration_version,
            'language_accent_code': language_accent_code,
            'content_ids_to_contents_map': content_ids_to_contents_map,
        }

        voiceover_regeneration_task_batch = (
            cloud_task_domain.VoiceoverRegenerationTaskBatch.from_dict(
                voiceover_regeneration_task_batch_dict
            )
        )

        self.assertEqual(
            voiceover_regeneration_task_batch.to_dict(),
            voiceover_regeneration_task_batch_dict,
        )

    def test_should_convert_to_dict_correctly(self) -> None:
        parent_cloud_task_run_id = 'parent_task_run_id'
        child_cloud_task_run_id = 'child_task_run_id_1'
        exploration_id = 'exp_id'
        exploration_version = 2
        language_accent_code = 'hi-IN'
        content_ids_to_contents_map = {
            'content_0': 'Content 0 text',
        }

        voiceover_regeneration_task_batch = (
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_cloud_task_run_id,
                child_cloud_task_run_id,
                exploration_id,
                exploration_version,
                language_accent_code,
                content_ids_to_contents_map,
            )
        )

        expected_dict = {
            'parent_cloud_task_run_id': parent_cloud_task_run_id,
            'child_cloud_task_run_id': child_cloud_task_run_id,
            'exploration_id': exploration_id,
            'exploration_version': exploration_version,
            'language_accent_code': language_accent_code,
            'content_ids_to_contents_map': content_ids_to_contents_map,
        }

        self.assertEqual(
            voiceover_regeneration_task_batch.to_dict(), expected_dict
        )

    def test_should_handle_empty_content_map(self) -> None:
        parent_cloud_task_run_id = 'parent_task_run_id'
        child_cloud_task_run_id = 'child_task_run_id_1'
        exploration_id = 'exp_id'
        exploration_version = 1
        language_accent_code = 'en-US'
        content_ids_to_contents_map: Dict[str, str] = {}

        voiceover_regeneration_task_batch = (
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_cloud_task_run_id,
                child_cloud_task_run_id,
                exploration_id,
                exploration_version,
                language_accent_code,
                content_ids_to_contents_map,
            )
        )

        self.assertEqual(
            voiceover_regeneration_task_batch.content_ids_to_contents_map, {}
        )
