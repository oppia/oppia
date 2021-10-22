# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Jobs that are run by CRON scheduler."""

from __future__ import absolute_import
from __future__ import annotations
from __future__ import unicode_literals

from core import feconf
from core.domain import caching_services
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result

from typing import Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import skill_models

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class MigrateSkillJob(base_jobs.JobBase):
    """"""

    @staticmethod
    def _migrate_skill(
            skill_id_and_skill_model: Tuple[str, skill_models.SkillModel]
    ) -> result.Result[skill_domain.Skill, Exception]:
        skill_id, skill_model = skill_id_and_skill_model
        try:
            skill = skill_fetchers.get_skill_from_model(skill_model)
            skill.validate()
        except Exception as e:
            return result.Err((skill_id, e))

        return result.Ok((skill_id, skill))

    @staticmethod
    def _generate_skill_changes(
            skill_model: skill_models.SkillModel
    ) -> Tuple[str, skill_domain.SkillChange]:
        contents_version = skill_model.skill_contents_schema_version
        if contents_version <= feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION:
            skill_change = skill_domain.SkillChange({
                'cmd': (
                    skill_domain.CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION),
                'from_version': skill_model.skill_contents_schema_version,
                'to_version': feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION
            })
            yield skill_change

        misconceptions_version = skill_model.misconceptions_schema_version
        if misconceptions_version <= feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION:  # pylint: disable=line-too-long
            skill_change = skill_domain.SkillChange({
                'cmd': skill_domain.CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION,
                # pylint: disable=line-too-long
                'from_version': skill_model.misconceptions_schema_version,
                'to_version': feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION
            })
            yield skill_change

        rubric_schema_version = skill_model.rubric_schema_version
        if rubric_schema_version <= feconf.CURRENT_RUBRIC_SCHEMA_VERSION:
            skill_change = skill_domain.SkillChange({
                'cmd': (
                    skill_domain.CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION),
                'from_version': skill_model.rubric_schema_version,
                'to_version': feconf.CURRENT_RUBRIC_SCHEMA_VERSION
            })
            yield skill_change

    @staticmethod
    def _delete_skill_from_cache(
        skill: skill_domain.Skill
    ) -> result.Result[str, Exception]:
        try:
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_SKILL, None, [skill.id])
            return result.Ok(skill.id)
        except Exception as e:
            return result.Err(e)

    @staticmethod
    def _update_skill(
        skill_model: skill_models.SkillModel,
        skill: skill_domain.Skill,
        skill_changes: Sequence[skill_domain.SkillChange]
    ):
        updated_skill_model = (
            skill_services.populate_skill_model_with_skill(skill_model, skill))
        commit_message = (
            'Update skill content schema version to %d and '
            'skill misconceptions schema version to %d and '
            'skill rubrics schema version to %d.'
        ) % (
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION
        )
        change_dicts = [change.to_dict() for change in skill_changes]
        return [updated_skill_model]

    @staticmethod
    def _update_skill_summary(
        skill: skill_domain.Skill,
        skill_summary_model: skill_models.SkillSummaryModel
    ):
        skill_summary = skill_services.compute_summary_of_skill(skill)
        updated_skill_summary_model = (
            skill_services.populate_skill_summary_model_with_skill_summary(
                skill_summary_model, skill_summary
            )
        )
        return updated_skill_summary_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """"""

        unmigrated_skill_models = (
            self.pipeline
            | 'Get all non-deleted skill models' >> (
                ndb_io.GetModels(skill_models.SkillModel.get_all()))
            | 'Add skill model ID' >> beam.GroupBy(
                lambda skill_model: skill_model.id)
        )
        skill_summary_models = (
            self.pipeline
            | 'Get all non-deleted skill summary models' >> (
                ndb_io.GetModels(skill_models.SkillSummaryModel.get_all()))
            | 'Add skill summary ID' >> beam.GroupBy(
                lambda skill_summary_model: skill_summary_model.id)
        )

        migrated_skill_results = (
            unmigrated_skill_models
            | 'Transform and migrate model' >> beam.Map(self._migrate_skill)
        )
        migrated_skills = (
            migrated_skill_results
            | 'Filter oks' >> beam.Filter(lambda result: result.is_ok())
            | 'Unwrap ok' >> beam.Map(lambda result: result.unwrap())
        )
        migrated_skill_job_run_results = (
            migrated_skill_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults('SKILL MIGRATION'))
        )

        skill_changes = (
            unmigrated_skill_models
            | 'Generate skill changes' >> beam.Map(
                lambda skill_id, skill_model: (
                    skill_id, self._generate_skill_changes(skill_model)))
        )

        skill_objects_list = (
            {
                'skill_model': unmigrated_skill_models,
                'skill_summary_model': skill_summary_models,
                'skill': migrated_skills,
                'skill_changes': skill_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Reorganize the skill objects' >> beam.Map(lambda x: {
                    'skill_model': x['skill_model'][0][0],
                    'skill_summary_model': x['skill_summary_model'][0][0],
                    'skill': x['skill'][0][0],
                    'skill_changes': x['skill_changes'][0][0]
                })
            | 'Remove unmigrated skills' >> beam.Filter(
                lambda x: len(x['skill_changes']) > 0)
        )

        cache_deletion_job_run_results = (
            skill_objects_list
            | 'Delete skills from cache' >> beam.Map(lambda skill_object:
                self._delete_skill_from_cache(skill_object['skill']))
            | 'Generate results for cache deletion' >> (
                job_result_transforms.ResultsToJobRunResults('CACHE DELETION'))
        )

        skill_models_to_put = (
            skill_objects_list
            | 'Generate skill models to put' >> beam.FlatMap(
                lambda skill_objects: self._update_skill(
                    skill_objects['skill_model'],
                    skill_objects['skill'],
                    skill_objects['skill_changes'],
                ))
        )

        skill_summary_models_to_put = (
            skill_objects_list
            | 'Generate skill summary models to put' >> beam.Map(
                lambda skill_objects: self._update_skill_summary(
                    skill_objects['skill'],
                    skill_objects['skill_summary_model']
                ))
        )

        unused_put_results = (
            (skill_models_to_put, skill_summary_models_to_put)
            | 'Merge models' >> beam.Flatten()
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            (cache_deletion_job_run_results, migrated_skill_job_run_results)
            | beam.Flatten()
        )
