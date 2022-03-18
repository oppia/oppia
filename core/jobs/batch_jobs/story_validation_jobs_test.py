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

"""Unit tests for jobs.batch_jobs.story_validation_jobs."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import story_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import story_models

(story_models, ) = models.Registry.import_models([models.NAMES.story])


class GetNumberOfStoriesWithInvalidThumbnailBgColorJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = (
        story_validation_jobs.GetNumberOfStoriesWithInvalidThumbnailBgColorJob
    )

    STORY_ID_1 = '1'
    STORY_ID_2 = '2'
    STORY_ID_3 = '3'

    VALID_BG_COLOR = '#F8BF74'
    INVALID_BG_COLOR = '#FFFFFF'

    def setUp(self):
        super().setUp()

        # This is an invalid model with invalid thumbnail bg color.
        self.story_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_1,
            title='story 1',
            description='description 1',
            language_code='en',
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            corresponding_topic_id='1',
            url_fragment='story_1',
            thumbnail_filename='story_1.svg',
            thumbnail_bg_color=self.INVALID_BG_COLOR
        )

        # This is another invalid model with invalid thumbnail bg color.
        self.story_2 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_2,
            title='story 2',
            description='description 2',
            language_code='en',
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            corresponding_topic_id='1',
            url_fragment='story_2',
            thumbnail_filename='story_2.svg',
            thumbnail_bg_color=self.INVALID_BG_COLOR
        )

        # This is a valid model with valid thumbnail bg color.
        self.story_3 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_3,
            title='story 3',
            description='description 3',
            language_code='en',
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            corresponding_topic_id='1',
            url_fragment='story_3',
            thumbnail_filename='story_3.svg',
            thumbnail_bg_color=self.VALID_BG_COLOR
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.story_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('STORIES SUCCESS: 1')
        ])

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.story_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('STORIES SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The id of story is %s and its thumbnail bg color is %s'
                % (self.STORY_ID_1, self.INVALID_BG_COLOR)),
        ])

    def test_run_with_mixed_models(self) -> None:
        self.put_multi([self.story_1, self.story_2, self.story_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('STORIES SUCCESS: 3'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                'The id of story is %s and its thumbnail bg color is %s'
                % (self.STORY_ID_1, self.INVALID_BG_COLOR)),
            job_run_result.JobRunResult.as_stderr(
                'The id of story is %s and its thumbnail bg color is %s'
                % (self.STORY_ID_2, self.INVALID_BG_COLOR)),
        ])
