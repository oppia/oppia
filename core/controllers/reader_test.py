# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for the page that allows learners to play through an exploration."""

from __future__ import annotations

import logging

from core import feconf
from core.constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import learner_progress_services
from core.domain import param_domain
from core.domain import platform_parameter_list
from core.domain import question_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import skill_services
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import taskqueue_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import translation_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List, Optional, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import stats_models
    from mypy_imports import translation_models

(
    exp_models,
    stats_models,
    translation_models
) = models.Registry.import_models([
    models.Names.EXPLORATION,
    models.Names.STATISTICS,
    models.Names.TRANSLATION
])


def _get_change_list(
    state_name: str,
    property_name: str,
    new_value: Union[bool, str]
) -> List[exp_domain.ExplorationChange]:
    """Generates a change list for a single state change."""
    return [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'state_name': state_name,
        'property_name': property_name,
        'new_value': new_value
    })]


class ReaderPermissionsTest(test_utils.GenericTestBase):
    """Test permissions for readers to view explorations."""

    EXP_ID: Final = 'eid'

    def setUp(self) -> None:
        """Before each individual test, create a dummy exploration."""
        super().setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.get_user_actions_info(self.editor_id)

        self.exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title=self.UNICODE_TEST_STRING,
            category=self.UNICODE_TEST_STRING)

    def test_unpublished_explorations_are_visible_to_their_editors(
        self
    ) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID))
        self.logout()

    def test_unpublished_explorations_are_visible_to_moderator(self) -> None:
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.login(self.MODERATOR_EMAIL)
        self.get_html_response(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID))
        self.logout()

    def test_published_explorations_are_visible_to_logged_out_users(
        self
    ) -> None:
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

        self.get_html_response(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID))

    def test_published_explorations_are_visible_to_logged_in_users(
        self
    ) -> None:
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_html_response(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID))


class FeedbackIntegrationTest(test_utils.GenericTestBase):
    """Test the handler for giving feedback."""

    def test_give_feedback_handler(self) -> None:
        """Test giving feedback handler."""
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        # Load demo exploration.
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')
        exp_models.ExplorationContextModel(
            id='0',
            story_id='story1'
        ).put()

        # Viewer opens exploration.
        self.login(self.VIEWER_EMAIL)
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        state_name_1 = exploration_dict['exploration']['init_state_name']

        # Viewer gives 1st feedback.
        self.post_json(
            '/explorehandler/give_feedback/%s' % exp_id,
            {
                'state_name': state_name_1,
                'feedback': 'This is a feedback message.',
            }
        )

        self.logout()


class ExplorationPretestsUnitTest(test_utils.GenericTestBase):
    """Test the handler for retrieving exploration pre-tests.
    """

    def setUp(self) -> None:
        """Before each individual test, initialize data."""
        super().setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, 'user', description='Description')

    def test_get_exploration_pretests(self) -> None:
        story_id = story_services.get_new_story_id()
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, 'user', name='Topic',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=0)
        self.save_new_story(story_id, 'user', topic_id)
        topic_services.add_canonical_story('user', topic_id, story_id)

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 1'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': 'node_1',
                'old_value': None,
                'new_value': 'exp_1'
            })
        ]
        story_services.update_story('user', story_id, changelist, 'Added node.')

        exp_id = '15'
        exp_id_2 = '1'
        exp_services.delete_demo('0')
        exp_services.load_demo('15')
        exp_services.delete_demo('1')
        exp_services.load_demo('1')
        old_value_list: List[str] = []
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS),
            'old_value': old_value_list,
            'new_value': [self.skill_id],
            'node_id': 'node_1'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'old_value': 'exp_1',
            'new_value': exp_id,
            'node_id': 'node_1'
        })]
        story_services.update_story(
            'user', story_id, change_list, 'Updated Node 1.')
        question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id, 'user',
            self._create_valid_question_data('ABC', content_id_generator),
            [self.skill_id],
            content_id_generator.next_content_id_index)
        question_id_2 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_2, 'user',
            self._create_valid_question_data('ABC', content_id_generator),
            [self.skill_id],
            content_id_generator.next_content_id_index)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id, self.skill_id, 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_2, self.skill_id, 0.5)
        # Call the handler.
        with self.swap(feconf, 'NUM_PRETEST_QUESTIONS', 1):
            json_response_1 = self.get_json(
                '%s/%s?story_url_fragment=title' % (
                    feconf.EXPLORATION_PRETESTS_URL_PREFIX, exp_id))
        self.assertTrue(
            json_response_1['pretest_question_dicts'][0]['id'] in
            [question_id, question_id_2])

        self.get_json(
            '%s/%s?story_url_fragment=title' % (
                feconf.EXPLORATION_PRETESTS_URL_PREFIX, exp_id_2),
            expected_status_int=400)

        self.get_json(
            '%s/%s?story_url_fragment=invalid-story' % (
                feconf.EXPLORATION_PRETESTS_URL_PREFIX, exp_id_2),
            expected_status_int=400)

    def test_cannot_perform_exploration_pretests_without_prerequisite_skill_ids(
        self
    ) -> None:
        story_id = story_services.get_new_story_id()
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, 'user', name='Topic',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=0)
        self.save_new_story(story_id, 'user', topic_id)
        topic_services.add_canonical_story('user', topic_id, story_id)

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 1'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': 'node_1',
                'old_value': None,
                'new_value': 'exp_1'
            })
        ]
        story_services.update_story('user', story_id, changelist, 'Added node.')

        exp_id = '15'
        exp_services.delete_demo('0')
        exp_services.load_demo('15')
        old_value_list: List[str] = []
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS),
            'old_value': old_value_list,
            'new_value': [self.skill_id],
            'node_id': 'node_1'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'old_value': 'exp_1',
            'new_value': exp_id,
            'node_id': 'node_1'
        })]
        story_services.update_story(
            'user', story_id, change_list, 'Updated Node 1.')
        question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id, 'user',
            self._create_valid_question_data('ABC', content_id_generator),
            [self.skill_id],
            content_id_generator.next_content_id_index
        )
        question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_2, 'user',
            self._create_valid_question_data('ABC', content_id_generator),
            [self.skill_id],
            content_id_generator.next_content_id_index
        )
        question_services.create_new_question_skill_link(
            self.editor_id, question_id, self.skill_id, 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_2, self.skill_id, 0.5)
        # Call the handler.
        with self.swap(feconf, 'NUM_PRETEST_QUESTIONS', 1):
            with self.swap_to_always_return(
                story_domain.Story,
                'get_prerequisite_skill_ids_for_exp_id',
                None
            ):
                json_response = self.get_json(
                    '%s/%s?story_url_fragment=title' % (
                        feconf.EXPLORATION_PRETESTS_URL_PREFIX, exp_id),
                    expected_status_int=500
                )
        self.assertEqual(
            json_response['error'],
            'No prerequisite skill_ids found for the exploration '
            'with exploration_id: 15'
        )


class QuestionsUnitTest(test_utils.GenericTestBase):
    """Test the handler for fetching questions."""

    USER_EMAIL: Final = 'user@example.com'
    USER_USERNAME: Final = 'user'

    def setUp(self) -> None:
        """Before each individual test, initialize data."""
        super().setUp()
        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(self.skill_id, 'user', description='Description')

        self.question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.question_id, 'user',
            self._create_valid_question_data('ABC', content_id_generator),
            [self.skill_id],
            content_id_generator.next_content_id_index)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, self.skill_id, 0.5)
        content_id_generator = translation_domain.ContentIdGenerator()
        self.question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            self.question_id_2, 'user',
            self._create_valid_question_data('ABC', content_id_generator),
            [self.skill_id],
            content_id_generator.next_content_id_index)
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id_2, self.skill_id, 0.5)

    def test_questions_are_returned_successfully(self) -> None:
        # Call the handler.
        url = '%s?question_count=%s&skill_ids=%s&fetch_by_difficulty=%s' % (
            feconf.QUESTIONS_URL_PREFIX, '1', self.skill_id, 'false')
        json_response_1 = self.get_json(url)
        self.assertEqual(len(json_response_1['question_dicts']), 1)

    def test_question_count_more_than_available_returns_all_questions(
        self
    ) -> None:
        # Call the handler.
        url = '%s?question_count=%s&skill_ids=%s&fetch_by_difficulty=%s' % (
            feconf.QUESTIONS_URL_PREFIX, '5', self.skill_id, 'true')
        json_response = self.get_json(url)
        self.assertEqual(len(json_response['question_dicts']), 2)

    def test_multiple_skill_id_returns_questions(self) -> None:
        skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id_2, 'user', description='Description')

        question_id_3 = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id_3, 'user',
            self._create_valid_question_data('ABC', content_id_generator),
            [self.skill_id],
            content_id_generator.next_content_id_index)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_3, skill_id_2, 0.5)
        url = '%s?question_count=%s&skill_ids=%s,%s&fetch_by_difficulty=%s' % (
            feconf.QUESTIONS_URL_PREFIX, '3', self.skill_id, skill_id_2, 'true')
        json_response = self.get_json(url)
        self.assertEqual(len(json_response['question_dicts']), 3)
        question_ids = [data['id'] for data in json_response['question_dicts']]
        self.assertItemsEqual(
            [self.question_id, self.question_id_2, question_id_3], question_ids)

    def test_filter_multiple_skill_id_return_questions(self) -> None:
        self.login(self.USER_EMAIL)
        skill_ids_for_url = ''

        # Create multiple skills, questions and skill links.
        for _ in range(feconf.MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME):
            skill_id = skill_services.get_new_skill_id()
            skill_ids_for_url = skill_ids_for_url + skill_id + ','
            self.save_new_skill(skill_id, 'user', description='Description')
            question_id = question_services.get_new_question_id()
            content_id_generator = translation_domain.ContentIdGenerator()
            self.save_new_question(
                question_id, 'user',
                self._create_valid_question_data('ABC', content_id_generator),
                [skill_id],
                content_id_generator.next_content_id_index)
            question_services.create_new_question_skill_link(
                self.editor_id, question_id, skill_id, 0.5)

        # Create additional skills with user skill mastery > 0.0,
        # so that these are filtered out correctly.
        for _ in range(5):
            skill_id = skill_services.get_new_skill_id()
            skill_ids_for_url = skill_ids_for_url + skill_id + ','
            self.save_new_skill(skill_id, 'user', description='Description')
            skill_services.create_user_skill_mastery(
                self.user_id, skill_id, 0.5)

        # Removing the last comma of the string.
        skill_ids_for_url = skill_ids_for_url[:-1]

        url = '%s?question_count=%s&skill_ids=%s&fetch_by_difficulty=%s' % (
            feconf.QUESTIONS_URL_PREFIX,
            feconf.MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME,
            skill_ids_for_url,
            'true'
        )
        json_response = self.get_json(url)
        self.assertEqual(
            len(json_response['question_dicts']),
            feconf.QUESTION_BATCH_SIZE)

    def test_invalid_skill_id_returns_no_questions(self) -> None:
        # Call the handler.
        url = '%s?question_count=%s&skill_ids=%s&fetch_by_difficulty=%s' % (
            feconf.QUESTIONS_URL_PREFIX, '1', 'invalid_skill_id', 'true')
        json_response = self.get_json(url, expected_status_int=400)
        self.assertEqual(
            json_response['error'],
            'At \'http://localhost/question_player_handler?question_count=1'
            '&skill_ids=invalid_skill_id&fetch_by_difficulty=true\' '
            'these errors are happening:\n'
            'Schema validation for \'skill_ids\' failed: Invalid skill id'
        )

    def test_question_count_zero_raises_invalid_input_exception(self) -> None:
        # Call the handler.
        url = '%s?question_count=%s&skill_ids=%s&fetch_by_difficulty=%s' % (
            feconf.QUESTIONS_URL_PREFIX, '0', self.skill_id, 'true')
        self.get_json(url, expected_status_int=400)

    def test_invalid_fetch_by_difficulty_raises_invalid_input_exception(
        self
    ) -> None:
        # Call the handler.
        url = '%s?question_count=%s&skill_ids=%s&fetch_by_difficulty=%s' % (
            feconf.QUESTIONS_URL_PREFIX, '1', self.skill_id, [])
        self.get_json(url, expected_status_int=400)


