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

"""Unit tests for recover_orphaned_translations_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain, rights_manager
from core.jobs import job_test_utils
from core.jobs.batch_jobs import recover_orphaned_translations_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Any, Dict, Final, Sequence

MYPY = False
if MYPY:
    from mypy_imports import datastore_services, exp_models, translation_models

(exp_models, translation_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.TRANSLATION]
)

datastore_services = models.Registry.import_datastore_services()


class RecoverOrphanedTranslationsJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):

    JOB_CLASS = (
        recover_orphaned_translations_jobs.RecoverOrphanedTranslationsJob
    )

    AUTHOR_EMAIL: Final = 'author@example.com'
    EXP_ID: Final = 'exp_id_1'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)

    def _create_exploration(self, exp_id: str, version: int) -> None:
        """Creates an ExplorationModel with the given ID and version."""
        rights_manager.create_new_exploration_rights(exp_id, self.author_id)
        model = self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title='Test Exploration',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: (
                    exp_domain.Exploration.create_default_exploration(exp_id)
                    .states[feconf.DEFAULT_INIT_STATE_NAME]
                    .to_dict()
                )
            },
        )
        commit_cmd = exp_domain.ExplorationChange(
            {
                'cmd': exp_domain.CMD_CREATE_NEW,
                'title': 'title',
                'category': 'category',
            }
        )
        model.commit(self.author_id, 'commit_message', [commit_cmd.to_dict()])
        # Override the version to simulate a specific version number.
        # After commit, the model version is 1. We update it directly
        # to simulate an exploration that has been edited many times.
        if version > 1:
            model.version = version
            model.update_timestamps(update_last_updated_time=False)
            datastore_services.put_multi([model])

    def _create_translation_model(
        self,
        entity_id: str,
        entity_version: int,
        language_code: str,
        # Here we use type Any because the translations are stored as
        # a nested dictionary with varying structures.
        translations: Dict[str, Any],
    ) -> None:
        """Creates an EntityTranslationsModel with the given parameters."""
        model = translation_models.EntityTranslationsModel.create_new(
            'exploration',
            entity_id,
            entity_version,
            language_code,
            translations,
        )
        model.update_timestamps()
        model.put()

    def test_empty_datastore_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()

    def test_exploration_with_no_translations_produces_no_recovery(
        self,
    ) -> None:
        self._create_exploration(self.EXP_ID, version=5)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATIONS TRAVERSED SUCCESS: 1'
                ),
            ]
        )

    def test_translations_already_at_current_version_are_not_modified(
        self,
    ) -> None:
        self._create_exploration(self.EXP_ID, version=5)
        self._create_translation_model(
            self.EXP_ID,
            5,
            'es',
            {
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Hola</p>',
                    'needs_update': False,
                },
            },
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATIONS TRAVERSED SUCCESS: 1'
                ),
            ]
        )

        # Verify the model is unchanged.
        all_models: Sequence[translation_models.EntityTranslationsModel] = (
            translation_models.EntityTranslationsModel.get_all().fetch()
        )
        self.assertEqual(len(all_models), 1)
        self.assertEqual(all_models[0].entity_version, 5)

    def test_orphaned_translations_are_forward_propagated_to_new_model(
        self,
    ) -> None:
        # Exploration is at version 10, but translations are stuck at
        # version 3.
        self._create_exploration(self.EXP_ID, version=10)
        self._create_translation_model(
            self.EXP_ID,
            3,
            'es',
            {
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Hola</p>',
                    'needs_update': False,
                },
                'content_1': {
                    'content_format': 'html',
                    'content_value': '<p>Mundo</p>',
                    'needs_update': False,
                },
            },
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATIONS TRAVERSED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION MODELS UPDATED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATIONS RECOVERED SUCCESS: 2'
                ),
            ]
        )

        # Verify the new model was created at version 10.
        new_model = translation_models.EntityTranslationsModel.get_model(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 10, 'es'
        )
        self.assertIsNotNone(new_model)
        self.assertEqual(len(new_model.translations), 2)
        self.assertIn('content_0', new_model.translations)
        self.assertIn('content_1', new_model.translations)

    def test_translations_from_multiple_old_versions_are_merged(
        self,
    ) -> None:
        # Exploration is at version 20. Translations exist at versions
        # 5 and 12.
        self._create_exploration(self.EXP_ID, version=20)
        self._create_translation_model(
            self.EXP_ID,
            5,
            'es',
            {
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Old translation</p>',
                    'needs_update': False,
                },
            },
        )
        self._create_translation_model(
            self.EXP_ID,
            12,
            'es',
            {
                'content_1': {
                    'content_format': 'html',
                    'content_value': '<p>Newer translation</p>',
                    'needs_update': False,
                },
            },
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATIONS TRAVERSED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION MODELS UPDATED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATIONS RECOVERED SUCCESS: 2'
                ),
            ]
        )

        # Verify merged model at version 20.
        new_model = translation_models.EntityTranslationsModel.get_model(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 20, 'es'
        )
        self.assertIsNotNone(new_model)
        self.assertEqual(len(new_model.translations), 2)
        self.assertIn('content_0', new_model.translations)
        self.assertIn('content_1', new_model.translations)

    def test_newer_version_translation_overwrites_older_on_conflict(
        self,
    ) -> None:
        # Both old versions have the same content_id. The newer one
        # should win.
        self._create_exploration(self.EXP_ID, version=15)
        self._create_translation_model(
            self.EXP_ID,
            3,
            'es',
            {
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Old value</p>',
                    'needs_update': True,
                },
            },
        )
        self._create_translation_model(
            self.EXP_ID,
            10,
            'es',
            {
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>New value</p>',
                    'needs_update': False,
                },
            },
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATIONS TRAVERSED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION MODELS UPDATED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATIONS RECOVERED SUCCESS: 1'
                ),
            ]
        )

        new_model = translation_models.EntityTranslationsModel.get_model(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 15, 'es'
        )
        self.assertIsNotNone(new_model)
        # The newer translation (version 10) should have won.
        self.assertEqual(
            new_model.translations['content_0']['content_value'],
            '<p>New value</p>',
        )
        self.assertFalse(new_model.translations['content_0']['needs_update'])

    def test_orphaned_translations_merged_into_existing_current_model(
        self,
    ) -> None:
        # Exploration is at version 10. A model already exists at
        # version 10 with one translation, and an old version has
        # another translation that should be merged in.
        self._create_exploration(self.EXP_ID, version=10)
        self._create_translation_model(
            self.EXP_ID,
            10,
            'es',
            {
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Already here</p>',
                    'needs_update': False,
                },
            },
        )
        self._create_translation_model(
            self.EXP_ID,
            5,
            'es',
            {
                'content_1': {
                    'content_format': 'html',
                    'content_value': '<p>Orphaned card</p>',
                    'needs_update': False,
                },
            },
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATIONS TRAVERSED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION MODELS UPDATED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATIONS RECOVERED SUCCESS: 1'
                ),
            ]
        )

        updated_model = translation_models.EntityTranslationsModel.get_model(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 10, 'es'
        )
        self.assertIsNotNone(updated_model)
        self.assertEqual(len(updated_model.translations), 2)
        self.assertIn('content_0', updated_model.translations)
        self.assertIn('content_1', updated_model.translations)

    def test_multiple_languages_are_handled_independently(self) -> None:
        self._create_exploration(self.EXP_ID, version=10)
        # Spanish orphaned at version 3.
        self._create_translation_model(
            self.EXP_ID,
            3,
            'es',
            {
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Hola</p>',
                    'needs_update': False,
                },
            },
        )
        # Portuguese orphaned at version 5.
        self._create_translation_model(
            self.EXP_ID,
            5,
            'pt',
            {
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Olá</p>',
                    'needs_update': False,
                },
            },
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATIONS TRAVERSED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION MODELS UPDATED SUCCESS: 2'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATIONS RECOVERED SUCCESS: 2'
                ),
            ]
        )

        es_model = translation_models.EntityTranslationsModel.get_model(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 10, 'es'
        )
        pt_model = translation_models.EntityTranslationsModel.get_model(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 10, 'pt'
        )
        self.assertIsNotNone(es_model)
        self.assertIsNotNone(pt_model)
        self.assertIn('content_0', es_model.translations)
        self.assertIn('content_0', pt_model.translations)

    def test_deleted_exploration_translations_are_skipped(self) -> None:
        # Create translations with no corresponding exploration.
        self._create_translation_model(
            'deleted_exp',
            5,
            'es',
            {
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Orphan</p>',
                    'needs_update': False,
                },
            },
        )

        self.assert_job_output_is_empty()


class AuditRecoverOrphanedTranslationsJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):

    JOB_CLASS = (
        recover_orphaned_translations_jobs.AuditRecoverOrphanedTranslationsJob
    )

    AUTHOR_EMAIL: Final = 'author@example.com'
    EXP_ID: Final = 'exp_id_1'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)

    def _create_exploration(self, exp_id: str, version: int) -> None:
        """Creates an ExplorationModel with the given ID and version."""
        rights_manager.create_new_exploration_rights(exp_id, self.author_id)
        model = self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title='Test Exploration',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: (
                    exp_domain.Exploration.create_default_exploration(exp_id)
                    .states[feconf.DEFAULT_INIT_STATE_NAME]
                    .to_dict()
                )
            },
        )
        commit_cmd = exp_domain.ExplorationChange(
            {
                'cmd': exp_domain.CMD_CREATE_NEW,
                'title': 'title',
                'category': 'category',
            }
        )
        model.commit(self.author_id, 'commit_message', [commit_cmd.to_dict()])
        if version > 1:
            model.version = version
            model.update_timestamps(update_last_updated_time=False)
            datastore_services.put_multi([model])

    def _create_translation_model(
        self,
        entity_id: str,
        entity_version: int,
        language_code: str,
        # Here we use type Any because the translations are stored as
        # a nested dictionary with varying structures.
        translations: Dict[str, Any],
    ) -> None:
        """Creates an EntityTranslationsModel with the given parameters."""
        model = translation_models.EntityTranslationsModel.create_new(
            'exploration',
            entity_id,
            entity_version,
            language_code,
            translations,
        )
        model.update_timestamps()
        model.put()

    def test_audit_job_does_not_write_to_datastore(self) -> None:
        self._create_exploration(self.EXP_ID, version=10)
        self._create_translation_model(
            self.EXP_ID,
            3,
            'es',
            {
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Orphaned</p>',
                    'needs_update': False,
                },
            },
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATIONS TRAVERSED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION MODELS UPDATED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATIONS RECOVERED SUCCESS: 1'
                ),
            ]
        )

        # Verify that no new model was created at version 10.
        new_model = translation_models.EntityTranslationsModel.get_model(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 10, 'es'
        )
        self.assertIsNone(new_model)

        # Verify the original model is still there, untouched.
        all_models: Sequence[translation_models.EntityTranslationsModel] = (
            translation_models.EntityTranslationsModel.get_all().fetch()
        )
        self.assertEqual(len(all_models), 1)
        self.assertEqual(all_models[0].entity_version, 3)
