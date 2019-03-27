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
import datetime

from core.domain import question_domain
from core.domain import state_domain
from core.tests import test_utils
import feconf
import utils


class QuestionChangeTest(test_utils.GenericTestBase):
    """Test for Question Change object."""

    def test_to_dict(self):
        """Test to verify to_dict method of the Question Change object."""
        expected_object_dict = {
            'cmd': 'update_question_property',
            'property_name': 'question_state_data',
            'new_value': 'new_value',
            'old_value': 'old_value',
        }

        change_dict = {
            'cmd': 'update_question_property',
            'property_name': 'question_state_data',
            'new_value': 'new_value',
            'old_value': 'old_value',
        }
        observed_object = question_domain.QuestionChange(
            change_dict=change_dict,
        )

        self.assertEqual(expected_object_dict, observed_object.to_dict())

    def test_change_dict_without_cmd(self):
        """Test to verify __init__ method of the Question Change object
        when change_dict is without cmd key.
        """
        self.assertRaises(
            Exception,
            callableObj=question_domain.QuestionChange,
            change_dict={}
        )

    def test_change_dict_with_wrong_cmd(self):
        """Test to verify __init__ method of the Question Change object
        when change_dict is with wrong cmd value.
        """
        self.assertRaises(
            Exception,
            callableObj=question_domain.QuestionChange,
            change_dict={'cmd': 'wrong', }
        )

    def test_update_question_property_with_wrong_property_name(self):
        """Test to verify __init__ method of the Question Change object
        when cmd is update_question_property and wrong property_name is given.
        """
        self.assertRaises(
            Exception,
            callableObj=question_domain.QuestionChange,
            change_dict={
                'cmd': 'update_question_property',
                'property_name': 'wrong',
            }
        )

    def test_create_new_fully_specified_question(self):
        """Test to verify __init__ method of the Question Change object
        when cmd is create_new_fully_specified_question.
        """
        change_dict = {
            'cmd': 'create_new_fully_specified_question',
            'question_dict': {},
            'skill_id': '10',
        }
        observed_object = question_domain.QuestionChange(
            change_dict=change_dict,
        )

        self.assertEqual('10', observed_object.skill_id)
        self.assertEqual({}, observed_object.question_dict)

    def test_migrate_state_schema_to_latest_version(self):
        """Test to verify __init__ method of the Question Change object
        when cmd is migrate_state_schema_to_latest_version.
        """
        change_dict = {
            'cmd': 'migrate_state_schema_to_latest_version',
            'from_version': 0,
            'to_version': 10,
        }
        observed_object = question_domain.QuestionChange(
            change_dict=change_dict,
        )

        self.assertEqual(0, observed_object.from_version)
        self.assertEqual(10, observed_object.to_version)


