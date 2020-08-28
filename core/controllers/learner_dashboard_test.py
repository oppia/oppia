# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Tests for the learner dashboard and the notifications dashboard."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import learner_progress_services
from core.domain import state_domain
from core.domain import subscription_services
from core.domain import suggestion_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(suggestion_models, feedback_models) = models.Registry.import_models([
    models.NAMES.suggestion, models.NAMES.feedback])


class OldLearnerDashboardRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting the old learner dashboard page URL
    to the new one.
    """

    def test_old_learner_dashboard_page_url(self):
        """Test to validate that the old learner dashboard page url redirects
        to the new one.
        """
        response = self.get_html_response(
            '/learner_dashboard', expected_status_int=301)
        self.assertEqual(
            'http://localhost/learner-dashboard', response.headers['location'])


class LearnerDashboardHandlerTests(test_utils.GenericTestBase):

    OWNER_EMAIL = 'owner@example.com'
    OWNER_USERNAME = 'owner'

    EXP_ID_1 = 'EXP_ID_1'
    EXP_TITLE_1 = 'Exploration title 1'
    EXP_ID_2 = 'EXP_ID_2'
    EXP_TITLE_2 = 'Exploration title 2'
    EXP_ID_3 = 'EXP_ID_3'
    EXP_TITLE_3 = 'Exploration title 3'

    COL_ID_1 = 'COL_ID_1'
    COL_TITLE_1 = 'Collection title 1'
    COL_ID_2 = 'COL_ID_2'
    COL_TITLE_2 = 'Collection title 2'
    COL_ID_3 = 'COL_ID_3'
    COL_TITLE_3 = 'Collection title 3'

    def setUp(self):
        super(LearnerDashboardHandlerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_can_see_completed_explorations(self):
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['completed_explorations_list']), 0)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        learner_progress_services.mark_exploration_as_completed(
            self.viewer_id, self.EXP_ID_1)
        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['completed_explorations_list']), 1)
        self.assertEqual(
            response['completed_explorations_list'][0]['id'], self.EXP_ID_1)
        self.logout()

    def test_can_see_completed_collections(self):
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['completed_collections_list']), 0)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1)
        self.publish_collection(self.owner_id, self.COL_ID_1)

        learner_progress_services.mark_collection_as_completed(
            self.viewer_id, self.COL_ID_1)
        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['completed_collections_list']), 1)
        self.assertEqual(
            response['completed_collections_list'][0]['id'], self.COL_ID_1)
        self.logout()

    def test_can_see_incomplete_explorations(self):
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['incomplete_explorations_list']), 0)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        state_name = 'state_name'
        version = 1

        learner_progress_services.mark_exploration_as_incomplete(
            self.viewer_id, self.EXP_ID_1, state_name, version)
        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['incomplete_explorations_list']), 1)
        self.assertEqual(
            response['incomplete_explorations_list'][0]['id'], self.EXP_ID_1)
        self.logout()

    def test_can_see_incomplete_collections(self):
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['incomplete_collections_list']), 0)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1)
        self.publish_collection(self.owner_id, self.COL_ID_1)

        learner_progress_services.mark_collection_as_incomplete(
            self.viewer_id, self.COL_ID_1)
        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['incomplete_collections_list']), 1)
        self.assertEqual(
            response['incomplete_collections_list'][0]['id'], self.COL_ID_1)
        self.logout()

    def test_can_see_exploration_playlist(self):
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['exploration_playlist']), 0)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        learner_progress_services.add_exp_to_learner_playlist(
            self.viewer_id, self.EXP_ID_1)
        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['exploration_playlist']), 1)
        self.assertEqual(
            response['exploration_playlist'][0]['id'], self.EXP_ID_1)
        self.logout()

    def test_can_see_collection_playlist(self):
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['collection_playlist']), 0)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1)
        self.publish_collection(self.owner_id, self.COL_ID_1)

        learner_progress_services.add_collection_to_learner_playlist(
            self.viewer_id, self.COL_ID_1)
        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['collection_playlist']), 1)
        self.assertEqual(
            response['collection_playlist'][0]['id'], self.COL_ID_1)
        self.logout()

    def test_can_see_subscription(self):
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['subscription_list']), 0)

        subscription_services.subscribe_to_creator(
            self.viewer_id, self.owner_id)
        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['subscription_list']), 1)
        self.assertEqual(
            response['subscription_list'][0]['creator_username'],
            self.OWNER_USERNAME)
        self.logout()

    def test_get_learner_dashboard_ids(self):
        self.login(self.VIEWER_EMAIL)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        self.publish_exploration(self.owner_id, self.EXP_ID_1)
        self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id, title=self.EXP_TITLE_2)
        self.publish_exploration(self.owner_id, self.EXP_ID_2)
        self.save_new_default_exploration(
            self.EXP_ID_3, self.owner_id, title=self.EXP_TITLE_3)
        self.publish_exploration(self.owner_id, self.EXP_ID_3)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1)
        self.publish_collection(self.owner_id, self.COL_ID_1)
        self.save_new_default_collection(
            self.COL_ID_2, self.owner_id, title=self.COL_TITLE_2)
        self.publish_collection(self.owner_id, self.COL_ID_2)
        self.save_new_default_collection(
            self.COL_ID_3, self.owner_id, title=self.COL_TITLE_3)
        self.publish_collection(self.owner_id, self.COL_ID_3)

        state_name = 'state_name'
        version = 1

        learner_progress_services.mark_exploration_as_completed(
            self.viewer_id, self.EXP_ID_1)
        learner_progress_services.mark_exploration_as_incomplete(
            self.viewer_id, self.EXP_ID_2, state_name, version)
        learner_progress_services.add_exp_to_learner_playlist(
            self.viewer_id, self.EXP_ID_3)

        learner_progress_services.mark_collection_as_completed(
            self.viewer_id, self.COL_ID_1)
        learner_progress_services.mark_collection_as_incomplete(
            self.viewer_id, self.COL_ID_2)
        learner_progress_services.add_collection_to_learner_playlist(
            self.viewer_id, self.COL_ID_3)

        response = self.get_json(feconf.LEARNER_DASHBOARD_IDS_DATA_URL)
        learner_dashboard_activity_ids = (
            response['learner_dashboard_activity_ids'])

        self.assertEqual(
            learner_dashboard_activity_ids['completed_exploration_ids'],
            [self.EXP_ID_1])
        self.assertEqual(
            learner_dashboard_activity_ids['incomplete_exploration_ids'],
            [self.EXP_ID_2])
        self.assertEqual(
            learner_dashboard_activity_ids['exploration_playlist_ids'],
            [self.EXP_ID_3])

        self.assertEqual(
            learner_dashboard_activity_ids['completed_collection_ids'],
            [self.COL_ID_1])
        self.assertEqual(
            learner_dashboard_activity_ids['incomplete_collection_ids'],
            [self.COL_ID_2])
        self.assertEqual(
            learner_dashboard_activity_ids['collection_playlist_ids'],
            [self.COL_ID_3])

    def test_get_threads_after_updating_thread_summaries(self):
        self.login(self.OWNER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        thread_summaries = response['thread_summaries']
        self.assertEqual(thread_summaries, [])

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.owner_id, 'a subject',
            'some text')

        response = self.get_json(feconf.LEARNER_DASHBOARD_DATA_URL)
        thread_summaries = response['thread_summaries']
        thread_id = thread_summaries[0]['thread_id']
        thread = feedback_services.get_thread(thread_id)

        self.assertEqual(len(thread_summaries), 1)
        self.assertEqual(thread_summaries[0]['total_message_count'], 1)
        self.assertEqual(
            thread_summaries[0]['exploration_title'], self.EXP_TITLE_1)
        self.assertEqual(thread_summaries[0]['exploration_id'], self.EXP_ID_1)
        self.assertEqual(thread_summaries[0]['last_message_text'], 'some text')
        self.assertEqual(
            thread_summaries[0]['original_author_id'], self.owner_id)
        self.assertEqual(thread.subject, 'a subject')
        self.assertEqual(thread.entity_type, 'exploration')
        self.logout()

    def test_learner_dashboard_page(self):
        self.login(self.OWNER_EMAIL)

        response = self.get_html_response(feconf.LEARNER_DASHBOARD_URL)
        self.assertIn('{"title": "Learner Dashboard | Oppia"})', response.body)

        self.logout()


class LearnerDashboardFeedbackThreadHandlerTests(test_utils.GenericTestBase):

    EXP_ID_1 = '0'

    def setUp(self):
        super(LearnerDashboardFeedbackThreadHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        # Load exploration 0.
        exp_services.load_demo(self.EXP_ID_1)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        # Get the CSRF token and create a single thread with a single message.
        self.login(self.EDITOR_EMAIL)
        self.csrf_token = self.get_new_csrf_token()
        self.post_json('%s/%s' % (
            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1
        ), {
            'state_name': self._get_unicode_test_string('statename'),
            'subject': self._get_unicode_test_string('subject'),
            'text': 'a sample message',
        }, csrf_token=self.csrf_token)
        self.logout()

    def test_get_message_summaries(self):
        self.login(self.EDITOR_EMAIL)
        # Fetch all the feedback threads of that exploration.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1))

        # Get the id of the thread.
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']

        # Get the message summary of the thread.
        thread_url = '%s/%s' % (
            feconf.LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list']
        first_message = messages_summary[0]

        self.assertDictContainsSubset({
            'text': 'a sample message',
            'author_username': 'editor'
        }, first_message)

        # Add another message.
        thread_url = '%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        self.post_json(
            thread_url, {
                'updated_status': None,
                'updated_subject': None,
                'text': 'Message 1'
            }, csrf_token=self.csrf_token)

        # Again fetch the thread message summary.
        thread_url = '%s/%s' % (
            feconf.LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list']

        # Check the summary of the second message.
        self.assertEqual(len(messages_summary), 2)
        second_message = messages_summary[1]
        self.assertDictContainsSubset({
            'text': 'Message 1',
            'author_username': 'editor'
        }, second_message)

        self.logout()

    def test_anonymous_feedback_is_recorded_correctly(self):
        self.post_json(
            '/explorehandler/give_feedback/%s' % self.EXP_ID_1,
            {
                'feedback': 'This is an anonymous feedback message.',
            }
        )

        self.login(self.EDITOR_EMAIL)
        response_dict = self.get_json(
            '%s/%s' %
            (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1)
        )
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']

        # Get the message summary of the thread.
        thread_url = '%s/%s' % (
            feconf.LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list'][0]

        self.assertEqual(messages_summary['author_username'], None)
        self.assertEqual(messages_summary['author_picture_data_url'], None)

    def test_get_suggestions_after_updating_suggestion_summary(self):
        self.login(self.EDITOR_EMAIL)

        response_dict = self.get_json(
            '%s/%s' %
            (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1)
        )
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']
        thread_url = '%s/%s' % (
            feconf.LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list'][0]

        self.assertEqual(
            messages_summary['author_username'], self.EDITOR_USERNAME)
        self.assertTrue(test_utils.check_image_png_or_webp(
            messages_summary['author_picture_data_url']))
        self.assertFalse(messages_summary.get('suggestion_html'))
        self.assertFalse(messages_summary.get('current_content_html'))
        self.assertFalse(messages_summary.get('description'))

        new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        change_cmd = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Welcome!',
            'new_value': new_content
        }

        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, self.EXP_ID_1, 1,
            suggestion_models.STATUS_IN_REVIEW, self.editor_id, None,
            change_cmd, 'score category', thread_id)

        suggestion_thread = feedback_services.get_thread(thread_id)
        suggestion = suggestion_services.get_suggestion_by_id(thread_id)
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID_1)
        current_content_html = (
            exploration.states[
                suggestion.change.state_name].content.html)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list'][0]
        first_suggestion = feedback_services.get_messages(thread_id)[0]

        self.assertEqual(
            messages_summary['author_username'], self.EDITOR_USERNAME)
        self.assertTrue(test_utils.check_image_png_or_webp(
            messages_summary['author_picture_data_url']))
        self.assertEqual(
            utils.get_time_in_millisecs(first_suggestion.created_on),
            messages_summary['created_on_msecs'])
        self.assertEqual(
            messages_summary['suggestion_html'], '<p>new content html</p>')
        self.assertEqual(
            messages_summary['current_content_html'], current_content_html)
        self.assertEqual(
            messages_summary['description'], suggestion_thread.subject)
        self.logout()
