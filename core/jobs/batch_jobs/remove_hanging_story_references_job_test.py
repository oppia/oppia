# coding: utf-8
#
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

"""Unit tests for jobs.batch_jobs.remove_hanging_story_references_job."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import remove_hanging_story_references_job
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:
    from mypy_imports import story_models, topic_models

(topic_models, story_models) = models.Registry.import_models(
    [models.Names.TOPIC, models.Names.STORY]
)


class RemoveHangingStoryReferencesJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = (
        remove_hanging_story_references_job.RemoveHangingStoryReferencesJob
    )

    def _create_story(
        self, story_id: str, topic_id: str = 'topic_1'
    ) -> story_models.StoryModel:
        """Creates and returns a StoryModel instance."""
        return self.create_model(
            story_models.StoryModel,
            id=story_id,
            title=f'{story_id} title',
            corresponding_topic_id=topic_id,
            language_code='en',
            story_contents_schema_version=1,
            url_fragment=f'{story_id}-url',
        )

    def _create_topic(
        self,
        topic_id: str,
        canonical_story_refs: list[dict[str, str]],
        name: str = 'Topic',
        language_code: str = 'en',
    ) -> topic_models.TopicModel:
        """Creates and returns a TopicModel instance."""
        return self.create_model(
            topic_models.TopicModel,
            id=topic_id,
            name=name,
            description='desc',
            canonical_name=name.lower(),
            language_code=language_code,
            url_fragment=f'{topic_id}-url',
            page_title_fragment_for_web=f'{topic_id}-title-fragment',
            next_subtopic_id=1,
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            uncategorized_skill_ids=[],
            canonical_story_references=canonical_story_refs,
            additional_story_references=[],
            subtopics=[],
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_topic_with_no_invalid_references_produces_no_logs(self) -> None:
        story_1 = self._create_story('story_1')
        topic = self._create_topic(
            'topic_1',
            canonical_story_refs=[{'story_id': 'story_1'}],
        )
        self.put_multi([story_1, topic])

        self.assert_job_output_is([])

        updated_topic = topic_models.TopicModel.get_by_id('topic_1')
        self.assertEqual(
            updated_topic.canonical_story_references, [{'story_id': 'story_1'}]
        )

    def test_topic_with_hanging_story_references_gets_cleaned(self) -> None:
        story_1 = self._create_story('story_1')
        topic = self._create_topic(
            'topic_1',
            canonical_story_refs=[
                {'story_id': 'story_1'},
                {'story_id': 'story_2'},
            ],
        )
        self.put_multi([story_1, topic])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Topic with ID topic_1 removed hanging story references: story_2'
                    )
                ),
            ]
        )

        updated = topic_models.TopicModel.get_by_id('topic_1')
        self.assertEqual(
            updated.canonical_story_references, [{'story_id': 'story_1'}]
        )

    def test_topic_with_multiple_invalid_references_logs_all(self) -> None:
        story_1 = self._create_story('story_1')

        topic = self._create_topic(
            'topic_1',
            canonical_story_refs=[
                {'story_id': 'story_1'},
                {'story_id': 'fake_1'},
                {'invalid': 'oops'},
                {'story_id': 'fake_2'},
            ],
        )
        self.put_multi([story_1, topic])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Topic with ID topic_1 removed hanging story references: fake_1, INVALID_REFERENCE, fake_2'
                    )
                )
            ]
        )

        updated = topic_models.TopicModel.get_by_id('topic_1')
        self.assertEqual(
            updated.canonical_story_references, [{'story_id': 'story_1'}]
        )
