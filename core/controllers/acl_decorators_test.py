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

"""Tests for core.domain.acl_decorators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classifier_domain
from core.domain import classifier_services
from core.domain import feedback_services
from core.domain import question_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import skill_services
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf
import python_utils

import webapp2
import webtest


class PlayExplorationDecoratorTests(test_utils.GenericTestBase):
    """Tests for play exploration decorator."""

    user_email = 'user@example.com'
    username = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_play_exploration
        def get(self, exploration_id):
            return self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(PlayExplorationDecoratorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_exploration/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_can_not_access_exploration_with_disabled_exploration_ids(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_exploration/%s'
                % (feconf.DISABLED_EXPLORATION_IDS[0]), expected_status_int=404)

    def test_guest_can_access_published_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_exploration/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)

    def test_guest_cannot_access_private_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_exploration/%s' % self.private_exp_id,
                expected_status_int=404)

    def test_admin_can_access_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_owner_can_access_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_logged_in_user_cannot_access_not_owned_exploration(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_exploration/%s' % self.private_exp_id,
                expected_status_int=404)
        self.logout()


class PlayCollectionDecoratorTests(test_utils.GenericTestBase):
    """Tests for play collection decorator."""

    user_email = 'user@example.com'
    username = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'
    published_col_id = 'col_id_1'
    private_col_id = 'col_id_2'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_play_collection
        def get(self, collection_id):
            return self.render_json({'collection_id': collection_id})

    def setUp(self):
        super(PlayCollectionDecoratorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_collection/<collection_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        self.save_new_valid_collection(
            self.published_col_id, self.owner_id,
            exploration_id=self.published_col_id)
        self.save_new_valid_collection(
            self.private_col_id, self.owner_id,
            exploration_id=self.private_col_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)
        rights_manager.publish_collection(self.owner, self.published_col_id)

    def test_guest_can_access_published_collection(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_collection/%s' % self.published_col_id)
        self.assertEqual(response['collection_id'], self.published_col_id)

    def test_guest_cannot_access_private_collection(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_collection/%s' % self.private_col_id,
                expected_status_int=404)

    def test_admin_can_access_private_collection(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_owner_can_access_private_collection(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_logged_in_user_cannot_access_not_owned_private_collection(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_collection/%s' % self.private_col_id,
                expected_status_int=404)
        self.logout()

    def test_cannot_access_collection_with_invalid_collection_id(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_collection/invalid_collection_id',
                expected_status_int=404)
        self.logout()


class EditCollectionDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_edit_collection decorator."""

    user_email = 'user@example.com'
    username = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'
    published_col_id = 'col_id_1'
    private_col_id = 'col_id_2'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_edit_collection
        def get(self, collection_id):
            return self.render_json({'collection_id': collection_id})

    def setUp(self):
        super(EditCollectionDecoratorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_collection_editors([self.OWNER_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_edit_collection/<collection_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        self.save_new_valid_collection(
            self.published_col_id, self.owner_id,
            exploration_id=self.published_col_id)
        self.save_new_valid_collection(
            self.private_col_id, self.owner_id,
            exploration_id=self.private_col_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)
        rights_manager.publish_collection(self.owner, self.published_col_id)

    def test_can_not_edit_collection_with_invalid_collection_id(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_collection/invalid_col_id', expected_status_int=404)
        self.logout()

    def test_guest_cannot_edit_collection_via_json_handler(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_collection/%s' % self.published_col_id,
                expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self):
        with self.swap(
            self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
            feconf.HANDLER_TYPE_HTML):
            response = self.mock_testapp.get(
                '/mock_edit_collection/%s' % self.published_col_id,
                expect_errors=True)
        self.assertEqual(response.status_int, 302)

    def test_normal_user_cannot_edit_collection(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_collection/%s' % self.private_col_id,
                expected_status_int=401)
        self.logout()

    def test_owner_can_edit_owned_collection(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_moderator_cannot_edit_private_collection(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_collection/%s' % self.private_col_id,
                expected_status_int=401)
        self.logout()

    def test_moderator_can_edit_public_collection(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_collection/%s' % self.published_col_id)
        self.assertEqual(response['collection_id'], self.published_col_id)
        self.logout()

    def test_admin_can_edit_any_private_collection(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()


class CreateExplorationDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_create_exploration decorator."""

    username = 'banneduser'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_create_exploration
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(CreateExplorationDecoratorTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.set_banned_users([self.username])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/create', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_create_exploration(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/create', expected_status_int=401)
        self.logout()

    def test_normal_user_can_create_exploration(self):
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/create')
        self.assertEqual(response['success'], True)
        self.logout()

    def test_guest_cannot_create_exploration_via_json_handler(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/create', expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self):
        with self.swap(
            self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
            feconf.HANDLER_TYPE_HTML):
            response = self.mock_testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 302)


class CreateCollectionDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_create_collection decorator."""

    username = 'collectioneditor'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_create_collection
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(CreateCollectionDecoratorTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_collection_editors([self.username])
        self.set_admins([self.ADMIN_USERNAME])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/create', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_create_collection_via_json_handler(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/create', expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self):
        with self.swap(
            self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
            feconf.HANDLER_TYPE_HTML):
            response = self.mock_testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 302)

    def test_normal_user_cannot_create_collection(self):
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/create', expected_status_int=401)
        self.logout()

    def test_collection_editor_can_create_collection(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/create')
        self.assertEqual(response['success'], True)
        self.logout()

    def test_admins_can_create_collection(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/create')
        self.assertEqual(response['success'], True)
        self.logout()


class AccessCreatorDashboardTests(test_utils.GenericTestBase):
    """Tests for can_access_creator_dashboard decorator."""

    username = 'banneduser'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_access_creator_dashboard
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(AccessCreatorDashboardTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.set_banned_users([self.username])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/access', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_access_editor_dashboard(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/access', expected_status_int=401)
        self.logout()

    def test_normal_user_can_access_editor_dashboard(self):
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/access')
        self.assertEqual(response['success'], True)


class CommentOnFeedbackThreadTests(test_utils.GenericTestBase):
    """Tests for can_comment_on_feedback_thread decorator."""

    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_comment_on_feedback_thread
        def get(self, thread_id):
            self.render_json({'thread_id': thread_id})

    def setUp(self):
        super(CommentOnFeedbackThreadTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_comment_on_feedback_thread/<thread_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)

        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_can_not_comment_on_feedback_threads_with_disabled_exp_id(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % feconf.DISABLED_EXPLORATION_IDS[0],
                expected_status_int=404)
        self.logout()

    def test_viewer_cannot_comment_on_feedback_for_private_exploration(self):
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % self.private_exp_id, expected_status_int=401)
            self.assertEqual(
                response['error'], 'You do not have credentials to comment on '
                'exploration feedback.')
        self.logout()

    def test_can_not_comment_on_feedback_threads_with_invalid_thread_id(self):
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_comment_on_feedback_thread/invalid_thread_id',
                expected_status_int=400)
            self.assertEqual(response['error'], 'Thread ID must contain a .')
        self.logout()

    def test_guest_cannot_comment_on_feedback_threads_via_json_handler(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.private_exp_id), expected_status_int=401)
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.published_exp_id), expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self):
        with self.swap(
            self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
            feconf.HANDLER_TYPE_HTML):
            response = self.mock_testapp.get(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.private_exp_id), expect_errors=True)
            self.assertEqual(response.status_int, 302)
            response = self.mock_testapp.get(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.published_exp_id), expect_errors=True)
            self.assertEqual(response.status_int, 302)

    def test_owner_can_comment_on_feedback_for_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.private_exp_id))
        self.logout()

    def test_moderator_can_comment_on_feeback_for_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.published_exp_id))
        self.logout()

    def test_admin_can_comment_on_feeback_for_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.private_exp_id))
        self.logout()


