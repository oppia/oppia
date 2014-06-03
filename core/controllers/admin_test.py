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

__author__ = 'Sean Lip'

from core.controllers import editor
from core.controllers import pages
from core.domain import config_domain

import test_utils


class AdminIntegrationTest(test_utils.GenericTestBase):

    def test_admin_page(self):
        """Test that the admin page shows the expected sections."""
        # Login as an admin.
        self.login('editor@example.com', is_super_admin=True)

        response = self.testapp.get('/admin')

        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Performance Counters',
            'Total processing time for all JSON responses',
            'Configuration',
            'Reload a single exploration',
            'counting.yaml')

        self.logout()

    def test_admin_page_rights(self):
        """Test access rights to the admin page."""

        response = self.testapp.get('/admin')
        self.assertEqual(response.status_int, 302)

        # Login as a non-admin.
        self.login('editor@example.com')
        response = self.testapp.get('/admin', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        # Login as an admin.
        self.login('admin@example.com', is_super_admin=True)
        response = self.testapp.get('/admin')
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_change_configuration_property(self):
        """Test that configuration properties can be changed."""

        # Login as an admin.
        self.login('admin@example.com', is_super_admin=True)

        ANNOUNCEMENT_TEXT = 'TEST ANNOUNCEMENT'

        response = self.testapp.get('/admin')
        csrf_token = self.get_csrf_token_from_response(response)

        response_dict = self.get_json('/adminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': ''
        }, response_config_properties[editor.EDITOR_PAGE_ANNOUNCEMENT.name])

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                editor.EDITOR_PAGE_ANNOUNCEMENT.name: ANNOUNCEMENT_TEXT
            }
        }
        self.post_json('/adminhandler', payload, csrf_token)

        response_dict = self.get_json('/adminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': ANNOUNCEMENT_TEXT
        }, response_config_properties[editor.EDITOR_PAGE_ANNOUNCEMENT.name])

        self.logout()

    def test_change_splash_page_config_property(self):
        """Test that the correct variables show up on the splash page."""
        ACTUAL_SITE_NAME = 'oppia.org'

        # Navigate to the splash page. The site name is not set.
        response = self.testapp.get('/')
        self.assertIn('SITE_NAME', response.body)
        self.assertNotIn(ACTUAL_SITE_NAME, response.body)

        # Log in as an admin and customize the site name.
        self.login('admin@example.com', is_super_admin=True)

        response = self.testapp.get('/admin')
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json('/adminhandler', {
            'action': 'save_config_properties',
            'new_config_property_values': {
                pages.SITE_NAME.name: ACTUAL_SITE_NAME
            }
        }, csrf_token)

        self.logout()

        # Navigate to the splash page. The site name is set.
        response = self.testapp.get('/')
        self.assertNotIn('SITE_NAME', response.body)
        self.assertIn(ACTUAL_SITE_NAME, response.body)

    def test_change_rights(self):
        """Test that the correct role indicators show up on app pages."""
        MODERATOR_EMAIL = 'moderator@example.com'
        ADMIN_EMAIL = 'admin@example.com'
        BOTH_MODERATOR_AND_ADMIN_EMAIL = 'moderator.and.admin@example.com'

        # Navigate to any page. The role is not set.
        response = self.testapp.get('/')
        response.mustcontain(no=['Moderator', 'Admin'])

        # Log in as a superadmin. The role is set.
        self.login('superadmin@example.com', is_super_admin=True)
        response = self.testapp.get('/')
        response.mustcontain('Admin', no=['Moderator'])

        # Add a moderator, an admin, and a person with both roles, then log
        # out.
        response = self.testapp.get('/admin')
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json('/adminhandler', {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.ADMIN_EMAILS.name: [
                    ADMIN_EMAIL, BOTH_MODERATOR_AND_ADMIN_EMAIL],
                config_domain.MODERATOR_EMAILS.name: [
                    MODERATOR_EMAIL, BOTH_MODERATOR_AND_ADMIN_EMAIL],
            }
        }, csrf_token)
        self.logout()

        # Log in as a moderator.
        self.login(MODERATOR_EMAIL)
        response = self.testapp.get('/learn')
        response.mustcontain('Moderator', no=['Admin'])
        self.logout()

        # Log in as an admin.
        self.login(ADMIN_EMAIL)
        response = self.testapp.get('/learn')
        response.mustcontain('Admin', no=['Moderator'])
        self.logout()

        # Log in as a both-moderator-and-admin.
        self.login(BOTH_MODERATOR_AND_ADMIN_EMAIL)
        response = self.testapp.get('/learn')
        response.mustcontain('Admin', no=['Moderator'])
        self.logout()

    def test_feedback_migration(self):
        """Test migration of feedback items."""
        from core.domain import exp_domain
        from core.domain import exp_services
        from core.domain import feedback_services
        from core.domain import stats_domain
        from core.domain import stats_services
        from core.platform import models
        import utils
        (feedback_models, stats_models) = models.Registry.import_models([
            models.NAMES.feedback, models.NAMES.statistics])

        self.OWNER_EMAIL = 'owner@example.com'
        self.OWNER_ID = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Create one exploration.
        EXP_ID = 'new_id'
        exp1 = exp_domain.Exploration.create_default_exploration(
            EXP_ID, 'New exploration', 'A category')
        exp_services.save_new_exploration(self.OWNER_ID, exp1)

        # Record 1 anonymous feedback, which will be marked fixed.
        stats_services.EventHandler.record_state_feedback_from_reader(
            EXP_ID, 'state abc', 'Fixed feedback 1 for new exploration', [],
            None)
        # Record 1 named feedback, which will be left open.
        stats_services.EventHandler.record_state_feedback_from_reader(
            EXP_ID, 'state def', 'New feedback 2 for new exploration',
            ['Initial state', 'state def'], 'user_id')

        feedback_items_for_abc = (
            stats_domain.FeedbackItem.get_feedback_items_for_state(
                EXP_ID, 'state abc'))
        self.assertEqual(len(feedback_items_for_abc), 1)
        feedback_id_1 = feedback_items_for_abc[0].id

        created_on_1 = (
            stats_models.FeedbackItemModel.get_new_feedback_items_for_target(
                'state:%s.%s' % (EXP_ID, 'state abc'))[0].created_on)
        created_on_2 = (
            stats_models.FeedbackItemModel.get_new_feedback_items_for_target(
                'state:%s.%s' % (EXP_ID, 'state def'))[0].created_on)

        # Owner fixes the first feedback.
        stats_services.EventHandler.resolve_feedback(feedback_id_1, 'fixed')

        # Load a demo exploration.
        exp_services.delete_demo('1')
        exp_services.load_demo('1')

        # Record 1 named feedback, which will be marked ignored.
        stats_services.EventHandler.record_state_feedback_from_reader(
            '1', 'state X', 'Ignored feedback 3 for demo exploration', [],
            'user_id')

        feedback_items_for_X = (
            stats_domain.FeedbackItem.get_feedback_items_for_state(
                '1', 'state X'))
        self.assertEqual(len(feedback_items_for_X), 1)
        feedback_id_3 = feedback_items_for_X[0].id

        created_on_3 = (
            stats_models.FeedbackItemModel.get_new_feedback_items_for_target(
                'state:%s.%s' % ('1', 'state X'))[0].created_on)

        # Owner ignores the third feedback.
        stats_services.EventHandler.resolve_feedback(
            feedback_id_3, 'will_not_fix')

        ### PERFORM MIGRATION ###

        # Log in as a superadmin. The role is set.
        self.login('superadmin@example.com', is_super_admin=True)
        response = self.testapp.get('/admin')
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json('/adminhandler', {
            'action': 'migrate_feedback'
        }, csrf_token)
        self.logout()

        ### CHECK RESULTS ###

        # Old datastore is cleared.
        self.assertEqual(len(
            stats_domain.FeedbackItem.get_feedback_items_for_state(
                EXP_ID, 'state abc')), 0)
        self.assertEqual(len(
            stats_domain.FeedbackItem.get_feedback_items_for_state(
                EXP_ID, 'state def')), 0)
        self.assertEqual(len(
            stats_domain.FeedbackItem.get_feedback_items_for_state(
                '1', 'state X')), 0)

        import time
        time.sleep(3)

        # New feedback threads and messages are in place, are all anonymized,
        # and have the correct text, status, 'created on' times and state
        # names.
        threadlist_for_new_exp = feedback_services.get_threadlist(EXP_ID)
        self.assertEqual(len(threadlist_for_new_exp), 2)
        threadlist_for_new_exp = sorted(
            threadlist_for_new_exp, key=lambda x: x['state_name'])
        thread_id_1 = threadlist_for_new_exp[0]['thread_id']
        self.assertDictContainsSubset({
            'original_author_username': None,
            'state_name': 'state abc',
            'status': 'fixed',
            'subject': 'Feedback from a learner',
            'summary': None,
        }, threadlist_for_new_exp[0])
        thread_id_2 = threadlist_for_new_exp[1]['thread_id']
        self.assertDictContainsSubset({
            'original_author_username': None,
            'state_name': 'state def',
            'status': 'open',
            'subject': 'Feedback from a learner',
            'summary': None,
        }, threadlist_for_new_exp[1])

        message_list_1 = feedback_services.get_messages(thread_id_1)
        self.assertEqual(len(message_list_1), 1)
        self.assertDictContainsSubset({
            'author_username': None,
            'created_on': utils.get_time_in_millisecs(created_on_1),
            'exploration_id': EXP_ID,
            'message_id': 0,
            'text': 'Fixed feedback 1 for new exploration',
            'updated_status': 'fixed',
            'updated_subject': 'Feedback from a learner',
        }, message_list_1[0])

        message_list_2 = feedback_services.get_messages(thread_id_2)
        self.assertEqual(len(message_list_2), 1)
        self.assertDictContainsSubset({
            'author_username': None,
            'created_on': utils.get_time_in_millisecs(created_on_2),
            'exploration_id': EXP_ID,
            'message_id': 0,
            'text': 'New feedback 2 for new exploration',
            'updated_status': 'open',
            'updated_subject': 'Feedback from a learner',
        }, message_list_2[0])

        threadlist_for_demo_exp = feedback_services.get_threadlist('1')
        self.assertEqual(len(threadlist_for_demo_exp), 1)
        thread_id_3 = threadlist_for_demo_exp[0]['thread_id']
        self.assertDictContainsSubset({
            'original_author_username': None,
            'state_name': 'state X',
            'status': 'ignored',
            'subject': 'Feedback from a learner',
            'summary': None,
        }, threadlist_for_demo_exp[0])

        message_list_3 = feedback_services.get_messages(thread_id_3)
        self.assertEqual(len(message_list_3), 1)
        self.assertDictContainsSubset({
            'author_username': None,
            'created_on': utils.get_time_in_millisecs(created_on_3),
            'exploration_id': '1',
            'message_id': 0,
            'text': 'Ignored feedback 3 for demo exploration',
            'updated_status': 'ignored',
            'updated_subject': 'Feedback from a learner',
        }, message_list_3[0])
