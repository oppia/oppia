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

"""Unit tests for voiceover_cloud_task_services.py"""

from __future__ import annotations

from core import feconf
from core.domain import cloud_task_domain, voiceover_cloud_task_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import cloud_task_models

(cloud_task_models,) = models.Registry.import_models([models.Names.CLOUD_TASK])


class CloudTaskServicesTests(test_utils.GenericTestBase):
    """Unit tests for voiceover cloud task service functionalities."""

    def test_should_get_voiceover_regeneration_task(self) -> None:
        task_run_id = 'task_run_id'
        exploration_id = 'exploration_id'
        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationTaskMapping(
                exploration_id, task_run_id, {}
            )
        )

        voiceover_cloud_task_services.save_voiceover_regeneration_task_run_mapping(
            voiceover_regeneration_task_mapping
        )

        retrieved_task = (
            voiceover_cloud_task_services.get_voiceover_regeneration_task(
                exploration_id, task_run_id
            )
        )

        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_task is not None

        self.assertEqual(
            retrieved_task.exploration_id,
            voiceover_regeneration_task_mapping.exploration_id,
        )
        self.assertEqual(
            retrieved_task.task_run_id,
            voiceover_regeneration_task_mapping.task_run_id,
        )
        self.assertEqual(
            retrieved_task.language_accent_to_content_status_map,
            voiceover_regeneration_task_mapping.language_accent_to_content_status_map,
        )

    def test_should_get_voiceover_regeneration_tasks_by_exploration_id(
        self,
    ) -> None:
        task_run_id = 'task_run_id'
        exploration_id = 'exploration_id'
        language_accent_to_content_status_map = {
            'en-US': {'content_0': 'SUCCEEDED', 'content_1': 'SUCCEEDED'}
        }
        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationTaskMapping(
                exploration_id,
                task_run_id,
                language_accent_to_content_status_map,
            )
        )

        voiceover_cloud_task_services.save_voiceover_regeneration_task_run_mapping(
            voiceover_regeneration_task_mapping
        )

        retrieved_language_accent_to_content_status_map = voiceover_cloud_task_services.get_existing_voiceover_regeneration_requests_in_task_queue(
            exploration_id
        )[
            'language_accent_to_content_status_map'
        ]

        self.assertEqual(
            retrieved_language_accent_to_content_status_map,
            language_accent_to_content_status_map,
        )

    def test_should_update_voiceover_regeneration_task_run_mapping_for_content(
        self,
    ) -> None:
        task_run_id = 'task_run_id'
        exploration_id = 'exploration_id'
        initial_language_accent_to_content_status_map = {
            'en-US': {'content_0': 'GENERATING', 'content_1': 'SUCCEEDED'}
        }
        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationTaskMapping(
                exploration_id,
                task_run_id,
                initial_language_accent_to_content_status_map,
            )
        )

        voiceover_cloud_task_services.save_voiceover_regeneration_task_run_mapping(
            voiceover_regeneration_task_mapping
        )

        updated_language_accent_to_content_status_map = {
            'en-US': {'content_0': 'SUCCEEDED', 'content_1': 'SUCCEEDED'}
        }

        voiceover_cloud_task_services.update_voiceover_regeneration_task_run_mapping_for_content(
            exploration_id, 'en-US', 'content_0', 'SUCCEEDED'
        )

        retrieved_task = (
            voiceover_cloud_task_services.get_voiceover_regeneration_task(
                exploration_id, task_run_id
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_task is not None

        self.assertEqual(
            retrieved_task.language_accent_to_content_status_map,
            updated_language_accent_to_content_status_map,
        )

    def test_should_able_to_delete_voiceover_regeneration_task_run_mapping(
        self,
    ) -> None:
        task_run_id = 'task_run_id'
        exploration_id = 'exploration_id'
        initial_language_accent_to_content_status_map = {
            'en-US': {'content_0': 'GENERATING', 'content_1': 'SUCCEEDED'}
        }
        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationTaskMapping(
                exploration_id,
                task_run_id,
                initial_language_accent_to_content_status_map,
            )
        )

        voiceover_cloud_task_services.save_voiceover_regeneration_task_run_mapping(
            voiceover_regeneration_task_mapping
        )

        voiceover_cloud_task_services.delete_voiceover_regeneration_task_run_mapping(
            exploration_id, task_run_id
        )

        self.assertIsNone(
            voiceover_cloud_task_services.get_voiceover_regeneration_task(
                exploration_id, task_run_id
            )
        )

    def test_should_resolve_multiple_voiceover_regeneration_tasks(self) -> None:
        task_run_id_1 = 'task_run_id_1'
        task_run_id_2 = 'task_run_id_2'
        exploration_id = 'exploration_id'
        language_accent_to_content_status_map_1 = {
            'en-US': {
                'content_0': 'GENERATING',
                'content_1': 'SUCCEEDED',
                'content_2': 'GENERATING',
                'content_4': 'SUCCEEDED',
            },
            'en-IN': {
                'content_0': 'SUCCEEDED',
            },
        }
        language_accent_to_content_status_map_2 = {
            'en-US': {
                'content_0': 'FAILED',
                'content_1': 'SUCCEEDED',
                'content_2': 'SUCCEEDED',
                'content_3': 'GENERATING',
            },
            'hi-IN': {
                'content_0': 'SUCCEEDED',
            },
        }
        voiceover_regeneration_task_mapping_1 = (
            cloud_task_models.VoiceoverRegenerationTaskMappingModel(
                exploration_id=exploration_id,
                cloud_task_run_id=task_run_id_1,
                language_accent_to_content_status_map=(
                    language_accent_to_content_status_map_1
                ),
            )
        )

        voiceover_regeneration_task_mapping_2 = (
            cloud_task_models.VoiceoverRegenerationTaskMappingModel(
                exploration_id=exploration_id,
                cloud_task_run_id=task_run_id_2,
                language_accent_to_content_status_map=(
                    language_accent_to_content_status_map_2
                ),
            )
        )

        retrieved_language_accent_to_content_status_map = voiceover_cloud_task_services.resolve_multiple_cloud_task_runs_for_exploration(
            [
                voiceover_regeneration_task_mapping_1,
                voiceover_regeneration_task_mapping_2,
            ]
        )
        language_accent_to_content_status_map = {
            'en-US': {
                'content_0': 'GENERATING',
                'content_1': 'SUCCEEDED',
                'content_2': 'GENERATING',
                'content_3': 'GENERATING',
                'content_4': 'SUCCEEDED',
            },
            'en-IN': {
                'content_0': 'SUCCEEDED',
            },
            'hi-IN': {
                'content_0': 'SUCCEEDED',
            },
        }

        self.assertDictEqual(
            retrieved_language_accent_to_content_status_map,
            language_accent_to_content_status_map,
        )

        retrieved_language_accent_to_content_status_map = voiceover_cloud_task_services.resolve_multiple_cloud_task_runs_for_exploration(
            []
        )
        self.assertDictEqual(
            retrieved_language_accent_to_content_status_map, {}
        )

    def test_verify_if_given_function_belongs_to_voiceover_regeneration_tasks(
        self,
    ) -> None:
        function_name = feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
            'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_CURATION'
        ]

        self.assertTrue(
            voiceover_cloud_task_services.is_voiceover_regeneration_task_function(
                function_name
            )
        )

        function_name = feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
            'FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS'
        ]

        self.assertFalse(
            voiceover_cloud_task_services.is_voiceover_regeneration_task_function(
                function_name
            )
        )

    def test_should_create_voiceover_regeneration_task_with_status_generating(
        self,
    ) -> None:
        exploration_id = 'exp_id'
        cloud_task_id = 'cloud_task_id'
        language_code_to_contents_mapping = {
            'en': {'content_0': 'Hello world!', 'content_1': 'First card.'},
            'hi': {'content_0': 'हैलो वर्ल्ड!', 'content_1': 'पहला कार्ड.'},
        }
        language_code_to_autogeneratable_accent_codes = {
            'en': ['en-US'],
            'hi': ['hi-IN'],
        }

        voiceover_cloud_task_run_mapping = voiceover_cloud_task_services.create_voiceover_regeneration_task_with_status_generating(
            exploration_id,
            cloud_task_id,
            language_code_to_contents_mapping,
            language_code_to_autogeneratable_accent_codes,
        )

        expected_language_accent_to_content_status_map = {
            'en-US': {'content_0': 'GENERATING', 'content_1': 'GENERATING'},
            'hi-IN': {'content_0': 'GENERATING', 'content_1': 'GENERATING'},
        }

        self.assertEqual(
            voiceover_cloud_task_run_mapping.language_accent_to_content_status_map,
            expected_language_accent_to_content_status_map,
        )
        self.assertEqual(
            voiceover_cloud_task_run_mapping.exploration_id, exploration_id
        )
        self.assertEqual(
            voiceover_cloud_task_run_mapping.task_run_id, cloud_task_id
        )
