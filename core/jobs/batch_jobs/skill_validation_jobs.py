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

"""Validation jobs for story models."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import skill_models

(story_models, skill_models, ) = models.Registry.import_models([
    models.NAMES.story, models.NAMES.skill
])


class GetNumberOfSkillsWithInvalidRubricExplanationsJob(base_jobs.JobBase):
    """Job that returns skills with invalid rubric explanations."""

    def rubric_explanations_are_invalid(self, explanations):
        """Returns true if the length of rubric explanations list is > 10
        or at least one explanation exceeds 300 characters.

        Returns:
            bool. Returns true if the length of rubric explanations list is > 10
            or at least one explanation exceeds 300 characters.
        """
        if len(explanations) > 10:
            return True

        for explanation in explanations:
            if len(explanation) > 300:
                return True

        return False

    def filter_skills_havin_rubrics_with_invalid_explanations(self, skill):
        """Returns True if skill has rubrics with invalid explanation.

        Returns:
            bool. Returns True if skill has rubrics with invalid explanation.
        """
        rubrics = skill[1]
        for rubric in rubrics:
            if self.rubric_explanations_are_invalid(rubric['explanations']):
                return True
        return False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of skills with invalid rubric explanations.

        Returns:
            PCollection. Returns a PCollection of skills with invalid
            rubric explanations.
        """
        total_skills = (
            self.pipeline
            | 'Get all SkillModels' >> ndb_io.GetModels(
                skill_models.SkillModel.get_all(include_deleted=False))
            | 'Combine skill ids and rubrics' >> beam.Map(
                lambda skillModel: (
                    skillModel.id, skillModel.rubrics))
        )

        skills_having_rubrics_with_invalid_explanation = (
            total_skills
            | 'Filter skills with invalid rubrics explanation' >> beam.Filter(
                self.filter_skills_havin_rubrics_with_invalid_explanations)
        )

        report_number_of_skills_queried = (
            total_skills
            | 'Report count of skill models' >> (
                job_result_transforms.CountObjectsToJobRunResult('SKILLS'))
        )

        report_number_of_skills_with_invalid_rubric_explanations = (
            skills_having_rubrics_with_invalid_explanation
            | 'Report count of skills with invalid rubric explanations' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_skill_ids_and_rubrics = (
            skills_having_rubrics_with_invalid_explanation
            | 'Report invalid skill ids and rubrics' >> (
              beam.Map(
                lambda skill: job_run_result.JobRunResult.as_stderr(
                    'The id of the skill is %s and its rubrics are %s' % (
                        skill[0], skill[1]))
              )
            )
        )

        return (
            (
                report_number_of_skills_queried,
                report_number_of_skills_with_invalid_rubric_explanations,
                report_invalid_skill_ids_and_rubrics
            )
            | 'Combine all results' >> beam.Flatten()
        )
