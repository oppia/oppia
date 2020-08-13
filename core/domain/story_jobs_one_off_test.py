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

"""Tests for Story-related one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_jobs_one_off
from core.domain import story_services
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf

(story_models,) = models.Registry.import_models([models.NAMES.story])


class StoryMigrationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    STORY_ID = 'story_id'
    MIGRATED_STORY_CONTENTS_DICT = {
        'initial_node_id': 'node_1',
        'next_node_id': 'node_2',
        'nodes': [{
            'acquired_skill_ids': [],
            'destination_node_ids': [],
            'exploration_id': None,
            'id': 'node_1',
            'outline': (
                '<p>Value</p><oppia-noninteractive-'
                'math math_content-with-value="{&amp;quot'
                ';raw_latex&amp;quot;: &amp;quot;+,-,-,+'
                '&amp;quot;, &amp;quot;svg_filename&amp;'
                'quot;: &amp;quot;&amp;quot;}"></oppia'
                '-noninteractive-math>'),
            'outline_is_finalized': False,
            'prerequisite_skill_ids': [],
            'description': '',
            'thumbnail_bg_color': None,
            'thumbnail_filename': None,
            'title': 'Chapter 1'
        }]
    }

    def setUp(self):
        super(StoryMigrationOneOffJobTests, self).setUp()

        # Setup user who will own the test stories.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.TOPIC_ID = topic_services.get_new_topic_id()
        self.story_id_1 = 'story_id_1'
        self.story_id_2 = 'story_id_2'
        self.story_id_3 = 'story_id_3'
        self.skill_id_1 = 'skill_id_1'
        self.skill_id_2 = 'skill_id_2'
        self.save_new_topic(
            self.TOPIC_ID, self.albert_id, name='Name',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        self.process_and_flush_pending_tasks()

    def test_migration_job_does_not_convert_up_to_date_story(self):
        """Tests that the story migration job does not convert a
        story that is already the latest schema version.
        """
        # Create a new story that should not be affected by the
        # job.
        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A title', 'Description', self.TOPIC_ID,
            'title-one')
        story_services.save_new_story(self.albert_id, story)
        topic_services.add_canonical_story(
            self.albert_id, self.TOPIC_ID, story.id)
        self.assertEqual(
            story.story_contents_schema_version,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION)

        # Start migration job.
        job_id = (
            story_jobs_one_off.StoryMigrationOneOffJob.create_new())
        story_jobs_one_off.StoryMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the story is exactly the same after migration.
        updated_story = (
            story_fetchers.get_story_by_id(self.STORY_ID))
        self.assertEqual(
            updated_story.story_contents_schema_version,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION)

        output = story_jobs_one_off.StoryMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
        expected = [[u'story_migrated',
                     [u'1 stories successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_skips_deleted_story(self):
        """Tests that the story migration job skips deleted story
        and does not attempt to migrate.
        """
        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A title', 'Description', self.TOPIC_ID,
            'title-two')
        story_services.save_new_story(self.albert_id, story)
        topic_services.add_canonical_story(
            self.albert_id, self.TOPIC_ID, story.id)

        # Delete the story before migration occurs.
        story_services.delete_story(
            self.albert_id, self.STORY_ID)

        # Ensure the story is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            story_fetchers.get_story_by_id(self.STORY_ID)

        # Start migration job on sample story.
        job_id = (
            story_jobs_one_off.StoryMigrationOneOffJob.create_new())
        story_jobs_one_off.StoryMigrationOneOffJob.enqueue(job_id)

        # This running without errors indicates the deleted story is
        # being ignored.
        self.process_and_flush_pending_tasks()

        # Ensure the story is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            story_fetchers.get_story_by_id(self.STORY_ID)

        output = story_jobs_one_off.StoryMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
        expected = [[u'story_deleted',
                     [u'Encountered 1 deleted stories.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_converts_old_story(self):
        """Tests that the schema conversion functions work
        correctly and an old story is converted to new
        version.
        """
        # Generate story with old(v1) story contents data.
        self.save_new_story_with_story_contents_schema_v1(
            self.STORY_ID, 'image.svg', '#F8BF74', self.albert_id, 'A title',
            'A description', 'A note', self.TOPIC_ID)
        topic_services.add_canonical_story(
            self.albert_id, self.TOPIC_ID, self.STORY_ID)
        story_model = (
            story_models.StoryModel.get(self.STORY_ID))
        self.assertEqual(story_model.story_contents_schema_version, 1)
        self.assertEqual(
            story_model.story_contents,
            {
                'initial_node_id': 'node_1',
                'next_node_id': 'node_2',
                'nodes': [{
                    'acquired_skill_ids': [],
                    'destination_node_ids': [],
                    'exploration_id': None,
                    'id': 'node_1',
                    'outline': (
                        '<p>Value</p><oppia-noninteractive-math raw_l'
                        'atex-with-value="&amp;quot;+,-,-,+&amp;quot'
                        ';"></oppia-noninteractive-math>'),
                    'outline_is_finalized': False,
                    'prerequisite_skill_ids': [],
                    'title': 'Chapter 1'
                }]
            })
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.story_contents_schema_version, 4)
        self.assertEqual(
            story.story_contents.to_dict(),
            self.MIGRATED_STORY_CONTENTS_DICT)

        # Start migration job.
        job_id = (
            story_jobs_one_off.StoryMigrationOneOffJob.create_new())
        story_jobs_one_off.StoryMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the story migrates correctly.
        updated_story = (
            story_models.StoryModel.get(self.STORY_ID))
        self.assertEqual(
            updated_story.story_contents_schema_version,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION)
        updated_story = (
            story_fetchers.get_story_by_id(self.STORY_ID))
        self.assertEqual(
            updated_story.story_contents_schema_version,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION)
        self.assertEqual(
            updated_story.story_contents.to_dict(),
            self.MIGRATED_STORY_CONTENTS_DICT)

        output = story_jobs_one_off.StoryMigrationOneOffJob.get_output(job_id)
        expected = [[u'story_migrated',
                     [u'1 stories successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_skips_updated_story_failing_validation(self):

        def _mock_get_story_by_id(unused_story_id):
            """Mocks get_story_by_id()."""
            return 'invalid_story'

        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A title', 'Description', self.TOPIC_ID,
            'title-three')
        story_services.save_new_story(self.albert_id, story)
        topic_services.add_canonical_story(
            self.albert_id, self.TOPIC_ID, story.id)
        get_story_by_id_swap = self.swap(
            story_fetchers, 'get_story_by_id', _mock_get_story_by_id)

        with get_story_by_id_swap:
            job_id = (
                story_jobs_one_off.StoryMigrationOneOffJob.create_new())
            story_jobs_one_off.StoryMigrationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

        output = story_jobs_one_off.StoryMigrationOneOffJob.get_output(
            job_id)

        # If the story had been successfully migrated, this would include a
        # 'successfully migrated' message. Its absence means that the story
        # could not be processed.
        for x in output:
            self.assertRegexpMatches(x, 'object has no attribute \'validate\'')


class RegenerateStorySummaryOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    STORY_ID = 'story_id'

    def setUp(self):
        super(RegenerateStorySummaryOneOffJobTests, self).setUp()

        # Setup user who will own the test stories.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.TOPIC_ID = topic_services.get_new_topic_id()
        self.story_id_1 = 'story_id_1'
        self.story_id_2 = 'story_id_2'
        self.story_id_3 = 'story_id_3'
        self.skill_id_1 = 'skill_id_1'
        self.skill_id_2 = 'skill_id_2'
        self.save_new_topic(
            self.TOPIC_ID, self.albert_id, name='Name',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        self.process_and_flush_pending_tasks()

    def test_job_skips_deleted_story(self):
        """Tests that the regenerate summary job skips deleted story."""
        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A title', 'Description', self.TOPIC_ID,
            'title-four')
        story_services.save_new_story(self.albert_id, story)
        topic_services.add_canonical_story(
            self.albert_id, self.TOPIC_ID, story.id)

        story_services.delete_story(
            self.albert_id, self.STORY_ID)

        # Ensure the story is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            story_fetchers.get_story_by_id(self.STORY_ID)

        # Start migration job on sample story.
        job_id = (
            story_jobs_one_off.RegenerateStorySummaryOneOffJob.create_new())
        story_jobs_one_off.RegenerateStorySummaryOneOffJob.enqueue(job_id)

        # This running without errors indicates the deleted story is
        # being ignored.
        self.process_and_flush_pending_tasks()

        # Ensure the story is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            story_fetchers.get_story_by_id(self.STORY_ID)

        output = story_jobs_one_off.RegenerateStorySummaryOneOffJob.get_output(
            job_id)
        expected = [[u'story_deleted',
                     [u'Encountered 1 deleted stories.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_converts_old_story(self):
        """Tests that the schema conversion functions work
        correctly and an old story is converted to new
        version.
        """
        story_contents = {
            'nodes': [{
                'outline': u'',
                'exploration_id': None,
                'destination_node_ids': [],
                'outline_is_finalized': False,
                'acquired_skill_ids': [],
                'id': 'node_1',
                'title': 'Chapter 1',
                'description': '',
                'prerequisite_skill_ids': [],
                'thumbnail_filename': None,
                'thumbnail_bg_color': None
            }],
            'initial_node_id': 'node_1',
            'next_node_id': 'node_2'
        }
        story_model = story_models.StoryModel(
            id=self.STORY_ID,
            thumbnail_filename='image.svg',
            thumbnail_bg_color='#F8BF74',
            description='Story description',
            title='Story title',
            language_code='en',
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            notes='Story notes',
            corresponding_topic_id=self.TOPIC_ID,
            story_contents=story_contents,
            url_fragment='story-frag-one'
        )
        commit_message = (
            'New story created with title \'Story title\'.')
        story_model.commit(
            self.albert_id, commit_message, [{
                'cmd': story_domain.CMD_CREATE_NEW,
                'title': 'Story title'
            }])
        topic_services.add_canonical_story(
            self.albert_id, self.TOPIC_ID, self.STORY_ID)
        story_summary_model = (
            story_models.StorySummaryModel.get(self.STORY_ID, strict=False))

        # Start migration job.
        job_id = (
            story_jobs_one_off.RegenerateStorySummaryOneOffJob.create_new())
        story_jobs_one_off.RegenerateStorySummaryOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the story summary is created correctly.
        story_summary_model = (
            story_models.StorySummaryModel.get(self.STORY_ID, strict=False))
        self.assertEqual(
            story_summary_model.node_titles, ['Chapter 1'])
        self.assertEqual(
            story_summary_model.thumbnail_filename, 'image.svg')
        self.assertEqual(
            story_summary_model.thumbnail_bg_color, '#F8BF74')

        output = story_jobs_one_off.RegenerateStorySummaryOneOffJob.get_output(
            job_id)
        expected = [[u'story_processed',
                     [u'Successfully processed 1 stories.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_regeneration_job_skips_invalid_story(self):

        def _mock_get_story_by_id(unused_story_id):
            """Mocks get_story_by_id()."""
            return 'invalid_story'

        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A title', 'Description', self.TOPIC_ID,
            'title-five')
        story_services.save_new_story(self.albert_id, story)
        topic_services.add_canonical_story(
            self.albert_id, self.TOPIC_ID, story.id)
        get_story_by_id_swap = self.swap(
            story_fetchers, 'get_story_by_id', _mock_get_story_by_id)

        with get_story_by_id_swap:
            job_id = (
                story_jobs_one_off.RegenerateStorySummaryOneOffJob.create_new())
            story_jobs_one_off.RegenerateStorySummaryOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

        output = story_jobs_one_off.RegenerateStorySummaryOneOffJob.get_output(
            job_id)

        for x in output:
            self.assertRegexpMatches(
                x, 'object has no attribute \'story_contents\'')


class StoryMathRteAuditOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'


    def setUp(self):
        super(StoryMathRteAuditOneOffJobTests, self).setUp()

        # Setup user who will own the test stories.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_job_finds_stories_with_math_rich_text_components(self):
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
        story_contents1 = {
            'nodes': [{
                'outline': valid_html_1,
                'exploration_id': None,
                'destination_node_ids': [],
                'outline_is_finalized': False,
                'acquired_skill_ids': [],
                'id': 'node_1',
                'title': 'Chapter 1',
                'description': '',
                'prerequisite_skill_ids': [],
                'thumbnail_filename': None,
                'thumbnail_bg_color': None
            }],
            'initial_node_id': 'node_1',
            'next_node_id': 'node_2'
        }
        story_model1 = story_models.StoryModel(
            id='story_id_1',
            thumbnail_filename='image.svg',
            thumbnail_bg_color='#F8BF74',
            description='Story description',
            title='Story title1',
            language_code='en',
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            notes='Story notes',
            corresponding_topic_id='topic_id1',
            story_contents=story_contents1,
            url_fragment='story-frag-two'
        )
        commit_message = (
            'New story created with title \'Story title1\'.')
        story_model1.commit(
            self.albert_id, commit_message, [{
                'cmd': story_domain.CMD_CREATE_NEW,
                'title': 'Story title'
            }])
        story_contents2 = {
            'nodes': [{
                'outline': valid_html_2,
                'exploration_id': None,
                'destination_node_ids': [],
                'outline_is_finalized': False,
                'acquired_skill_ids': [],
                'id': 'node_1',
                'title': 'Chapter 2',
                'description': '',
                'prerequisite_skill_ids': [],
                'thumbnail_filename': None,
                'thumbnail_bg_color': None
            }],
            'initial_node_id': 'node_1',
            'next_node_id': 'node_2'
        }
        story_model2 = story_models.StoryModel(
            id='story_id_2',
            thumbnail_filename='image.svg',
            thumbnail_bg_color='#F8BF74',
            description='Story description',
            title='Story title2',
            language_code='en',
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            notes='Story notes',
            corresponding_topic_id='topic_id1',
            story_contents=story_contents2,
            url_fragment='story-frag-three'
        )
        commit_message = (
            'New story created with title \'Story title2\'.')
        story_model2.commit(
            self.albert_id, commit_message, [{
                'cmd': story_domain.CMD_CREATE_NEW,
                'title': 'Story title'
            }])

        job_id = (
            story_jobs_one_off.StoryMathRteAuditOneOffJob.create_new())
        story_jobs_one_off.StoryMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        output = story_jobs_one_off.StoryMathRteAuditOneOffJob.get_output(
            job_id)

        expected_overall_result = (
            u'[u\'Overall result.\', {u\'total_number_stories_requiring_sv'
            'gs\': 2, u\'total_number_of_latex_strings_without_svg\': 2}]')
        self.assertEqual(output[0], expected_overall_result)
        detailed_result = ast.literal_eval(output[1])
        expected_story1_info = {
            'story_id': 'story_id_1',
            'latex_strings_without_svg': [
                '(x - a_1)(x - a_2)(x - a_3)...(x - a_n-1)(x - a_n)']
        }
        expected_story2_info = {
            'story_id': 'story_id_2',
            'latex_strings_without_svg': ['+,+,+,+']
        }
        stories_latex_info = sorted(detailed_result[1])
        self.assertEqual(stories_latex_info[0], expected_story1_info)
        self.assertEqual(stories_latex_info[1], expected_story2_info)

    def test_job_when_stories_do_not_have_math_rich_text(self):
        story_contents1 = {
            'nodes': [{
                'outline': u'',
                'exploration_id': None,
                'destination_node_ids': [],
                'outline_is_finalized': False,
                'acquired_skill_ids': [],
                'id': 'node_1',
                'title': 'Chapter 1',
                'description': '',
                'prerequisite_skill_ids': [],
                'thumbnail_filename': None,
                'thumbnail_bg_color': None
            }],
            'initial_node_id': 'node_1',
            'next_node_id': 'node_2'
        }
        story_model1 = story_models.StoryModel(
            id='story_id_1',
            thumbnail_filename='image.svg',
            thumbnail_bg_color='#F8BF74',
            description='Story description',
            title='Story title1',
            language_code='en',
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            notes='Story notes',
            corresponding_topic_id='topic_id1',
            story_contents=story_contents1,
            url_fragment='story-frag-four'
        )
        commit_message = (
            'New story created with title \'Story title1\'.')
        story_model1.commit(
            self.albert_id, commit_message, [{
                'cmd': story_domain.CMD_CREATE_NEW,
                'title': 'Story title'
            }])
        job_id = (
            story_jobs_one_off.StoryMathRteAuditOneOffJob.create_new())
        story_jobs_one_off.StoryMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        output = story_jobs_one_off.StoryMathRteAuditOneOffJob.get_output(
            job_id)

        self.assertEqual(output, [])

    def test_job_skips_deleted_stories(self):
        story = story_domain.Story.create_default_story(
            'story_id', 'A title', 'Description', 'topic_id', 'title')
        story_services.save_new_story(self.albert_id, story)
        story_services.delete_story(self.albert_id, 'story_id')
        job_id = (
            story_jobs_one_off.StoryMathRteAuditOneOffJob.create_new())
        story_jobs_one_off.StoryMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        output = story_jobs_one_off.StoryMathRteAuditOneOffJob.get_output(
            job_id)
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
            'quot;svg_filename&amp;quot;: &amp;quot;file2.svg&amp;quot;}"></'
            'oppia-noninteractive-math>'
        )
        story_contents1 = {
            'nodes': [{
                'outline': valid_html_1,
                'exploration_id': None,
                'destination_node_ids': [],
                'outline_is_finalized': False,
                'acquired_skill_ids': [],
                'id': 'node_1',
                'title': 'Chapter 1',
                'description': '',
                'prerequisite_skill_ids': [],
                'thumbnail_filename': None,
                'thumbnail_bg_color': None
            }],
            'initial_node_id': 'node_1',
            'next_node_id': 'node_2'
        }
        story_model1 = story_models.StoryModel(
            id='story_id_1',
            thumbnail_filename='image.svg',
            thumbnail_bg_color='#F8BF74',
            description='Story description',
            title='Story title1',
            language_code='en',
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            notes='Story notes',
            corresponding_topic_id='topic_id1',
            story_contents=story_contents1,
            url_fragment='story-frag-five'
        )
        commit_message = (
            'New story created with title \'Story title1\'.')
        story_model1.commit(
            self.albert_id, commit_message, [{
                'cmd': story_domain.CMD_CREATE_NEW,
                'title': 'Story title'
            }])
        story_contents2 = {
            'nodes': [{
                'outline': valid_html_2,
                'exploration_id': None,
                'destination_node_ids': [],
                'outline_is_finalized': False,
                'acquired_skill_ids': [],
                'id': 'node_1',
                'title': 'Chapter 2',
                'description': '',
                'prerequisite_skill_ids': [],
                'thumbnail_filename': None,
                'thumbnail_bg_color': None
            }],
            'initial_node_id': 'node_1',
            'next_node_id': 'node_2'
        }
        story_model2 = story_models.StoryModel(
            id='story_id_2',
            thumbnail_filename='image.svg',
            thumbnail_bg_color='#F8BF74',
            description='Story description',
            title='Story title2',
            language_code='en',
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            notes='Story notes',
            corresponding_topic_id='topic_id1',
            story_contents=story_contents2,
            url_fragment='story-frag-six'
        )
        commit_message = (
            'New story created with title \'Story title2\'.')
        story_model2.commit(
            self.albert_id, commit_message, [{
                'cmd': story_domain.CMD_CREATE_NEW,
                'title': 'Story title'
            }])

        job_id = (
            story_jobs_one_off.StoryMathRteAuditOneOffJob
            .create_new())
        story_jobs_one_off.StoryMathRteAuditOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        output = (
            story_jobs_one_off.StoryMathRteAuditOneOffJob
            .get_output(job_id))

        overall_result = ast.literal_eval(output[0])
        expected_story1_info = {
            'story_id': 'story_id_1',
            'latex_strings_with_svg': [
                '(x - a_1)(x - a_2)(x - a_3)...(x - a_n-1)(x - a_n)']
        }
        expected_story2_info = {
            'story_id': 'story_id_2',
            'latex_strings_with_svg': ['+,+,+,+']
        }
        story_latex_info = sorted(overall_result[1])
        self.assertEqual(story_latex_info[0], expected_story1_info)
        self.assertEqual(story_latex_info[1], expected_story2_info)
