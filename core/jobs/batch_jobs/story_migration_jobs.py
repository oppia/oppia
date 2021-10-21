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
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result

from typing import Dict, Iterable, List, Tuple, Union, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import story_models

(story_models,) = models.Registry.import_models([models.NAMES.story])


class MigrateStoryJob(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        the Elastic Search.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            the Elastic Search.
        """

        unmigrated_skill_models = (
            self.pipeline
            | 'Get all non-deleted models' >> (
                ndb_io.GetModels(story_models.StoryModel.get_all()))
            | 'Add skill keys' >> beam.GroupBy(
                lambda skill_model: skill_model.id)
        )
        skill_summary_models = (
            self.pipeline
            | 'Get all non-deleted models' >> (
                ndb_io.GetModels(skill_models.SkillSummaryModel.get_all()))
            | 'Add skill summary keys' >> beam.GroupBy(
                lambda skill_summary_model: skill_summary_model.id)
        )

        migrated_skill_results = (
            unmigrated_skill_models
            | 'Transform and migrate model' >> beam.Map(self._migrate_skill)
        )
        skill_migration_errors = (
            migrated_skill_results
            | 'Filter errors' >> beam.Filter(result.is_err)
        )
        migrated_skills = (
            migrated_skill_results
            | 'Filter oks' >> beam.Filter(result.is_ok)
            | 'Unwrap ok' >> beam.Map(result.unwrap)
        )

        skill_changes = (
            unmigrated_skill_models
            | 'Transform and migrate model' >> beam.Map(
                lambda skill_id, skill_model: (
                    skill_id, self._generate_skill_changes))
        )

        skill_models_to_put = (

        )

    @staticmethod
    def _migrate_skill(
        skill_id: str, skill_model: skill_models.SkillModel
    ) -> result.Result[skill_domain.Skill, Exception]:
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
        if misconceptions_version <= feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION: # pylint: disable=line-too-long
            skill_change = skill_domain.SkillChange({
                'cmd': skill_domain.CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
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
    def _update_skill(skill_model, skill, skill_summary_model, commit_cmds):
        skill_summary = skill_services.compute_summary_of_skill(skill)

        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_SKILL, None, [skill.id])


        updated_skill_model = (
            skill_services.populate_skill_model_with_skill(skill_model, skill))
        updated_skill_summary_model = (
            skill_services.populate_skill_summary_model_with_skill_summary(
                skill_summary_model, skill_summary
            )
        )

        commit_message = (
            'Update skill content schema version to %d and '
            'skill misconceptions schema version to %d and '
            'skill rubrics schema version to %d.'
        ) % (
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION
        )
        change_dicts = [change.to_dict() for change in commit_cmds]
        updated_skill_model.commit(
            feconf.MIGRATION_BOT_USERNAME, commit_message, change_dicts)