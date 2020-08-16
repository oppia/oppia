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

from core.domain import question_jobs_one_off
from core.domain import question_services
from core.domain import state_domain
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
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()
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
        self.process_and_flush_pending_tasks()

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
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

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


class QuestionsMathRteAuditOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    QUESTION_ID = 'question_id'

    def setUp(self):
        super(QuestionsMathRteAuditOneOffJobTests, self).setUp()

        # Setup user who will own the test questions.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_job_when_question_has_math_rich_text_components(self):
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
        question_data1 = self._create_valid_question_data('ABC')
        question_data1.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': valid_html_1
            }))
        self.save_new_question(
            'question_id1', self.albert_id,
            question_data1, ['skill_id1'])

        question_data2 = self._create_valid_question_data('ABC')
        question_data2.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': valid_html_2
            }))
        self.save_new_question(
            'question_id2', self.albert_id,
            question_data2, ['skill_id1'])

        job_id = (
            question_jobs_one_off.QuestionsMathRteAuditOneOffJob.create_new())
        question_jobs_one_off.QuestionsMathRteAuditOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.process_and_flush_pending_tasks()
        output = (
            question_jobs_one_off.QuestionsMathRteAuditOneOffJob.get_output(
                job_id))
        overall_result = ast.literal_eval(output[0])
        expected_overall_result = {
            'total_number_questions_requiring_svgs': 2,
            'total_number_of_latex_strings_without_svg': 2
        }

        self.assertEqual(overall_result[1], expected_overall_result)
        detailed_result = ast.literal_eval(output[1])
        expected_question1_info = {
            'question_id': 'question_id1',
            'latex_strings_without_svg': [
                '(x - a_1)(x - a_2)(x - a_3)...(x - a_n-1)(x - a_n)']
        }
        expected_question2_info = {
            'question_id': 'question_id2',
            'latex_strings_without_svg': ['+,+,+,+']
        }
        questions_latex_info = sorted(detailed_result[1])
        self.assertEqual(questions_latex_info[0], expected_question1_info)
        self.assertEqual(questions_latex_info[1], expected_question2_info)

    def test_job_when_questions_do_not_have_math_rich_text(self):

        question_data1 = self._create_valid_question_data('ABC')
        self.save_new_question(
            'question_id1', self.albert_id,
            question_data1, ['skill_id1'])

        job_id = (
            question_jobs_one_off.QuestionsMathRteAuditOneOffJob.create_new())
        question_jobs_one_off.QuestionsMathRteAuditOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.process_and_flush_pending_tasks()
        output = (
            question_jobs_one_off.QuestionsMathRteAuditOneOffJob.get_output(
                job_id))
        self.assertEqual(output, [])

    def test_job_when_question_has_math_rich_text_components_with_svg(self):
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
            'quot;svg_filename&amp;quot;: &amp;quot;file2.svg&amp;quot;}"'
            '></oppia-noninteractive-math>'
        )
        question_data1 = self._create_valid_question_data('ABC')
        question_data1.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': valid_html_1
            }))
        self.save_new_question(
            'question_id1', self.albert_id,
            question_data1, ['skill_id1'])

        question_data2 = self._create_valid_question_data('ABC')
        question_data2.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': valid_html_2
            }))
        self.save_new_question(
            'question_id2', self.albert_id,
            question_data2, ['skill_id1'])

        job_id = (
            question_jobs_one_off.QuestionsMathRteAuditOneOffJob.create_new())
        question_jobs_one_off.QuestionsMathRteAuditOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.process_and_flush_pending_tasks()
        output = (
            question_jobs_one_off.QuestionsMathRteAuditOneOffJob.get_output(
                job_id))
        overall_result = ast.literal_eval(output[0])
        expected_question1_info = {
            'question_id': 'question_id1',
            'latex_strings_with_svg': [
                '(x - a_1)(x - a_2)(x - a_3)...(x - a_n-1)(x - a_n)']
        }
        expected_question2_info = {
            'question_id': 'question_id2',
            'latex_strings_with_svg': ['+,+,+,+']
        }
        questions_latex_info = sorted(overall_result[1])
        self.assertEqual(questions_latex_info[0], expected_question1_info)
        self.assertEqual(questions_latex_info[1], expected_question2_info)

    def test_job_skips_deleted_questions(self):
        question_data1 = self._create_valid_question_data('ABC')
        self.save_new_question(
            'question_id1', self.albert_id,
            question_data1, ['skill_id1'])
        question_services.delete_question(
            self.albert_id, 'question_id1')
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            question_services.get_question_by_id('question_id1')

        job_id = (
            question_jobs_one_off.QuestionsMathRteAuditOneOffJob.create_new())
        question_jobs_one_off.QuestionsMathRteAuditOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.process_and_flush_pending_tasks()
        output = (
            question_jobs_one_off.QuestionsMathRteAuditOneOffJob.get_output(
                job_id))
        self.assertEqual(output, [])
