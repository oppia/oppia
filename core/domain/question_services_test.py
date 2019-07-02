# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.domain.question_services."""

import logging

from core.domain import question_domain
from core.domain import question_services
from core.domain import skill_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])
memcache_services = models.Registry.import_memcache_services()


class QuestionServicesUnitTest(test_utils.GenericTestBase):
    """Test the question services module."""

    def setUp(self):
        """Before each individual test, create dummy user."""
        super(QuestionServicesUnitTest, self).setUp()
        self.signup(self.TOPIC_MANAGER_EMAIL, self.TOPIC_MANAGER_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.topic_manager_id = self.get_user_id_from_email(
            self.TOPIC_MANAGER_EMAIL)
        self.new_user_id = self.get_user_id_from_email(
            self.NEW_USER_EMAIL)
        self.editor_id = self.get_user_id_from_email(
            self.EDITOR_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([self.TOPIC_MANAGER_USERNAME])

        self.topic_manager = user_services.UserActionsInfo(
            self.topic_manager_id)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.new_user = user_services.UserActionsInfo(self.new_user_id)
        self.editor = user_services.UserActionsInfo(self.editor_id)

        self.question_id = question_services.get_new_question_id()
        self.question = self.save_new_question(
            self.question_id, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

        self.question_id_1 = question_services.get_new_question_id()
        self.question_1 = self.save_new_question(
            self.question_id_1, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_2'])

        self.question_id_2 = question_services.get_new_question_id()
        self.question_2 = self.save_new_question(
            self.question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_2'])

        self.save_new_skill(
            'skill_1', self.admin_id, 'Skill Description 1')
        self.save_new_skill(
            'skill_2', self.admin_id, 'Skill Description 2')
        self.save_new_skill(
            'skill_3', self.admin_id, 'Skill Description 3')

    def test_get_question_by_id(self):
        question = question_services.get_question_by_id(self.question_id)

        self.assertEqual(question.id, self.question_id)
        question = question_services.get_question_by_id(
            'question_id', strict=False)
        self.assertIsNone(question)

        with self.assertRaisesRegexp(
            Exception, 'Entity for class QuestionModel with id question_id '
            'not found'):
            question_services.get_question_by_id('question_id')

    def test_get_questions_and_skill_descriptions_by_skill_ids(self):
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)
        questions, _, _ = (
            question_services.get_questions_and_skill_descriptions_by_skill_ids(
                2, ['skill_1'], ''))
        self.assertEqual(len(questions), 1)
        self.assertEqual(
            questions[0].to_dict(), self.question.to_dict())

    def test_get_questions_with_multi_skill_ids(self):
        question_id_1 = question_services.get_new_question_id()
        question_1 = self.save_new_question(
            question_id_1, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1', 'skill_2'])
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_1, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_1, 'skill_2', 0.5)
        questions, _, _ = (
            question_services.get_questions_and_skill_descriptions_by_skill_ids(
                2, ['skill_1', 'skill_2'], ''))
        self.assertEqual(len(questions), 1)
        self.assertEqual(
            questions[0].to_dict(), question_1.to_dict())

    def test_get_questions_by_skill_ids(self):
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_1, 'skill_2', 0.8)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_2, 'skill_2', 0.5)

        questions = question_services.get_questions_by_skill_ids(
            4, ['skill_1', 'skill_2'])
        questions.sort(key=lambda question: question.last_updated)

        self.assertEqual(len(questions), 3)
        self.assertEqual(questions[0].to_dict(), self.question.to_dict())
        self.assertEqual(questions[1].to_dict(), self.question_1.to_dict())
        self.assertEqual(questions[2].to_dict(), self.question_2.to_dict())

    def test_get_questions_by_skill_ids_raise_error(self):
        with self.assertRaisesRegexp(
            Exception, 'Question count is too high, please limit the question '
            'count to %d.' % feconf.MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME):
            question_services.get_questions_by_skill_ids(
                25, ['skill_1', 'skill_2'])

    def test_create_multi_question_skill_links_for_question(self):
        self.question = self.save_new_question(
            self.question_id, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

        with self.assertRaisesRegexp(
            Exception, 'Skill difficulties and skill ids should match. '
            'The lengths of the two lists are different.'):
            question_services.link_multiple_skills_for_question(
                self.editor_id, self.question_id, ['skill_1', 'skill_2'],
                [0.5])
        question_services.link_multiple_skills_for_question(
            self.editor_id, self.question_id, ['skill_1', 'skill_2'],
            [0.5, 0.7])
        skill_ids = [skill.id for skill in
                     question_services.get_skills_linked_to_question(
                         self.question_id)]
        self.assertItemsEqual(skill_ids, ['skill_1', 'skill_2'])

    def test_linking_same_skill_to_question_twice(self):
        question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])
        skill_ids = [skill.id for skill in
                     question_services.get_skills_linked_to_question(
                         question_id_2)]
        self.assertEqual(len(skill_ids), 1)
        self.assertEqual(skill_ids[0], 'skill_1')
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_2, 'skill_1', 0.3)
        skill_ids = [skill.id for skill in
                     question_services.get_skills_linked_to_question(
                         question_id_2)]
        self.assertEqual(len(skill_ids), 1)
        self.assertEqual(skill_ids[0], 'skill_1')
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_2, 'skill_2', 0.3)
        skill_ids = [skill.id for skill in
                     question_services.get_skills_linked_to_question(
                         question_id_2)]
        self.assertEqual(len(skill_ids), 2)
        self.assertItemsEqual(skill_ids, ['skill_1', 'skill_2'])

    def test_create_and_get_question_skill_link(self):
        question_id_2 = question_services.get_new_question_id()
        with self.assertRaises(Exception):
            question_services.create_new_question_skill_link(
                self.editor_id, question_id_2, 'skill_1', 0.5)

        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

        question_id_3 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_2'])
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.5)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_3', 0.8)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_2, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_3, 'skill_2', 0.2)

        question_summaries, skill_descriptions, _ = (
            question_services.get_question_summaries_and_skill_descriptions(
                5, ['skill_1', 'skill_2', 'skill_3'], ''))

        with self.assertRaisesRegexp(
            Exception, 'Querying linked question summaries for more than 3 '
            'skills at a time is not supported currently.'):
            question_services.get_question_summaries_and_skill_descriptions(
                5, ['skill_1', 'skill_2', 'skill_3', 'skill_4'], '')
        question_ids = [summary.id for summary in question_summaries]
        skill_descriptions = [
            description for description in skill_descriptions
        ]

        self.assertEqual(len(question_ids), 3)
        self.assertEqual(len(skill_descriptions), 3)
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2, question_id_3])

        # Make sure the correct skill description corresponds to respective
        # question summaries.
        for index, description in enumerate(skill_descriptions):
            if question_ids[index] == self.question_id:
                self.assertEqual(
                    ['Skill Description 3', 'Skill Description 1'], description)
            elif question_ids[index] == question_id_2:
                self.assertEqual(['Skill Description 1'], description)
            else:
                self.assertEqual(['Skill Description 2'], description)

        question_summaries, skill_descriptions, _ = (
            question_services.get_question_summaries_and_skill_descriptions(
                5, ['skill_1', 'skill_3'], ''))
        question_ids = [summary.id for summary in question_summaries]
        self.assertEqual(len(question_ids), 2)
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2])

        with self.assertRaisesRegexp(
            Exception, 'The given question is already linked to given skill'):
            question_services.create_new_question_skill_link(
                self.editor_id, self.question_id, 'skill_1', 0.3)

    def test_get_question_summaries_and_skill_descriptions_with_no_skill_ids(
            self):
        question_id = question_services.get_new_question_id()
        self.save_new_question(
            question_id, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

        question_services.create_new_question_skill_link(
            self.editor_id, question_id, 'skill_1', 0.5)

        question_summaries, skill_descriptions, _ = (
            question_services.get_question_summaries_and_skill_descriptions(
                2, [], ''))

        self.assertEqual(question_summaries, [])
        self.assertEqual(skill_descriptions, [])

    def test_cannot_get_question_from_model_with_invalid_schema_version(self):
        # Delete all question models.
        all_question_models = question_models.QuestionModel.get_all()
        question_models.QuestionModel.delete_multi(all_question_models)

        all_question_models = question_models.QuestionModel.get_all()
        self.assertEqual(all_question_models.count(), 0)

        question_id = question_services.get_new_question_id()

        question_model = question_models.QuestionModel(
            id=question_id,
            question_state_data=(
                self._create_valid_question_data('ABC').to_dict()),
            language_code='en',
            version=0,
            question_state_data_schema_version=0)

        question_model.commit(
            self.editor_id, 'question model created',
            [{'cmd': question_domain.CMD_CREATE_NEW}])

        all_question_models = question_models.QuestionModel.get_all()
        self.assertEqual(all_question_models.count(), 1)
        question_model = all_question_models.get()

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v25-v%d state schemas at present.' %
            feconf.CURRENT_STATE_SCHEMA_VERSION):
            question_services.get_question_from_model(question_model)

    def test_get_question_skill_links_of_skill(self):
        # If the skill id doesnt exist at all, it returns an empty list.
        question_skill_links = (
            question_services.get_question_skill_links_of_skill(
                'non_existent_skill_id', 'Skill Description'))
        self.assertEqual(len(question_skill_links), 0)

        # If the question ids dont exist for a skill, it returns an empty list.
        question_skill_links = (
            question_services.get_question_skill_links_of_skill(
                'skill_1', 'Skill Description 1'))
        self.assertEqual(len(question_skill_links), 0)

        question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

        question_id_3 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_2'])
        # Setting skill difficulty for self.question_id.
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.5)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_2, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_3, 'skill_2', 0.1)

        # When question ids exist, it returns a list of questionskilllinks.
        question_skill_links = (
            question_services.get_question_skill_links_of_skill(
                'skill_1', 'Skill Description 1'))

        self.assertEqual(len(question_skill_links), 2)
        self.assertTrue(isinstance(question_skill_links[0],
                                   question_domain.QuestionSkillLink))
        question_ids = [question_skill.question_id for question_skill
                        in question_skill_links]
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2])
        for question_skill in question_skill_links:
            if question_skill.question_id == self.question_id:
                self.assertEqual(question_skill.skill_difficulty, 0.5)

    def test_get_question_summaries_by_ids(self):
        question_summaries = question_services.get_question_summaries_by_ids([
            self.question_id, 'invalid_question_id'])

        self.assertEqual(len(question_summaries), 2)
        self.assertEqual(question_summaries[0].id, self.question_id)
        self.assertEqual(
            question_summaries[0].question_content,
            feconf.DEFAULT_INIT_STATE_CONTENT_STR)
        self.assertIsNone(question_summaries[1])

    def test_get_questions_by_ids(self):
        question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('DEF'), ['skill_1'])
        questions = question_services.get_questions_by_ids(
            [self.question_id, 'invalid_question_id', question_id_2])
        self.assertEqual(len(questions), 3)
        self.assertEqual(questions[0].id, self.question_id)
        self.assertIsNone(questions[1])
        self.assertEqual(questions[2].id, question_id_2)

    def test_delete_question(self):
        question_rights_model = question_models.QuestionRightsModel.get(
            self.question_id)
        self.assertFalse(question_rights_model is None)

        question_summary_model = question_models.QuestionSummaryModel.get(
            self.question_id)
        self.assertFalse(question_summary_model is None)

        question_services.delete_question(self.editor_id, self.question_id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionModel with id %s not found' % (
                self.question_id))):
            question_models.QuestionModel.get(self.question_id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionRightsModel with id %s not found' % (
                self.question_id))):
            question_models.QuestionRightsModel.get(self.question_id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionSummaryModel with id %s not found' % (
                self.question_id))):
            question_models.QuestionSummaryModel.get(self.question_id)

        with self.assertRaisesRegexp(
            Exception, 'Entity for class QuestionModel with id question_id '
            'not found'):
            question_services.delete_question(self.editor_id, 'question_id')

    def test_update_question(self):
        new_question_data = self._create_valid_question_data('DEF')
        change_dict = {
            'cmd': 'update_question_property',
            'property_name': 'question_state_data',
            'new_value': new_question_data.to_dict(),
            'old_value': self.question.question_state_data.to_dict()
        }
        change_list = [question_domain.QuestionChange(change_dict)]

        question_services.update_question(
            self.editor_id, self.question_id, change_list,
            'updated question data')

        question = question_services.get_question_by_id(self.question_id)
        self.assertEqual(
            question.question_state_data.to_dict(), new_question_data.to_dict())
        self.assertEqual(question.version, 2)

    def test_cannot_update_question_with_no_commit_message(self):
        new_question_data = self._create_valid_question_data('DEF')
        change_dict = {
            'cmd': 'update_question_property',
            'property_name': 'question_state_data',
            'new_value': new_question_data.to_dict(),
            'old_value': self.question.question_state_data.to_dict()
        }
        change_list = [question_domain.QuestionChange(change_dict)]

        with self.assertRaisesRegexp(
            Exception, 'Expected a commit message, received none.'):
            question_services.update_question(
                self.editor_id, self.question_id, change_list, None)

    def test_cannot_update_question_with_no_change_list(self):
        with self.assertRaisesRegexp(
            Exception,
            'Unexpected error: received an invalid change list when trying to '
            'save question'):
            question_services.update_question(
                self.editor_id, self.question_id, [],
                'updated question data')

    def test_update_question_language_code(self):
        self.assertEqual(self.question.language_code, 'en')
        change_dict = {
            'cmd': 'update_question_property',
            'property_name': 'language_code',
            'new_value': 'bn',
            'old_value': 'en'
        }
        change_list = [question_domain.QuestionChange(change_dict)]

        question_services.update_question(
            self.editor_id, self.question_id, change_list,
            'updated question language code')

        question = question_services.get_question_by_id(self.question_id)
        self.assertEqual(question.language_code, 'bn')
        self.assertEqual(question.version, 2)

    def test_cannot_update_question_with_invalid_change_list(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_context_manager = self.assertRaises(Exception)

        with logging_swap, assert_raises_context_manager:
            question_services.update_question(
                self.editor_id, self.question_id, 'invalid_change_list',
                'updated question language code')

        self.assertEqual(len(observed_log_messages), 1)
        self.assertEqual(
            observed_log_messages[0],
            'AttributeError \'str\' object has no attribute \'cmd\' %s '
            'invalid_change_list' % self.question_id)

    def test_replace_skill_id_for_all_questions(self):
        question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

        question_id_3 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_2'])
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.5)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_2, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_3, 'skill_2', 0.9)

        question_skill_links = (
            question_services.get_question_skill_links_of_skill(
                'skill_1', 'Skill Description 1'))

        self.assertEqual(len(question_skill_links), 2)
        question_ids = [question_skill.question_id for question_skill
                        in question_skill_links]
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2])
        for question_skill in question_skill_links:
            if question_skill.question_id == self.question_id:
                self.assertEqual(question_skill.skill_difficulty, 0.5)

        question_services.replace_skill_id_for_all_questions(
            'skill_1', 'Description 1', 'skill_3')

        question_skill_links = (
            question_services.get_question_skill_links_of_skill(
                'skill_1', 'Description 1'))

        self.assertEqual(len(question_skill_links), 0)
        question_skill_links = (
            question_services.get_question_skill_links_of_skill(
                'skill_3', 'Skill Description 3'))

        question_ids = [question_skill.question_id for question_skill
                        in question_skill_links]
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2])
        for question_skill in question_skill_links:
            if question_skill.question_id == self.question_id:
                self.assertEqual(question_skill.skill_difficulty, 0.5)

        questions = question_services.get_questions_by_ids(
            [self.question_id, question_id_2, question_id_3])
        for question in questions:
            if question.id in ([self.question_id, question_id_2]):
                self.assertItemsEqual(question.linked_skill_ids, ['skill_3'])
            else:
                self.assertItemsEqual(question.linked_skill_ids, ['skill_2'])

    def test_compute_summary_of_question(self):
        question_summary = question_services.compute_summary_of_question(
            self.question, self.editor_id)

        self.assertEqual(question_summary.id, self.question_id)
        self.assertEqual(
            question_summary.question_content,
            feconf.DEFAULT_INIT_STATE_CONTENT_STR)

    def test_get_question_summaries_by_creator_id(self):
        question_summaries = (
            question_services.get_question_summaries_by_creator_id(
                self.editor_id))

        self.assertEqual(len(question_summaries), 3)
        question_summaries.sort(key=lambda summary: summary.last_updated)
        question_ids = [summary.id for summary in question_summaries]
        self.assertEqual(question_ids[0], self.question_id)
        self.assertEqual(question_ids[1], self.question_id_1)
        self.assertEqual(question_ids[2], self.question_id_2)

    def test_created_question_rights(self):
        question_rights = question_services.get_question_rights(
            self.question_id)

        self.assertTrue(question_rights.is_creator(self.editor_id))
        self.assertEqual(question_rights.creator_id, self.editor_id)

        self.assertIsNone(
            question_services.get_question_rights('question_id', strict=False))
        with self.assertRaisesRegexp(
            Exception, 'Entity for class QuestionRightsModel with id '
            'question_id not found'):
            question_services.get_question_rights('question_id')

    def test_get_skills_of_question(self):
        # If the question id doesnt exist at all, it returns an empty list.
        with self.assertRaisesRegexp(
            Exception, 'Entity for class QuestionModel with id '
            'non_existent_question_id not found'):
            question_services.get_skills_linked_to_question(
                'non_existent_question_id')
        question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

        question_id_3 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_2'])
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.5)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_2, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_2, 'skill_2', 0.0)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_3, 'skill_2', 0.1)

        skills = (
            question_services.get_skills_linked_to_question(
                question_id_2))

        self.assertTrue(isinstance(skills[0], skill_domain.Skill))
        self.assertEqual(len(skills), 2)
        skill_ids = [skill.id for skill in skills]
        self.assertItemsEqual(
            skill_ids, ['skill_1', 'skill_2'])
