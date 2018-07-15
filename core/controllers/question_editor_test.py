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

"""Tests for the Question Editor controller."""

import json

from core.domain import question_domain
from core.domain import question_services
from core.platform import models
from core.tests import test_utils
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])


class EditableQuestionDataHandlerTest(test_utils.GenericTestBase):
    """Tests put and delete methods of editable questions data handler, get
    method of questions batch handler, post method question creation handler
    and get method of question manager handler.
    """

    def setUp(self):
        super(EditableQuestionDataHandlerTest, self).setUp()

        self.question_id = 'dummy'
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.question = question_domain.Question(
            self.question_id,
            self._create_valid_question_data('ABC'),
            1, 'en', 'private')

    def test_get(self):
        question_services.add_question(self.admin_id, self.question)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.ADMIN_EMAIL)
            response_dict = self.get_json('%s/%s' % (
                feconf.QUESTION_DATA_URL, self.question_id))
            self.assertEqual(response_dict['username'], 'adm')
            self.assertEqual(response_dict['status'], 'private')
            self.assertEqual(response_dict['question_data_schema_version'], 1)
            self.assertEqual(response_dict['additional_angular_modules'], [])
            self.assertEqual(response_dict['id'], self.question_id)
            self.assertEqual(response_dict['user_email'], self.ADMIN_EMAIL)
            self.assertEqual(response_dict['language_code'], 'en')

            self.logout()

    def test_delete(self):
        question_services.add_question(self.admin_id, self.question)
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get('%s/%s' % (
                feconf.QUESTION_DATA_URL, self.question_id))
            response = self.testapp.delete(
                '%s/%s' % (
                    feconf.QUESTION_DATA_URL, self.question_id))
            self.assertEqual(response.status_int, 200)
            self.logout()

    def test_put(self):
        question_id = question_services.add_question(
            self.admin_id, self.question)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            payload = {}
            new_question_data = self._create_valid_question_data('DEF')
            change_list = [{'cmd': 'update_question_property',
                            'property_name': 'question_data',
                            'new_value': new_question_data,
                            'old_value': self.question.question_data}]
            payload['change_list'] = json.dumps(change_list)
            payload['commit_message'] = 'update question data'
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get('/preferences')
            csrf_token = self.get_csrf_token_from_response(response)
            response_json = self.put_json(
                '%s/%s' % (
                    feconf.QUESTION_DATA_URL, self.question_id),
                payload, csrf_token, expect_errors=False)
            self.assertIn('question_id', response_json.keys())

            del payload['change_list']
            self.put_json(
                '%s/%s' % (
                    feconf.QUESTION_DATA_URL,
                    question_id), payload, csrf_token, expect_errors=True,
                expected_status_int=404)

            del payload['commit_message']
            payload['change_list'] = json.dumps(change_list)
            self.put_json(
                '%s/%s' % (
                    feconf.QUESTION_DATA_URL,
                    question_id), payload, csrf_token, expect_errors=True,
                expected_status_int=404)

            payload['commit_message'] = 'update question data'
            self.put_json(
                feconf.QUESTION_DATA_URL, payload, csrf_token,
                expect_errors=True, expected_status_int=404)

            self.logout()


class QuestionEditorPageTest(test_utils.GenericTestBase):
    """Tests get methods of questions editor page."""

    def setUp(self):
        super(QuestionEditorPageTest, self).setUp()

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.question = question_domain.Question(
            'dummy',
            self._create_valid_question_data('ABC'),
            1, 'en', 'private')

    def test_get(self):
        question_id = question_services.add_question(
            self.admin_id, self.question)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get('/question_editor/%s' % question_id)
            self.assertEqual(response.status_int, 200)
            self.assertIn('', response.body)

            self.logout()
