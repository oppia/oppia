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

"""Tests for the Question Player controller."""

from __future__ import annotations

import json

from core import feconf
from core.domain import skill_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.tests import test_utils

from typing import Dict


class SkillMasteryDataHandlerTest(test_utils.GenericTestBase):
    """Tests update skill mastery degree."""

    def setUp(self) -> None:
        """Completes the setup for SkillMasteryDataHandler."""
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_1, self.user_id, description='Skill Description 1')
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_2, self.user_id, description='Skill Description 2')

        self.degree_of_mastery_1 = 0.3
        self.degree_of_mastery_2 = 0.5

    def test_get_with_valid_skill_ids_list(self) -> None:
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_1, self.degree_of_mastery_1)
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_2, self.degree_of_mastery_2)

        skill_ids = [self.skill_id_1, self.skill_id_2]

        self.login(self.NEW_USER_EMAIL)
        response_json = self.get_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            params={
                'selected_skill_ids': json.dumps(skill_ids)
            })
        degrees_of_mastery = {
            self.skill_id_1: self.degree_of_mastery_1,
            self.skill_id_2: self.degree_of_mastery_2
        }
        self.assertEqual(
            response_json['degrees_of_mastery'], degrees_of_mastery)

        self.logout()

    def test_get_with_skill_without_skill_mastery(self) -> None:
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_1, self.degree_of_mastery_1)

        skill_ids = [self.skill_id_1, self.skill_id_2]

        self.login(self.NEW_USER_EMAIL)
        response_json = self.get_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            params={
                'selected_skill_ids': json.dumps(skill_ids)
            })
        degrees_of_mastery = {
            self.skill_id_1: self.degree_of_mastery_1,
            self.skill_id_2: None
        }
        self.assertEqual(
            response_json['degrees_of_mastery'], degrees_of_mastery)

        self.logout()

    def test_get_with_no_skill_ids_returns_400(self) -> None:
        self.login(self.NEW_USER_EMAIL)
        json_response = self.get_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'At \'http://localhost/skill_mastery_handler/data\' '
            'these errors are happening:\n'
            'Missing key in handler args: selected_skill_ids.')

        self.logout()

    def test_get_with_invalid_skill_ids_returns_400(self) -> None:
        skill_ids = ['invalid_skill_id']

        self.login(self.NEW_USER_EMAIL)
        json_response = self.get_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            params={
                'selected_skill_ids': json.dumps(skill_ids)
            }, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Invalid skill ID invalid_skill_id')

        self.logout()

    def test_get_with_nonexistent_skill_ids_returns_404(self) -> None:
        skill_id_3 = skill_services.get_new_skill_id()
        skill_ids = [self.skill_id_1, skill_id_3]

        self.login(self.NEW_USER_EMAIL)
        self.get_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            params={
                'selected_skill_ids': json.dumps(skill_ids)
            }, expected_status_int=404)

        self.logout()

    def test_put_with_valid_skill_mastery_dict(self) -> None:
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_1, self.degree_of_mastery_1)
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_2, self.degree_of_mastery_2)

        payload = {}
        mastery_change_per_skill = {
            self.skill_id_1: 0.3,
            self.skill_id_2: -0.3
        }
        payload['mastery_change_per_skill'] = mastery_change_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token)

        degrees_of_mastery = {
            self.skill_id_1: 0.6,
            self.skill_id_2: 0.2
        }

        self.assertEqual(
            skill_services.get_multi_user_skill_mastery(
                self.user_id, [self.skill_id_1, self.skill_id_2]),
            degrees_of_mastery)

        self.logout()

    def test_put_with_skill_with_no_skill_mastery(self) -> None:
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_1, self.degree_of_mastery_1)

        payload = {}
        mastery_change_per_skill = {
            self.skill_id_1: 0.3,
            self.skill_id_2: 0.3
        }
        payload['mastery_change_per_skill'] = mastery_change_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token)

        degrees_of_mastery = {
            self.skill_id_1: 0.6,
            self.skill_id_2: 0.3
        }

        self.assertEqual(
            skill_services.get_multi_user_skill_mastery(
                self.user_id, [self.skill_id_1, self.skill_id_2]),
            degrees_of_mastery)

        self.logout()

    def test_put_with_skill_mastery_lower_than_zero(self) -> None:
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_1, self.degree_of_mastery_1)
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_2, self.degree_of_mastery_2)

        payload = {}
        mastery_change_per_skill = {
            self.skill_id_1: -0.5,
            self.skill_id_2: 0.3
        }
        payload['mastery_change_per_skill'] = mastery_change_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token)

        degrees_of_mastery = {
            self.skill_id_1: 0.0,
            self.skill_id_2: 0.8
        }

        self.assertEqual(
            skill_services.get_multi_user_skill_mastery(
                self.user_id, [self.skill_id_1, self.skill_id_2]),
            degrees_of_mastery)

        self.logout()

    def test_put_with_skill_mastery_higher_than_one(self) -> None:
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_1, self.degree_of_mastery_1)
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_2, self.degree_of_mastery_2)

        payload = {}
        mastery_change_per_skill = {
            self.skill_id_1: 0.9,
            self.skill_id_2: 0.3
        }
        payload['mastery_change_per_skill'] = mastery_change_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token)

        degrees_of_mastery = {
            self.skill_id_1: 1.0,
            self.skill_id_2: 0.8
        }

        self.assertEqual(
            skill_services.get_multi_user_skill_mastery(
                self.user_id, [self.skill_id_1, self.skill_id_2]),
            degrees_of_mastery)

        self.logout()

    def test_put_with_invalid_type_returns_400(self) -> None:
        payload = {}
        mastery_change_per_skill = [self.skill_id_1, self.skill_id_2]
        payload['mastery_change_per_skill'] = mastery_change_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'At \'http://localhost/skill_mastery_handler/data\' '
            'these errors are happening:\n'
            'Schema validation for \'mastery_change_per_skill\' failed: ' +
            'Expected dict, received %s' % (mastery_change_per_skill)
        )

        self.logout()

    def test_put_with_no_mastery_change_per_skill_returns_400(self) -> None:
        payload: Dict[str, str] = {}

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'At \'http://localhost/skill_mastery_handler/data\' '
            'these errors are happening:\n'
            'Missing key in handler args: mastery_change_per_skill.'
        )

        self.logout()

    def test_put_with_invalid_skill_ids_returns_400(self) -> None:
        payload = {}
        mastery_change_per_skill = {
            'invalid_skill_id': 0.3
        }
        payload['mastery_change_per_skill'] = mastery_change_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'], 'Invalid skill ID invalid_skill_id')

        self.logout()

    def test_put_with_nonexistent_skill_ids_returns_404(self) -> None:
        skill_id_3 = skill_services.get_new_skill_id()
        payload = {}
        mastery_change_per_skill = {
            self.skill_id_1: 0.3,
            self.skill_id_2: 0.5,
            skill_id_3: 0.6
        }
        payload['mastery_change_per_skill'] = mastery_change_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=404)

        self.logout()

    def test_put_with_invalid_type_of_degree_of_mastery_returns_400(
        self
    ) -> None:
        payload = {}
        mastery_change_per_skill = {
            self.skill_id_1: 0.1,
            self.skill_id_2: {}
        }
        payload['mastery_change_per_skill'] = mastery_change_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'At \'http://localhost/skill_mastery_handler/data\' '
            'these errors are happening:\n'
            'Schema validation for \'mastery_change_per_skill\' failed: '
            'Could not convert dict to float: {}')

        mastery_change_per_skill = {
            self.skill_id_1: 0.1,
            self.skill_id_2: True
        }
        payload['mastery_change_per_skill'] = mastery_change_per_skill

        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'At \'http://localhost/skill_mastery_handler/data\' '
            'these errors are happening:\n'
            'Schema validation for \'mastery_change_per_skill\' failed: '
            'Expected float, received True')

        self.logout()

    def test_put_with_no_logged_in_user_returns_401(self) -> None:
        payload = {}
        mastery_change_per_skill = {
            self.skill_id_1: 0.3,
            self.skill_id_2: 0.5
        }
        payload['mastery_change_per_skill'] = mastery_change_per_skill

        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=401)

        self.assertEqual(
            json_response['error'],
            'You must be logged in to access this resource.')


