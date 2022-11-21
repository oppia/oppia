# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

""" Tests for the questions list. """

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import question_services
from core.domain import skill_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import translation_domain
from core.domain import user_services
from core.tests import test_utils


class BaseQuestionsListControllerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Skill Description')
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_2, self.admin_id, description='Skill Description 2')
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        self.skill_id_3 = skill_services.get_new_skill_id()
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 1,
            'url_fragment': 'dummy-fragment'
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.admin_id, self.topic_id, changelist, 'Added subtopic.')


class QuestionsListHandlerTests(BaseQuestionsListControllerTests):

    def test_get_questions_succeeds(self) -> None:
        for _ in range(4):
            question_id = question_services.get_new_question_id()
            content_id_generator = translation_domain.ContentIdGenerator()
            self.save_new_question(
                question_id, self.admin_id,
                self._create_valid_question_data('ABC', content_id_generator),
                [self.skill_id, self.skill_id_2],
                content_id_generator.next_content_id_index)
            question_services.create_new_question_skill_link(
                self.admin_id, question_id, self.skill_id, 0.5)
            question_services.create_new_question_skill_link(
                self.admin_id, question_id, self.skill_id_2, 0.3)

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(constants, 'NUM_QUESTIONS_PER_PAGE', 2):
            json_response = self.get_json(
                '%s/%s,%s?offset=0' % (
                    feconf.QUESTIONS_LIST_URL_PREFIX,
                    self.skill_id, self.skill_id_2
                ))
            question_summary_dicts = json_response['question_summary_dicts']
            self.assertEqual(len(question_summary_dicts), 2)
            more = json_response['more']
            self.assertTrue(more)
            json_response = self.get_json(
                '%s/%s,%s?offset=4' % (
                    feconf.QUESTIONS_LIST_URL_PREFIX,
                    self.skill_id, self.skill_id_2
                ))
            question_summary_dicts_2 = (
                json_response['question_summary_dicts'])
            self.assertEqual(len(question_summary_dicts_2), 2)
            for i in range(2):
                self.assertEqual(
                    question_summary_dicts[i]['skill_descriptions'],
                    ['Skill Description 2', 'Skill Description'])
                self.assertEqual(
                    question_summary_dicts_2[i]['skill_descriptions'],
                    ['Skill Description 2', 'Skill Description'])
                self.assertEqual(
                    question_summary_dicts[i]['skill_ids'],
                    [self.skill_id_2, self.skill_id])
                self.assertEqual(
                    question_summary_dicts_2[i]['skill_ids'],
                    [self.skill_id_2, self.skill_id])
                self.assertEqual(
                    question_summary_dicts[i]['skill_difficulties'], [0.3, 0.5])
                self.assertEqual(
                    question_summary_dicts_2[i]['skill_difficulties'],
                    [0.3, 0.5])
            json_response = self.get_json(
                '%s/%s?offset=0' % (
                    feconf.QUESTIONS_LIST_URL_PREFIX,
                    self.skill_id
                ))
            question_summary_dicts_3 = (
                json_response['question_summary_dicts'])
            self.assertEqual(len(question_summary_dicts_3), 2)
            for i in range(2):
                self.assertEqual(
                    question_summary_dicts_3[i]['skill_description'],
                    'Skill Description')
                self.assertEqual(
                    question_summary_dicts_3[i]['skill_id'], self.skill_id)
                self.assertEqual(
                    question_summary_dicts_3[i]['skill_difficulty'], 0.5)
            self.assertNotEqual(
                question_summary_dicts[0]['summary']['id'],
                question_summary_dicts_2[0]['summary']['id'])

            json_response = self.get_json(
                '%s/%s?offset=3' % (
                    feconf.QUESTIONS_LIST_URL_PREFIX,
                    self.skill_id
                ))
            question_summary_dicts_4 = (
                json_response['question_summary_dicts'])
            more = json_response['more']
            self.assertEqual(len(question_summary_dicts_4), 1)
            self.assertFalse(more)
        self.logout()

    def test_get_fails_when_offset_not_valid(self) -> None:
        self.get_json('%s/%s?offset=a' % (
            feconf.QUESTIONS_LIST_URL_PREFIX, self.skill_id),
                      expected_status_int=400)

    def test_get_fails_when_skill_id_not_valid(self) -> None:
        self.get_json('%s/%s?offset=0' % (
            feconf.QUESTIONS_LIST_URL_PREFIX, '1,2'),
                      expected_status_int=400)

    def test_get_fails_when_skill_does_not_exist(self) -> None:
        self.get_json('%s/%s?offset=0' % (
            feconf.QUESTIONS_LIST_URL_PREFIX, self.skill_id_3),
                      expected_status_int=404)


class QuestionCountDataHandlerTests(BaseQuestionsListControllerTests):

    def test_get_question_count_succeeds(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        question_id = question_services.get_new_question_id()
        question_id_1 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id, self.admin_id,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.skill_id],
            content_id_generator.next_content_id_index)

        content_id_generator_2 = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_1, self.admin_id,
            self._create_valid_question_data('ABC2', content_id_generator_2),
            [self.skill_id_2],
            content_id_generator_2.next_content_id_index)

        question_services.create_new_question_skill_link(
            self.admin_id, question_id, self.skill_id, 0.5)
        question_services.create_new_question_skill_link(
            self.admin_id, question_id_1, self.skill_id_2, 0.3)

        json_response = self.get_json(
            '%s/%s,%s' % (
                feconf.QUESTION_COUNT_URL_PREFIX,
                self.skill_id, self.skill_id_2
            ))
        self.assertEqual(json_response['total_question_count'], 2)

        json_response = self.get_json(
            '%s/%s' % (
                feconf.QUESTION_COUNT_URL_PREFIX,
                self.skill_id
            ))
        self.assertEqual(json_response['total_question_count'], 1)

        json_response = self.get_json(
            '%s/%s' % (
                feconf.QUESTION_COUNT_URL_PREFIX,
                self.skill_id_2
            ))
        self.assertEqual(json_response['total_question_count'], 1)

    def test_get_question_count_when_no_question_is_assigned_to_skill(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        json_response = self.get_json(
            '%s/%s' % (feconf.QUESTION_COUNT_URL_PREFIX, self.skill_id))
        self.assertEqual(json_response['total_question_count'], 0)

    def test_get_question_count_fails_with_invalid_skill_ids(self) -> None:
        self.get_json(
            '%s/%s' % (feconf.QUESTION_COUNT_URL_PREFIX, 'id1'),
            expected_status_int=400)
