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

from core.constants import constants
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


class GetNumberOfStoriesWithInvalidThumbnailBgColorJob(base_jobs.JobBase):
    """Job that returns stories with invalid thumbnail bg color."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid stories with their id and
        thumbnail bg color.
        Returns:
            PCollection. Returns PCollection of invalid stories with
            their id and thumbnail bg color.
        """
        total_stories = (
            self.pipeline
            | 'Get all StoryModels' >> ndb_io.GetModels(
                story_models.StoryModel.get_all(include_deleted=False))
            | 'Combine story ids and thumbnail bg colors' >> beam.Map(
                lambda story_model: (
                    story_model.id, story_model.thumbnail_bg_color))
        )
        allowed_thumbnail_bg_colors = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['story'])

        stories_with_invalid_thumbnail_bg_color = (
            total_stories
            | 'Filter stories with invalid thumbnail bg color' >>
                beam.Filter(
                    lambda story: story[1] not in allowed_thumbnail_bg_colors)
        )

        report_number_of_stories_queried = (
            total_stories
            | 'Report count of story models' >> (
                job_result_transforms.CountObjectsToJobRunResult('STORIES'))
        )

        report_number_of_stories_with_invalid_thumbnail_bg_color = (
            stories_with_invalid_thumbnail_bg_color
            | 'Report count of stories with invalid thumbnail bg color' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_thumbnail_bg_color = (
            stories_with_invalid_thumbnail_bg_color
            | 'Report invalid stories with their thumbnail bg color' >>
                beam.Map(
                    lambda story: job_run_result.JobRunResult.as_stderr(
                        'The id of story is %s and its thumbnail bg color is %s'
                        % (story[0], story[1])
                    )
                )
        )

        return (
            (
                report_number_of_stories_queried,
                report_number_of_stories_with_invalid_thumbnail_bg_color,
                report_invalid_ids_and_thumbnail_bg_color
            )
            | 'Combine all results' >> beam.Flatten()
        )