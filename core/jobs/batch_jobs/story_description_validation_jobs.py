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
    from mypy_imports import story_models

(story_models, ) = models.Registry.import_models([models.NAMES.story])


class GetNumberOfStoriesExceedsMaxDescriptionLengthJob(base_jobs.JobBase):
    """Job that returns stories with invalid description length."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid stories with their id and
        description length.

        Returns:
            PCollection. Returns PCollection of invalid stories with
            their id and description length.
        """
        total_stories = (
            self.pipeline
            | 'Get all StoryModels' >> ndb_io.GetModels(
                story_models.StoryModel.get_all(include_deleted=False))
            | 'Combine story ids and descriptions' >> beam.Map(
                lambda story_model: (story_model.id, story_model.description))
        )

        stories_with_invalid_description_len = (
            total_stories
            | 'Filter story with description length greater than 1000' >>
                beam.Filter(lambda story: len(story[1]) > 1000)
        )

        report_number_of_stories_queried = (
            total_stories
            | 'Report count of story models' >> (
                job_result_transforms.CountObjectsToJobRunResult('STORIES'))
        )

        report_number_of_stories_with_invalid_description_len = (
            stories_with_invalid_description_len
            | 'Report count of stories with invalid description length' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_description_len = (
            stories_with_invalid_description_len
            | 'Report invalid stories with their description length' >>
                beam.Map(
                    lambda story: job_run_result.JobRunResult.as_stderr(
                        'The id of story is %s and its description length is %s'
                        % (story[0], len(story[1]))
                    )
                )
        )

        return (
            (
                report_number_of_stories_queried,
                report_number_of_stories_with_invalid_description_len,
                report_invalid_ids_and_description_len
            )
            | 'Combine all results' >> beam.Flatten()
        )
