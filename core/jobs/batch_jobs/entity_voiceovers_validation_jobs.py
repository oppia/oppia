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

"""ExplorationModel and EntityVoiceovesModel sync jobs."""

from __future__ import annotations

import logging

from core.domain import opportunity_services, state_domain
from core.domain import voiceover_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models
from core import feconf

import apache_beam as beam
from typing import Iterable, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, exp_models, voiceover_models

datastore_services = models.Registry.import_datastore_services()

(
    voiceover_models,
    exp_models,
) = models.Registry.import_models(
    [models.Names.VOICEOVER, models.Names.EXPLORATION]
)


class EntityVoiceoversValidationAuditJob(base_jobs.JobBase):
    """This job reviews the EntityVoiceoversModel and logs the voiceover status
    for each entry, indicating whether voiceovers are missing or complete.
    """

    def validate_models(
        self,
        exploration_model: Optional[exp_models.ExplorationModel],
        entity_voiceovers_models: Iterable[
            voiceover_models.EntityVoiceoversModel
        ],
    ):
        print('\n\nNikhil')
        with datastore_services.get_ndb_context():
            print(entity_voiceovers_models)
            print(exploration_model)
        entity_voiceovers_list = []
        for entity_voiceovers_model in entity_voiceovers_models:

            if (
                entity_voiceovers_model.entity_version
                != exploration_model.version
            ):
                continue
            entity_voiceovers_list.append(
                voiceover_services.get_entity_voiceovers_from_model(
                    entity_voiceovers_model
                )
            )
        logs = ''
        logs += 'Exploration ID: %s\n' % exploration_model.id

        for entity_voiceovers in entity_voiceovers_list:
            manual_voiceovers_count = 0
            voiceovers_mapping = entity_voiceovers.voiceovers_mapping
            for voiceover_to_voiceover_type in voiceovers_mapping.values():
                manual_voiceover = voiceover_to_voiceover_type.get(
                    feconf.VoiceoverType.MANUAL.value, None
                )
                if manual_voiceover is not None:
                    manual_voiceovers_count += 1

            logs += (
                'EntityVoiceoversModel: %s-%s-%s, contains %d manual voiceovers.\n'
                % (
                    entity_voiceovers.entity_id,
                    entity_voiceovers.entity_version,
                    entity_voiceovers.language_accent_code,
                    manual_voiceovers_count,
                )
            )
        return logs

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        exploration_models = (
            self.pipeline
            | 'Get exploration models'
            >> ndb_io.GetModels(exp_models.ExplorationModel.get_all())
        )

        entity_voiceovers_models = (
            self.pipeline
            | 'Get all EntityVoiceoversModels'
            >> ndb_io.GetModels(
                voiceover_models.EntityVoiceoversModel.get_all()
            )
        )

        paired_exploration_models = (
            exploration_models
            | 'Pair Exploration ID to model'
            >> beam.Map(lambda model: (model.id, model))
        )

        paired_entity_voiceovers_models = (
            entity_voiceovers_models
            | 'Pair EntityVoiceoversModel ID to model'
            >> beam.Map(lambda model: (model.entity_id, model))
        )

        grouped_models = (
            {
                'exploration_model': paired_exploration_models,
                'entity_voiceovers_models': paired_entity_voiceovers_models,
            }
            | 'Group by Exploration ID' >> beam.CoGroupByKey()
            | 'Filter out Exploration without EntityVoiceoversModels'
            >> beam.Filter(
                lambda tup: len(tup[1]['exploration_model']) == 1
                and len(tup[1]['entity_voiceovers_models']) > 0
            )
        )

        validation_logs = (
            grouped_models
            | 'Validate Entity Voiceovers'
            >> beam.Map(
                lambda models: self.validate_models(
                    exploration_model=models[1]['exploration_model'][0],
                    entity_voiceovers_models=models[1][
                        'entity_voiceovers_models'
                    ],
                )
            )
        )

        return validation_logs | 'Final output' >> beam.Map(
            job_run_result.JobRunResult.as_stdout
        )
