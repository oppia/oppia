# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for Fante language removal audit jobs."""

from __future__ import annotations

from core.jobs.batch_jobs import fante_language_removal_audit_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import translation_models
    from mypy_imports import voiceover_models

(translation_models, voiceover_models) = models.Registry.import_models(
    [models.Names.TRANSLATION, models.Names.VOICEOVER]
)


class AuditFanteEntityTranslationsJobTest(test_utils.JobTestBase):

    JOB_CLASS = (
        fante_language_removal_audit_jobs.AuditFanteEntityTranslationsJob
    )

    def test_no_fante_translations_reports_nothing(self) -> None:
        translation_models.EntityTranslationsModel.create_new(
            entity_type='exploration',
            entity_id='exp1',
            entity_version=1,
            language_code='en',
            translations={},
        ).put()
        self.assert_job_output_is_empty()

    def test_fante_translation_is_reported(self) -> None:
        model = translation_models.EntityTranslationsModel.create_new(
            entity_type='exploration',
            entity_id='exp2',
            entity_version=1,
            language_code='fat',
            translations={},
        )
        model.put()
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'FOUND: EntityTranslationsModel id=%s '
                    'has language_code=fat' % model.id
                )
            ]
        )


class AuditFanteEntityVoiceoversJobTest(test_utils.JobTestBase):

    JOB_CLASS = fante_language_removal_audit_jobs.AuditFanteEntityVoiceoversJob

    def test_no_fante_voiceovers_reports_nothing(self) -> None:
        model = voiceover_models.EntityVoiceoversModel.create_new(
            entity_type='exploration',
            entity_id='exp1',
            entity_version=1,
            language_accent_code='en-US',
        )
        model.language_codes_mapping = {'en': {'en-US': False}}
        model.put()
        self.assert_job_output_is_empty()

    def test_fante_voiceover_is_reported(self) -> None:
        model = voiceover_models.EntityVoiceoversModel.create_new(
            entity_type='exploration',
            entity_id='exp2',
            entity_version=1,
            language_accent_code='fat-GH',
        )
        model.language_codes_mapping = {'fat': {'fat-GH': True}}
        model.put()
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'FOUND: EntityVoiceoversModel id=%s '
                    'has Fante language_codes_mapping' % model.id
                )
            ]
        )


class AuditFanteMachineTranslationsJobTest(test_utils.JobTestBase):

    JOB_CLASS = (
        fante_language_removal_audit_jobs.AuditFanteMachineTranslationsJob
    )

    def test_no_fante_machine_translations_reports_nothing(self) -> None:
        translation_models.MachineTranslationModel.create_new(
            source_language_code='en',
            target_language_code='fr',
            source_text='Hello',
            translated_text='Bonjour',
        ).put()
        self.assert_job_output_is_empty()

    def test_fante_as_target_language_is_reported(self) -> None:
        model = translation_models.MachineTranslationModel.create_new(
            source_language_code='en',
            target_language_code='fat',
            source_text='Hello',
            translated_text='Hello in Fante',
        )
        model.put()
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'FOUND: MachineTranslationModel id=%s '
                    'references language_code=fat' % model.id
                )
            ]
        )

    def test_fante_as_source_language_is_reported(self) -> None:
        model = translation_models.MachineTranslationModel.create_new(
            source_language_code='fat',
            target_language_code='en',
            source_text='Hello in Fante',
            translated_text='Hello',
        )
        model.put()
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'FOUND: MachineTranslationModel id=%s '
                    'references language_code=fat' % model.id
                )
            ]
        )
