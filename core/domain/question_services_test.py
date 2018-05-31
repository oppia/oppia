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
            'dummy', self._create_valid_question_data('ABC'), 1, 'en')

        question_id = question_services.add_question(self.owner_id, question)
        question = question_services.get_question_by_id(question_id)

        self.assertEqual(question.question_id, question_id)

    def test_get_questions_by_ids(self):
        question = question_domain.Question(
            'dummy', self._create_valid_question_data('ABC'), 1, 'en')

        question1_id = question_services.add_question(
            self.owner_id, question)
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
        question_data = self._create_valid_question_data('ABC')
        question_id = 'dummy'
        question_data_schema_version = 1
        language_code = 'en'
        question = question_domain.Question(
            question_id, question_data, question_data_schema_version,
            language_code)

        question_id = question_services.add_question(self.owner_id, question)
        model = question_models.QuestionModel.get(question_id)

        self.assertEqual(model.question_data, question_data)
        self.assertEqual(
            model.question_data_schema_version,
            question_data_schema_version)
        self.assertEqual(model.language_code, language_code)

    def test_delete_question(self):
        question = question_domain.Question(
            'dummy', self._create_valid_question_data('ABC'), 1, 'en')

        question_id = question_services.add_question(self.owner_id, question)
        question_services.delete_question(
            self.owner_id, question_id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionModel with id %s not found' % (
                question_id))):
            question_models.QuestionModel.get(question_id)

    def test_update_question(self):
        question_data = self._create_valid_question_data('ABC')
        question_id = 'dummy'
        question_data_schema_version = 1
        language_code = 'en'
        question = question_domain.Question(
            question_id, question_data, question_data_schema_version,
            language_code)

        new_question_data = self._create_valid_question_data('DEF')
        question_id = question_services.add_question(self.owner_id, question)
        change_dict = {'cmd': 'update_question_property',
                       'property_name': 'question_data',
                       'new_value': new_question_data,
                       'old_value': question_data}
        change_list = [question_domain.QuestionChange(change_dict)]

        question_services.update_question(
            self.owner_id, question_id, change_list, (
                'updated question data'))

        model = question_models.QuestionModel.get(question_id)
        self.assertEqual(model.question_data, new_question_data)
        self.assertEqual(
            model.question_data_schema_version, question_data_schema_version)
        self.assertEqual(model.language_code, language_code)
