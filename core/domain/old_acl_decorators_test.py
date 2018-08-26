# coding: utf-8
#
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

from constants import constants
from core.controllers import base
from core.domain import acl_decorators
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils
import feconf

import webapp2
import webtest


class ViewFeedbackThreadTest(test_utils.GenericTestBase):
    """Tests for can_view_feedback_thread decorator."""
    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_view_feedback_thread
        def get(self, thread_id):
            self.render_json({'thread_id': thread_id})

    def setUp(self):
        super(ViewFeedbackThreadTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<thread_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)

        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_guest_can_view_feedback_threads_for_public_exploration(self):
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(self, 'testapp', self.mock_testapp):
                self.get_json(
                    '/mock/%s.thread1' % self.published_exp_id)

    def test_owner_cannot_view_feedback_for_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(self, 'testapp', self.mock_testapp):
                self.get_json(
                    '/mock/%s.thread1' % self.private_exp_id)
        self.logout()

    def test_moderator_can_view_feeback_for_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(self, 'testapp', self.mock_testapp):
                self.get_json(
                    '/mock/%s.thread1' % self.published_exp_id)
        self.logout()

    def test_admin_can_view_feeback_for_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(self, 'testapp', self.mock_testapp):
                self.get_json(
                    '/mock/%s.thread1' % self.private_exp_id)
        self.logout()


class CommentOnFeedbackThreadTest(test_utils.GenericTestBase):
    """Tests for can_comment_on_feedback_thread decorator."""
    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_comment_on_feedback_thread
        def get(self, thread_id):
            self.render_json({'thread_id': thread_id})

    def setUp(self):
        super(CommentOnFeedbackThreadTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<thread_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)

        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_guest_cannot_comment_on_feedback_threads_via_json_handler(self):
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(self, 'testapp', self.mock_testapp):
                self.get_json(
                    '/mock/%s.thread1' % self.private_exp_id,
                    expect_errors=True, expected_status_int=401)
                self.get_json(
                    '/mock/%s.thread1' % self.published_exp_id,
                    expect_errors=True, expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self):
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            with self.swap(
                self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
                feconf.HANDLER_TYPE_HTML):
                response = self.mock_testapp.get(
                    '/mock/exploration.%s.thread1' % self.private_exp_id,
                    expect_errors=True)
                self.assertEqual(response.status_int, 302)
                response = self.mock_testapp.get(
                    '/mock/exploration.%s.thread1' % self.published_exp_id,
                    expect_errors=True)
                self.assertEqual(response.status_int, 302)

    def test_owner_can_comment_on_feedback_for_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(self, 'testapp', self.mock_testapp):
                self.get_json(
                    '/mock/%s.thread1' % self.private_exp_id)
            self.logout()

    def test_moderator_can_comment_on_feeback_for_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(self, 'testapp', self.mock_testapp):
                self.get_json(
                    '/mock/%s.thread1' % self.published_exp_id)
            self.logout()

    def test_admin_can_comment_on_feeback_for_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(self, 'testapp', self.mock_testapp):
                self.get_json(
                    '/mock/%s.thread1' % self.private_exp_id)
            self.logout()
