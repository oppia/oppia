# coding: utf-8
#
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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])


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

        self.topic_manager = user_services.get_user_actions_info(
            self.topic_manager_id)
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.new_user = user_services.get_user_actions_info(self.new_user_id)
        self.editor = user_services.get_user_actions_info(self.editor_id)

        self.save_new_skill(
            'skill_1', self.admin_id, description='Skill Description 1')
        self.save_new_skill(
            'skill_2', self.admin_id, description='Skill Description 2')
        self.save_new_skill(
            'skill_3', self.admin_id, description='Skill Description 3')

        self.question_id = question_services.get_new_question_id()
        self.question = self.save_new_question(
            self.question_id, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'],
            inapplicable_skill_misconception_ids=[
                'skillid12345-1', 'skillid12345-2'])

        self.question_id_1 = question_services.get_new_question_id()
        self.question_1 = self.save_new_question(
            self.question_id_1, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_2'])

        self.question_id_2 = question_services.get_new_question_id()
        self.question_2 = self.save_new_question(
            self.question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_2'])

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

    def test_get_questions_by_skill_ids_with_fetch_by_difficulty(self):
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_1, 'skill_2', 0.8)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_2, 'skill_2', 0.5)

        questions = question_services.get_questions_by_skill_ids(
            2, ['skill_1', 'skill_2'], True)
        questions.sort(key=lambda question: question.last_updated)

        self.assertEqual(len(questions), 2)
        self.assertEqual(questions[0].to_dict(), self.question.to_dict())
        self.assertEqual(questions[1].to_dict(), self.question_2.to_dict())

    def test_get_total_question_count_for_skill_ids(self):
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_1, 'skill_1', 0.8)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_2, 'skill_2', 0.5)

        question_count = (
            question_services.get_total_question_count_for_skill_ids(
                ['skill_1']))
        self.assertEqual(question_count, 2)

        question_count = (
            question_services.get_total_question_count_for_skill_ids(
                ['skill_2']))
        self.assertEqual(question_count, 1)

        question_count = (
            question_services.get_total_question_count_for_skill_ids(
                ['skill_1', 'skill_2']))
        self.assertEqual(question_count, 3)

        question_count = (
            question_services.get_total_question_count_for_skill_ids(
                ['skill_1', 'skill_1']))
        self.assertEqual(question_count, 2)

        question_count = (
            question_services.get_total_question_count_for_skill_ids(
                ['skill_1', 'skill_1', 'skill_2']))
        self.assertEqual(question_count, 3)

    def test_update_question_skill_link_difficulty(self):
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)

        _, merged_question_skill_links, _ = (
            question_services.get_displayable_question_skill_link_details(
                2, ['skill_1'], ''))
        self.assertEqual(
            merged_question_skill_links[0].skill_difficulties, [0.3])

        question_services.update_question_skill_link_difficulty(
            self.question_id, 'skill_1', 0.9)

        _, merged_question_skill_links, _ = (
            question_services.get_displayable_question_skill_link_details(
                2, ['skill_1'], ''))
        self.assertEqual(
            merged_question_skill_links[0].skill_difficulties, [0.9])

        with self.assertRaisesRegexp(
            Exception, 'The given question and skill are not linked.'):
            question_services.update_question_skill_link_difficulty(
                self.question_id, 'skill_10', 0.9)

    def test_get_questions_by_skill_ids_without_fetch_by_difficulty(self):
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_1, 'skill_2', 0.8)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_2, 'skill_2', 0.5)

        questions = question_services.get_questions_by_skill_ids(
            4, ['skill_1', 'skill_2'], False)
        questions.sort(key=lambda question: question.last_updated)

        self.assertEqual(len(questions), 3)
        self.assertEqual(questions[0].to_dict(), self.question.to_dict())
        self.assertEqual(questions[1].to_dict(), self.question_1.to_dict())
        self.assertEqual(questions[2].to_dict(), self.question_2.to_dict())

    def test_get_questions_by_skill_ids_raise_error_with_high_question_count(
            self):
        with self.assertRaisesRegexp(
            Exception, 'Question count is too high, please limit the question '
            'count to %d.' % feconf.MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME):
            question_services.get_questions_by_skill_ids(
                25, ['skill_1', 'skill_2'], False)

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

    def test_delete_question_skill_link(self):
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_2', 0.3)
        question_services.delete_question_skill_link(
            self.editor_id, self.question_id, 'skill_1')
        skill_ids = [skill.id for skill in
                     question_services.get_skills_linked_to_question(
                         self.question_id)]
        self.assertItemsEqual(skill_ids, ['skill_2'])

        question_services.delete_question_skill_link(
            self.editor_id, self.question_id, 'skill_2')

        question = question_services.get_question_by_id(
            self.question_id, strict=False)
        self.assertIsNone(question)

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
        with self.assertRaisesRegexp(
            Exception,
            r'Entity for class QuestionModel with id %s not found' % (
                question_id_2)):
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

        question_summaries, merged_question_skill_links, _ = (
            question_services.get_displayable_question_skill_link_details(
                5, ['skill_1', 'skill_2', 'skill_3'], ''))

        with self.assertRaisesRegexp(
            Exception, 'Querying linked question summaries for more than 3 '
            'skills at a time is not supported currently.'):
            question_services.get_displayable_question_skill_link_details(
                5, ['skill_1', 'skill_2', 'skill_3', 'skill_4'], '')
        question_ids = [summary.id for summary in question_summaries]

        self.assertEqual(len(question_ids), 3)
        self.assertEqual(len(merged_question_skill_links), 3)
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2, question_id_3])
        self.assertItemsEqual(
            question_ids, [
                question_skill_link.question_id
                for question_skill_link in merged_question_skill_links])

        # Make sure the correct skill description corresponds to respective
        # question summaries.
        for index, link_object in enumerate(merged_question_skill_links):
            if question_ids[index] == self.question_id:
                self.assertEqual(
                    ['Skill Description 3', 'Skill Description 1'],
                    link_object.skill_descriptions)
                self.assertEqual(
                    [0.8, 0.5], link_object.skill_difficulties)
            elif question_ids[index] == question_id_2:
                self.assertEqual(
                    ['Skill Description 1'], link_object.skill_descriptions)
                self.assertEqual(
                    [0.3], link_object.skill_difficulties)
            else:
                self.assertEqual(
                    ['Skill Description 2'], link_object.skill_descriptions)
                self.assertEqual(
                    [0.2], link_object.skill_difficulties)

        question_summaries, merged_question_skill_links, _ = (
            question_services.get_displayable_question_skill_link_details(
                5, ['skill_1', 'skill_3'], ''))
        question_ids = [summary.id for summary in question_summaries]
        self.assertEqual(len(question_ids), 2)
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2])

        with self.assertRaisesRegexp(
            Exception, 'The given question is already linked to given skill'):
            question_services.create_new_question_skill_link(
                self.editor_id, self.question_id, 'skill_1', 0.3)

    def test_get_displayable_question_skill_link_details_with_no_skill_ids(
            self):
        question_id = question_services.get_new_question_id()
        self.save_new_question(
            question_id, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

        question_services.create_new_question_skill_link(
            self.editor_id, question_id, 'skill_1', 0.5)

        question_summaries, merged_question_skill_links, _ = (
            question_services.get_displayable_question_skill_link_details(
                2, [], ''))

        self.assertEqual(question_summaries, [])
        self.assertEqual(merged_question_skill_links, [])

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
        self.assertTrue(isinstance(
            question_skill_links[0], question_domain.QuestionSkillLink))
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

    def test_delete_question(self):
        question_summary_model = question_models.QuestionSummaryModel.get(
            self.question_id)
        self.assertFalse(question_summary_model is None)

        question_services.delete_question(self.editor_id, self.question_id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionModel with id %s not found' % (
                self.question_id))):
            question_models.QuestionModel.get(self.question_id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionSummaryModel with id %s not found' % (
                self.question_id))):
            question_models.QuestionSummaryModel.get(self.question_id)

    def test_delete_question_marked_deleted(self):
        question_models.QuestionModel.delete_multi(
            [self.question_id], self.editor_id,
            feconf.COMMIT_MESSAGE_QUESTION_DELETED, force_deletion=False)
        question_model = question_models.QuestionModel.get_by_id(
            self.question_id)
        self.assertTrue(question_model.deleted)

        question_services.delete_question(
            self.editor_id, self.question_id, force_deletion=True)
        question_model = question_models.QuestionModel.get_by_id(
            self.question_id)
        self.assertEqual(question_model, None)
        self.assertEqual(
            question_models.QuestionSummaryModel.get(
                self.question_id, strict=False), None)

    def test_delete_question_model_with_deleted_summary_model(self):
        question_summary_model = (
            question_models.QuestionSummaryModel.get(self.question_id))
        question_summary_model.delete()
        question_summary_model = (
            question_models.QuestionSummaryModel.get(self.question_id, False))
        self.assertIsNone(question_summary_model)

        question_services.delete_question(
            self.editor_id, self.question_id, force_deletion=True)
        question_model = question_models.QuestionModel.get_by_id(
            self.question_id)
        self.assertEqual(question_model, None)
        self.assertEqual(
            question_models.QuestionSummaryModel.get(
                self.question_id, strict=False), None)

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

    def test_update_inapplicable_skill_misconception_ids(self):
        self.assertEqual(
            self.question.inapplicable_skill_misconception_ids,
            ['skillid12345-1', 'skillid12345-2'])
        change_dict = {
            'cmd': 'update_question_property',
            'property_name': 'inapplicable_skill_misconception_ids',
            'new_value': ['skillid12345-1'],
            'old_value': []
        }
        change_list = [question_domain.QuestionChange(change_dict)]

        question_services.update_question(
            self.editor_id, self.question_id, change_list,
            'updated inapplicable_skill_misconception_ids')

        question = question_services.get_question_by_id(self.question_id)
        self.assertEqual(
            question.inapplicable_skill_misconception_ids, ['skillid12345-1'])
        self.assertEqual(question.version, 2)

    def test_cannot_update_question_with_invalid_change_list(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_context_manager = self.assertRaisesRegexp(
            Exception, '\'unicode\' object has no attribute \'cmd\'')

        with logging_swap, assert_raises_context_manager:
            question_services.update_question(
                self.editor_id, self.question_id, 'invalid_change_list',
                'updated question language code')

        self.assertEqual(len(observed_log_messages), 1)
        self.assertRegexpMatches(
            observed_log_messages[0],
            'object has no attribute \'cmd\' %s '
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

        questions = question_fetchers.get_questions_by_ids(
            [self.question_id, question_id_2, question_id_3])
        for question in questions:
            if question.id in ([self.question_id, question_id_2]):
                self.assertItemsEqual(question.linked_skill_ids, ['skill_3'])
            else:
                self.assertItemsEqual(question.linked_skill_ids, ['skill_2'])

    def test_compute_summary_of_question(self):
        question_summary = question_services.compute_summary_of_question(
            self.question)

        self.assertEqual(question_summary.id, self.question_id)
        self.assertEqual(
            question_summary.question_content,
            feconf.DEFAULT_INIT_STATE_CONTENT_STR)

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

    def test_get_interaction_id_for_question(self):
        self.assertEqual(
            question_services.get_interaction_id_for_question(
                self.question_id), 'TextInput')
        with self.assertRaisesRegexp(Exception, 'No questions exists with'):
            question_services.get_interaction_id_for_question('fake_q_id')

    def test_untag_deleted_misconceptions_on_no_change_to_skill(self):
        misconceptions = [
            skill_domain.Misconception(
                0, 'misconception-name', '<p>description</p>',
                '<p>default_feedback</p>', True),
            skill_domain.Misconception(
                1, 'misconception-name', '<p>description</p>',
                '<p>default_feedback</p>', True),
            skill_domain.Misconception(
                2, 'misconception-name', '<p>description</p>',
                '<p>default_feedback</p>', False),
            skill_domain.Misconception(
                3, 'misconception-name', '<p>description</p>',
                '<p>default_feedback</p>', False),
            skill_domain.Misconception(
                4, 'misconception-name', '<p>description</p>',
                '<p>default_feedback</p>', False)
        ]
        self.save_new_skill(
            'skillid12345', self.admin_id,
            description='Skill with misconceptions',
            misconceptions=misconceptions)

        self.question_id = question_services.get_new_question_id()
        question_state_data = self._create_valid_question_data('state name')
        question_state_data.interaction.answer_groups = [
            state_domain.AnswerGroup.from_dict({
                'outcome': {
                    'dest': None,
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
                        'x': {
                            'contentId': 'rule_input_3',
                            'normalizedStrSet': ['Test']
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skillid12345-0'
            }),
            state_domain.AnswerGroup.from_dict({
                'outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_2',
                        'html': '<p>Feedback</p>'
                    },
                    'labelled_as_correct': True,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['Test']
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skillid12345-1'
            }),
            state_domain.AnswerGroup.from_dict({
                'outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_0',
                        'html': '<p>Feedback</p>'
                    },
                    'labelled_as_correct': True,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_5',
                            'normalizedStrSet': ['Test']
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skillid12345-2'
            })
        ]
        question_state_data.written_translations.translations_mapping.update({
            'feedback_0': {},
            'feedback_1': {},
            'feedback_2': {},
            'rule_input_3': {},
            'rule_input_4': {},
            'rule_input_5': {}
        })
        question_state_data.recorded_voiceovers.voiceovers_mapping.update({
            'feedback_0': {},
            'feedback_1': {},
            'feedback_2': {},
            'rule_input_3': {},
            'rule_input_4': {},
            'rule_input_5': {}
        })
        question_state_data.next_content_id_index = 5
        inapplicable_skill_misconception_ids = [
            'skillid12345-3',
            'skillid12345-4'
        ]
        self.question = self.save_new_question(
            self.question_id, self.editor_id,
            question_state_data, ['skillid12345'],
            inapplicable_skill_misconception_ids=(
                inapplicable_skill_misconception_ids))
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skillid12345', 0.5)
        answer_groups = (
            self.question.question_state_data.interaction.answer_groups)
        actual_misconception_ids = [
            answer_group.to_dict()['tagged_skill_misconception_id']
            for answer_group in answer_groups
            if answer_group.to_dict()['tagged_skill_misconception_id']]
        expected_misconception_ids = [
            'skillid12345-0',
            'skillid12345-1',
            'skillid12345-2'
        ]
        self.assertEqual(
            self.question.inapplicable_skill_misconception_ids,
            inapplicable_skill_misconception_ids)
        self.assertEqual(actual_misconception_ids, expected_misconception_ids)
        # Try to untag deleted skill misconceptions when there are no deleted
        # misconceptions.
        question_services.untag_deleted_misconceptions(
            self.editor_id, 'skillid12345',
            'Skill with misconceptions', [])
        # No change when skill misconception ids exist.
        updated_question = question_services.get_question_by_id(
            self.question_id)
        self.assertEqual(
            updated_question.inapplicable_skill_misconception_ids,
            inapplicable_skill_misconception_ids)
        self.assertEqual(actual_misconception_ids, expected_misconception_ids)

    def test_untag_deleted_misconceptions_correctly_on_updating_skill(self):
        misconceptions = [
            skill_domain.Misconception(
                0, 'misconception-name', '<p>description</p>',
                '<p>default_feedback</p>', True),
            skill_domain.Misconception(
                1, 'misconception-name', '<p>description</p>',
                '<p>default_feedback</p>', True),
            skill_domain.Misconception(
                2, 'misconception-name', '<p>description</p>',
                '<p>default_feedback</p>', False),
            skill_domain.Misconception(
                3, 'misconception-name', '<p>description</p>',
                '<p>default_feedback</p>', False),
            skill_domain.Misconception(
                4, 'misconception-name', '<p>description</p>',
                '<p>default_feedback</p>', False)
        ]
        self.save_new_skill(
            'skillid12345', self.admin_id,
            description='Skill with misconceptions',
            misconceptions=misconceptions)

        self.question_id = question_services.get_new_question_id()
        question_state_data = self._create_valid_question_data('state name')
        question_state_data.interaction.answer_groups = [
            state_domain.AnswerGroup.from_dict({
                'outcome': {
                    'dest': None,
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
                        'x': {
                            'contentId': 'rule_input_3',
                            'normalizedStrSet': ['Test']
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skillid12345-0'
            }),
            state_domain.AnswerGroup.from_dict({
                'outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_2',
                        'html': '<p>Feedback</p>'
                    },
                    'labelled_as_correct': True,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['Test']
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skillid12345-1'
            }),
            state_domain.AnswerGroup.from_dict({
                'outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_0',
                        'html': '<p>Feedback</p>'
                    },
                    'labelled_as_correct': True,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_5',
                            'normalizedStrSet': ['Test']
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skillid12345-2'
            })
        ]
        question_state_data.written_translations.translations_mapping.update({
            'feedback_0': {},
            'feedback_1': {},
            'feedback_2': {},
            'rule_input_3': {},
            'rule_input_4': {},
            'rule_input_5': {}
        })
        question_state_data.recorded_voiceovers.voiceovers_mapping.update({
            'feedback_0': {},
            'feedback_1': {},
            'feedback_2': {},
            'rule_input_3': {},
            'rule_input_4': {},
            'rule_input_5': {}
        })
        question_state_data.next_content_id_index = 5
        inapplicable_skill_misconception_ids = [
            'skillid12345-3',
            'skillid12345-4'
        ]
        self.question = self.save_new_question(
            self.question_id, self.editor_id,
            question_state_data, ['skillid12345'],
            inapplicable_skill_misconception_ids=(
                inapplicable_skill_misconception_ids))
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skillid12345', 0.5)
        answer_groups = (
            self.question.question_state_data.interaction.answer_groups)
        actual_misconception_ids = [
            answer_group.to_dict()['tagged_skill_misconception_id']
            for answer_group in answer_groups
            if answer_group.to_dict()['tagged_skill_misconception_id']]
        expected_misconception_ids = [
            'skillid12345-0',
            'skillid12345-1',
            'skillid12345-2'
        ]
        self.assertEqual(
            self.question.inapplicable_skill_misconception_ids,
            inapplicable_skill_misconception_ids)
        self.assertEqual(actual_misconception_ids, expected_misconception_ids)
        # Delete few misconceptions.
        change_list = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_DELETE_SKILL_MISCONCEPTION,
                'misconception_id': 0,
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_DELETE_SKILL_MISCONCEPTION,
                'misconception_id': 2,
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_DELETE_SKILL_MISCONCEPTION,
                'misconception_id': 4,
            })
        ]
        skill_services.update_skill(
            self.editor_id, 'skillid12345',
            change_list, 'Delete misconceptions.')
        self.process_and_flush_pending_tasks()
        self.process_and_flush_pending_mapreduce_tasks()
        updated_question = question_services.get_question_by_id(
            self.question_id)
        updated_answer_groups = (
            updated_question.question_state_data.interaction.answer_groups)
        actual_misconception_ids = [
            answer_group.to_dict()['tagged_skill_misconception_id']
            for answer_group in updated_answer_groups
            if answer_group.to_dict()['tagged_skill_misconception_id']]
        expected_misconception_ids = ['skillid12345-1']
        actual_inapplicable_skill_misconception_ids = (
            updated_question.inapplicable_skill_misconception_ids)
        expected_inapplicable_skill_misconception_ids = (
            ['skillid12345-3'])
        self.assertEqual(
            actual_inapplicable_skill_misconception_ids,
            expected_inapplicable_skill_misconception_ids)
        self.assertEqual(actual_misconception_ids, expected_misconception_ids)