class CreateFeedbackThreadTests(test_utils.GenericTestBase):
    """Tests for can_create_feedback_thread decorator."""

    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_create_feedback_thread
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(CreateFeedbackThreadTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_create_feedback_thread/<exploration_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)

        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_can_not_create_feedback_threads_with_disabled_exp_id(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_create_feedback_thread/%s'
                % (feconf.DISABLED_EXPLORATION_IDS[0]), expected_status_int=404)

    def test_viewer_cannot_create_feedback_for_private_exploration(self):
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_create_feedback_thread/%s' % self.private_exp_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'], 'You do not have credentials to create '
                'exploration feedback.')
        self.logout()

    def test_guest_can_create_feedback_threads_for_public_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_create_feedback_thread/%s' % self.published_exp_id)

    def test_owner_cannot_create_feedback_for_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_create_feedback_thread/%s' % self.private_exp_id)
        self.logout()

    def test_moderator_can_create_feeback_for_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_create_feedback_thread/%s' % self.published_exp_id)
        self.logout()

    def test_admin_can_create_feeback_for_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_create_feedback_thread/%s' % self.private_exp_id)
        self.logout()


class ViewFeedbackThreadTests(test_utils.GenericTestBase):
    """Tests for can_view_feedback_thread decorator."""

    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_view_feedback_thread
        def get(self, thread_id):
            self.render_json({'thread_id': thread_id})

    def setUp(self):
        super(ViewFeedbackThreadTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_view_feedback_thread/<thread_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        self.public_exp_thread_id = feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION, self.published_exp_id,
            self.owner_id, 'public exp', 'some text')
        self.private_exp_thread_id = feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION, self.private_exp_id, self.owner_id,
            'private exp', 'some text')
        self.disabled_exp_thread_id = feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION, feconf.DISABLED_EXPLORATION_IDS[0],
            self.owner_id, 'disabled exp', 'some text')

        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_can_not_view_feedback_threads_with_disabled_exp_id(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_feedback_thread/%s' % self.disabled_exp_thread_id,
                expected_status_int=404)

    def test_viewer_cannot_view_feedback_for_private_exploration(self):
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_feedback_thread/%s' % self.private_exp_thread_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'], 'You do not have credentials to view '
                'exploration feedback.')
        self.logout()

    def test_viewer_can_view_non_exploration_related_feedback(self):
        self.login(self.viewer_email)
        skill_thread_id = feedback_services.create_thread(
            'skill', 'skillid1', None, 'unused subject', 'unused text')
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_view_feedback_thread/%s' % skill_thread_id)

    def test_guest_can_view_feedback_threads_for_public_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_feedback_thread/%s' % self.public_exp_thread_id)

    def test_owner_cannot_view_feedback_for_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_feedback_thread/%s' % self.private_exp_thread_id)
        self.logout()

    def test_moderator_can_view_feeback_for_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_feedback_thread/%s' % self.public_exp_thread_id)
        self.logout()

    def test_admin_can_view_feeback_for_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_feedback_thread/%s' % self.private_exp_thread_id)
        self.logout()


