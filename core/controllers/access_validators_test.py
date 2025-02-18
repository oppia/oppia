# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.domain.access_validator."""

from __future__ import annotations

import datetime

from core import feature_flag_list
from core import feconf
from core.constants import constants
from core.domain import caching_services
from core.domain import classroom_config_domain
from core.domain import classroom_config_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_services
from core.domain import learner_group_fetchers
from core.domain import learner_group_services
from core.domain import rights_manager
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.storage.blog import gae_models as blog_models
from core.tests import test_utils

from typing import Dict, Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import blog_models
    from mypy_imports import skill_models

(blog_models,) = models.Registry.import_models([models.Names.BLOG])
(skill_models,) = models.Registry.import_models([models.Names.SKILL])

ACCESS_VALIDATION_HANDLER_PREFIX: Final = (
    feconf.ACCESS_VALIDATION_HANDLER_PREFIX
)


class ClassroomPageAccessValidationHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.save_new_valid_classroom()
        self.save_new_valid_classroom(
            'history', 'history', 'history',
            is_published=False,
        )

    def test_validation_returns_true_if_classroom_is_available(self) -> None:
        self.get_html_response(
            '%s/can_access_classroom_page?classroom_url_fragment=%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, 'math'))

    def test_validation_returns_false_if_classroom_doesnot_exists(self) -> None:
        self.get_json(
            '%s/can_access_classroom_page?classroom_url_fragment=%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, 'not_valid'),
            expected_status_int=404)

    def test_validation_returns_false_if_classroom_is_private(self) -> None:
        self.get_json(
            '%s/can_access_classroom_page?classroom_url_fragment=%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, 'history'),
            expected_status_int=404)

    def test_validation_returns_true_if_curriculum_admin_visit_hidden_classroom(
            self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.get_html_response(
            '%s/can_access_classroom_page?classroom_url_fragment=%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, 'history'))


class PracticeSessionAccessValidationPageTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.topic_id = 'topic'
        self.topic_id_1 = 'topic1'
        self.skill_id1 = 'skill_id_1'
        self.skill_id2 = 'skill_id_2'

        self.save_new_skill(
            self.skill_id1, self.admin_id, description='Skill 1')
        self.save_new_skill(
            self.skill_id2, self.admin_id, description='Skill 2')

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'public_topic_name',
            'public-topic-name', 'description', 'fragm')
        self.topic.subtopics.append(topic_domain.Subtopic(
            1, 'subtopic_name', [self.skill_id1], 'image.svg',
            constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
            'subtopic-name-one'))
        self.topic.subtopics.append(topic_domain.Subtopic(
            2, 'subtopic_name_2', [self.skill_id2], 'image.svg',
            constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
            'subtopic-name-two'))
        self.topic.next_subtopic_id = 3
        self.topic.skill_ids_for_diagnostic_test = [self.skill_id1]
        self.topic.thumbnail_filename = 'Topic.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        topic_services.save_new_topic(self.admin_id, self.topic)

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id_1, 'private_topic_name',
            'private-topic-name', 'description', 'fragm')
        self.topic.thumbnail_filename = 'Topic.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        topic_services.save_new_topic(self.admin_id, self.topic)

        topic_services.publish_topic(self.topic_id, self.admin_id)

        classroom_id_1 = classroom_config_services.get_new_classroom_id()
        topic_dependency_for_classroom_1: Dict[str, list[str]] = {
            self.topic_id: [],
            self.topic_id_1: [],
        }

        thumbnail_image = b''
        with open(
            'core/tests/data/thumbnail.svg', 'rt',
            encoding='utf-8') as svg_file:
            svg_file_content = svg_file.read()
            thumbnail_image = svg_file_content.encode('ascii')
        fs_services.save_original_and_compressed_versions_of_image(
            'thumbnail.svg', feconf.ENTITY_TYPE_CLASSROOM, classroom_id_1,
            thumbnail_image, 'thumbnail', False)

        banner_image = b''
        with open('core/tests/data/classroom-banner.png', 'rb') as png_file:
            banner_image = png_file.read()
        fs_services.save_original_and_compressed_versions_of_image(
            'banner.png', feconf.ENTITY_TYPE_CLASSROOM, classroom_id_1,
            banner_image, 'image', False)

        classroom_1 = classroom_config_domain.Classroom(
                        classroom_id=classroom_id_1,
                        name='math',
                        url_fragment='math',
                        course_details='Math course details',
                        teaser_text='Math teaser text',
                        topic_list_intro='Start with our first topic.',
                        topic_id_to_prerequisite_topic_ids=(
                            topic_dependency_for_classroom_1),
                        is_published=True,
                        is_diagnostic_test_enabled=False,
                        thumbnail_data=classroom_config_domain.ImageData(
                            'thumbnail.svg', 'transparent', 1000
                        ),
                        banner_data=classroom_config_domain.ImageData(
                            'banner.png', 'transparent', 1000
                        ),
                        index=0
                    )

        classroom_config_services.create_new_classroom(classroom_1)

    def test_any_user_can_access_practice_sessions_page(self) -> None:
        self.get_html_response(
            '%s/can_access_practice_session_page/%s/%s/practice/session' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, 'math', 'public-topic-name'),
                params={'selected_subtopic_ids': '[1,2]'},
            expected_status_int=200)

    def test_get_fails_when_subtopics_not_provided(self) -> None:
        self.get_html_response(
            '%s/can_access_practice_session_page/%s/%s/practice/session' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, 'math', 'public-topic-name'),
                expected_status_int=400)

    def test_get_fails_when_subtopic_id_is_invalid(self) -> None:
        self.get_html_response(
            '%s/can_access_practice_session_page/%s/%s/practice/session' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, 'math', 'public-topic-name'),
                params={'selected_subtopic_ids': '[999]'},
                expected_status_int=404)

    def test_get_fails_when_selected_subtopic_ids_is_none(self) -> None:
        self.get_html_response(
            '%s/can_access_practice_session_page/%s/%s/practice/session' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, 'math', 'public-topic-name'),
            expected_status_int=400)

    def test_get_fails_when_selected_subtopic_ids_contains_non_integer(self) -> None: # pylint: disable=line-too-long
        self.get_html_response(
            '%s/can_access_practice_session_page/%s/%s/practice/session' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, 'math', 'public-topic-name'),
            params={'selected_subtopic_ids': '["invalid"]'},
            expected_status_int=400)

    def test_get_succeeds_with_valid_subtopic_ids(self) -> None:
        self.get_html_response(
            '%s/can_access_practice_session_page/%s/%s/practice/session' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, 'math', 'public-topic-name'),
                params={'selected_subtopic_ids': '[1,2]'},
                expected_status_int=200)

    def test_no_user_can_access_unpublished_topic_practice_session_page(
        self
    ) -> None:
        self.get_html_response(
            '%s/can_access_practice_session_page/staging/%s/practice/session' % ( # pylint: disable=line-too-long
                ACCESS_VALIDATION_HANDLER_PREFIX, 'private-topic-name'),
                params={'selected_subtopic_ids': '[1,2]'},
            expected_status_int=302)

    def test_invalid_topic_url_fragment_raises_exception(self) -> None:
        self.get_html_response(
            '%s/can_access_practice_session_page/%s/%s/practice/session' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, 'math', 12345),
                params={'selected_subtopic_ids': '[1,2]'},
            expected_status_int=400)

    def test_get_fails_when_topic_doesnt_exist(self) -> None:
        self.get_html_response(
            '%s/can_access_practice_session_page/%s/%s/practice/session' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, 'math', 'invalid-topic'),
                params={'selected_subtopic_ids': '[1,2]'},
            expected_status_int=302)


