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

"""Tests for core.storage.question.gae_models."""

import datetime
import types

from core.domain import skill_services
from core.domain import state_domain
from core.platform import models
from core.tests import test_utils

(question_models,) = models.Registry.import_models([models.NAMES.question])


class QuestionModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionModel class."""

    def test_create_question_empty_skill_id_list(self):
        state = state_domain.State.create_default_state('ABC')
        question_state_data = state.to_dict()
        language_code = 'en'
        version = 1
        question_model = question_models.QuestionModel.create(
            question_state_data, language_code, version, [])

        self.assertEqual(
            question_model.question_state_data, question_state_data)
        self.assertEqual(question_model.language_code, language_code)
        self.assertItemsEqual(question_model.linked_skill_ids, [])

    def test_create_question_with_skill_ids(self):
        state = state_domain.State.create_default_state('ABC')
        question_state_data = state.to_dict()
        linked_skill_ids = ['skill_id1', 'skill_id2']
        language_code = 'en'
        version = 1
        question_model = question_models.QuestionModel.create(
            question_state_data, language_code, version,
            linked_skill_ids)

        self.assertEqual(
            question_model.question_state_data, question_state_data)
        self.assertEqual(question_model.language_code, language_code)
        self.assertItemsEqual(
            question_model.linked_skill_ids, linked_skill_ids)

    def test_put_multi_questions(self):
        question_state_data = self._create_valid_question_data('ABC')
        linked_skill_ids = ['skill_id1', 'skill_id2']
        self.save_new_question(
            'question_id1', 'owner_id',
            question_state_data,
            linked_skill_ids)
        self.save_new_question(
            'question_id2', 'owner_id',
            question_state_data,
            linked_skill_ids)
        question_ids = ['question_id1', 'question_id2']

        self.assertItemsEqual(
            question_models.QuestionModel.get(question_ids[0]).linked_skill_ids,
            ['skill_id1', 'skill_id2'])
        self.assertItemsEqual(
            question_models.QuestionModel.get(question_ids[1]).linked_skill_ids,
            ['skill_id1', 'skill_id2'])

        question_model1 = question_models.QuestionModel.get(question_ids[0])
        question_model1.linked_skill_ids = ['skill_id3']
        question_model2 = question_models.QuestionModel.get(question_ids[1])
        question_model2.linked_skill_ids = ['skill_id3']

        question_models.QuestionModel.put_multi_questions(
            [question_model1, question_model2])
        self.assertEqual(question_models.QuestionModel.get(
            question_ids[0]).linked_skill_ids, ['skill_id3'])
        self.assertEqual(question_models.QuestionModel.get(
            question_ids[1]).linked_skill_ids, ['skill_id3'])


    def test_raise_exception_by_mocking_collision(self):
        state = state_domain.State.create_default_state('ABC')
        question_state_data = state.to_dict()
        language_code = 'en'
        version = 1

        with self.assertRaisesRegexp(
            Exception, 'The id generator for QuestionModel is producing too '
            'many collisions.'
            ):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                question_models.QuestionModel, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    question_models.QuestionModel)):
                question_models.QuestionModel.create(
                    question_state_data, language_code, version, set([]))


class QuestionSummaryModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionSummaryModel class."""

    def test_get_by_creator_id(self):
        question_summary_model_1 = question_models.QuestionSummaryModel(
            id='question_1',
            creator_id='user',
            question_content='Question 1',
            question_model_created_on=datetime.datetime.utcnow(),
            question_model_last_updated=datetime.datetime.utcnow()
        )
        question_summary_model_2 = question_models.QuestionSummaryModel(
            id='question_2',
            creator_id='user',
            question_content='Question 2',
            question_model_created_on=datetime.datetime.utcnow(),
            question_model_last_updated=datetime.datetime.utcnow()
        )
        question_summary_model_1.put()
        question_summary_model_2.put()

        question_summaries = (
            question_models.QuestionSummaryModel.get_by_creator_id('user'))
        self.assertEqual(len(question_summaries), 2)
        self.assertEqual(question_summaries[0].id, 'question_1')
        self.assertEqual(question_summaries[1].id, 'question_2')


class QuestionSkillLinkModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionSkillLinkModel class."""

    def test_create_question_skill_link(self):
        question_id = 'A Test Question Id'
        skill_id = 'A Test Skill Id'
        skill_difficulty = 0.4
        questionskilllink_model = question_models.QuestionSkillLinkModel.create(
            question_id, skill_id, skill_difficulty)

        self.assertEqual(questionskilllink_model.question_id, question_id)
        self.assertEqual(questionskilllink_model.skill_id, skill_id)
        self.assertEqual(
            questionskilllink_model.skill_difficulty, skill_difficulty)

    def test_put_multi_question_skill_link(self):
        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id1', 0.1)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id1', 0.5)
            )
        questionskilllink_model3 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id3', 'skill_id3', 0.8)
            )

        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3])

        question_skill_links = (
            question_models.QuestionSkillLinkModel.get_models_by_skill_id(
                'skill_id1')
        )
        self.assertEqual(len(question_skill_links), 2)
        question_ids = [question_skill.question_id for question_skill
                        in question_skill_links]
        self.assertEqual(question_ids, ['question_id1', 'question_id2'])

    def test_delete_multi_question_skill_link(self):
        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id1', 0.1)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id1', 0.5)
            )
        questionskilllink_model3 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id3', 'skill_id3', 0.8)
            )

        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3])

        question_skill_links = (
            question_models.QuestionSkillLinkModel.get_models_by_skill_id(
                'skill_id1')
        )
        self.assertEqual(len(question_skill_links), 2)
        question_ids = [question_skill.question_id for question_skill
                        in question_skill_links]
        self.assertEqual(question_ids, ['question_id1', 'question_id2'])

        question_models.QuestionSkillLinkModel.delete_multi_question_skill_links( #pylint: disable=line-too-long
            [questionskilllink_model1, questionskilllink_model2])
        question_skill_links = (
            question_models.QuestionSkillLinkModel.get_models_by_skill_id(
                'skill_id1')
        )
        self.assertEqual(len(question_skill_links), 0)
        question_skill_links = (
            question_models.QuestionSkillLinkModel.get_models_by_skill_id(
                'skill_id3')
        )
        self.assertEqual(len(question_skill_links), 1)
        self.assertEqual(question_skill_links[0].question_id, 'question_id3')

    def test_get_models_by_question_id(self):
        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id1', 0.1)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id1', 0.5)
            )
        questionskilllink_model3 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id3', 0.8)
            )

        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3])

        question_skill_links = (
            question_models.QuestionSkillLinkModel.get_models_by_question_id(
                'question_id2')
        )
        self.assertEqual(len(question_skill_links), 2)
        question_skill_links = (
            question_models.QuestionSkillLinkModel.get_models_by_question_id(
                'question_id3')
        )
        self.assertEqual(len(question_skill_links), 0)

    def test_get_question_skill_links_by_skill_ids(self):
        skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_1, 'user', 'Description 1')
        skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_2, 'user', 'Description 2')

        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', skill_id_1, 0.1)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', skill_id_1, 0.5)
            )
        questionskilllink_model3 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', skill_id_2, 0.8)
            )
        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3])

        question_skill_link_models, next_cursor_str = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_by_skill_ids( #pylint: disable=line-too-long
                1, [skill_id_1, skill_id_2], ''
            )
        )
        self.assertEqual(len(question_skill_link_models), 2)
        self.assertEqual(question_skill_link_models[0].skill_id, skill_id_2)
        self.assertEqual(question_skill_link_models[1].skill_id, skill_id_1)

        question_skill_link_models_2, next_cursor_str = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_by_skill_ids( #pylint: disable=line-too-long
                1, [skill_id_1, skill_id_2], next_cursor_str
            )
        )
        self.assertEqual(len(question_skill_link_models_2), 1)
        self.assertEqual(question_skill_link_models_2[0].skill_id, skill_id_1)

        self.assertNotEqual(
            question_skill_link_models[0], question_skill_link_models_2[0])

    def test_get_question_skill_links_by_skill_ids_many_skills(self):
        # Test the case when len(skill_ids) > constants.MAX_SKILLS_PER_QUESTION.
        skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_1, 'user', 'Description 1')
        skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_2, 'user', 'Description 2')
        skill_id_3 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_3, 'user', 'Description 3')
        skill_id_4 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_4, 'user', 'Description 4')

        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', skill_id_1, 0.1)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', skill_id_2, 0.5)
            )
        questionskilllink_model3 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', skill_id_3, 0.8)
            )
        questionskilllink_model4 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', skill_id_4, 0.3)
            )
        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3, questionskilllink_model4])

        question_skill_link_models, _ = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_by_skill_ids( #pylint: disable=line-too-long
                1, [skill_id_1, skill_id_2, skill_id_3, skill_id_4], ''
            )
        )
        self.assertEqual(len(question_skill_link_models), 3)
        self.assertEqual(question_skill_link_models[0].skill_id, skill_id_4)
        self.assertEqual(question_skill_link_models[1].skill_id, skill_id_3)
        self.assertEqual(question_skill_link_models[2].skill_id, skill_id_2)

    def test_get_question_skill_links_equidistributed_by_skill(self):
        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id1', 0.1)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id1', 0.5)
            )
        questionskilllink_model3 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id3', 'skill_id2', 0.8)
            )
        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3])
        question_skill_links = (
            question_models.QuestionSkillLinkModel.
            get_question_skill_links_equidistributed_by_skill(
                2, ['skill_id1', 'skill_id2']
            )
        )
        self.assertEqual(len(question_skill_links), 2)
        self.assertEqual(question_skill_links[0].skill_id, 'skill_id1')
        self.assertEqual(question_skill_links[1].skill_id, 'skill_id2')

    def test_get_more_question_skill_links_than_available(self):
        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id1', 0.1)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id1', 0.5)
            )
        questionskilllink_model3 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id3', 'skill_id2', 0.8)
            )
        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3])

        # Testing for queries that retrieve more questions than available.
        question_skill_links = (
            question_models.QuestionSkillLinkModel.
            get_question_skill_links_equidistributed_by_skill(
                4, ['skill_id1', 'skill_id2']
            )
        )
        self.assertEqual(len(question_skill_links), 3)
        self.assertEqual(question_skill_links[0].skill_id, 'skill_id1')
        self.assertEqual(question_skill_links[1].skill_id, 'skill_id1')
        self.assertEqual(question_skill_links[2].skill_id, 'skill_id2')

    def test_get_question_skill_links_when_count_not_evenly_divisible(self):
        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id1', 0.1)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id1', 0.5)
            )
        questionskilllink_model3 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id3', 'skill_id2', 0.8)
            )
        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3])

        # Testing for queries with not evenly divisible total_question_count.
        question_skill_links = (
            question_models.QuestionSkillLinkModel.
            get_question_skill_links_equidistributed_by_skill(
                3, ['skill_id1', 'skill_id2']
            )
        )
        self.assertEqual(len(question_skill_links), 3)
        self.assertEqual(question_skill_links[0].skill_id, 'skill_id1')
        self.assertEqual(question_skill_links[1].skill_id, 'skill_id1')
        self.assertEqual(question_skill_links[2].skill_id, 'skill_id2')
