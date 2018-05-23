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

from core.domain import exp_domain
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

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_get_question_by_id(self):
        question = question_domain.Question(
            'dummy', 'A Question',
            exp_domain.State.create_default_state('ABC').to_dict(), 1, 'en')

        question_id = question_services.add_question(self.owner_id, question)
        question = question_services.get_question_by_id(question_id)

        self.assertEqual(question.title, 'A Question')

    def test_get_questions_by_ids(self):
        question = question_domain.Question(
            'dummy', 'A Question',
            exp_domain.State.create_default_state('ABC').to_dict(), 1, 'en')

        question1_id = question_services.add_question(
            self.owner_id, question)
        question = question_domain.Question(
            'dummy2', 'A Question2',
            exp_domain.State.create_default_state('ABC').to_dict(), 1, 'en')

        question2_id = question_services.add_question(
            self.owner_id, question)
        questions = question_services.get_questions_by_ids(
            [question1_id, question2_id])
        self.assertEqual(len(questions), 2)
        self.assertEqual(questions[0].title, 'A Question')
        self.assertEqual(questions[1].title, 'A Question2')

    def test_add_question(self):
        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()
        question_id = 'dummy'
        title = 'A Question'
        question_data_schema_version = 1
        language_code = 'en'
        question = question_domain.Question(
            question_id, title, question_data, question_data_schema_version,
            language_code)

        question_id = question_services.add_question(self.owner_id, question)
        model = question_models.QuestionModel.get(question_id)

        self.assertEqual(model.title, title)
        self.assertEqual(model.question_data, question_data)
        self.assertEqual(
            model.question_data_schema_version,
            question_data_schema_version)
        self.assertEqual(model.language_code, language_code)

    def test_delete_question(self):
        question = question_domain.Question(
            'dummy', 'A Question',
            exp_domain.State.create_default_state('ABC').to_dict(),
            1, 'en')

        question_id = question_services.add_question(self.owner_id, question)
        question_services.delete_question(
            self.owner_id, question_id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionModel with id %s not found' % (
                question_id))):
            question_models.QuestionModel.get(question_id)

    def test_update_question(self):
        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()
        question_id = 'dummy'
        title = 'A Question'
        question_data_schema_version = 1
        language_code = 'en'
        question = question_domain.Question(
            question_id, title, question_data, question_data_schema_version,
            language_code)

        question_id = question_services.add_question(self.owner_id, question)
        change_dict = {'cmd': 'update_question_property',
                       'property_name': 'title',
                       'new_value': 'ABC',
                       'old_value': 'A Question'}
        change_list = [question_domain.QuestionChange(change_dict)]

        question_services.update_question(
            self.owner_id, question_id, change_list, (
                'updated title'))

        model = question_models.QuestionModel.get(question_id)
        self.assertEqual(model.title, 'ABC')
        self.assertEqual(model.question_data, question_data)
        self.assertEqual(
            model.question_data_schema_version,
            question_data_schema_version)
        self.assertEqual(model.language_code, language_code)
