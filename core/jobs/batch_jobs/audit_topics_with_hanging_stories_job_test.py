# Copyright 2025 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for audit_topics_with_hanging_stories_job.py"""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import audit_topics_with_hanging_stories_job
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:
    from mypy_imports import story_models, topic_models

(topic_models, story_models) = models.Registry.import_models(
    [models.Names.TOPIC, models.Names.STORY]
)

datastore_services = models.Registry.import_datastore_services()


class AuditTopicsWithHangingStoriesJobTests(job_test_utils.JobTestBase):
    """Tests for AuditTopicsWithHangingStoriesJob."""

    JOB_CLASS: Type[
        audit_topics_with_hanging_stories_job.AuditTopicsWithHangingStoriesJob
    ] = audit_topics_with_hanging_stories_job.AuditTopicsWithHangingStoriesJob

    TOPIC_ID_1: Final = 'topic_id_1'
    TOPIC_NAME_1: Final = 'topic_name_1'
    TOPIC_ID_2: Final = 'topic_id_2'
    TOPIC_NAME_2: Final = 'topic_name_2'
    STORY_ID_1: Final = 'story_id_1'
    STORY_ID_2: Final = 'story_id_2'
    STORY_ID_3: Final = 'story_id_3'
    NON_EXISTENT_STORY_ID: Final = 'non_existent_story'
    CORRUPTED_DICT: Final = {
        'story_id': 'corrupted_story_id',
        'story_is_published': False,
    }
    CORRUPTED_NON_STRING_ID: Final = {
        'story_id': 12345,
        'story_is_published': True,
    }
    CORRUPTED_MALFORMED: Final = {'invalid_key': 'some_value'}

    def test_empty_storage(self) -> None:
        """Tests that the job runs successfully on an empty datastore."""
        self.assert_job_output_is_empty()

    def test_topics_with_no_hanging_stories(self) -> None:
        """Tests that the job reports no issues when all story references are valid."""
        story_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_1,
            title='Story Title 1',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            story_contents={
                'nodes': [],
                'initial_node_id': None,
                'next_node_id': 0,
            },
            corresponding_topic_id=self.TOPIC_ID_1,
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            url_fragment='story-one-fragment',
        )
        topic_1 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name=self.TOPIC_NAME_1,
            canonical_story_references=[
                {'story_id': self.STORY_ID_1, 'story_is_published': True}
            ],
            canonical_name='topic-one-canonical-name',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            next_subtopic_id=1,
            page_title_fragment_for_web='topic-one-web-fragment',
            story_reference_schema_version=feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            url_fragment='topic-one-fragment',
        )
        self.put_multi([story_1, topic_1])
        self.assert_job_output_is_empty()

    def test_topic_with_one_hanging_story(self) -> None:
        """Tests that the job correctly identifies a single hanging string ID."""
        topic_1 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name=self.TOPIC_NAME_1,
            canonical_story_references=[
                {
                    'story_id': self.NON_EXISTENT_STORY_ID,
                    'story_is_published': True,
                }
            ],
            canonical_name='topic-one-canonical-name',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            next_subtopic_id=1,
            page_title_fragment_for_web='topic-one-web-fragment',
            story_reference_schema_version=feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            url_fragment='topic-one-fragment',
        )
        self.put_multi([topic_1])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        f'Topic with ID: {self.TOPIC_ID_1} has hanging story references: {self.NON_EXISTENT_STORY_ID}.'
                    )
                )
            ]
        )

    def test_topic_with_corrupted_reference(self) -> None:
        """Tests that the job reports a corrupted dictionary entry."""
        topic_1 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name=self.TOPIC_NAME_1,
            canonical_story_references=[self.CORRUPTED_MALFORMED],
            canonical_name='topic-one-canonical-name',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            next_subtopic_id=1,
            page_title_fragment_for_web='topic-one-web-fragment',
            story_reference_schema_version=feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            url_fragment='topic-one-fragment',
        )
        self.put_multi([topic_1])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        f'Topic with ID: {self.TOPIC_ID_1} has hanging story references: INVALID_REFERENCE (malformed entry).'
                    )
                )
            ]
        )

    def test_mixed_case_of_hanging_and_valid_references(self) -> None:
        """Tests a case with both valid and invalid references in different topics."""
        story_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_1,
            title='Story Title 1',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            story_contents={
                'nodes': [],
                'initial_node_id': None,
                'next_node_id': 0,
            },
            corresponding_topic_id=self.TOPIC_ID_1,
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            url_fragment='story-one-fragment',
        )
        story_2 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_2,
            title='Story Title 2',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            story_contents={
                'nodes': [],
                'initial_node_id': None,
                'next_node_id': 0,
            },
            corresponding_topic_id=self.TOPIC_ID_2,
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            url_fragment='story-two-fragment',
        )

        topic_1 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name=self.TOPIC_NAME_1,
            canonical_story_references=[
                {'story_id': self.STORY_ID_1, 'story_is_published': True}
            ],
            canonical_name='topic-one-canonical-name',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            next_subtopic_id=1,
            page_title_fragment_for_web='topic-one-web-fragment',
            story_reference_schema_version=feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            url_fragment='topic-one-fragment',
        )
        topic_2 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_2,
            name=self.TOPIC_NAME_2,
            canonical_story_references=[
                {
                    'story_id': self.NON_EXISTENT_STORY_ID,
                    'story_is_published': True,
                },
                {'story_id': self.STORY_ID_2, 'story_is_published': True},
            ],
            canonical_name='topic-two-canonical-name',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            next_subtopic_id=1,
            page_title_fragment_for_web='topic-two-web-fragment',
            story_reference_schema_version=feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            url_fragment='topic-two-fragment',
        )
        self.put_multi([story_1, story_2, topic_1, topic_2])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        f'Topic with ID: {self.TOPIC_ID_2} has hanging story references: {self.NON_EXISTENT_STORY_ID}.'
                    )
                )
            ]
        )

    def test_topic_with_non_string_story_id(self) -> None:
        """Tests that the job correctly identifies a non-string story ID."""
        topic_1 = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID_1,
            name=self.TOPIC_NAME_1,
            canonical_story_references=[self.CORRUPTED_NON_STRING_ID],
            canonical_name='topic-one-canonical-name',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            next_subtopic_id=1,
            page_title_fragment_for_web='topic-one-web-fragment',
            story_reference_schema_version=feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            url_fragment='topic-one-fragment',
        )
        self.put_multi([topic_1])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        f'Topic with ID: {self.TOPIC_ID_1} has hanging story references: INVALID_REFERENCE (non-string story_id: int).'
                    )
                )
            ]
        )
