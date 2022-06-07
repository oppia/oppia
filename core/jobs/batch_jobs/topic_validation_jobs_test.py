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

"""Unit tests for jobs.batch_jobs.topic_validation_jobs."""

from __future__ import annotations

from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import topic_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(topic_models, ) = models.Registry.import_models([models.NAMES.topic])


class GetSubTopicsWithInvalidUrlFragJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = topic_validation_jobs.GetSubTopicsWithInvalidUrlFragJob

    TOPIC_ID_1 = '1'
    TOPIC_ID_2 = '2'
    TOPIC_ID_3 = '3'

    def setUp(self):
        super().setUp()

        # This is an invalid model.
        self.topic_1 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name='Title',
            canonical_name='title',
            subtopic_schema_version=50,
            story_reference_schema_version=50,
            next_subtopic_id=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='test-fragment',
            practice_tab_is_displayed=False,
            page_title_fragment_for_web='testing',
            subtopics=[{"id":1,"title":"Dummy Subtopic Title",
                      "skill_ids":["Mzmt5VPws3yR","8tVlyXZSEQFC"],
                      "thumbnail_filename":None,"thumbnail_bg_color":None,
                      "thumbnail_size_in_bytes":None,"url_fragment":
                      "testIng"},
                      {"id":2,"title":"test","skill_ids":[],
                      "thumbnail_filename"
                      :"img_20220607_065755_fj62p0ywjz_height_64_width_64.svg",
                      "thumbnail_bg_color":"#FFFFFF",
                      "thumbnail_size_in_bytes":1090,
                      "url_fragment":"test-test-test-test-test-test-test-test"}],
        )

        # This is a valid model.
        self.topic_2 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_2,
            name='Title',
            canonical_name='title',
            subtopic_schema_version=50,
            story_reference_schema_version=50,
            next_subtopic_id=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='test-fragment',
            practice_tab_is_displayed=False,
            page_title_fragment_for_web='testing',
            subtopics=[{"id":1,"title":"Dummy Subtopic Title",
                      "skill_ids":["Mzmt5VPws3yR","8tVlyXZSEQFC"],
                      "thumbnail_filename":None,"thumbnail_bg_color":None,
                      "thumbnail_size_in_bytes":None,"url_fragment":
                      "test-ing"},
                      {"id":2,"title":"test","skill_ids":[],
                      "thumbnail_filename"
                      :"img_20220607_065755_fj62p0ywjz_height_64_width_64.svg",
                      "thumbnail_bg_color":"#FFFFFF",
                      "thumbnail_size_in_bytes":1090,
                      "url_fragment":"test"}],
        )

        # This is an invalid model.
        self.topic_3 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_3,
            name='Title',
            canonical_name='title',
            subtopic_schema_version=50,
            story_reference_schema_version=50,
            next_subtopic_id=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='test-test',
            practice_tab_is_displayed=False,
            page_title_fragment_for_web='testing',
            subtopics=[{"id":1,"title":"Dummy Subtopic Title",
                      "skill_ids":["Mzmt5VPws3yR","8tVlyXZSEQFC"],
                      "thumbnail_filename":None,"thumbnail_bg_color":None,
                      "thumbnail_size_in_bytes":None,"url_fragment":
                      None}],
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.topic_2])
        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('TOPICS SUCCESS: 2')]
        )

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.topic_1])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout('TOPICS SUCCESS: 2'),
                job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 2'),
                job_run_result.JobRunResult.as_stderr(
                    f'Topic_id: {self.TOPIC_ID_1}, '
                    f'subtopic_id: {self.topic_1.subtopics[0]["id"]}'
                    f', invalid url_frag:'
                    f' "{self.topic_1.subtopics[0]["url_fragment"]}"'
                ),
                job_run_result.JobRunResult.as_stderr(
                    f'Topic_id: {self.TOPIC_ID_1}, '
                    f'subtopic_id: {self.topic_1.subtopics[1]["id"]}'
                    f', invalid url_frag:'
                    f' "{self.topic_1.subtopics[1]["url_fragment"]}"'
                ),
            ]
        )

    def test_run_with_mixed_models(self) -> None:
        self.put_multi(
            [self.topic_1, self.topic_2, self.topic_3])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout('TOPICS SUCCESS: 5'),
                job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 3'),
                job_run_result.JobRunResult.as_stderr(
                    f'Topic_id: {self.TOPIC_ID_1}, '
                    f'subtopic_id: {self.topic_1.subtopics[0]["id"]}'
                    f', invalid url_frag:'
                    f' "{self.topic_1.subtopics[0]["url_fragment"]}"'
                ),
                job_run_result.JobRunResult.as_stderr(
                    f'Topic_id: {self.TOPIC_ID_1}, '
                    f'subtopic_id: {self.topic_1.subtopics[1]["id"]}'
                    f', invalid url_frag:'
                    f' "{self.topic_1.subtopics[1]["url_fragment"]}"'
                ),
                job_run_result.JobRunResult.as_stderr(
                    f'Topic_id: {self.TOPIC_ID_3}, '
                    f'subtopic_id: {self.topic_3.subtopics[0]["id"]}'
                    f', invalid url_frag:'
                    f' "{self.topic_3.subtopics[0]["url_fragment"]}"'
                ),
            ]
        )
