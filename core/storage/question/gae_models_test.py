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

from __future__ import annotations

import random
import types

from core import utils
from core.constants import constants
from core.domain import skill_services
from core.domain import state_domain
from core.domain import translation_domain
from core.platform import models
from core.tests import test_utils

from typing import List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import question_models

(base_models, question_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.QUESTION
])


class QuestionSnapshotContentModelTests(test_utils.GenericTestBase):

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            question_models.QuestionSnapshotContentModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)


class QuestionModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            question_models.QuestionModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            question_models.QuestionModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_state_data': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_state_data_schema_version': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'linked_skill_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'next_content_id_index': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'inapplicable_skill_misconception_ids': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE)
        }
        self.assertEqual(
            question_models.QuestionModel.get_export_policy(),
            expected_export_policy_dict
        )

    def test_create_question_empty_skill_id_list(self) -> None:
        state = state_domain.State.create_default_state(
            'ABC', 'content_0', 'default_outcome_1')
        question_state_data = state.to_dict()
        language_code = 'en'
        version = 1
        question_model = question_models.QuestionModel.create(
            question_state_data, language_code, version, [], [], 2)

        self.assertEqual(
            question_model.question_state_data, question_state_data)
        self.assertEqual(question_model.language_code, language_code)
        self.assertItemsEqual(question_model.linked_skill_ids, [])

    def test_create_question_with_skill_ids(self) -> None:
        state = state_domain.State.create_default_state(
            'ABC', 'content_0', 'default_outcome_1')
        question_state_data = state.to_dict()
        linked_skill_ids = ['skill_id1', 'skill_id2']
        language_code = 'en'
        version = 1
        question_model = question_models.QuestionModel.create(
            question_state_data, language_code, version,
            linked_skill_ids, ['skill-1'], 2)

        self.assertEqual(
            question_model.question_state_data, question_state_data)
        self.assertEqual(question_model.language_code, language_code)
        self.assertItemsEqual(
            question_model.linked_skill_ids, linked_skill_ids)

    def test_create_question_with_inapplicable_skill_misconception_ids(
        self
    ) -> None:
        state = state_domain.State.create_default_state(
            'ABC', 'content_0', 'default_outcome_1')
        question_state_data = state.to_dict()
        linked_skill_ids = ['skill_id1', 'skill_id2']
        inapplicable_skill_misconception_ids = ['skill_id-1', 'skill_id-2']
        language_code = 'en'
        version = 1
        question_model = question_models.QuestionModel.create(
            question_state_data, language_code, version,
            linked_skill_ids, inapplicable_skill_misconception_ids, 2)

        self.assertItemsEqual(
            question_model.inapplicable_skill_misconception_ids,
            inapplicable_skill_misconception_ids)

    def test_put_multi_questions(self) -> None:
        content_id_generator = translation_domain.ContentIdGenerator()
        question_state_data = self._create_valid_question_data(
            'ABC', content_id_generator)
        linked_skill_ids = ['skill_id1', 'skill_id2']
        self.save_new_question(
            'question_id1', 'owner_id',
            question_state_data,
            linked_skill_ids,
            content_id_generator.next_content_id_index)
        self.save_new_question(
            'question_id2', 'owner_id',
            question_state_data,
            linked_skill_ids,
            content_id_generator.next_content_id_index)
        question_ids = ['question_id1', 'question_id2']

        question_model1 = question_models.QuestionModel.get(question_ids[0])
        question_model2 = question_models.QuestionModel.get(question_ids[1])

        self.assertItemsEqual(
            question_model1.linked_skill_ids, ['skill_id1', 'skill_id2'])
        self.assertItemsEqual(
            question_model2.linked_skill_ids, ['skill_id1', 'skill_id2'])

        question_model1.linked_skill_ids = ['skill_id3']
        question_model2.linked_skill_ids = ['skill_id3']

        question_models.QuestionModel.put_multi_questions(
            [question_model1, question_model2])

        updated_question_model1 = question_models.QuestionModel.get(
            question_ids[0])
        updated_question_model2 = question_models.QuestionModel.get(
            question_ids[1])
        self.assertEqual(
            updated_question_model1.linked_skill_ids, ['skill_id3'])
        self.assertEqual(
            updated_question_model2.linked_skill_ids, ['skill_id3'])

    def test_raise_exception_by_mocking_collision(self) -> None:
        state = state_domain.State.create_default_state(
            'ABC', 'content_0', 'default_outcome_1')
        question_state_data = state.to_dict()
        language_code = 'en'
        version = 1

        with self.assertRaisesRegex(
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
                    question_state_data, language_code, version, [], [], 2)


class QuestionSkillLinkModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionSkillLinkModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            question_models.QuestionSkillLinkModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            question_models.QuestionSkillLinkModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_difficulty': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            question_models.QuestionSkillLinkModel.get_export_policy(),
            expected_export_policy_dict
        )

    def test_create_question_skill_link(self) -> None:
        question_id = 'A Test Question Id'
        skill_id = 'A Test Skill Id'
        skill_difficulty = 0.4
        questionskilllink_model = question_models.QuestionSkillLinkModel.create(
            question_id, skill_id, skill_difficulty)

        self.assertEqual(questionskilllink_model.question_id, question_id)
        self.assertEqual(questionskilllink_model.skill_id, skill_id)
        self.assertEqual(
            questionskilllink_model.skill_difficulty, skill_difficulty)

    def test_get_all_question_ids_linked_to_skill_id(self) -> None:
        skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_1, 'user', description='Description 1')

        # Testing that no question is linked to a skill.
        self.assertEqual(
            question_models.QuestionSkillLinkModel
            .get_all_question_ids_linked_to_skill_id(skill_id_1),
            []
        )

        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', skill_id_1, 0.1)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', skill_id_1, 0.2)
            )

        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2]
        )

        self.assertEqual(
            question_models.QuestionSkillLinkModel
            .get_all_question_ids_linked_to_skill_id(skill_id_1),
            ['question_id1', 'question_id2']
        )

    def test_put_multi_question_skill_link(self) -> None:
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

    def test_delete_multi_question_skill_link(self) -> None:
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

        question_models.QuestionSkillLinkModel.delete_multi_question_skill_links( # pylint: disable=line-too-long
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

    def test_cannot_link_same_question_to_given_skill(self) -> None:
        question_skill_link_model = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id1', 0.1)
            )

        question_models.QuestionSkillLinkModel.put_multi_question_skill_links([
            question_skill_link_model
        ])

        with self.assertRaisesRegex(
            Exception,
            'The question with ID question_id1 is already linked to '
            'skill skill_id1'
        ):
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id1', 0.1)

    def test_get_models_by_question_id(self) -> None:
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

    def test_get_total_question_count_for_skill_ids(self) -> None:
        skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_1, 'user', description='Description 1')
        skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_2, 'user', description='Description 2')

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
                'question_id3', skill_id_2, 0.8)
        )
        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3])

        question_skill_link_model = question_models.QuestionSkillLinkModel
        question_count = (
            question_skill_link_model.get_total_question_count_for_skill_ids(
                [skill_id_1, skill_id_2]))

        self.assertEqual(question_count, 3)

        question_count = (
            question_skill_link_model.get_total_question_count_for_skill_ids(
                [skill_id_1]))

        self.assertEqual(question_count, 2)

        question_count = (
            question_skill_link_model.get_total_question_count_for_skill_ids(
                [skill_id_1, skill_id_1]))

        self.assertEqual(question_count, 2)

        question_count = (
            question_skill_link_model.get_total_question_count_for_skill_ids(
                [skill_id_2]))

        self.assertEqual(question_count, 1)

        question_count = (
            question_skill_link_model.get_total_question_count_for_skill_ids(
                [skill_id_1, skill_id_2, skill_id_1]))

        self.assertEqual(question_count, 3)

    def test_get_question_skill_links_by_skill_ids(self) -> None:
        skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_1, 'user', description='Description 1')
        skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_2, 'user', description='Description 2')

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

        question_skill_link_models = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_by_skill_ids( # pylint: disable=line-too-long
                1, [skill_id_1, skill_id_2], 0
            )
        )
        self.assertEqual(len(question_skill_link_models), 2)
        self.assertEqual(question_skill_link_models[0].skill_id, skill_id_2)
        self.assertEqual(question_skill_link_models[1].skill_id, skill_id_1)

        question_skill_link_models_2 = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_by_skill_ids( # pylint: disable=line-too-long
                1, [skill_id_1, skill_id_2], 2
            )
        )
        self.assertEqual(len(question_skill_link_models_2), 1)
        self.assertEqual(question_skill_link_models_2[0].skill_id, skill_id_1)

        self.assertNotEqual(
            question_skill_link_models[0], question_skill_link_models_2[0])

    def test_get_question_skill_links_by_skill_ids_many_skills(self) -> None:
        # Test the case when len(skill_ids) > constants.MAX_SKILLS_PER_QUESTION.
        skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_1, 'user', description='Description 1')
        skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_2, 'user', description='Description 2')
        skill_id_3 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_3, 'user', description='Description 3')
        skill_id_4 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_4, 'user', description='Description 4')

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

        question_skill_link_models = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_by_skill_ids( # pylint: disable=line-too-long
                1, [skill_id_1, skill_id_2, skill_id_3, skill_id_4], 0
            )
        )
        self.assertEqual(len(question_skill_link_models), 3)
        self.assertEqual(question_skill_link_models[0].skill_id, skill_id_4)
        self.assertEqual(question_skill_link_models[1].skill_id, skill_id_3)
        self.assertEqual(question_skill_link_models[2].skill_id, skill_id_2)

    def test_get_question_skill_links_based_on_difficulty(self) -> None:
        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id1', 0.7)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id1', 0.6)
            )
        questionskilllink_model3 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id2', 0.5)
            )
        questionskilllink_model4 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id2', 0.9)
            )
        questionskilllink_model5 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id3', 0.9)
            )
        questionskilllink_model6 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id3', 0.6)
            )
        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3, questionskilllink_model4,
             questionskilllink_model5, questionskilllink_model6])
        question_skill_links = (
            question_models.QuestionSkillLinkModel.
            get_question_skill_links_based_on_difficulty_equidistributed_by_skill( # pylint: disable=line-too-long
                3, ['skill_id1', 'skill_id2', 'skill_id3'], 0.6
            )
        )
        self.assertEqual(len(question_skill_links), 2)
        self.assertTrue(questionskilllink_model2 in question_skill_links)
        self.assertTrue(questionskilllink_model4 in question_skill_links)

    def test_get_random_question_skill_links_based_on_difficulty(self) -> None:
        questionskilllink_model1 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id1', 'skill_id1', 0.6)
            )
        questionskilllink_model2 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id1', 0.6)
            )
        questionskilllink_model3 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id3', 'skill_id1', 0.6)
            )
        questionskilllink_model4 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id4', 'skill_id1', 0.6)
            )
        questionskilllink_model5 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id5', 'skill_id1', 0.6)
            )
        questionskilllink_model6 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id6', 'skill_id1', 0.6)
            )
        questionskilllink_model7 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id7', 'skill_id1', 0.6)
            )
        questionskilllink_model8 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id8', 'skill_id1', 0.6)
            )
        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3, questionskilllink_model4,
             questionskilllink_model5, questionskilllink_model6,
             questionskilllink_model7, questionskilllink_model8])
        def mock_random_sample(
                alist: List[question_models.QuestionSkillLinkModel],
                num: int
        ) -> List[question_models.QuestionSkillLinkModel]:
            if num >= len(alist):
                return alist
            # The key for sorting is defined separately because of a mypy bug.
            # A [no-any-return] is thrown if key is defined in the sort()
            # method instead.
            # https://github.com/python/mypy/issues/9590
            k = lambda x: x.question_id
            alist.sort(key=k)
            return alist[:num]

        sample_swap = self.swap(random, 'sample', mock_random_sample)

        def mock_random_int(upper_bound: int) -> int:
            return 1 if upper_bound > 1 else 0
        random_int_swap = self.swap(utils, 'get_random_int', mock_random_int)
        with sample_swap, random_int_swap:
            question_skill_links_1 = (
                question_models.QuestionSkillLinkModel.
                get_question_skill_links_based_on_difficulty_equidistributed_by_skill( # pylint: disable=line-too-long
                    3, ['skill_id1'], 0.6
                )
            )
        self.assertEqual(len(question_skill_links_1), 3)
        self.assertEqual(
            question_skill_links_1,
            [questionskilllink_model2, questionskilllink_model3,
             questionskilllink_model4])

    def test_request_too_many_skills_raises_error_when_fetch_by_difficulty(
        self
    ) -> None:
        skill_ids = ['skill_id%s' % number for number in range(25)]
        with self.assertRaisesRegex(
            Exception, 'Please keep the number of skill IDs below 20.'):
            (
                question_models.QuestionSkillLinkModel.
                get_question_skill_links_based_on_difficulty_equidistributed_by_skill( # pylint: disable=line-too-long
                    3, skill_ids, 0.6
                ))

    def test_get_questions_with_no_skills(self) -> None:
        question_skill_links = (
            question_models.QuestionSkillLinkModel.
            get_question_skill_links_based_on_difficulty_equidistributed_by_skill( # pylint: disable=line-too-long
                1, [], 0.6
            )
        )
        self.assertEqual(question_skill_links, [])

        question_skill_links = (
            question_models.QuestionSkillLinkModel.
            get_question_skill_links_equidistributed_by_skill(1, []))
        self.assertEqual(question_skill_links, [])

    def test_get_questions_with_zero_count(self) -> None:
        question_skill_links = (
            question_models.QuestionSkillLinkModel.
            get_question_skill_links_based_on_difficulty_equidistributed_by_skill( # pylint: disable=line-too-long
                0, ['skill_id1'], 0.6
            )
        )
        self.assertEqual(question_skill_links, [])

        question_skill_links = (
            question_models.QuestionSkillLinkModel.
            get_question_skill_links_equidistributed_by_skill(1, []))
        self.assertEqual(question_skill_links, [])

    def test_get_more_question_skill_links_than_available(self) -> None:
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
            get_question_skill_links_based_on_difficulty_equidistributed_by_skill( # pylint: disable=line-too-long
                4, ['skill_id1', 'skill_id2'], 0.5
            )
        )
        self.assertEqual(len(question_skill_links), 3)
        self.assertTrue(questionskilllink_model1 in question_skill_links)
        self.assertTrue(questionskilllink_model2 in question_skill_links)
        self.assertTrue(questionskilllink_model3 in question_skill_links)

    def test_get_question_skill_links_when_count_not_evenly_divisible(
        self
    ) -> None:
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
            get_question_skill_links_based_on_difficulty_equidistributed_by_skill( # pylint: disable=line-too-long
                3, ['skill_id1', 'skill_id2'], 0.5
            )
        )
        self.assertEqual(len(question_skill_links), 3)
        self.assertTrue(questionskilllink_model1 in question_skill_links)
        self.assertTrue(questionskilllink_model2 in question_skill_links)
        self.assertTrue(questionskilllink_model3 in question_skill_links)

    def test_get_question_skill_links_equidistributed_by_skill(
        self
    ) -> None:
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
        questionskilllink_model4 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id2', 'skill_id2', 0.9)
            )
        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3, questionskilllink_model4])
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

        # Test questions with multiple linked skills are deduplicated.
        question_ids = [link.question_id for link in question_skill_links]
        self.assertEqual(question_ids.count('question_id2'), 1)

    def test_get_random_question_skill_links_equidistributed_by_skill(
        self
    ) -> None:
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
                'question_id3', 'skill_id1', 0.8)
            )
        questionskilllink_model4 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id4', 'skill_id1', 0.9)
            )
        questionskilllink_model5 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id5', 'skill_id1', 0.6)
            )
        questionskilllink_model6 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id6', 'skill_id1', 0.6)
            )
        questionskilllink_model7 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id7', 'skill_id1', 0.6)
            )
        questionskilllink_model8 = (
            question_models.QuestionSkillLinkModel.create(
                'question_id8', 'skill_id1', 0.6)
            )
        question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
            [questionskilllink_model1, questionskilllink_model2,
             questionskilllink_model3, questionskilllink_model4,
             questionskilllink_model5, questionskilllink_model6,
             questionskilllink_model7, questionskilllink_model8])

        def mock_random_sample(
                alist: List[question_models.QuestionSkillLinkModel],
                num: int
        ) -> List[question_models.QuestionSkillLinkModel]:
            if num >= len(alist):
                return alist
            # The key for sorting is defined separately because of a mypy bug.
            # A [no-any-return] is thrown if key is defined in the sort()
            # method instead.
            # https://github.com/python/mypy/issues/9590
            k = lambda x: x.question_id
            alist.sort(key=k)
            return alist[:num]

        sample_swap = self.swap(random, 'sample', mock_random_sample)

        def mock_random_int(upper_bound: int) -> int:
            return 1 if upper_bound > 1 else 0
        random_int_swap = self.swap(utils, 'get_random_int', mock_random_int)
        with sample_swap, random_int_swap:
            question_skill_links_1 = (
                question_models.QuestionSkillLinkModel.
                get_question_skill_links_equidistributed_by_skill(
                    3, ['skill_id1']
                )
            )
        self.assertEqual(len(question_skill_links_1), 3)
        self.assertEqual(
            question_skill_links_1,
            [questionskilllink_model2, questionskilllink_model3,
             questionskilllink_model4])

    def test_request_too_many_skills_raises_error(self) -> None:
        skill_ids = ['skill_id%s' % number for number in range(25)]
        with self.assertRaisesRegex(
            Exception, 'Please keep the number of skill IDs below 20.'):
            (
                question_models.QuestionSkillLinkModel.
                get_question_skill_links_equidistributed_by_skill(
                    3, skill_ids))


class QuestionCommitLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionCommitLogEntryModel class."""

    def test_has_reference_to_user_id(self) -> None:
        commit = question_models.QuestionCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.question_id = 'b'
        commit.update_timestamps()
        commit.put()
        self.assertTrue(
            question_models.QuestionCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            question_models.QuestionCommitLogEntryModel
            .has_reference_to_user_id('x_id'))

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            question_models.QuestionCommitLogEntryModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'commit_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'commit_message': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'commit_cmds': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'post_commit_status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'post_commit_community_owned': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'post_commit_is_private': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            question_models.QuestionCommitLogEntryModel.get_export_policy(),
            expected_export_policy_dict
        )


class QuestionSummaryModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionSummaryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            question_models.QuestionSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            question_models.QuestionSummaryModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_model_last_updated': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'question_model_created_on': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'question_content': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'interaction_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'misconception_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            question_models.QuestionSummaryModel.get_export_policy(),
            expected_export_policy_dict
        )
