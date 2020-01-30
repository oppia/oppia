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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import types

from constants import constants
from core.domain import skill_services
from core.domain import state_domain
from core.platform import models
from core.tests import test_utils
import python_utils

(base_models, question_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.question])


class QuestionModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            question_models.QuestionModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self):
        question_state_data = self._create_valid_question_data('ABC')
        linked_skill_ids = ['skill_id1', 'skill_id2']
        self.save_new_question(
            'question_id1', 'owner_id', question_state_data, linked_skill_ids)
        self.assertTrue(
            question_models.QuestionModel
            .has_reference_to_user_id('owner_id'))
        self.assertFalse(
            question_models.QuestionModel
            .has_reference_to_user_id('x_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            question_models.QuestionModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)

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


class QuestionSkillLinkModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionSkillLinkModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            question_models.QuestionSkillLinkModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)

    def test_has_reference_to_user_id(self):
        self.assertFalse(
            question_models.QuestionSkillLinkModel
            .has_reference_to_user_id('any_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            question_models.QuestionSkillLinkModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)

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

        question_skill_link_models, next_cursor_str = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_by_skill_ids( # pylint: disable=line-too-long
                1, [skill_id_1, skill_id_2], ''
            )
        )
        self.assertEqual(len(question_skill_link_models), 2)
        self.assertEqual(question_skill_link_models[0].skill_id, skill_id_2)
        self.assertEqual(question_skill_link_models[1].skill_id, skill_id_1)

        question_skill_link_models_2, next_cursor_str = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_by_skill_ids( # pylint: disable=line-too-long
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

        question_skill_link_models, _ = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_by_skill_ids( # pylint: disable=line-too-long
                1, [skill_id_1, skill_id_2, skill_id_3, skill_id_4], ''
            )
        )
        self.assertEqual(len(question_skill_link_models), 3)
        self.assertEqual(question_skill_link_models[0].skill_id, skill_id_4)
        self.assertEqual(question_skill_link_models[1].skill_id, skill_id_3)
        self.assertEqual(question_skill_link_models[2].skill_id, skill_id_2)

    def test_get_question_skill_links_based_on_difficulty(self):
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

    def test_request_too_many_skills_raises_error_when_fetch_by_difficulty(
            self):
        skill_ids = ['skill_id%s' % number for number in python_utils.RANGE(25)]
        with self.assertRaisesRegexp(
            Exception, 'Please keep the number of skill IDs below 20.'):
            (question_models.QuestionSkillLinkModel.
             get_question_skill_links_based_on_difficulty_equidistributed_by_skill( # pylint: disable=line-too-long
                 3, skill_ids, 0.6
             ))

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
            get_question_skill_links_based_on_difficulty_equidistributed_by_skill( # pylint: disable=line-too-long
                4, ['skill_id1', 'skill_id2'], 0.5
            )
        )
        self.assertEqual(len(question_skill_links), 3)
        self.assertTrue(questionskilllink_model1 in question_skill_links)
        self.assertTrue(questionskilllink_model2 in question_skill_links)
        self.assertTrue(questionskilllink_model3 in question_skill_links)

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
            get_question_skill_links_based_on_difficulty_equidistributed_by_skill( # pylint: disable=line-too-long
                3, ['skill_id1', 'skill_id2'], 0.5
            )
        )
        self.assertEqual(len(question_skill_links), 3)
        self.assertTrue(questionskilllink_model1 in question_skill_links)
        self.assertTrue(questionskilllink_model2 in question_skill_links)
        self.assertTrue(questionskilllink_model3 in question_skill_links)

    def test_get_question_skill_links_equidistributed_by_skill(
            self):
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

    def test_request_too_many_skills_raises_error(self):
        skill_ids = ['skill_id%s' % number for number in python_utils.RANGE(25)]
        with self.assertRaisesRegexp(
            Exception, 'Please keep the number of skill IDs below 20.'):
            (question_models.QuestionSkillLinkModel.
             get_question_skill_links_equidistributed_by_skill(
                 3, skill_ids))


class QuestionCommitLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionCommitLogEntryModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            question_models.QuestionCommitLogEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        commit = question_models.QuestionCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'username', 'msg',
            'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.question_id = 'b'
        commit.put()
        self.assertTrue(
            question_models.QuestionCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            question_models.QuestionCommitLogEntryModel
            .has_reference_to_user_id('x_id'))


class QuestionSummaryModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionSummaryModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            question_models.QuestionSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self):
        question_summary_model = question_models.QuestionSummaryModel(
            id='question',
            question_content='Question',
            question_model_created_on=datetime.datetime.utcnow(),
            question_model_last_updated=datetime.datetime.utcnow()
        )
        question_summary_model.put()

        self.assertFalse(
            question_models.QuestionSummaryModel
            .has_reference_to_user_id('user_id_x'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            question_models.QuestionSummaryModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)