class ExplorationParametersUnitTests(test_utils.GenericTestBase):
    """Test methods relating to exploration parameters."""

    def test_get_init_params(self) -> None:
        """Test the get_init_params() method."""
        independent_pc = param_domain.ParamChange(
            'a', 'Copier', {'value': 'firstValue', 'parse_with_jinja': False})
        exp_param_specs = {
            'a': param_domain.ParamSpec('UnicodeString'),
        }
        new_params = self.get_updated_param_dict(
            {}, [independent_pc], exp_param_specs)
        self.assertEqual(new_params, {'a': 'firstValue'})


class RatingsIntegrationTests(test_utils.GenericTestBase):
    """Integration tests of ratings recording and display."""

    EXP_ID: Final = '0'

    def setUp(self) -> None:
        super().setUp()
        exp_services.load_demo(self.EXP_ID)

    def test_assign_and_read_ratings(self) -> None:
        """Test the PUT and GET methods for ratings."""

        self.signup('user@example.com', 'user')
        self.login('user@example.com')
        csrf_token = self.get_new_csrf_token()

        # User checks rating.
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], None)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0})

        # User rates and checks rating.
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 2
            }, csrf_token=csrf_token
        )
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], 2)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 1, '3': 0, '4': 0, '5': 0})

        # User re-rates and checks rating.
        self.login('user@example.com')
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 5
            }, csrf_token=csrf_token
        )
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], 5)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 1})

        self.logout()

    def test_non_logged_in_users_cannot_rate(self) -> None:
        """Check non logged-in users can view but not submit ratings."""

        self.signup('user@example.com', 'user')
        self.login('user@example.com')
        csrf_token = self.get_new_csrf_token()
        self.logout()

        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], None)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0})
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 1
            }, csrf_token=csrf_token,
            expected_status_int=401
        )

    def test_ratings_by_different_users(self) -> None:
        """Check that ratings by different users do not interfere."""

        self.signup('a@example.com', 'a')
        self.signup('b@example.com', 'b')

        self.login('a@example.com')
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 4
            }, csrf_token=csrf_token
        )
        self.logout()

        self.login('b@example.com')
        csrf_token = self.get_new_csrf_token()
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], None)
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 4
            }, csrf_token=csrf_token
        )
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], 4)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 2, '5': 0})
        self.logout()


