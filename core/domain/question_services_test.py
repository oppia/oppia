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

from __future__ import annotations

import logging
import re

from core import feconf
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import translation_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Callable, Dict, List, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import question_models

(question_models,) = models.Registry.import_models([models.Names.QUESTION])


class QuestionServicesUnitTest(test_utils.GenericTestBase):
    """Test the question services module."""

    def setUp(self) -> None:
        """Before each individual test, create dummy user."""
        super().setUp()
        self.signup(self.TOPIC_MANAGER_EMAIL, self.TOPIC_MANAGER_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.topic_manager_id = self.get_user_id_from_email(
            self.TOPIC_MANAGER_EMAIL)
        self.new_user_id = self.get_user_id_from_email(
            self.NEW_USER_EMAIL)
        self.editor_id = self.get_user_id_from_email(
            self.EDITOR_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.new_user = user_services.get_user_actions_info(self.new_user_id)
        self.editor = user_services.get_user_actions_info(self.editor_id)

        self.topic_id = topic_fetchers.get_new_topic_id()
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1], next_subtopic_id=2)

        self.set_topic_managers([self.TOPIC_MANAGER_USERNAME], self.topic_id)

        self.topic_manager = user_services.get_user_actions_info(
            self.topic_manager_id)

        self.save_new_skill(
            'skill_1', self.admin_id, description='Skill Description 1')
        self.save_new_skill(
            'skill_2', self.admin_id, description='Skill Description 2')
        self.save_new_skill(
            'skill_3', self.admin_id, description='Skill Description 3')

        self.question_id = question_services.get_new_question_id()
        self.content_id_generator = translation_domain.ContentIdGenerator()
        self.question = self.save_new_question(
            self.question_id, self.editor_id,
            self._create_valid_question_data('ABC', self.content_id_generator),
            ['skill_1'],
            self.content_id_generator.next_content_id_index,
            inapplicable_skill_misconception_ids=[
                'skillid12345-1', 'skillid12345-2'])

        self.question_id_1 = question_services.get_new_question_id()
        self.content_id_generator_1 = translation_domain.ContentIdGenerator()
        self.question_1 = self.save_new_question(
            self.question_id_1, self.editor_id,
            self._create_valid_question_data(
                'ABC', self.content_id_generator_1),
            ['skill_2'],
            self.content_id_generator_1.next_content_id_index)

        self.question_id_2 = question_services.get_new_question_id()
        self.content_id_generator_2 = translation_domain.ContentIdGenerator()
        self.question_2 = self.save_new_question(
            self.question_id_2, self.editor_id,
            self._create_valid_question_data(
                'ABC', self.content_id_generator_2),
            ['skill_2'],
            self.content_id_generator_2.next_content_id_index)

    def test_get_question_by_id(self) -> None:
        question = question_services.get_question_by_id(self.question_id)

        self.assertEqual(question.id, self.question_id)
        question_with_none = question_services.get_question_by_id(
            'question_id', strict=False)
        self.assertIsNone(question_with_none)

        with self.assertRaisesRegex(
            Exception, 'Entity for class QuestionModel with id question_id '
            'not found'):
            question_services.get_question_by_id('question_id')

    def test_get_questions_by_skill_ids_with_fetch_by_difficulty(self) -> None:
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_1, 'skill_2', 0.8)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_2, 'skill_2', 0.5)

        questions = question_services.get_questions_by_skill_ids(
            2, ['skill_1', 'skill_2'], True)
        sort_fn: Callable[[question_domain.Question], float] = (
            lambda question: question.last_updated.timestamp()
            if question.last_updated else 0
        )
        questions.sort(key=sort_fn)

        self.assertEqual(len(questions), 2)
        self.assertEqual(questions[0].to_dict(), self.question.to_dict())
        self.assertEqual(questions[1].to_dict(), self.question_2.to_dict())

    def test_get_total_question_count_for_skill_ids(self) -> None:
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

    def test_update_question_skill_link_difficulty(self) -> None:
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)

        _, merged_question_skill_links = (
            question_services.get_displayable_question_skill_link_details(
                2, ['skill_1'], 0))
        self.assertEqual(
            merged_question_skill_links[0].skill_difficulties, [0.3])

        question_services.update_question_skill_link_difficulty(
            self.question_id, 'skill_1', 0.9)

        _, merged_question_skill_links = (
            question_services.get_displayable_question_skill_link_details(
                2, ['skill_1'], 0))
        self.assertEqual(
            merged_question_skill_links[0].skill_difficulties, [0.9])

        with self.assertRaisesRegex(
            Exception, 'The given question and skill are not linked.'):
            question_services.update_question_skill_link_difficulty(
                self.question_id, 'skill_10', 0.9)

    def test_get_questions_by_skill_ids_without_fetch_by_difficulty(
        self
    ) -> None:
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_1, 'skill_2', 0.8)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_2, 'skill_2', 0.5)

        questions = question_services.get_questions_by_skill_ids(
            4, ['skill_1', 'skill_2'], False)
        sort_fn: Callable[[question_domain.Question], float] = (
            lambda question: question.last_updated.timestamp()
            if question.last_updated else 0
        )
        questions.sort(key=sort_fn)

        self.assertEqual(len(questions), 3)
        self.assertEqual(questions[0].to_dict(), self.question.to_dict())
        self.assertEqual(questions[1].to_dict(), self.question_1.to_dict())
        self.assertEqual(questions[2].to_dict(), self.question_2.to_dict())

    def test_get_questions_by_skill_ids_raise_error_with_high_question_count(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Question count is too high, please limit the question '
            'count to %d.' % feconf.MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME):
            question_services.get_questions_by_skill_ids(
                25, ['skill_1', 'skill_2'], False)

    def test_create_multi_question_skill_links_for_question(self) -> None:
        content_id_generator = translation_domain.ContentIdGenerator()
        self.question = self.save_new_question(
            self.question_id, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_1'],
            content_id_generator.next_content_id_index)

        with self.assertRaisesRegex(
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

    def test_delete_question_skill_link(self) -> None:
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

    def test_linking_same_skill_to_question_twice(self) -> None:
        question_id_2 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_1'],
            content_id_generator.next_content_id_index)
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

    def test_create_and_get_question_skill_link(self) -> None:
        question_id_2 = question_services.get_new_question_id()
        with self.assertRaisesRegex(
            Exception,
            re.escape(
                'Entity for class QuestionModel with id %s not found' % (
                    question_id_2))):
            question_services.create_new_question_skill_link(
                self.editor_id, question_id_2, 'skill_1', 0.5)

        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_1'],
            content_id_generator.next_content_id_index)

        question_id_3 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_2'],
            content_id_generator.next_content_id_index)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.5)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_3', 0.8)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_2, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_3, 'skill_2', 0.2)

        question_summaries_with_none, merged_question_skill_links = (
            question_services.get_displayable_question_skill_link_details(
                5, ['skill_1', 'skill_2', 'skill_3'], 0))

        with self.assertRaisesRegex(
            Exception, 'Querying linked question summaries for more than 3 '
            'skills at a time is not supported currently.'):
            question_services.get_displayable_question_skill_link_details(
                5, ['skill_1', 'skill_2', 'skill_3', 'skill_4'], 0)
        question_ids = []
        for summary in question_summaries_with_none:
            # Ruling out the possibility of None for mypy type checking.
            assert summary is not None
            question_ids.append(summary.id)

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

        question_summaries_with_none, merged_question_skill_links = (
            question_services.get_displayable_question_skill_link_details(
                5, ['skill_1', 'skill_3'], 0))
        question_ids = []
        for summary in question_summaries_with_none:
            # Ruling out the possibility of None for mypy type checking.
            assert summary is not None
            question_ids.append(summary.id)
        self.assertEqual(len(question_ids), 2)
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2])

        with self.assertRaisesRegex(
            Exception,
            'The question with ID %s is already linked to skill skill_1' % (
                self.question_id
            )
        ):
            question_services.create_new_question_skill_link(
                self.editor_id, self.question_id, 'skill_1', 0.3)

    def test_get_displayable_question_skill_link_details_with_no_skill_ids(
        self
    ) -> None:
        question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_1'],
            content_id_generator.next_content_id_index)

        question_services.create_new_question_skill_link(
            self.editor_id, question_id, 'skill_1', 0.5)

        question_summaries, merged_question_skill_links = (
            question_services.get_displayable_question_skill_link_details(
                2, [], 0))

        self.assertEqual(question_summaries, [])
        self.assertEqual(merged_question_skill_links, [])

    def test_get_question_skill_links_of_skill(self) -> None:
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
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_1'],
            content_id_generator.next_content_id_index)

        question_id_3 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_2'],
            content_id_generator.next_content_id_index)
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

    def test_get_question_summaries_by_ids(self) -> None:
        question_summaries = question_services.get_question_summaries_by_ids([
            self.question_id, 'invalid_question_id'])

        # Ruling out the possibility of None for mypy type checking.
        assert question_summaries[0] is not None
        self.assertEqual(len(question_summaries), 2)
        self.assertEqual(question_summaries[0].id, self.question_id)
        self.assertEqual(
            question_summaries[0].question_content,
            feconf.DEFAULT_INIT_STATE_CONTENT_STR)
        self.assertIsNone(question_summaries[1])

    def test_delete_question(self) -> None:
        question_summary_model = question_models.QuestionSummaryModel.get(
            self.question_id)
        self.assertFalse(question_summary_model is None)

        question_services.delete_question(self.editor_id, self.question_id)

        with self.assertRaisesRegex(Exception, (
            'Entity for class QuestionModel with id %s not found' % (
                self.question_id))):
            question_models.QuestionModel.get(self.question_id)

        with self.assertRaisesRegex(Exception, (
            'Entity for class QuestionSummaryModel with id %s not found' % (
                self.question_id))):
            question_models.QuestionSummaryModel.get(self.question_id)

    def test_delete_question_marked_deleted(self) -> None:
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

    def test_delete_question_model_with_deleted_summary_model(self) -> None:
        question_summary_model = (
            question_models.QuestionSummaryModel.get(self.question_id))
        question_summary_model.delete()
        question_summary_model_with_none = (
            question_models.QuestionSummaryModel.get(
                self.question_id, strict=False
            )
        )
        self.assertIsNone(question_summary_model_with_none)

        question_services.delete_question(
            self.editor_id, self.question_id, force_deletion=True)
        question_model = question_models.QuestionModel.get_by_id(
            self.question_id)
        self.assertEqual(question_model, None)
        self.assertEqual(
            question_models.QuestionSummaryModel.get(
                self.question_id, strict=False), None)

    def test_update_question(self) -> None:
        new_question_data = self._create_valid_question_data(
            'DEF', self.content_id_generator)
        change_list = [question_domain.QuestionChange({
            'cmd': 'update_question_property',
            'property_name': 'next_content_id_index',
            'old_value': 0,
            'new_value': self.content_id_generator.next_content_id_index,
        }), question_domain.QuestionChange({
            'cmd': 'update_question_property',
            'property_name': 'question_state_data',
            'new_value': new_question_data.to_dict(),
            'old_value': self.question.question_state_data.to_dict()
        })]
        question_services.update_question(
            self.editor_id, self.question_id, change_list,
            'updated question data')

        question = question_services.get_question_by_id(self.question_id)
        self.assertEqual(
            question.question_state_data.to_dict(), new_question_data.to_dict())
        self.assertEqual(question.version, 2)

    def test_cannot_update_question_with_no_commit_message(self) -> None:
        new_question_data = self._create_valid_question_data(
            'DEF', self.content_id_generator)
        change_list = [question_domain.QuestionChange({
            'cmd': 'update_question_property',
            'property_name': 'question_state_data',
            'new_value': new_question_data.to_dict(),
            'old_value': self.question.question_state_data.to_dict()
        }), question_domain.QuestionChange({
            'cmd': 'update_question_property',
            'property_name': 'next_content_id_index',
            'old_value': 0,
            'new_value': self.content_id_generator.next_content_id_index,
        })]

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            Exception, 'Expected a commit message, received none.'):
            question_services.update_question(
                self.editor_id, self.question_id, change_list, None)  # type: ignore[arg-type]

    def test_cannot_update_question_with_no_change_list(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: received an invalid change list when trying to '
            'save question'):
            question_services.update_question(
                self.editor_id, self.question_id, [],
                'updated question data')

    def test_update_question_language_code(self) -> None:
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

    def test_update_inapplicable_skill_misconception_ids(self) -> None:
        self.assertEqual(
            self.question.inapplicable_skill_misconception_ids,
            ['skillid12345-1', 'skillid12345-2'])
        change_dict: Dict[str, Union[str, List[str]]] = {
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

    def test_cannot_update_question_with_invalid_change_list(self) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_context_manager = self.assertRaisesRegex(
            Exception, '\'str\' object has no attribute \'cmd\'')

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with logging_swap, assert_raises_context_manager:
            question_services.update_question(
                self.editor_id, self.question_id, 'invalid_change_list',  # type: ignore[arg-type]
                'updated question language code')

        self.assertEqual(len(observed_log_messages), 1)
        self.assertRegex(
            observed_log_messages[0],
            'object has no attribute \'cmd\' %s '
            'invalid_change_list' % self.question_id)

    def test_cannot_update_question_with_mismatch_of_versions(
        self
    ) -> None:
        changelist = [question_domain.QuestionChange({
            'cmd': 'update_question_property',
            'property_name': 'language_code',
            'new_value': 'bn',
            'old_value': 'en'
        })]
        with self.assertRaisesRegex(
            Exception,
            'Trying to update version 2 of question from version 1, '
            'which is too old. Please reload the page and try again.'):
            question_services.update_question(
                self.editor_id, self.question_id_2,
                changelist, 'change language_code', 2)

        question_model = question_models.QuestionModel.get(self.question_id_2)
        question_model.version = 100
        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: trying to update version 1 of question '
            'from version 100. Please reload the page and try again.'):
            question_services.update_question(
                self.editor_id, self.question_id_2,
                changelist, 'change language_code', 1)

    def test_replace_skill_id_for_all_questions(self) -> None:
        question_id_2 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_1'],
            content_id_generator.next_content_id_index)

        question_id_3 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_2'],
            content_id_generator.next_content_id_index)
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
            # Ruling out the possibility of None for mypy type checking.
            assert question is not None
            if question.id in ([self.question_id, question_id_2]):
                self.assertItemsEqual(question.linked_skill_ids, ['skill_3'])
            else:
                self.assertItemsEqual(question.linked_skill_ids, ['skill_2'])

    def test_compute_summary_of_question(self) -> None:
        question = question_services.get_question_by_id(self.question_id)
        question_summary = question_services.compute_summary_of_question(
            question)

        self.assertEqual(question_summary.id, self.question_id)
        self.assertEqual(
            question_summary.question_content,
            feconf.DEFAULT_INIT_STATE_CONTENT_STR)

    def test_raises_error_while_computing_summary_if_interaction_id_is_none(
        self
    ) -> None:
        question = question_services.get_question_by_id(self.question_id)
        question.question_state_data.interaction.id = None

        with self.assertRaisesRegex(
            Exception,
            'No interaction_id found for the given question.'
        ):
            question_services.compute_summary_of_question(question)

    def test_raises_error_when_the_question_provided_with_no_created_on_data(
        self
    ) -> None:

        question = question_services.get_question_by_id(self.question_id)
        question.created_on = None

        with self.assertRaisesRegex(
            Exception,
            'No data available for when the question was last_updated'
        ):
            question_services.compute_summary_of_question(question)

    def test_get_skills_of_question(self) -> None:
        # If the question id doesnt exist at all, it returns an empty list.
        with self.assertRaisesRegex(
            Exception, 'Entity for class QuestionModel with id '
            'non_existent_question_id not found'):
            question_services.get_skills_linked_to_question(
                'non_existent_question_id')
        question_id_2 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_1'],
            content_id_generator.next_content_id_index)

        question_id_3 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_2'],
            content_id_generator.next_content_id_index)
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

    def test_get_interaction_id_for_question(self) -> None:
        self.assertEqual(
            question_services.get_interaction_id_for_question(
                self.question_id), 'TextInput')
        with self.assertRaisesRegex(Exception, 'No questions exists with'):
            question_services.get_interaction_id_for_question('fake_q_id')

    def test_untag_deleted_misconceptions_on_no_change_to_skill(self) -> None:
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
        content_id_generator = translation_domain.ContentIdGenerator()
        question_state_data = self._create_valid_question_data(
            'state name', content_id_generator)
        feedback_content_ids = [
            content_id_generator.generate(
                translation_domain.ContentType.FEEDBACK)
            for _ in range(3)]
        rule_content_ids = [
            content_id_generator.generate(
                translation_domain.ContentType.RULE, extra_prefix='input')
            for _ in range(3)]
        question_state_data.interaction.answer_groups = [
            state_domain.AnswerGroup.from_dict({
                'outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': feedback_content_ids[0],
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
                            'contentId': rule_content_ids[0],
                            'normalizedStrSet': ['Test0']
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': feedback_content_ids[1],
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
                            'contentId': rule_content_ids[1],
                            'normalizedStrSet': ['Test1']
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': feedback_content_ids[2],
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
                            'contentId': rule_content_ids[2],
                            'normalizedStrSet': ['Test2']
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skillid12345-2'
            })
        ]
        question_state_data.recorded_voiceovers.voiceovers_mapping.update({
            content_id: {} for content_id in (
                feedback_content_ids + rule_content_ids)
        })

        inapplicable_skill_misconception_ids = [
            'skillid12345-3',
            'skillid12345-4'
        ]
        self.question = self.save_new_question(
            self.question_id, self.editor_id,
            question_state_data, ['skillid12345'],
            content_id_generator.next_content_id_index,
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

    def test_untag_deleted_misconceptions_correctly_on_updating_skill(
        self
    ) -> None:
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
        content_id_generator = translation_domain.ContentIdGenerator()
        question_state_data = self._create_valid_question_data(
            'state name', content_id_generator)
        feedback_content_ids = [
            content_id_generator.generate(
                translation_domain.ContentType.FEEDBACK)
            for _ in range(3)]
        rule_content_ids = [
            content_id_generator.generate(
                translation_domain.ContentType.RULE, extra_prefix='input')
            for _ in range(3)]
        question_state_data.interaction.answer_groups = [
            state_domain.AnswerGroup.from_dict({
                'outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': feedback_content_ids[0],
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
                            'contentId': rule_content_ids[0],
                            'normalizedStrSet': ['Test0']
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': feedback_content_ids[1],
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
                            'contentId': rule_content_ids[1],
                            'normalizedStrSet': ['Test1']
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': feedback_content_ids[2],
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
                            'contentId': rule_content_ids[2],
                            'normalizedStrSet': ['Test2']
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': 'skillid12345-2'
            })
        ]
        question_state_data.recorded_voiceovers.voiceovers_mapping.update({
            content_id: {} for content_id in (
                feedback_content_ids + rule_content_ids)
        })
        inapplicable_skill_misconception_ids = [
            'skillid12345-3',
            'skillid12345-4'
        ]
        self.question = self.save_new_question(
            self.question_id, self.editor_id,
            question_state_data, ['skillid12345'],
            content_id_generator.next_content_id_index,
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

    def test_populate_question_model_fields(self) -> None:
        model = question_models.QuestionModel(
            id=self.question_id,
            question_state_data={},
            language_code='en',
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=(
                feconf.CURRENT_STATE_SCHEMA_VERSION)
        )
        question = question_services.get_question_by_id(self.question_id)
        populated_model = question_services.populate_question_model_fields(
            model, question)

        self.assertEqual(
            populated_model.question_state_data,
            question.question_state_data.to_dict())

        self.assertEqual(
            populated_model.question_state_data_schema_version,
            question.question_state_data_schema_version
        )
        self.assertEqual(
            populated_model.next_content_id_index,
            question.next_content_id_index
        )
        self.assertEqual(populated_model.language_code, question.language_code)
        self.assertEqual(
            populated_model.linked_skill_ids,
            question.linked_skill_ids
        )
        self.assertEqual(
            populated_model.inapplicable_skill_misconception_ids,
            question.inapplicable_skill_misconception_ids
        )

    def test_populate_question_summary_model_fields(self) -> None:
        question = question_services.get_question_by_id(self.question_id)
        question_summary = question_services.compute_summary_of_question(
            question
        )
        question_services.save_question_summary(question_summary)
        summary_model = question_models.QuestionSummaryModel.get(
            self.question_id
        )
        populated_model = (
            question_services.populate_question_summary_model_fields(
            summary_model, question_summary)
        )
        self.assertEqual(
            populated_model.question_model_last_updated,
            question_summary.last_updated
        )
        self.assertEqual(
            populated_model.question_model_created_on,
            question_summary.created_on
        )
        self.assertEqual(
            populated_model.question_content,
            question_summary.question_content
        )
        self.assertEqual(populated_model.version, question_summary.version)
        self.assertEqual(
            populated_model.interaction_id,
            question_summary.interaction_id
        )
        self.assertEqual(
            populated_model.misconception_ids,
            question_summary.misconception_ids
        )

    def test_populate_question_summary_model_fields_with_no_input_model(
        self
    ) -> None:
        question = question_services.get_question_by_id(self.question_id)
        question_summary = question_services.compute_summary_of_question(
            question
        )
        question_services.save_question_summary(question_summary)
        # Here we use MyPy ignore because we need to test
        # populate_question_summary_model_fields when the there is no
        # input QuestionSummaryModel.
        populated_model = (
            question_services.populate_question_summary_model_fields(
            None, question_summary)  # type: ignore[arg-type]
        )
        self.assertEqual(
            populated_model.question_model_last_updated,
            question_summary.last_updated
        )
        self.assertEqual(
            populated_model.question_model_created_on,
            question_summary.created_on
        )
        self.assertEqual(
            populated_model.question_content,
            question_summary.question_content
        )
        self.assertEqual(populated_model.version, question_summary.version)
        self.assertEqual(
            populated_model.interaction_id,
            question_summary.interaction_id
        )
        self.assertEqual(
            populated_model.misconception_ids,
            question_summary.misconception_ids
        )


class QuestionMigrationTests(test_utils.GenericTestBase):

    def test_migrate_question_state_from_v29_to_latest(self) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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

    def test_migrate_question_state_from_v30_to_latest(self) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
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
                    },
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                    'ca_placeholder_6': {},
                    'content_0': {
                        'en': {
                            'filename': 'test.mp3',
                            'file_size_bytes': 100,
                            'needs_update': False,
                            'duration_secs': 0.0
                        }
                    },
                    'rule_input_3': {},
                    'hint_4': {},
                    'default_outcome_1': {},
                    'feedback_2': {},
                    'solution_5': {}
                }
            })

    def test_migrate_question_state_from_v31_to_latest(self) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                'solution': None,
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
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(
            cust_args['buttonText'].value,
            state_domain.SubtitledUnicode
        )
        self.assertEqual(
            cust_args['buttonText'].value.unicode_str,
            'Add item')

    def test_migrate_question_state_from_v32_to_latest(self) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                'solution': None,
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

    def test_migrate_question_state_from_v33_to_latest(self) -> None:
        feedback_html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;" svg_filename-with-value="&a'
            'mp;quot;abc.svg&amp;quot;"></oppia-noninteractive-math>')
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                'solution': None,
                'id': 'MultipleChoiceInput'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        expected_feeedback_html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;abc.svg&amp;quot;}">'
            '</oppia-noninteractive-math>')
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

    def test_migrate_question_state_from_v34_to_latest(self) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                        'content_id': 'explanation_1'
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
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                        'content_id': 'explanation_1'
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
        self.assertEqual(len(answer_groups[0].rule_specs), 2)
        self.assertEqual(
            answer_groups[0].rule_specs[0].rule_type, 'MatchesExactlyWith')
        self.assertEqual(
            answer_groups[0].rule_specs[0].inputs, {'x': 'x+y'})

        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                        'content_id': 'explanation_1'
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
                'dest_if_really_stuck': None,
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
                    'x': 'x=y'
                },
                'rule_type': 'IsMathematicallyEquivalentTo'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }, {
            'outcome': {
                'dest': 'Introduction',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'feedback_3': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
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
                    'dest_if_really_stuck': None,
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
            'MathEquationInput')
        self.assertEqual(len(answer_groups), 1)
        self.assertEqual(
            answer_groups[0].rule_specs[0].rule_type, 'MatchesExactlyWith')
        self.assertEqual(
            answer_groups[0].rule_specs[0].inputs, {'x': 'x=y', 'y': 'both'})
        state_data = question.question_state_data
        self.assertEqual(sorted(
            state_data.recorded_voiceovers.voiceovers_mapping.keys()), [
                'content_0', 'default_outcome_1', 'feedback_2'])

    def test_migrate_question_state_from_v35_to_latest(self) -> None:
        # Test restructuring of written_translations.
        question_state_dict = {
            'content': {
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
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

        # Test migration of PencilCodeEditor customization argument from
        # intial_code to intialCode.
        question_state_dict = {
            'content': {
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
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
                    'value': [{'content_id': 'ca_choices_2', 'html': ''}]
                },
                'showChoicesInShuffledOrder': {'value': True}
            })

        # Test migration of html list to SubtitledHtml list.
        question_state_dict = {
            'content': {
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
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
                        'content_id': 'ca_choices_2',
                        'html': 'one'
                    }, {
                        'content_id': 'ca_choices_3',
                        'html': 'two'
                    }, {
                        'content_id': 'ca_choices_4',
                        'html': 'three'
                    }]
                },
                'showChoicesInShuffledOrder': {'value': True}
            })

    def test_migrate_question_state_from_v36_to_latest(self) -> None:
        # Test restructuring of written_translations.
        question_state_dict = {
            'content': {
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {},
                    'ca_placeholder_0': {},
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {},
                    'ca_placeholder_0': {},
                }
            },
            'interaction': {
                'answer_groups': [{
                    'outcome': {
                        'dest': None,
                        'dest_if_really_stuck': None,
                        'feedback': {
                            'content_id': 'default_outcome_2',
                            'html': 'Correct Ans2er'
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
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
                    'contentId': 'rule_input_3',
                    'normalizedStrSet': ['test']
                }},
                'rule_type': 'Equals'
            })

    def test_migrate_question_state_from_v37_to_latest(self) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                'solution': None,
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
            cust_args['allowedVariables'].value, ['x', 'α', 'β'])

    def test_migrate_question_state_from_v38_to_latest(self) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                'solution': None,
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
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(
            cust_args['placeholder'].value,
            state_domain.SubtitledUnicode
        )
        self.assertEqual(
            cust_args['placeholder'].value.unicode_str,
            'Type an expression here, using only numbers.')

    def test_migrate_question_state_with_text_input_from_v40_to_latest(
        self
    ) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_placeholder_0': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_placeholder_0': {},
                    'hint_1': {}
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
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

        answer_group_object = (
            question.question_state_data.interaction.answer_groups[0]
        )
        rule_spec = answer_group_object.rule_specs[0]
        self.assertEqual(
            rule_spec.inputs['x'],
            {
                'contentId': 'rule_input_3',
                'normalizedStrSet': ['Test']
            })

    def test_migrate_question_state_with_set_input_from_v40_to_latest(
        self
    ) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_buttonText_0': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'ca_buttonText_0': {},
                    'default_outcome_2': {},
                    'hint_1': {}
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
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

        answer_group_object = (
            question.question_state_data.interaction.answer_groups[0]
        )
        rule_spec = answer_group_object.rule_specs[0]
        self.assertEqual(
            rule_spec.inputs['x'],
            {
                'contentId': 'rule_input_3',
                'unicodeStrSet': ['Test']
            })

    def test_migrate_question_state_from_v41_with_item_selection_input_interaction_to_latest(  # pylint: disable=line-too-long
        self
    ) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_choices_2': {},
                    'ca_choices_3': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_choices_2': {},
                    'ca_choices_3': {},
                    'hint_1': {}
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                        'content_id': 'explanation_1',
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

        answer_group_object = question.question_state_data.interaction.answer_groups[0]
        solution = question.question_state_data.interaction.solution
        # Ruling out the possibility of None for mypy type checking.
        assert solution is not None
        rule_spec = answer_group_object.rule_specs[0]
        self.assertEqual(
            rule_spec.inputs['x'],
            ['ca_choices_4', 'ca_choices_5'])
        self.assertEqual(
            solution.correct_answer, ['ca_choices_4'])

    def test_migrate_question_state_from_v41_with_drag_and_drop_sort_input_interaction_to_latest(  # pylint: disable=line-too-long
        self
    ) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_choices_2': {},
                    'ca_choices_3': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_choices_2': {},
                    'ca_choices_3': {},
                    'hint_1': {}
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                        'content_id': 'explanation_1',
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

        answer_group_object = (
            question.question_state_data.interaction.answer_groups[0])
        solution = question.question_state_data.interaction.solution
        # Ruling out the possibility of None for mypy type checking.
        assert solution is not None
        self.assertEqual(
            answer_group_object.rule_specs[0].inputs['x'],
            [['ca_choices_4', 'ca_choices_5', 'invalid_content_id']])
        self.assertEqual(
            answer_group_object.rule_specs[1].inputs['x'],
            [['ca_choices_4']])
        self.assertEqual(
            answer_group_object.rule_specs[2].inputs['x'],
            'ca_choices_4')
        self.assertEqual(
            answer_group_object.rule_specs[3].inputs,
            {'x': 'ca_choices_4', 'y': 'ca_choices_5'})
        self.assertEqual(
            solution.correct_answer, [['ca_choices_4', 'ca_choices_5']])

    def test_migrate_question_state_from_v42_to_latest(self) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_placeholder_0': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_placeholder_0': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'placeholder': {
                        'value': {
                            'content_id': 'ca_placeholder_0',
                            'unicode_str': (
                                'Type an expression here, using only numbers.')
                        }
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
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
                'solution': None,
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
            question_state_data_schema_version=42)
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
            cust_args['useFractionForDivision'].value, True)

    def test_migrate_question_state_from_v43_to_latest(self) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_placeholder_0': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'ca_placeholder_0': {},
                    'hint_1': {}
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
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
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
            question_state_data_schema_version=43)
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

        linked_skill_id = question.question_state_data.linked_skill_id
        self.assertEqual(
            linked_skill_id, None)

    def test_migrate_question_state_from_v44_to_latest(self) -> None:
        answer_group = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'requireNonnegativeInput': {
                        'value': False
                    },
                    'rows': {'value': 1}
                },
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
                'id': 'NumericInput'
            },
            'next_content_id_index': 4,
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=44)
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
            cust_args['requireNonnegativeInput'].value, False)

    def test_migrate_question_state_from_v45_to_latest(self) -> None:
        answer_group1 = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                    'x': 'a - b'
                },
                'rule_type': 'ContainsSomeOf'
            }, {
                'inputs': {
                    'x': 'a - b'
                },
                'rule_type': 'MatchesExactlyWith'
            }, {
                'inputs': {
                    'x': 'a - b'
                },
                'rule_type': 'OmitsSomeOf'
            }, {
                'inputs': {
                    'x': 'a - b',
                    'y': []
                },
                'rule_type': 'MatchesWithGeneralForm'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        answer_group2 = {
            'outcome': {
                'dest': 'abc',
                'dest_if_really_stuck': None,
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
                    'x': 'a - b'
                },
                'rule_type': 'ContainsSomeOf'
            }, {
                'inputs': {
                    'x': 'a - b',
                    'y': []
                },
                'rule_type': 'MatchesWithGeneralForm'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
            'content': {
                'content_id': 'content',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'explanation_1': {},
                    'feedback_1': {},
                    'default_outcome_2': {},
                    'hint_1': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group1, answer_group2],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'customOskLetters': {
                        'value': ['a', 'b']
                    },
                    'useFractionForDivision': {
                        'value': False
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'solution': None,
                'id': 'AlgebraicExpressionInput'
            },
            'next_content_id_index': 4,
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'linked_skill_id': None,
            'classifier_model_id': None
        }
        question_model = question_models.QuestionModel(
            id='question_id',
            question_state_data=question_state_dict,
            language_code='en',
            version=0,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
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
        self.assertEqual(len(answer_groups), 1)
        rule_specs = answer_groups[0].rule_specs
        self.assertEqual(len(rule_specs), 1)
        self.assertEqual(rule_specs[0].rule_type, 'MatchesExactlyWith')

        cust_args = question.question_state_data.interaction.customization_args
        self.assertNotIn('customOskLetters', cust_args)
        self.assertIn('allowedVariables', cust_args)