class QuestionDomainTest(test_utils.GenericTestBase):
    """Tests for Question domain object."""

    def setUp(self):
        """Before each individual test, create a question."""
        super(QuestionDomainTest, self).setUp()
        question_state_data = self._create_valid_question_data('ABC')
        self.question = question_domain.Question(
            'question_id', question_state_data,
            feconf.CURRENT_STATES_SCHEMA_VERSION, 'en', 1)

    def test_to_and_from_dict(self):
        """Test to verify to_dict and from_dict methods
        of Question domain object.
        """
        default_question_state_data = (
            question_domain.Question.create_default_question_state())
        question_dict = {
            'id': 'col1.random',
            'question_state_data': default_question_state_data.to_dict(),
            'question_state_data_schema_version': (
                feconf.CURRENT_STATES_SCHEMA_VERSION),
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

    def test_strict_validation_for_answer_groups(self):
        """Test to verify validate method of Question domain object with
        strict as True for interaction with answer group.
        """
        state = self.question.question_state_data
        state.interaction.default_outcome.labelled_as_correct = False
        state.interaction.answer_groups = [
            state_domain.AnswerGroup.from_dict({
                'outcome': {
                    'dest': 'abc',
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Feedback'
                    },
                    'labelled_as_correct': True,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'rule_specs': [{
                    'inputs': {
                        'x': 'Test'
                    },
                    'rule_type': 'Contains'
                }],
                'training_data': [],
                'tagged_misconception_id': None
            })
        ]

        self._assert_validation_error(
            'Expected all answer groups to have destination as None.')

    def test_strict_validation_passes(self):
        """Test to verify validate method of a finalized Question domain object
        with correct input.
        """
        try:
            self.question.validate()
        except utils.ValidationError:
            self.fail(msg='validate() raised ValidationError unexpectedly!')

    def test_not_strict_validation(self):
        """Test to verify validate method of Question domain object with
        strict as False.
        """
        self.question.language_code = 'abc'
        self._assert_validation_error('Invalid language code')

        self.question.question_state_data = 'State data'
        self._assert_validation_error(
            'Expected question state data to be a State object')

        self.question.question_state_data_schema_version = 'abc'
        self._assert_validation_error(
            'Expected schema version to be an integer')

        self.question.language_code = 1
        self._assert_validation_error('Expected language_code to be a string')

        self.question.version = 'abc'
        self._assert_validation_error('Expected version to be an integer')

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

    def test_update_language_code(self):
        """Test to verify update_language_code method of the Question domain
        object.
        """
        self.question.update_language_code('pl')

        self.assertEqual('pl', self.question.language_code)

    def test_update_question_state_data(self):
        """Test to verify update_question_state_data method of the Question
        domain object.
        """
        question_state_data = self._create_valid_question_data('Test')

        self.question.update_question_state_data(question_state_data.to_dict())

        self.assertEqual(
            question_state_data.to_dict(),
            self.question.question_state_data.to_dict()
        )


class QuestionSummaryTest(test_utils.GenericTestBase):
    """Test for Question Summary object."""

    def test_to_dict(self):
        """Test to verify to_dict method of the Question Summary
        object.
        """
        fake_date_created = datetime.datetime(2018, 11, 17, 20, 2, 45, 0)
        fake_date_updated = datetime.datetime(2018, 11, 17, 20, 3, 14, 0)
        expected_object_dict = {
            'id': 'question_1',
            'creator_id': 'user_1',
            'question_content': u'question content',
            'last_updated_msec': utils.get_time_in_millisecs(fake_date_updated),
            'created_on_msec': utils.get_time_in_millisecs(fake_date_created),
        }

        observed_object = question_domain.QuestionSummary(
            creator_id='user_1',
            question_id='question_1',
            question_content='question content',
            question_model_created_on=fake_date_created,
            question_model_last_updated=fake_date_updated,
        )

        self.assertEqual(expected_object_dict, observed_object.to_dict())


class QuestionSkillLinkDomainTest(test_utils.GenericTestBase):
    """Test for Question Skill Link Domain object."""

    def test_to_dict(self):
        """Test to verify to_dict method of the Question Skill Link Domain
        object.
        """
        expected_object_dict = {
            'question_id': 'testquestion',
            'skill_id': 'testskill',
            'skill_description': 'testskilldescription',
            'skill_difficulty': 0.5,
        }
        observed_object = question_domain.QuestionSkillLink(
            'testquestion', 'testskill', 'testskilldescription', 0.5)
        self.assertEqual(expected_object_dict, observed_object.to_dict())


class QuestionRightsDomainTest(test_utils.GenericTestBase):
    """Test for Question Rights Domain object."""

    def setUp(self):
        """Before each individual test, create a question and user."""
        super(QuestionRightsDomainTest, self).setUp()
        self.question_id = 'question_id'
        self.signup('user@example.com', 'User')
        self.question = question_domain.Question.create_default_question(
            self.question_id)

        self.user_id = self.get_user_id_from_email('user@example.com')

    def test_to_dict(self):
        """Test to verify to_dict method of the Question Rights Domain
        object.
        """
        question_rights = question_domain.QuestionRights(
            self.question_id, self.user_id)
        expected_dict = {
            'question_id': self.question_id,
            'creator_id': self.user_id
        }

        self.assertEqual(expected_dict, question_rights.to_dict())

    def test_is_creator(self):
        """Test to verify is_creator method of the Question Rights Domain
        object.
        """
        question_rights = question_domain.QuestionRights(
            self.question_id, self.user_id)
        self.assertTrue(question_rights.is_creator(self.user_id))
        self.assertFalse(question_rights.is_creator('fakeuser'))
