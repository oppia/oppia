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


class GetNumberOfTopicsExceedsMaxAbbNameJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = topic_validation_jobs.GetNumberOfTopicsExceedsMaxAbbNameJob

    TOPIC_ID_1 = '1'
    TOPIC_ID_2 = '2'
    TOPIC_ID_3 = '3'

    def setUp(self):
        super().setUp()

        # This is an invalid model with abb. name length greater than 39.
        self.topic_1 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name='Topic 1',
            canonical_name='topic 1',
            abbreviated_name='nameeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            story_reference_schema_version=12,
            subtopic_schema_version=11,
            next_subtopic_id=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='topic_one',
            practice_tab_is_displayed=True
        )

        # This is an valid model with abb. name length lesser than 39.
        self.topic_2 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_2,
            name='Topic 2',
            canonical_name='topic 2',
            abbreviated_name='name',
            story_reference_schema_version=12,
            subtopic_schema_version=11,
            next_subtopic_id=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='topic_two',
            practice_tab_is_displayed=True
        )

        # This is an invalid model with abb. name length greater than 39.
        self.topic_3 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_3,
            name='Topic 3',
            canonical_name='topic 3',
            abbreviated_name='abcdefghikklmnopqrstuvwzyzabcdefghijklmnopq',
            story_reference_schema_version=12,
            subtopic_schema_version=11,
            next_subtopic_id=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='topic_three',
            practice_tab_is_displayed=True
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.topic_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('TOPICS SUCCESS: 1')
        ])

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.topic_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('TOPICS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of topic is {self.TOPIC_ID_1} and its abb. '
                + f'name len is {len(self.topic_1.abbreviated_name)}'),
        ])

    def test_run_with_mixed_models(self) -> None:
        self.put_multi([self.topic_1, self.topic_2, self.topic_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('TOPICS SUCCESS: 3'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of topic is {self.TOPIC_ID_1} and its abb. '
                + f'name len is {len(self.topic_1.abbreviated_name)}'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of topic is {self.TOPIC_ID_3} and its abb. '
                + f'name len is {len(self.topic_3.abbreviated_name)}'),
        ])


class GetTopicsWithInvalidPageTitleFragmentTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = topic_validation_jobs.GetTopicsWithInvalidPageTitleFragmentJob

    TOPIC_ID_1 = '1'
    TOPIC_ID_2 = '2'
    TOPIC_ID_3 = '3'

    def setUp(self):
        super().setUp()

        long_fragment = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxy'

        # This is an invalid model with page frag. len greater than 50.
        self.topic_1 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name='Topic 1',
            canonical_name='topic 1',
            story_reference_schema_version=12,
            subtopic_schema_version=11,
            next_subtopic_id=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='topic_one',
            practice_tab_is_displayed=True,
            page_title_fragment_for_web=long_fragment
        )

        # This is an valid model with valid page frag len.
        self.topic_2 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_2,
            name='Topic 2',
            canonical_name='topic 2',
            story_reference_schema_version=12,
            subtopic_schema_version=11,
            next_subtopic_id=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='topic_two',
            practice_tab_is_displayed=True,
            page_title_fragment_for_web='test_title'
        )

        # This is an invalid model with page frag. len less than 5.
        self.topic_3 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_3,
            name='Topic 3',
            canonical_name='topic 3',
            story_reference_schema_version=12,
            subtopic_schema_version=11,
            next_subtopic_id=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='topic_three',
            practice_tab_is_displayed=True,
            page_title_fragment_for_web='test'
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.topic_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('TOPICS SUCCESS: 1')
        ])

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.topic_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('TOPICS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of topic is {self.TOPIC_ID_1} and its page title '
                + 'frag. len is '
                + f'{len(self.topic_1.page_title_fragment_for_web)}'),
        ])

    def test_run_with_mixed_models(self) -> None:
        self.put_multi([self.topic_1, self.topic_2, self.topic_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('TOPICS SUCCESS: 3'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of topic is {self.TOPIC_ID_1} and its page title '
                + 'frag. len is '
                + f'{len(self.topic_1.page_title_fragment_for_web)}'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of topic is {self.TOPIC_ID_3} and its page title '
                + 'frag. len is '
                + f'{len(self.topic_3.page_title_fragment_for_web)}'),
        ])
