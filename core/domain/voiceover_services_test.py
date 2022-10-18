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

"""Tests for voiceover services."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import opportunity_services
from core.domain import question_services
from core.domain import rights_manager
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.domain import voiceover_services
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models,) = models.Registry.import_models([models.Names.SUGGESTION])


class VoiceoverApplicationServicesUnitTests(test_utils.GenericTestBase):
    """Provides testing of the voiceover services."""

    APPLICANT_USERNAME: Final = 'applicant'
    APPLICANT_EMAIL: Final = 'applicant@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.APPLICANT_EMAIL, self.APPLICANT_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.applicant_id = self.get_user_id_from_email(self.APPLICANT_EMAIL)

        self.applicant = user_services.get_user_actions_info(self.applicant_id)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        self.USER_ID = 'user'
        self.SKILL_ID = 'skill'
        self.QUESTION_ID = question_services.get_new_question_id()
        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            category=constants.ALL_CATEGORIES[i],
            end_state_name='End State',
            correctness_feedback_enabled=True
        ) for i in range(2)]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'topic', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(self.TOPIC_ID, self.admin_id)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A story', 'Description', self.TOPIC_ID,
            'a-story')
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID)
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id)
        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')

        self.add_user_role(
            self.CURRICULUM_ADMIN_USERNAME, feconf.ROLE_ID_VOICEOVER_ADMIN)

    def test_voiceover_application_creation(self) -> None:

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        self.assertEqual(user_voiceover_applications, [])

        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.applicant_id)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(user_voiceover_applications[0].target_id, '0')

    def test_get_voiceover_application_from_model_with_invalid_type_raise_error(
        self
    ) -> None:
        suggestion_models.GeneralVoiceoverApplicationModel(
            id='application_id',
            target_type='exploration',
            target_id='0',
            status='review',
            author_id='author_id',
            final_reviewer_id=None,
            language_code='en',
            filename='filename.mp3',
            content='<p>content</p>',
            rejection_message=None).put()
        voiceover_application_model = (
            suggestion_models.GeneralVoiceoverApplicationModel.get_by_id(
                'application_id'))
        voiceover_application_model.target_type = 'invalid_type'
        voiceover_application_model.update_timestamps()
        voiceover_application_model.put()
        with self.assertRaisesRegex(
            Exception,
            'Invalid target type for voiceover application: invalid_type'):
            voiceover_services.get_voiceover_application_by_id('application_id')

    def test_newly_created_voiceover_application_have_in_review_status(
        self
    ) -> None:
        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        self.assertEqual(user_voiceover_applications, [])

        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.applicant_id)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_IN_REVIEW)

    def test_get_reviewable_voiceover_applications(self) -> None:
        voiceover_applications = (
            voiceover_services.get_reviewable_voiceover_applications(
                self.admin_id))
        self.assertEqual(voiceover_applications, [])

        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.applicant_id)

        voiceover_applications = (
            voiceover_services.get_reviewable_voiceover_applications(
                self.admin_id))
        self.assertEqual(len(voiceover_applications), 1)
        self.assertEqual(
            voiceover_applications[0].status,
            suggestion_models.STATUS_IN_REVIEW)

    def test_accept_application_assigns_role_to_entity(self) -> None:
        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.applicant_id)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_IN_REVIEW)

        voiceover_services.accept_voiceover_application(
            user_voiceover_applications[0].voiceover_application_id,
            self.admin_id)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id, status=suggestion_models.STATUS_ACCEPTED))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_ACCEPTED)

        exploration_rights = rights_manager.get_exploration_rights('0')
        can_voiceover = rights_manager.check_can_voiceover_activity(
            self.applicant, exploration_rights)

        self.assertTrue(can_voiceover)

    def test_accept_application_removes_exploration_voiceover_opportunity(
        self
    ) -> None:
        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.applicant_id)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_IN_REVIEW)

        opportunities, _, more = (
            opportunity_services.get_voiceover_opportunities('en', None))
        self.assertEqual(len(opportunities), 1)

        voiceover_services.accept_voiceover_application(
            user_voiceover_applications[0].voiceover_application_id,
            self.admin_id)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id, status=suggestion_models.STATUS_ACCEPTED))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_ACCEPTED)

        opportunities, _, more = (
            opportunity_services.get_voiceover_opportunities('en', None))
        self.assertEqual(len(opportunities), 0)
        self.assertFalse(more)

    def test_accept_application_removes_rejectes_other_similar_applications(
        self
    ) -> None:
        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.applicant_id)

        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.owner_id)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_IN_REVIEW)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.owner_id))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_IN_REVIEW)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        voiceover_services.accept_voiceover_application(
            user_voiceover_applications[0].voiceover_application_id,
            self.admin_id)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id, status=suggestion_models.STATUS_ACCEPTED))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_ACCEPTED)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.owner_id))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_REJECTED)
        self.assertEqual(
            user_voiceover_applications[0].rejection_message,
            'We have to reject your application as another application for the '
            'same opportunity got accepted.')

    def test_author_accepts_own_voiceover_application_raise_exception(
        self
    ) -> None:
        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.applicant_id)
        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))

        with self.assertRaisesRegex(
            Exception, 'Applicants are not allowed to review their own '
            'voiceover application.'):
            voiceover_services.accept_voiceover_application(
                user_voiceover_applications[0].voiceover_application_id,
                self.applicant_id)

    def test_raises_exception_if_no_exploration_opportunity_summary_exist(
        self
    ) -> None:
        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.applicant_id)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        exploration_opportunity_summary = {'0': None}

        with self.swap_to_always_return(
            opportunity_services,
            'get_exploration_opportunity_summaries_by_ids',
            exploration_opportunity_summary):
            with self.assertRaisesRegex(
                Exception, 'No exploration summary exists for'):
                voiceover_services.accept_voiceover_application(
                    user_voiceover_applications[0].voiceover_application_id,
                    self.admin_id)

            with self.assertRaisesRegex(
                Exception, 'No exploration summary exists for'):
                voiceover_services.reject_voiceover_application(
                    user_voiceover_applications[0].voiceover_application_id,
                    self.admin_id, 'Rejection message')

    def test_reject_voiceover_application(self) -> None:
        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.applicant_id)

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_IN_REVIEW)

        opportunities, _, _ = (
            opportunity_services.get_voiceover_opportunities('en', None))
        self.assertEqual(len(opportunities), 1)

        voiceover_services.reject_voiceover_application(
            user_voiceover_applications[0].voiceover_application_id,
            self.admin_id, 'Rejection message')

        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))
        self.assertEqual(len(user_voiceover_applications), 1)
        self.assertEqual(
            user_voiceover_applications[0].status,
            suggestion_models.STATUS_REJECTED)

        opportunities, _, _ = (
            opportunity_services.get_voiceover_opportunities('en', None))
        self.assertEqual(len(opportunities), 1)

    def test_author_rejects_own_voiceover_application_raise_exception(
        self
    ) -> None:
        voiceover_services.create_new_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en', '',
            'audio_file.mp3', self.applicant_id)
        user_voiceover_applications = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id))

        with self.assertRaisesRegex(
            Exception, 'Applicants are not allowed to review their own '
            'voiceover application.'):
            voiceover_services.reject_voiceover_application(
                user_voiceover_applications[0].voiceover_application_id,
                self.applicant_id, 'Testing rejection')

    def test_get_text_to_create_voiceover_application(self) -> None:
        exp_services.update_exploration(
            self.owner_id, '0', [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_CONTENT),
                    'state_name': 'Introduction',
                    'new_value': {
                        'content_id': 'content',
                        'html': '<p>The new content to voiceover</p>'
                    }
                })], 'Adds new content to init state')

        content = voiceover_services.get_text_to_create_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'en')
        self.assertEqual(content, '<p>The new content to voiceover</p>')

    def test_get_text_to_create_voiceover_application_in_diff_language(
        self
    ) -> None:
        exp_services.update_exploration(
            self.owner_id, '0', [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_CONTENT),
                    'state_name': 'Introduction',
                    'new_value': {
                        'content_id': 'content',
                        'html': '<p>The new content to voiceover</p>'
                    }
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'Introduction',
                    'content_id': 'content',
                    'language_code': 'hi',
                    'content_html': '<p>The new content to voiceover</p>',
                    'translation_html': '<p>Translation in Hindi</p>',
                    'data_format': 'html'
                })], 'Adds new content to init state and its translation')

        content = voiceover_services.get_text_to_create_voiceover_application(
            feconf.ENTITY_TYPE_EXPLORATION, '0', 'hi')
        self.assertEqual(content, '<p>Translation in Hindi</p>')

    def test_get_text_to_create_voiceover_application_for_invalid_type(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Invalid target type: invalid_type'):
            voiceover_services.get_text_to_create_voiceover_application(
                'invalid_type', '0', 'hi')