class ManageEmailDashboardTests(test_utils.GenericTestBase):
    """Tests for can_manage_email_dashboard decorator."""

    query_id = 'query_id'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_manage_email_dashboard
        def get(self):
            return self.render_json({'success': 1})

        @acl_decorators.can_manage_email_dashboard
        def put(self, query_id):
            return self.render_json({'query_id': query_id})

    def setUp(self):

        super(ManageEmailDashboardTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [
                webapp2.Route('/mock/', self.MockHandler),
                webapp2.Route('/mock/<query_id>', self.MockHandler)
            ],
            debug=feconf.DEBUG,
        ))

    def test_moderator_cannot_access_email_dashboard(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_admin_can_access_email_dashboard(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.mock_testapp.put('/mock/%s' % self.query_id)
        self.assertEqual(response.status_int, 200)
        self.logout()


class RateExplorationTests(test_utils.GenericTestBase):
    """Tests for can_rate_exploration decorator."""

    username = 'user'
    user_email = 'user@example.com'
    exp_id = 'exp_id'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_rate_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(RateExplorationTests, self).setUp()
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_give_rating(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.exp_id, expected_status_int=401)

    def test_normal_user_can_give_rating(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.exp_id)
        self.assertEqual(response['exploration_id'], self.exp_id)
        self.logout()


class AccessModeratorPageTests(test_utils.GenericTestBase):
    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_access_moderator_page
        def get(self):
            return self.render_json({'success': 1})

    def setUp(self):
        super(AccessModeratorPageTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.set_admins([self.ADMIN_USERNAME])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_access_moderator_page(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_admin_can_access_moderator_page(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()


class FlagExplorationTests(test_utils.GenericTestBase):
    """Tests for can_flag_exploration decorator."""

    username = 'user'
    user_email = 'user@example.com'
    exp_id = 'exp_id'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_flag_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(FlagExplorationTests, self).setUp()
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_flag_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.exp_id, expected_status_int=401)

    def test_normal_user_can_flag_exploration(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.exp_id)
        self.assertEqual(response['exploration_id'], self.exp_id)
        self.logout()


class SubscriptionToUsersTests(test_utils.GenericTestBase):
    """Tests for can_subscribe_to_users decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_subscribe_to_users
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(SubscriptionToUsersTests, self).setUp()
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_subscribe_to_users(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)

    def test_normal_user_can_subscribe_to_users(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], True)
        self.logout()


class SendModeratorEmailsTests(test_utils.GenericTestBase):

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_send_moderator_emails
        def get(self):
            return self.render_json({'success': 1})

    def setUp(self):
        super(SendModeratorEmailsTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.set_admins([self.ADMIN_USERNAME])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_send_moderator_emails(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_admin_can_send_moderator_emails(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()


class VoiceoverExplorationTests(test_utils.GenericTestBase):
    """Tests for can_voiceover_exploration decorator."""

    role = rights_domain.ROLE_VOICE_ARTIST
    username = 'user'
    user_email = 'user@example.com'
    banned_username = 'banneduser'
    banned_user_email = 'banneduser@example.com'
    published_exp_id_1 = 'exp_1'
    published_exp_id_2 = 'exp_2'
    private_exp_id_1 = 'exp_3'
    private_exp_id_2 = 'exp_4'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_voiceover_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(VoiceoverExplorationTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.signup(self.banned_user_email, self.banned_username)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.set_banned_users([self.banned_username])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id_1, self.owner_id)
        self.save_new_valid_exploration(
            self.published_exp_id_2, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id_1, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id_2, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id_1)
        rights_manager.publish_exploration(self.owner, self.published_exp_id_2)

        rights_manager.assign_role_for_exploration(
            self.owner, self.published_exp_id_1, self.voice_artist_id,
            self.role)
        rights_manager.assign_role_for_exploration(
            self.owner, self.private_exp_id_1, self.voice_artist_id, self.role)

    def test_banned_user_cannot_voiceover_exploration(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)
        self.logout()

    def test_owner_can_voiceover_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_moderator_can_voiceover_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id_1)
        self.assertEqual(response['exploration_id'], self.published_exp_id_1)
        self.logout()

    def test_moderator_cannot_voiceover_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)
        self.logout()

    def test_admin_can_voiceover_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_voice_artist_can_only_voiceover_assigned_public_exploration(self):
        self.login(self.VOICE_ARTIST_EMAIL)
        # Checking voice artist can voiceover assigned public exploration.
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id_1)
        self.assertEqual(response['exploration_id'], self.published_exp_id_1)

        # Checking voice artist cannot voiceover public exploration which he/she
        # is not assigned for.
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.published_exp_id_2, expected_status_int=401)
        self.logout()

    def test_voice_artist_can_only_voiceover_assigned_private_exploration(self):
        self.login(self.VOICE_ARTIST_EMAIL)
        # Checking voice artist can voiceover assigned private exploration.
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)

        # Checking voice artist cannot voiceover private exploration which
        # he/she is not assigned for.
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_2, expected_status_int=401)
        self.logout()

    def test_user_without_voice_artist_role_of_exploration_cannot_voiceover_public_exploration(self): # pylint: disable=line-too-long
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.published_exp_id_1, expected_status_int=401)
        self.logout()

    def test_user_without_voice_artist_role_of_exploration_cannot_voiceover_private_exploration(self): # pylint: disable=line-too-long
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)
        self.logout()


class EditExplorationTests(test_utils.GenericTestBase):
    """Tests for can_edit_exploration decorator."""

    username = 'banneduser'
    user_email = 'user@example.com'
    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_edit_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(EditExplorationTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.set_banned_users([self.username])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_edit_exploration/<exploration_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_can_not_edit_exploration_with_invalid_exp_id(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_exploration/invalid_exp_id',
                expected_status_int=404)
        self.logout()

    def test_banned_user_cannot_edit_exploration(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_exploration/%s' % self.private_exp_id,
                expected_status_int=401)
        self.logout()

    def test_owner_can_edit_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_moderator_can_edit_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_exploration/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)
        self.logout()

    def test_moderator_cannot_edit_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_exploration/%s' % self.private_exp_id,
                expected_status_int=401)
        self.logout()

    def test_admin_can_edit_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()


class ManageOwnAccountTests(test_utils.GenericTestBase):
    """Tests for decorator can_manage_own_account."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'
    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_manage_own_account
        def get(self):
            return self.render_json({'success': 1})

    def setUp(self):
        super(ManageOwnAccountTests, self).setUp()
        self.signup(self.banned_user_email, self.banned_user)
        self.signup(self.user_email, self.username)
        self.set_banned_users([self.banned_user])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_update_preferences(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_normal_user_can_manage_preferences(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()


class UploadExplorationTests(test_utils.GenericTestBase):
    """Tests for can_upload_exploration decorator."""

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_upload_exploration
        def get(self):
            return self.render_json({})

    def setUp(self):
        super(UploadExplorationTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_upload_exploration/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_super_admin_can_upload_explorations(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_upload_exploration/')
        self.logout()

    def test_normal_user_cannot_upload_explorations(self):
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_upload_exploration/', expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You do not have credentials to upload explorations.')
        self.logout()

    def test_guest_cannot_upload_explorations(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_upload_exploration/', expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')


class DeleteExplorationTests(test_utils.GenericTestBase):
    """Tests for can_delete_exploration decorator."""

    private_exp_id = 'exp_0'
    published_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_delete_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(DeleteExplorationTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_delete_exploration/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_guest_can_not_delete_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_exploration/%s' % self.private_exp_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_owner_can_delete_owned_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_moderator_can_delete_published_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_exploration/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)
        self.logout()

    def test_owner_cannot_delete_published_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_exploration/%s' % self.published_exp_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'],
                'User %s does not have permissions to delete exploration %s'
                % (self.owner_id, self.published_exp_id))
        self.logout()

    def test_moderator_cannot_delete_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_exploration/%s' % self.private_exp_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'],
                'User %s does not have permissions to delete exploration %s'
                % (self.moderator_id, self.private_exp_id))
        self.logout()


class SuggestChangesToExplorationTests(test_utils.GenericTestBase):
    """Tests for can_suggest_changes_to_exploration decorator."""

    username = 'user'
    user_email = 'user@example.com'
    banned_username = 'banneduser'
    banned_user_email = 'banned@example.com'
    exploration_id = 'exp_id'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_suggest_changes_to_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(SuggestChangesToExplorationTests, self).setUp()
        self.signup(self.user_email, self.username)
        self.signup(self.banned_user_email, self.banned_username)
        self.set_banned_users([self.banned_username])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_suggest_changes(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.exploration_id, expected_status_int=401)
        self.logout()

    def test_normal_user_can_suggest_changes(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.exploration_id)
        self.assertEqual(response['exploration_id'], self.exploration_id)
        self.logout()


class SuggestChangesDecoratorsTests(test_utils.GenericTestBase):
    """Tests for can_suggest_changes decorator."""

    username = 'user'
    user_email = 'user@example.com'
    banned_username = 'banneduser'
    banned_user_email = 'banned@example.com'
    exploration_id = 'exp_id'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_suggest_changes
        def get(self):
            self.render_json({})

    def setUp(self):
        super(SuggestChangesDecoratorsTests, self).setUp()
        self.signup(self.user_email, self.username)
        self.signup(self.banned_user_email, self.banned_username)
        self.set_banned_users([self.banned_username])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_suggest_changes(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock', expected_status_int=401)
        self.logout()

    def test_normal_user_can_suggest_changes(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock')
        self.logout()


class ResubmitSuggestionDecoratorsTests(test_utils.GenericTestBase):
    """Tests for can_resubmit_suggestion decorator."""

    owner_username = 'owner'
    owner_email = 'owner@example.com'
    author_username = 'author'
    author_email = 'author@example.com'
    username = 'user'
    user_email = 'user@example.com'
    TARGET_TYPE = 'exploration'
    SUGGESTION_TYPE = 'edit_exploration_state_content'
    exploration_id = 'exp_id'
    target_version_id = 1
    change_dict = {
        'cmd': 'edit_state_property',
        'property_name': 'content',
        'state_name': 'Introduction',
        'new_value': ''
    }

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_resubmit_suggestion
        def get(self, suggestion_id):
            self.render_json({'suggestion_id': suggestion_id})

    def setUp(self):
        super(ResubmitSuggestionDecoratorsTests, self).setUp()
        self.signup(self.author_email, self.author_username)
        self.signup(self.user_email, self.username)
        self.signup(self.owner_email, self.owner_username)
        self.author_id = self.get_user_id_from_email(self.author_email)
        self.owner_id = self.get_user_id_from_email(self.owner_email)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<suggestion_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_default_exploration(self.exploration_id, self.owner_id)
        suggestion_services.create_suggestion(
            self.SUGGESTION_TYPE, self.TARGET_TYPE,
            self.exploration_id, self.target_version_id,
            self.author_id,
            self.change_dict, '')
        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id),
             ('target_id', self.exploration_id)])[0]
        self.suggestion_id = suggestion.suggestion_id

    def test_author_can_resubmit_suggestion(self):
        self.login(self.author_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.suggestion_id)
        self.assertEqual(response['suggestion_id'], self.suggestion_id)
        self.logout()

    def test_non_author_cannot_resubmit_suggestion(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.suggestion_id, expected_status_int=401)
        self.logout()


class DecoratorForAcceptingSuggestionTests(test_utils.GenericTestBase):
    """Tests for get_decorator_for_accepting_suggestion decorator."""

    AUTHOR_USERNAME = 'author'
    AUTHOR_EMAIL = 'author@example.com'
    VIEWER_USERNAME = 'user'
    VIEWER_EMAIL = 'user@example.com'
    TARGET_TYPE = 'exploration'
    SUGGESTION_TYPE = 'edit_exploration_state_content'
    EXPLORATION_ID = 'exp_id'
    TARGET_VERSION_ID = 1
    CHANGE_DICT = {
        'cmd': 'edit_state_property',
        'property_name': 'content',
        'state_name': 'Introduction',
        'new_value': ''
    }

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.get_decorator_for_accepting_suggestion(
            acl_decorators.can_edit_exploration)
        def get(self, target_id, suggestion_id):
            self.render_json({
                'target_id': target_id,
                'suggestion_id': suggestion_id
            })

    def setUp(self):
        super(DecoratorForAcceptingSuggestionTests, self).setUp()
        self.signup(self.AUTHOR_EMAIL, self.AUTHOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_accept_suggestion/<target_id>/<suggestion_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_default_exploration(self.EXPLORATION_ID, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.EXPLORATION_ID)
        suggestion_services.create_suggestion(
            self.SUGGESTION_TYPE, self.TARGET_TYPE,
            self.EXPLORATION_ID, self.TARGET_VERSION_ID,
            self.author_id,
            self.CHANGE_DICT, '')
        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id),
             ('target_id', self.EXPLORATION_ID)])[0]
        self.suggestion_id = suggestion.suggestion_id

    def test_guest_cannot_accept_suggestion(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, self.suggestion_id),
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_owner_can_accept_suggestion(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, self.suggestion_id))
        self.assertEqual(response['suggestion_id'], self.suggestion_id)
        self.assertEqual(response['target_id'], self.EXPLORATION_ID)
        self.logout()

    def test_viewer_cannot_accept_suggestion(self):
        self.login(self.VIEWER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, self.suggestion_id),
                expected_status_int=401)
        self.logout()