class QuestionMigrationTests(test_utils.GenericTestBase):

    def test_migrate_question_state_from_v29_to_latest(self):
        answer_group = {
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
            'tagged_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {
                    'correct_answer': 'This is the correct answer',
                    'answer_is_exclusive': False,
                    'explanation': {
                        'content_id': 'explanation_1',
                        'html': 'Solution explanation'
                    }
                },
                'id': 'TextInput'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=29)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        answer_groups = question.question_state_data.interaction.answer_groups
        self.assertEqual(answer_groups[0].tagged_skill_misconception_id, None)

    def test_migrate_question_state_from_v30_to_latest(self):
        answer_group = {
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
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {
                        'en': {
                            'filename': 'test.mp3',
                            'file_size_bytes': 100,
                            'needs_update': False
                        }
                    }
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {
                    'correct_answer': 'This is the correct answer',
                    'answer_is_exclusive': False,
                    'explanation': {
                        'content_id': 'explanation_1',
                        'html': 'Solution explanation'
                    }
                },
                'id': 'TextInput'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=30)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)

        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        self.assertEqual(
            question.question_state_data
            .recorded_voiceovers.to_dict(), {
                'voiceovers_mapping': {
                    'ca_placeholder_0': {},
                    'content': {
                        'en': {
                            'filename': 'test.mp3',
                            'file_size_bytes': 100,
                            'needs_update': False,
                            'duration_secs': 0.0}},
                    'rule_input_1': {}}})

    def test_migrate_question_state_from_v31_to_latest(self):
        answer_group = {
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
                    'x': ['A', 'B', 'C']
                },
                'rule_type': 'HasElementsIn'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {},
                'id': 'SetInput'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=31)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        cust_args = question.question_state_data.interaction.customization_args
        self.assertEqual(
            cust_args['buttonText'].value.unicode_str,
            'Add item')

    def test_migrate_question_state_from_v32_to_latest(self):
        answer_group = {
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
                    'x': ['A']
                },
                'rule_type': 'Equals'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'choices': {
                        'value': []
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {},
                'id': 'MultipleChoiceInput'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=32)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        cust_args = question.question_state_data.interaction.customization_args
        self.assertEqual(cust_args['choices'].value, [])
        self.assertEqual(cust_args['showChoicesInShuffledOrder'].value, True)

    def test_migrate_question_state_from_v33_to_latest(self):
        feedback_html_content = (
            '<p>Feedback</p><oppia-noninteractive-math raw_latex-with-value="'
            '&amp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': feedback_html_content
                },
                'labelled_as_correct': True,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': ['A']
                },
                'rule_type': 'Equals'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'choices': {
                        'value': ''
                    },
                    'showChoicesInShuffledOrder': {
                        'value': True
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {},
                'id': 'MultipleChoiceInput'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        expected_feeedback_html_content = (
            '<p>Feedback</p><oppia-noninteractive-math math_content-with-val'
            'ue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;,'
            ' &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppi'
            'a-noninteractive-math>')
        question_model = (
            question_models.QuestionModel(
                id='question_id',
                question_state_data=question_state_dict,
                language_code='en',
                version=0,
                linked_skill_ids=['skill_id'],
                question_state_data_schema_version=33))
        commit_cmd = (
            question_domain.QuestionChange({
                'cmd': question_domain.CMD_CREATE_NEW
            }))
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        migrated_answer_group = (
            question.question_state_data.interaction.answer_groups[0])
        self.assertEqual(
            migrated_answer_group.outcome.feedback.html,
            expected_feeedback_html_content)

    def test_migrate_question_state_from_v34_to_latest(self):
        answer_group = {
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
                    'x': 'x+y'
                },
                'rule_type': 'IsMathematicallyEquivalentTo'
            }, {
                'inputs': {
                    'x': 'x=y'
                },
                'rule_type': 'IsMathematicallyEquivalentTo'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {
                    'correct_answer': {
                        'ascii': 'x=y',
                        'latex': 'x=y'
                    },
                    'answer_is_exclusive': False,
                    'explanation': {
                        'html': 'Solution explanation',
                        'content_id': 'content_2'
                    }
                },
                'id': 'MathExpressionInput'
            },
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=34)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        answer_groups = question.question_state_data.interaction.answer_groups
        self.assertEqual(
            question.question_state_data.interaction.id, 'MathEquationInput')
        self.assertEqual(len(answer_groups[0].rule_specs), 1)
        self.assertEqual(
            answer_groups[0].rule_specs[0].rule_type, 'MatchesExactlyWith')
        self.assertEqual(
            answer_groups[0].rule_specs[0].inputs, {'x': 'x=y', 'y': 'both'})

        answer_group = {
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
                    'x': 'x+y'
                },
                'rule_type': 'IsMathematicallyEquivalentTo'
            }, {
                'inputs': {
                    'x': '1.2 + 3'
                },
                'rule_type': 'IsMathematicallyEquivalentTo'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {
                    'correct_answer': {
                        'ascii': 'x+y',
                        'latex': 'x+y'
                    },
                    'answer_is_exclusive': False,
                    'explanation': {
                        'html': 'Solution explanation',
                        'content_id': 'content_2'
                    }
                },
                'id': 'MathExpressionInput'
            },
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=34)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)

        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        answer_groups = question.question_state_data.interaction.answer_groups
        self.assertEqual(
            question.question_state_data.interaction.id,
            'AlgebraicExpressionInput')
        self.assertEqual(len(answer_groups[0].rule_specs), 1)
        self.assertEqual(
            answer_groups[0].rule_specs[0].rule_type, 'MatchesExactlyWith')
        self.assertEqual(
            answer_groups[0].rule_specs[0].inputs, {'x': 'x+y'})

        answer_group = {
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
                    'x': '1,2 + 3'
                },
                'rule_type': 'IsMathematicallyEquivalentTo'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {
                    'correct_answer': {
                        'ascii': '1.2 + 3',
                        'latex': '1.2 + 3'
                    },
                    'answer_is_exclusive': False,
                    'explanation': {
                        'html': 'Solution explanation',
                        'content_id': 'content_2'
                    }
                },
                'id': 'MathExpressionInput'
            },
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=34)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)

        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        answer_groups = question.question_state_data.interaction.answer_groups
        self.assertEqual(
            question.question_state_data.interaction.id,
            'NumericExpressionInput')
        self.assertEqual(len(answer_groups[0].rule_specs), 1)
        self.assertEqual(
            answer_groups[0].rule_specs[0].rule_type, 'MatchesExactlyWith')
        self.assertEqual(
            answer_groups[0].rule_specs[0].inputs, {'x': '1.2 + 3'})

        answer_groups_list = [{
            'outcome': {
                'dest': 'Introduction',
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
                    'x': 'x+y'
                },
                'rule_type': 'IsMathematicallyEquivalentTo'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }, {
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback_2',
                    'html': '<p>Feedback</p>'
                },
                'labelled_as_correct': True,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': '1.2 + 3'
                },
                'rule_type': 'IsMathematicallyEquivalentTo'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content_1': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'feedback_3': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content_1': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'feedback_3': {}
                }
            },
            'interaction': {
                'answer_groups': answer_groups_list,
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': 'Introduction',
                    'feedback': {
                        'content_id': 'feedback_3',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
                'id': 'MathExpressionInput'
            },
            'next_content_id_index': 4,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=34)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)

        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        answer_groups = question.question_state_data.interaction.answer_groups
        self.assertEqual(
            question.question_state_data.interaction.id,
            'AlgebraicExpressionInput')
        self.assertEqual(len(answer_groups), 1)
        self.assertEqual(
            answer_groups[0].rule_specs[0].rule_type, 'MatchesExactlyWith')
        self.assertEqual(
            answer_groups[0].rule_specs[0].inputs, {'x': 'x+y'})
        state_data = question.question_state_data
        self.assertEqual(sorted(
            state_data.recorded_voiceovers.voiceovers_mapping.keys()), [
                'content_1', 'feedback_1', 'feedback_3'])
        self.assertEqual(sorted(
            state_data.written_translations.translations_mapping.keys()), [
                'content_1', 'feedback_1', 'feedback_3'])

    def test_migrate_question_state_from_v35_to_latest(self):
        # Test restructuring of written_translations.
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {
                        'en': {
                            'html': '<p>test</p>',
                            'needs_update': True
                        }
                    }
                }
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': {},
                'id': None
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }

        question_model = (
            question_models.QuestionModel(
                id='question_id',
                question_state_data=question_state_dict,
                language_code='en',
                version=0,
                linked_skill_ids=['skill_id'],
                question_state_data_schema_version=35))
        commit_cmd = (
            question_domain.QuestionChange({
                'cmd': question_domain.CMD_CREATE_NEW
            }))
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        migrated_translations_mapping = (
            question
            .question_state_data.written_translations.to_dict())
        self.assertEqual(
            migrated_translations_mapping,
            {
                'translations_mapping': {
                    'explanation': {
                        'en': {
                            'data_format': 'html',
                            'translation': '<p>test</p>',
                            'needs_update': True
                        }
                    }
                }
            })

        # Test migration of PencilCodeEditor customization argument from
        # intial_code to intialCode.
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'initial_code': {
                        'value': 'code'
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': {},
                'id': 'PencilCodeEditor'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }

        question_model = (
            question_models.QuestionModel(
                id='question_id',
                question_state_data=question_state_dict,
                language_code='en',
                version=0,
                linked_skill_ids=['skill_id'],
                question_state_data_schema_version=35))
        commit_cmd = (
            question_domain.QuestionChange({
                'cmd': question_domain.CMD_CREATE_NEW
            }))
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        migrated_ca = question.question_state_data.to_dict()['interaction'][
            'customization_args']
        self.assertEqual(
            migrated_ca,
            {
                'initialCode': {
                    'value': 'code'
                }
            })

        # Test population of default value of SubtitledHtml list.
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': {},
                'id': 'MultipleChoiceInput'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }

        question_model = (
            question_models.QuestionModel(
                id='question_id',
                question_state_data=question_state_dict,
                language_code='en',
                version=0,
                linked_skill_ids=['skill_id'],
                question_state_data_schema_version=35))
        commit_cmd = (
            question_domain.QuestionChange({
                'cmd': question_domain.CMD_CREATE_NEW
            }))
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        migrated_ca = question.question_state_data.to_dict()['interaction'][
            'customization_args']
        self.assertEqual(
            migrated_ca,
            {
                'choices': {
                    'value': [{'content_id': 'ca_choices_0', 'html': ''}]
                },
                'showChoicesInShuffledOrder': {'value': True}
            })

        # Test migration of html list to SubtitledHtml list.
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'choices': {
                        'value': ['one', 'two', 'three']
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': {},
                'id': 'MultipleChoiceInput'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }

        question_model = (
            question_models.QuestionModel(
                id='question_id',
                question_state_data=question_state_dict,
                language_code='en',
                version=0,
                linked_skill_ids=['skill_id'],
                question_state_data_schema_version=35))
        commit_cmd = (
            question_domain.QuestionChange({
                'cmd': question_domain.CMD_CREATE_NEW
            }))
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        migrated_ca = question.question_state_data.to_dict()['interaction'][
            'customization_args']
        self.assertEqual(
            migrated_ca,
            {
                'choices': {
                    'value': [{
                        'content_id': 'ca_choices_0',
                        'html': 'one'
                    }, {
                        'content_id': 'ca_choices_1',
                        'html': 'two'
                    }, {
                        'content_id': 'ca_choices_2',
                        'html': 'three'
                    }]
                },
                'showChoicesInShuffledOrder': {'value': True}
            })

    def test_migrate_question_state_from_v36_to_latest(self):
        # Test restructuring of written_translations.
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {}
            },
            'interaction': {
                'answer_groups': [{
                    'outcome': {
                        'dest': None,
                        'feedback': {
                            'content_id': 'feedback_1',
                            'html': 'Correct Answer'
                        },
                        'param_changes': [],
                        'refresher_exploration_id': None,
                        'labelled_as_correct': True,
                        'missing_prerequisite_skill_id': None
                    },
                    'rule_specs': [{
                        'inputs': {'x': 'test'},
                        'rule_type': 'CaseSensitiveEquals'
                    }],
                    'tagged_skill_misconception_id': None,
                    'training_data': []
                }],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'placeholder': {
                        'value': {
                            'content_id': 'ca_placeholder_0',
                            'unicode_str': ''
                        }
                    },
                    'rows': {'value': 1}
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': {},
                'id': 'TextInput'
            },
            'next_content_id_index': 2,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }

        question_model = (
            question_models.QuestionModel(
                id='question_id',
                question_state_data=question_state_dict,
                language_code='en',
                version=0,
                linked_skill_ids=['skill_id'],
                question_state_data_schema_version=36))
        commit_cmd = (
            question_domain.QuestionChange({
                'cmd': question_domain.CMD_CREATE_NEW
            }))
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        migrated_rule_spec = (
            question
            .question_state_data
            .interaction.answer_groups[0]
            .rule_specs[0].to_dict())
        self.assertEqual(
            migrated_rule_spec,
            {
                'inputs': {'x': {
                    'contentId': 'rule_input_2',
                    'normalizedStrSet': ['test']
                }},
                'rule_type': 'Equals'
            })

    def test_migrate_question_state_from_v37_to_latest(self):
        answer_group = {
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
                    'x': '((x)^(2))/(2.5)-(alpha)/(beta)'
                },
                'rule_type': 'MatchesExactlyWith'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {},
                'id': 'AlgebraicExpressionInput'
            },
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=37)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        cust_args = question.question_state_data.interaction.customization_args
        self.assertEqual(
            cust_args['customOskLetters'].value, ['x', 'α', 'β'])

    def test_migrate_question_state_from_v38_to_latest(self):
        answer_group = {
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
                    'x': '1/2'
                },
                'rule_type': 'MatchesExactlyWith'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {},
                'id': 'NumericExpressionInput'
            },
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=38)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        cust_args = question.question_state_data.interaction.customization_args
        self.assertEqual(
            cust_args['placeholder'].value.unicode_str,
            'Type an expression here, using only numbers.')

    def test_migrate_question_state_with_text_input_from_v40_to_latest(self):
        answer_group = {
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
                    'x': ['Test']
                },
                'rule_type': 'Equals'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'placeholder': {
                        'value': {
                            'content_id': 'ca_placeholder_0',
                            'unicode_str': ''
                        }
                    },
                    'rows': {'value': 1}
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': {},
                'id': 'TextInput'
            },
            'next_content_id_index': 4,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=40)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        answer_group = question.question_state_data.interaction.answer_groups[0]
        rule_spec = answer_group.rule_specs[0]
        self.assertEqual(
            rule_spec.inputs['x'],
            {
                'contentId': 'rule_input_4',
                'normalizedStrSet': ['Test']
            })
        self.assertEqual(question.question_state_data.next_content_id_index, 5)

    def test_migrate_question_state_with_set_input_from_v40_to_latest(self):
        answer_group = {
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
                    'x': ['Test']
                },
                'rule_type': 'Equals'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'buttonText': {
                        'value': {
                            'content_id': 'ca_buttonText_0',
                            'unicode_str': ''
                        }
                    },
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': {},
                'id': 'SetInput'
            },
            'next_content_id_index': 4,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=40)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        answer_group = question.question_state_data.interaction.answer_groups[0]
        rule_spec = answer_group.rule_specs[0]
        self.assertEqual(
            rule_spec.inputs['x'],
            {
                'contentId': 'rule_input_4',
                'unicodeStrSet': ['Test']
            })
        self.assertEqual(question.question_state_data.next_content_id_index, 5)

    def test_migrate_question_state_from_v41_with_item_selection_input_interaction_to_latest(self): # pylint: disable=line-too-long
        answer_group = {
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
                    'x': ['<p>Choice 1</p>', '<p>Choice 2</p>']
                },
                'rule_type': 'Equals'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_2',
                            'html': '<p>Choice 1</p>'
                        }, {
                            'content_id': 'ca_choices_3',
                            'html': '<p>Choice 2</p>'
                        }]
                    },
                    'maxAllowableSelectionCount': {'value': 2},
                    'minAllowableSelectionCount': {'value': 1}
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': {
                    'answer_is_exclusive': True,
                    'correct_answer': ['<p>Choice 1</p>'],
                    'explanation': {
                        'content_id': 'solution',
                        'html': 'This is <i>solution</i> for state1'
                    }
                },
                'id': 'ItemSelectionInput'
            },
            'next_content_id_index': 4,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=41)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        answer_group = question.question_state_data.interaction.answer_groups[0]
        solution = question.question_state_data.interaction.solution
        rule_spec = answer_group.rule_specs[0]
        self.assertEqual(
            rule_spec.inputs['x'],
            ['ca_choices_2', 'ca_choices_3'])
        self.assertEqual(
            solution.correct_answer, ['ca_choices_2'])

    def test_migrate_question_state_from_v41_with_drag_and_drop_sort_input_interaction_to_latest(self): # pylint: disable=line-too-long
        answer_group = {
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
                    'x': [['<p>Choice 1</p>', '<p>Choice 2</p>', 'invalid']]
                },
                'rule_type': 'IsEqualToOrdering'
            }, {
                'inputs': {
                    'x': [['<p>Choice 1</p>']]
                },
                'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition'
            }, {
                'inputs': {
                    'x': '<p>Choice 1</p>',
                    'y': 1
                },
                'rule_type': 'HasElementXAtPositionY'
            }, {
                'inputs': {
                    'x': '<p>Choice 1</p>',
                    'y': '<p>Choice 2</p>'
                },
                'rule_type': 'HasElementXBeforeElementY'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {}
            },
            'written_translations': {
                'translations_mapping': {
                    'explanation': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'allowMultipleItemsInSamePosition': {'value': True},
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_2',
                            'html': '<p>Choice 1</p>'
                        }, {
                            'content_id': 'ca_choices_3',
                            'html': '<p>Choice 2</p>'
                        }]
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': {
                    'answer_is_exclusive': True,
                    'correct_answer': [['<p>Choice 1</p>', '<p>Choice 2</p>']],
                    'explanation': {
                        'content_id': 'solution',
                        'html': 'This is <i>solution</i> for state1'
                    }
                },
                'id': 'DragAndDropSortInput'
            },
            'next_content_id_index': 4,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=41)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        question = question_fetchers.get_question_from_model(question_model)
        self.assertEqual(
            question.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        answer_group = question.question_state_data.interaction.answer_groups[0]
        solution = question.question_state_data.interaction.solution
        self.assertEqual(
            answer_group.rule_specs[0].inputs['x'],
            [['ca_choices_2', 'ca_choices_3', 'invalid_content_id']])
        self.assertEqual(
            answer_group.rule_specs[1].inputs['x'],
            [['ca_choices_2']])
        self.assertEqual(
            answer_group.rule_specs[2].inputs['x'],
            'ca_choices_2')
        self.assertEqual(
            answer_group.rule_specs[3].inputs,
            {'x': 'ca_choices_2', 'y': 'ca_choices_3'})
        self.assertEqual(
            solution.correct_answer, [['ca_choices_2', 'ca_choices_3']])
