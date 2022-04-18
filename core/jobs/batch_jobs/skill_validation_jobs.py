# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Validation Jobs for skill models"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(skill_models, ) = models.Registry.import_models([models.NAMES.skill])


class GetInvalidSkillMediumRubricsJob(base_jobs.JobBase):
    """Job that returns skills which have no medium rubric explanation."""

    def filter_invalid_medium_rubrics_explanation(self, skill):
        """Returns true if the medium rubrics explanation is not present.

        Args:
            skill: SkillModel. Skill model.

        Returns:
            bool. True if the medium rubrics explanation is not present.
        """
        rubrics = skill[1]
        is_medium_explanation_present = False
        for rubric in rubrics:
            if rubric['difficulty'] == 'Medium':
                medium_rubrics_explanation = rubric['explanations']
                is_medium_explanation_present = (
                    len(medium_rubrics_explanation) != 0)
        return not is_medium_explanation_present

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        total_skills = (
            self.pipeline
            | 'Get all SkillModels' >> ndb_io.GetModels(
                skill_models.SkillModel.get_all(include_deleted=False))
            | 'Combine skill ids and rubrics' >> beam.Map(
                lambda skill_model: (
                    skill_model.id, skill_model.rubrics))
        )

        skills_having_invalid_medium_rubrics_explanation = (
            total_skills
            | 'Filter skills with invalid medium rubrics explanation' >> (
                beam.Filter(
                    self.filter_invalid_medium_rubrics_explanation))
        )

        report_number_of_skills_queried = (
            total_skills
            | 'Report count of skill models' >> (
                job_result_transforms.CountObjectsToJobRunResult('SKILLS'))
        )

        report_number_of_invalid_skills = (
            skills_having_invalid_medium_rubrics_explanation
            | 'Report count of invalid skill models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_skill = (
            skills_having_invalid_medium_rubrics_explanation
            | 'Save info on invalid skills' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of the skill is %s'
                    % (objects[0])))
        )

        return (
            (
                report_invalid_ids_and_skill,
                report_number_of_skills_queried,
                report_number_of_invalid_skills
            )
            | 'Combine results' >> beam.Flatten()
        )
