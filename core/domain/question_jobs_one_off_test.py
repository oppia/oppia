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

"""Tests for Question-related one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core.domain import question_domain
from core.domain import question_jobs_one_off
from core.domain import question_services
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])


class QuestionMigrationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    QUESTION_ID = 'question_id'

    def setUp(self):
        super(QuestionMigrationOneOffJobTests, self).setUp()

        # Setup user who will own the test questions.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()
        self.skill_id = 'skill_id'
        self.save_new_skill(
            self.skill_id, self.albert_id, description='Skill Description')

        self.question = self.save_new_question(
            self.QUESTION_ID, self.albert_id,
            self._create_valid_question_data('ABC'), [self.skill_id])

    def test_migration_job_does_not_convert_up_to_date_question(self):
        """Tests that the question migration job does not convert a
        question that is already the latest schema version.
        """
        # Create a new question that should not be affected by the
        # job.
        question = (
            question_services.get_question_by_id(self.QUESTION_ID))
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Start migration job.
        job_id = (
            question_jobs_one_off.QuestionMigrationOneOffJob.create_new())
        question_jobs_one_off.QuestionMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        # Verify the question is exactly the same after migration.
        updated_question = (
            question_services.get_question_by_id(self.QUESTION_ID))
        self.assertEqual(
            updated_question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        self.assertEqual(
            question.question_state_data.to_dict(),
            updated_question.question_state_data.to_dict())

        output = (
            question_jobs_one_off.QuestionMigrationOneOffJob.get_output(job_id))
        expected = [[u'question_migrated',
                     [u'1 questions successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_skips_deleted_question(self):
        """Tests that the question migration job skips deleted question
        and does not attempt to migrate.
        """
        # Delete the question before migration occurs.
        question_services.delete_question(
            self.albert_id, self.QUESTION_ID)

        # Ensure the question is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            question_services.get_question_by_id(self.QUESTION_ID)

        # Start migration job on sample question.
        job_id = (
            question_jobs_one_off.QuestionMigrationOneOffJob.create_new())
        question_jobs_one_off.QuestionMigrationOneOffJob.enqueue(job_id)

        # This running without errors indicates the deleted question is
        # being ignored.
        self.process_and_flush_pending_mapreduce_tasks()

        # Ensure the question is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            question_services.get_question_by_id(self.QUESTION_ID)

        output = (
            question_jobs_one_off.QuestionMigrationOneOffJob.get_output(job_id))
        expected = [[u'question_deleted',
                     [u'Encountered 1 deleted questions.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_converts_old_question(self):
        """Tests that the schema conversion functions work
        correctly and an old question is converted to new
        version.
        """
        # Generate question with old(v27) state data.
        self.save_new_question_with_state_data_schema_v27(
            self.QUESTION_ID, self.albert_id, [self.skill_id])
        question = (
            question_services.get_question_by_id(self.QUESTION_ID))
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Start migration job.
        job_id = (
            question_jobs_one_off.QuestionMigrationOneOffJob.create_new())
        question_jobs_one_off.QuestionMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        # Verify the question migrates correctly.
        updated_question = (
            question_services.get_question_by_id(self.QUESTION_ID))
        self.assertEqual(
            updated_question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        output = (
            question_jobs_one_off.QuestionMigrationOneOffJob.get_output(job_id))
        expected = [[u'question_migrated',
                     [u'1 questions successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_fails_with_invalid_question(self):
        question_services.delete_question(
            self.albert_id, self.QUESTION_ID, force_deletion=True)
        state = self._create_valid_question_data('ABC')
        question_state_data = state.to_dict()
        language_code = 'en'
        version = 1
        question_model = question_models.QuestionModel.create(
            question_state_data, language_code, version, [], [])
        question_model.question_state_data_schema_version = (
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        question_model.commit(self.albert_id, 'invalid question created', [])
        question_id = question_model.id

        # Start migration job.
        job_id = (
            question_jobs_one_off.QuestionMigrationOneOffJob.create_new())
        question_jobs_one_off.QuestionMigrationOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            question_jobs_one_off.QuestionMigrationOneOffJob.get_output(job_id))
        expected = [[u'validation_error',
                     [u'Question %s failed validation: linked_skill_ids is '
                      'either null or an empty list' % question_id]]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])


class QuestionSnapshotsMigrationJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    QUESTION_ID = 'question_id'

    def setUp(self):
        super(QuestionSnapshotsMigrationJobTests, self).setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()
        self.skill_id = 'skill_id'
        self.save_new_skill(
            self.skill_id, self.albert_id, description='Skill Description')
        self.process_and_flush_pending_mapreduce_tasks()

    def test_migration_job_does_not_convert_up_to_date_question(self):
        """Tests that the question migration job does not convert a
        snapshot that is already the latest states schema version.
        """
        # Create a new, default question that should not be affected by the
        # job.
        self.save_new_question(
            self.QUESTION_ID, self.albert_id,
            self._create_valid_question_data('ABC'), [self.skill_id])
        question = (
            question_services.get_question_by_id(self.QUESTION_ID))
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Start migration job.
        job_id = (
            question_jobs_one_off.QuestionSnapshotsMigrationJob.create_new())
        question_jobs_one_off.QuestionSnapshotsMigrationJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            question_jobs_one_off.QuestionSnapshotsMigrationJob.get_output(
                job_id))
        expected_output = [
            '[u\'SUCCESS - Snapshot is already at latest schema version\', 1]']
        self.assertEqual(actual_output, expected_output)

    def test_migration_job_skips_deleted_question(self):
        """Tests that the question migration job skips deleted questions
        and does not attempt to migrate.
        """
        self.save_new_question(
            self.QUESTION_ID, self.albert_id,
            self._create_valid_question_data('ABC'), [self.skill_id])

        # Delete the question before migration occurs.
        question_services.delete_question(self.albert_id, self.QUESTION_ID)

        # Ensure the question is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            question_services.get_question_by_id(self.QUESTION_ID)

        # Start migration job on sample question.
        job_id = (
            question_jobs_one_off.QuestionSnapshotsMigrationJob.create_new())
        question_jobs_one_off.QuestionSnapshotsMigrationJob.enqueue(job_id)

        # This running without errors indicates the deleted question is
        # being ignored.
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            question_jobs_one_off.QuestionSnapshotsMigrationJob.get_output(
                job_id))
        expected_output_choices = [
            '[u\'INFO - Question does not exist\', [u\'%s-1\', u\'%s-2\']]' %
            (self.QUESTION_ID, self.QUESTION_ID),
            '[u\'INFO - Exploration does not exist\', [u\'%s-2\', u\'%s-1\']]' %
            (self.QUESTION_ID, self.QUESTION_ID)
        ]
        self.assertEqual(len(actual_output), 1)
        self.assertIn(actual_output[0], expected_output_choices)

    def test_migration_job_detects_invalid_question(self):
        self.save_new_question(
            self.QUESTION_ID, self.albert_id,
            self._create_valid_question_data('ABC'), [self.skill_id])

        # This question is now made invalid by having no linked skill IDs.
        question_model = question_models.QuestionModel.get(self.QUESTION_ID)
        question_model.linked_skill_ids = []
        question_model.commit(self.albert_id, 'invalid question created', [])

        # Start the audit job.
        job_id = (
            question_jobs_one_off.QuestionSnapshotsMigrationJob.
            create_new())
        question_jobs_one_off.QuestionSnapshotsMigrationJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            question_jobs_one_off.QuestionSnapshotsMigrationJob.get_output(
                job_id))
        expected_output_message = (
            '[u\'INFO - Question %s-1 failed validation\', '
            '[u\'linked_skill_ids is either null or an empty list\']]'
            % self.QUESTION_ID)
        self.assertIn(expected_output_message, actual_output)

    def test_migration_job_detects_question_that_is_not_up_to_date(self):
        swap_states_schema_version_37 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 37)
        with swap_states_schema_version_37:
            question = self.save_new_question(
                self.QUESTION_ID, self.albert_id,
                self._create_valid_question_data('ABC'), [self.skill_id])
        self.assertLess(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        swap_states_schema_version_38 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 38)
        with swap_states_schema_version_38:
            job_id = (
                question_jobs_one_off.QuestionSnapshotsMigrationJob.
                create_new())
            question_jobs_one_off.QuestionSnapshotsMigrationJob.enqueue(
                job_id)
            self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            question_jobs_one_off.QuestionSnapshotsMigrationJob.get_output(
                job_id))
        expected_output = [
            '[u\'FAILURE - Question is not at latest schema version\', '
            '[u\'%s\']]' % self.QUESTION_ID,
        ]
        self.assertEqual(sorted(actual_output), sorted(expected_output))

    def test_migration_job_succeeds_on_default_question(self):
        swap_states_schema_version_37 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 37)
        with swap_states_schema_version_37:
            self.save_new_question(
                self.QUESTION_ID, self.albert_id,
                self._create_valid_question_data('ABC'), [self.skill_id])

        # Bring the main question to schema version 38.
        migration_change_list = [
            question_domain.QuestionChange({
                'cmd': (
                    question_domain.CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION
                ),
                'from_version': '37',
                'to_version': '38'
            })
        ]
        swap_states_schema_version_38 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 38)
        with swap_states_schema_version_38:
            question_services.update_question(
                self.albert_id, self.QUESTION_ID, migration_change_list,
                'Ran Question Migration job.')

            job_id = (
                question_jobs_one_off.QuestionSnapshotsMigrationJob.
                create_new())
            question_jobs_one_off.QuestionSnapshotsMigrationJob.enqueue(
                job_id)
            self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            question_jobs_one_off.QuestionSnapshotsMigrationJob.get_output(
                job_id))
        expected_output = [
            '[u\'SUCCESS - Model saved\', 1]',
            '[u\'SUCCESS - Model upgraded\', 1]',
            '[u\'SUCCESS - Snapshot is already at latest schema version\', 1]']
        self.assertEqual(sorted(actual_output), sorted(expected_output))