class ClassroomsPageAccessValidationHandlerTests(test_utils.GenericTestBase):

    def test_validation_returns_false_if_no_public_classrooms_are_present(
            self) -> None:
        with self.swap(constants, 'DEV_MODE', False):
            self.get_json(
                '%s/can_access_classrooms_page' % (
                    ACCESS_VALIDATION_HANDLER_PREFIX),
                expected_status_int=404
            )

    def test_validation_returns_true_in_dev_mode_if_no_classroom_are_present(
            self) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            self.get_html_response(
                '%s/can_access_classrooms_page' %
                    ACCESS_VALIDATION_HANDLER_PREFIX)

    def test_validation_returns_true_if_we_have_public_classrooms(
            self) -> None:
        self.save_new_valid_classroom()
        self.get_html_response(
            '%s/can_access_classrooms_page' % ACCESS_VALIDATION_HANDLER_PREFIX)


class TopicViewerPageAccessValidationHandlerTests(test_utils.GenericTestBase):
    """Checks the access to the blog home page and its rendering."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)

    def test_any_user_can_access_topic_viewer_page(self) -> None:
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_classroom'
            }, csrf_token=csrf_token)
        self.logout()
        self.login(self.NEW_USER_EMAIL)
        self.get_html_response(
            '%s/can_access_topic_viewer_page/%s/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, 'math', 'fraction'),
            expected_status_int=200)

    def test_accessibility_of_unpublished_topic_viewer_page(self) -> None:
        self.login(self.NEW_USER_EMAIL)
        topic = topic_domain.Topic.create_default_topic(
            'topic_id_1', 'private_topic_name',
            'private_topic_name', 'description', 'fragm')
        topic.thumbnail_filename = 'Image.svg'
        topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        topic.url_fragment = 'private'
        topic_services.save_new_topic(self.admin_id, topic)

        self.get_json(
            '%s/can_access_topic_viewer_page/staging/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, 'private'),
            expected_status_int=404)
        self.logout()


class CollectionViewerPageAccessValidationHandlerTests(
        test_utils.GenericTestBase):
    """Test for collection page access validation."""

    COLLECTION_ID: Final = 'cid'
    OTHER_EDITOR_EMAIL: Final = 'another@example.com'

    def setUp(self) -> None:
        """Before each individual test, create a dummy collection."""
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.get_user_actions_info(self.editor_id)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.save_new_valid_collection(self.COLLECTION_ID, self.editor_id)

    def test_unpublished_collections_are_invisible_to_logged_out_users(
        self
    ) -> None:
        self.get_json(
            '%s/can_access_collection_player_page/%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, self.COLLECTION_ID),
            expected_status_int=404)

    def test_unpublished_collections_are_invisible_to_unconnected_users(
        self
    ) -> None:
        self.login(self.NEW_USER_EMAIL)
        self.get_json(
        '%s/can_access_collection_player_page/%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, self.COLLECTION_ID),
        expected_status_int=404)
        self.logout()

    def test_unpublished_collections_are_invisible_to_other_editors(
        self
    ) -> None:
        self.signup(self.OTHER_EDITOR_EMAIL, 'othereditorusername')
        self.save_new_valid_collection('cid2', self.OTHER_EDITOR_EMAIL)
        self.login(self.OTHER_EDITOR_EMAIL)
        self.get_json(
        '%s/can_access_collection_player_page/%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, self.COLLECTION_ID),
        expected_status_int=404)
        self.logout()

    def test_unpublished_collections_are_visible_to_their_editors(
        self
    ) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(
            '%s/can_access_collection_player_page/%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, self.COLLECTION_ID))
        self.logout()

    def test_unpublished_collections_are_visible_to_admins(self) -> None:
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.login(self.MODERATOR_EMAIL)
        self.get_html_response(
            '%s/can_access_collection_player_page/%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, self.COLLECTION_ID))
        self.logout()

    def test_published_collections_are_visible_to_logged_out_users(
        self
    ) -> None:
        rights_manager.publish_collection(self.editor, self.COLLECTION_ID)

        self.get_html_response(
            '%s/can_access_collection_player_page/%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, self.COLLECTION_ID))

    def test_published_collections_are_visible_to_logged_in_users(
        self
    ) -> None:
        rights_manager.publish_collection(self.editor, self.COLLECTION_ID)
        self.login(self.NEW_USER_EMAIL)
        self.get_html_response(
            '%s/can_access_collection_player_page/%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, self.COLLECTION_ID))

    def test_invalid_collection_error(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_json(
            '%s/can_access_collection_player_page/%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, 'none'),
            expected_status_int=404)
        self.logout()


class SubtopicViewerPageAccessValidationHandlerTests(
    test_utils.GenericTestBase):
    """Test for subtopic viewer page access validation."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.topic_id = 'topic_id'
        self.subtopic_id_1 = 1
        self.subtopic_id_2 = 2
        self.subtopic_page_1 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id_1, self.topic_id))
        self.subtopic_page_2 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id_2, self.topic_id))
        subtopic_page_services.save_subtopic_page(
            self.admin_id, self.subtopic_page_1, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': self.subtopic_id_1,
                'title': 'Sample',
                'url_fragment': 'sample-fragment'
            })]
        )
        subtopic_page_services.save_subtopic_page(
            self.admin_id, self.subtopic_page_2, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': self.subtopic_id_2,
                'title': 'Sample',
                'url_fragment': 'dummy-fragment'
            })]
        )
        subtopic_page_private_topic = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id_1, 'topic_id_2'))
        subtopic_page_services.save_subtopic_page(
            self.admin_id, subtopic_page_private_topic, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': self.subtopic_id_1,
                'title': 'Sample',
                'url_fragment': 'dummy-fragment-one'
            })]
        )
        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title', 'url-frag')
        subtopic.skill_ids = ['skill_id_1']
        subtopic.url_fragment = 'sub-url-frag-one'
        subtopic2 = topic_domain.Subtopic.create_default_subtopic(
            2, 'Subtopic Title 2', 'url-frag-two')
        subtopic2.skill_ids = ['skill_id_2']
        subtopic2.url_fragment = 'sub-url-frag-two'

        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='name', url_fragment='name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic, subtopic2], next_subtopic_id=3)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        self.save_new_topic(
            'topic_id_2', self.admin_id, name='Private_Name',
            abbreviated_name='pvttopic', url_fragment='pvttopic',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)

    def test_any_user_can_access_subtopic_viewer_page(self) -> None:
        self.get_html_response(
            '%s/can_access_subtopic_viewer_page/staging/name/revision/sub-url-frag-one' % # pylint: disable=line-too-long
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=200)


