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

"""Validation Jobs for skills"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(skill_models, ) = models.Registry.import_models([models.NAMES.skill])


class GetSkillWithInvalidMisconceptionIDJob(base_jobs.JobBase):
    """Job that returns skill having invalid misconception id."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid skill with their id and
        misconception id.

        Returns:
            PCollection. Returns PCollection of invalid skill with
            their id and misconception id.
        """
        total_skills = (
            self.pipeline
            | 'Get all SkillModels' >> ndb_io.GetModels(
                skill_models.SkillModel.get_all(include_deleted=False))
            | 'Combine skill misconception_id and ids' >> beam.Map(
                lambda skill: (skill.id, skill.next_misconception_id))
        )

        skill_ids_with_invalid_misconception_id = (
            total_skills
            | 'Filter skills with invalid misconception_id' >>
                beam.Filter(lambda skill: skill[1] < 0)
        )

        report_number_of_skills_queried = (
            total_skills
            | 'Report count of skill models' >> (
                job_result_transforms.CountObjectsToJobRunResult('SKILLS'))
        )

        report_number_of_invalid_skills = (
            skill_ids_with_invalid_misconception_id
            | 'Report count of invalid skill models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_skills_and_their_misconception_ids = (
            skill_ids_with_invalid_misconception_id
            | 'Save info on invalid skills' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of skill is %s and its misconception id is %d'
                    % (objects[0], objects[1])
                ))
        )

        return (
            (
                report_number_of_skills_queried,
                report_number_of_invalid_skills,
                report_invalid_skills_and_their_misconception_ids
            )
            | 'Combine results' >> beam.Flatten()
        )
