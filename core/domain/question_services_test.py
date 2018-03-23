# coding: utf-8
#
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

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import question_domain
from core.domain import question_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(question_models,) = models.Registry.import_models([models.NAMES.question])
memcache_services = models.Registry.import_memcache_services()


class QuestionServicesUnitTest(test_utils.GenericTestBase):
    """Test the question services module."""

    def setUp(self):
        """Before each individual test, create dummy user."""
        super(QuestionServicesUnitTest, self).setUp()

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_get_question_by_id(self):
        question = question_domain.Question(
            'dummy', 'A Question',
            exp_domain.State.create_default_state('ABC').to_dict(),
            1, 'col1', 'en')

        question_id = question_services.add_question(self.owner_id, question)
        question = question_services.get_question_by_id(question_id)

        self.assertEqual(question.title, 'A Question')

    def test_get_questions_by_ids(self):
        question = question_domain.Question(
            'dummy', 'A Question',
            exp_domain.State.create_default_state('ABC').to_dict(),
            1, 'col1', 'en')

        question1_id = question_services.add_question(
            self.owner_id, question)
        question = question_domain.Question(
            'dummy2', 'A Question2',
            exp_domain.State.create_default_state('ABC').to_dict(),
            1, 'col2', 'en')

        question2_id = question_services.add_question(
            self.owner_id, question)
        questions = question_services.get_questions_by_ids(
            [question1_id, question2_id])
        self.assertEqual(len(questions), 2)
        self.assertEqual(questions[0].title, 'A Question')
        self.assertEqual(questions[1].title, 'A Question2')

    def test_add_question(self):
        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()
        question_id = 'dummy'
        title = 'A Question'
        question_data_schema_version = 1
        collection_id = 'col1'
        language_code = 'en'
        question = question_domain.Question(
            question_id, title, question_data, question_data_schema_version,
            collection_id, language_code)

        question_id = question_services.add_question(self.owner_id, question)
        model = question_models.QuestionModel.get(question_id)

        self.assertEqual(model.title, title)
        self.assertEqual(model.question_data, question_data)
        self.assertEqual(model.question_data_schema_version,
                         question_data_schema_version)
        self.assertEqual(model.collection_id, collection_id)
        self.assertEqual(model.language_code, language_code)

    def test_delete_question(self):
        collection_id = 'col1'
        exp_id = '0_exploration_id'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Create a new collection and exploration.
        self.save_new_valid_collection(
            collection_id, owner_id, exploration_id=exp_id)

        # Add a skill.
        collection_services.update_collection(
            owner_id, collection_id, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_SKILL,
                'name': 'skill0'
            }], 'Add a new skill')

        question = question_domain.Question(
            'dummy', 'A Question',
            exp_domain.State.create_default_state('ABC').to_dict(),
            1, collection_id, 'en')

        question_id = question_services.add_question(self.owner_id, question)
        with self.assertRaisesRegexp(Exception, (
            'The question with ID %s is not present'
            ' in the given collection' % question_id)):
            question_services.delete_question(
                self.owner_id, 'random', question_id)
        question_services.delete_question(
            self.owner_id, collection_id, question_id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionModel with id %s not found' % (
                question_id))):
            question_models.QuestionModel.get(question_id)

    def test_update_question(self):
        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()
        question_id = 'dummy'
        title = 'A Question'
        question_data_schema_version = 1
        collection_id = 'col1'
        language_code = 'en'
        question = question_domain.Question(
            question_id, title, question_data, question_data_schema_version,
            collection_id, language_code)

        question_id = question_services.add_question(self.owner_id, question)
        change_dict = {'cmd': 'update_question_property',
                       'property_name': 'title',
                       'new_value': 'ABC',
                       'old_value': 'A Question'}
        change_list = [question_domain.QuestionChange(change_dict)]
        with self.assertRaisesRegexp(Exception, (
            'The question with ID %s is not present'
            ' in the given collection' % question_id)):
            question_services.update_question(
                self.owner_id, 'random', question_id, change_list, 'updated')

        question_services.update_question(
            self.owner_id, collection_id, question_id, change_list, (
                'updated title'))

        model = question_models.QuestionModel.get(question_id)
        self.assertEqual(model.title, 'ABC')
        self.assertEqual(model.question_data, question_data)
        self.assertEqual(model.question_data_schema_version,
                         question_data_schema_version)
        self.assertEqual(model.collection_id, collection_id)
        self.assertEqual(model.language_code, language_code)

    def test_add_question_id_to_skill(self):
        """Test to verify add_skill."""
        collection_id = 'col1'
        exp_id = '0_exploration_id'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Create a new collection and exploration.
        self.save_new_valid_collection(
            collection_id, owner_id, exploration_id=exp_id)

        # Add a skill.
        collection_services.update_collection(
            owner_id, collection_id, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_SKILL,
                'name': 'skill0'
            }], 'Add a new skill')

        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()

        question_dict = {
            'question_id': 'col1.random',
            'title': 'abc',
            'question_data': question_data,
            'question_data_schema_version': 1,
            'collection_id': 'col1',
            'language_code': 'en'
        }

        collection = collection_services.get_collection_by_id(collection_id)
        skill_id = collection.get_skill_id_from_skill_name('skill0')
        question = question_domain.Question.from_dict(question_dict)
        question_services.add_question_id_to_skill(
            question.question_id, collection_id, skill_id, owner_id)
        collection = collection_services.get_collection_by_id(collection_id)
        self.assertIn(
            question.question_id, collection.skills[skill_id].question_ids)

    def test_remove_question_id_from_skill(self):
        """Tests to verify remove_question_id_from_skill method."""
        collection_id = 'col1'
        exp_id = '0_exploration_id'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Create a new collection and exploration.
        self.save_new_valid_collection(
            collection_id, owner_id, exploration_id=exp_id)

        # Add a skill.
        collection_services.update_collection(
            owner_id, collection_id, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_SKILL,
                'name': 'skill0'
            }], 'Add a new skill')

        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()

        question_dict = {
            'question_id': 'col1.random',
            'title': 'abc',
            'question_data': question_data,
            'question_data_schema_version': 1,
            'collection_id': 'col1',
            'language_code': 'en'
        }

        collection = collection_services.get_collection_by_id(collection_id)
        skill_id = collection.get_skill_id_from_skill_name('skill0')
        question = question_domain.Question.from_dict(question_dict)

        question_services.add_question_id_to_skill(
            question.question_id, collection_id, skill_id, owner_id)
        collection = collection_services.get_collection_by_id(
            collection_id)
        self.assertIn(
            question.question_id, collection.skills[skill_id].question_ids)
        skill_id = collection.get_skill_id_from_skill_name('skill0')
        question_services.remove_question_id_from_skill(
            question.question_id, collection_id, skill_id, owner_id)
        collection = collection_services.get_collection_by_id(collection_id)
        self.assertEqual(len(collection.skills[skill_id].question_ids), 0)

    def test_get_question_batch(self):
        coll_id_0 = '0_collection_id'
        exp_id_0 = '0_exploration_id'
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Create a new collection and exploration.
        self.save_new_valid_collection(
            coll_id_0, self.owner_id, exploration_id=exp_id_0)

        # Add a skill.
        collection_services.update_collection(
            self.owner_id, coll_id_0, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_SKILL,
                'name': 'skill0'
            }], 'Add a new skill')
        collection = collection_services.get_collection_by_id(
            coll_id_0)
        skill_id = collection.get_skill_id_from_skill_name('skill0')
        collection_node = collection.get_node(exp_id_0)
        collection_node.update_acquired_skill_ids([skill_id])
        # Update the acquired skill IDs for the exploration.
        collection_services.update_collection(
            self.owner_id, coll_id_0, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_NODE_PROPERTY,
                'property_name': collection_domain.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS, # pylint: disable=line-too-long
                'exploration_id': exp_id_0,
                'new_value': [skill_id]
            }], 'Update skill')

        question = question_domain.Question(
            'dummy', 'A Question',
            exp_domain.State.create_default_state('ABC').to_dict(),
            1, coll_id_0, 'en')

        question_id = question_services.add_question(self.owner_id, question)
        question = question_services.get_question_by_id(question_id)
        question_services.add_question_id_to_skill(
            question.question_id, coll_id_0, skill_id, self.owner_id)
        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, coll_id_0, exp_id_0)
        question_batch = question_services.get_questions_batch(
            coll_id_0, [skill_id], self.owner_id, 1)
        self.assertEqual(question_batch[0].title, question.title)

    def test_get_question_summaries_for_collection(self):
        """Tests to verify get_question_summaries_for_collection method."""
        coll_id_0 = '0_collection_id'
        exp_id_0 = '0_exploration_id'
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Create a new collection and exploration.
        self.save_new_valid_collection(
            coll_id_0, self.owner_id, exploration_id=exp_id_0)

        # Add a skill.
        collection_services.update_collection(
            self.owner_id, coll_id_0, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_SKILL,
                'name': 'skill0'
            }], 'Add a new skill')
        collection = collection_services.get_collection_by_id(
            coll_id_0)
        skill_id = collection.get_skill_id_from_skill_name('skill0')
        collection_node = collection.get_node(exp_id_0)
        collection_node.update_acquired_skill_ids([skill_id])
        # Update the acquired skill IDs for the exploration.
        collection_services.update_collection(
            self.owner_id, coll_id_0, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_NODE_PROPERTY,
                'property_name': collection_domain.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS, # pylint: disable=line-too-long
                'exploration_id': exp_id_0,
                'new_value': [skill_id]
            }], 'Update skill')

        question = question_domain.Question(
            'dummy', 'A Question',
            exp_domain.State.create_default_state('ABC').to_dict(),
            1, coll_id_0, 'en')

        question_id = question_services.add_question(self.owner_id, question)
        question = question_services.get_question_by_id(question_id)
        question_services.add_question_id_to_skill(
            question.question_id, coll_id_0, skill_id, self.owner_id)
        question_summaries = (
            question_services.get_question_summaries_for_collection(
                coll_id_0))
        self.assertEqual(question_summaries[0].question_id, question_id)
        self.assertEqual(question_summaries[0].question_title, question.title)
        self.assertEqual(question_summaries[0].skill_names, ['skill0'])
