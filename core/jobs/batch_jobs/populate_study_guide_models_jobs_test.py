# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.populate_study_guide_models_jobs."""

from __future__ import annotations

from unittest import mock

from core import feconf
from core.domain import topic_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import populate_study_guide_models_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = True
if MYPY:
    from mypy_imports import subtopic_models, topic_models

(topic_models, subtopic_models) = models.Registry.import_models([
    models.Names.TOPIC, models.Names.SUBTOPIC])


class PopulateStudyGuidesJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        populate_study_guide_models_jobs.PopulateStudyGuidesJob
    ] = populate_study_guide_models_jobs.PopulateStudyGuidesJob

    TOPIC_ID: Final = 'topic_id_1'
    TOPIC_NAME: Final = 'Test Topic'
    SUBTOPIC_ID: Final = 1
    SUBTOPIC_PAGE_ID: Final = f'{TOPIC_ID}-{SUBTOPIC_ID}'
    SUBTOPIC_TITLE: Final = 'Test Subtopic'
    LANGUAGE_CODE: Final = 'en'

    def setUp(self) -> None:
        super().setUp()

        # Create test subtopic page content.
        self.subtopic_page_contents = {
            'subtitled_html': {
                'html': '<p>Test subtopic content</p>',
                'content_id': 'content'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }

        # Create test topic with subtopic.
        self.subtopic = topic_domain.Subtopic(
            subtopic_id=self.SUBTOPIC_ID,
            title=self.SUBTOPIC_TITLE,
            skill_ids=['skill_1', 'skill_2'],
            thumbnail_filename='test.svg',
            thumbnail_bg_color='#FFFFFF',
            thumbnail_size_in_bytes=1024,
            url_fragment='test-subtopic'
        )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_successful_study_guide_creation(self) -> None:
        # Create subtopic page model.
        subtopic_page_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_PAGE_ID,
            topic_id=self.TOPIC_ID,
            page_contents=self.subtopic_page_contents,
            page_contents_schema_version=1,
            language_code=self.LANGUAGE_CODE
        )

        # Create topic model.
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID,
            name=self.TOPIC_NAME,
            abbreviated_name='Test',
            url_fragment='test-topic',
            description='Test topic description',
            canonical_name='Test Topic',
            language_code=self.LANGUAGE_CODE,
            subtopics=[self.subtopic.to_dict()],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            page_title_fragment_for_web='testing-six',
            version=1
        )

        self.put_multi([subtopic_page_model, topic_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='STUDY GUIDES PROCESSED SUCCESS: 1'
            )
        ])

        # Verify study guide model was created.
        study_guide_model = subtopic_models.StudyGuideModel.get(
            self.SUBTOPIC_PAGE_ID
        )
        self.assertIsNotNone(study_guide_model)
        self.assertEqual(study_guide_model.topic_id, self.TOPIC_ID)
        self.assertEqual(study_guide_model.language_code, self.LANGUAGE_CODE)
        self.assertEqual(study_guide_model.version, 1)
        self.assertEqual(study_guide_model.next_content_id_index, 2)
        self.assertEqual(study_guide_model.sections_schema_version, 1)

        # Verify sections content.
        expected_sections = [
            {
                'heading': {
                    'content_id': 'section_heading_0',
                    'unicode_str': self.SUBTOPIC_TITLE
                },
                'content': {
                    'content_id': 'section_content_1',
                    'html': '<p>Test subtopic content</p>'
                }
            }
        ]
        self.assertEqual(study_guide_model.sections, expected_sections)

        # Verify commit log entry was created.
        commit_log_entry = (
            subtopic_models.StudyGuideCommitLogEntryModel.get(
                f'studyguide-{self.SUBTOPIC_PAGE_ID}-1'
            )
        )
        self.assertIsNotNone(commit_log_entry)
        self.assertEqual(commit_log_entry.study_guide_id, self.SUBTOPIC_PAGE_ID)
        self.assertEqual(commit_log_entry.user_id, feconf.MIGRATION_BOT_USER_ID)
        self.assertEqual(commit_log_entry.commit_type, 'create')
        self.assertEqual(
            commit_log_entry.commit_message,
            'created new study guide'
        )
        self.assertEqual(commit_log_entry.version, 1)

        expected_commit_cmds = [
            {
                'cmd': 'create_new',
                'topic_id': self.TOPIC_ID,
                'subtopic_id': self.SUBTOPIC_ID
            }
        ]
        self.assertEqual(commit_log_entry.commit_cmds, expected_commit_cmds)

    def test_multiple_subtopic_pages_processed(self) -> None:
        # Create multiple subtopic pages.
        subtopic_page_id_2 = f'{self.TOPIC_ID}-2'
        subtopic_2 = topic_domain.Subtopic(
            subtopic_id=2,
            title='Second Subtopic',
            skill_ids=['skill_3'],
            thumbnail_filename='test2.svg',
            thumbnail_bg_color='#000000',
            thumbnail_size_in_bytes=2048,
            url_fragment='second-subtopic'
        )

        subtopic_page_model_1 = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_PAGE_ID,
            topic_id=self.TOPIC_ID,
            page_contents=self.subtopic_page_contents,
            page_contents_schema_version=1,
            language_code=self.LANGUAGE_CODE
        )

        subtopic_page_model_2 = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=subtopic_page_id_2,
            topic_id=self.TOPIC_ID,
            page_contents=self.subtopic_page_contents,
            page_contents_schema_version=1,
            language_code=self.LANGUAGE_CODE
        )

        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID,
            name=self.TOPIC_NAME,
            abbreviated_name='Test',
            url_fragment='test-topic',
            description='Test topic description',
            canonical_name='Test Topic',
            language_code=self.LANGUAGE_CODE,
            subtopics=[self.subtopic.to_dict(), subtopic_2.to_dict()],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=3,
            page_title_fragment_for_web='testing-five',
            version=1
        )

        self.put_multi(
            [
                subtopic_page_model_1,
                subtopic_page_model_2,
                topic_model
            ]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='STUDY GUIDES PROCESSED SUCCESS: 2'
            )
        ])

        # Verify both study guides were created.
        study_guide_1 = subtopic_models.StudyGuideModel.get(
            self.SUBTOPIC_PAGE_ID
        )
        study_guide_2 = subtopic_models.StudyGuideModel.get(subtopic_page_id_2)

        self.assertIsNotNone(study_guide_1)
        self.assertIsNotNone(study_guide_2)

    def test_invalid_subtopic_page_raises_error(self) -> None:
        # Create subtopic page with invalid data.
        invalid_subtopic_page_contents = {
            'subtitled_html': {
                'html': '',
                'content_id': 'content'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }

        subtopic_page_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_PAGE_ID,
            topic_id=self.TOPIC_ID,
            page_contents=invalid_subtopic_page_contents,
            page_contents_schema_version=1,
            language_code=self.LANGUAGE_CODE
        )

        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID,
            name=self.TOPIC_NAME,
            abbreviated_name='Test',
            url_fragment='test-topic',
            description='Test topic description',
            canonical_name='Test Topic',
            language_code=self.LANGUAGE_CODE,
            subtopics=[self.subtopic.to_dict()],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            page_title_fragment_for_web='testing-four',
            version=1
        )

        self.put_multi([subtopic_page_model, topic_model])

        # Mock validation to raise an exception.
        with mock.patch(
            'core.domain.subtopic_page_domain.SubtopicPage.validate',
            side_effect=Exception('Validation failed')
        ):
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stderr=f'STUDY GUIDES PROCESSED ERROR: '
                           f'"(\'{self.SUBTOPIC_PAGE_ID}\','
                           f' Exception(\'Validation failed\'))": 1'
                )
            ])

    def test_missing_topic_model_skips_processing(self) -> None:
        # Create subtopic page without corresponding topic.
        subtopic_page_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_PAGE_ID,
            topic_id=self.TOPIC_ID,
            page_contents=self.subtopic_page_contents,
            page_contents_schema_version=1,
            language_code=self.LANGUAGE_CODE
        )

        self.put_multi([subtopic_page_model])

        # No topic model exists, so no study guides should
        # be processed.
        self.assert_job_output_is_empty()


class AuditPopulateStudyGuidesJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        populate_study_guide_models_jobs.AuditPopulateStudyGuidesJob
    ] = populate_study_guide_models_jobs.AuditPopulateStudyGuidesJob

    TOPIC_ID: Final = 'topic_id_1'
    TOPIC_NAME: Final = 'Test Topic'
    SUBTOPIC_ID: Final = 1
    SUBTOPIC_PAGE_ID: Final = f'{TOPIC_ID}-{SUBTOPIC_ID}'
    SUBTOPIC_TITLE: Final = 'Test Subtopic'
    LANGUAGE_CODE: Final = 'en'

    def setUp(self) -> None:
        super().setUp()

        # Create test subtopic page content.
        self.subtopic_page_contents = {
            'subtitled_html': {
                'html': '<p>Test subtopic content</p>',
                'content_id': 'content'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }

        # Create test topic with subtopic.
        self.subtopic = topic_domain.Subtopic(
            subtopic_id=self.SUBTOPIC_ID,
            title=self.SUBTOPIC_TITLE,
            skill_ids=['skill_1', 'skill_2'],
            thumbnail_filename='test.svg',
            thumbnail_bg_color='#FFFFFF',
            thumbnail_size_in_bytes=1024,
            url_fragment='test-subtopic'
        )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_successful_study_guide_regeneration(self) -> None:
        # Create subtopic page model.
        subtopic_page_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_PAGE_ID,
            topic_id=self.TOPIC_ID,
            page_contents=self.subtopic_page_contents,
            page_contents_schema_version=1,
            language_code=self.LANGUAGE_CODE
        )

        # Create topic model.
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID,
            name=self.TOPIC_NAME,
            abbreviated_name='Test',
            url_fragment='test-topic',
            description='Test topic description',
            canonical_name='Test Topic',
            language_code=self.LANGUAGE_CODE,
            subtopics=[self.subtopic.to_dict()],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            page_title_fragment_for_web='testing-three',
            version=1
        )

        self.put_multi([subtopic_page_model, topic_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='STUDY GUIDES PROCESSED SUCCESS: 1'
            )
        ])

    def test_subtopic_not_found_in_topic_raises_error(self) -> None:
        # Create subtopic page model.
        subtopic_page_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_PAGE_ID,
            topic_id=self.TOPIC_ID,
            page_contents=self.subtopic_page_contents,
            page_contents_schema_version=1,
            language_code=self.LANGUAGE_CODE
        )

        # Create topic model without the subtopic.
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID,
            name=self.TOPIC_NAME,
            abbreviated_name='Test',
            url_fragment='test-topic',
            description='Test topic description',
            canonical_name='Test Topic',
            language_code=self.LANGUAGE_CODE,
            subtopics=[],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            page_title_fragment_for_web='testing-two',
            version=1
        )

        self.put_multi([subtopic_page_model, topic_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=f'STUDY GUIDES PROCESSED ERROR: '
                       f'"(\'{self.SUBTOPIC_PAGE_ID}\', '
                       f'Exception(\'The subtopic with id '
                       f'{self.SUBTOPIC_ID} does not exist.\'))": 1'
            )
        ])

    def test_multiple_subtopic_pages_audit(self) -> None:
        # Create multiple subtopic pages.
        subtopic_page_id_2 = f'{self.TOPIC_ID}-2'
        subtopic_2 = topic_domain.Subtopic(
            subtopic_id=2,
            title='Second Subtopic',
            skill_ids=['skill_3'],
            thumbnail_filename='test2.svg',
            thumbnail_bg_color='#000000',
            thumbnail_size_in_bytes=2048,
            url_fragment='second-subtopic'
        )

        subtopic_page_model_1 = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_PAGE_ID,
            topic_id=self.TOPIC_ID,
            page_contents=self.subtopic_page_contents,
            page_contents_schema_version=1,
            language_code=self.LANGUAGE_CODE
        )

        subtopic_page_model_2 = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=subtopic_page_id_2,
            topic_id=self.TOPIC_ID,
            page_contents=self.subtopic_page_contents,
            page_contents_schema_version=1,
            language_code=self.LANGUAGE_CODE
        )

        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID,
            name=self.TOPIC_NAME,
            abbreviated_name='Test',
            url_fragment='test-topic',
            description='Test topic description',
            canonical_name='Test Topic',
            language_code=self.LANGUAGE_CODE,
            subtopics=[self.subtopic.to_dict(), subtopic_2.to_dict()],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=3,
            page_title_fragment_for_web='testing-one',
            version=1
        )

        self.put_multi(
            [
                subtopic_page_model_1,
                subtopic_page_model_2,
                topic_model
            ]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='STUDY GUIDES PROCESSED SUCCESS: 2'
            )
        ])

    @mock.patch(
        'core.jobs.batch_jobs.populate_study_guide_models_jobs.logging'
    )
    def test_exception_logging(self, mock_logging: mock.Mock) -> None:
        # Create subtopic page model.
        subtopic_page_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_PAGE_ID,
            topic_id=self.TOPIC_ID,
            page_contents=self.subtopic_page_contents,
            page_contents_schema_version=1,
            language_code=self.LANGUAGE_CODE
        )

        # Create topic model.
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID,
            name=self.TOPIC_NAME,
            abbreviated_name='Test',
            url_fragment='test-topic',
            description='Test topic description',
            canonical_name='Test Topic',
            language_code=self.LANGUAGE_CODE,
            subtopics=[self.subtopic.to_dict()],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            page_title_fragment_for_web='testing-seven',
            version=1
        )

        self.put_multi([subtopic_page_model, topic_model])

        # Mock validation to raise an exception.
        test_exception = Exception('Test exception')
        with mock.patch(
            'core.domain.subtopic_page_domain.SubtopicPage.validate',
            side_effect=test_exception
        ):
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stderr=f'STUDY GUIDES PROCESSED ERROR: '
                           f'"(\'{self.SUBTOPIC_PAGE_ID}\', '
                           f'Exception(\'Test exception\'))": 1'
                )
            ])

            # Verify that the exception was logged.
            mock_logging.exception.assert_called_with(test_exception)
