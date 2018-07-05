# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

from core.domain import html_cleaner
from core.domain import question_domain
from core.domain import question_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(question_models,) = models.Registry.import_models([models.NAMES.question])
memcache_services = models.Registry.import_memcache_services()


class QuestionServicesUnitTest(test_utils.GenericTestBase):
    """Test the question services module."""

    def setUp(self):
        """Before each individual test, create dummy user."""
        super(QuestionServicesUnitTest, self).setUp()

        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([user_services.get_username(self.user_id_a)])

        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_b = user_services.UserActionsInfo(self.user_id_b)
        self.user_admin = user_services.UserActionsInfo(self.user_id_admin)

        self.question_data = self._create_valid_question_data('ABC')
        self.question_id = 'dummy'
        self.question_data_schema_version = 1
        self.language_code = 'en'
        self.status = 'private'
        self.question = question_domain.Question(
            self.question_id, self.question_data,
            self.question_data_schema_version, self.language_code)

    def test_get_question_by_id(self):
        question_id = question_services.add_question(
            self.owner_id, self.question)
        question = question_services.get_question_by_id(
            question_id, strict=False)

        self.assertEqual(question.question_id, question_id)

    def test_get_questions_by_ids(self):
        question1_id = question_services.add_question(
            self.owner_id, self.question)
        question = question_domain.Question(
            'dummy2', self._create_valid_question_data('ABC'), 1, 'en')

        question2_id = question_services.add_question(
            self.owner_id, question)
        questions = question_services.get_questions_by_ids(
            [question1_id, question2_id])
        self.assertEqual(len(questions), 2)
        self.assertEqual(questions[0].question_id, question1_id)
        self.assertEqual(questions[1].question_id, question2_id)

    def test_add_question(self):
        question_id = question_services.add_question(
            self.owner_id, self.question)
        model = question_models.QuestionModel.get(question_id)

        self.assertEqual(model.question_data, self.question_data)
        self.assertEqual(
            model.question_data_schema_version,
            self.question_data_schema_version)
        self.assertEqual(model.language_code, self.language_code)

    def test_delete_question(self):
        question_id = question_services.add_question(
            self.owner_id, self.question)
        question_services.delete_question(
            self.owner_id, question_id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionModel with id %s not found' % (
                question_id))):
            question_models.QuestionModel.get(question_id)

    def test_update_question(self):
        new_question_data = self._create_valid_question_data('DEF')
        question_id = question_services.add_question(
            self.owner_id, self.question)
        change_dict = {'cmd': 'update_question_property',
                       'property_name': 'question_data',
                       'new_value': new_question_data,
                       'old_value': self.question_data}
        change_list = [question_domain.QuestionChange(change_dict)]

        question_services.update_question(
            self.owner_id, question_id, change_list, (
                'updated question data'))

        model = question_models.QuestionModel.get(question_id)
        self.assertEqual(model.question_data, new_question_data)
        self.assertEqual(
            model.question_data_schema_version,
            self.question_data_schema_version)
        self.assertEqual(
            model.language_code, self.language_code)

    def test_compute_summary_of_question(self):
        question = self.question.to_dict()
        question_summary = question_services.compute_summary_of_question(
            question, self.owner_id, self.status)

        self.assertEqual(question_summary.id, 'dummy')
        self.assertEqual(
            question_summary.question_data,
            html_cleaner.clean(''))
        self.assertEqual(question_summary.language_code, 'en')
        self.assertEqual(question_summary.status, 'private')

    def test_get_question_summaries_by_creator_id(self):
        question_services.add_question(self.owner_id, self.question)
        question_summaries = (
            question_services.get_question_summaries_by_creator_id(
                self.owner_id))

        for question_summary in question_summaries:
            self.assertEqual(question_summary.id, 'dummy')
            self.assertEqual(
                question_summary.question_html_data, '')
            self.assertEqual(question_summary.language_code, 'en')
            self.assertEqual(question_summary.status, 'private')

    def test_admin_can_manage_question(self):
        question_id = question_services.add_question(
            self.owner_id, self.question)
        question_rights = question_services.get_question_rights(question_id)

        self.assertTrue(question_services.is_manager(
            self.user_admin, question_rights))

    def test_create_new_question_rights(self):
        question_id = question_services.add_question(
            self.owner_id, self.question)

        question_services.assign_role(
            self.user_admin, self.user_a,
            question_domain.ROLE_MANAGER, question_id)

        question_rights = question_services.get_question_rights(question_id)

        self.assertTrue(question_services.is_manager(
            self.user_a, question_rights))
        self.assertFalse(question_services.is_manager(
            self.user_b, question_rights))