class PublishExplorationTests(test_utils.GenericTestBase):
    """Tests for can_publish_exploration decorator."""

    private_exp_id = 'exp_0'
    public_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_publish_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(PublishExplorationTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_publish_exploration/<exploration_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.public_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.public_exp_id)

    def test_cannot_publish_exploration_with_invalid_exp_id(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_publish_exploration/invalid_exp_id',
                expected_status_int=404)
        self.logout()

    def test_owner_can_publish_owned_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_publish_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_already_published_exploration_cannot_be_published(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_publish_exploration/%s' % self.public_exp_id,
                expected_status_int=401)
        self.logout()

    def test_moderator_cannot_publish_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_publish_exploration/%s' % self.private_exp_id,
                expected_status_int=401)
        self.logout()

    def test_admin_can_publish_any_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_publish_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)


class ModifyExplorationRolesTests(test_utils.GenericTestBase):
    """Tests for can_modify_exploration_roles decorator."""

    private_exp_id = 'exp_0'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_modify_exploration_roles
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(ModifyExplorationRolesTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)

    def test_owner_can_modify_exploration_roles(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_moderator_cannot_modify_roles_of_unowned_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id, expected_status_int=401)
        self.logout()

    def test_admin_can_modify_roles_of_any_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()


class CollectionPublishStatusTests(test_utils.GenericTestBase):
    """Tests can_publish_collection and can_unpublish_collection decorators."""

    user_email = 'user@example.com'
    username = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'
    published_col_id = 'col_id_1'
    private_col_id = 'col_id_2'

    class MockPublishHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_publish_collection
        def get(self, collection_id):
            return self.render_json({'collection_id': collection_id})

    class MockUnpublishHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_unpublish_collection
        def get(self, collection_id):
            return self.render_json({'collection_id': collection_id})

    def setUp(self):
        super(CollectionPublishStatusTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_collection_editors([self.OWNER_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [
                webapp2.Route(
                    '/mock_publish_collection/<collection_id>',
                    self.MockPublishHandler),
                webapp2.Route(
                    '/mock_unpublish_collection/<collection_id>',
                    self.MockUnpublishHandler)
            ],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        self.save_new_valid_collection(
            self.published_col_id, self.owner_id,
            exploration_id=self.published_col_id)
        self.save_new_valid_collection(
            self.private_col_id, self.owner_id,
            exploration_id=self.private_col_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)
        rights_manager.publish_collection(self.owner, self.published_col_id)

    def test_cannot_publish_collection_with_invalid_exp_id(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_publish_collection/invalid_col_id',
                expected_status_int=404)
        self.logout()

    def test_cannot_unpublish_collection_with_invalid_exp_id(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_unpublish_collection/invalid_col_id',
                expected_status_int=404)
        self.logout()

    def test_owner_can_publish_collection(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_publish_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_owner_cannot_unpublish_public_collection(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_unpublish_collection/%s' % self.published_col_id,
                expected_status_int=401)
        self.logout()

    def test_moderator_can_unpublish_public_collection(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_unpublish_collection/%s' % self.published_col_id)
        self.assertEqual(response['collection_id'], self.published_col_id)
        self.logout()

    def test_admin_can_publish_any_collection(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_publish_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_admin_cannot_publish_already_published_collection(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_publish_collection/%s' % self.published_col_id,
                expected_status_int=401)
        self.logout()


class AccessLearnerDashboardDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_access_learner_dashboard."""

    user = 'user'
    user_email = 'user@example.com'
    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_access_learner_dashboard
        def get(self):
            return self.render_json({})

    def setUp(self):
        super(AccessLearnerDashboardDecoratorTests, self).setUp()
        self.signup(self.user_email, self.user)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_banned_users([self.banned_user])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_is_redirected(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_exploration_editor_can_access_learner_dashboard(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/')
        self.logout()


class EditTopicDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_edit_topic."""

    manager_username = 'topicmanager'
    manager_email = 'topicmanager@example.com'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    topic_id = 'topic_1'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_edit_topic
        def get(self, topic_id):
            self.render_json({'topic_id': topic_id})

    def setUp(self):
        super(EditTopicDecoratorTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.manager_email, self.manager_username)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([self.manager_username])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.manager_id = self.get_user_id_from_email(self.manager_email)
        self.viewer_id = self.get_user_id_from_email(self.viewer_email)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.manager = user_services.UserActionsInfo(self.manager_id)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_edit_topic/<topic_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.viewer_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)
        topic_services.assign_role(
            self.admin, self.manager, topic_domain.ROLE_MANAGER, self.topic_id)

    def test_can_not_edit_topic_with_invalid_topic_id(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_topic/invalid_topic_id', expected_status_int=404)
        self.logout()

    def test_admin_can_edit_topic(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_topic/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_topic_manager_can_edit_topic(self):
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_topic/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_normal_user_cannot_edit_topic(self):
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_topic/%s' % self.topic_id, expected_status_int=401)
        self.logout()


class EditStoryDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_edit_story."""

    manager_username = 'topicmanager'
    manager_email = 'topicmanager@example.com'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_edit_story
        def get(self, story_id):
            self.render_json({'story_id': story_id})

    def setUp(self):
        super(EditStoryDecoratorTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_edit_story/<story_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.story_id = story_services.get_new_story_id()
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_story(self.story_id, self.admin_id, self.topic_id)
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[self.story_id],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)

    def test_can_not_edit_story_with_invalid_story_id(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_story/story_id_new', expected_status_int=404)
        self.logout()

    def test_can_not_edit_story_with_invalid_topic_id(self):
        self.login(self.ADMIN_EMAIL)
        story_id = story_services.get_new_story_id()
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_story(story_id, self.admin_id, topic_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_story/%s' % story_id, expected_status_int=404)
        self.logout()

    def test_admin_can_edit_story(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_story/%s' % self.story_id)
        self.assertEqual(response['story_id'], self.story_id)
        self.logout()

    def test_topic_manager_can_edit_story(self):
        self.signup(self.manager_email, self.manager_username)
        self.set_topic_managers([self.manager_username])
        manager_id = self.get_user_id_from_email(self.manager_email)
        manager = user_services.UserActionsInfo(manager_id)
        topic_services.assign_role(
            self.admin, manager, topic_domain.ROLE_MANAGER, self.topic_id)

        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_story/%s' % self.story_id)
        self.assertEqual(response['story_id'], self.story_id)
        self.logout()

    def test_normal_user_cannot_edit_story(self):
        self.signup(self.viewer_email, self.viewer_username)

        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_story/%s' % self.story_id, expected_status_int=401)
        self.logout()


class AddStoryToTopicTests(test_utils.GenericTestBase):
    """Tests for decorator can_add_new_story_to_topic."""

    manager_username = 'topicmanager'
    manager_email = 'topicmanager@example.com'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    topic_id = 'topic_1'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_add_new_story_to_topic
        def get(self, topic_id):
            self.render_json({'topic_id': topic_id})

    def setUp(self):
        super(AddStoryToTopicTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.manager_email, self.manager_username)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([self.manager_username])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.manager_id = self.get_user_id_from_email(self.manager_email)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.manager = user_services.UserActionsInfo(self.manager_id)
        self.viewer_id = self.get_user_id_from_email(self.viewer_email)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_add_story_to_topic/<topic_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.viewer_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)
        topic_services.assign_role(
            self.admin, self.manager, topic_domain.ROLE_MANAGER, self.topic_id)

    def test_can_not_add_story_to_topic_with_invalid_topic_id(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_add_story_to_topic/invalid_topic_id',
                expected_status_int=404)
        self.logout()

    def test_admin_can_add_story_to_topic(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_add_story_to_topic/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_topic_manager_cannot_add_story_to_topic_with_invalid_topic_id(
            self):
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_add_story_to_topic/incorrect_id',
                expected_status_int=404)
        self.logout()

    def test_topic_manager_can_add_story_to_topic(self):
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_add_story_to_topic/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_normal_user_cannot_add_story_to_topic(self):
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_add_story_to_topic/%s' % self.topic_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have credentials to add a story to this topic.')
        self.logout()

    def test_guest_cannot_add_story_to_topic(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_add_story_to_topic/%s' % self.topic_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')


class StoryViewerTests(test_utils.GenericTestBase):
    """Tests for decorator can_access_story_viewer_page."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockDataHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_access_story_viewer_page
        def get(self, story_url_fragment):
            self.render_json({'story_url_fragment': story_url_fragment})

    class MockPageHandler(base.BaseHandler):
        @acl_decorators.can_access_story_viewer_page
        def get(self, _):
            self.render_template('story-viewer-page.mainpage.html')

    def setUp(self):
        super(StoryViewerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_banned_users([self.banned_user])
        story_data_url = (
            '/mock_story_data/<classroom_url_fragment>/'
            '<topic_url_fragment>/<story_url_fragment>')
        story_page_url = (
            '/mock_story_page/<classroom_url_fragment>/'
            '<topic_url_fragment>/story/<story_url_fragment>')
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [
                webapp2.Route(story_data_url, self.MockDataHandler),
                webapp2.Route(story_page_url, self.MockPageHandler)
            ],
            debug=feconf.DEBUG,
        ))

        self.topic_id = topic_fetchers.get_new_topic_id()
        self.story_id = story_services.get_new_story_id()
        self.story_url_fragment = 'story-frag'
        self.save_new_story(
            self.story_id, self.admin_id, self.topic_id,
            url_fragment=self.story_url_fragment)
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[self.story_id],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1], next_subtopic_id=2)

    def test_cannot_access_non_existent_story(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_story_data/staging/topic/non-existent-frag',
                expected_status_int=404)

    def test_cannot_access_story_when_topic_is_not_published(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_story_data/staging/topic/%s'
                % self.story_url_fragment,
                expected_status_int=404)

    def test_cannot_access_story_when_story_is_not_published(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_story_data/staging/topic/%s'
                % self.story_url_fragment,
                expected_status_int=404)

    def test_can_access_story_when_story_and_topic_are_published(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_story_data/staging/topic/%s'
                % self.story_url_fragment,
                expected_status_int=200)

    def test_can_access_story_when_all_url_fragments_are_valid(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_html_response(
                '/mock_story_page/staging/topic/story/%s'
                % self.story_url_fragment,
                expected_status_int=200)

    def test_redirect_to_story_page_if_story_url_fragment_is_invalid(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_story_page/staging/topic/story/000',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic/story',
                response.headers['location'])

    def test_redirect_to_correct_url_if_abbreviated_topic_is_invalid(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_story_page/staging/invalid-topic/story/%s'
                % self.story_url_fragment,
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic/story/%s'
                % self.story_url_fragment,
                response.headers['location'])

    def test_redirect_with_correct_classroom_name_in_url(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_story_page/math/topic/story/%s'
                % self.story_url_fragment,
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic/story/%s'
                % self.story_url_fragment,
                response.headers['location'])

    def test_redirect_lowercase_story_url_fragment(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_story_page/staging/topic/story/Story-frag',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic/story/story-frag',
                response.headers['location'])


class SubtopicViewerTests(test_utils.GenericTestBase):
    """Tests for decorator can_access_subtopic_viewer_page."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockDataHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_access_subtopic_viewer_page
        def get(self, unused_topic_url_fragment, subtopic_url_fragment):
            self.render_json({'subtopic_url_fragment': subtopic_url_fragment})

    class MockPageHandler(base.BaseHandler):
        @acl_decorators.can_access_subtopic_viewer_page
        def get(self, unused_topic_url_fragment, unused_subtopic_url_fragment):
            self.render_template('subtopic-viewer-page.mainpage.html')

    def setUp(self):
        super(SubtopicViewerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_banned_users([self.banned_user])
        subtopic_data_url = (
            '/mock_subtopic_data/<classroom_url_fragment>/'
            '<topic_url_fragment>/<subtopic_url_fragment>')
        subtopic_page_url = (
            '/mock_subtopic_page/<classroom_url_fragment>/'
            '<topic_url_fragment>/revision/<subtopic_url_fragment>')
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [
                webapp2.Route(subtopic_data_url, self.MockDataHandler),
                webapp2.Route(subtopic_page_url, self.MockPageHandler)
            ],
            debug=feconf.DEBUG,
        ))

        self.topic_id = topic_fetchers.get_new_topic_id()
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        subtopic_2 = topic_domain.Subtopic.create_default_subtopic(
            2, 'Subtopic Title 2')
        subtopic_2.skill_ids = ['skill_id_2']
        subtopic_2.url_fragment = 'sub-two-frag'
        self.subtopic_page_1 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.topic_id))
        subtopic_page_services.save_subtopic_page(
            self.admin_id, self.subtopic_page_1, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        self.save_new_topic(
            self.topic_id, self.admin_id, name='topic name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1, subtopic_2], next_subtopic_id=3,
            url_fragment='topic-frag')

    def test_cannot_access_non_existent_subtopic(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_subtopic_data/staging/topic-frag/non-existent-frag',
                expected_status_int=404)

    def test_cannot_access_subtopic_when_topic_is_not_published(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_subtopic_data/staging/topic-frag/sub-one-frag',
                expected_status_int=404)

    def test_can_access_subtopic_when_topic_is_published(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_subtopic_data/staging/topic-frag/sub-one-frag',
                expected_status_int=200)

    def test_can_access_subtopic_when_all_url_fragments_are_valid(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_html_response(
                '/mock_subtopic_page/staging/topic-frag/revision/sub-one-frag',
                expected_status_int=200)

    def test_fall_back_to_revision_page_if_subtopic_url_frag_is_invalid(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_subtopic_page/staging/topic-frag/revision/000',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic-frag/revision',
                response.headers['location'])

    def test_redirect_to_classroom_if_abbreviated_topic_is_invalid(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_subtopic_page/math/invalid-topic/revision/sub-one-frag',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/math',
                response.headers['location'])

    def test_redirect_with_correct_classroom_name_in_url(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_subtopic_page/math/topic-frag/revision/sub-one-frag',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic-frag/revision'
                '/sub-one-frag',
                response.headers['location'])

    def test_redirect_with_lowercase_subtopic_url_fragment(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_subtopic_page/staging/topic-frag/revision/Sub-One-Frag',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic-frag/revision'
                '/sub-one-frag',
                response.headers['location'])


class TopicViewerTests(test_utils.GenericTestBase):
    """Tests for decorator can_access_topic_viewer_page."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockDataHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_access_topic_viewer_page
        def get(self, topic_name):
            self.render_json({'topic_name': topic_name})

    class MockPageHandler(base.BaseHandler):
        @acl_decorators.can_access_topic_viewer_page
        def get(self, unused_topic_name):
            self.render_template('topic-viewer-page.mainpage.html')

    def setUp(self):
        super(TopicViewerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_banned_users([self.banned_user])
        topic_data_url = (
            '/mock_topic_data/<classroom_url_fragment>/<topic_url_fragment>')
        topic_page_url = (
            '/mock_topic_page/<classroom_url_fragment>/<topic_url_fragment>')
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [
                webapp2.Route(topic_data_url, self.MockDataHandler),
                webapp2.Route(topic_page_url, self.MockPageHandler)
            ],
            debug=feconf.DEBUG,
        ))

        self.topic_id = topic_fetchers.get_new_topic_id()
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1], next_subtopic_id=2)

    def test_cannot_access_non_existent_topic(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_topic_data/staging/invalid-topic',
                expected_status_int=404)

    def test_cannot_access_unpublished_topic(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_topic_data/staging/topic',
                expected_status_int=404)

    def test_can_access_published_topic(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_topic_data/staging/topic',
                expected_status_int=200)

    def test_can_access_topic_when_all_url_fragments_are_valid(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_html_response(
                '/mock_topic_page/staging/topic',
                expected_status_int=200)

    def test_redirect_to_classroom_if_abbreviated_topic_is_invalid(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_topic_page/math/invalid-topic',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/math',
                response.headers['location'])

    def test_redirect_with_correct_classroom_name_in_url(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_topic_page/math/topic',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic',
                response.headers['location'])

    def test_redirect_with_lowercase_topic_url_fragment(self):
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_topic_page/staging/TOPIC',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic',
                response.headers['location'])


class CreateSkillTests(test_utils.GenericTestBase):
    """Tests for decorator can_create_skill."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_create_skill
        def get(self):
            self.render_json({})

    def setUp(self):
        super(CreateSkillTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_banned_users([self.banned_user])

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_create_skill', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_admin_can_create_skill(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_create_skill')
        self.logout()

    def test_banned_user_cannot_create_skill(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_create_skill', expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have credentials to create a skill.')
        self.logout()

    def test_guest_cannot_add_create_skill(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_create_skill', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')


class ManageQuestionSkillStatusTests(test_utils.GenericTestBase):
    """Tests for decorator can_manage_question_skill_status."""

    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    skill_id = '1'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_manage_question_skill_status
        def get(self, skill_id):
            self.render_json({'skill_id': skill_id})

    def setUp(self):
        super(ManageQuestionSkillStatusTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.signup(self.viewer_email, self.viewer_username)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_manage_question_skill_status/<skill_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.question_id = question_services.get_new_question_id()
        self.question = self.save_new_question(
            self.question_id, self.admin_id,
            self._create_valid_question_data('ABC'), [self.skill_id])
        question_services.create_new_question_skill_link(
            self.admin_id, self.question_id, self.skill_id, 0.5)

    def test_admin_can_manage_question_skill_status(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_manage_question_skill_status/%s' % self.skill_id)
            self.assertEqual(response['skill_id'], self.skill_id)
        self.logout()

    def test_viewer_cannot_manage_question_skill_status(self):
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_manage_question_skill_status/%s' % self.skill_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have credentials to publish a question.')
        self.logout()

    def test_guest_cannot_manage_question_skill_status(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_manage_question_skill_status/%s' % self.skill_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')


class CreateTopicTests(test_utils.GenericTestBase):
    """Tests for decorator can_create_topic."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_create_topic
        def get(self):
            self.render_json({})

    def setUp(self):
        super(CreateTopicTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_banned_users([self.banned_user])

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_create_topic', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_admin_can_create_topic(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_create_topic')
        self.logout()

    def test_banned_user_cannot_create_topic(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_create_topic', expected_status_int=401)
            self.assertIn(
                'does not have enough rights to create a topic.',
                response['error'])
        self.logout()

    def test_guest_cannot_create_topic(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_create_topic', expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')


class ManageRightsForTopicTests(test_utils.GenericTestBase):
    """Tests for decorator can_manage_rights_for_topic."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'
    topic_id = 'topic_1'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_manage_rights_for_topic
        def get(self, topic_id):
            self.render_json({'topic_id': topic_id})

    def setUp(self):
        super(ManageRightsForTopicTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_banned_users([self.banned_user])

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_manage_rights_for_topic/<topic_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)

    def test_admin_can_manage_rights(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_manage_rights_for_topic/%s' % self.topic_id)
        self.logout()

    def test_banned_user_cannot_manage_rights(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_manage_rights_for_topic/%s' % self.topic_id,
                expected_status_int=401)
            self.assertIn(
                'does not have enough rights to assign roles for the topic.',
                response['error'])
        self.logout()

    def test_guest_cannot_manage_rights(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_manage_rights_for_topic/%s' % self.topic_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')


class ChangeTopicPublicationStatusTests(test_utils.GenericTestBase):
    """Tests for decorator can_change_topic_publication_status."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_change_topic_publication_status
        def get(self, topic_id):
            self.render_json({
                topic_id: topic_id
            })

    def setUp(self):
        super(ChangeTopicPublicationStatusTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_banned_users([self.banned_user])

        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name1',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_change_publication_status/<topic_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_admin_can_change_topic_publication_status(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_change_publication_status/%s' % self.topic_id)
        self.logout()

    def test_can_not_change_topic_publication_status_with_invalid_topic_id(
            self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_change_publication_status/invalid_topic_id',
                expected_status_int=404)
        self.logout()

    def test_banned_user_cannot_change_topic_publication_status(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_change_publication_status/%s' % self.topic_id,
                expected_status_int=401)
            self.assertIn(
                'does not have enough rights to publish or unpublish the '
                'topic.', response['error'])
        self.logout()

    def test_guest_cannot_change_topic_publication_status(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_change_publication_status/%s' % self.topic_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')


class PerformCronTaskTests(test_utils.GenericTestBase):
    """Tests for decorator can_perform_cron_tasks."""

    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_perform_cron_tasks
        def get(self):
            self.render_json({})

    def setUp(self):
        super(PerformCronTaskTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.signup(self.viewer_email, self.viewer_username)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_perform_cron_task', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_super_admin_can_perform_cron_tasks(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_perform_cron_task')
        self.logout()

    def test_normal_user_cannot_perform_cron_tasks(self):
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_perform_cron_task', expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have the credentials to access this page.')
        self.logout()


class EditSkillDecoratorTests(test_utils.GenericTestBase):
    """Tests permissions for accessing the skill editor."""

    second_admin_username = 'adm2'
    second_admin_email = 'adm2@example.com'
    manager_username = 'topicmanager'
    manager_email = 'topicmanager@example.com'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    skill_id = '1'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_edit_skill
        def get(self, skill_id):
            self.render_json({'skill_id': skill_id})

    def setUp(self):
        super(EditSkillDecoratorTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.second_admin_email, self.second_admin_username)
        self.signup(self.manager_email, self.manager_username)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_admins([self.ADMIN_USERNAME, self.second_admin_username])
        self.set_topic_managers([self.manager_username])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.second_admin_id = self.get_user_id_from_email(
            self.second_admin_email)
        self.manager_id = self.get_user_id_from_email(self.manager_email)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.manager = user_services.UserActionsInfo(self.manager_id)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_edit_skill/<skill_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_cannot_edit_skill_with_invalid_skill_id(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_custom_response(
                '/mock_edit_skill/', 'text/plain', expected_status_int=404)
        self.logout()

    def test_admin_can_edit_skill(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_skill/%s' % self.skill_id)
        self.assertEqual(response['skill_id'], self.skill_id)
        self.logout()

    def test_admin_can_edit_other_public_skill(self):
        self.login(self.second_admin_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_skill/%s' % self.skill_id)
        self.assertEqual(response['skill_id'], self.skill_id)
        self.logout()

    def test_topic_manager_can_edit_public_skill(self):
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_skill/%s' % self.skill_id)
        self.assertEqual(response['skill_id'], self.skill_id)
        self.logout()

    def test_normal_user_can_not_edit_public_skill(self):
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_skill/%s' % self.skill_id, expected_status_int=401)


class EditQuestionDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_edit_question."""

    question_id = 'question_id'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_edit_question
        def get(self, question_id):
            self.render_json({'question_id': question_id})

    def setUp(self):
        super(EditQuestionDecoratorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([user_services.get_username(self.user_id_a)])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.manager_id = self.get_user_id_from_email('a@example.com')
        self.question_id = 'question_id'
        self.save_new_question(
            self.question_id, self.owner_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_edit_question/<question_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_edit_question(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_question/%s' % self.question_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_cannot_edit_question_with_invalid_question_id(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_question/invalid_question_id',
                expected_status_int=404)
        self.logout()

    def test_admin_can_edit_question(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_question/%s' % self.question_id)
        self.assertEqual(response['question_id'], self.question_id)
        self.logout()

    def test_topic_manager_can_edit_question(self):
        self.login('a@example.com')
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_question/%s' % self.question_id)
        self.assertEqual(response['question_id'], self.question_id)
        self.logout()

    def test_any_user_cannot_edit_question(self):
        self.login('b@example.com')
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_question/%s' % self.question_id,
                expected_status_int=401)
        self.logout()


class PlayQuestionDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_play_question."""

    question_id = 'question_id'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_play_question
        def get(self, question_id):
            self.render_json({'question_id': question_id})

    def setUp(self):
        super(PlayQuestionDecoratorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_question/<question_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_question(
            self.question_id, self.owner_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

    def test_can_play_question_with_valid_question_id(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_play_question/%s' % (
                self.question_id))
            self.assertEqual(response['question_id'], self.question_id)


class PlayEntityDecoratorTests(test_utils.GenericTestBase):
    """Test the decorator can_play_entity."""

    user_email = 'user@example.com'
    username = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_play_entity
        def get(self, entity_type, entity_id):
            self.render_json(
                {'entity_type': entity_type, 'entity_id': entity_id})

    def setUp(self):
        super(PlayEntityDecoratorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_entity/<entity_type>/<entity_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.question_id = question_services.get_new_question_id()
        self.save_new_question(
            self.question_id, self.owner_id,
            self._create_valid_question_data('ABC'), ['skill_1'])
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_cannot_play_exploration_on_disabled_exploration_ids(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_play_entity/%s/%s' % (
                feconf.ENTITY_TYPE_EXPLORATION,
                feconf.DISABLED_EXPLORATION_IDS[0]), expected_status_int=404)

    def test_guest_can_play_exploration_on_published_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_play_entity/%s/%s' % (
                feconf.ENTITY_TYPE_EXPLORATION, self.published_exp_id))
            self.assertEqual(
                response['entity_type'], feconf.ENTITY_TYPE_EXPLORATION)
            self.assertEqual(
                response['entity_id'], self.published_exp_id)

    def test_guest_cannot_play_exploration_on_private_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_play_entity/%s/%s' % (
                feconf.ENTITY_TYPE_EXPLORATION,
                self.private_exp_id), expected_status_int=404)

    def test_cannot_play_exploration_with_none_exploration_rights(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_entity/%s/%s'
                % (feconf.ENTITY_TYPE_EXPLORATION, 'fake_exp_id'),
                expected_status_int=404)

    def test_can_play_question_for_valid_question_id(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_play_entity/%s/%s' % (
                feconf.ENTITY_TYPE_QUESTION, self.question_id))
        self.assertEqual(
            response['entity_type'], feconf.ENTITY_TYPE_QUESTION)
        self.assertEqual(response['entity_id'], self.question_id)
        self.assertEqual(response['entity_type'], 'question')

    def test_cannot_play_question_invalid_question_id(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_play_entity/%s/%s' % (
                feconf.ENTITY_TYPE_QUESTION, 'question_id'),
                          expected_status_int=404)

    def test_cannot_play_entity_for_invalid_entity(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_play_entity/%s/%s' % (
                'fake_entity_type', 'fake_entity_id'), expected_status_int=404)


