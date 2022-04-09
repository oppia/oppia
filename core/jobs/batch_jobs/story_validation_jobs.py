
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

"""Validation Jobs for story"""

from core.domain import story_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(story_models, ) = models.Registry.import_models([models.NAMES.story])


class GetNumberOfStoryNotesExceedsMaxLengthJob(base_jobs.JobBase):
    """Job that returns story notes having length more than 5000."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid story notes with their id and
        actual length.

        Returns:
            PCollection. Returns PCollection of invalid story notes with
            their id and actual length.
        """
        total_stories = (
            self.pipeline
            | 'Get all StoryModels' >> ndb_io.GetModels(
                story_models.StoryModel.get_all(include_deleted=False))
            | 'Get story from model' >> beam.Map(
                story_fetchers.get_story_from_model)
        )

        story_notes_ids_with_exceeding_max_len = (
            total_stories
            | 'Combine story notes and ids' >> beam.Map(
                lambda story: (story.id, story.notes))
            | 'Filter story with notes length greater than 5000' >>
                beam.Filter(lambda story: len(story[1]) > 5000)
        )

        report_number_of_stories_queried = (
            total_stories
            | 'Report count of story models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_stories = (
            story_notes_ids_with_exceeding_max_len
            | 'Report count of invalid story models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_their_actual_len = (
            story_notes_ids_with_exceeding_max_len
            | 'Save info on invalid stories' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of story is %s and its actual len of notes is %s'
                    % (objects[0], len(objects[1]))
                ))
        )

        return (
            (
                report_number_of_stories_queried,
                report_number_of_invalid_stories,
                report_invalid_ids_and_their_actual_len
            )
            | 'Combine results' >> beam.Flatten()
        )
