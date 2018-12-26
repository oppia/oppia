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
import ast

from constants import constants
from core.domain import question_jobs_one_off
from core.domain import question_services
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
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.process_and_flush_pending_tasks()

        self.question = self.save_new_question(
            self.QUESTION_ID, self.albert_id,
            self._create_valid_question_data('ABC'))


    def test_migration_job_does_not_convert_up_to_date_question(self):
        """Tests that the question migration job does not convert a
        question that is already the latest schema version.
        """
        # Create a new question that should not be affected by the
        # job.
        question = (
            question_services.get_question_by_id(self.QUESTION_ID))
        self.assertEqual(
            question.question_state_schema_version,
            feconf.CURRENT_STATES_SCHEMA_VERSION)

        # Start migration job.
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            job_id = (
                question_jobs_one_off.QuestionMigrationOneOffJob.create_new())
            question_jobs_one_off.QuestionMigrationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

        # Verify the question is exactly the same after migration.
        updated_question = (
            question_services.get_question_by_id(self.QUESTION_ID))
        self.assertEqual(
            updated_question.question_state_schema_version,
            feconf.CURRENT_STATES_SCHEMA_VERSION)
        self.assertEqual(question.question_state_data.to_dict(),
                         updated_question.question_state_data.to_dict())

        output = question_jobs_one_off.QuestionMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
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
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            job_id = (
                question_jobs_one_off.QuestionMigrationOneOffJob.create_new())
            question_jobs_one_off.QuestionMigrationOneOffJob.enqueue(job_id)

            # This running without errors indicates the deleted question is
            # being ignored.
            self.process_and_flush_pending_tasks()

        # Ensure the question is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            question_services.get_question_by_id(self.QUESTION_ID)

        output = question_jobs_one_off.QuestionMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
        expected = [[u'question_deleted',
                     [u'Encountered 1 deleted questions.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_converts_old_question(self):
        """Tests that the schema conversion functions work
        correctly and an old question is converted to new
        version.
        """
        # Generate question with old(v25) state data.
        self.save_new_question_with_state_data_schema_v25(
            self.QUESTION_ID, self.albert_id)
        question = (
            question_services.get_question_by_id(self.QUESTION_ID))
        self.assertEqual(question.question_state_schema_version, 25)

        # Start migration job.
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            job_id = (
                question_jobs_one_off.QuestionMigrationOneOffJob.create_new())
            question_jobs_one_off.QuestionMigrationOneOffJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

        # Verify the question migrates correctly.
        updated_question = (
            question_services.get_question_by_id(self.QUESTION_ID))
        self.assertEqual(
            updated_question.question_state_schema_version,
            feconf.CURRENT_STATES_SCHEMA_VERSION)

        output = question_jobs_one_off.QuestionMigrationOneOffJob.get_output(job_id) # pylint: disable=line-too-long
        expected = [[u'question_migrated',
                     [u'1 questions successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])
