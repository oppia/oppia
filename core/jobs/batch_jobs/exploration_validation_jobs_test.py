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

"""Unit tests for jobs.batch_jobs.exploration_validation_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exploration_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models


(exp_models, story_models, ) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.story])


class GetExpWithInvalidCategoryJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = exploration_validation_jobs.GetExpWithInvalidCategoryJob

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'
    EXPLORATION_ID_4 = '4'
    EXPLORATION_ID_5 = '5'

    def setUp(self):
        super().setUp()

        # This is a story model to emulate curated lessons
        self.story_1 = self.create_model(
            story_models.StoryModel,
            id='1',
            title='test',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            story_contents_schema_version=1,
            corresponding_topic_id='1',
            url_fragment='test',
            story_contents={
                "nodes": [
                    {
                        "id": "node_1",
                        "title": "What are the place values?",
                        "description": "Test",
                        "thumbnail_filename": None,
                        "thumbnail_bg_color": None,
                        "thumbnail_size_in_bytes": None,
                        "destination_node_ids": [
                            "node_2"
                        ],
                        "acquired_skill_ids": [],
                        "prerequisite_skill_ids": [],
                        "outline": "",
                        "outline_is_finalized": False,
                        "exploration_id": "1"
                    },
                    {
                        "id": "node_2",
                        "title": "Finding the value of a number",
                        "description": "Test",
                        "thumbnail_filename": None,
                        "thumbnail_bg_color": None,
                        "thumbnail_size_in_bytes": None,
                        "destination_node_ids": [
                            "node_3"
                        ],
                        "acquired_skill_ids": [],
                        "prerequisite_skill_ids": [],
                        "outline": "",
                        "outline_is_finalized": False,
                        "exploration_id": "2"
                    },
                    {
                        "id": "node_3",
                        "title": "Comparing Numbers",
                        "description": "Test",
                        "thumbnail_filename": None,
                        "thumbnail_bg_color": None,
                        "thumbnail_size_in_bytes": None,
                        "destination_node_ids": [],
                        "acquired_skill_ids": [],
                        "prerequisite_skill_ids": [],
                        "outline": "",
                        "outline_is_finalized": False,
                        "exploration_id": "3"
                    }
                ],  
                "initial_node_id": "node_1",
                "next_node_id": "node_4"
            }
        )

        # This is an invalid model with category not in constants.ts.
        self.exp_1 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_1,
            title='title',
            category='test',
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            ratings=4,
            scaled_average_rating=3,
            community_owned=True,
            status=constants.ACTIVITY_STATUS_PUBLIC
        )

        # This is an valid model with category in constants.ts.
        self.exp_2 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_2,
            title='title',
            category='Algebra',
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            ratings=4,
            scaled_average_rating=4,
            community_owned=True,
            status=constants.ACTIVITY_STATUS_PUBLIC
        )

        # This is an invalid model with category not in constants.ts.
        self.exp_3 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_3,
            title='title',
            category='Fiction',
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            ratings=4,
            scaled_average_rating=-1,
            community_owned=True,
            status=constants.ACTIVITY_STATUS_PUBLIC
        )

        # This is an unpublished model with empty category.
        self.exp_4 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_4,
            title='title',
            category='',
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            ratings=4,
            scaled_average_rating=1,
            community_owned=True,
            status=constants.ACTIVITY_STATUS_PRIVATE
        )

        # This is a model which is not a curated lesson.
        self.exp_5 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXPLORATION_ID_5,
            title='title',
            category='',
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            ratings=4,
            scaled_average_rating=1,
            community_owned=True,
            status=constants.ACTIVITY_STATUS_PRIVATE
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.story_1, self.exp_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1')
        ])

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.story_1, self.exp_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of exp is "{self.EXPLORATION_ID_1}" and its category '
                + f'is "{self.exp_1.category}"'),
        ])

    def test_run_with_mixed_models(self) -> None:
        self.put_multi(
            [self.story_1, self.exp_1, self.exp_2, self.exp_3, self.exp_4, self.exp_5])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 3'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of exp is "{self.EXPLORATION_ID_1}" and its category '
                + f'is "{self.exp_1.category}"'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of exp is "{self.EXPLORATION_ID_3}" and its category '
                + f'is "{self.exp_3.category}"'),
        ])
