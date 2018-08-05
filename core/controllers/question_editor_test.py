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

"""Tests for the Question Editor controller."""

from core.domain import question_services
from core.domain import skill_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])


class BaseQuestionEditorControllerTest(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseQuestionEditorControllerTest, self).setUp()
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


class QuestionCreationHandlerTest(BaseQuestionEditorControllerTest):
    """Tests returning of new question ids and creating questions.
    """

    def setUp(self):
        """Completes the setup for QuestionSkillLinkHandlerTest."""
        super(QuestionCreationHandlerTest, self).setUp()
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(self.skill_id, self.admin_id, 'Skill Description')

    def test_post(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.post(
                '%s/%s' % (feconf.NEW_QUESTION_URL, self.skill_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(feconf.CREATOR_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)
            question_dict = self.question.to_dict()
            question_dict['id'] = None
            self.post_json(
                '%s/%s' % (feconf.NEW_QUESTION_URL, self.skill_id), {
                    'question_dict': question_dict
                }, csrf_token=csrf_token, expect_errors=False,
                expected_status_int=200)
            all_models = question_models.QuestionModel.get_all()
            questions = [
                question_services.get_question_from_model(model)
                for model in all_models
            ]
            self.assertEqual(len(questions), 2)
            self.logout()

            self.login(self.TOPIC_MANAGER_EMAIL)
            response = self.testapp.get(feconf.CREATOR_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)
            question_dict = self.question.to_dict()
            question_dict['id'] = None
            self.post_json(
                '%s/%s' % (feconf.NEW_QUESTION_URL, self.skill_id), {
                    'question_dict': question_dict
                }, csrf_token=csrf_token, expect_errors=False,
                expected_status_int=200)
            all_models = question_models.QuestionModel.get_all()
            questions = [
                question_services.get_question_from_model(model)
                for model in all_models
            ]
            self.assertEqual(len(questions), 3)
            self.logout()


class QuestionSkillLinkHandlerTest(BaseQuestionEditorControllerTest):
    """Tests link and unlink question from skills.
    """

    def setUp(self):
        """Completes the setup for QuestionSkillLinkHandlerTest."""
        super(QuestionSkillLinkHandlerTest, self).setUp()
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(self.skill_id, self.admin_id, 'Skill Description')
        self.question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            self.question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'))

    def test_post(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(feconf.CREATOR_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)
            response = self.testapp.post(
                '%s/%s/%s' % (
                    feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id,
                    self.skill_id
                ), expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(feconf.CREATOR_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)
            self.post_json(
                '%s/%s/%s' % (
                    feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id,
                    self.skill_id
                ), {}, csrf_token=csrf_token, expect_errors=False,
                expected_status_int=200)
            question_summaries, _ = (
                question_services.get_question_summaries_linked_to_skills([
                    self.skill_id], ''))
            self.assertEqual(len(question_summaries), 1)
            self.assertEqual(question_summaries[0].id, self.question_id)
            self.logout()

            self.login(self.TOPIC_MANAGER_EMAIL)
            response = self.testapp.get(feconf.CREATOR_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)
            self.post_json(
                '%s/%s/%s' % (
                    feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id_2,
                    self.skill_id
                ), {}, csrf_token=csrf_token, expect_errors=False,
                expected_status_int=200)
            question_summaries, _ = (
                question_services.get_question_summaries_linked_to_skills([
                    self.skill_id], ''))
            self.assertEqual(len(question_summaries), 2)
            question_ids = [summary.id for summary in question_summaries]
            self.assertItemsEqual(
                question_ids, [self.question_id, self.question_id_2])
            self.logout()

    def test_delete(self):
        question_services.create_new_question_skill_link(
            self.question_id, self.skill_id)
        question_services.create_new_question_skill_link(
            self.question_id_2, self.skill_id)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.delete(
                '%s/%s/%s' % (
                    feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id,
                    self.skill_id
                ), expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            self.login(self.ADMIN_EMAIL)
            self.testapp.delete(
                '%s/%s/%s' % (
                    feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id,
                    self.skill_id
                ), expect_errors=False)
            question_summaries, _ = (
                question_services.get_question_summaries_linked_to_skills([
                    self.skill_id], ''))
            self.assertEqual(len(question_summaries), 1)
            self.assertEqual(question_summaries[0].id, self.question_id_2)
            self.logout()

            self.login(self.TOPIC_MANAGER_EMAIL)
            self.testapp.delete(
                '%s/%s/%s' % (
                    feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id_2,
                    self.skill_id
                ), expect_errors=False)
            question_summaries, _ = (
                question_services.get_question_summaries_linked_to_skills([
                    self.skill_id], ''))
            self.assertEqual(len(question_summaries), 0)
            self.logout()


class EditableQuestionDataHandlerTest(BaseQuestionEditorControllerTest):
    """Tests get, put and delete methods of editable questions data handler.
    """

    def test_get(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that non-admin and topic_manager cannot access the editor
            # data.
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (
                    feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            self.login(self.ADMIN_EMAIL)
            response_dict = self.get_json('%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id))
            self.assertEqual(
                response_dict['question_dict']['id'], self.question_id)
            self.assertEqual(
                response_dict['question_dict']['version'], 1)
            self.assertEqual(
                response_dict['question_dict']['question_state_data'],
                self.question.question_state_data.to_dict())
            self.logout()

            self.login(self.TOPIC_MANAGER_EMAIL)
            response_dict = self.get_json('%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id))
            self.assertEqual(
                response_dict['question_dict']['id'], self.question_id)
            self.assertEqual(
                response_dict['question_dict']['version'], 1)
            self.assertEqual(
                response_dict['question_dict']['question_state_data'],
                self.question.question_state_data.to_dict())
            self.logout()

            # Check that question creator can view the data.
            self.login(self.EDITOR_EMAIL)
            response_dict = self.get_json('%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id))
            self.assertEqual(
                response_dict['question_dict']['id'], self.question_id)
            self.assertEqual(
                response_dict['question_dict']['version'], 1)
            self.assertEqual(
                response_dict['question_dict']['question_state_data'],
                self.question.question_state_data.to_dict())
            self.logout()

    def test_delete(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.delete(
                '%s/%s' % (
                    feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id))
            self.assertEqual(response.status_int, 200)
            self.logout()

    def test_put(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            payload = {}
            new_question_data = self._create_valid_question_data('DEF')
            change_list = [{
                'cmd': 'update_question_property',
                'property_name': 'question_state_data',
                'new_value': new_question_data.to_dict(),
                'old_value': self.question.question_state_data.to_dict()
            }]
            payload['change_list'] = change_list
            payload['commit_message'] = 'update question data'

            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(feconf.CREATOR_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)
            response_json = self.put_json(
                '%s/%s' % (
                    feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
                payload,
                csrf_token=csrf_token,
                expect_errors=False)
            self.assertEqual(
                response_json['question_dict']['language_code'], 'en')
            self.assertEqual(
                response_json['question_dict']['question_state_data'],
                new_question_data.to_dict())
            self.assertEqual(
                response_json['question_dict']['id'], self.question_id)
            del payload['change_list']
            self.put_json(
                '%s/%s' % (
                    feconf.QUESTION_EDITOR_DATA_URL_PREFIX,
                    self.question_id), payload,
                csrf_token=csrf_token,
                expect_errors=True,
                expected_status_int=404)
            del payload['commit_message']
            payload['change_list'] = change_list
            self.put_json(
                '%s/%s' % (
                    feconf.QUESTION_EDITOR_DATA_URL_PREFIX,
                    self.question_id), payload,
                csrf_token=csrf_token,
                expect_errors=True,
                expected_status_int=404)
            payload['commit_message'] = 'update question data'
            self.put_json(
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, payload,
                csrf_token=csrf_token,
                expect_errors=True,
                expected_status_int=404)
            self.logout()

            self.login(self.TOPIC_MANAGER_EMAIL)
            response = self.testapp.get(feconf.CREATOR_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)
            payload = {}
            new_question_data = self._create_valid_question_data('GHI')
            change_list = [{
                'cmd': 'update_question_property',
                'property_name': 'question_state_data',
                'new_value': new_question_data.to_dict(),
                'old_value': self.question.question_state_data.to_dict()
            }]
            payload['change_list'] = change_list
            payload['commit_message'] = 'update question data'
            response_json = self.put_json(
                '%s/%s' % (
                    feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
                payload,
                csrf_token=csrf_token,
                expect_errors=False)

            self.assertEqual(
                response_json['question_dict']['language_code'], 'en')
            self.assertEqual(
                response_json['question_dict']['question_state_data'],
                new_question_data.to_dict())
            self.assertEqual(
                response_json['question_dict']['id'], self.question_id)
            self.logout()

            # Check that the question creator can edit the question.
            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.CREATOR_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)
            payload = {}
            new_question_data = self._create_valid_question_data('GHI')
            change_list = [{
                'cmd': 'update_question_property',
                'property_name': 'question_state_data',
                'new_value': new_question_data.to_dict(),
                'old_value': self.question.question_state_data.to_dict()
            }]
            payload['change_list'] = change_list
            payload['commit_message'] = 'update question data'
            response_json = self.put_json(
                '%s/%s' % (
                    feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
                payload,
                csrf_token=csrf_token,
                expect_errors=False)

            self.assertEqual(
                response_json['question_dict']['language_code'], 'en')
            self.assertEqual(
                response_json['question_dict']['question_state_data'],
                new_question_data.to_dict())
            self.assertEqual(
                response_json['question_dict']['id'], self.question_id)
            self.logout()
