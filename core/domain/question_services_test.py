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

from core.domain import question_domain
from core.domain import question_services
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
            self._create_valid_question_data('ABC'))

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

    def test_create_and_get_question_skill_link(self):
        question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'))

        question_id_3 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC'))
        question_services.create_new_question_skill_link(
            self.question_id, 'skill_1')
        question_services.create_new_question_skill_link(
            question_id_2, 'skill_1')
        question_services.create_new_question_skill_link(
            question_id_3, 'skill_2')

        question_summaries, _ = (
            question_services.get_question_summaries_linked_to_skills(
                ['skill_1', 'skill_2', 'skill_3'], ''))

        with self.assertRaisesRegexp(
            Exception, 'Querying linked question summaries for more than 3 '
            'skills at a time is not supported currently.'):
            question_services.get_question_summaries_linked_to_skills(
                ['skill_1', 'skill_2', 'skill_3', 'skill_4'], '')
        question_ids = [summary.id for summary in question_summaries]
        self.assertEqual(len(question_ids), 3)
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2, question_id_3])

        question_summaries, _ = (
            question_services.get_question_summaries_linked_to_skills(
                ['skill_1', 'skill_3'], ''))
        question_ids = [summary.id for summary in question_summaries]
        self.assertEqual(len(question_ids), 2)
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2])

        with self.assertRaisesRegexp(
            Exception, 'The given question is already linked to given skill'):
            question_services.create_new_question_skill_link(
                self.question_id, 'skill_1')

    def test_get_question_skill_links_of_skill(self):
        question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'))

        question_id_3 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC'))
        question_services.create_new_question_skill_link(
            self.question_id, 'skill_1')
        question_services.create_new_question_skill_link(
            question_id_2, 'skill_1')
        question_services.create_new_question_skill_link(
            question_id_3, 'skill_2')

        question_skill_links = (
            question_services.get_question_skill_links_of_skill(
                'skill_1'))

        self.assertEqual(len(question_skill_links), 2)
        question_ids = [question_skill.question_id for question_skill
                        in question_skill_links]
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2])

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
            self._create_valid_question_data('DEF'))
        questions = question_services.get_questions_by_ids(
            [self.question_id, 'invalid_question_id', question_id_2])
        self.assertEqual(len(questions), 3)
        self.assertEqual(questions[0].id, self.question_id)
        self.assertIsNone(questions[1])
        self.assertEqual(questions[2].id, question_id_2)

    def test_delete_question(self):
        question_services.delete_question(self.editor_id, self.question_id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionModel with id %s not found' % (
                self.question_id))):
            question_models.QuestionModel.get(self.question_id)

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

    def test_update_skill_ids_of_questions(self):
        question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'))

        question_id_3 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_3, self.editor_id,
            self._create_valid_question_data('ABC'))
        question_services.create_new_question_skill_link(
            self.question_id, 'skill_1')
        question_services.create_new_question_skill_link(
            question_id_2, 'skill_1')
        question_services.create_new_question_skill_link(
            question_id_3, 'skill_2')

        question_skill_links = (
            question_services.get_question_skill_links_of_skill(
                'skill_1'))

        self.assertEqual(len(question_skill_links), 2)
        question_ids = [question_skill.question_id for question_skill
                        in question_skill_links]
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2])

        question_services.update_skill_ids_of_questions(
            'skill_1', 'skill_3')

        question_skill_links = (
            question_services.get_question_skill_links_of_skill(
                'skill_1'))

        self.assertEqual(len(question_skill_links), 0)
        question_skill_links = (
            question_services.get_question_skill_links_of_skill(
                'skill_3'))

        self.assertEqual(len(question_skill_links), 2)
        question_ids = [question_skill.question_id for question_skill
                        in question_skill_links]
        self.assertItemsEqual(
            question_ids, [self.question_id, question_id_2])

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

        self.assertEqual(len(question_summaries), 1)
        for question_summary in question_summaries:
            self.assertEqual(question_summary.id, self.question_id)
            self.assertEqual(
                question_summary.question_content,
                feconf.DEFAULT_INIT_STATE_CONTENT_STR)

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