class SubtopicMasteryDataHandlerTest(test_utils.GenericTestBase):
    """Tests get subtopic mastery degree."""

    def setUp(self) -> None:
        """Completes the setup for SubtopicMasteryDataHandler."""
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.set_curriculum_admins([self.NEW_USER_USERNAME])

        self.skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_1, self.user_id, description='Skill Description 1')
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_2, self.user_id, description='Skill Description 2')
        self.skill_id_3 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_3, self.user_id, description='Skill Description 3')
        self.skill_id_4 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_4, self.user_id, description='Skill Description 4')
        self.skill_id_5 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_5, self.user_id, description='Skill Description 5')
        self.skill_id_6 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_6, self.user_id, description='Skill Description 6')

        self.degree_of_mastery_1 = 0.1
        self.degree_of_mastery_2 = 0.3
        self.degree_of_mastery_3 = 0.5
        self.degree_of_mastery_4 = 0.7
        self.degree_of_mastery_5 = 0.9
        self.degree_of_mastery_6 = 0.6

    def test_get_with_valid_topic_ids(self) -> None:
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()

        self.save_new_topic(
            topic_id_1, self.user_id, name='Name 1',
            abbreviated_name='topic-one', url_fragment='topic-one',
            description='Description 1', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[
                self.skill_id_1, self.skill_id_2, self.skill_id_3],
            subtopics=[], next_subtopic_id=1)
        self.save_new_topic(
            topic_id_2, self.user_id, name='Name 2',
            abbreviated_name='topic-two', url_fragment='topic-two',
            description='Description 2', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[
                self.skill_id_3, self.skill_id_4, self.skill_id_5],
            subtopics=[], next_subtopic_id=1)

        # Update Topic 1.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title 1',
            'subtopic_id': 1,
            'url_fragment': 'subtopic-one'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': (
                topic_domain.SUBTOPIC_PROPERTY_URL_FRAGMENT),
            'old_value': '',
            'new_value': 'subtopic-one-one',
            'subtopic_id': 1
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 1,
            'skill_id': self.skill_id_1
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 1,
            'skill_id': self.skill_id_2
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title 2',
            'subtopic_id': 2,
            'url_fragment': 'subtopic-two'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': (
                topic_domain.SUBTOPIC_PROPERTY_URL_FRAGMENT),
            'old_value': '',
            'new_value': 'subtopic-one-two',
            'subtopic_id': 2
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 2,
            'skill_id': self.skill_id_3
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id, topic_id_1, changelist, 'Added subtopics.')

        # Update Topic 2.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title 1',
            'subtopic_id': 1,
            'url_fragment': 'subtopic-one'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': (
                topic_domain.SUBTOPIC_PROPERTY_URL_FRAGMENT),
            'old_value': '',
            'new_value': 'subtopic-two-one',
            'subtopic_id': 1
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 1,
            'skill_id': self.skill_id_3
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 1,
            'skill_id': self.skill_id_4
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title 2',
            'subtopic_id': 2,
            'url_fragment': 'subtopic-two'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': (
                topic_domain.SUBTOPIC_PROPERTY_URL_FRAGMENT),
            'old_value': '',
            'new_value': 'subtopic-two-two',
            'subtopic_id': 2
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 2,
            'skill_id': self.skill_id_5
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id, topic_id_2, changelist, 'Added subtopics.')
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_1, self.degree_of_mastery_1)
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_2, self.degree_of_mastery_2)
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_5, self.degree_of_mastery_5)
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_6, self.degree_of_mastery_6)

        self.login(self.NEW_USER_EMAIL)

        # First case: One subtopic mastery doesn't exist.
        response_json = self.get_json(
            '%s' % feconf.SUBTOPIC_MASTERY_DATA_URL,
            params={
                'selected_topic_ids': json.dumps([
                    topic_id_1, topic_id_2])
            })
        degrees_of_mastery_1 = {
            '1': (self.degree_of_mastery_1 + self.degree_of_mastery_2) / 2
        }
        degrees_of_mastery_2 = {
            '2': self.degree_of_mastery_5
        }
        self.assertEqual(
            response_json['subtopic_mastery_dict'], {
                topic_id_1: degrees_of_mastery_1,
                topic_id_2: degrees_of_mastery_2
            })

        # Second case: One skill mastery doesn't exist.
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_3, self.degree_of_mastery_3)
        response_json = self.get_json(
            '%s' % feconf.SUBTOPIC_MASTERY_DATA_URL,
            params={
                'selected_topic_ids': json.dumps([
                    topic_id_1, topic_id_2])
            })
        degrees_of_mastery_1 = {
            '1': (self.degree_of_mastery_1 + self.degree_of_mastery_2) / 2,
            '2': self.degree_of_mastery_3
        }
        degrees_of_mastery_2 = {
            '1': self.degree_of_mastery_3,
            '2': self.degree_of_mastery_5
        }
        self.assertEqual(
            response_json['subtopic_mastery_dict'], {
                topic_id_1: degrees_of_mastery_1,
                topic_id_2: degrees_of_mastery_2
            })

        # Third case: All masteries exist.
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_4, self.degree_of_mastery_4)
        response_json = self.get_json(
            '%s' % feconf.SUBTOPIC_MASTERY_DATA_URL, params={
                'selected_topic_ids': json.dumps([
                    topic_id_1, topic_id_2])
            })
        degrees_of_mastery_1 = {
            '1': (self.degree_of_mastery_1 + self.degree_of_mastery_2) / 2,
            '2': self.degree_of_mastery_3
        }
        degrees_of_mastery_2 = {
            '1': (self.degree_of_mastery_3 + self.degree_of_mastery_4) / 2,
            '2': self.degree_of_mastery_5
        }
        self.assertEqual(
            response_json['subtopic_mastery_dict'], {
                topic_id_1: degrees_of_mastery_1,
                topic_id_2: degrees_of_mastery_2
            })
        self.logout()

    def test_get_with_invalid_topic_id_returns_400(self) -> None:
        self.login(self.NEW_USER_EMAIL)
        response_json = self.get_json(
            '%s' % feconf.SUBTOPIC_MASTERY_DATA_URL,
            params={
                'selected_topic_ids': 'invalid_topic_id'
            }, expected_status_int=400)

        self.assertEqual(
            response_json['error'],
            'At \'http://localhost/subtopic_mastery_handler/data?'
            'selected_topic_ids=invalid_topic_id\' '
            'these errors are happening:\n'
            'Schema validation for \'selected_topic_ids\' failed: '
            'Expecting value: line 1 column 1 (char 0)')

        self.logout()

    def test_get_with_no_topic_ids_returns_400(self) -> None:
        self.login(self.NEW_USER_EMAIL)
        json_response = self.get_json(
            '%s' % feconf.SUBTOPIC_MASTERY_DATA_URL,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'At \'http://localhost/subtopic_mastery_handler/data\' '
            'these errors are happening:\n'
            'Missing key in handler args: selected_topic_ids.')

        self.logout()

    def test_with_delete_topic_id(self) -> None:
        self.login(self.NEW_USER_EMAIL)
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()

        with self.swap_to_always_return(
            topic_fetchers, 'get_topics_by_ids', [None, 'random_topic']
        ):
            json_response = self.get_json(
                '%s' % feconf.SUBTOPIC_MASTERY_DATA_URL,
                params={
                    'selected_topic_ids': json.dumps([topic_id_1, topic_id_2])
                },
                expected_status_int=400
            )

            self.assertEqual(
                json_response['error'], 'Invalid topic ID %s' % topic_id_1)

        self.logout()