class EditEntityDecoratorTests(test_utils.GenericTestBase):
    username = 'banneduser'
    user_email = 'user@example.com'
    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_edit_entity
        def get(self, entity_type, entity_id):
            return self.render_json(
                {'entity_type': entity_type, 'entity_id': entity_id})

    def setUp(self):
        super(EditEntityDecoratorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.set_banned_users([self.username])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_edit_entity/<entity_type>/<entity_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.question_id = question_services.get_new_question_id()
        self.save_new_question(
            self.question_id, self.owner_id,
            self._create_valid_question_data('ABC'), ['skill_1'])
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_can_edit_exploration_with_valid_exp_id(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_entity/exploration/%s' % (
                    self.published_exp_id))
            self.assertEqual(
                response['entity_type'], feconf.ENTITY_TYPE_EXPLORATION)
            self.assertEqual(
                response['entity_id'], self.published_exp_id)
        self.logout()

    def test_cannot_edit_exploration_with_invalid_exp_id(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_entity/exploration/invalid_exp_id',
                expected_status_int=404)
        self.logout()

    def test_banned_user_cannot_edit_exploration(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_entity/%s/%s' % (
                    feconf.ENTITY_TYPE_EXPLORATION, self.private_exp_id),
                expected_status_int=401)
        self.logout()

    def test_can_edit_question_with_valid_question_id(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_entity/%s/%s' % (
                feconf.ENTITY_TYPE_QUESTION, self.question_id))
            self.assertEqual(response['entity_id'], self.question_id)
            self.assertEqual(response['entity_type'], 'question')
        self.logout()

    def test_can_edit_topic(self):
        self.login(self.ADMIN_EMAIL)
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_entity/%s/%s' % (
                feconf.ENTITY_TYPE_TOPIC, topic_id))
            self.assertEqual(response['entity_id'], topic_id)
            self.assertEqual(response['entity_type'], 'topic')
        self.logout()

    def test_cannot_edit_topic_with_invalid_topic_id(self):
        self.login(self.ADMIN_EMAIL)
        topic_id = 'incorrect_id'
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_entity/%s/%s' % (
                    feconf.ENTITY_TYPE_TOPIC, topic_id),
                expected_status_int=404)
        self.logout()

    def test_can_edit_skill(self):
        self.login(self.ADMIN_EMAIL)
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.admin_id, description='Description')
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_entity/%s/%s' % (
                feconf.ENTITY_TYPE_SKILL, skill_id))
            self.assertEqual(response['entity_id'], skill_id)
            self.assertEqual(response['entity_type'], 'skill')
        self.logout()

    def test_can_edit_story(self):
        self.login(self.ADMIN_EMAIL)
        story_id = story_services.get_new_story_id()
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_story(story_id, self.admin_id, topic_id)
        self.save_new_topic(
            topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[story_id],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_entity/%s/%s' % (
                feconf.ENTITY_TYPE_STORY, story_id))
            self.assertEqual(response['entity_id'], story_id)
            self.assertEqual(response['entity_type'], 'story')
        self.logout()

    def test_cannot_edit_entity_invalid_entity(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_edit_entity/%s/%s' % (
                'invalid_entity_type', 'q_id'), expected_status_int=404)


