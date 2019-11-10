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
import datetime

from core.domain import question_jobs_one_off
from core.domain import question_services
from core.platform import models
from core.tests import test_utils
import feconf

taskqueue_services = models.Registry.import_taskqueue_services()
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
        self.skill_id = 'skill_id'
        self.save_new_skill(self.skill_id, self.albert_id, 'Skill Description')

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
        self.process_and_flush_pending_tasks()

        # Verify the question is exactly the same after migration.
        updated_question = (
            question_services.get_question_by_id(self.QUESTION_ID))
        self.assertEqual(
            updated_question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        self.assertEqual(question.question_state_data.to_dict(),
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
        self.process_and_flush_pending_tasks()

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
        self.assertEqual(question.question_state_data_schema_version, 30)

        # Start migration job.
        job_id = (
            question_jobs_one_off.QuestionMigrationOneOffJob.create_new())
        question_jobs_one_off.QuestionMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

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
            question_state_data, language_code, version, [])
        question_model.question_state_data_schema_version = (
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        question_model.commit(self.albert_id, 'invalid question created', [])
        question_id = question_model.id

        # Start migration job.
        job_id = (
            question_jobs_one_off.QuestionMigrationOneOffJob.create_new())
        question_jobs_one_off.QuestionMigrationOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.process_and_flush_pending_tasks()

        output = (
            question_jobs_one_off.QuestionMigrationOneOffJob.get_output(job_id))
        expected = [[u'validation_error',
                     [u'Question %s failed validation: linked_skill_ids is '
                      'either null or an empty list' % question_id]]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])


class QuestionSummaryModelIndexesOneOffJobTest(test_utils.GenericTestBase):
    """Tests for QuestionSummaryModel migration."""

    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        question_jobs_one_off.QuestionSummaryModelIndexesOneOffJob]

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            question_jobs_one_off.QuestionSummaryModelIndexesOneOffJob
            .create_new())
        question_jobs_one_off.QuestionSummaryModelIndexesOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            question_jobs_one_off.QuestionSummaryModelIndexesOneOffJob
            .get_output(job_id))

        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        output = [(eval_item[0], int(eval_item[1]))
                  for eval_item in eval_output]
        return output

    def _check_model_validity(
            self, instance_id, original_question_summary_model):
        """Checks if the model was migrated correctly."""
        migrated_question_summary_model = (
            question_models.QuestionSummaryModel.get_by_id(instance_id))
        self.assertEqual(
            migrated_question_summary_model.creator_id,
            original_question_summary_model.creator_id)
        self.assertEqual(
            migrated_question_summary_model.question_model_last_updated,
            original_question_summary_model.question_model_last_updated)
        self.assertEqual(
            migrated_question_summary_model.question_model_created_on,
            original_question_summary_model.question_model_created_on)
        self.assertEqual(
            migrated_question_summary_model.question_content,
            original_question_summary_model.question_content)

    def test_successful_migration(self):
        instance_id = 'id_1'
        question_summary_model = question_models.QuestionSummaryModel(
            id=instance_id,
            creator_id='user_id',
            question_model_last_updated=datetime.datetime.utcnow(),
            question_model_created_on=datetime.datetime.utcnow(),
            question_content='smth'
        )
        question_summary_model.put()

        output = self._run_one_off_job()

        self.assertEqual(output, [(u'SUCCESS', 1)])
        self._check_model_validity(instance_id, question_summary_model)

    def test_multiple_questions(self):
        instance_id_1 = 'id_1'
        question_summary_model_1 = question_models.QuestionSummaryModel(
            id=instance_id_1,
            creator_id='user_id_1',
            question_model_last_updated=datetime.datetime.utcnow(),
            question_model_created_on=datetime.datetime.utcnow(),
            question_content='smth1'
        )
        question_summary_model_1.put()

        instance_id_2 = 'id_2'
        question_summary_model_2 = question_models.QuestionSummaryModel(
            id=instance_id_2,
            creator_id='user_id_2',
            question_model_last_updated=datetime.datetime.utcnow(),
            question_model_created_on=datetime.datetime.utcnow(),
            question_content='smth2'
        )
        question_summary_model_2.put()

        output = self._run_one_off_job()

        self.assertEqual(output, [(u'SUCCESS', 2)])
        self._check_model_validity(instance_id_1, question_summary_model_1)
        self._check_model_validity(instance_id_2, question_summary_model_2)
