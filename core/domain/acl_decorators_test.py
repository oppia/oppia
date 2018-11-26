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

from core.controllers import base
from core.domain import acl_decorators
from core.domain import question_services
from core.domain import rights_manager
from core.domain import skill_services
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf

import webapp2
import webtest


class PlayExplorationDecoratorTest(test_utils.GenericTestBase):
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
        super(PlayExplorationDecoratorTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_guest_can_access_published_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)

    def test_guest_cannot_access_private_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id, expect_errors=True,
                expected_status_int=404)

    def test_admin_can_access_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_owner_can_access_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_logged_in_user_cannot_access_not_owned_exploration(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id, expect_errors=True,
                expected_status_int=404)
        self.logout()


class PlayCollectionDecoratorTest(test_utils.GenericTestBase):
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
        super(PlayCollectionDecoratorTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<collection_id>', self.MockHandler)],
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
            response = self.get_json('/mock/%s' % self.published_col_id)
        self.assertEqual(response['collection_id'], self.published_col_id)

    def test_guest_cannot_access_private_collection(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_col_id, expect_errors=True,
                expected_status_int=404)

    def test_admin_can_access_private_collection(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_owner_can_access_private_collection(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_logged_in_user_cannot_access_not_owned_private_collection(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_col_id, expect_errors=True,
                expected_status_int=404)
        self.logout()


class EditCollectionDecoratorTest(test_utils.GenericTestBase):
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
        super(EditCollectionDecoratorTest, self).setUp()
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
            [webapp2.Route('/mock/<collection_id>', self.MockHandler)],
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

    def test_guest_cannot_edit_collection_via_json_handler(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.published_col_id, expect_errors=True,
                expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self):
        with self.swap(
            self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
            feconf.HANDLER_TYPE_HTML):
            response = self.mock_testapp.get(
                '/mock/%s' % self.published_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 302)

    def test_normal_user_cannot_edit_collection(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_col_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_owner_can_edit_owned_collection(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_moderator_cannot_edit_private_collection(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_col_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_moderator_can_edit_public_collection(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_col_id)
        self.assertEqual(response['collection_id'], self.published_col_id)
        self.logout()

    def test_admin_can_edit_any_private_collection(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()


class CreateExplorationDecoratorTest(test_utils.GenericTestBase):
    """Tests for can_create_exploration decorator."""
    username = 'banneduser'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_create_exploration
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(CreateExplorationDecoratorTest, self).setUp()
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
            self.get_json(
                '/mock/create', expect_errors=True, expected_status_int=401)
        self.logout()

    def test_normal_user_can_create_exploration(self):
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/create')
        self.assertEqual(response['success'], True)
        self.logout()

    def test_guest_cannot_create_exploration_via_json_handler(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/create', expect_errors=True,
                          expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self):
        with self.swap(
            self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
            feconf.HANDLER_TYPE_HTML):
            response = self.mock_testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 302)


class CreateCollectionDecoratorTest(test_utils.GenericTestBase):
    """Tests for can_create_collection decorator."""
    username = 'collectioneditor'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_create_collection
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(CreateCollectionDecoratorTest, self).setUp()
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
            self.get_json(
                '/mock/create', expect_errors=True, expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self):
        with self.swap(
            self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
            feconf.HANDLER_TYPE_HTML):
            response = self.mock_testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 302)

    def test_normal_user_cannot_create_collection(self):
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/create', expect_errors=True, expected_status_int=401)
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


class AccessCreatorDashboardTest(test_utils.GenericTestBase):
    """Tests for can_access_creator_dashboard decorator."""
    username = 'banneduser'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_access_creator_dashboard
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(AccessCreatorDashboardTest, self).setUp()
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
            self.get_json(
                '/mock/access', expect_errors=True, expected_status_int=401)
        self.logout()

    def test_normal_user_can_access_editor_dashboard(self):
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/access')
        self.assertEqual(response['success'], True)


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
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/exploration.%s.thread1' % self.private_exp_id,
                expect_errors=True, expected_status_int=401)
            self.get_json(
                '/mock/exploration.%s.thread1' % self.published_exp_id,
                expect_errors=True, expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self):
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
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/exploration.%s.thread1' % self.private_exp_id)
        self.logout()

    def test_moderator_can_comment_on_feeback_for_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/exploration.%s.thread1' % self.published_exp_id)
        self.logout()

    def test_admin_can_comment_on_feeback_for_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/exploration.%s.thread1' % self.private_exp_id)
        self.logout()


class CreateFeedbackThreadTest(test_utils.GenericTestBase):
    """Tests for can_create_feedback_thread decorator."""
    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_create_feedback_thread
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(CreateFeedbackThreadTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)

        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_guest_can_create_feedback_threads_for_public_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/%s' % self.published_exp_id)

    def test_owner_cannot_create_feedback_for_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/%s' % self.private_exp_id)
        self.logout()

    def test_moderator_can_create_feeback_for_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/%s' % self.published_exp_id)
        self.logout()

    def test_admin_can_create_feeback_for_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/%s' % self.private_exp_id)
        self.logout()


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
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/exploration.%s.thread1' % self.published_exp_id)

    def test_owner_cannot_view_feedback_for_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/exploration.%s.thread1' % self.private_exp_id)
        self.logout()

    def test_moderator_can_view_feeback_for_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/exploration.%s.thread1' % self.published_exp_id)
        self.logout()

    def test_admin_can_view_feeback_for_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/exploration.%s.thread1' % self.private_exp_id)
        self.logout()


class ManageEmailDashboardTest(test_utils.GenericTestBase):
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

        super(ManageEmailDashboardTest, self).setUp()
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
            self.get_json(
                '/mock/', expect_errors=True, expected_status_int=401)
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


class RateExplorationTest(test_utils.GenericTestBase):
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
        super(RateExplorationTest, self).setUp()
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_give_rating(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.exp_id, expect_errors=True,
                expected_status_int=401)

    def test_normal_user_can_give_rating(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.exp_id)
        self.assertEqual(response['exploration_id'], self.exp_id)
        self.logout()


class AccessModeratorPageTest(test_utils.GenericTestBase):
    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_access_moderator_page
        def get(self):
            return self.render_json({'success': 1})

    def setUp(self):
        super(AccessModeratorPageTest, self).setUp()
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
            self.get_json('/mock/', expect_errors=True, expected_status_int=401)
        self.logout()

    def test_admin_can_access_moderator_page(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()


class FlagExplorationTest(test_utils.GenericTestBase):
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
        super(FlagExplorationTest, self).setUp()
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_flag_exploration(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.exp_id, expect_errors=True,
                expected_status_int=401)

    def test_normal_user_can_flag_exploration(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.exp_id)
        self.assertEqual(response['exploration_id'], self.exp_id)
        self.logout()


class SubscriptionToUsersTest(test_utils.GenericTestBase):
    """Tests for can_subscribe_to_users decorator."""
    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_subscribe_to_users
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(SubscriptionToUsersTest, self).setUp()
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_subscribe_to_users(self):
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expect_errors=True, expected_status_int=401)

    def test_normal_user_can_subscribe_to_users(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], True)
        self.logout()


class SendModeratorEmailsTest(test_utils.GenericTestBase):

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_send_moderator_emails
        def get(self):
            return self.render_json({'success': 1})

    def setUp(self):
        super(SendModeratorEmailsTest, self).setUp()
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
            self.get_json('/mock/', expect_errors=True, expected_status_int=401)
        self.logout()

    def test_admin_can_send_moderator_emails(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()


class TranslateExplorationTest(test_utils.GenericTestBase):
    """Tests for can_translate_exploration decorator."""
    role = rights_manager.ROLE_TRANSLATOR
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

        @acl_decorators.can_translate_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(TranslateExplorationTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.signup(self.banned_user_email, self.banned_username)
        self.signup(self.TRANSLATOR_EMAIL, self.TRANSLATOR_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.translator_id = self.get_user_id_from_email(self.TRANSLATOR_EMAIL)
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
            self.owner, self.published_exp_id_1, self.translator_id, self.role)
        rights_manager.assign_role_for_exploration(
            self.owner, self.private_exp_id_1, self.translator_id, self.role)

    def test_banned_user_cannot_translate_exploration(self):
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_owner_can_translate_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_moderator_can_translate_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id_1)
        self.assertEqual(response['exploration_id'], self.published_exp_id_1)
        self.logout()

    def test_moderator_cannot_translate_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_admin_can_translate_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_translator_can_only_translate_assigned_public_exploration(self):
        self.login(self.TRANSLATOR_EMAIL)
        # Checking translator can translate assigned public exploration.
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id_1)
        self.assertEqual(response['exploration_id'], self.published_exp_id_1)

        # Checking translator cannot translate public exploration which he/she
        # is not assigned for.
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.published_exp_id_2, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_translator_can_only_translate_assigned_private_exploration(self):
        self.login(self.TRANSLATOR_EMAIL)
        # Checking translator can translate assigned private exploration.
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)

        # Checking translator cannot translate private exploration which he/she
        # is not assigned for.
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_2, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_user_without_translator_role_of_exploration_cannot_translate_public_exploration(self): # pylint: disable=line-too-long
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.published_exp_id_1, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_user_without_translator_role_of_exploration_cannot_translate_private_exploration(self): # pylint: disable=line-too-long
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expect_errors=True,
                expected_status_int=401)
        self.logout()


class EditExplorationTest(test_utils.GenericTestBase):
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
        super(EditExplorationTest, self).setUp()
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
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_banned_user_cannot_edit_exploration(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_owner_can_edit_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_moderator_can_edit_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)
        self.logout()

    def test_moderator_cannot_edit_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_admin_can_edit_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()


class ManageOwnProfileTest(test_utils.GenericTestBase):
    """Tests for decorator can_manage_own_profile."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'
    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_manage_own_profile
        def get(self):
            return self.render_json({'success': 1})

    def setUp(self):
        super(ManageOwnProfileTest, self).setUp()
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
            self.get_json(
                '/mock/', expect_errors=True, expected_status_int=401)
        self.logout()

    def test_normal_user_can_manage_preferences(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()


class DeleteExplorationTest(test_utils.GenericTestBase):
    """Tests for can_delete_exploration decorator."""
    private_exp_id = 'exp_0'
    published_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_delete_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(DeleteExplorationTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_owner_can_delete_owned_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_moderator_can_delete_published_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)
        self.logout()

    def test_owner_cannot_delete_published_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.published_exp_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_moderator_cannot_delete_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id, expect_errors=True,
                expected_status_int=401)
        self.logout()


class SuggestChangesToExplorationTest(test_utils.GenericTestBase):
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
        super(SuggestChangesToExplorationTest, self).setUp()
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
                '/mock/%s' % self.exploration_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_normal_user_can_suggest_changes(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.exploration_id)
        self.assertEqual(response['exploration_id'], self.exploration_id)
        self.logout()


class SuggestChangesDecoratorsTest(test_utils.GenericTestBase):
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
        super(SuggestChangesDecoratorsTest, self).setUp()
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
            self.get_json('/mock', expect_errors=True, expected_status_int=401)
        self.logout()

    def test_normal_user_can_suggest_changes(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock', expected_status_int=200)
        self.logout()


class ResubmitSuggestionDecoratorsTest(test_utils.GenericTestBase):
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
        super(ResubmitSuggestionDecoratorsTest, self).setUp()
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
            self.change_dict, '', None)
        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id),
             ('target_id', self.exploration_id)])[0]
        self.suggestion_id = suggestion.suggestion_id

    def test_author_can_resubmit_suggestion(self):
        self.login(self.author_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % self.suggestion_id, expect_errors=False,
                expected_status_int=200)
        self.assertEqual(response['suggestion_id'], self.suggestion_id)
        self.logout()

    def test_non_author_cannot_resubmit_suggestion(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.suggestion_id, expect_errors=True,
                expected_status_int=401)
        self.logout()


class PublishExplorationTest(test_utils.GenericTestBase):
    """Tests for can_publish_exploration decorator."""
    private_exp_id = 'exp_0'
    public_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_publish_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(PublishExplorationTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.public_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.public_exp_id)

    def test_owner_can_publish_owned_exploration(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_already_published_exploration_cannot_be_published(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.public_exp_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_moderator_cannot_publish_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_admin_can_publish_any_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)



class ModifyExplorationRolesTest(test_utils.GenericTestBase):
    """Tests for can_modify_exploration_roles decorator."""
    private_exp_id = 'exp_0'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_modify_exploration_roles
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(ModifyExplorationRolesTest, self).setUp()
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
                '/mock/%s' % self.private_exp_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_admin_can_modify_roles_of_any_exploration(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()


class CollectionPublishStatusTest(test_utils.GenericTestBase):
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
        super(CollectionPublishStatusTest, self).setUp()
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
                    '/mock_publish/<collection_id>', self.MockPublishHandler),
                webapp2.Route(
                    '/mock_unpublish/<collection_id>',
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

    def test_owner_can_publish_collection(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_publish/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_owner_cannot_unpublish_public_collection(self):
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_unpublish/%s' % self.published_col_id,
                expect_errors=True, expected_status_int=401)
        self.logout()

    def test_moderator_can_unpublish_public_collection(self):
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_unpublish/%s' % self.published_col_id)
        self.assertEqual(response['collection_id'], self.published_col_id)
        self.logout()

    def test_admin_can_publish_any_collection(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_publish/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_admin_cannot_publish_already_published_collection(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_publish/%s' % self.published_col_id, expect_errors=True,
                expected_status_int=401)
        self.logout()


class AccessLearnerDashboardDecoratorTest(test_utils.GenericTestBase):
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
        super(AccessLearnerDashboardDecoratorTest, self).setUp()
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
            self.get_json(
                '/mock/', expect_errors=True, expected_status_int=401)
        self.logout()

    def test_exploration_editor_can_access_learner_dashboard(self):
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/')
        self.logout()


class EditTopicDecoratorTest(test_utils.GenericTestBase):
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
        super(EditTopicDecoratorTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.manager_email, self.manager_username)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([self.manager_username])

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.manager_id = self.get_user_id_from_email(self.manager_email)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.manager = user_services.UserActionsInfo(self.manager_id)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<topic_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)
        topic_services.assign_role(
            self.admin, self.manager, topic_domain.ROLE_MANAGER, self.topic_id)

    def test_admin_can_edit_topic(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_topic_manager_can_edit_topic(self):
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_normal_user_cannot_edit_topic(self):
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.topic_id, expect_errors=True,
                expected_status_int=401)
        self.logout()


class EditSkillDecoratorTest(test_utils.GenericTestBase):
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
        super(EditSkillDecoratorTest, self).setUp()
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
            [webapp2.Route('/mock/<skill_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        skill_services.create_new_skill_rights(self.skill_id, self.admin_id)

    def test_admin_can_edit_skill(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.skill_id)
        self.assertEqual(response['skill_id'], self.skill_id)
        self.logout()

    def test_admin_can_edit_other_public_skill(self):
        skill_services.publish_skill(self.skill_id, self.admin_id)
        self.login(self.second_admin_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.skill_id)
        self.assertEqual(response['skill_id'], self.skill_id)
        self.logout()

    def test_admin_can_not_edit_other_private_skill(self):
        self.login(self.second_admin_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.skill_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_topic_manager_can_not_edit_private_skill(self):
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.skill_id, expect_errors=True,
                expected_status_int=401)
        self.logout()

    def test_topic_manager_can_edit_public_skill(self):
        skill_services.publish_skill(self.skill_id, self.admin_id)
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.skill_id)
        self.assertEqual(response['skill_id'], self.skill_id)
        self.logout()

    def test_normal_user_can_not_edit_public_skill(self):
        skill_services.publish_skill(self.skill_id, self.admin_id)
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.skill_id, expect_errors=True,
                expected_status_int=401)


class EditQuestionDecoratorTest(test_utils.GenericTestBase):
    """Tests the decorator can_edit_question."""
    question_id = 'question_id'

    class MockHandler(base.BaseHandler):

        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

        @acl_decorators.can_edit_question
        def get(self, question_id):
            self.render_json({'question_id': question_id})

    def setUp(self):
        super(EditQuestionDecoratorTest, self).setUp()

        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)
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

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<question_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        question_services.create_new_question_rights(
            self.question_id, self.ADMIN_EMAIL)

    def test_admin_can_edit_question(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.question_id)
        self.assertEqual(response['question_id'], self.question_id)
        self.logout()

    def test_topic_manager_can_edit_question(self):
        self.login('a@example.com')
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.question_id)
        self.assertEqual(response['question_id'], self.question_id)
        self.logout()

    def test_any_user_cannot_edit_question(self):
        self.login('b@example.com')
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.question_id, expect_errors=True,
                expected_status_int=401)
        self.logout()