class ReleaseCoordinatorAccessValidationHandlerTests(
        test_utils.GenericTestBase):
    """Test for release coordinator access validation."""

    def setUp(self) -> None:
        """Complete the signup process for self.RELEASE_COORDINATOR_EMAIL."""
        super().setUp()
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_guest_user_does_not_pass_validation(self) -> None:
        self.get_json(
            '%s/can_access_release_coordinator_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=401)

    def test_exploration_editor_does_not_pass_validation(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_json(
            '%s/can_access_release_coordinator_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=401)

    def test_release_coordinator_passes_validation(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        self.get_html_response(
            '%s/can_access_release_coordinator_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX)


class ExplorationPlayerAccessValidationPageTests(
        test_utils.GenericTestBase):
    """Test for exploration player access validation."""

    def setUp(self) -> None:
        """Complete the signup process for self.RELEASE_COORDINATOR_EMAIL."""
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.get_user_actions_info(self.editor_id)

        self.exploration = self.save_new_valid_exploration(
            'asaB1nm2UGVI', self.editor_id, title=self.UNICODE_TEST_STRING,
            category=self.UNICODE_TEST_STRING)

        self.publish_exploration(self.editor_id, self.exploration.id)

    def test_exploration_player_page_with_invalid_id(self) -> None:
        self.get_html_response(
            '%s/can_access_exploration_player_page/invalid' % (
                ACCESS_VALIDATION_HANDLER_PREFIX),
            expected_status_int=404)

    def test_exploration_player_page_with_valid_id(self) -> None:
        self.get_html_response(
            '%s/can_access_exploration_player_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX,
                self.exploration.id),
            expected_status_int=200)

    def test_exploration_player_page_raises_error_with_invalid_exploration_version( # pylint: disable=line-too-long
        self) -> None:

        self.get_html_response(
            '%s/can_access_exploration_player_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX,
                self.exploration.id), params={
                'v': 10,
            }, expected_status_int=404
        )

    def test_exploration_player_page_with_valid_exploration_version(
        self) -> None:

        self.get_html_response(
            '%s/can_access_exploration_player_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX,
                self.exploration.id), params={
                'v': self.exploration.version,
                'parent': True,
            }, expected_status_int=200
        )

    def test_handler_raises_error_with_invaild_collection(self) -> None:
        self.login(self.OWNER_EMAIL)

        self.get_html_response(
            '%s/can_access_exploration_player_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX,
                self.exploration.id), params={
                'v': self.exploration.version,
                'collection_id': 'aZ9_______12'
            }, expected_status_int=404
        )
        self.logout()

    def test_handler_with_valid_collection(self) -> None:
        self.login(self.OWNER_EMAIL)
        col_id = 'aZ9_______12'
        self.save_new_valid_collection(col_id, self.owner_id)

        self.get_html_response(
            '%s/can_access_exploration_player_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX,
                self.exploration.id), params={
                'v': self.exploration.version,
                'collection_id': col_id
            }, expected_status_int=200
        )
        self.logout()


