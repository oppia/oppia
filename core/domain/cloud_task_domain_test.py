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


class VoiceoverRegenerationTaskMappingTests(test_utils.GenericTestBase):
    """Unit tests for VoiceoverRegenerationTaskMapping domain object."""

    def test_that_domain_object_is_created_correctly(self) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'succeeded',
                'content_1': 'failed',
            }
        }

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationTaskMapping(
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
                'content_0': 'succeeded',
                'content_1': 'failed',
            }
        }

        voiceover_regeneration_task_mapping_dict: (
            cloud_task_domain.VoiceoverRegenerationTaskMappingDict
        ) = {
            'exploration_id': exploration_id,
            'task_run_id': task_run_id,
            'language_accent_to_content_status_map': (
                language_accent_to_content_status_map
            ),
        }

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationTaskMapping.from_dict(
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

        voiceover_regeneration_task_mapping = cloud_task_domain.VoiceoverRegenerationTaskMapping.create_default_voiceover_regeneration_task_mapping(
            exploration_id, task_run_id
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

    def test_should_verify_all_voiceovers_are_generated(self) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'succeeded',
                'content_1': 'succeeded',
            },
            'hi-IN': {
                'content_0': 'succeeded',
                'content_1': 'succeeded',
            },
        }

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationTaskMapping(
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
                'content_0': 'succeeded',
                'content_1': 'failed',
            }
        }

        self.assertFalse(
            voiceover_regeneration_task_mapping.are_all_voiceovers_generated()
        )

    def test_should_update_final_content_status_for_cloud_task_run(
        self,
    ) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'generating',
                'content_1': 'generating',
                'content_2': 'generating',
            }
        }

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationTaskMapping(
                exploration_id,
                task_run_id,
                language_accent_to_content_status_map,
            )
        )

        voiceover_regeneration_task_mapping.update_final_content_status_for_cloud_task_run(
            'en-US', ['content_1']
        )

        expected_language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'succeeded',
                'content_1': 'failed',
                'content_2': 'succeeded',
            }
        }

        self.assertEqual(
            voiceover_regeneration_task_mapping.language_accent_to_content_status_map,
            expected_language_accent_to_content_status_map,
        )

    def test_should_add_language_accent_to_content_status_map(self) -> None:
        exploration_id = 'exp_id'
        task_run_id = 'task_run_id'
        language_accent_to_content_status_map = {}

        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationTaskMapping(
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
                'content_0': 'generating',
                'content_1': 'generating',
            }
        }

        self.assertEqual(
            voiceover_regeneration_task_mapping.language_accent_to_content_status_map,
            expected_language_accent_to_content_status_map,
        )
