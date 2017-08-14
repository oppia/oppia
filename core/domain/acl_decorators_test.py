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
from core.domain import rights_manager
from core.tests import test_utils
import feconf
import webapp2
import webtest


class PlayExplorationDecoratorTest(test_utils.GenericTestBase):
    """Tests for play exploration decorator."""
    user_email = 'user@example.com'
    user_name = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_play_exploration
        def get(self, exploration_id):
            return self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(PlayExplorationDecoratorTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.user_name)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(
            self.owner_id, self.published_exp_id)

    def test_guest_can_access_published_exploration(self):
        response = self.get_json('/mock/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)

    def test_guest_cannot_access_private_exploration(self):
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_admin_can_access_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_owner_can_access_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_logged_in_user_cannot_access_not_owned_exploration(self):
        self.login(self.user_email)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()


class PlayCollectionDecoratorTest(test_utils.GenericTestBase):
    """Tests for play collection decorator."""
    user_email = 'user@example.com'
    user_name = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'
    published_col_id = 'col_id_1'
    private_col_id = 'col_id_2'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_play_collection
        def get(self, collection_id):
            return self.render_json({'collection_id': collection_id})

    def setUp(self):
        super(PlayCollectionDecoratorTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.user_name)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
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
        rights_manager.publish_exploration(
            self.owner_id, self.published_exp_id)
        rights_manager.publish_collection(
            self.owner_id, self.published_col_id)

    def test_guest_can_access_published_collection(self):
        response = self.get_json('/mock/%s' % self.published_col_id)
        self.assertEqual(response['collection_id'], self.published_col_id)

    def test_guest_cannot_access_private_collection(self):
        response = self.testapp.get(
            '/mock/%s' % self.private_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_admin_can_access_private_collection(self):
        self.login(self.ADMIN_EMAIL)
        response = self.get_json('/mock/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_owner_can_access_private_collection(self):
        self.login(self.OWNER_EMAIL)
        response = self.get_json('/mock/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_logged_in_user_cannot_access_not_owned_private_collection(self):
        self.login(self.user_email)
        response = self.testapp.get(
            '/mock/%s' % self.private_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()


class EditCollectionDecoratorTest(test_utils.GenericTestBase):
    """Tests for can_edit_collection decorator."""
    user_email = 'user@example.com'
    user_name = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'
    published_col_id = 'col_id_1'
    private_col_id = 'col_id_2'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_edit_collection
        def get(self, collection_id):
            return self.render_json({'collection_id': collection_id})

    def setUp(self):
        super(EditCollectionDecoratorTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.user_name)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_collection_editors([self.OWNER_USERNAME])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
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
        rights_manager.publish_exploration(
            self.owner_id, self.published_exp_id)
        rights_manager.publish_collection(
            self.owner_id, self.published_col_id)

    def test_guest_is_redirected_to_login_page(self):
        response = self.testapp.get(
            '/mock/%s' % self.published_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 302)

    def test_normal_user_cannot_edit_collection(self):
        self.login(self.user_email)
        response = self.testapp.get(
            '/mock/%s' % self.private_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_owner_can_edit_owned_collection(self):
        self.login(self.OWNER_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_moderator_cannot_edit_private_collection(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_moderator_can_edit_public_collection(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.published_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_admin_can_edit_any_private_collection(self):
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class CreateExplorationDecoratorTest(test_utils.GenericTestBase):
    """Tests for can_create_exploration decorator."""
    user_name = 'banneduser'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_create_exploration
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(CreateExplorationDecoratorTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.user_email, self.user_name)
        self.set_banned_users([self.user_name])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/create', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_create_exploration(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_normal_user_can_create_exploration(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_guest_user_is_redirected_to_login_page(self):
        response = self.testapp.get(
            '/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 302)


class CreateCollectionDecoratorTest(test_utils.GenericTestBase):
    """Tests for can_create_collection decorator."""
    user_name = 'collectioneditor'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_create_collection
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(CreateCollectionDecoratorTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.user_email, self.user_name)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_collection_editors([self.user_name])
        self.set_admins([self.ADMIN_USERNAME])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/create', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_user_is_redirected_to_login_page(self):
        response = self.testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 302)

    def test_normal_user_cannot_create_collection(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_collection_editor_can_create_collection(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_admins_can_create_collection(self):
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class AccessCreatorDashboardTest(test_utils.GenericTestBase):
    """Tests for can_access_creator_dashboard decorator."""
    user_name = 'banneduser'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):

        @acl_decorators.can_access_creator_dashboard
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(AccessCreatorDashboardTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.user_email, self.user_name)
        self.set_banned_users([self.user_name])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/access', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_access_editor_dashboard(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/access', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_normal_user_can_access_editor_dashboard(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/mock/access', expect_errors=True)
        self.assertEqual(response.status_int, 200)


class CommentOnFeedbackTest(test_utils.GenericTestBase):
    """Tests for can_comment_on_exploration_feedback decorator."""
    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_comment_on_feedback_thread
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(CommentOnFeedbackTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)

        rights_manager.publish_exploration(
            self.owner_id, self.published_exp_id)

    def test_guest_cannot_comment_on_feedback_threads(self):
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 302)

    def test_owner_can_comment_on_feedback_for_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_moderator_can_comment_on_feeback_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.published_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_admin_can_comment_on_feeback_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class ManageEmailDashboardTest(test_utils.GenericTestBase):
    """Tests for can_manage_email_dashboard decorator."""

    class MockHandler(base.BaseHandler):
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
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [
                webapp2.Route('/mock/', self.MockHandler),
                webapp2.Route('/mock/<query_id>', self.MockHandler)
            ],
            debug=feconf.DEBUG,
        ))

    def test_moderator_cannot_access_email_dashboard(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_admin_can_access_email_dashboard(self):
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        response = self.testapp.put('/mock/one', expect_errors=True)
        self.assertEqual(response.status_int, 200)


class RateExplorationTest(test_utils.GenericTestBase):
    """Tests for can_rate_exploration decorator."""
    user_name = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_rate_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(RateExplorationTest, self).setUp()
        self.signup(self.user_email, self.user_name)
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_give_rating(self):
        response = self.testapp.get('/mock/exp', expect_errors=True)
        self.assertEqual(response.status_int, 401)

    def test_normal_user_can_give_rating(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/exp', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class AccessModeratorPageTest(test_utils.GenericTestBase):
    user_name = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_access_moderator_page
        def get(self):
            return self.render_json({'success': 1})

    def setUp(self):
        super(AccessModeratorPageTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.user_name)
        self.set_admins([self.ADMIN_USERNAME])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_access_moderator_page(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_admin_can_access_moderator_page(self):
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class FlagExplorationTest(test_utils.GenericTestBase):
    """Tests for can_flag_exploration decorator."""
    user_name = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_flag_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(FlagExplorationTest, self).setUp()
        self.signup(self.user_email, self.user_name)
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_flag_exploration(self):
        response = self.testapp.get('/mock/exp', expect_errors=True)
        self.assertEqual(response.status_int, 401)

    def test_normal_user_can_flag_exploration(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/exp', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class SubscriptionToUsersTest(test_utils.GenericTestBase):
    """Tests for can_subscribe_to_users decorator."""
    user_name = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_subscribe_to_users
        def get(self):
            self.render_json({'success': True})

    def setUp(self):
        super(SubscriptionToUsersTest, self).setUp()
        self.signup(self.user_email, self.user_name)
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_subscribe_to_users(self):
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 401)

    def test_normal_user_can_subscribe_to_users(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class SendModeratorEmailsTest(test_utils.GenericTestBase):

    user_name = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_send_moderator_emails
        def get(self):
            return self.render_json({'success': 1})

    def setUp(self):
        super(SendModeratorEmailsTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.user_name)
        self.set_admins([self.ADMIN_USERNAME])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_send_moderator_emails(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_admin_can_send_moderator_emails(self):
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class EditExplorationTest(test_utils.GenericTestBase):
    """Tests for can_edit_exploration decorator."""
    user_name = 'banneduser'
    user_email = 'user@example.com'
    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_edit_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(EditExplorationTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.user_email, self.user_name)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])
        self.set_banned_users([self.user_name])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(
            self.owner_id, self.published_exp_id)

    def test_banned_user_cannot_edit_exploration(self):
        self.login(self.user_email)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_owner_can_edit_exploration(self):
        self.login(self.OWNER_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_moderator_can_edit_public_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.published_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_moderator_cannot_edit_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_admin_can_edit_private_exploration(self):
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class ManageOwnProfileTest(test_utils.GenericTestBase):
    """Tests for decorator can_manage_own_profile."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'
    user_name = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_manage_own_profile
        def get(self):
            return self.render_json({'success': 1})

    def setUp(self):
        super(ManageOwnProfileTest, self).setUp()
        self.signup(self.banned_user_email, self.banned_user)
        self.signup(self.user_email, self.user_name)
        self.set_banned_users([self.banned_user])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_update_preferences(self):
        self.login(self.banned_user_email)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_normal_user_can_manage_preferences(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 200)


class DeleteExplorationTest(test_utils.GenericTestBase):
    """Tests for can_delete_exploration decorator."""
    private_exp_id = 'exp_0'
    published_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_delete_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(DeleteExplorationTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(
            self.owner_id, self.published_exp_id)

    def test_owner_can_delete_owned_private_exploration(self):
        self.login(self.OWNER_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_moderator_can_delete_published_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.published_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_owner_cannot_delete_published_exploration(self):
        self.login(self.OWNER_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.published_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_moderator_cannot_delete_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()


class SuggestChangesTest(test_utils.GenericTestBase):
    """Tests for can_suggest_changes_to_exploration decorator."""
    user_name = 'user'
    user_email = 'user@example.com'
    banned_user_name = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_suggest_changes_to_exploration
        def get(self, exploration_id):
            self.render_json({'exploration_id': exploration_id})

    def setUp(self):
        super(SuggestChangesTest, self).setUp()
        self.signup(self.user_email, self.user_name)
        self.signup(self.banned_user_email, self.banned_user_name)
        self.set_banned_users([self.banned_user_name])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_suggest_changes(self):
        self.login(self.banned_user_email)
        response = self.testapp.get('/mock/exp', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_normal_user_can_suggest_changes(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/exp', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class PublishExplorationTest(test_utils.GenericTestBase):
    """Tests for can_publish_exploration decorator."""
    private_exp_id = 'exp_0'
    public_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler):
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
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.public_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(
            self.owner_id, self.public_exp_id)

    def test_owner_can_publish_owned_exploration(self):
        self.login(self.OWNER_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_moderator_cannot_publish_private_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)

    def test_admin_can_publish_any_exploration(self):
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.public_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)

        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class ModifyExplorationRolesTest(test_utils.GenericTestBase):
    """Tests for can_modify_exploration_roles decorator."""
    private_exp_id = 'exp_0'

    class MockHandler(base.BaseHandler):
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
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)

    def test_owner_can_modify_exploration_roles(self):
        self.login(self.OWNER_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_moderator_cannot_modify_roles_of_unowned_exploration(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_admin_can_modify_roles_of_any_exploration(self):
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class ManageCollectionPublishStatusTest(test_utils.GenericTestBase):
    """Tests can_manage_collection_publish_status decorator."""

    user_email = 'user@example.com'
    user_name = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'
    published_col_id = 'col_id_1'
    private_col_id = 'col_id_2'

    class MockHandler(base.BaseHandler):
        @acl_decorators.can_manage_collection_publish_status
        def get(self, collection_id):
            return self.render_json({'collection_id': collection_id})

    def setUp(self):
        super(ManageCollectionPublishStatusTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.user_name)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_collection_editors([self.OWNER_USERNAME])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
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
        rights_manager.publish_exploration(
            self.owner_id, self.published_exp_id)
        rights_manager.publish_collection(
            self.owner_id, self.published_col_id)

    def test_owner_can_publish_collection(self):
        self.login(self.OWNER_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_owner_cannot_unpublish_public_collection(self):
        self.login(self.OWNER_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.published_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

    def test_moderator_can_unpublish_public_collection(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.published_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_admin_can_publish_any_collection(self):
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get(
            '/mock/%s' % self.private_col_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()


class AccessLearnerDashboardDecoratorTest(test_utils.GenericTestBase):
    """Tests the decorator can_access_learner_dashboard."""

    user = 'user'
    user_email = 'user@example.com'
    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockHandler(base.BaseHandler):

        @acl_decorators.can_access_learner_dashboard
        def get(self):
            return self.render_json({})

    def setUp(self):
        super(AccessLearnerDashboardDecoratorTest, self).setUp()
        self.signup(self.user_email, self.user)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_banned_users([self.banned_user])
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_is_redirected(self):
        self.login(self.banned_user_email)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 302)
        self.logout()

    def test_exploration_editor_can_access_learner_dashboard(self):
        self.login(self.user_email)
        response = self.testapp.get('/mock/', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.logout()