class SaveExplorationTests(test_utils.GenericTestBase):
    """Tests for can_save_exploration decorator."""

    role = rights_domain.ROLE_VOICE_ARTIST
    username = 'user'
    user_email = 'user@example.com'
    banned_username = 'banneduser'
    banned_user_email = 'banneduser@example.com'
    published_exp_id_1 = 'exp_1'
    published_exp_id_2 = 'exp_2'
    private_exp_id_1 = 'exp_3'
    private_exp_id_2 = 'exp_4'

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_save_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(SaveExplorationTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.signup(self.banned_user_email, self.banned_username)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.set_banned_users([self.banned_username])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id_1, self.owner_id)
        self.save_new_valid_exploration(
            self.published_exp_id_2, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id_1, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id_2, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id_1)
        rights_manager.publish_exploration(self.owner, self.published_exp_id_2)

        rights_manager.assign_role_for_exploration(
            self.owner, self.published_exp_id_1, self.voice_artist_id,
            self.role)
        rights_manager.assign_role_for_exploration(
            self.owner, self.private_exp_id_1, self.voice_artist_id, self.role)

    def test_unautheticated_user_cannot_save_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)

    def test_can_not_save_exploration_with_invalid_exp_id(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/invalid_exp_id', expected_status_int=404)
        self.logout()

    def test_banned_user_cannot_save_exploration(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)
        self.logout()

    def test_owner_can_save_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_moderator_can_save_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id_1)
        self.assertEqual(response['exploration_id'], self.published_exp_id_1)
        self.logout()

    def test_moderator_cannot_save_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)
        self.logout()

    def test_admin_can_save_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_voice_artist_can_only_save_assigned_exploration(self):
        self.login(self.VOICE_ARTIST_EMAIL)
        # Checking voice artist can only save assigned public exploration.
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id_1)
        self.assertEqual(response['exploration_id'], self.published_exp_id_1)

        # Checking voice artist cannot save public exploration which he/she
        # is not assigned for.
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.published_exp_id_2, expected_status_int=401)
        self.logout()


