# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Tests for the diagnostic test player page."""

from __future__ import annotations

from core import feature_flag_list
from core import feconf
from core.domain import platform_parameter_registry
from core.domain import question_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import translation_domain
from core.domain import user_services
from core.tests import test_utils


class DiagnosticTestLandingPageTest(test_utils.GenericTestBase):
    """Test class for the diagnostic test player page."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.original_parameter_registry = (
            platform_parameter_registry.Registry.parameter_registry.copy())

    def tearDown(self) -> None:
        super().tearDown()
        platform_parameter_registry.Registry.parameter_registry = (
            self.original_parameter_registry)

    def test_should_not_access_diagnostic_test_page_when_feature_is_disabled(
        self) -> None:
        self.get_html_response(
            feconf.DIAGNOSTIC_TEST_PLAYER_PAGE_URL,
            expected_status_int=404
        )

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.DIAGNOSTIC_TEST])
    def test_should_access_diagnostic_test_page_when_feature_is_enabled(
        self
    ) -> None:
        self.get_html_response(
            feconf.DIAGNOSTIC_TEST_PLAYER_PAGE_URL,
            expected_status_int=200
        )


class DiagnosticTestQuestionsHandlerTest(test_utils.GenericTestBase):
    """Test class for the diagnostic test questions handler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.editor = user_services.get_user_actions_info(self.editor_id)

        self.topic_id = topic_fetchers.get_new_topic_id()
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1', 'skill_id_2', 'skill_id_3']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1], next_subtopic_id=2)

        self.save_new_skill(
            'skill_id_1', self.admin_id, description='Skill Description 1')
        self.save_new_skill(
            'skill_id_2', self.admin_id, description='Skill Description 2')
        self.save_new_skill(
            'skill_id_3', self.admin_id, description='Skill Description 3')

        self.question_id_1 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.question_1 = self.save_new_question(
            self.question_id_1, self.editor_id,
            self._create_valid_question_data(
                'ABC', content_id_generator),
            ['skill_id_1'],
            content_id_generator.next_content_id_index
        )
        self.question_dict_1 = self.question_1.to_dict()

        self.question_id_2 = question_services.get_new_question_id()
        self.question_2 = self.save_new_question(
            self.question_id_2, self.editor_id,
            self._create_valid_question_data(
                'ABC', content_id_generator),
            ['skill_id_1'],
            content_id_generator.next_content_id_index
        )
        self.question_dict_2 = self.question_2.to_dict()

        self.question_id_3 = question_services.get_new_question_id()
        self.question_3 = self.save_new_question(
            self.question_id_3, self.editor_id,
            self._create_valid_question_data(
                'ABC', content_id_generator
            ), ['skill_id_2'], content_id_generator.next_content_id_index
        )
        self.question_dict_3 = self.question_3.to_dict()

        self.question_id_4 = question_services.get_new_question_id()
        self.question_4 = self.save_new_question(
            self.question_id_4, self.editor_id,
            self._create_valid_question_data(
                'ABC', content_id_generator
            ), ['skill_id_2'], content_id_generator.next_content_id_index
        )
        self.question_dict_4 = self.question_4.to_dict()

        self.question_id_5 = question_services.get_new_question_id()
        self.question_5 = self.save_new_question(
            self.question_id_5, self.editor_id,
            self._create_valid_question_data(
                'ABC', content_id_generator
            ), ['skill_id_2'], content_id_generator.next_content_id_index
        )
        self.question_dict_5 = self.question_5.to_dict()

        self.question_id_6 = question_services.get_new_question_id()
        self.question_6 = self.save_new_question(
            self.question_id_6, self.editor_id,
            self._create_valid_question_data(
                'ABC', content_id_generator
            ), ['skill_id_3'], content_id_generator.next_content_id_index
        )
        self.question_dict_6 = self.question_6.to_dict()

        self.question_id_7 = question_services.get_new_question_id()
        self.question_7 = self.save_new_question(
            self.question_id_7, self.editor_id,
            self._create_valid_question_data(
                'ABC', content_id_generator
            ), ['skill_id_1'], content_id_generator.next_content_id_index
        )
        self.question_dict_7 = self.question_7.to_dict()

    def test_get_skill_id_to_question_dict_for_valid_topic_id(self) -> None:
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_1, 'skill_id_1', 0.5)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_2, 'skill_id_1', 0.5)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_7, 'skill_id_1', 0.5)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_3, 'skill_id_2', 0.5)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_4, 'skill_id_2', 0.5)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_5, 'skill_id_2', 0.5)

        # Skill 3 is only linked to a single question i.e., not satisfying the
        # condition for the main and backup question. So the response dict will
        # not contain skill 3.
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_6, 'skill_id_3', 0.5)

        url = '%s/%s?excluded_question_ids=%s' % (
            feconf.DIAGNOSTIC_TEST_QUESTIONS_HANDLER_URL, self.topic_id,
            self.question_id_5
        )

        json_response = self.get_json(url)
        received_skill_id_to_questions_dict = json_response[
            'skill_id_to_questions_dict']

        expected_skill_id_to_question_ids = {
            'skill_id_1': [
                self.question_id_1, self.question_id_2, self.question_id_7],
            'skill_id_2': [self.question_id_3, self.question_id_5]
        }

        # The equality of received dict and expected dict is not directly
        # checked here because the main question and the backup question are
        # of the same priority so the order in which they are fetched from
        # the datastore is not fixed. Hence the items in the nested skill ID
        # dict are validated individually.
        self.assertItemsEqual(
            list(received_skill_id_to_questions_dict.keys()),
            list(expected_skill_id_to_question_ids.keys())
        )

        for skill_id, questions in received_skill_id_to_questions_dict.items():
            self.assertTrue(
                questions['main_question']['id'],
                expected_skill_id_to_question_ids[skill_id]
            )
            self.assertTrue(
                questions['backup_question']['id'],
                expected_skill_id_to_question_ids[skill_id]
            )

    def test_raise_error_for_non_existent_topic_id(self) -> None:
        non_existent_topic_id = topic_fetchers.get_new_topic_id()

        url = '%s/%s?excluded_question_ids=%s' % (
            feconf.DIAGNOSTIC_TEST_QUESTIONS_HANDLER_URL,
            non_existent_topic_id, '')

        self.get_json(url, expected_status_int=404)
