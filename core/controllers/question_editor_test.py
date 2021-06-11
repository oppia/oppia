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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from constants import constants
from core.domain import question_fetchers
from core.domain import question_services
from core.domain import skill_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(question_models,) = models.Registry.import_models([models.NAMES.question])


class BaseQuestionEditorControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseQuestionEditorControllerTests, self).setUp()
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

        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Skill Description')

        self.question_id = question_services.get_new_question_id()
        self.question = self.save_new_question(
            self.question_id,
            self.editor_id,
            self._create_valid_question_data('ABC'),
            [self.skill_id])


class QuestionCreationHandlerTest(BaseQuestionEditorControllerTests):
    """Tests returning of new question ids and creating questions."""

    def test_post_with_non_admin_or_topic_manager_email_disallows_access(self):
        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'skill_ids': [self.skill_id]
            }, csrf_token=csrf_token, expected_status_int=401)
        self.logout()

    def test_post_with_editor_email_does_not_allow_question_creation(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['id'] = None
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id]
            }, csrf_token=csrf_token, expected_status_int=401)
        self.logout()

    def test_post_with_incorrect_skill_id_returns_404(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        incorrect_skill_id = 'abc123456789'
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'skill_ids': [incorrect_skill_id]
            }, csrf_token=csrf_token, expected_status_int=404)
        self.logout()

    def test_post_with_no_skill_ids_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.NEW_QUESTION_URL, {},
            csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_incorrect_list_of_skill_ids_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        incorrect_skill_ids = [1, 2]
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'skill_ids': incorrect_skill_ids
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_incorrect_type_of_skill_ids_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        incorrect_skill_id = 1
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'skill_ids': [incorrect_skill_id],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_incorrect_question_id_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['id'] = 'abc123456789'
        question_dict['version'] = 0
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id]
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_incorrect_question_schema_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        del question_dict['question_state_data']['content']
        question_dict['version'] = 0
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_no_skill_difficulty_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['id'] = None
        question_dict['version'] = 0
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id]
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_incorrect_version_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['version'] = 1
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id]
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_wrong_skill_difficulty_length_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['id'] = None
        question_dict['version'] = 0
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id],
                'skill_difficulties': [0.6, 0.8]
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_invalid_skill_difficulty_type_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['id'] = None
        question_dict['version'] = 0
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id],
                'skill_difficulties': ['test']
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_invalid_skill_difficulty_value_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['id'] = None
        question_dict['version'] = 0
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id],
                'skill_difficulties': [2.0]
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_admin_email_allows_question_creation(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['id'] = None
        question_dict['version'] = 0
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id],
                'skill_difficulties': [0.6]
            }, csrf_token=csrf_token, expected_status_int=200)
        all_models = question_models.QuestionModel.get_all()
        questions = [
            question_fetchers.get_question_from_model(model)
            for model in all_models
        ]
        self.assertEqual(len(questions), 2)
        self.logout()

    def test_post_with_topic_manager_email_allows_question_creation(self):
        self.login(self.TOPIC_MANAGER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['id'] = None
        question_dict['version'] = 0
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id],
                'skill_difficulties': [0.6]
            }, csrf_token=csrf_token)
        all_models = question_models.QuestionModel.get_all()
        questions = [
            question_fetchers.get_question_from_model(model)
            for model in all_models
        ]
        self.assertEqual(len(questions), 2)
        self.logout()

    def test_post_with_invalid_question_returns_400_status(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['id'] = None
        question_dict['question_state_data'] = 'invalid_question_state_data'
        question_dict['version'] = 0
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'question_dict': question_dict,
                'skill_ids': [self.skill_id],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_too_many_skills_returns_400(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        skill_ids = [1, 2, 3, 4]
        self.post_json(
            feconf.NEW_QUESTION_URL, {
                'skill_ids': skill_ids
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_post_with_valid_images(self):
        """Test question creation with valid images."""
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        filename = 'img.png'
        question_dict = self.question.to_dict()
        question_dict['id'] = None
        question_dict['version'] = 0
        content_html = (
            '<oppia-noninteractive-image filepath-with-value='
            '"&quot;img.png&quot;" caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Image&quot;"></oppia-noninteractive-image>'
        )
        question_dict['question_state_data']['content']['html'] = content_html
        post_data = {
            'question_dict': question_dict,
            'skill_ids': [self.skill_id],
            'skill_difficulties': [0.6]
        }

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        self.post_json(
            feconf.NEW_QUESTION_URL, post_data,
            csrf_token=csrf_token,
            upload_files=(
                (filename, filename, raw_image), )
        )
        all_models = question_models.QuestionModel.get_all()
        questions = [
            question_fetchers.get_question_from_model(model)
            for model in all_models
        ]
        self.assertEqual(len(questions), 2)
        self.logout()

    def test_post_with_invalid_images(self):
        """Test question creation with invalid images."""
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        question_dict = self.question.to_dict()
        question_dict['id'] = None
        question_dict['version'] = 0
        content_html = (
            '<oppia-noninteractive-image filepath-with-value='
            '"&quot;img.svg&quot;" caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Image&quot;"></oppia-noninteractive-image>'
        )
        question_dict['question_state_data']['content']['html'] = content_html
        post_data = {
            'question_dict': question_dict,
            'skill_ids': [self.skill_id],
            'skill_difficulties': [0.6]
        }

        response_dict = self.post_json(
            feconf.NEW_QUESTION_URL, post_data,
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertIn(
            'No image data provided for file with name img.svg.',
            response_dict['error'])

        large_image = '<svg><path d="%s" /></svg>' % (
            'M150 0 L75 200 L225 200 Z ' * 4000)
        response_dict = self.post_json(
            feconf.NEW_QUESTION_URL, post_data,
            csrf_token=csrf_token,
            upload_files=(
                ('img.svg', 'img.svg', large_image),
            ), expected_status_int=400)
        self.assertIn(
            'Image exceeds file size limit of 100 KB.',
            response_dict['error'])
        self.logout()


class QuestionSkillLinkHandlerTest(BaseQuestionEditorControllerTests):
    """Tests link and unlink question from skills."""

    def setUp(self):
        """Completes the setup for QuestionSkillLinkHandlerTest."""
        super(QuestionSkillLinkHandlerTest, self).setUp()
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Skill Description')
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_2, self.admin_id, description='Skill Description 2')
        self.question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            self.question_id_2, self.editor_id,
            self._create_valid_question_data('ABC'), [self.skill_id])

    def test_put_with_non_admin_or_topic_manager_disallows_access(self):
        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id
            ), {
                'skill_ids_task_list': [{
                    'id': 'skill_2',
                    'task': 'update_difficulty',
                    'difficulty': 0.9
                }]
            },
            csrf_token=csrf_token,
            expected_status_int=401)
        self.logout()

    def test_put_with_admin_email_allows_updation(self):
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, self.skill_id, 0.5)
        (
            question_summaries, merged_question_skill_links) = (
                question_services.get_displayable_question_skill_link_details(
                    5, [self.skill_id], 0))
        self.assertEqual(len(question_summaries), 1)
        self.assertEqual(
            merged_question_skill_links[0].skill_difficulties, [0.5])

        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id
            ), {
                'skill_ids_task_list': [{
                    'id': self.skill_id,
                    'task': 'update_difficulty',
                    'difficulty': 0.9
                }]
            }, csrf_token=csrf_token)

        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id
            ), {
                'skill_ids_task_list': [{
                    'id': 'skill_2',
                    'task': 'add',
                    'difficulty': 0.6
                }]
            }, csrf_token=csrf_token)
        (
            question_summaries, merged_question_skill_links) = (
                question_services.get_displayable_question_skill_link_details(
                    5, [self.skill_id, 'skill_2'], 0))
        self.assertEqual(len(question_summaries), 1)
        self.assertEqual(len(merged_question_skill_links), 1)
        self.assertEqual(
            merged_question_skill_links[0].skill_difficulties, [0.6, 0.9])

        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id
            ), {
                'skill_ids_task_list': [{
                    'id': 'skill_2',
                    'task': 'remove'
                }]
            }, csrf_token=csrf_token)
        question_summaries, _, = (
            question_services.get_displayable_question_skill_link_details(
                5, ['skill_2'], 0))
        self.assertEqual(len(question_summaries), 0)
        self.logout()

    def test_put_with_invalid_input_throws_error(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id
            ), {
                'skill_ids_task_list': [{
                    'task': 'update_difficulty',
                    'difficulty': 0.9
                }]
            }, csrf_token=csrf_token, expected_status_int=400)
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id
            ), {
                'skill_ids_task_list': {
                    'task': 'invalid_task'
                }
            }, csrf_token=csrf_token, expected_status_int=400)
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id
            ), {}, csrf_token=csrf_token, expected_status_int=400)
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id
            ), {
                'skill_ids_task_list': [{
                    'id': 'skill_2',
                    'task': 'invalid'
                }]
            }, csrf_token=csrf_token, expected_status_int=400)
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id
            ), {
                'skill_ids_task_list': [{
                    'task': 'add'
                }]
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_put_with_topic_manager_email_allows_updation(self):
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, self.skill_id, 0.3)

        self.login(self.TOPIC_MANAGER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_SKILL_LINK_URL_PREFIX, self.question_id
            ), {
                'skill_ids_task_list': [{
                    'id': self.skill_id,
                    'task': 'update_difficulty',
                    'difficulty': 0.6
                }]
            }, csrf_token=csrf_token)
        (
            question_summaries, merged_question_skill_links) = (
                question_services.get_displayable_question_skill_link_details(
                    5, [self.skill_id], 0))
        self.assertEqual(len(question_summaries), 1)
        self.assertEqual(len(merged_question_skill_links), 1)
        self.assertEqual(
            merged_question_skill_links[0].skill_difficulties, [0.6])
        self.logout()


