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

"""Tests for the skill editor page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import caching_services
from core.domain import role_services
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class BaseSkillEditorControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseSkillEditorControllerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Description')
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_2, self.admin_id, description='Description')
        self.topic_id = topic_services.get_new_topic_id()
        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic1')
        subtopic.skill_ids = [self.skill_id]
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='name', url_fragment='name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)

    def delete_skill_model_and_memcache(self, user_id, skill_id):
        """Deletes skill model and memcache corresponding to the given skill
        id.
        """
        skill_model = skill_models.SkillModel.get(skill_id)
        skill_model.delete(user_id, 'Delete skill model.')
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_SKILL, None, [skill_id])

    def _mock_update_skill_raise_exception(
            self, unused_committer_id, unused_skill_id, unused_change_list,
            unused_commit_message):
        """Mocks skill updates. Always fails by raising a validation error."""
        raise utils.ValidationError()


class SkillEditorTest(BaseSkillEditorControllerTests):
    """Tests for SkillEditorPage."""

    def setUp(self):
        super(SkillEditorTest, self).setUp()
        self.url = '%s/%s' % (feconf.SKILL_EDITOR_URL_PREFIX, self.skill_id)

    def test_access_skill_editor_page(self):
        """Test access to editor pages for the sample skill."""

        # Check that non-admins cannot access the editor page.
        self.login(self.NEW_USER_EMAIL)
        self.get_html_response(
            self.url, expected_status_int=401)
        self.logout()

        # Check that admins can access and edit in the editor page.
        self.login(self.ADMIN_EMAIL)
        self.get_html_response(self.url)
        self.logout()

    def test_skill_editor_page_fails(self):
        self.login(self.ADMIN_EMAIL)

        # Check GET returns 404 when cannot get skill by id.
        self.delete_skill_model_and_memcache(self.admin_id, self.skill_id)
        self.get_html_response(self.url, expected_status_int=404)
        self.logout()


class SkillRightsHandlerTest(BaseSkillEditorControllerTests):
    """Tests for SkillRightsHandler."""

    def setUp(self):
        super(SkillRightsHandlerTest, self).setUp()
        self.url = '%s/%s' % (feconf.SKILL_RIGHTS_URL_PREFIX, self.skill_id)

    def test_skill_rights_handler_succeeds(self):
        self.login(self.ADMIN_EMAIL)
        # Check that admins can access and edit in the editor page.
        self.get_json(self.url)
        # Check GET returns JSON object with can_edit_skill_description set
        # to False if the user is not allowed to edit the skill description.
        def mock_get_all_actions(*_args):
            actions = list(self.admin.actions)
            actions.remove(role_services.ACTION_EDIT_SKILL_DESCRIPTION)
            return actions
        with self.swap(role_services, 'get_all_actions', mock_get_all_actions):
            json_response = self.get_json(self.url)
            self.assertEqual(json_response['can_edit_skill_description'], False)
        self.logout()


class EditableSkillDataHandlerTest(BaseSkillEditorControllerTests):
    """Tests for EditableSkillDataHandler."""

    def setUp(self):
        super(EditableSkillDataHandlerTest, self).setUp()
        self.url = '%s/%s' % (
            feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id)
        self.put_payload = {
            'version': 1,
            'commit_message': 'changed description',
            'change_dicts': [{
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'old_value': 'Description',
                'new_value': 'New Description'
            }]
        }

    def test_guest_can_not_delete_skill(self):
        response = self.delete_json(self.url, expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_new_user_can_not_delete_skill(self):
        self.login(self.NEW_USER_EMAIL)

        response = self.delete_json(self.url, expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You do not have credentials to delete the skill.')

        self.logout()

    def test_editable_skill_handler_get_succeeds(self):
        self.login(self.NEW_USER_EMAIL)
        # Check that admins can access the editable skill data.
        json_response = self.get_json(self.url)
        self.assertEqual(self.skill_id, json_response['skill']['id'])
        self.assertEqual(
            json_response['assigned_skill_topic_data_dict']['Name'],
            'Subtopic1')
        self.assertEqual(
            1, len(json_response['grouped_skill_summaries']['Name']))
        self.logout()

    def test_skill_which_is_assigned_to_topic_but_not_subtopic(self):
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='DescriptionSkill')
        topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.admin_id, name='TopicName1',
            abbreviated_name='topicname', url_fragment='topic-one',
            description='DescriptionTopic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[skill_id],
            subtopics=[], next_subtopic_id=1)

        url = '%s/%s' % (
            feconf.SKILL_EDITOR_DATA_URL_PREFIX, skill_id)

        json_response = self.get_json(url)
        self.assertEqual(skill_id, json_response['skill']['id'])
        self.assertIsNone(
            json_response['assigned_skill_topic_data_dict']['TopicName1'])
        self.assertEqual(
            1, len(json_response['grouped_skill_summaries']['Name']))
        self.logout()

    def test_skill_which_is_not_assigned_to_any_topic(self):
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='DescriptionSkill')

        url = '%s/%s' % (
            feconf.SKILL_EDITOR_DATA_URL_PREFIX, skill_id)

        json_response = self.get_json(url)
        self.assertEqual(skill_id, json_response['skill']['id'])
        self.assertEqual(json_response['assigned_skill_topic_data_dict'], {})
        self.assertEqual(
            1, len(json_response['grouped_skill_summaries']['Name']))
        self.logout()

    def test_skill_which_is_assigned_to_multiple_topics(self):
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='DescriptionSkill')

        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Addition')
        subtopic.skill_ids = [skill_id]
        topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.admin_id, name='Maths',
            abbreviated_name='maths', url_fragment='maths',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)

        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Chemistry')
        subtopic.skill_ids = [skill_id]
        topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.admin_id, name='Science',
            abbreviated_name='science', url_fragment='science',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)

        url = '%s/%s' % (
            feconf.SKILL_EDITOR_DATA_URL_PREFIX, skill_id)

        json_response = self.get_json(url)
        self.assertEqual(skill_id, json_response['skill']['id'])
        self.assertEqual(
            2, len(json_response['assigned_skill_topic_data_dict']))
        self.assertEqual(
            json_response['assigned_skill_topic_data_dict']['Maths'],
            'Addition')
        self.assertEqual(
            json_response['assigned_skill_topic_data_dict']['Science'],
            'Chemistry')
        self.assertEqual(
            1, len(json_response['grouped_skill_summaries']['Name']))
        self.logout()

    def test_editable_skill_handler_get_fails(self):
        self.login(self.NEW_USER_EMAIL)
        # Check GET returns 404 when cannot get skill by id.
        self.delete_skill_model_and_memcache(self.admin_id, self.skill_id)
        self.get_json(self.url, expected_status_int=404)
        self.logout()

    def test_editable_skill_handler_put_succeeds(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        # Check that admins can edit a skill.
        json_response = self.put_json(
            self.url, self.put_payload, csrf_token=csrf_token)
        self.assertEqual(self.skill_id, json_response['skill']['id'])
        self.assertEqual(
            'New Description', json_response['skill']['description'])
        self.logout()

    def test_editable_skill_handler_fails_long_commit_message(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        put_payload_copy = self.put_payload.copy()
        put_payload_copy['commit_message'] = (
            'a' * (constants.MAX_COMMIT_MESSAGE_LENGTH + 1))
        json_response = self.put_json(
            self.url, put_payload_copy, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            json_response['error'],
            'Commit messages must be at most 375 characters long.'
        )
        self.logout()

    def test_editable_skill_handler_put_fails(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        # Check PUT returns 400 when an exception is raised updating the
        # skill.
        update_skill_swap = self.swap(
            skill_services, 'update_skill',
            self._mock_update_skill_raise_exception)
        with update_skill_swap:
            self.put_json(
                self.url, self.put_payload, csrf_token=csrf_token,
                expected_status_int=400)
        self.put_payload['version'] = None
        self.put_json(
            self.url, self.put_payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.put_payload['version'] = -1
        self.put_json(
            self.url, self.put_payload, csrf_token=csrf_token,
            expected_status_int=400)
        # Check PUT returns 404 when cannot get skill by id.
        self.delete_skill_model_and_memcache(self.admin_id, self.skill_id)
        self.put_json(
            self.url, {}, csrf_token=csrf_token, expected_status_int=404)
        self.logout()

    def test_editable_skill_handler_delete_succeeds(self):
        self.login(self.ADMIN_EMAIL)
        # Check that admins can delete a skill.
        skill_has_topics_swap = self.swap(
            topic_services,
            'get_all_skill_ids_assigned_to_some_topic',
            lambda: [])
        with skill_has_topics_swap:
            self.delete_json(self.url)
        self.logout()

    def test_editable_skill_handler_delete_when_associated_questions_exist(
            self):
        self.login(self.ADMIN_EMAIL)
        # Check DELETE returns 400 when the skill still has associated
        # questions.
        skill_has_questions_swap = self.swap(
            skill_services, 'skill_has_associated_questions', lambda x: True)
        skill_has_topics_swap = self.swap(
            topic_services,
            'get_all_skill_ids_assigned_to_some_topic',
            lambda: [])
        with skill_has_questions_swap, skill_has_topics_swap:
            self.delete_json(self.url, expected_status_int=400)
        self.logout()

    def test_editable_skill_handler_delete_when_associated_topics_exist(self):
        self.login(self.ADMIN_EMAIL)
        # Check DELETE removes skill from the topic and returns 200 when the
        # skill still has associated topics.
        topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.admin_id, name='Topic1',
            abbreviated_name='topic-one', url_fragment='topic-one',
            description='Description1', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id],
            subtopics=[], next_subtopic_id=1)

        topic = topic_fetchers.get_topic_by_id(topic_id)
        self.assertTrue(self.skill_id in topic.get_all_skill_ids())

        self.delete_json(self.url, expected_status_int=200)

        topic = topic_fetchers.get_topic_by_id(topic_id)
        self.assertFalse(self.skill_id in topic.get_all_skill_ids())
        self.logout()


class SkillDataHandlerTest(BaseSkillEditorControllerTests):
    """Tests for SkillDataHandler."""

    def setUp(self):
        super(SkillDataHandlerTest, self).setUp()
        self.url = '%s/%s,%s' % (
            feconf.SKILL_DATA_URL_PREFIX, self.skill_id, self.skill_id_2)
        self.put_payload = {
            'version': 1,
            'commit_message': 'changed description',
            'change_dicts': [{
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'old_value': 'Description',
                'new_value': 'New Description'
            }]
        }

    def test_skill_data_handler_get_multiple_skills(self):
        self.login(self.ADMIN_EMAIL)
        # Check that admins can access two skills data at the same time.
        json_response = self.get_json(self.url)
        self.assertEqual(self.skill_id, json_response['skills'][0]['id'])
        self.assertEqual(self.skill_id_2, json_response['skills'][1]['id'])
        self.logout()

    def test_skill_data_handler_get_fails(self):
        self.login(self.ADMIN_EMAIL)
        # Check GET returns 404 when cannot get skill by id.
        self.delete_skill_model_and_memcache(self.admin_id, self.skill_id)
        self.get_json(self.url, expected_status_int=404)
        self.url = '%s/1,%s' % (
            feconf.SKILL_DATA_URL_PREFIX, self.skill_id_2)
        self.get_json(self.url, expected_status_int=404)
        self.logout()


class FetchSkillsHandlerTest(BaseSkillEditorControllerTests):
    """Tests for FetchSkillsHandler."""

    def setUp(self):
        super(FetchSkillsHandlerTest, self).setUp()
        self.url = feconf.FETCH_SKILLS_URL_PREFIX

    def test_skill_data_handler_get_multiple_skills(self):
        self.login(self.ADMIN_EMAIL)
        # Check that admins can access two skills data at the same time.
        json_response = self.get_json(self.url)
        self.assertEqual(self.skill_id, json_response['skills'][0]['id'])
        self.assertEqual(len(json_response['skills']), 1)
        self.logout()

    def test_skill_data_handler_get_fails(self):
        self.login(self.ADMIN_EMAIL)
        # Check GET returns 404 when cannot get skill by id.
        self.delete_skill_model_and_memcache(self.admin_id, self.skill_id)
        self.get_json(self.url, expected_status_int=404)
        self.logout()


class SkillDescriptionHandlerTest(BaseSkillEditorControllerTests):
    """Tests for SkillDescriptionHandler."""

    def setUp(self):
        super(SkillDescriptionHandlerTest, self).setUp()
        self.skill_description = 'Adding Fractions'
        self.url = '%s/%s' % (
            feconf.SKILL_DESCRIPTION_HANDLER, self.skill_description)

    def test_skill_description_handler_when_unique(self):
        self.login(self.ADMIN_EMAIL)
        json_response = self.get_json(self.url)
        self.assertEqual(json_response['skill_description_exists'], False)

        # Publish a skill.
        new_skill_id = skill_services.get_new_skill_id()
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skill = skill_domain.Skill.create_default_skill(
            new_skill_id, self.skill_description, rubrics)
        skill_services.save_new_skill(self.admin_id, skill)

        # Unique skill description does not exist.
        skill_description_2 = 'Subtracting Fractions'
        url_2 = '%s/%s' % (
            feconf.SKILL_DESCRIPTION_HANDLER, skill_description_2)
        json_response = self.get_json(url_2)
        self.assertEqual(json_response['skill_description_exists'], False)

    def test_skill_description_handler_when_duplicate(self):
        self.login(self.ADMIN_EMAIL)
        json_response = self.get_json(self.url)
        self.assertEqual(json_response['skill_description_exists'], False)

        # Publish a skill.
        new_skill_id = skill_services.get_new_skill_id()
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skill = skill_domain.Skill.create_default_skill(
            new_skill_id, self.skill_description, rubrics)
        skill_services.save_new_skill(self.admin_id, skill)

        # Skill description exists since we've already published it.
        json_response = self.get_json(self.url)
        self.assertEqual(json_response['skill_description_exists'], True)
