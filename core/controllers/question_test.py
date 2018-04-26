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

"""Tests for the Question controller."""

import json

from core.domain import exp_domain
from core.domain import question_domain
from core.domain import question_services
from core.platform import models
from core.tests import test_utils
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])


class QuestionsHandlersTest(test_utils.GenericTestBase):
    """Tests put and delete methods of questions handler, get method of
    questions batch handler, post method question creation handler and get
    method of question manager handler.
    """

    def setUp(self):
        super(QuestionsHandlersTest, self).setUp()

        self.exp_id = 'exp_1'
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.random_email = 'abc@example.com'
        self.signup(self.random_email, 'abc')
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.set_moderators([self.NEW_USER_USERNAME])

        self.question = question_domain.Question(
            'dummy', 'A Question',
            exp_domain.State.create_default_state(
                'ABC', is_question=True).to_dict(),
            1, 'en')

    def test_delete(self):
        question_id = question_services.add_question(
            self.new_user_id, self.question)
        self.login(self.NEW_USER_EMAIL)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
        response = self.testapp.delete(
            '%s/%s' % (
                feconf.QUESTION_DATA_URL, question_id),
            csrf_token, expect_errors=False)
        self.assertEqual(response.status_int, 200)

        response = self.testapp.delete(
            feconf.QUESTION_DATA_URL, csrf_token, expect_errors=True)
        self.assertEqual(response.status_int, 404)

        response = self.testapp.delete(
            '%s/' % feconf.QUESTION_DATA_URL, csrf_token, expect_errors=True)
        self.assertEqual(response.status_int, 404)

        self.logout()
        self.login(self.random_email)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
        response = self.testapp.delete(
            '%s/%s' % (
                feconf.QUESTION_DATA_URL, question_id),
            csrf_token, expect_errors=True)
        self.assertEqual(response.status_int, 401)

    def test_post(self):
        payload = {}
        payload['question'] = self.question.to_dict()
        self.login(self.NEW_USER_EMAIL)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
        response_json = self.post_json(
            feconf.QUESTION_CREATION_URL, payload, csrf_token,
            expect_errors=False)
        self.assertIn('question_id', response_json.keys())

        del payload['question']
        self.post_json(
            feconf.QUESTION_CREATION_URL, payload, csrf_token,
            expect_errors=True, expected_status_int=404)

        self.logout()
        self.login(self.random_email)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json(
            feconf.QUESTION_CREATION_URL, payload, csrf_token,
            expect_errors=True, expected_status_int=401)

    def test_put(self):
        question_id = question_services.add_question(
            self.new_user_id, self.question)

        payload = {}
        change_list = [{'cmd': 'update_question_property',
                        'property_name': 'title',
                        'new_value': 'ABC',
                        'old_value': 'A Question'}]
        payload['change_list'] = json.dumps(change_list)
        payload['commit_message'] = 'update title'
        self.login(self.NEW_USER_EMAIL)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
        response_json = self.put_json(
            '%s/%s' % (
                feconf.QUESTION_DATA_URL, question_id),
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

        payload['commit_message'] = 'update title'
        self.put_json(feconf.QUESTION_DATA_URL, payload, csrf_token,
                      expect_errors=True, expected_status_int=404)

        self.logout()
        self.login(self.random_email)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_DATA_URL, question_id),
            payload, csrf_token, expect_errors=True,
            expected_status_int=401)

    def test_integration(self):
        """Tests to create, update and delete questions.
        """
        payload = {}
        payload['question'] = self.question.to_dict()
        self.login(self.NEW_USER_EMAIL)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
        response_json = self.post_json(
            feconf.QUESTION_CREATION_URL, payload, csrf_token,
            expect_errors=False)
        self.assertIn('question_id', response_json.keys())

        another_question = question_domain.Question(
            'dummy', 'Question 2',
            exp_domain.State.create_default_state(
                'ABC', is_question=True).to_dict(),
            1, 'en')
        payload['question'] = another_question.to_dict()
        response_json = self.post_json(
            feconf.QUESTION_CREATION_URL, payload, csrf_token,
            expect_errors=False)
        self.assertIn('question_id', response_json.keys())
        another_question_id = response_json['question_id']

        response = self.testapp.delete(
            '%s/%s' % (
                feconf.QUESTION_DATA_URL,
                str(another_question_id)), csrf_token,
            expect_errors=False)
        self.assertEqual(response.status_int, 200)
