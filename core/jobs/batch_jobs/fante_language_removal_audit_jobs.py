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

"""Audit jobs for safely removing the Fante (fat) language from Oppia."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import translation_models
    from mypy_imports import voiceover_models

(translation_models, voiceover_models) = models.Registry.import_models(
    [models.Names.TRANSLATION, models.Names.VOICEOVER]
)

FANTE_LANGUAGE_CODE = 'fat'


class AuditFanteEntityTranslationsJob(base_jobs.JobBase):
    """Audits EntityTranslationsModel for any Fante (fat) language entries."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        return (
            self.pipeline
            | 'Get all EntityTranslationsModels'
            >> ndb_io.GetModels(
                translation_models.EntityTranslationsModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter Fante translations'
            >> beam.Filter(lambda m: m.language_code == FANTE_LANGUAGE_CODE)
            | 'Report found Fante translations'
            >> beam.Map(
                lambda m: job_run_result.JobRunResult.as_stdout(
                    'FOUND: EntityTranslationsModel id=%s '
                    'has language_code=%s' % (m.id, m.language_code)
                )
            )
        )


class AuditFanteEntityVoiceoversJob(base_jobs.JobBase):
    """Audits EntityVoiceoversModel for any Fante (fat-GH) accent entries."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        return (
            self.pipeline
            | 'Get all EntityVoiceoversModels'
            >> ndb_io.GetModels(
                voiceover_models.EntityVoiceoversModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter Fante voiceovers'
            >> beam.Filter(
                lambda m: FANTE_LANGUAGE_CODE in m.language_codes_mapping
            )
            | 'Report found Fante voiceovers'
            >> beam.Map(
                lambda m: job_run_result.JobRunResult.as_stdout(
                    'FOUND: EntityVoiceoversModel id=%s '
                    'has Fante language_codes_mapping' % m.id
                )
            )
        )


class AuditFanteMachineTranslationsJob(base_jobs.JobBase):
    """Audits MachineTranslationModel for any Fante (fat) language entries."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        return (
            self.pipeline
            | 'Get all MachineTranslationModels'
            >> ndb_io.GetModels(
                translation_models.MachineTranslationModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter Fante machine translations'
            >> beam.Filter(
                lambda m: (
                    m.source_language_code == FANTE_LANGUAGE_CODE
                    or m.target_language_code == FANTE_LANGUAGE_CODE
                )
            )
            | 'Report found Fante machine translations'
            >> beam.Map(
                lambda m: job_run_result.JobRunResult.as_stdout(
                    'FOUND: MachineTranslationModel id=%s '
                    'references language_code=%s' % (m.id, FANTE_LANGUAGE_CODE)
                )
            )
        )
