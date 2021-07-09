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
import os

from constants import constants
from core.domain import fs_domain
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_jobs_one_off
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        topic_services.delete_topic(self.albert_id, self.TOPIC_ID)

        # Ensure the topic is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        # Start migration job on sample topic.
        job_id = (
            topic_jobs_one_off.TopicMigrationOneOffJob.create_new())
        topic_jobs_one_off.TopicMigrationOneOffJob.enqueue(job_id)

        # This running without errors indicates the deleted topic is
        # being ignored.
        self.process_and_flush_pending_mapreduce_tasks()

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
            self.TOPIC_ID, self.albert_id, 'A name', 'abbrev', 'topic-one',
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
        self.process_and_flush_pending_mapreduce_tasks()

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
        # The topic model created will be invalid due to invalid language code.
        self.save_new_topic_with_subtopic_schema_v1(
            self.TOPIC_ID, self.albert_id, 'A name', 'abbrev', 'topic-two',
            'a name', 'description', 'Image.svg',
            '#C6DCDA', [], [], [], 2,
            language_code='invalid_language_code')

        job_id = (
            topic_jobs_one_off.TopicMigrationOneOffJob.create_new())
        topic_jobs_one_off.TopicMigrationOneOffJob.enqueue(job_id)
        with self.capture_logging(min_level=logging.ERROR) as captured_logs:
            self.process_and_flush_pending_mapreduce_tasks()

        self.assertEqual(len(captured_logs), 1)
        self.assertIn(
            'Topic topic_id failed validation: Invalid language code: '
            'invalid_language_code',
            captured_logs[0]
        )

        output = topic_jobs_one_off.TopicMigrationOneOffJob.get_output(job_id)
        expected = [[u'validation_error',
                     [u'Topic topic_id failed validation: '
                      'Invalid language code: invalid_language_code']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])


class PopulateTopicThumbnailSizeOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'
    TOPIC_ID = 'topic_id'

    def setUp(self):
        super(PopulateTopicThumbnailSizeOneOffJobTests, self).setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_job_with_existing_thumbnail_size_skips(self):
        """Tests that PopulateTopicThumbnailSizeOneOffJob job results in
        existing update success key when the thumbnail_size_in_bytes is to
        be updated.
        """
        self.save_new_topic(
            self.TOPIC_ID, self.albert_id, name='A name',
            abbreviated_name='abbrev', description='description')

        # Start migration job on sample topic.
        job_id = (
            topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.create_new()
        )
        topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.enqueue(job_id)

        # This running without errors indicates the topic
        # thumbnail_size_in_bytes is updated resulting in existing update
        # success key.
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.get_output(
                job_id))
        expected = [[u'thumbnail_size_already_exists', 1]]

        self.assertEqual(expected, [ast.literal_eval(x) for x in output])
        topic_services.delete_topic(self.albert_id, self.TOPIC_ID)

    def test_job_with_thumbnail_not_in_filesystem_logs_error(self):
        """Tests that PopulateTopicThumbnailSizeOneOffJob job results error
        key if the thumbnail_filename does not exist in the filesystem and
        thumbnail_filename does not exist in the filesystem.
        """
        self.save_new_topic(
            self.TOPIC_ID, self.albert_id, name='A name',
            abbreviated_name='abbrev', description='description',
            thumbnail_filename='dummy.svg',
            thumbnail_size_in_bytes=None)

        # Start job on sample topic.
        job_id = (
            topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.create_new()
        )
        topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.enqueue(job_id)

        # This running without errors indicates the topic thumbnail_filename
        # not present in filesystem is resulting in error key.
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.get_output(
                job_id))
        expected = [[u'thumbnail_size_update_error',
                     [u'Thumbnail dummy.svg for topic topic_id not found on'
                      u' the filesystem']]]

        self.assertEqual(expected, [ast.literal_eval(x) for x in output])
        topic_services.delete_topic(self.albert_id, self.TOPIC_ID)

    def test_job_with_topic_deleted_skips(self):
        """Tests that PopulateThumbnailSizeOneOffJob skips deleted topics."""
        self.save_new_topic(self.TOPIC_ID, self.albert_id)
        topic_services.delete_topic(self.albert_id, self.TOPIC_ID)

        # Start migration job on sample topic.
        job_id = (
            topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.create_new()
        )
        topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.enqueue(job_id)

        # This running without errors indicates that deleted topics are
        # skipped.
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.get_output(
                job_id))
        expected = [[u'topic_deleted', 1]]

        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_job_with_thumbnail_in_filesystem_logs_success(self):
        self.save_new_topic(
            self.TOPIC_ID, self.albert_id, name='A name',
            abbreviated_name='abbrev', description='description',
            thumbnail_size_in_bytes=None)

        # Save the dummy image to the filesystem to be used as thumbnail.
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_TOPIC, self.TOPIC_ID))
        fs.commit(
            '%s/topic.svg' % (constants.ASSET_TYPE_THUMBNAIL), raw_image,
            mimetype='image/svg+xml')

        # Start migration job on sample topic.
        job_id = (
            topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.create_new()
        )
        topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.enqueue(job_id)

        # This running without errors indicates that deleted topics are
        # skipped.
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            topic_jobs_one_off.PopulateTopicThumbnailSizeOneOffJob.get_output(
                job_id))
        expected = [[u'thumbnail_size_newly_added', 1]]

        self.assertEqual(expected, [ast.literal_eval(x) for x in output])
        topic_services.delete_topic(self.albert_id, self.TOPIC_ID)
