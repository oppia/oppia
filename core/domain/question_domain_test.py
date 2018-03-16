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
import utils


class QuestionDomainTest(test_utils.GenericTestBase):
    """Tests for Question domain object."""

    def test_to_dict(self):
        expected_object = {
            'question_id': 'col1.random',
            'title': 'abc',
            'question_data': {},
            'question_data_schema_version': 1,
            'collection_id': 'col1',
            'language_code': 'en'
        }

        observed_object = question_domain.Question(
            expected_object['question_id'], expected_object['title'],
            expected_object['question_data'],
            expected_object['question_data_schema_version'],
            expected_object['collection_id'], expected_object['language_code'])
        self.assertDictEqual(expected_object, observed_object.to_dict())

    def test_validation(self):
        """Test to verify validate method of Question domain object."""

        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()

        test_object = {
            'question_id': 'col1.random',
            'title': 'abc',
            'question_data': question_data,
            'question_data_schema_version': 1,
            'collection_id': 'col1',
            'language_code': 'en'
        }

        question = question_domain.Question(
            test_object['question_id'], test_object['title'],
            test_object['question_data'],
            test_object['question_data_schema_version'],
            test_object['collection_id'], test_object['language_code'])

        question.question_id = 123
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected ID to be a string')):
            question.validate()

        question.question_id = 'col1.random'
        question.update_title(1)
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected title to be a string')):
            question.validate()

        question.update_title('ABC')
        question.update_question_data([])
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected question_data to be a dict')):
            question.validate()

        question.update_question_data(question_data)
        question.question_data_schema_version = 'abc'
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected question_data_schema_version to be a integer')):
            question.validate()

        question.question_data_schema_version = 1
        question.collection_id = 123
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected collection_id to be a string')):
            question.validate()

        question.collection_id = 'col1'
        question.language_code = 123
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected language_code to be a string')):
            question.validate()

        question.update_language_code('abc')
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Invalid language code')):
            question.validate()

    def test_from_dict(self):
        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()

        expected_object = {
            'question_id': 'col1.random',
            'title': 'abc',
            'question_data': question_data,
            'question_data_schema_version': 1,
            'collection_id': 'col1',
            'language_code': 'en'
        }

        question = question_domain.Question.from_dict(expected_object)
        self.assertDictEqual(expected_object, question.to_dict())

    def test_create_default_question(self):
        """Test to verify create_default_question method of the Question domain
        object.
        """

        question_id = 'col1.random'
        collection_id = 'col1'
        title = ''
        language_code = 'en'
        question = question_domain.Question.create_default_question(
            question_id, collection_id, title, language_code)

        self.assertEqual(question.question_id, question_id)
        self.assertEqual(question.collection_id, collection_id)
        self.assertEqual(question.question_data_schema_version, 1)
        self.assertEqual(question.question_data, {})
        self.assertEqual(question.title, '')
        self.assertEqual(question.language_code, 'en')

    def test_update_methods(self):
        """Tests update_title, update_question_data and update_language_code
        methods of the question domain object.
        """
        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()

        test_object = {
            'question_id': 'col1.random',
            'title': 'abc',
            'question_data': question_data,
            'question_data_schema_version': 1,
            'collection_id': 'col1',
            'language_code': 'en'
        }

        question = question_domain.Question.from_dict(test_object)
        question.update_title('hello')
        self.assertEqual(question.title, 'hello')

        question.update_question_data({})
        self.assertEqual(question.question_data, {})

        question.update_language_code('es')
        self.assertEqual(question.language_code, 'es')


class QuestionSummaryDomainTest(test_utils.GenericTestBase):
    """Test for Question Summary Domain object."""

    def test_to_dict(self):
        expected_object_dict = {
            'question_id': 'col1.abc',
            'question_title': 'hello',
            'skills': ['skill1', 'skill2']
        }
        observed_object = question_domain.QuestionSummary(
            'col1.abc', 'hello', ['skill1', 'skill2'])
        self.assertEqual(expected_object_dict, observed_object.to_dict())