class RecommendationsHandlerTests(test_utils.EmailTestBase):
    """Backend integration tests for recommended explorations for after an
    exploration is completed.
    """

    # Demo explorations.
    EXP_ID_0: Final = '0'
    EXP_ID_1: Final = '1'
    EXP_ID_7: Final = '7'
    EXP_ID_9: Final = '9'

    # Explorations contained within the demo collection.
    EXP_ID_19: Final = '19'
    EXP_ID_20: Final = '20'
    EXP_ID_21: Final = '21'

    # Demo collection.
    COL_ID: Final = '0'

    def setUp(self) -> None:
        super().setUp()

        # Register users.
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        # Login and create activities.
        self.login(self.EDITOR_EMAIL)
        exp_services.load_demo(self.EXP_ID_0)
        exp_services.load_demo(self.EXP_ID_1)
        exp_services.load_demo(self.EXP_ID_7)
        exp_services.load_demo(self.EXP_ID_9)
        collection_services.load_demo(self.COL_ID)
        self.logout()

    def _get_exploration_ids_from_summaries(
        self, summaries: List[Dict[str, str]]
    ) -> List[str]:
        """Returns the sorted list of all the exploration ids from summaries."""
        return sorted([summary['id'] for summary in summaries])

    def _get_recommendation_ids(
        self,
        exploration_id: str,
        collection_id: Optional[str] = None,
        include_system_recommendations: Optional[bool] = None,
        author_recommended_ids_str: str = '[]'
    ) -> List[str]:
        """Gets the recommended exploration ids from the summaries."""
        collection_id_param = (
            '&collection_id=%s' % collection_id
            if collection_id is not None else '')
        include_recommendations_param = (
            '&include_system_recommendations=%s' % (
                include_system_recommendations)
            if include_system_recommendations is not None else '')
        recommendations_url = (
            '/explorehandler/recommendations/%s?'
            'author_recommended_ids=%s%s%s' % (
                exploration_id, author_recommended_ids_str, collection_id_param,
                include_recommendations_param))

        summaries = self.get_json(recommendations_url)['summaries']
        return self._get_exploration_ids_from_summaries(summaries)

    # TODO(bhenning): Add tests for ensuring system explorations are properly
    # sampled when there are many matched for a given exploration ID.

    def _set_recommendations(
        self, exp_id: str, recommended_ids: List[str]
    ) -> None:
        """Sets the recommendations in the exploration corresponding to the
        given exploration id.
        """
        recommendations_services.set_exploration_recommendations(
            exp_id, recommended_ids)

    def _complete_exploration_in_collection(self, exp_id: str) -> None:
        """Completes the exploration within the collection. Records that the
        exploration has been played by the user in the context of the
        collection.
        """
        collection_services.record_played_exploration_in_collection_context(
            self.new_user_id, self.COL_ID, exp_id)

    def _complete_entire_collection_in_order(self) -> None:
        """Completes the entire collection in order."""
        self._complete_exploration_in_collection(self.EXP_ID_19)
        self._complete_exploration_in_collection(self.EXP_ID_20)
        self._complete_exploration_in_collection(self.EXP_ID_21)
        self._complete_exploration_in_collection(self.EXP_ID_0)

    # Logged in standard viewer tests.
    def test_logged_in_with_no_sysexps_no_authexps_no_col_has_no_exps(
        self
    ) -> None:
        """Check there are no recommended explorations when a user is logged in,
        finishes an exploration in-viewer, but there are no recommended
        explorations and no author exploration IDs.
        """
        self.login(self.NEW_USER_EMAIL)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True)
        self.assertEqual(recommendation_ids, [])

    def test_logged_in_with_some_sysexps_no_authexps_no_col_has_some_exps(
        self
    ) -> None:
        """Check there are recommended explorations when a user is logged in,
        finishes an exploration in-viewer, and there are system recommendations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._set_recommendations(self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_9])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True)
        self.assertEqual(recommendation_ids, [self.EXP_ID_1, self.EXP_ID_9])

    def test_logged_in_with_no_sysexps_some_authexps_no_col_has_some_exps(
        self
    ) -> None:
        """Check there are some recommended explorations when a user is logged
        in, finishes an exploration in-viewer, and there are author-specified
        exploration IDs.
        """
        self.login(self.NEW_USER_EMAIL)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True,
            author_recommended_ids_str='["7","9"]')
        self.assertEqual(recommendation_ids, [self.EXP_ID_7, self.EXP_ID_9])

    def test_logged_in_with_sysexps_and_authexps_no_col_has_some_exps(
        self
    ) -> None:
        """Check there are recommended explorations when a user is logged in,
        finishes an exploration in-viewer, and there are both author-specified
        exploration IDs and recommendations from the system.
        """
        self.login(self.NEW_USER_EMAIL)
        self._set_recommendations(self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_9])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True,
            author_recommended_ids_str='["7","9"]')
        self.assertEqual(
            recommendation_ids, [self.EXP_ID_1, self.EXP_ID_7, self.EXP_ID_9])

    # Logged in in-editor tests.
    def test_logged_in_preview_no_authexps_no_col_has_no_exps(self) -> None:
        """Check there are no recommended explorations when a user is logged in,
        finishes an exploration in-editor (no system recommendations since it's
        a preview of the exploration), and there are no author exploration IDs.
        """
        self.login(self.NEW_USER_EMAIL)
        recommendation_ids = self._get_recommendation_ids(self.EXP_ID_0)
        self.assertEqual(recommendation_ids, [])

    def test_logged_in_preview_with_authexps_no_col_has_some_exps(self) -> None:
        """Check there are some recommended explorations when a user is logged
        in, finishes an exploration in-editor (no system recommendations), and
        there are some author exploration IDs.
        """
        self.login(self.NEW_USER_EMAIL)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, author_recommended_ids_str='["7","9"]')
        self.assertEqual(recommendation_ids, [self.EXP_ID_7, self.EXP_ID_9])

    # Logged in collection tests.
    def test_logged_in_no_sysexps_no_authexps_first_exp_in_col_has_exp(
        self
    ) -> None:
        """Check there is a recommended exploration when a user is logged in
        and completes the first exploration of a collection.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_exploration_in_collection(self.EXP_ID_19)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID)
        # The next exploration in the collection should be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_20])

    def test_logged_in_no_sysexps_no_authexps_mid_exp_in_col_has_exps(
        self
    ) -> None:
        """Check there are recommended explorations when a user is logged in
        and completes a middle exploration of the collection (since more
        explorations are needed to complete the collection).
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_exploration_in_collection(self.EXP_ID_20)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID)
        # The first exploration that the user has not yet visited is
        # recommended. Since, the collection is linear, in this method, finally,
        # the user would visit every node in the collection.
        self.assertEqual(recommendation_ids, [self.EXP_ID_19])

    def test_logged_in_no_sysexps_no_authexps_all_exps_in_col_has_no_exps(
        self
    ) -> None:
        """Check there are not recommended explorations when a user is logged in
        and completes all explorations of the collection.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_entire_collection_in_order()
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID)
        # No explorations are recommended since the collection was completed.
        self.assertEqual(recommendation_ids, [])

    def test_logged_in_with_sysexps_no_authexps_first_exp_in_col_has_exp(
        self
    ) -> None:
        """Check there is a recommended exploration when a user is logged in
        and completes the first exploration of a collection. Note that even
        though the completed exploration has system recommendations, they are
        ignored in favor of the collection's own recommendations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._set_recommendations(
            self.EXP_ID_19, [self.EXP_ID_1, self.EXP_ID_9])
        self._complete_exploration_in_collection(self.EXP_ID_19)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # The next exploration in the collection should be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_20])

    def test_logged_in_with_sysexps_no_authexps_mid_exp_in_col_has_exps(
        self
    ) -> None:
        """Check there are recommended explorations when a user is logged in
        and completes a middle exploration of the collection (since more
        explorations are needed to complete the collection). Note that even
        though the completed exploration has system recommendations, they are
        ignored in favor of the collection's own recommendations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._set_recommendations(
            self.EXP_ID_20, [self.EXP_ID_1, self.EXP_ID_9])
        self._complete_exploration_in_collection(self.EXP_ID_20)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # The first exploration that the user has not yet visited is
        # recommended. Since, the collection is linear, in this method, finally,
        # the user would visit every node in the collection.
        self.assertEqual(recommendation_ids, [self.EXP_ID_19])

    def test_logged_in_sysexps_no_authexps_all_exps_in_col_has_no_exps(
        self
    ) -> None:
        """Check there are not recommended explorations when a user is logged in
        and completes all explorations of the collection. This is true even if
        there are system recommendations for the last exploration.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_entire_collection_in_order()
        self._set_recommendations(
            self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_9])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # No explorations are recommended since the collection was completed.
        self.assertEqual(recommendation_ids, [])

    def test_logged_in_no_sysexps_with_authexps_first_exp_in_col_has_exps(
        self
    ) -> None:
        """Check there is are recommended explorations when a user is logged in
        and completes the first exploration of a collection where that
        exploration also has author-specified explorations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_exploration_in_collection(self.EXP_ID_19)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID,
            author_recommended_ids_str='["7","9"]')
        # The next exploration in the collection should be recommended along
        # with author specified explorations.
        self.assertEqual(
            recommendation_ids, [self.EXP_ID_20, self.EXP_ID_7, self.EXP_ID_9])

    def test_logged_in_no_sysexps_with_authexps_mid_exp_in_col_has_exps(
        self
    ) -> None:
        """Check there are recommended explorations when a user is logged in
        and completes a middle exploration of the collection, and that these
        recommendations include author-specified explorations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_exploration_in_collection(self.EXP_ID_20)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID,
            author_recommended_ids_str='["7","21"]')
        # The first & next explorations should be recommended, along with author
        # specified explorations.
        self.assertEqual(
            recommendation_ids, [self.EXP_ID_19, self.EXP_ID_21, self.EXP_ID_7])

    def test_logged_in_no_sysexps_authexps_all_exps_in_col_has_exps(
        self
    ) -> None:
        """Check there are still recommended explorations when a user is logged
        in and completes all explorations of the collection if the last
        exploration has author-specified explorations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_entire_collection_in_order()
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID,
            author_recommended_ids_str='["7","9"]')
        # Only author specified explorations should be recommended since all
        # others in the collection have been completed.
        self.assertEqual(recommendation_ids, [self.EXP_ID_7, self.EXP_ID_9])

    # Logged out standard viewer tests.
    def test_logged_out_with_no_sysexps_no_authexps_no_col_has_no_exps(
        self
    ) -> None:
        """Check there are no recommended explorations when a user is logged
        out, finishes an exploration in-viewer, but there are no recommended
        explorations and no author exploration IDs.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True)
        self.assertEqual(recommendation_ids, [])

    def test_logged_out_with_sysexps_no_authexps_no_col_has_some_exps(
        self
    ) -> None:
        """Check there are recommended explorations when a user is logged out,
        finishes an exploration in-viewer, and there are system recommendations.
        """
        self._set_recommendations(self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_9])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True)
        self.assertEqual(recommendation_ids, [self.EXP_ID_1, self.EXP_ID_9])

    def test_logged_out_no_sysexps_some_authexps_no_col_has_some_exps(
        self
    ) -> None:
        """Check there are some recommended explorations when a user is logged
        out, finishes an exploration in-viewer, and there are author-specified
        exploration IDs.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True,
            author_recommended_ids_str='["7","9"]')
        self.assertEqual(recommendation_ids, [self.EXP_ID_7, self.EXP_ID_9])

    def test_logged_out_with_sysexps_and_authexps_no_col_has_some_exps(
        self
    ) -> None:
        """Check there are recommended explorations when a user is logged in,
        finishes an exploration in-viewer, and there are both author-specified
        exploration IDs and recommendations from the system.
        """
        self._set_recommendations(self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_9])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True,
            author_recommended_ids_str='["7","9"]')
        self.assertEqual(
            recommendation_ids, [self.EXP_ID_1, self.EXP_ID_7, self.EXP_ID_9])

    # Logged out collection tests.
    def test_logged_out_no_sysexps_no_authexps_first_exp_in_col_has_exp(
        self
    ) -> None:
        """Check there is a recommended exploration when a user is logged out
        and completes the first exploration of a collection.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID)
        # The next exploration in the collection should be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_20])

    def test_logged_out_no_sysexps_no_authexps_mid_exp_in_col_has_exp(
        self
    ) -> None:
        """Check there is a recommended exploration when a user is logged out
        and completes a middle exploration of the collection.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID)
        # Only the last exploration should be recommended since logged out users
        # follow a linear path through the collection.
        self.assertEqual(recommendation_ids, [self.EXP_ID_21])

    def test_logged_out_no_sysexps_no_authexps_last_exp_col_has_no_exps(
        self
    ) -> None:
        """Check there are not recommended explorations when a user is logged
        out and completes the last exploration in the collection.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID)
        self.assertEqual(recommendation_ids, [])

    def test_logged_out_with_sysexps_no_authexps_first_exp_in_col_has_exp(
        self
    ) -> None:
        """Check there is a recommended exploration when a user is logged out
        and completes the first exploration of a collection. Note that even
        though the completed exploration has system recommendations, they are
        ignored in favor of the collection's own recommendations.
        """
        self._set_recommendations(
            self.EXP_ID_19, [self.EXP_ID_1, self.EXP_ID_9])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # The next exploration in the collection should be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_20])

    def test_logged_out_with_sysexps_no_authexps_mid_exp_in_col_has_exp(
        self
    ) -> None:
        """Check there is a recommended explorations when a user is logged out
        and completes a middle exploration of the collection. Note that even
        though the completed exploration has system recommendations, they are
        ignored in favor of the collection's own recommendations.
        """
        self._set_recommendations(
            self.EXP_ID_20, [self.EXP_ID_1, self.EXP_ID_9])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # Only the last exploration should be recommended since logged out users
        # follow a linear path through the collection.
        self.assertEqual(recommendation_ids, [self.EXP_ID_21])

    def test_logged_out_sysexps_no_authexps_last_exp_in_col_has_no_exps(
        self
    ) -> None:
        """Check there are not recommended explorations when a user is logged
        out and completes the last exploration of the collection. This is true
        even if there are system recommendations for the last exploration.
        """
        self._set_recommendations(
            self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_9])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # The collection is completed, so no other explorations should be
        # recommended.
        self.assertEqual(recommendation_ids, [])

    def test_logged_out_no_sysexps_but_authexps_first_exp_in_col_has_exps(
        self
    ) -> None:
        """Check there is are recommended explorations when a user is logged out
        and completes the first exploration of a collection where that
        exploration also has author-specified explorations.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID,
            author_recommended_ids_str='["7","9"]')
        # The next exploration in the collection should be recommended along
        # with author specified explorations.
        self.assertEqual(
            recommendation_ids, [self.EXP_ID_20, self.EXP_ID_7, self.EXP_ID_9])

    def test_logged_out_no_sysexps_with_authexps_mid_exp_in_col_has_exps(
        self
    ) -> None:
        """Check there are recommended explorations when a user is logged out
        and completes a middle exploration of the collection where that
        exploration also has author-specified explorations.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID,
            author_recommended_ids_str='["7"]')
        # Both the next exploration & the author-specified explorations should
        # be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_21, self.EXP_ID_7])

    def test_logged_out_no_sysexps_with_dup_authexps_mid_col_exp_has_exps(
        self
    ) -> None:
        """test_logged_out_no_sysexps_with_authexps_mid_exp_in_col_has_exps but
        also checks that exploration IDs are de-duped if the next exploration
        overlaps with the author-specified explorations.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID,
            author_recommended_ids_str='["7", "21"]')
        # Both the next exploration & the author-specified explorations should
        # be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_21, self.EXP_ID_7])

    def test_logged_out_no_sysexps_authexps_last_exp_in_col_has_exps(
        self
    ) -> None:
        """Check there are still recommended explorations when a user is logged
        out and completes all explorations of the collection if the last
        exploration has author-specified explorations.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID,
            author_recommended_ids_str='["7","9"]')
        # Only author specified explorations should be recommended since all
        # others in the collection have been completed.
        self.assertEqual(recommendation_ids, [self.EXP_ID_7, self.EXP_ID_9])

    def test_get_recommendation_ids_with_invalid_author_recommended_ids(
        self
    ) -> None:
        self.get_json(
            '/explorehandler/recommendations/%s' % self.EXP_ID_1, params={
                'collection_id': self.COL_ID,
                'include_system_recommendations': True,
                'author_recommended_ids': 'invalid_type'
            }, expected_status_int=400
        )


class FlagExplorationHandlerTests(test_utils.EmailTestBase):
    """Backend integration tests for flagging an exploration."""

    EXP_ID: Final = '0'
    REPORT_TEXT: Final = 'AD'
    EMAIL_FOOTER = (
        'You can change your email preferences via the '
        '<a href="http://localhost:8181/preferences">Preferences</a> page.'
    )

    def setUp(self) -> None:
        super().setUp()

        # Register users.
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)

        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.editor = user_services.get_user_actions_info(self.editor_id)

        # Login and create exploration.
        self.login(self.EDITOR_EMAIL)

        # Create exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id,
            title='Welcome to Oppia!',
            category='This is just a spam category',
            objective='Test a spam exploration.')
        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        self.logout()

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.EMAIL_FOOTER, EMAIL_FOOTER),
            (platform_parameter_list.ParamName.EMAIL_SENDER_NAME, 'admin')
        ]
    )
    def test_that_emails_are_sent(self) -> None:
        """Check that emails are sent to moderaters when a logged-in
        user reports.
        """

        # Login and flag exploration.
        self.login(self.NEW_USER_EMAIL)

        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/%s' % (feconf.FLAG_EXPLORATION_URL_PREFIX, self.EXP_ID), {
                'report_text': self.REPORT_TEXT,
            }, csrf_token=csrf_token)

        self.logout()

        expected_email_html_body = (
            'Hello Moderator,<br>'
            'newuser has flagged exploration '
            '"Welcome to Oppia!"'
            ' on the following grounds: <br>'
            'AD .<br>'
            'You can modify the exploration by clicking '
            '<a href="https://www.oppia.org/create/0">'
            'here</a>.<br>'
            '<br>'
            'Thanks!<br>'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

        expected_email_text_body = (
            'Hello Moderator,\n'
            'newuser has flagged exploration '
            '"Welcome to Oppia!"'
            ' on the following grounds: \n'
            'AD .\n'
            'You can modify the exploration by clicking here.\n'
            '\n'
            'Thanks!\n'
            '- The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        self.process_and_flush_pending_tasks()

        messages = self._get_sent_email_messages(
            self.MODERATOR_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)
        self.assertEqual(messages[0].body, expected_email_text_body)

    def test_non_logged_in_users_cannot_report(self) -> None:
        """Check that non-logged in users cannot report."""

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.logout()

        # Create report for exploration.
        self.post_json(
            '%s/%s' % (feconf.FLAG_EXPLORATION_URL_PREFIX, self.EXP_ID), {
                'report_text': self.REPORT_TEXT,
            }, csrf_token=csrf_token,
            expected_status_int=401)


class LearnerProgressTest(test_utils.GenericTestBase):
    """Tests for tracking learner progress."""

    EXP_ID_0: Final = 'exp_0'
    EXP_ID_1: Final = 'exp_1'
    # The first number corresponds to the collection to which the exploration
    # belongs. The second number corresponds to the exploration id.
    EXP_ID_1_0: Final = 'exp_2'
    EXP_ID_1_1: Final = 'exp_3'
    EXP_ID_2_0: Final = 'exp_4'
    COL_ID_0: Final = 'col_0'
    COL_ID_1: Final = 'col_1'
    USER_EMAIL: Final = 'user@example.com'
    USER_USERNAME: Final = 'user'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.STORY_ID = story_services.get_new_story_id()
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()

        # Save and publish explorations.
        self.save_new_valid_exploration(
            self.EXP_ID_0, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Welcome',
            category='Architecture', language_code='fi')

        self.save_new_valid_exploration(
            self.EXP_ID_1_0, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')

        self.save_new_valid_exploration(
            self.EXP_ID_1_1, self.owner_id,
            title='Introduce Interactions in Oppia',
            category='Welcome', language_code='en')

        self.save_new_valid_exploration(
            self.EXP_ID_2_0, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='en')

        rights_manager.publish_exploration(self.owner, self.EXP_ID_0)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_1)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_1_0)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_1_1)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_2_0)

        # Save a new collection.
        self.save_new_default_collection(
            self.COL_ID_0, self.owner_id, title='Welcome',
            category='Architecture')

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title='Bridges in England',
            category='Architecture')

        # Save a new topic and story.
        self.subtopic = topic_domain.Subtopic(
            0, 'Title', ['skill_id_1'], 'image.svg',
            constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
            'dummy-subtopic-one')
        self.save_new_topic(
            self.TOPIC_ID, self.owner_id, name='Topic',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic], next_subtopic_id=1)
        self.save_new_story(self.STORY_ID, self.owner_id, self.TOPIC_ID)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID)

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 1'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'old_value': None,
                'new_value': self.EXP_ID_2_0,
                'node_id': 'node_1'
            })
        ]
        story_services.update_story(
            self.owner_id, self.STORY_ID, changelist, 'Added node.')

        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID, self.admin_id)

        # Add two explorations to the previously saved collection and publish
        # it.
        for exp_id in [self.EXP_ID_1_0, self.EXP_ID_1_1]:
            collection_services.update_collection(
                self.owner_id, self.COL_ID_1, [{
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': exp_id
                }], 'Added new exploration')

        # Publish the collections.
        rights_manager.publish_collection(self.owner, self.COL_ID_0)
        rights_manager.publish_collection(self.owner, self.COL_ID_1)

    def test_independent_exp_complete_event_handler(self) -> None:
        """Test handler for completion of explorations not in the context of
        collections.
        """

        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'client_time_spent_in_secs': 0,
            'params': {},
            'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
            'state_name': 'final',
            'version': 1
        }

        # When an exploration is completed but is not in the context of a
        # collection, it is just added to the completed explorations list.
        self.post_json(
            '/explorehandler/exploration_complete_event/%s' % self.EXP_ID_0,
            payload, csrf_token=csrf_token)
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0])
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])

        # Test another exploration.
        self.post_json(
            '/explorehandler/exploration_complete_event/%s' % self.EXP_ID_1_0,
            payload, csrf_token=csrf_token)
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1_0])
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])

    def test_exp_complete_event_in_collection(self) -> None:
        """Test handler for completion of explorations in the context of
        collections.
        """

        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'client_time_spent_in_secs': 0,
            'collection_id': self.COL_ID_1,
            'params': {},
            'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
            'state_name': 'final',
            'version': 1
        }

        # If the exploration is completed in the context of a collection,
        # then in addition to the exploration being added to the completed
        # list, the collection is also added to the incomplete/complete list
        # dependent on whether there are more explorations left to complete.

        # Here we test the case when the collection is partially completed.
        self.post_json(
            '/explorehandler/exploration_complete_event/%s' % self.EXP_ID_1_0,
            payload, csrf_token=csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_1])
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_1_0])

        # Now we test the case when the collection is completed.
        self.post_json(
            '/explorehandler/exploration_complete_event/%s' % self.EXP_ID_1_1,
            payload, csrf_token=csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])
        self.assertEqual(
            learner_progress_services.get_all_completed_collection_ids(
                self.user_id), [self.COL_ID_1])
        self.assertEqual(
            learner_progress_services.get_all_completed_exp_ids(
                self.user_id), [self.EXP_ID_1_0, self.EXP_ID_1_1])

    def test_cannot_complete_exploration_with_no_version(self) -> None:
        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'client_time_spent_in_secs': 0,
            'collection_id': self.COL_ID_1,
            'params': {},
            'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
            'state_name': 'final',
            'version': None
        }

        response = self.post_json(
            '/explorehandler/exploration_complete_event/%s' % self.EXP_ID_1_0,
            payload, csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(
            response['error'],
            'At \'http://localhost/explorehandler/exploration_complete_event/'
            'exp_2\' these errors are happening:\n'
            'Missing key in handler args: version.'
        )

    def test_exp_incomplete_event_handler(self) -> None:
        """Test handler for leaving an exploration incomplete."""

        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'client_time_spent_in_secs': 0,
            'params': {},
            'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
            'state_name': 'middle',
            'version': 1
        }

        # Add the incomplete exploration id to the incomplete list.
        self.post_json(
            '/explorehandler/exploration_maybe_leave_event/%s' % self.EXP_ID_0,
            payload, csrf_token=csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0])

        # Adding the exploration again has no effect.
        self.post_json(
            '/explorehandler/exploration_maybe_leave_event/%s' % self.EXP_ID_0,
            payload, csrf_token=csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0])

        payload = {
            'client_time_spent_in_secs': 0,
            'collection_id': self.COL_ID_1,
            'params': {},
            'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
            'state_name': 'middle',
            'version': 1
        }

        # If the exploration is played in the context of a collection, the
        # collection is also added to the incomplete list.
        self.post_json(
            '/explorehandler/exploration_maybe_leave_event/%s' % self.EXP_ID_1_0, # pylint: disable=line-too-long
            payload, csrf_token=csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1_0])
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_1])

        # If the exploration is played in the context of a story, the
        # story is also added to the incomplete list.
        self.post_json(
            '/explorehandler/exploration_maybe_leave_event/%s' % self.EXP_ID_2_0, # pylint: disable=line-too-long
            payload, csrf_token=csrf_token)
        self.assertEqual(learner_progress_services.get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1_0, self.EXP_ID_2_0])
        self.assertEqual(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id), [self.STORY_ID])
        self.assertEqual(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id), [self.TOPIC_ID])

        # If the exploration is played in context of an invalid story, raise
        # an error.
        def _mock_none_function(_: str) -> None:
            """Mocks None."""
            return None

        story_fetchers_swap = self.swap(
            story_fetchers, 'get_story_by_id', _mock_none_function)

        with story_fetchers_swap:
            with self.capture_logging(min_level=logging.ERROR) as captured_logs:
                self.post_json(
                    '/explorehandler/exploration_maybe_leave_event'
                    '/%s' % self.EXP_ID_2_0,
                    payload, csrf_token=csrf_token)
                self.assertEqual(
                    captured_logs,
                    ['Could not find a story corresponding to '
                     '%s id.' % self.STORY_ID])

    def test_exp_incomplete_event_handler_with_no_version_raises_error(
        self
    ) -> None:
        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'client_time_spent_in_secs': 0,
            'params': {},
            'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
            'state_name': 'middle',
        }

        response = self.post_json(
            '/explorehandler/exploration_maybe_leave_event/%s' % self.EXP_ID_0,
            payload, csrf_token=csrf_token, expected_status_int=400)
        error_msg = (
            'At \'http://localhost/explorehandler/'
            'exploration_maybe_leave_event/exp_0\' '
            'these errors are happening:\n'
            'Missing key in handler args: version.'
        )
        self.assertEqual(response['error'], error_msg)

    def test_remove_exp_from_incomplete_list_handler(self) -> None:
        """Test handler for removing explorations from the partially completed
        list.
        """
        self.login(self.USER_EMAIL)

        state_name = 'state_name'
        version = 1

        # Add two explorations to the partially completed list.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

        # Remove one exploration.
        self.delete_json(
            '%s/%s/%s' %
            (
                feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_0))
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_1])

        # Remove another exploration.
        self.delete_json(
            '%s/%s/%s' %
            (
                feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_1))
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [])

    def test_remove_collection_from_incomplete_list_handler(self) -> None:
        """Test handler for removing collections from incomplete list."""

        self.login(self.USER_EMAIL)

        # Add two collections to incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

        # Remove one collection.
        self.delete_json(
            '%s/%s/%s' %
            (
                feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
                constants.ACTIVITY_TYPE_COLLECTION,
                self.COL_ID_0))
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_1])

        # Remove another collection.
        self.delete_json(
            '%s/%s/%s' %
            (
                feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
                constants.ACTIVITY_TYPE_COLLECTION,
                self.COL_ID_1))
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])

        # Remove one story.
        self.delete_json(
            '%s/%s/%s' %
            (
                feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
                constants.ACTIVITY_TYPE_STORY,
                self.STORY_ID))
        self.assertEqual(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id), [])

        # Remove one topic.
        self.delete_json(
            '%s/%s/%s' %
            (
                feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
                constants.ACTIVITY_TYPE_LEARN_TOPIC,
                self.TOPIC_ID))
        self.assertEqual(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id), [])


class StorePlaythroughHandlerTest(test_utils.GenericTestBase):
    """Tests for the handler that records playthroughs."""

    def setUp(self) -> None:
        super().setUp()
        self.exp_id = '15'

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)

        exp_services.load_demo(self.exp_id)
        self.exploration = exp_fetchers.get_exploration_by_id(self.exp_id)
        playthrough_id = stats_models.PlaythroughModel.create(
            self.exp_id, self.exploration.version, 'EarlyQuit',
            {
                'state_name': {'value': 'state_name1'},
                'time_spent_in_exp_in_msecs': {'value': 200}
            },
            [
                {
                    'action_type': 'ExplorationStart',
                    'action_customization_args': {
                        'state_name': {'value': 'state_name1'}
                    },
                    'schema_version': 1
                }
            ])
        stats_models.ExplorationIssuesModel.create(
            self.exp_id, 1, [
                {
                    'issue_type': 'EarlyQuit',
                    'issue_customization_args': {
                        'state_name': {'value': 'state_name1'},
                        'time_spent_in_exp_in_msecs': {'value': 200}
                        },
                    'playthrough_ids': [playthrough_id],
                    'schema_version': 1,
                    'is_valid': True
                }
            ])

        self.playthrough_data: stats_domain.PlaythroughDict = {
            'exp_id': self.exp_id,
            'exp_version': self.exploration.version,
            'issue_type': 'EarlyQuit',
            'issue_customization_args': {
                'state_name': {'value': 'state_name1'},
                'time_spent_in_exp_in_msecs': {'value': 250}
            },
            'actions': [
                {
                    'action_type': 'ExplorationStart',
                    'action_customization_args': {
                        'state_name': {'value': 'state_name1'}
                    },
                    'schema_version': 1
                }
            ]
        }

        self.csrf_token = self.get_new_csrf_token()

    def test_new_playthrough_gets_stored(self) -> None:
        """Test that a new playthrough gets created and is added to an existing
        issue's list of playthrough IDs.
        """
        self.post_json('/explorehandler/store_playthrough/%s' % (self.exp_id), {
            'playthrough_data': self.playthrough_data,
            'issue_schema_version': 1,
        }, csrf_token=self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        assert model is not None
        self.assertEqual(len(model.unresolved_issues), 1)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 2)

    def test_new_exp_issue_gets_created(self) -> None:
        """Test that a new playthrough gets created and a new issue is created
        for it.
        """
        self.playthrough_data['issue_customization_args']['state_name'][
            'value'] = 'state_name2'

        self.post_json('/explorehandler/store_playthrough/%s' % (self.exp_id), {
            'playthrough_data': self.playthrough_data,
            'issue_schema_version': 1,
        }, csrf_token=self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        assert model is not None
        self.assertEqual(len(model.unresolved_issues), 2)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 1)
        self.assertEqual(len(model.unresolved_issues[1]['playthrough_ids']), 1)

    def test_playthrough_gets_added_to_cyclic_issues(self) -> None:
        """Test that a new cyclic playthrough gets added to the correct
        cyclic issue when it exists.
        """
        playthrough_id = stats_models.PlaythroughModel.create(
            self.exp_id, self.exploration.version, 'CyclicStateTransitions',
            {
                'state_names': {
                    'value': ['state_name1', 'state_name2', 'state_name1']
                },
            },
            [
                {
                    'action_type': 'ExplorationStart',
                    'action_customization_args': {
                        'state_name': {
                            'value': 'state_name1'
                        }
                    },
                    'schema_version': 1
                }
            ])

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        assert model is not None
        model.unresolved_issues.append({
            'issue_type': 'CyclicStateTransitions',
            'issue_customization_args': {
                'state_names': {
                    'value': ['state_name1', 'state_name2', 'state_name1']
                },
            },
            'playthrough_ids': [playthrough_id],
            'schema_version': 1,
            'is_valid': True
        })
        model.update_timestamps()
        model.put()

        self.playthrough_data = {
            'exp_id': self.exp_id,
            'exp_version': self.exploration.version,
            'issue_type': 'CyclicStateTransitions',
            'issue_customization_args': {
                'state_names': {
                    'value': ['state_name1', 'state_name2', 'state_name1']
                },
            },
            'actions': [
                {
                    'action_type': 'ExplorationStart',
                    'action_customization_args': {
                        'state_name': {'value': 'state_name1'}
                    },
                    'schema_version': 1
                }
            ],
        }

        self.post_json('/explorehandler/store_playthrough/%s' % (self.exp_id), {
            'playthrough_data': self.playthrough_data,
            'issue_schema_version': 1,
        }, csrf_token=self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        assert model is not None
        self.assertEqual(len(model.unresolved_issues), 2)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 1)
        self.assertEqual(len(model.unresolved_issues[1]['playthrough_ids']), 2)

    def test_cyclic_issues_of_different_order_creates_new_issue(self) -> None:
        """Test that a cyclic issue with the same list of states, but in
        a different order creates a new issue.
        """
        playthrough_id = stats_models.PlaythroughModel.create(
            self.exp_id, self.exploration.version, 'CyclicStateTransitions',
            {
                'state_names': {
                    'value': ['state_name1', 'state_name2', 'state_name1']
                },
            },
            [
                {
                    'action_type': 'ExplorationStart',
                    'action_customization_args': {
                        'state_name': {
                            'value': 'state_name1'
                            }
                        },
                    'schema_version': 1
                },
            ])

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        assert model is not None
        model.unresolved_issues.append({
            'issue_type': 'CyclicStateTransitions',
            'issue_customization_args': {
                'state_names': {
                    'value': ['state_name1', 'state_name2', 'state_name1']
                },
            },
            'playthrough_ids': [playthrough_id],
            'schema_version': 1,
            'is_valid': True
        })
        model.update_timestamps()
        model.put()

        self.playthrough_data = {
            'exp_id': self.exp_id,
            'exp_version': self.exploration.version,
            'issue_type': 'CyclicStateTransitions',
            'issue_customization_args': {
                'state_names': {
                    'value': ['state_name2', 'state_name1', 'state_name2']
                },
            },
            'actions': [
                {
                    'action_type': 'ExplorationStart',
                    'action_customization_args': {
                        'state_name': {'value': 'state_name1'}
                    },
                    'schema_version': 1
                }
            ]
        }

        self.post_json('/explorehandler/store_playthrough/%s' % (self.exp_id), {
            'playthrough_data': self.playthrough_data,
            'issue_schema_version': 1,
        }, csrf_token=self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        assert model is not None
        self.assertEqual(len(model.unresolved_issues), 3)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 1)
        self.assertEqual(len(model.unresolved_issues[1]['playthrough_ids']), 1)
        self.assertEqual(len(model.unresolved_issues[2]['playthrough_ids']), 1)

    def test_playthrough_not_stored_at_limiting_value(self) -> None:
        """Test that a playthrough is not stored when the maximum number of
        playthroughs per issue already exists.
        """
        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        assert model is not None
        model.unresolved_issues[0]['playthrough_ids'] = [
            'id1', 'id2', 'id3', 'id4', 'id5'
        ]
        model.update_timestamps()
        model.put()

        self.post_json('/explorehandler/store_playthrough/%s' % (self.exp_id), {
            'playthrough_data': self.playthrough_data,
            'issue_schema_version': 1,
        }, csrf_token=self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        assert model is not None
        self.assertEqual(len(model.unresolved_issues), 1)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 5)

    def test_error_without_schema_version_in_payload_dict(self) -> None:
        """Test that passing a payload without schema version raises an
        exception.
        """
        self.post_json('/explorehandler/store_playthrough/%s' % (self.exp_id), {
            'playthrough_data': self.playthrough_data,
        }, csrf_token=self.csrf_token, expected_status_int=400)

    def test_error_on_invalid_playthrough_dict(self) -> None:
        """Test that passing an invalid playthrough dict raises an exception."""
        self.playthrough_data['issue_type'] = 'FakeIssueType'
        self.post_json('/explorehandler/store_playthrough/%s' % (self.exp_id), {
            'playthrough_data': self.playthrough_data,
            'issue_schema_version': 1,
        }, csrf_token=self.csrf_token, expected_status_int=400)


class StatsEventHandlerTest(test_utils.GenericTestBase):
    """Tests for all the statistics event models recording handlers."""

    def setUp(self) -> None:
        super().setUp()
        self.exp_id = '15'

        self.login(self.VIEWER_EMAIL)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        exp_services.load_demo(self.exp_id)
        exploration = exp_fetchers.get_exploration_by_id(self.exp_id)

        self.exp_version = exploration.version
        self.state_name = 'Home'
        self.session_id = 'session_id1'
        state_stats_mapping = {
            self.state_name: stats_domain.StateStats.create_default()
        }
        exploration_stats = stats_domain.ExplorationStats(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0,
            state_stats_mapping)
        stats_services.create_stats_model(exploration_stats)

        self.aggregated_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                }
            }
        }

    def test_none_version_raises_exception(self) -> None:
        """Test that error is raised on None exp_version."""
        self.post_json(
            '/explorehandler/stats_events/%s' % (
                self.exp_id), {
                    'aggregated_stats': self.aggregated_stats,
                    'exp_version': None},
            expected_status_int=400)

    def test_stats_events_handler(self) -> None:
        """Test the handler for handling batched events."""
        self.post_json('/explorehandler/stats_events/%s' % (
            self.exp_id), {
                'aggregated_stats': self.aggregated_stats,
                'exp_version': self.exp_version})

        self.assertEqual(self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_STATS), 1)
        self.process_and_flush_pending_tasks()

        # Check that the models are updated.
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        assert exploration_stats is not None
        self.assertEqual(exploration_stats.num_starts_v2, 1)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 1)
        self.assertEqual(exploration_stats.num_completions_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].total_hit_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].first_hit_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].total_answers_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].useful_feedback_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].num_completions_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].num_times_solution_viewed_v2, 1)

    def test_stats_events_handler_raises_error_with_missing_exp_stats_property(
        self
    ) -> None:
        # Here we use MyPy ignore because MyPy doesn't allow key deletion
        # from TypedDict.
        self.aggregated_stats.pop('num_starts')  # type: ignore[misc]

        response = self.post_json('/explorehandler/stats_events/%s' % (
            self.exp_id), {
                'aggregated_stats': self.aggregated_stats,
                'exp_version': self.exp_version
        }, expected_status_int=400)

        error_msg = (
            'At \'http://localhost/explorehandler/stats_events/15\' '
            'these errors are happening:\n'
            'Schema validation for \'aggregated_stats\' '
            'failed: num_starts not in aggregated stats dict.'
        )
        self.assertIn(error_msg, response['error'])

        self.logout()

    def test_stats_events_handler_raises_error_with_invalid_exp_stats_property(
        self
    ) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        self.aggregated_stats['num_starts'] = 'invalid'  # type: ignore[arg-type]

        response = self.post_json('/explorehandler/stats_events/%s' % (
            self.exp_id), {
                'aggregated_stats': self.aggregated_stats,
                'exp_version': self.exp_version
        }, expected_status_int=400)

        error_msg = (
            'At \'http://localhost/explorehandler/stats_events/15\' '
            'these errors are happening:\n'
            'Schema validation for \'aggregated_stats\' '
            'failed: Expected num_starts to be an int, received invalid'
        )
        self.assertIn(error_msg, response['error'])

        self.logout()

    def test_stats_events_handler_raise_error_with_missing_state_stats_property(
        self
    ) -> None:
        self.aggregated_stats['state_stats_mapping']['Home'].pop(
            'total_hit_count')

        response = self.post_json('/explorehandler/stats_events/%s' % (
                self.exp_id), {
                    'aggregated_stats': self.aggregated_stats,
                    'exp_version': self.exp_version}, expected_status_int=400)

        error_msg = (
            'At \'http://localhost/explorehandler/stats_events/15\' '
            'these errors are happening:\n'
            'Schema validation for \'aggregated_stats\' '
            'failed: total_hit_count not in '
            'state stats mapping of Home in aggregated stats dict.'
        )
        self.assertIn(error_msg, response['error'])

        self.logout()

    def test_stats_events_handler_raise_error_with_invalid_state_stats_property(
        self
    ) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        self.aggregated_stats['state_stats_mapping']['Home'][
            'total_hit_count'
        ] = 'invalid'  # type: ignore[assignment]

        response = self.post_json(
            '/explorehandler/stats_events/%s' % self.exp_id,
            {
                'aggregated_stats': self.aggregated_stats,
                'exp_version': self.exp_version
            }, expected_status_int=400
        )

        error_msg = (
            'At \'http://localhost/explorehandler/stats_events/15\' '
            'these errors are happening:\n'
            'Schema validation for \'aggregated_stats\' '
            'failed: Expected total_hit_count to be an int, received invalid'
        )
        self.assertIn(error_msg, response['error'])

        self.logout()


class AnswerSubmittedEventHandlerTest(test_utils.GenericTestBase):
    """Tests for the answer submitted event handler."""

    def test_submit_answer_for_exploration(self) -> None:
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        version = 1

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)

        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        state_name_1 = exploration_dict['exploration']['init_state_name']

        self.post_json(
            '/explorehandler/answer_submitted_event/%s' % exp_id,
            {
                'old_state_name': state_name_1,
                'answer': 'This is an answer.',
                'version': version,
                'client_time_spent_in_secs': 0,
                'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
                'answer_group_index': 0,
                'rule_spec_index': 0,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
            }
        )
        submitted_answer = stats_services.get_state_answers(
            exp_id, version, state_name_1)
        assert submitted_answer is not None
        self.assertEqual(
            len(submitted_answer.get_submitted_answer_dict_list()), 1)
        self.assertEqual(
            submitted_answer.get_submitted_answer_dict_list()[0]['answer'],
            'This is an answer.'
        )
        self.logout()

    def test_submit_answer_for_exploration_raises_error_with_no_version(
        self
    ) -> None:
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)

        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        state_name_1 = exploration_dict['exploration']['init_state_name']

        response = self.post_json(
            '/explorehandler/answer_submitted_event/%s' % exp_id,
            {
                'old_state_name': state_name_1,
                'answer': 'This is an answer.',
                'version': None,
                'client_time_spent_in_secs': 0,
                'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
                'answer_group_index': 0,
                'rule_spec_index': 0,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
            }, expected_status_int=400
        )
        self.assertEqual(
            response['error'],
            'At \'http://localhost/explorehandler/answer_submitted_event/6\' '
            'these errors are happening:\n'
            'Missing key in handler args: version.'
        )

    def test_submit_answer_for_exp_raises_error_with_no_answer_matching_type(
        self
    ) -> None:
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        version = 1

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)

        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        state_name_1 = exploration_dict['exploration']['init_state_name']

        response = self.post_json(
            '/explorehandler/answer_submitted_event/%s' % exp_id,
            {
                'old_state_name': state_name_1,
                'answer': 1.1,
                'version': version,
                'client_time_spent_in_secs': 0,
                'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
                'answer_group_index': 0,
                'rule_spec_index': 0,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
            }, expected_status_int=400
        )
        self.assertEqual(
            response['error'],
            'At \'http://localhost/explorehandler/answer_submitted_event/6\' '
            'these errors are happening:\n'
            'Schema validation for \'answer\' failed: '
            'Type of 1.1 is not present in options'
        )


class StateHitEventHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_hitting_new_state(self) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        exploration_version = 1

        all_models = (
            stats_models.StateHitEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        self.post_json(
            '/explorehandler/state_hit_event/%s' % exp_id,
            {
                'new_state_name': 'new_state',
                'exploration_version': exploration_version,
                'client_time_spent_in_secs': 0,
                'session_id': 'session_id',
                'old_params': {}
            }
        )

        all_models = (
            stats_models.StateHitEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 1)

        state_hit_event_log_entry_model = all_models.get()
        assert state_hit_event_log_entry_model is not None
        model = state_hit_event_log_entry_model

        self.assertEqual(model.exploration_id, exp_id)
        self.assertEqual(model.state_name, 'new_state')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exploration_version, exploration_version)
        self.assertEqual(model.params, {})
        self.assertEqual(model.play_type, feconf.PLAY_TYPE_NORMAL)

        self.logout()

    def test_cannot_hit_new_state_with_no_exploration_version(self) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)

        all_models = (
            stats_models.StateHitEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        response = self.post_json(
            '/explorehandler/state_hit_event/%s' % exp_id,
            {
                'new_state_name': 'new_state',
                'exploration_version': None,
                'client_time_spent_in_secs': 0,
                'session_id': 'session_id',
                'old_params': {}
            }, expected_status_int=400
        )
        self.assertEqual(
            response['error'],
            'At \'http://localhost/explorehandler/state_hit_event/6\' '
            'these errors are happening:\n'
            'Missing key in handler args: exploration_version.'
        )

        self.logout()

    def test_cannot_hit_new_state_with_no_new_state_name(self) -> None:
        self.login(self.VIEWER_EMAIL)

        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        exploration_version = 1

        all_models = (
            stats_models.StateHitEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        response = self.post_json(
            '/explorehandler/state_hit_event/%s' % exp_id,
            {
                'new_state_name': None,
                'exploration_version': exploration_version,
                'client_time_spent_in_secs': 0,
                'session_id': 'session_id',
                'old_params': {}
            },
            expected_status_int=400
        )

        self.assertEqual(
            response['error'],
            'At \'http://localhost/explorehandler/state_hit_event/6\' '
            'these errors are happening:\n'
            'Missing key in handler args: new_state_name.',
        )

        self.logout()


class StateCompleteEventHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_completing_a_state(self) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        exp_version = 1

        all_models = (
            stats_models.StateCompleteEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        self.post_json(
            '/explorehandler/state_complete_event/%s' % exp_id,
            {
                'state_name': 'state_name',
                'exp_version': exp_version,
                'time_spent_in_state_secs': 2.0,
                'session_id': 'session_id'
            }
        )

        all_models = (
            stats_models.StateCompleteEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 1)

        state_complete_event_log_entry_model = all_models.get()
        assert state_complete_event_log_entry_model is not None
        model = state_complete_event_log_entry_model

        self.assertEqual(model.exp_id, exp_id)
        self.assertEqual(model.state_name, 'state_name')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exp_version, exp_version)
        self.assertEqual(model.time_spent_in_state_secs, 2.0)

        self.logout()

    def test_cannot_complete_state_with_no_exploration_version(self) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)

        all_models = (
            stats_models.StateCompleteEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        response = self.post_json(
            '/explorehandler/state_complete_event/%s' % exp_id,
            {
                'state_name': 'state_name',
                'time_spent_in_state_secs': 2.0,
                'session_id': 'session_id'
            }, expected_status_int=400
        )

        error_msg = (
            'At \'http://localhost/explorehandler/state_complete_event/6\' '
            'these errors are happening:\n'
            'Missing key in handler args: exp_version.'
        )
        self.assertEqual(response['error'], error_msg)

        self.logout()


class LeaveForRefresherExpEventHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_leaving_an_exploration(self) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        exp_version = 1

        all_models = (
            stats_models.LeaveForRefresherExplorationEventLogEntryModel
            .get_all())
        self.assertEqual(all_models.count(), 0)

        self.post_json(
            '/explorehandler/leave_for_refresher_exp_event/%s' % exp_id,
            {
                'state_name': 'state_name',
                'exp_version': exp_version,
                'time_spent_in_state_secs': 2.0,
                'session_id': 'session_id',
                'refresher_exp_id': 'refresher_exp_id'
            }
        )

        all_models = (
            stats_models.LeaveForRefresherExplorationEventLogEntryModel
            .get_all())
        self.assertEqual(all_models.count(), 1)

        exp_event_log_model = all_models.get()
        assert exp_event_log_model is not None
        model = exp_event_log_model

        self.assertEqual(model.exp_id, exp_id)
        self.assertEqual(model.refresher_exp_id, 'refresher_exp_id')
        self.assertEqual(model.state_name, 'state_name')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exp_version, exp_version)
        self.assertEqual(model.time_spent_in_state_secs, 2.0)

        self.logout()


class ExplorationStartEventHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_cannot_fetch_exploration_with_invalid_version(self) -> None:
        # Load demo exploration.
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        self.login(self.VIEWER_EMAIL)

        self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id),
            {'v': 5},
            expected_status_int=404)

        self.logout()

    def test_user_checkpoint_progress_is_none_on_fetching_older_exploration(
        self
    ) -> None:
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.login(self.VIEWER_EMAIL)

        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_state_name'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_state_name'])

        # Update exploration.
        # Now version of the exploration becomes 2.
        change_list = _get_change_list(
            'What language',
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            True
        )
        exp_services.update_exploration(
            owner_id,
            exp_id,
            change_list,
            'Made What language state a checkpoint'
        )

        # First checkpoint reached.
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/explorehandler/checkpoint_reached/%s' % exp_id,
            {
                'most_recently_reached_checkpoint_exp_version': 2,
                'most_recently_reached_checkpoint_state_name': 'Welcome!'
            },
            csrf_token=csrf_token
        )

        # Fetching latest exploration.
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        self.assertEqual(
            exploration_dict['furthest_reached_checkpoint_exp_version'], 2)
        self.assertEqual(
            exploration_dict['furthest_reached_checkpoint_state_name'],
            'Welcome!')
        self.assertEqual(
            exploration_dict['most_recently_reached_checkpoint_exp_version'],
            2)
        self.assertEqual(
            exploration_dict['most_recently_reached_checkpoint_state_name'],
            'Welcome!')

        # Fetching older exploration.
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id),
            {'v': 1})
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_state_name'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_state_name'])

        self.logout()

    def test_starting_a_state(self) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        version = 1

        all_models = (
            stats_models.StartExplorationEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        self.post_json(
            '/explorehandler/exploration_start_event/%s' % exp_id,
            {
                'state_name': 'state_name',
                'version': version,
                'params': {
                    'test_param1': 1
                },
                'session_id': 'session_id'
            }
        )

        all_models = (
            stats_models.StartExplorationEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 1)

        event_log_entry_model = all_models.get()
        assert event_log_entry_model is not None
        model = event_log_entry_model

        self.assertEqual(model.exploration_id, exp_id)
        self.assertEqual(model.state_name, 'state_name')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exploration_version, version)
        self.assertEqual(model.params, {
            'test_param1': 1
        })
        self.assertEqual(model.play_type, feconf.PLAY_TYPE_NORMAL)

        self.logout()

    def test_cannot_start_a_state_with_no_exploration_version(self) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)

        all_models = (
            stats_models.StartExplorationEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        response = self.post_json(
            '/explorehandler/exploration_start_event/%s' % exp_id,
            {
                'state_name': 'state_name',
                'params': {},
                'session_id': 'session_id'
            }, expected_status_int=400
        )

        error_msg = (
            'At \'http://localhost/explorehandler/exploration_start_event/6\' '
            'these errors are happening:\n'
            'Missing key in handler args: version.'
        )
        self.assertEqual(response['error'], error_msg)

        self.logout()


class ExplorationActualStartEventHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_actually_starting_a_state(self) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        version = 1

        all_models = (
            stats_models.ExplorationActualStartEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        self.post_json(
            '/explorehandler/exploration_actual_start_event/%s' % exp_id,
            {
                'state_name': 'state_name',
                'exploration_version': version,
                'session_id': 'session_id'
            }
        )

        all_models = (
            stats_models.ExplorationActualStartEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 1)

        event_log_entry_model = all_models.get()
        assert event_log_entry_model is not None
        model = event_log_entry_model

        self.assertEqual(model.exp_id, exp_id)
        self.assertEqual(model.state_name, 'state_name')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exp_version, version)

        self.logout()

    def test_cannot_actually_start_a_state_with_no_exploration_version(
        self
    ) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)

        all_models = (
            stats_models.ExplorationActualStartEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        response = self.post_json(
            '/explorehandler/exploration_actual_start_event/%s' % exp_id,
            {
                'state_name': 'state_name',
                'session_id': 'session_id'
            }, expected_status_int=400
        )

        error_msg = (
            'At \'http://localhost/explorehandler/'
            'exploration_actual_start_event/6\' these errors are happening:\n'
            'Missing key in handler args: exploration_version.'
        )
        self.assertEqual(response['error'], error_msg)

        self.logout()


class SolutionHitEventHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_viewing_solution(self) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        version = 1

        all_models = (
            stats_models.SolutionHitEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        self.post_json(
            '/explorehandler/solution_hit_event/%s' % exp_id,
            {
                'state_name': 'state_name',
                'exploration_version': version,
                'session_id': 'session_id',
                'time_spent_in_state_secs': 2.0
            }
        )

        all_models = (
            stats_models.SolutionHitEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 1)

        event_log_entry_model = all_models.get()
        assert event_log_entry_model is not None
        model = event_log_entry_model

        self.assertEqual(model.exp_id, exp_id)
        self.assertEqual(model.state_name, 'state_name')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exp_version, version)
        self.assertEqual(model.time_spent_in_state_secs, 2.0)

        self.logout()

    def test_cannot_view_solution_with_no_exploration_version(self) -> None:
        self.login(self.VIEWER_EMAIL)
        # Load demo exploration.
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)

        all_models = (
            stats_models.SolutionHitEventLogEntryModel.get_all())
        self.assertEqual(all_models.count(), 0)

        response = self.post_json(
            '/explorehandler/solution_hit_event/%s' % exp_id,
            {
                'state_name': 'state_name',
                'session_id': 'session_id',
                'time_spent_in_state_secs': 2.0
            }, expected_status_int=400
        )
        error_msg = (
            'At \'http://localhost/explorehandler/solution_hit_event/6\' '
            'these errors are happening:\n'
            'Missing key in handler args: exploration_version.'
        )
        self.assertEqual(response['error'], error_msg)

        self.logout()


class LearnerAnswerDetailsSubmissionHandlerTests(test_utils.GenericTestBase):
    """Tests for learner answer info handler tests."""

    def test_submit_learner_answer_details_for_exploration_states(
        self
    ) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        entity_type = feconf.ENTITY_TYPE_EXPLORATION

        csrf_token = self.get_new_csrf_token()
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', False):
            self.put_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_DETAILS_SUBMIT_URL,
                    entity_type, exp_id),
                {
                    'state_name': 'abc',
                    'interaction_id': 'TextInput',
                    'answer': 'This is an answer.',
                    'answer_details': 'This is an answer details.',
                }, csrf_token=csrf_token, expected_status_int=404)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            exploration_dict = self.get_json(
                '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
            state_name = exploration_dict['exploration']['init_state_name']
            interaction_id = exploration_dict['exploration'][
                'states'][state_name]['interaction']['id']
            state_reference = (
                stats_services.get_state_reference_for_exploration(
                    exp_id, state_name))

            self.assertEqual(state_name, 'Sentence')
            self.assertEqual(interaction_id, 'TextInput')
            self.put_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_DETAILS_SUBMIT_URL,
                    entity_type, exp_id),
                {
                    'state_name': state_name,
                    'interaction_id': interaction_id,
                    'answer': 'This is an answer.',
                    'answer_details': 'This is an answer details.',
                }, csrf_token=csrf_token)

            learner_answer_details = stats_services.get_learner_answer_details(
                entity_type, state_reference)
            assert learner_answer_details is not None
            self.assertEqual(
                learner_answer_details.state_reference, state_reference)
            self.assertEqual(
                learner_answer_details.interaction_id, interaction_id)
            self.assertEqual(
                len(learner_answer_details.learner_answer_info_list), 1)
            self.assertEqual(
                learner_answer_details.learner_answer_info_list[0].answer,
                'This is an answer.')
            self.assertEqual(
                learner_answer_details.learner_answer_info_list[0]
                .answer_details,
                'This is an answer details.')
            self.put_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_DETAILS_SUBMIT_URL,
                    entity_type, exp_id),
                {
                    'state_name': state_name,
                    'interaction_id': 'GraphInput',
                    'answer': 'This is an answer.',
                    'answer_details': 'This is an answer details.',
                }, csrf_token=csrf_token, expected_status_int=500)

    def test_cannot_submit_answer_details_for_exploration_without_state_name(
        self
    ) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        exp_id = '6'
        exp_services.delete_demo(exp_id)
        exp_services.load_demo(exp_id)
        entity_type = feconf.ENTITY_TYPE_EXPLORATION

        csrf_token = self.get_new_csrf_token()
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            exploration_dict = self.get_json(
                '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
            state_name = exploration_dict['exploration']['init_state_name']
            interaction_id = exploration_dict['exploration'][
                'states'][state_name]['interaction']['id']

            self.assertEqual(state_name, 'Sentence')
            self.assertEqual(interaction_id, 'TextInput')
            response = self.put_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_DETAILS_SUBMIT_URL,
                    entity_type, exp_id),
                {
                    'interaction_id': interaction_id,
                    'answer': 'This is an answer.',
                    'answer_details': 'This is an answer details.',
                },
                csrf_token=csrf_token,
                expected_status_int=500
            )

        self.assertEqual(
            response['error'],
            'The \'state_name\' must be provided when the entity_type '
            'is exploration.'
        )

    def test_submit_learner_answer_details_for_question(self) -> None:
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        editor_id = self.get_user_id_from_email(
            self.EDITOR_EMAIL)
        question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            question_id, editor_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_1'],
            content_id_generator.next_content_id_index)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            state_reference = (
                stats_services.get_state_reference_for_question(question_id))
            self.assertEqual(state_reference, question_id)
            self.put_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_DETAILS_SUBMIT_URL,
                    feconf.ENTITY_TYPE_QUESTION, question_id),
                {
                    'interaction_id': 'TextInput',
                    'answer': 'This is an answer.',
                    'answer_details': 'This is an answer details.',
                }, csrf_token=csrf_token)
            learner_answer_details = stats_services.get_learner_answer_details(
                feconf.ENTITY_TYPE_QUESTION, state_reference)
            assert learner_answer_details is not None
            self.assertEqual(
                learner_answer_details.state_reference, state_reference)
            self.put_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_DETAILS_SUBMIT_URL,
                    feconf.ENTITY_TYPE_QUESTION, question_id),
                {
                    'interaction_id': 'TextInput',
                    'answer': 'This is an answer.',
                    'answer_details': 'This is an answer details.',
                }, csrf_token=csrf_token)
            self.put_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_DETAILS_SUBMIT_URL,
                    feconf.ENTITY_TYPE_QUESTION, question_id),
                {
                    'interaction_id': 'GraphInput',
                    'answer': 'This is an answer.',
                    'answer_details': 'This is an answer details.',
                }, csrf_token=csrf_token, expected_status_int=500)


class CheckpointReachedEventHandlerTests(test_utils.GenericTestBase):
    """Tests for checkpoint reached event handler."""

    def test_user_checkpoint_progress_is_updated_correctly(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        # Load demo exploration.
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        self.login(self.VIEWER_EMAIL)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        # Viewer opens exploration.
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_state_name'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_state_name'])

        # First checkpoint reached.
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/explorehandler/checkpoint_reached/%s' % exp_id,
            {
                'most_recently_reached_checkpoint_exp_version': 1,
                'most_recently_reached_checkpoint_state_name': 'Welcome!'
            },
            csrf_token=csrf_token
        )

        exp_user_data = exp_fetchers.get_exploration_user_data(
            viewer_id, exp_id)
        assert exp_user_data is not None
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_state_name, 'Welcome!')
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_state_name,
            'Welcome!')

        # Update exploration.
        # Now version of the exploration becomes 2.
        change_list = _get_change_list(
            'What language',
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            True
        )
        exp_services.update_exploration(
            owner_id,
            exp_id,
            change_list,
            'Made What language state a checkpoint'
        )

        # Viewer opens exploration again.
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_state_name, 'Welcome!')
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_state_name,
            'Welcome!')

        # Second checkpoint reached.
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/explorehandler/checkpoint_reached/%s' % exp_id,
            {
                'most_recently_reached_checkpoint_exp_version': 2,
                'most_recently_reached_checkpoint_state_name': 'What language'
            },
            csrf_token=csrf_token
        )
        updated_exp_user_data = exp_fetchers.get_exploration_user_data(
            viewer_id, exp_id)
        assert updated_exp_user_data is not None
        self.assertEqual(
            updated_exp_user_data.furthest_reached_checkpoint_exp_version, 2)
        self.assertEqual(
            updated_exp_user_data.furthest_reached_checkpoint_state_name,
            'What language')
        self.assertEqual(
            updated_exp_user_data.most_recently_reached_checkpoint_exp_version,
            2
        )
        self.assertEqual(
            updated_exp_user_data.most_recently_reached_checkpoint_state_name,
            'What language')

        self.logout()


class ExplorationRestartEventHandlerTests(test_utils.GenericTestBase):
    """Tests for exploration restart event handler."""

    def test_user_checkpoint_progress_is_updated_correctly_on_restart(
        self
    ) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        # Load demo exploration.
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        self.login(self.VIEWER_EMAIL)
        viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        # Viewer opens exploration.
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_state_name'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_state_name'])

        # First checkpoint reached.
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/explorehandler/checkpoint_reached/%s' % exp_id,
            {
                'most_recently_reached_checkpoint_exp_version': 1,
                'most_recently_reached_checkpoint_state_name': 'Welcome!'
            },
            csrf_token=csrf_token
        )
        exp_user_data = exp_fetchers.get_exploration_user_data(
            viewer_id, exp_id)
        assert exp_user_data is not None
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_state_name, 'Welcome!')
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_state_name,
            'Welcome!')

        # Exploration restarted.
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/explorehandler/restart/%s' % exp_id,
            {
                'most_recently_reached_checkpoint_state_name': None
            },
            csrf_token=csrf_token
        )
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        self.assertEqual(
            exploration_dict['furthest_reached_checkpoint_exp_version'], 1)
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_state_name, 'Welcome!')
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_state_name'])

        self.logout()


class SaveTransientCheckpointProgressHandlerTests(test_utils.GenericTestBase):
    """Tests for save transient checkpoint progress handler."""

    def test_logged_out_user_checkpoint_progress_is_saved_correctly(
        self
    ) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Load demo exploration.
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        # Logged out user opens exploration.
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_state_name'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_state_name'])

        # First checkpoint reached.
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/explorehandler/checkpoint_reached_by_logged_out_user/%s' % exp_id,
            {
                'most_recently_reached_checkpoint_exp_version': 1,
                'most_recently_reached_checkpoint_state_name': 'Welcome!'
            },
            csrf_token=csrf_token
        )

        unique_progress_url_id = response['unique_progress_url_id']

        exp_user_data = exp_fetchers.get_logged_out_user_progress(
            unique_progress_url_id
        )
        assert exp_user_data is not None
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_state_name, 'Welcome!')
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_state_name,
            'Welcome!')

        # Update exploration.
        # Now version of the exploration becomes 2.
        change_list = _get_change_list(
            'What language',
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            True
        )
        exp_services.update_exploration(
            owner_id,
            exp_id,
            change_list,
            'Made What language state a checkpoint'
        )

        # Second checkpoint reached.
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/explorehandler/checkpoint_reached_by_logged_out_user/%s' % exp_id,
            {
                'unique_progress_url_id': unique_progress_url_id,
                'most_recently_reached_checkpoint_exp_version': 2,
                'most_recently_reached_checkpoint_state_name': 'What language'
            },
            csrf_token=csrf_token
        )
        updated_exp_user_data = exp_fetchers.get_logged_out_user_progress(
            unique_progress_url_id
        )
        assert updated_exp_user_data is not None
        self.assertEqual(
            updated_exp_user_data.furthest_reached_checkpoint_exp_version, 2)
        self.assertEqual(
            updated_exp_user_data.furthest_reached_checkpoint_state_name,
            'What language')
        self.assertEqual(
            updated_exp_user_data.most_recently_reached_checkpoint_exp_version,
            2
        )
        self.assertEqual(
            updated_exp_user_data.most_recently_reached_checkpoint_state_name,
            'What language')


class TransientCheckpointUrlPageTests(test_utils.GenericTestBase):
    """Tests for transient checkpoint url handler."""

    def test_exploration_page_raises_error_with_invalid_pid(self) -> None:
        unique_progress_url_id = 'pid123'

        self.get_html_response(
            '/progress/%s' % (unique_progress_url_id),
            expected_status_int=404
        )

    def test_logged_out_progress_is_displayed_correctly_when_exp_version_is_same( # pylint: disable=line-too-long
        self
    ) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        # Load demo exploration.
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        # Logged out user opens exploration.
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_state_name'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_state_name'])

        # First checkpoint reached.
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/explorehandler/checkpoint_reached_by_logged_out_user/%s' % exp_id,
            {
                'most_recently_reached_checkpoint_exp_version': 1,
                'most_recently_reached_checkpoint_state_name': 'Welcome!'
            },
            csrf_token=csrf_token
        )

        unique_progress_url_id = response['unique_progress_url_id']

        url_response = self.get_html_response(
            '/progress/%s' % (unique_progress_url_id),
            expected_status_int=302
        )

        exp_user_data = exp_fetchers.get_logged_out_user_progress(
            unique_progress_url_id
        )
        assert exp_user_data is not None
        self.assertTrue(
            url_response.headers['Location'].endswith(
                '%s/%s?pid=%s' % (
            feconf.EXPLORATION_URL_PREFIX,
            exp_user_data.exploration_id,
            unique_progress_url_id)))

        exploration_dict = self.get_json(
            '%s/%s?pid=%s' % (
                feconf.EXPLORATION_INIT_URL_PREFIX,
                exp_user_data.exploration_id,
                unique_progress_url_id
                ))
        self.assertEqual(
            exploration_dict['furthest_reached_checkpoint_exp_version'], 1)
        self.assertEqual(
            exploration_dict['furthest_reached_checkpoint_state_name'],
            'Welcome!')
        self.assertEqual(
            exploration_dict['most_recently_reached_checkpoint_exp_version'], 1)
        self.assertEqual(
            exploration_dict['most_recently_reached_checkpoint_state_name'],
            'Welcome!')

    def test_logged_out_progress_is_displayed_correctly_when_exp_version_different( # pylint: disable=line-too-long
        self
    ) -> None:

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Load demo exploration.
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        # Logged out user opens exploration.
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['furthest_reached_checkpoint_state_name'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_exp_version'])
        self.assertIsNone(
            exploration_dict['most_recently_reached_checkpoint_state_name'])

        # Update exploration.
        # Now version of the exploration becomes 2.
        change_list = _get_change_list(
            'What language',
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            True
        )
        exp_services.update_exploration(
            owner_id,
            exp_id,
            change_list,
            'Made What language state a checkpoint'
        )

        # First checkpoint reached.
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/explorehandler/checkpoint_reached_by_logged_out_user/%s' % exp_id,
            {
                'most_recently_reached_checkpoint_exp_version': 1,
                'most_recently_reached_checkpoint_state_name': 'Welcome!'
            },
            csrf_token=csrf_token
        )

        unique_progress_url_id = response['unique_progress_url_id']

        url_response = self.get_html_response(
            '/progress/%s' % (unique_progress_url_id),
            expected_status_int=302
        )

        exp_user_data = exp_fetchers.get_logged_out_user_progress(
            unique_progress_url_id
        )
        assert exp_user_data is not None

        self.assertTrue(
            url_response.headers['Location'].endswith(
                '%s/%s?pid=%s' % (
            feconf.EXPLORATION_URL_PREFIX,
            exp_user_data.exploration_id,
            unique_progress_url_id)))

        exploration_dict = self.get_json(
            '%s/%s?pid=%s' % (
                feconf.EXPLORATION_INIT_URL_PREFIX,
                exp_user_data.exploration_id,
                unique_progress_url_id
                ))
        self.assertEqual(
            exploration_dict['furthest_reached_checkpoint_exp_version'], 1)
        self.assertEqual(
            exploration_dict['furthest_reached_checkpoint_state_name'],
            'Welcome!')
        self.assertEqual(
            exploration_dict['most_recently_reached_checkpoint_exp_version'], 1)
        self.assertEqual(
            exploration_dict['most_recently_reached_checkpoint_state_name'],
            'Welcome!')


class SyncLoggedOutLearnerProgressHandlerTests(test_utils.GenericTestBase):
    """Tests for sync logged out learner progress handler."""

    def test_logged_in_checkpoint_progress_is_synced_correctly(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        # Load demo exploration.
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        # Use a dummy unique_progress_url_id.
        pid = 'pidABC'

        # Update progress for logged out user.
        exp_services.update_logged_out_user_progress(
            exp_id,
            pid,
            'Welcome!',
            1
        )

        self.login(self.VIEWER_EMAIL)
        viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        # Hit the handler for syncing logged out progress with
        # logged in progress when the user signs-in.

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/sync_logged_out_and_logged_in_progress/%s' % exp_id, # pylint: disable=line-too-long
            {
                'unique_progress_url_id': pid,
            },
            csrf_token=csrf_token
        )

        exp_user_data = exp_fetchers.get_exploration_user_data(
            viewer_id, exp_id)
        assert exp_user_data is not None
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_state_name, 'Welcome!')
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_state_name,
            'Welcome!')

        self.logout()


class StateVersionHistoryHandlerUnitTests(test_utils.GenericTestBase):
    """Tests for fetching the version history of a particular state of an
    exploration.
    """

    EXP_ID: Final = '0'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        exp_services.update_exploration(self.owner_id, self.EXP_ID, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'b',
                'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
                'new_state_name': 'a'
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index,
                'old_value': 0
            })
        ], 'A commit message.')

    def test_raises_error_when_version_history_does_not_exist(self) -> None:
        self.login(self.OWNER_EMAIL)
        # Deleting the version history model produced by exp_services.
        vh_model = exp_models.ExplorationVersionHistoryModel.get(
            exp_models.ExplorationVersionHistoryModel.get_instance_id(
                self.EXP_ID, 2
            )
        )
        vh_model.delete()

        self.get_json(
            '%s/%s/%s/%s' % (
                feconf.STATE_VERSION_HISTORY_URL_PREFIX,
                self.EXP_ID, 'a', 2
            ), expected_status_int=404
        )

        self.logout()

    def test_version_history_for_a_state_is_fetched_correctly(self) -> None:
        self.login(self.OWNER_EMAIL)
        exploration_v1 = exp_fetchers.get_exploration_by_id(
            self.EXP_ID, version=1
        )
        response_for_state_a = self.get_json(
            '%s/%s/%s/%s' % (
                feconf.STATE_VERSION_HISTORY_URL_PREFIX,
                self.EXP_ID, 'a', 2
            )
        )
        response_for_state_b = self.get_json(
            '%s/%s/%s/%s' % (
                feconf.STATE_VERSION_HISTORY_URL_PREFIX,
                self.EXP_ID, 'b', 2
            )
        )

        self.assertEqual(
            response_for_state_a, {
                'last_edited_version_number': 1,
                'state_name_in_previous_version': (
                    feconf.DEFAULT_INIT_STATE_NAME
                ),
                'state_dict_in_previous_version': exploration_v1.states[
                    feconf.DEFAULT_INIT_STATE_NAME
                ].to_dict(),
                'last_edited_committer_username': self.OWNER_USERNAME
            }
        )
        self.assertEqual(
            response_for_state_b, {
                'last_edited_version_number': None,
                'state_name_in_previous_version': None,
                'state_dict_in_previous_version': None,
                'last_edited_committer_username': self.OWNER_USERNAME
            }
        )

        self.logout()


class MetadataVersionHistoryHandlerUnitTests(test_utils.GenericTestBase):
    """Tests for fetching the version history of the exploration metadata."""

    EXP_ID: Final = '0'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID,
                [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'New title'
                })
            ],
            'A commit message.'
        )

    def test_raises_error_when_version_history_does_not_exist(self) -> None:
        self.login(self.OWNER_EMAIL)
        # Deleting the version history model produced by exp_services.
        vh_model = exp_models.ExplorationVersionHistoryModel.get(
            exp_models.ExplorationVersionHistoryModel.get_instance_id(
                self.EXP_ID, 2
            )
        )
        vh_model.delete()

        self.get_json(
            '%s/%s/%s' % (
                feconf.METADATA_VERSION_HISTORY_URL_PREFIX, self.EXP_ID, 2
            ), expected_status_int=404)

        self.logout()

    def test_version_history_for_exploration_metadata_is_fetched_correctly(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)
        exploration_v1 = exp_fetchers.get_exploration_by_id(
            self.EXP_ID, version=1
        )
        response = self.get_json(
            '%s/%s/%s' % (
                feconf.METADATA_VERSION_HISTORY_URL_PREFIX, self.EXP_ID, 2
            )
        )

        self.assertEqual(
            response, {
                'last_edited_version_number': 1,
                'last_edited_committer_username': self.OWNER_USERNAME,
                'metadata_dict_in_previous_version': (
                    exploration_v1.get_metadata().to_dict()
                )
            }
        )

        self.logout()


class EntityTranslationHandlerTest(test_utils.GenericTestBase):
    """Unit test for the EntityTranslationHandler."""

    def test_fetching_entity_translations(self) -> None:
        """Test giving feedback handler."""
        translations_mapping: Dict[str, feconf.TranslatedContentDict] = {
            'content_0': {
                'content_value': 'Translated content',
                'content_format': 'html',
                'needs_update': False
            }
        }
        language_codes = ['hi', 'bn']
        for language_code in language_codes:
            translation_models.EntityTranslationsModel.create_new(
                'exploration', 'exp1', 5, language_code, translations_mapping
            ).put()

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.login(self.VIEWER_EMAIL)
        url = '/entity_translations_handler/exploration/exp1/5/hi'
        entity_translation_dict = self.get_json(url)

        self.assertEqual(
            entity_translation_dict['translations'], translations_mapping)
        self.logout()
