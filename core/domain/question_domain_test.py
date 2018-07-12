# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for question domain objects."""

from core.domain import exp_domain
from core.domain import question_domain
from core.tests import test_utils
import feconf
import utils


class QuestionDomainTest(test_utils.GenericTestBase):
    """Tests for Question domain object."""

    def test_to_dict(self):
        expected_object = {
            'id': 'col1.random',
            'question_state_data': {},
            'question_data_schema_version': 1,
            'language_code': 'en'
        }

        observed_object = question_domain.Question(
            expected_object['id'],
            expected_object['question_state_data'],
            expected_object['question_data_schema_version'],
            expected_object['language_code'])
        self.assertEqual(expected_object, observed_object.to_dict())

    def test_validation(self):
        """Test to verify validate method of Question domain object."""

        question_state_data = self._create_valid_question_data('ABC')

        test_object = {
            'id': 'col1.random',
            'question_state_data': question_state_data,
            'question_data_schema_version': 1,
            'language_code': 'en'
        }

        question = question_domain.Question(
            test_object['id'],
            test_object['question_state_data'],
            test_object['question_data_schema_version'],
            test_object['language_code'])

        question.id = 123
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected ID to be a string')):
            question.validate()

        question.id = 'col1.random'

        question.update_question_state_data(question_state_data)
        question.question_data_schema_version = 'abc'
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected question_data_schema_version to be a integer')):
            question.validate()

        question.question_data_schema_version = 1

        question.update_language_code('abc')
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Invalid language code')):
            question.validate()
        question.update_language_code('en')

    def test_from_dict(self):
        state = exp_domain.State.create_default_state('ABC')
        question_state_data = state.to_dict()

        expected_object = {
            'id': 'col1.random',
            'question_state_data': question_state_data,
            'question_data_schema_version': 1,
            'language_code': 'en'
        }

        question = question_domain.Question.from_dict(expected_object)
        self.assertDictEqual(expected_object, question.to_dict())

    def test_create_default_question(self):
        """Test to verify create_default_question method of the Question domain
        object.
        """

        question_id = 'col1.random'
        question = question_domain.Question.create_default_question(
            question_id)
        default_question_data = exp_domain.State.create_default_state(
            feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()

        self.assertEqual(question.id, question_id)
        self.assertEqual(question.question_data_schema_version, 1)
        self.assertEqual(
            question.question_state_data.to_dict(), default_question_data)
        self.assertEqual(question.language_code, 'en')

    def test_update_methods(self):
        """Tests update_question_data and update_language_code
        methods of the question domain object.
        """
        state = exp_domain.State.create_default_state('ABC')
        question_state_data = state.to_dict()

        test_object = {
            'id': 'col1.random',
            'question_state_data': question_state_data,
            'question_data_schema_version': 1,
            'language_code': 'en'
        }

        question = question_domain.Question.from_dict(test_object)

        question.update_question_state_data({})
        self.assertEqual(question.question_state_data, {})

        question.update_language_code('es')
        self.assertEqual(question.language_code, 'es')


class QuestionSummaryDomainTest(test_utils.GenericTestBase):
    """Test for Question Summary Domain object."""

    def test_to_dict(self):
        expected_object_dict = {
            'id': 'abc',
            'creator_id': 'creator_id',
            'last_updated': None,
            'created_on': None,
            'question_content': 'Question 1'
        }
        observed_object = question_domain.QuestionSummary(
            'creator_id', 'abc', 'Question 1')
        self.assertEqual(expected_object_dict, observed_object.to_dict())


class QuestionSkillLinkDomainTest(test_utils.GenericTestBase):
    """Test for Question Skill Link Domain object."""

    def test_to_dict(self):
        expected_object_dict = {
            'question_id': 'testquestion',
            'skill_id': 'testskill',
        }
        observed_object = question_domain.QuestionSkillLink(
            'testquestion', 'testskill')
        self.assertEqual(expected_object_dict, observed_object.to_dict())


class QuestionRightsDomainTest(test_utils.GenericTestBase):
    """Test for Question Rights Domain object."""

    def setUp(self):
        super(QuestionRightsDomainTest, self).setUp()
        self.question_id = 'question_id'
        self.signup('user@example.com', 'User')
        self.question = question_domain.Question.create_default_question(
            self.question_id)

        self.user_id = self.get_user_id_from_email('user@example.com')

    def test_to_dict(self):
        question_rights = question_domain.QuestionRights(
            self.question_id, self.user_id)
        expected_dict = {
            'question_id': self.question_id,
            'creator_id': self.user_id
        }

        self.assertEqual(expected_dict, question_rights.to_dict())

    def test_is_creator(self):
        question_rights = question_domain.QuestionRights(
            self.question_id, self.user_id)
        self.assertTrue(question_rights.is_creator(self.user_id))
        self.assertFalse(question_rights.is_creator('fakeuser'))
