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
            self.TOPIC_ID, name='A name', abbreviated_name='abbrev')
        topic.add_subtopic(1, title='A subtitle')
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
        self.assertEqual(topic.subtopics[0].to_dict(),
                         updated_topic.subtopics[0].to_dict())

        output = topic_jobs_one_off.TopicMigrationOneOffJob.get_output(job_id)
        expected = [[u'topic_migrated',
                     [u'1 topics successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_skips_deleted_topic(self):
        """Tests that the topic migration job skips deleted topic
        and does not attempt to migrate.
        """
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, name='A name', abbreviated_name='abbrev')
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

        output = topic_jobs_one_off.TopicMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
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
            'a name', '', [], [], [], 2)
        topic = (
            topic_fetchers.get_topic_by_id(self.TOPIC_ID))
        self.assertEqual(topic.subtopic_schema_version, 1)

        # Start migration job.
        job_id = (
            topic_jobs_one_off.TopicMigrationOneOffJob.create_new())
        topic_jobs_one_off.TopicMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the topic migrates correctly.
        updated_topic = (
            topic_fetchers.get_topic_by_id(self.TOPIC_ID))
        self.assertEqual(
            updated_topic.subtopic_schema_version,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION)

        output = topic_jobs_one_off.TopicMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
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
            'a name', '', [], [], [], 2, language_code='invalid_language_code')

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