class DiagnosticTestPlayerPageAccessValidationHandlerTests(
        test_utils.GenericTestBase):
    """Test for diagnostic test player access validation."""

    def test_should_not_access_diagnostic_test_page_when_feature_is_disabled(
        self) -> None:
        self.get_json(
            '%s/can_access_diagnostic_test_player_page' % (
                ACCESS_VALIDATION_HANDLER_PREFIX),
                expected_status_int=404)

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.DIAGNOSTIC_TEST])
    def test_should_access_diagnostic_test_page_when_feature_is_enabled(
        self) -> None:
        self.get_html_response(
           '%s/can_access_diagnostic_test_player_page' % (
                ACCESS_VALIDATION_HANDLER_PREFIX),
            expected_status_int=200
        )


class ProfileExistsValidationHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_profile_validation_returns_true_if_user_views_other_profile(
        self
    ) -> None:
        # Viewer looks at editor's profile page.
        self.login(self.VIEWER_EMAIL)
        self.get_html_response(
            '%s/does_profile_exist/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.EDITOR_USERNAME))
        self.logout()

    def test_profile_validation_returns_true_if_user_views_own_profile(
        self
    ) -> None:
        # Editor looks at their own profile page.
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(
            '%s/does_profile_exist/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.EDITOR_USERNAME))
        self.logout()

    def test_profile_validation_returns_false_if_profile_doesnot_exist(
        self
    ) -> None:
        # Editor looks at non-existing profile page.
        self.login(self.EDITOR_EMAIL)
        self.get_json(
            '%s/does_profile_exist/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.BLOG_ADMIN_USERNAME),
                expected_status_int=404)
        self.logout()


class ManageOwnAccountValidationHandlerTests(test_utils.GenericTestBase):

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'
    username = 'user'
    user_email = 'user@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.banned_user_email, self.banned_user)
        self.signup(self.user_email, self.username)
        self.mark_user_banned(self.banned_user)

    def test_banned_user_cannot_manage_account(self) -> None:
        self.login(self.banned_user_email)
        self.get_json(
            '%s/can_manage_own_account' % ACCESS_VALIDATION_HANDLER_PREFIX,
            expected_status_int=401)

    def test_normal_user_can_manage_account(self) -> None:
        self.login(self.user_email)
        self.get_html_response(
            '%s/can_manage_own_account' % ACCESS_VALIDATION_HANDLER_PREFIX)
        self.logout()


class ViewLearnerGroupPageAccessValidationHandlerTests(
    test_utils.GenericTestBase
):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.facilitator_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.learner_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )
        learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Title', 'Description',
            [self.facilitator_id], [self.learner_id],
            ['subtopic_id_1'], ['story_id_1'])

        self.login(self.NEW_USER_EMAIL)

    def test_validation_returns_false_with_learner_groups_feature_disabled(
        self
    ) -> None:
        self.get_json(
            '%s/does_learner_group_exist/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.LEARNER_GROUP_ID),
                expected_status_int=404)
        self.logout()

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.LEARNER_GROUPS_ARE_ENABLED])
    def test_validation_returns_false_with_user_not_being_a_learner(
        self
    ) -> None:
        self.get_json(
            '%s/does_learner_group_exist/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.LEARNER_GROUP_ID),
                expected_status_int=404)
        self.logout()

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.LEARNER_GROUPS_ARE_ENABLED])
    def test_validation_returns_true_for_valid_learner(self) -> None:
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.learner_id, False)
        self.get_html_response(
            '%s/does_learner_group_exist/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.LEARNER_GROUP_ID))


class EditLearnerGroupPageAccessValidationHandlerTests(
    test_utils.GenericTestBase
):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.facilitator_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )
        learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Title', 'Description',
            [self.facilitator_id], [],
            ['subtopic_id_1'], ['story_id_1'])

    def test_validation_returns_false_with_learner_groups_feature_disabled(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.get_json(
            '%s/can_access_edit_learner_group_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.LEARNER_GROUP_ID),
                expected_status_int=404)

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.LEARNER_GROUPS_ARE_ENABLED])
    def test_validation_returns_false_with_user_not_being_a_facilitator(
        self
    ) -> None:
        self.login(self.NEW_USER_EMAIL)
        self.get_json(
            '%s/can_access_edit_learner_group_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.LEARNER_GROUP_ID),
                expected_status_int=404)

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.LEARNER_GROUPS_ARE_ENABLED])
    def test_validation_returns_true_for_valid_facilitator(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.get_html_response(
            '%s/can_access_edit_learner_group_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.LEARNER_GROUP_ID))


class FacilitatorDashboardPageAccessValidationHandlerTests(
        test_utils.GenericTestBase):
    """Test for facilitator dashboard access validation."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

    def test_should_not_access_facilitator_dashboard_when_feature_is_disabled(
        self) -> None:
        self.login(self.NEW_USER_EMAIL)
        self.get_json(
            '%s/can_access_facilitator_dashboard_page' % (
                ACCESS_VALIDATION_HANDLER_PREFIX),
                expected_status_int=404)

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.LEARNER_GROUPS_ARE_ENABLED])
    def test_should_access_facilitator_dashboard_page_when_feature_is_enabled(
        self) -> None:
        self.login(self.NEW_USER_EMAIL)
        self.get_html_response(
           '%s/can_access_facilitator_dashboard_page' % (
                ACCESS_VALIDATION_HANDLER_PREFIX),
            expected_status_int=200
        )


class CreateLearnerGroupPageAccessValidationHandlerTests(
    test_utils.GenericTestBase
):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

    def test_validation_returns_false_with_learner_groups_feature_disabled(
        self
    ) -> None:
        self.login(self.NEW_USER_EMAIL)
        self.get_json(
            '%s/can_access_create_learner_group_page' % (
                ACCESS_VALIDATION_HANDLER_PREFIX),
                expected_status_int=404)

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.LEARNER_GROUPS_ARE_ENABLED])
    def test_validation_returns_true_for_valid_user(self) -> None:
        self.login(self.NEW_USER_EMAIL)
        self.get_html_response(
            '%s/can_access_create_learner_group_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=200)


class BlogHomePageAccessValidationHandlerTests(test_utils.GenericTestBase):
    """Checks the access to the blog home page and its rendering."""

    def test_blog_home_page_access_without_logging_in(self) -> None:
        self.get_html_response(
            '%s/can_access_blog_home_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=200)

    def test_blog_home_page_access_without_having_rights(self) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_html_response(
            '%s/can_access_blog_home_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=200)
        self.logout()

    def test_blog_home_page_access_as_blog_admin(self) -> None:
        self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.login(self.BLOG_ADMIN_EMAIL)
        self.get_html_response(
            '%s/can_access_blog_home_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=200)
        self.logout()

    def test_blog_home_page_access_as_blog_post_editor(self) -> None:
        self.signup(self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.login(self.BLOG_EDITOR_EMAIL)
        self.get_html_response(
            '%s/can_access_blog_home_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=200)
        self.logout()


class BlogPostPageAccessValidationHandlerTests(test_utils.GenericTestBase):
    """Checks the access to the blog post page and its rendering."""

    def setUp(self) -> None:
        super().setUp()
        blog_post_model = blog_models.BlogPostModel(
            id='blog_one',
            author_id='user_1',
            content='content',
            title='title',
            published_on=datetime.datetime.utcnow(),
            url_fragment='sample-url',
            tags=['news'],
            thumbnail_filename='thumbnail.svg',
        )
        blog_post_model.update_timestamps()
        blog_post_model.put()

    def test_blog_post_page_access_without_logging_in(self) -> None:
        self.get_html_response(
            '%s/can_access_blog_post_page?blog_post_url_fragment=sample-url' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=200)

    def test_blog_post_page_access_without_having_rights(self) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_html_response(
            '%s/can_access_blog_post_page?blog_post_url_fragment=sample-url' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=200)
        self.logout()

    def test_blog_post_page_access_as_blog_admin(self) -> None:
        self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.login(self.BLOG_ADMIN_EMAIL)
        self.get_html_response(
            '%s/can_access_blog_post_page?blog_post_url_fragment=sample-url' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=200)
        self.logout()

    def test_blog_post_page_access_as_blog_post_editor(self) -> None:
        self.signup(self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.login(self.BLOG_EDITOR_EMAIL)
        self.get_html_response(
            '%s/can_access_blog_post_page?blog_post_url_fragment=sample-url' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=200)
        self.logout()

    def test_validation_returns_false_if_blog_post_is_not_available(
        self
    ) -> None:
        self.signup(self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.login(self.BLOG_EDITOR_EMAIL)

        self.get_json(
            '%s/can_access_blog_post_page?blog_post_url_fragment=invalid-url' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=404)
        self.logout()


class BlogAuthorProfilePageAccessValidationHandlerTests(
    test_utils.GenericTestBase):
    """Checks the access to the blog author profile page and its rendering."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)

    def test_blog_author_profile_page_access_without_logging_in(self) -> None:
        self.get_html_response(
            '%s/can_access_blog_author_profile_page/%s' % (
            ACCESS_VALIDATION_HANDLER_PREFIX, self.BLOG_ADMIN_USERNAME
            ), expected_status_int=200
        )

    def test_blog_author_profile_page_access_after_logging_in(self) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_html_response(
            '%s/can_access_blog_author_profile_page/%s' % (
            ACCESS_VALIDATION_HANDLER_PREFIX, self.BLOG_ADMIN_USERNAME
            ), expected_status_int=200
        )
        self.logout()

    def test_blog_author_profile_page_access_as_blog_admin(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        self.get_html_response(
            '%s/can_access_blog_author_profile_page/%s' % (
            ACCESS_VALIDATION_HANDLER_PREFIX, self.BLOG_ADMIN_USERNAME
            ), expected_status_int=200
        )
        self.logout()

    def test_validation_returns_false_if_given_user_is_not_blog_post_author(
        self
    ) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_json(
            '%s/can_access_blog_author_profile_page/%s' % (
            ACCESS_VALIDATION_HANDLER_PREFIX, self.VIEWER_USERNAME
            ), expected_status_int=404
        )
        self.logout()

    def test_validation_returns_false_if_given_user_is_non_existent(
        self
    ) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_json(
            '%s/can_access_blog_author_profile_page/invalid_username' % (
            ACCESS_VALIDATION_HANDLER_PREFIX
            ), expected_status_int=404
        )
        self.logout()


class TopicEditorPageAccessValidationPage(test_utils.GenericTestBase):
    """Checks the access to the topic editor page and its rendering."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='topic-one', url_fragment='topic-one',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

    def test_access_topic_editor_page_with_curriculum_admin_right(
            self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.get_html_response(
            '%s/can_access_topic_editor/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.topic_id),
                expected_status_int=200)
        self.logout()

    def test_cannot_access_topic_editor_page_with_invalid_topic_id(
        self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        invalid_topic_id = 'p3MBT4ndlCTX'

        self.get_html_response(
            '%s/can_access_topic_editor/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX,
                invalid_topic_id),
                expected_status_int=404)
        self.logout()

    def test_access_topic_editor_page_without_curriculum_admin_right(
            self) -> None:
        self.login(self.NEW_USER_EMAIL)
        self.get_html_response(
            '%s/can_access_topic_editor/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.topic_id
            ), expected_status_int=401)


class SkillEditorPageAccessValidationHandlerTests(test_utils.EmailTestBase):
    """Checks the access to the skill editor page and its rendenring"""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.add_user_role(
            self.CURRICULUM_ADMIN_USERNAME, feconf.ROLE_ID_CURRICULUM_ADMIN)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Skill Description')
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_2, self.admin_id, description='Skill Description 2')

    def test_access_skill_editor_page_without_logging_in(self) -> None:
        self.get_json(
            '%s/can_access_skill_editor/%s' % (
            ACCESS_VALIDATION_HANDLER_PREFIX, self.skill_id
            ), expected_status_int=401
        )

    def test_access_skill_editor_page_with_guest_user(self) -> None:
        self.login(self.NEW_USER_EMAIL)
        self.get_json(
            '%s/can_access_skill_editor/%s' % (
            ACCESS_VALIDATION_HANDLER_PREFIX, self.skill_id
            ), expected_status_int=401
        )
        self.logout()

    def test_access_skill_editor_page_with_curriculum_admin(
            self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.get_html_response(
            '%s/can_access_skill_editor/%s' % (
            ACCESS_VALIDATION_HANDLER_PREFIX, self.skill_id
            ), expected_status_int=200
        )
        self.logout()

    def test_skill_editor_page_fails(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        skill_model = skill_models.SkillModel.get(self.skill_id)
        skill_model.delete(self.admin_id, 'Delete skill model.')
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_SKILL, None, [self.skill_id])
        self.get_json(
            '%s/can_access_skill_editor/%s' % (
            ACCESS_VALIDATION_HANDLER_PREFIX, self.skill_id
            ), expected_status_int=404
        )
        self.logout()


class CollectionEditorAccessValidationPage(test_utils.GenericTestBase):
    """Test for collection editor page access validation"""

    COLLECTION_ID: Final = '0'

    def setUp(self) -> None:
        super().setUp()
        self.collection_editor_username = 'collectionEditor'
        self.user_email = 'collectionEditor@example.com'
        self.guest_username = 'guest'
        self.guest_email = 'guest@example.com'

        self.signup(self.user_email, self.collection_editor_username)
        self.signup(self.guest_email, self.guest_username)
        self.add_user_role(
            self.collection_editor_username, feconf.ROLE_ID_COLLECTION_EDITOR)
        self.user_id = self.get_user_id_from_email(self.user_email)
        self.user = user_services.get_user_actions_info(self.user_id)
        self.save_new_valid_collection(self.COLLECTION_ID, self.user_id)

    def test_for_logged_in_user_without_rights(self) -> None:
        self.login(self.guest_email)
        self.get_html_response(
            '%s/can_access_collection_editor_page/%s' % (
            ACCESS_VALIDATION_HANDLER_PREFIX, self.COLLECTION_ID
            ), expected_status_int=401
        )
        self.logout()

    def test_for_logged_in_user_with_rights(self) -> None:
        rights_manager.publish_collection(self.user, self.COLLECTION_ID)
        self.login(self.user_email)
        self.get_html_response(
            '%s/can_access_collection_editor_page/%s' % (
            ACCESS_VALIDATION_HANDLER_PREFIX, self.COLLECTION_ID
            ), expected_status_int=200
        )
        self.logout()

    def test_validation_returns_false_if_given_collection_id_non_existent(
        self) -> None:
        self.login(self.guest_email)
        self.get_html_response(
            '%s/can_access_collection_editor_page/invalid_collectionId' % (
            ACCESS_VALIDATION_HANDLER_PREFIX,
            ), expected_status_int=404
        )
        self.logout()

    def test_should_not_access_for_logged_out_user(self) -> None:
        self.get_html_response(
            '%s/can_access_collection_editor_page/' % (
            ACCESS_VALIDATION_HANDLER_PREFIX,
            ), expected_status_int=404
        )


class ExplorationEditorPageAccessValidationHandlerTests(
    test_utils.GenericTestBase):
    """Checks the access to the exploration editor page and its rendering."""

    def setUp(self) -> None:
        super().setUp()
        self.guest_username = 'guest'
        self.guest_email = 'guest@example.com'
        self.signup(self.guest_email, self.guest_username)
        self.owner_id = self.get_user_id_from_email(self.guest_email)
        self.exp_id = 'unpub_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            self.exp_id)
        exp_services.save_new_exploration(self.owner_id, exploration)

    def test_access_exploration_editor_page_without_logging_in(self) -> None:
        self.get_html_response(
            '%s/can_access_exploration_editor_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.exp_id
            ), expected_status_int=404
        )

    def test_access_exploration_editor_page_after_logging_in(self) -> None:
        self.login(self.guest_email)
        self.get_html_response(
            '%s/can_access_exploration_editor_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.exp_id
            ), expected_status_int=200
        )
        self.logout()

    def test_get_with_disabled_exp_id_raises_error_not_logged_in(self) -> None:
        self.get_html_response(
            '%s/can_access_exploration_editor_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX,
                feconf.DISABLED_EXPLORATION_IDS[0]),
            expected_status_int=404)

    def test_get_with_disabled_exp_id_raises_err_after_logging_in(self) -> None:
        self.login(self.guest_email)
        self.get_html_response(
            '%s/can_access_exploration_editor_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX,
                feconf.DISABLED_EXPLORATION_IDS[0]),
            expected_status_int=404)
        self.logout()


class StoryEditorPageAccessValidationHandlerTests(test_utils.GenericTestBase):
    """Checks the access to the story editor page and its rendering."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.add_user_role(
            self.CURRICULUM_ADMIN_USERNAME, feconf.ROLE_ID_CURRICULUM_ADMIN)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        self.topic_id = topic_fetchers.get_new_topic_id()
        self.story_id = story_services.get_new_story_id()
        self.save_new_story(
            self.story_id, self.admin_id, self.topic_id)
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='topic-one', url_fragment='topic-one',
            description='Description', canonical_story_ids=[self.story_id],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

    def test_access_story_editor_page_without_logging_in(self) -> None:
        self.get_html_response(
            '%s/can_access_story_editor_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.story_id
            ), expected_status_int=302)

    def test_access_story_editor_page_with_curriculum_admin(
            self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.get_html_response(
            '%s/can_access_story_editor_page/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.story_id),
                expected_status_int=200)
        self.logout()


class ReviewTestsPageAccessValidationTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.topic_id = 'topic_id'
        self.story_id_1 = 'story_id_1'
        self.story_id_2 = 'story_id_2'
        self.story_id_3 = 'story_id_3'
        self.node_id = 'node_1'
        self.node_id_2 = 'node_2'
        self.exp_id = 'exp_id'
        self.story_url_fragment_1 = 'public-story-title'
        self.story_url_fragment_2 = 'private-story-title'

        self.save_new_valid_exploration(
            self.exp_id, self.owner_id)
        self.publish_exploration(self.owner_id, self.exp_id)

        self.node_1: story_domain.StoryNodeDict = {
            'id': self.node_id,
            'title': 'Title 1',
            'description': 'Description 1',
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_id_1', 'skill_id_2'],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.exp_id,
            'status': 'Draft',
            'planned_publication_date_msecs': 100.0,
            'last_modified_msecs': 100.0,
            'first_publication_date_msecs': None,
            'unpublishing_reason': None
        }

        self.save_new_skill('skill_id_1', self.admin_id, description='Skill 1')
        self.save_new_skill('skill_id_2', self.admin_id, description='Skill 2')

        self.story = story_domain.Story.create_default_story(
            self.story_id_1, 'Public Story Title', 'Description', self.topic_id,
            self.story_url_fragment_1)
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(self.node_1)
        ]
        self.story.story_contents.initial_node_id = self.node_id
        self.story.story_contents.next_node_id = self.node_id_2
        story_services.save_new_story(self.admin_id, self.story)

        self.story_2 = story_domain.Story.create_default_story(
            self.story_id_2, 'Private Story Title', 'Description',
            self.topic_id, self.story_url_fragment_2)
        story_services.save_new_story(self.admin_id, self.story_2)
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_topic(
            self.topic_id, 'user', name='Topic',
            description='A new topic',
            canonical_story_ids=[self.story_id_1, self.story_id_3],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1], next_subtopic_id=2)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id_1, self.admin_id)

        self.login(self.VIEWER_EMAIL)

    def test_any_user_can_access_review_tests_page(self) -> None:
        self.get_html_response(
            '%s/can_access_review_tests_page/staging/topic/%s'
            % (ACCESS_VALIDATION_HANDLER_PREFIX, self.story_url_fragment_1),
            expected_status_int=200)

    def test_no_user_can_access_unpublished_story_review_sessions_page(
        self
    ) -> None:
        self.get_json(
            '%s/can_access_review_tests_page/staging/topic/%s'
            % (ACCESS_VALIDATION_HANDLER_PREFIX, self.story_url_fragment_2),
            expected_status_int=404)

    def test_get_fails_when_story_doesnt_exist(self) -> None:
        self.get_json(
            '%s/can_access_review_tests_page/staging/topic/%s'
            % (ACCESS_VALIDATION_HANDLER_PREFIX, 'non-existent-story'),
            expected_status_int=404)
