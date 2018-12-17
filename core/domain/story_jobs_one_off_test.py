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
import ast

from constants import constants
from core.domain import story_domain
from core.domain import story_jobs_one_off
from core.domain import story_services
from core.platform import models
from core.tests import test_utils
import feconf

(story_models,) = models.Registry.import_models([models.NAMES.story])


class StoryMigrationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    STORY_ID = 'story_id'

    def setUp(self):
        super(StoryMigrationOneOffJobTests, self).setUp()

        # Setup user who will own the test stories.
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.process_and_flush_pending_tasks()

    def test_migration_job_does_not_convert_up_to_date_story(self):
        """Tests that the story migration job does not convert a
        story that is already the latest schema version.
        """
        # Create a new story that should not be affected by the
        # job.
        story = story_domain.Story.create_default_story(
            self.STORY_ID, title='A title')
        story_services.save_new_story(self.albert_id, story)
        self.assertEqual(
            story.schema_version,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION)

        # Start migration job.
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            job_id = (
                story_jobs_one_off.StoryMigrationOneOffJob.create_new())
            story_jobs_one_off.StoryMigrationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

        # Verify the story is exactly the same after migration.
        updated_story = (
            story_services.get_story_by_id(self.STORY_ID))
        self.assertEqual(
            updated_story.schema_version,
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
            self.STORY_ID, title='A title')
        story_services.save_new_story(self.albert_id, story)

        # Delete the story before migration occurs.
        story_services.delete_story(
            self.albert_id, self.STORY_ID)

        # Ensure the story is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            story_services.get_story_by_id(self.STORY_ID)

        # Start migration job on sample story.
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            job_id = (
                story_jobs_one_off.StoryMigrationOneOffJob.create_new())
            story_jobs_one_off.StoryMigrationOneOffJob.enqueue(job_id)

            # This running without errors indicates the deleted story is
            # being ignored.
            self.process_and_flush_pending_tasks()

        # Ensure the story is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            story_services.get_story_by_id(self.STORY_ID)

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
            self.STORY_ID, self.albert_id, 'A title',
            'A description', 'A note')
        story = (
            story_services.get_story_by_id(self.STORY_ID))
        self.assertEqual(story.schema_version, 1)

        # Start migration job.
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            job_id = (
                story_jobs_one_off.StoryMigrationOneOffJob.create_new())
            story_jobs_one_off.StoryMigrationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

        # Verify the story migrates correctly.
        updated_story = (
            story_services.get_story_by_id(self.STORY_ID))
        self.assertEqual(
            updated_story.schema_version,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION)

        output = story_jobs_one_off.StoryMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
        expected = [[u'story_migrated',
                     [u'1 stories successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])
