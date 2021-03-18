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
from core.domain import topic_fetchers
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf

(story_models,) = models.Registry.import_models([models.NAMES.story])


class DescriptionLengthAuditOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off description length limit job."""

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    # Description with length more than 1000.
    STORY_ID = 'story_id'
    DESCRIPTION = 'a' * 1001

    def setUp(self):
        super(DescriptionLengthAuditOneOffJobTests, self).setUp()

        # Setup user who will own the test story.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.TOPIC_ID = 'topic_id'
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
        self.process_and_flush_pending_mapreduce_tasks()

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            story_jobs_one_off.DescriptionLengthAuditOneOffJob.create_new())
        story_jobs_one_off.DescriptionLengthAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()
        return story_jobs_one_off.DescriptionLengthAuditOneOffJob.get_output(
            job_id)

    def test_description_length_limit(self):
        """Checks description length."""

        # Creating a new story.
        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A title', self.DESCRIPTION, self.TOPIC_ID,
            'title-one')
        story_services.save_new_story(self.albert_id, story)
        topic_services.add_canonical_story(
            self.albert_id, self.TOPIC_ID, story.id)

        output = self._run_one_off_job()
        self.assertEqual(
            [u'[u\'Topic Id: topic_id\', u"Story Id: [\'story_id\']"]'], output
        )


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
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()
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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A title', 'Description', self.TOPIC_ID,
            'title-three')
        story_services.save_new_story(self.albert_id, story)
        topic_services.add_canonical_story(
            self.albert_id, self.TOPIC_ID, story.id)
        story.description = 123

        def _mock_get_story_by_id(unused_story_id):
            """Mocks get_story_by_id()."""
            return story

        get_story_by_id_swap = self.swap(
            story_fetchers, 'get_story_by_id', _mock_get_story_by_id)

        with get_story_by_id_swap:
            job_id = (
                story_jobs_one_off.StoryMigrationOneOffJob.create_new())
            story_jobs_one_off.StoryMigrationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_mapreduce_tasks()

        output = story_jobs_one_off.StoryMigrationOneOffJob.get_output(job_id)

        # If the story had been successfully migrated, this would include a
        # 'successfully migrated' message. Its absence means that the story
        # could not be processed.
        for x in output:
            self.assertRegexpMatches(
                x, 'Expected description to be a string, received 123')


class RegenerateStorySummaryOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    STORY_ID = 'story_id'

    def setUp(self):
        super(RegenerateStorySummaryOneOffJobTests, self).setUp()

        # Setup user who will own the test stories.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()
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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
            self.process_and_flush_pending_mapreduce_tasks()

        output = story_jobs_one_off.RegenerateStorySummaryOneOffJob.get_output(
            job_id)

        for x in output:
            self.assertRegexpMatches(
                x, 'object has no attribute \'story_contents\'')
