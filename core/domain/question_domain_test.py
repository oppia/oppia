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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

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
        self.assertRaisesRegexp(
            utils.ValidationError,
            'Missing cmd key in change dict',
            callableObj=question_domain.QuestionChange,
            change_dict={}
        )

    def test_change_dict_with_wrong_cmd(self):
        """Test to verify __init__ method of the Question Change object
        when change_dict is with wrong cmd value.
        """
        self.assertRaisesRegexp(
            utils.ValidationError,
            'Command wrong is not allowed',
            callableObj=question_domain.QuestionChange,
            change_dict={'cmd': 'wrong', }
        )

    def test_change_dict_with_missing_attributes_in_cmd(self):
        """Test to verify __init__ method of the Question Change object
        when change_dict is with missing attributes in cmd.
        """
        self.assertRaisesRegexp(
            utils.ValidationError,
            'The following required attributes are present: new_value',
            callableObj=question_domain.QuestionChange,
            change_dict={
                'cmd': 'update_question_property',
                'property_name': 'question_state_data',
                'old_value': 'old_value'
            }
        )

    def test_change_dict_with_extra_attributes_in_cmd(self):
        """Test to verify __init__ method of the Question Change object
        when change_dict is with extra attributes in cmd.
        """
        self.assertRaisesRegexp(
            utils.ValidationError,
            'The following extra attributes are present: invalid',
            callableObj=question_domain.QuestionChange,
            change_dict={'cmd': 'create_new', 'invalid': 'invalid'}
        )

    def test_update_question_property_with_wrong_property_name(self):
        """Test to verify __init__ method of the Question Change object
        when cmd is update_question_property and wrong property_name is given.
        """
        self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd update_question_property: '
                'wrong is not allowed'),
            callableObj=question_domain.QuestionChange,
            change_dict={
                'cmd': 'update_question_property',
                'property_name': 'wrong',
                'new_value': 'new_value',
                'old_value': 'old_value'
            }
        )

    def test_create_new(self):
        """Test to verify __init__ method of the Question Change object
        when cmd is create_new.
        """
        change_dict = {
            'cmd': 'create_new'
        }
        observed_object = question_domain.QuestionChange(
            change_dict=change_dict,
        )

        self.assertEqual('create_new', observed_object.cmd)

    def test_update_question_property(self):
        """Test to verify __init__ method of the Question Change object
        when cmd is update_question_property.
        """
        change_dict = {
            'cmd': 'update_question_property',
            'property_name': 'question_state_data',
            'new_value': 'new_value',
            'old_value': 'old_value'
        }
        observed_object = question_domain.QuestionChange(
            change_dict=change_dict
        )

        self.assertEqual('update_question_property', observed_object.cmd)
        self.assertEqual('question_state_data', observed_object.property_name)
        self.assertEqual('new_value', observed_object.new_value)
        self.assertEqual('old_value', observed_object.old_value)

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

        self.assertEqual(
            'create_new_fully_specified_question', observed_object.cmd)
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

        self.assertEqual(
            'migrate_state_schema_to_latest_version', observed_object.cmd)
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
            feconf.CURRENT_STATE_SCHEMA_VERSION, 'en', 1, ['skill1'])

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
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'language_code': 'en',
            'version': 1,
            'linked_skill_ids': ['skill1']
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
                        'html': '<p>Feedback</p>'
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
                'tagged_skill_misconception_id': None
            })
        ]

        self._assert_validation_error(
            'Expected all answer groups to have destination as None.')

    def test_strict_validation_passes(self):
        """Test to verify validate method of a finalized Question domain object
        with correct input.
        """
        self.question.validate()

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

        self.question.linked_skill_ids = 'Test'
        self._assert_validation_error(
            'Expected linked_skill_ids to be a list of strings')

        self.question.linked_skill_ids = None
        self._assert_validation_error(
            'inked_skill_ids is either null or an empty list')

        self.question.linked_skill_ids = []
        self._assert_validation_error(
            'linked_skill_ids is either null or an empty list')

        self.question.linked_skill_ids = ['Test', 1]
        self._assert_validation_error(
            'Expected linked_skill_ids to be a list of strings')

        self.question.linked_skill_ids = ['skill1', 'skill1']
        self._assert_validation_error(
            'linked_skill_ids has duplicate skill ids')

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
        skill_ids = ['test_skill1', 'test_skill2']
        question = question_domain.Question.create_default_question(
            question_id, skill_ids)
        default_question_data = (
            question_domain.Question.create_default_question_state().to_dict())

        self.assertEqual(question.id, question_id)
        self.assertEqual(
            question.question_state_data.to_dict(), default_question_data)
        self.assertEqual(question.language_code, 'en')
        self.assertEqual(question.version, 0)
        self.assertEqual(question.linked_skill_ids, skill_ids)

    def test_update_language_code(self):
        """Test to verify update_language_code method of the Question domain
        object.
        """
        self.question.update_language_code('pl')

        self.assertEqual('pl', self.question.language_code)

    def test_update_linked_skill_ids(self):
        """Test to verify update_linked_skill_ids method of the Question domain
        object.
        """
        self.question.update_linked_skill_ids(['skill_id1'])

        self.assertEqual(['skill_id1'], self.question.linked_skill_ids)

    def test_update_question_state_data(self):
        """Test to verify update_question_state_data method of the Question
        domain object.
        """
        question_state_data = self._create_valid_question_data('Test')

        self.question.update_question_state_data(question_state_data)

        self.assertEqual(
            question_state_data.to_dict(),
            self.question.question_state_data.to_dict()
        )


