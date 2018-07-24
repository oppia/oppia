# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

from core.domain import question_domain
from core.tests import test_utils
import feconf
import utils


class QuestionDomainTest(test_utils.GenericTestBase):
    """Tests for Question domain object."""

    def setUp(self):
        """Before each individual test, create a question."""
        super(QuestionDomainTest, self).setUp()
        question_state_data = self._create_valid_question_data('ABC')
        self.question = question_domain.Question(
            'question_id', question_state_data,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION, 'en', 1)

    def test_to_and_from_dict(self):
        default_question_state_data = (
            question_domain.Question.create_default_question_state())
        question_dict = {
            'id': 'col1.random',
            'question_state_data': default_question_state_data.to_dict(),
            'question_state_schema_version': (
                feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION),
            'language_code': 'en',
            'version': 1
        }

        observed_object = question_domain.Question.from_dict(question_dict)
        self.assertEqual(question_dict, observed_object.to_dict())

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the skill passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.question.validate()

    def test_strict_validation(self):
        """Test to verify validate method of Question domain object with
        strict as True.
        """
        state = self.question.question_state_data
        state.interaction.solution = None
        self._assert_validation_error(
            'Expected the question to have a solution')
        state.interaction.hints = []
        self._assert_validation_error(
            'Expected the question to have at least one hint')
        state.interaction.default_outcome.dest = 'abc'
        self._assert_validation_error(
            'Expected all answer groups to have destination as None.')
        state.interaction.default_outcome.labelled_as_correct = False
        self._assert_validation_error(
            'Expected at least one answer group to have a correct answer')

    def test_not_strict_validation(self):
        """Test to verify validate method of Question domain object with
        strict as False.
        """
        self.question.language_code = 'abc'
        self._assert_validation_error('Invalid language code')

        self.question.question_state_data = 'State data'
        self._assert_validation_error(
            'Expected question state data to be a State object')

        self.question.question_state_schema_version = 'abc'
        self._assert_validation_error(
            'Expected schema version to be an integer')

        self.question.version = 'abc'
        self._assert_validation_error('Expected version to be an integer')

        self.question.language_code = 1
        self._assert_validation_error('Expected language_code to be a string')

        self.question.id = 123
        self._assert_validation_error('Expected ID to be a string')

    def test_create_default_question(self):
        """Test to verify create_default_question method of the Question domain
        object.
        """
        question_id = 'col1.random'
        question = question_domain.Question.create_default_question(
            question_id)
        default_question_data = (
            question_domain.Question.create_default_question_state().to_dict())

        self.assertEqual(question.id, question_id)
        self.assertEqual(
            question.question_state_data.to_dict(), default_question_data)
        self.assertEqual(question.language_code, 'en')
        self.assertEqual(question.version, 0)


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
