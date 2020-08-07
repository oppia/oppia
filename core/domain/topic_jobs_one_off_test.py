# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for Topic-related one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging

from constants import constants
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_jobs_one_off
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


class TopicMigrationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    TOPIC_ID = 'topic_id'

    MIGRATED_SUBTOPIC_DICT = {
        'id': 1,
        'skill_ids': ['skill_1'],
        'thumbnail_bg_color': None,
        'thumbnail_filename': None,
        'title': 'A subtitle',
        'url_fragment': 'subtitle'
    }

    def setUp(self):
        super(TopicMigrationOneOffJobTests, self).setUp()
        # Setup user who will own the test topics.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_migration_job_does_not_convert_up_to_date_topic(self):
        """Tests that the topic migration job does not convert a
        topic that is already the latest schema version.
        """
        # Create a new topic that should not be affected by the
        # job.
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'A name', 'abbrev', 'description')
        topic.add_subtopic(1, 'A subtitle')
        topic_services.save_new_topic(self.albert_id, topic)
        self.assertEqual(
            topic.subtopic_schema_version,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION)

        # Start migration job.
        job_id = (
            topic_jobs_one_off.TopicMigrationOneOffJob.create_new())
        topic_jobs_one_off.TopicMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the topic is exactly the same after migration.
        updated_topic = (
            topic_fetchers.get_topic_by_id(self.TOPIC_ID))
        self.assertEqual(
            updated_topic.subtopic_schema_version,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION)
        self.assertEqual(
            topic.subtopics[0].to_dict(), updated_topic.subtopics[0].to_dict())

        output = topic_jobs_one_off.TopicMigrationOneOffJob.get_output(job_id)
        expected = [[u'topic_migrated',
                     [u'1 topics successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_skips_deleted_topic(self):
        """Tests that the topic migration job skips deleted topic
        and does not attempt to migrate.
        """
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'A name', 'abbrev', 'description')
        topic_services.save_new_topic(self.albert_id, topic)

        # Delete the topic before migration occurs.
        topic_services.delete_topic(
            self.albert_id, self.TOPIC_ID)

        # Ensure the topic is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        # Start migration job on sample topic.
        job_id = (
            topic_jobs_one_off.TopicMigrationOneOffJob.create_new())
        topic_jobs_one_off.TopicMigrationOneOffJob.enqueue(job_id)

        # This running without errors indicates the deleted topic is
        # being ignored.
        self.process_and_flush_pending_tasks()

        # Ensure the topic is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        output = topic_jobs_one_off.TopicMigrationOneOffJob.get_output(job_id)
        expected = [[u'topic_deleted',
                     [u'Encountered 1 deleted topics.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_converts_old_topic(self):
        """Tests that the schema conversion functions work
        correctly and an old topic is converted to new
        version.
        """
        # Generate topic with old(v1) subtopic data.
        self.save_new_topic_with_subtopic_schema_v1(
            self.TOPIC_ID, self.albert_id, 'A name', 'abbrev',
            'a name', '', 'Image.svg', '#C6DCDA', [], [], [], 2)
        topic_model = (
            topic_models.TopicModel.get(self.TOPIC_ID))
        self.assertEqual(topic_model.subtopic_schema_version, 1)
        self.assertEqual(
            topic_model.subtopics[0],
            {
                'id': 1,
                'skill_ids': ['skill_1'],
                'title': 'A subtitle'
            })
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.subtopic_schema_version, 3)
        self.assertEqual(
            topic.subtopics[0].to_dict(),
            self.MIGRATED_SUBTOPIC_DICT)

        # Start migration job.
        job_id = (
            topic_jobs_one_off.TopicMigrationOneOffJob.create_new())
        topic_jobs_one_off.TopicMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the topic migrates correctly.
        updated_topic = (
            topic_models.TopicModel.get(self.TOPIC_ID))
        self.assertEqual(
            updated_topic.subtopic_schema_version,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION)
        updated_topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            updated_topic.subtopic_schema_version,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION)
        self.assertEqual(
            updated_topic.subtopics[0].to_dict(),
            self.MIGRATED_SUBTOPIC_DICT)

        output = topic_jobs_one_off.TopicMigrationOneOffJob.get_output(job_id)
        expected = [[u'topic_migrated',
                     [u'1 topics successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_fails_with_invalid_topic(self):
        observed_log_messages = []

        def _mock_logging_function(msg):
            """Mocks logging.error()."""
            observed_log_messages.append(msg)

        # The topic model created will be invalid due to invalid language code.
        self.save_new_topic_with_subtopic_schema_v1(
            self.TOPIC_ID, self.albert_id, 'A name', 'abbrev',
            'a name', 'description', 'Image.svg',
            '#C6DCDA', [], [], [], 2,
            language_code='invalid_language_code')

        job_id = (
            topic_jobs_one_off.TopicMigrationOneOffJob.create_new())
        topic_jobs_one_off.TopicMigrationOneOffJob.enqueue(job_id)
        with self.swap(logging, 'error', _mock_logging_function):
            self.process_and_flush_pending_tasks()

        self.assertEqual(
            observed_log_messages,
            ['Topic topic_id failed validation: Invalid language code: '
             'invalid_language_code'])

        output = topic_jobs_one_off.TopicMigrationOneOffJob.get_output(job_id)
        expected = [[u'validation_error',
                     [u'Topic topic_id failed validation: '
                      'Invalid language code: invalid_language_code']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])


class RemoveDeletedSkillsFromTopicOneOffJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    TOPIC_ID = 'topic_id'

    def setUp(self):
        super(RemoveDeletedSkillsFromTopicOneOffJobTests, self).setUp()
        # Setup user who will own the test topics.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()
        self.rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]

    def test_job_removes_deleted_uncategorized_skill_ids(self):
        """Tests that the RemoveDeletedSkillsFromTopicOneOffJob job removes
        deleted uncategorized skills ids from the topic.
        """
        valid_skill_1 = skill_domain.Skill.create_default_skill(
            'valid_skill_1', 'A description', self.rubrics)
        valid_skill_2 = skill_domain.Skill.create_default_skill(
            'valid_skill_2', 'A description', self.rubrics)
        valid_skill_3 = skill_domain.Skill.create_default_skill(
            'valid_skill_3', 'A description', self.rubrics)
        skill_services.save_new_skill(self.albert_id, valid_skill_1)
        skill_services.save_new_skill(self.albert_id, valid_skill_2)
        skill_services.save_new_skill(self.albert_id, valid_skill_3)
        # Create a new topic that should not be affected by the
        # job.
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'A name', 'abbrev', 'description')
        topic.add_subtopic(1, 'A subtitle')
        topic.add_uncategorized_skill_id('valid_skill_1')
        topic.add_uncategorized_skill_id('valid_skill_2')
        topic.add_uncategorized_skill_id('valid_skill_3')
        topic.add_uncategorized_skill_id('deleted_skill_1')
        topic.add_uncategorized_skill_id('deleted_skill_2')
        topic.add_uncategorized_skill_id('deleted_skill_3')
        topic.move_skill_id_to_subtopic(None, 1, 'valid_skill_3')
        topic.move_skill_id_to_subtopic(None, 1, 'deleted_skill_3')
        topic_services.save_new_topic(self.albert_id, topic)
        # Pre-assert that all skills are added correctly.
        self.assertEqual(
            set(topic.uncategorized_skill_ids),
            set([
                'valid_skill_1',
                'valid_skill_2',
                'deleted_skill_1',
                'deleted_skill_2'
            ]))
        self.assertEqual(
            set(topic.subtopics[0].skill_ids),
            set(['valid_skill_3', 'deleted_skill_3']))

        # Start RemoveDeletedSkillsFromTopicOneOffJob.
        job_id = (
            topic_jobs_one_off.RemoveDeletedSkillsFromTopicOneOffJob
            .create_new())
        topic_jobs_one_off.RemoveDeletedSkillsFromTopicOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        # Assert that only valid skills remain after
        # RemoveDeletedSkillsFromTopicOneOffJob.
        updated_topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            updated_topic.uncategorized_skill_ids,
            ['valid_skill_1', 'valid_skill_2'])
        self.assertEqual(
            updated_topic.subtopics[0].skill_ids, ['valid_skill_3'])
        output = (
            topic_jobs_one_off.RemoveDeletedSkillsFromTopicOneOffJob
            .get_output(job_id))
        expected = [
            [
                u'Skill IDs deleted for topic topic_id:',
                [u'[u\'deleted_skill_1\', u\'deleted_skill_2\','
                 ' u\'deleted_skill_3\']']
            ],
            [u'topic_processed', [u'Processed 1 topics.']]
        ]

        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_job_skips_deleted_topic(self):
        """Tests that RemoveDeletedSkillsFromTopicOneOffJob job skips
        deleted topic and does not attempt to remove uncategorized skills for
        skills that are deleted.
        """
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'A name', 'abbrev', 'description')
        topic.add_uncategorized_skill_id('skill_1')
        topic.add_uncategorized_skill_id('skill_2')
        topic_services.save_new_topic(self.albert_id, topic)

        # Delete the topic before migration occurs.
        topic_services.delete_topic(
            self.albert_id, self.TOPIC_ID)

        # Ensure the topic is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        # Start migration job on sample topic.
        job_id = (
            topic_jobs_one_off.RemoveDeletedSkillsFromTopicOneOffJob
            .create_new())
        topic_jobs_one_off.RemoveDeletedSkillsFromTopicOneOffJob.enqueue(
            job_id)

        # This running without errors indicates the deleted topic is
        # being ignored.
        self.process_and_flush_pending_tasks()

        # Ensure the topic is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        output = (
            topic_jobs_one_off.RemoveDeletedSkillsFromTopicOneOffJob
            .get_output(job_id))
        expected = [[u'topic_deleted',
                     [u'Encountered 1 deleted topics.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])


class RegenerateTopicSummaryOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    def setUp(self):
        super(RegenerateTopicSummaryOneOffJobTests, self).setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.TOPIC_ID = topic_services.get_new_topic_id()
        self.process_and_flush_pending_tasks()

    def test_job_skips_deleted_topic(self):
        """Tests that the regenerate summary job skips deleted topic."""
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'A title', 'Abbrev title', 'description')
        topic_services.save_new_topic(self.albert_id, topic)
        topic_services.delete_topic(self.albert_id, self.TOPIC_ID)

        # Ensure the topic is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        # Start migration job on sample topic.
        job_id = (
            topic_jobs_one_off.RegenerateTopicSummaryOneOffJob.create_new())
        topic_jobs_one_off.RegenerateTopicSummaryOneOffJob.enqueue(job_id)

        # This running without errors indicates the deleted topic is
        # being ignored.
        self.process_and_flush_pending_tasks()

        # Ensure the topic is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        output = topic_jobs_one_off.RegenerateTopicSummaryOneOffJob.get_output(
            job_id)
        expected = [[u'topic_deleted',
                     [u'Encountered 1 deleted topics.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_job_converts_old_topic_summary(self):
        """Tests that the one off job creates the new summary correctly."""
        topic_model = topic_models.TopicModel(
            id=self.TOPIC_ID,
            name='Topic name',
            abbreviated_name='Topic',
            thumbnail_bg_color='#C6DCDA',
            thumbnail_filename='topic.svg',
            canonical_name='topic name',
            description='Topic description',
            language_code='en',
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=[],
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            story_reference_schema_version=(
                feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION),
            next_subtopic_id=1,
            subtopics=[]
        )
        commit_message = (
            'New topic created with name \'Topic name\'.')

        topic_models.TopicRightsModel(
            id=self.TOPIC_ID,
            manager_ids=[self.albert_id],
            topic_is_published=True
        ).commit(
            self.albert_id, 'Created new topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}])

        topic_model.commit(
            self.albert_id, commit_message, [{
                'cmd': topic_domain.CMD_CREATE_NEW,
                'name': 'Topic name'
            }])

        # The topic summary model isn't created yet.
        topic_summary_model = (
            topic_models.TopicSummaryModel.get(self.TOPIC_ID, strict=False))
        self.assertIsNone(topic_summary_model)

        # Start migration job.
        job_id = (
            topic_jobs_one_off.RegenerateTopicSummaryOneOffJob.create_new())
        topic_jobs_one_off.RegenerateTopicSummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the topic summary is created correctly.
        topic_summary_model = (
            topic_models.TopicSummaryModel.get(self.TOPIC_ID, strict=False))
        self.assertEqual(
            topic_summary_model.thumbnail_filename, 'topic.svg')
        self.assertEqual(
            topic_summary_model.thumbnail_bg_color, '#C6DCDA')

        output = topic_jobs_one_off.RegenerateTopicSummaryOneOffJob.get_output(
            job_id)
        expected = [[u'topic_processed',
                     [u'Successfully processed 1 topics.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_regeneration_job_skips_invalid_topic(self):
        observed_log_messages = []

        def _mock_get_topic_by_id(unused_topic_id):
            """Mocks get_topic_by_id()."""
            return 'invalid_topic'

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'A title', 'Abbrev title', 'description')
        topic_services.save_new_topic(self.albert_id, topic)

        get_topic_by_id_swap = self.swap(
            topic_fetchers, 'get_topic_by_id', _mock_get_topic_by_id)
        logging_exception_swap = self.swap(
            logging, 'exception', _mock_logging_function)

        with get_topic_by_id_swap, logging_exception_swap:
            job_id = (
                topic_jobs_one_off.RegenerateTopicSummaryOneOffJob.create_new())
            topic_jobs_one_off.RegenerateTopicSummaryOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

        output = topic_jobs_one_off.RegenerateTopicSummaryOneOffJob.get_output(
            job_id)

        self.assertEqual(
            observed_log_messages,
            [u'Failed to create topic summary %s: \'unicode\' '
             'object has no attribute \'canonical_story_references\''
             % topic.id])
        for message in output:
            self.assertRegexpMatches(
                message,
                'object has no attribute \'canonical_story_references\'')


class SubTopicPageMathRteAuditOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'


    def setUp(self):
        super(SubTopicPageMathRteAuditOneOffJobTests, self).setUp()
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_job_when_subtopics_have_math_rich_text(self):
        valid_html_1 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n-1)(x - a_n)&amp;quot;, &amp;quot;svg_filenam'
            'e&amp;quot;: &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'
        )
        valid_html_2 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
        )
        topic_id1 = topic_services.get_new_topic_id()
        subtopic_page1 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, topic_id1))

        subtopic_page1.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict({
                'html': valid_html_1,
                'content_id': 'content'
            }))
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'en': {
                        'data_format': 'html',
                        'translation': valid_html_2,
                        'needs_update': False
                    }
                }
            }
        }

        subtopic_page1.update_page_contents_written_translations(
            written_translations_dict)

        subtopic_page_services.save_subtopic_page(
            self.albert_id, subtopic_page1, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        subtopic_page1_id = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                topic_id1, 1))

        topic_id2 = topic_services.get_new_topic_id()
        subtopic_page2 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                2, topic_id2))

        subtopic_page2.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict({
                'html': valid_html_2,
                'content_id': 'content'
            }))

        subtopic_page_services.save_subtopic_page(
            self.albert_id, subtopic_page2, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 2,
                'title': 'Sample'
            })]
        )
        subtopic_page2_id = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                topic_id2, 2))

        job_id = (
            topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob
            .create_new())
        topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        output = (
            topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob
            .get_output(job_id))

        overall_result = ast.literal_eval(output[0])
        expected_overall_result = {
            'total_number_subtopics_requiring_svgs': 2,
            'total_number_of_latex_strings_without_svg': 3
        }

        self.assertEqual(overall_result[1], expected_overall_result)
        detailed_result = ast.literal_eval(output[1])
        expected_subtopic1_info = {
            'subtopic_id': subtopic_page1_id,
            'latex_strings_without_svg': [
                '+,+,+,+', '(x - a_1)(x - a_2)(x - a_3)...(x - a_n-1)(x - a_n)']
        }
        expected_subtopic2_info = {
            'subtopic_id': subtopic_page2_id,
            'latex_strings_without_svg': ['+,+,+,+']
        }
        subtopics_latex_info = sorted(detailed_result[1])
        self.assertEqual(subtopics_latex_info[0], expected_subtopic2_info)
        self.assertEqual(subtopics_latex_info[1], expected_subtopic1_info)

    def test_job_when_subtopics_do_not_have_math_rich_text(self):
        topic_id1 = topic_services.get_new_topic_id()
        subtopic_page1 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, topic_id1))
        subtopic_page_services.save_subtopic_page(
            self.albert_id, subtopic_page1, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )

        job_id = (
            topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob
            .create_new())
        topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        output = (
            topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob
            .get_output(job_id))

        self.assertEqual(output, [])

    def test_job_when_subtopics_have_math_rich_text_with_svgs(self):

        valid_html_1 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n-1)(x - a_n)&amp;quot;, &amp;quot;svg_filenam'
            'e&amp;quot;: &amp;quot;file1.svg&amp;quot;}"></oppia-nonint'
            'eractive-math>'
        )
        valid_html_2 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;file1.svg&amp;quot;}"></'
            'oppia-noninteractive-math>'
        )
        topic_id1 = topic_services.get_new_topic_id()
        subtopic_page1 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, topic_id1))

        subtopic_page1.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict({
                'html': valid_html_1,
                'content_id': 'content'
            }))

        subtopic_page_services.save_subtopic_page(
            self.albert_id, subtopic_page1, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        subtopic_page1_id = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                topic_id1, 1))

        topic_id2 = topic_services.get_new_topic_id()
        subtopic_page2 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                2, topic_id2))

        subtopic_page2.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict({
                'html': valid_html_2,
                'content_id': 'content'
            }))

        subtopic_page_services.save_subtopic_page(
            self.albert_id, subtopic_page2, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 2,
                'title': 'Sample'
            })]
        )
        subtopic_page2_id = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                topic_id2, 2))

        job_id = (
            topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob
            .create_new())
        topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        output = (
            topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob
            .get_output(job_id))

        overall_result = ast.literal_eval(output[0])
        expected_subtopic1_info = {
            'subtopic_id': subtopic_page1_id,
            'latex_strings_with_svg': [
                '(x - a_1)(x - a_2)(x - a_3)...(x - a_n-1)(x - a_n)']
        }
        expected_subtopic2_info = {
            'subtopic_id': subtopic_page2_id,
            'latex_strings_with_svg': ['+,+,+,+']
        }
        subtopic_latex_info = sorted(overall_result[1])
        self.assertEqual(subtopic_latex_info[0], expected_subtopic1_info)
        self.assertEqual(subtopic_latex_info[1], expected_subtopic2_info)

    def test_job_skips_deleted_subtopics(self):
        topic_id1 = topic_services.get_new_topic_id()
        subtopic_page1 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, topic_id1))
        subtopic_page_services.save_subtopic_page(
            self.albert_id, subtopic_page1, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        subtopic_page_services.delete_subtopic_page(
            self.albert_id, topic_id1, 1)

        job_id = (
            topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob
            .create_new())
        topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        output = (
            topic_jobs_one_off.SubTopicPageMathRteAuditOneOffJob
            .get_output(job_id))

        self.assertEqual(output, [])