class QuestionSummaryTest(test_utils.GenericTestBase):
    """Test for Question Summary object."""

    def setUp(self):
        super(QuestionSummaryTest, self).setUp()
        self.fake_date_created = datetime.datetime(
            2018, 11, 17, 20, 2, 45, 0)
        self.fake_date_updated = datetime.datetime(
            2018, 11, 17, 20, 3, 14, 0)
        self.observed_object = question_domain.QuestionSummary(
            question_id='question_1',
            question_content='<p>question content</p>',
            question_model_created_on=self.fake_date_created,
            question_model_last_updated=self.fake_date_updated,
        )

    def test_to_dict(self):
        """Test to verify to_dict method of the Question Summary
        object.
        """
        expected_object_dict = {
            'id': 'question_1',
            'question_content': '<p>question content</p>',
            'last_updated_msec': utils.get_time_in_millisecs(
                self.fake_date_updated),
            'created_on_msec': utils.get_time_in_millisecs(
                self.fake_date_created),
        }

        self.assertEqual(expected_object_dict, self.observed_object.to_dict())

    def test_validation_with_valid_properties(self):
        self.observed_object.validate()

    def test_validation_with_invalid_id(self):
        self.observed_object.id = 1
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected id to be a string, received 1'):
            self.observed_object.validate()

    def test_validation_with_invalid_question_content(self):
        self.observed_object.question_content = 1
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected question content to be a string, received 1'):
            self.observed_object.validate()

    def test_validation_with_invalid_created_on(self):
        self.observed_object.created_on = 1
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected created on to be a datetime, received 1'):
            self.observed_object.validate()

    def test_validation_with_invalid_last_updated(self):
        self.observed_object.last_updated = 1
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected last updated to be a datetime, received 1'):
            self.observed_object.validate()


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


class MergedQuestionSkillLinkDomainTest(test_utils.GenericTestBase):
    """Test for Merged Question Skill Link Domain object."""

    def test_to_dict(self):
        """Test to verify to_dict method of the Merged Question Skill Link
        Domain object.
        """
        expected_object_dict = {
            'question_id': 'testquestion',
            'skill_ids': ['testskill'],
            'skill_descriptions': ['testskilldescription'],
            'skill_difficulties': [0.5],
        }
        observed_object = question_domain.MergedQuestionSkillLink(
            'testquestion', ['testskill'], ['testskilldescription'], [0.5])
        self.assertEqual(expected_object_dict, observed_object.to_dict())
