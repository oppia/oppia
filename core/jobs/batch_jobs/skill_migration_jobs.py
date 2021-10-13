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
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result

from typing import Dict, Iterable, List, Tuple, Union, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import skill_models

(skill_models,) = models.Registry.import_models([models.NAMES.skills])

datastore_services = models.Registry.import_datastore_services()

MAX_RECOMMENDATIONS = 10
# Note: There is a threshold so that bad recommendations will be
# discarded even if an exploration has few similar explorations.
SIMILARITY_SCORE_THRESHOLD = 3.0


class MigrateSkillJob(base_jobs.JobBase):
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
                ndb_io.GetModels(skill_models.SkillModel.get_all()))
        )


        migrated_skill_results = (
            skill_models
            | 'Transform and migrate model' >> beam.Map(self._migrate_skill)
        )


    @staticmethod
    def _migrate_skill(
        skill_model
    ) -> result.Result[skill_domain.Skill, Exception]:
        try:
            skill = skill_fetchers.get_skill_from_model(skill_model)
            skill.validate()
        except Exception as e:
            return result.Err(e)

        return result.Ok(skill_model)

    @staticmethod
    def _generate_skill_changes(skill_model):

        skill_contents_version = skill_model.skill_contents_schema_version
        if skill_contents_version <= feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION:
            yield skill_domain.SkillChange({
                'cmd': (
                    skill_domain.CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION),
                'from_version': skill_model.skill_contents_schema_version,
                'to_version': feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION
            })

        misconceptions_version = skill_model.misconceptions_schema_version
        if misconceptions_version <= feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION:
             yield skill_domain.SkillChange({
                'cmd': skill_domain.CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
                'from_version': skill_model.misconceptions_schema_version,
                'to_version': feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION
            })

        rubric_schema_version = skill_model.rubric_schema_version
        if rubric_schema_version <= feconf.CURRENT_RUBRIC_SCHEMA_VERSION:
            yield skill_domain.SkillChange({
                'cmd': (
                    skill_domain.CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION),
                'from_version': skill_model.rubric_schema_version,
                'to_version': feconf.CURRENT_RUBRIC_SCHEMA_VERSION
            })