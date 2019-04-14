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

from core.domain import state_domain
from core.platform import models
from core.tests import test_utils

(question_models,) = models.Registry.import_models([models.NAMES.question])


class QuestionModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionModel class."""

    def test_create_question(self):
        state = state_domain.State.create_default_state('ABC')
        question_state_data = state.to_dict()
        language_code = 'en'
        version = 1
        question_model = question_models.QuestionModel.create(
            question_state_data, language_code, version)

        self.assertEqual(
            question_model.question_state_data, question_state_data)
        self.assertEqual(question_model.language_code, language_code)


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
                    question_state_data, language_code, version)


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
