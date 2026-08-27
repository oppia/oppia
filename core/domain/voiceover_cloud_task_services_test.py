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

    def test_should_get_voiceover_regeneration_job(self) -> None:
        task_run_id = 'task_run_id'
        exploration_id = 'exploration_id'
        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id, task_run_id, {}
            )
        )

        voiceover_cloud_task_services.save_voiceover_regeneration_job(
            voiceover_regeneration_task_mapping
        )

        retrieved_task = (
            voiceover_cloud_task_services.get_voiceover_regeneration_job(
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

    def test_should_get_voiceover_regeneration_job_models_by_exploration_id(
        self,
    ) -> None:
        task_run_id = 'task_run_id'
        exploration_id = 'exploration_id'
        language_accent_to_content_status_map = {
            'en-US': {'content_0': 'SUCCEEDED', 'content_1': 'SUCCEEDED'}
        }
        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id,
                task_run_id,
                language_accent_to_content_status_map,
            )
        )

        voiceover_cloud_task_services.save_voiceover_regeneration_job(
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

    def test_should_update_voiceover_regeneration_job_status(
        self,
    ) -> None:
        task_run_id = 'task_run_id'
        exploration_id = 'exploration_id'
        initial_language_accent_to_content_status_map = {
            'en-US': {'content_0': 'GENERATING', 'content_1': 'SUCCEEDED'}
        }
        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id,
                task_run_id,
                initial_language_accent_to_content_status_map,
            )
        )

        voiceover_cloud_task_services.save_voiceover_regeneration_job(
            voiceover_regeneration_task_mapping
        )

        updated_language_accent_to_content_status_map = {
            'en-US': {'content_0': 'SUCCEEDED', 'content_1': 'SUCCEEDED'}
        }

        voiceover_cloud_task_services.update_voiceover_regeneration_job_status(
            exploration_id, 'en-US', 'content_0', 'SUCCEEDED'
        )

        retrieved_task = (
            voiceover_cloud_task_services.get_voiceover_regeneration_job(
                exploration_id, task_run_id
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_task is not None

        self.assertEqual(
            retrieved_task.language_accent_to_content_status_map,
            updated_language_accent_to_content_status_map,
        )

    def test_should_able_to_delete_voiceover_regeneration_job_model(
        self,
    ) -> None:
        task_run_id = 'task_run_id'
        exploration_id = 'exploration_id'
        initial_language_accent_to_content_status_map = {
            'en-US': {'content_0': 'GENERATING', 'content_1': 'SUCCEEDED'}
        }
        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id,
                task_run_id,
                initial_language_accent_to_content_status_map,
            )
        )

        voiceover_cloud_task_services.save_voiceover_regeneration_job(
            voiceover_regeneration_task_mapping
        )

        voiceover_cloud_task_services.delete_voiceover_regeneration_job(
            exploration_id, task_run_id
        )

        self.assertIsNone(
            voiceover_cloud_task_services.get_voiceover_regeneration_job(
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
            cloud_task_models.VoiceoverRegenerationJobModel(
                exploration_id=exploration_id,
                cloud_task_run_id=task_run_id_1,
                language_accent_to_content_status_map=(
                    language_accent_to_content_status_map_1
                ),
            )
        )

        voiceover_regeneration_task_mapping_2 = (
            cloud_task_models.VoiceoverRegenerationJobModel(
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
            voiceover_cloud_task_services.is_voiceover_regeneration_defer_function(
                function_name
            )
        )

        function_name = feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
            'FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS'
        ]

        self.assertFalse(
            voiceover_cloud_task_services.is_voiceover_regeneration_defer_function(
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

    def test_should_create_voiceover_regeneration_task_batch_model(
        self,
    ) -> None:
        parent_task_run_id = 'parent_task_run_id'
        child_task_run_id = 'child_task_run_id'
        exploration_id = 'exploration_id'
        exploration_version = 1
        language_accent_code = 'en-US'
        content_ids_to_contents_map = {
            'content_0': 'Hello world!',
            'content_1': 'First card.',
        }

        voiceover_regeneration_task_batch = (
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_task_run_id,
                child_task_run_id,
                exploration_id,
                exploration_version,
                language_accent_code,
                content_ids_to_contents_map,
            )
        )

        model_instance = voiceover_cloud_task_services.create_voiceover_regeneration_task_batch_model(
            voiceover_regeneration_task_batch
        )

        self.assertEqual(
            model_instance.parent_cloud_task_run_id, parent_task_run_id
        )
        self.assertEqual(
            model_instance.child_cloud_task_run_id, child_task_run_id
        )
        self.assertEqual(model_instance.exploration_id, exploration_id)
        self.assertEqual(
            model_instance.exploration_version, exploration_version
        )
        self.assertEqual(
            model_instance.language_accent_code, language_accent_code
        )
        self.assertEqual(
            model_instance.content_ids_to_contents_map,
            content_ids_to_contents_map,
        )

    def test_should_create_voiceover_regeneration_task_batch_models(
        self,
    ) -> None:
        parent_task_run_id = 'parent_task_run_id'
        exploration_id = 'exploration_id'
        exploration_version = 1

        batch_instances = [
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_task_run_id,
                'child_task_run_id_1',
                exploration_id,
                exploration_version,
                'en-US',
                {'content_0': 'Hello world!', 'content_1': 'First card.'},
            ),
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_task_run_id,
                'child_task_run_id_2',
                exploration_id,
                exploration_version,
                'hi-IN',
                {'content_2': 'नमस्ते दुनिया!', 'content_3': 'पहला कार्ड.'},
            ),
        ]

        voiceover_cloud_task_services.create_voiceover_regeneration_task_batch_models(
            batch_instances
        )

        retrieved_batch_1 = voiceover_cloud_task_services.get_voiceover_regeneration_task_batch_model(
            parent_task_run_id, 'child_task_run_id_1'
        )
        self.assertIsNotNone(retrieved_batch_1)
        assert retrieved_batch_1 is not None
        self.assertEqual(retrieved_batch_1.language_accent_code, 'en-US')

        retrieved_batch_2 = voiceover_cloud_task_services.get_voiceover_regeneration_task_batch_model(
            parent_task_run_id, 'child_task_run_id_2'
        )
        self.assertIsNotNone(retrieved_batch_2)
        assert retrieved_batch_2 is not None
        self.assertEqual(retrieved_batch_2.language_accent_code, 'hi-IN')

    def test_should_get_voiceover_regeneration_batch_instances_by_parent_task_run_id(
        self,
    ) -> None:
        parent_task_run_id = 'parent_task_run_id'
        exploration_id = 'exploration_id'
        exploration_version = 1

        batch_instances = [
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_task_run_id,
                'child_task_run_id_1',
                exploration_id,
                exploration_version,
                'en-US',
                {'content_0': 'Hello world!'},
            ),
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_task_run_id,
                'child_task_run_id_2',
                exploration_id,
                exploration_version,
                'hi-IN',
                {'content_1': 'नमस्ते दुनिया!'},
            ),
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_task_run_id,
                'child_task_run_id_3',
                exploration_id,
                exploration_version,
                'es-ES',
                {'content_2': '¡Hola mundo!'},
            ),
        ]

        voiceover_cloud_task_services.create_voiceover_regeneration_task_batch_models(
            batch_instances
        )

        retrieved_instances = voiceover_cloud_task_services.get_voiceover_regeneration_batch_instances_by_parent_task_run_id(
            parent_task_run_id
        )

        self.assertEqual(len(retrieved_instances), 3)
        self.assertEqual(retrieved_instances[0].language_accent_code, 'en-US')
        self.assertEqual(retrieved_instances[1].language_accent_code, 'hi-IN')
        self.assertEqual(retrieved_instances[2].language_accent_code, 'es-ES')

    def test_should_get_voiceover_regeneration_task_batch_model(
        self,
    ) -> None:
        parent_task_run_id = 'parent_task_run_id'
        child_task_run_id = 'child_task_run_id'
        exploration_id = 'exploration_id'
        exploration_version = 2
        language_accent_code = 'en-US'
        content_ids_to_contents_map = {
            'content_0': 'Hello world!',
            'content_1': 'First card.',
        }

        voiceover_regeneration_task_batch = (
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_task_run_id,
                child_task_run_id,
                exploration_id,
                exploration_version,
                language_accent_code,
                content_ids_to_contents_map,
            )
        )

        voiceover_cloud_task_services.create_voiceover_regeneration_task_batch_model(
            voiceover_regeneration_task_batch
        )

        retrieved_batch = voiceover_cloud_task_services.get_voiceover_regeneration_task_batch_model(
            parent_task_run_id, child_task_run_id
        )

        self.assertIsNotNone(retrieved_batch)
        assert retrieved_batch is not None
        self.assertEqual(
            retrieved_batch.parent_cloud_task_run_id, parent_task_run_id
        )
        self.assertEqual(
            retrieved_batch.child_cloud_task_run_id, child_task_run_id
        )
        self.assertEqual(retrieved_batch.exploration_id, exploration_id)
        self.assertEqual(
            retrieved_batch.exploration_version, exploration_version
        )
        self.assertEqual(
            retrieved_batch.language_accent_code, language_accent_code
        )
        self.assertEqual(
            retrieved_batch.content_ids_to_contents_map,
            content_ids_to_contents_map,
        )

    def test_should_return_none_for_non_existent_batch_model(self) -> None:
        retrieved_batch = voiceover_cloud_task_services.get_voiceover_regeneration_task_batch_model(
            'non_existent_parent', 'non_existent_child'
        )

        self.assertIsNone(retrieved_batch)

    def test_should_convert_voiceover_regeneration_task_batch_model_to_domain_instance(
        self,
    ) -> None:
        parent_task_run_id = 'parent_task_run_id'
        child_task_run_id = 'child_task_run_id'
        exploration_id = 'exploration_id'
        exploration_version = 3
        language_accent_code = 'en-IN'
        content_ids_to_contents_map = {
            'content_0': 'Test content 0',
            'content_1': 'Test content 1',
        }

        model_instance = (
            cloud_task_models.VoiceoverRegenerationBatchExecutionModel(
                parent_cloud_task_run_id=parent_task_run_id,
                child_cloud_task_run_id=child_task_run_id,
                exploration_id=exploration_id,
                exploration_version=exploration_version,
                language_accent_code=language_accent_code,
                content_ids_to_contents_map=content_ids_to_contents_map,
            )
        )

        domain_instance = voiceover_cloud_task_services.convert_voiceover_regeneration_task_batch_model_to_domain_instance(
            model_instance
        )

        self.assertEqual(
            domain_instance.parent_cloud_task_run_id, parent_task_run_id
        )
        self.assertEqual(
            domain_instance.child_cloud_task_run_id, child_task_run_id
        )
        self.assertEqual(domain_instance.exploration_id, exploration_id)
        self.assertEqual(
            domain_instance.exploration_version, exploration_version
        )
        self.assertEqual(
            domain_instance.language_accent_code, language_accent_code
        )
        self.assertEqual(
            domain_instance.content_ids_to_contents_map,
            content_ids_to_contents_map,
        )

    def test_should_create_voiceover_regeneration_task_batch_model_if_not_exists(
        self,
    ) -> None:
        parent_task_run_id = 'parent_task_run_id'
        child_task_run_id = 'child_task_run_id'
        exploration_id = 'exploration_id'
        exploration_version = 1
        language_accent_code = 'en-US'
        content_ids_to_contents_map = {
            'content_0': 'Hello world!',
        }

        domain_instance = cloud_task_domain.VoiceoverRegenerationTaskBatch(
            parent_task_run_id,
            child_task_run_id,
            exploration_id,
            exploration_version,
            language_accent_code,
            content_ids_to_contents_map,
        )

        voiceover_cloud_task_services.create_or_update_voiceover_regeneration_task_batch_model(
            domain_instance
        )

        retrieved_batch = voiceover_cloud_task_services.get_voiceover_regeneration_task_batch_model(
            parent_task_run_id, child_task_run_id
        )

        self.assertIsNotNone(retrieved_batch)
        assert retrieved_batch is not None
        self.assertEqual(
            retrieved_batch.language_accent_code, language_accent_code
        )
        self.assertEqual(
            retrieved_batch.content_ids_to_contents_map,
            content_ids_to_contents_map,
        )

    def test_should_update_existing_voiceover_regeneration_task_batch_model(
        self,
    ) -> None:
        parent_task_run_id = 'parent_task_run_id'
        child_task_run_id = 'child_task_run_id'
        exploration_id = 'exploration_id'
        exploration_version = 1
        language_accent_code = 'en-US'
        initial_content_map = {'content_0': 'Hello world!'}

        domain_instance = cloud_task_domain.VoiceoverRegenerationTaskBatch(
            parent_task_run_id,
            child_task_run_id,
            exploration_id,
            exploration_version,
            language_accent_code,
            initial_content_map,
        )

        voiceover_cloud_task_services.create_or_update_voiceover_regeneration_task_batch_model(
            domain_instance
        )

        updated_content_map = {
            'content_0': 'Hello world!',
            'content_1': 'First card.',
        }
        updated_exploration_version = 2

        updated_domain_instance = (
            cloud_task_domain.VoiceoverRegenerationTaskBatch(
                parent_task_run_id,
                child_task_run_id,
                exploration_id,
                updated_exploration_version,
                language_accent_code,
                updated_content_map,
            )
        )

        voiceover_cloud_task_services.create_or_update_voiceover_regeneration_task_batch_model(
            updated_domain_instance
        )

        retrieved_batch = voiceover_cloud_task_services.get_voiceover_regeneration_task_batch_model(
            parent_task_run_id, child_task_run_id
        )

        self.assertIsNotNone(retrieved_batch)
        assert retrieved_batch is not None
        self.assertEqual(
            retrieved_batch.exploration_version, updated_exploration_version
        )
        self.assertEqual(
            retrieved_batch.content_ids_to_contents_map, updated_content_map
        )