class EditableQuestionDataHandlerTest(BaseQuestionEditorControllerTests):
    """Tests get, put and delete methods of editable questions data handler."""

    def test_get_can_not_access_handler_with_invalid_question_id(self):
        self.login(self.ADMIN_EMAIL)
        self.get_json(
            '%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, 'invalid_question_id'),
            expected_status_int=404)
        self.logout()

    def test_delete_with_guest_does_not_allow_question_deletion(self):
        response = self.delete_json(
            '%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
            expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_delete_with_new_user_does_not_allow_question_deletion(self):
        self.login(self.NEW_USER_EMAIL)
        response = self.delete_json(
            '%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
            expected_status_int=401)
        self.assertIn(
            'does not have enough rights to delete the question.',
            response['error'])
        self.logout()

    def test_get_with_non_admin_or_topic_manager_email_disallows_access(self):
        self.login(self.NEW_USER_EMAIL)
        self.get_json(
            '%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
            expected_status_int=401)
        self.logout()

    def test_get_with_admin_email_allows_question_fetching(self):
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
        self.assertEqual(
            len(response_dict['associated_skill_dicts']), 1)
        self.assertEqual(
            response_dict['associated_skill_dicts'][0]['id'],
            self.skill_id)
        self.logout()

    def test_get_with_topic_manager_email_allows_question_fetching(self):
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
        self.assertEqual(
            len(response_dict['associated_skill_dicts']), 1)
        self.assertEqual(
            response_dict['associated_skill_dicts'][0]['id'],
            self.skill_id)
        self.logout()

    def test_get_with_invalid_question_id_returns_404_status(self):
        def _mock_get_question_by_id(unused_question_id, **unused_kwargs):
            """Mocks '_get_question_by_id'. Returns None."""
            return None

        question_services_swap = self.swap(
            question_services, 'get_question_by_id', _mock_get_question_by_id)

        with question_services_swap:
            self.login(self.EDITOR_EMAIL)
            self.get_json(
                '%s/%s' % (
                    feconf.QUESTION_EDITOR_DATA_URL_PREFIX,
                    self.question_id), expected_status_int=404)

            self.logout()

    def test_delete_with_incorrect_question_id_returns_404_status(self):
        self.login(self.ADMIN_EMAIL)
        self.delete_json(
            '%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, 'abc123456789'),
            expected_status_int=404)
        self.logout()

    def test_delete_with_admin_email_allows_question_deletion(self):
        self.login(self.ADMIN_EMAIL)
        self.delete_json(
            '%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
            expected_status_int=200)
        self.logout()

    def test_put_with_long_commit_message_fails(self):
        payload = {}
        new_question_data = self._create_valid_question_data('DEF')
        change_list = [{
            'cmd': 'update_question_property',
            'property_name': 'question_state_data',
            'new_value': new_question_data.to_dict(),
            'old_value': self.question.question_state_data.to_dict()
        }]
        payload['change_list'] = change_list
        payload['commit_message'] = (
            'a' * (constants.MAX_COMMIT_MESSAGE_LENGTH + 1))

        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response_json = self.put_json(
            '%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
            payload,
            csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(
            response_json['error'],
            'Commit messages must be at most 375 characters long.')

    def test_put_with_admin_email_allows_question_editing(self):
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
        csrf_token = self.get_new_csrf_token()
        response_json = self.put_json(
            '%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
            payload,
            csrf_token=csrf_token)
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
            csrf_token=csrf_token, expected_status_int=404)
        del payload['commit_message']
        payload['change_list'] = change_list
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX,
                self.question_id), payload,
            csrf_token=csrf_token, expected_status_int=404)
        payload['commit_message'] = 'update question data'
        self.put_json(
            feconf.QUESTION_EDITOR_DATA_URL_PREFIX, payload,
            csrf_token=csrf_token, expected_status_int=404)
        self.logout()

    def test_put_with_topic_manager_email_allows_question_editing(self):
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

        self.login(self.TOPIC_MANAGER_EMAIL)
        csrf_token = self.get_new_csrf_token()
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
            payload, csrf_token=csrf_token)

        self.assertEqual(
            response_json['question_dict']['language_code'], 'en')
        self.assertEqual(
            response_json['question_dict']['question_state_data'],
            new_question_data.to_dict())
        self.assertEqual(
            response_json['question_dict']['id'], self.question_id)
        self.logout()

    def test_put_with_creating_new_fully_specified_question_returns_400(self):
        payload = {}
        self._create_valid_question_data('XXX')
        change_list = [{
            'cmd': 'create_new_fully_specified_question',
            'question_dict': {},
            'skill_id': 'abc123'
        }]
        payload['change_list'] = change_list
        payload['commit_message'] = 'update question data'
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s/%s' % (
                feconf.QUESTION_EDITOR_DATA_URL_PREFIX, self.question_id),
            payload,
            csrf_token=csrf_token, expected_status_int=400)
        self.logout()