class OppiaMLAccessDecoratorTest(test_utils.GenericTestBase):
    """Tests for oppia_ml_access decorator."""

    class MockHandler(base.OppiaMLVMHandler):
        REQUIRE_PAYLOAD_CSRF_CHECK = False
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        def extract_request_message_vm_id_and_signature(self):
            """Returns message, vm_id and signature retrived from incoming
            request.

            Returns:
                tuple(str). Message at index 0, vm_id at index 1 and signature
                at index 2.
            """
            signature = self.payload.get('signature')
            vm_id = self.payload.get('vm_id')
            message = self.payload.get('message')
            return classifier_domain.OppiaMLAuthInfo(message, vm_id, signature)

        @acl_decorators.is_from_oppia_ml
        def post(self):
            self.render_json({'job_id': 'new_job'})

    def setUp(self):
        super(OppiaMLAccessDecoratorTest, self).setUp()
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/ml/nextjobhandler', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_unauthorized_vm_cannot_fetch_jobs(self):
        payload = {}
        payload['vm_id'] = 'fake_vm'
        secret = 'fake_secret'
        payload['message'] = json.dumps('malicious message')
        payload['signature'] = classifier_services.generate_signature(
            python_utils.convert_to_bytes(secret),
            payload['message'], payload['vm_id'])

        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/ml/nextjobhandler', payload,
                expected_status_int=401)

    def test_default_vm_id_raises_exception_in_prod_mode(self):
        payload = {}
        payload['vm_id'] = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        payload['message'] = json.dumps('malicious message')
        payload['signature'] = classifier_services.generate_signature(
            python_utils.convert_to_bytes(secret),
            payload['message'], payload['vm_id'])
        with self.swap(self, 'testapp', self.mock_testapp):
            with self.swap(constants, 'DEV_MODE', False):
                self.post_json(
                    '/ml/nextjobhandler', payload, expected_status_int=401)

    def test_that_invalid_signature_raises_exception(self):
        payload = {}
        payload['vm_id'] = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        payload['message'] = json.dumps('malicious message')
        payload['signature'] = classifier_services.generate_signature(
            python_utils.convert_to_bytes(secret),
            'message', payload['vm_id'])

        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/ml/nextjobhandler', payload, expected_status_int=401)

    def test_that_no_excpetion_is_raised_when_valid_vm_access(self):
        payload = {}
        payload['vm_id'] = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        payload['message'] = json.dumps('message')
        payload['signature'] = classifier_services.generate_signature(
            python_utils.convert_to_bytes(secret),
            payload['message'], payload['vm_id'])

        with self.swap(self, 'testapp', self.mock_testapp):
            json_response = self.post_json('/ml/nextjobhandler', payload)

        self.assertEqual(json_response['job_id'], 'new_job')
