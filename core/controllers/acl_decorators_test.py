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

from __future__ import annotations

import json

from core import android_validation_constants
from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import incoming_app_feedback_report
from core.domain import blog_services
from core.domain import classifier_domain
from core.domain import classifier_services
from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List, TypedDict, Union
import webapp2
import webtest

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class OpenAccessDecoratorTests(test_utils.GenericTestBase):
    """Tests for open access decorator."""

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.open_access
        def get(self) -> None:
            self.render_json({'success': True})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_access_with_logged_in_user(self) -> None:
        self.login(self.VIEWER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock')
        self.assertTrue(response['success'])
        self.logout()

    def test_access_with_guest_user(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock')
        self.assertTrue(response['success'])


class IsSourceMailChimpDecoratorTests(test_utils.GenericTestBase):
    """Tests for is_source_mailchimp decorator."""

    user_email = 'user@example.com'
    username = 'user'
    secret = 'webhook_secret'
    invalid_secret = 'invalid'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'secret': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.is_source_mailchimp
        def get(self, secret: str) -> None:
            self.render_json({'secret': secret})

    def setUp(self) -> None:
        super().setUp()
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_secret_page/<secret>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_error_when_mailchimp_webhook_secret_is_none(self) -> None:
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)

        with testapp_swap:
            response = self.get_json(
                '/mock_secret_page/%s' % self.secret,
                expected_status_int=404
            )

        error_msg = (
            'Could not find the page http://localhost'
            '/mock_secret_page/%s.' % self.secret
        )
        self.assertEqual(response['error'], error_msg)
        self.assertEqual(response['status_code'], 404)

    def test_error_when_given_webhook_secret_is_invalid(self) -> None:
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        mailchimp_swap = self.swap_to_always_return(
            feconf, 'MAILCHIMP_WEBHOOK_SECRET', value=self.secret)

        with testapp_swap, mailchimp_swap:
            response = self.get_json(
                '/mock_secret_page/%s' % self.invalid_secret,
                expected_status_int=404
            )

        error_msg = (
            'Could not find the page http://localhost'
            '/mock_secret_page/%s.' % self.invalid_secret
        )
        self.assertEqual(response['error'], error_msg)
        self.assertEqual(response['status_code'], 404)

    def test_no_error_when_given_webhook_secret_is_valid(self) -> None:
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        mailchimp_swap = self.swap(
            feconf, 'MAILCHIMP_WEBHOOK_SECRET', self.secret)

        with testapp_swap, mailchimp_swap:
            response = self.get_json(
                '/mock_secret_page/%s' % self.secret,
                expected_status_int=200
            )

        self.assertEqual(response['secret'], self.secret)


class ViewSkillsDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_view_skills decorator."""

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        REQUIRE_PAYLOAD_CSRF_CHECK = False
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'selected_skill_ids': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_view_skills
        def get(self, selected_skill_ids: List[str]) -> None:
            self.render_json({'selected_skill_ids': selected_skill_ids})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_view_skills/<selected_skill_ids>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_can_view_skill_with_valid_skill_id(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.admin_id, description='Description')
        skill_ids = [skill_id]
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_skills/%s' % json.dumps(skill_ids))
        self.assertEqual(response['selected_skill_ids'], skill_ids)

    def test_invalid_input_exception_with_invalid_skill_ids(self) -> None:
        skill_ids = ['abcd1234']
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_skills/%s' % json.dumps(skill_ids),
                expected_status_int=400)
        self.assertEqual(response['error'], 'Invalid skill id.')

    def test_page_not_found_exception_with_invalid_skill_ids(self) -> None:
        skill_ids = ['invalid_id12', 'invalid_id13']
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_skills/%s' % json.dumps(skill_ids),
                expected_status_int=404)
        error_msg = (
            'Could not find the page http://localhost/mock_view_skills/'
            '%5B%22invalid_id12%22,%20%22invalid_id13%22%5D.'
        )
        self.assertEqual(response['error'], error_msg)


class DownloadExplorationDecoratorTests(test_utils.GenericTestBase):
    """Tests for download exploration decorator."""

    user_email = 'user@example.com'
    username = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_download_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_download_exploration/<exploration_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_cannot_download_exploration_with_disabled_exploration_ids(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_download_exploration/%s' % (
                    feconf.DISABLED_EXPLORATION_IDS[0]),
                expected_status_int=404
            )
        error_msg = (
            'Could not find the page '
            'http://localhost/mock_download_exploration/%s.' % (
                feconf.DISABLED_EXPLORATION_IDS[0]
            )
        )
        self.assertEqual(response['error'], error_msg)

    def test_guest_can_download_published_exploration(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_download_exploration/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)

    def test_guest_cannot_download_private_exploration(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_download_exploration/%s' % self.private_exp_id,
                expected_status_int=404)
        error_msg = (
            'Could not find the page '
            'http://localhost/mock_download_exploration/%s.' % (
                self.private_exp_id
            )
        )
        self.assertEqual(response['error'], error_msg)

    def test_moderator_can_download_private_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_download_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_owner_can_download_private_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_download_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_logged_in_user_cannot_download_unowned_exploration(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_download_exploration/%s' % self.private_exp_id,
                expected_status_int=404)
        error_msg = (
            'Could not find the page '
            'http://localhost/mock_download_exploration/%s.' % (
                self.private_exp_id
            )
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_page_not_found_exception_when_exploration_rights_is_none(
        self
    ) -> None:
        self.login(self.user_email)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        exp_rights_swap = self.swap_to_always_return(
            rights_manager, 'get_exploration_rights', value=None)
        with testapp_swap, exp_rights_swap:
            response = self.get_json(
                '/mock_download_exploration/%s' % self.published_exp_id,
                expected_status_int=404)
        error_msg = (
            'Could not find the page '
            'http://localhost/mock_download_exploration/%s.' % (
                self.published_exp_id
            )
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()


class ViewExplorationStatsDecoratorTests(test_utils.GenericTestBase):
    """Tests for view exploration stats decorator."""

    user_email = 'user@example.com'
    username = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_view_exploration_stats
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_view_exploration_stats/<exploration_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_cannot_view_exploration_stats_with_disabled_exploration_ids(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_exploration_stats/%s' % (
                    feconf.DISABLED_EXPLORATION_IDS[0]),
                expected_status_int=404
            )
        error_msg = (
            'Could not find the page '
            'http://localhost/mock_view_exploration_stats/%s.' % (
                feconf.DISABLED_EXPLORATION_IDS[0]
            )
        )
        self.assertEqual(response['error'], error_msg)

    def test_guest_can_view_published_exploration_stats(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_exploration_stats/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)

    def test_guest_cannot_view_private_exploration_stats(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_exploration_stats/%s' % self.private_exp_id,
                expected_status_int=404)
        error_msg = (
            'Could not find the page '
            'http://localhost/mock_view_exploration_stats/%s.' % (
                self.private_exp_id
            )
        )
        self.assertEqual(response['error'], error_msg)

    def test_moderator_can_view_private_exploration_stats(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_exploration_stats/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_owner_can_view_private_exploration_stats(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_exploration_stats/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_logged_in_user_cannot_view_unowned_exploration_stats(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_exploration_stats/%s' % self.private_exp_id,
                expected_status_int=404)
        error_msg = (
            'Could not find the page '
            'http://localhost/mock_view_exploration_stats/%s.' % (
                self.private_exp_id
            )
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_page_not_found_exception_when_exploration_rights_is_none(
        self
    ) -> None:
        self.login(self.user_email)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        exp_rights_swap = self.swap_to_always_return(
            rights_manager, 'get_exploration_rights', value=None)
        with testapp_swap, exp_rights_swap:
            response = self.get_json(
                '/mock_view_exploration_stats/%s' % self.published_exp_id,
                expected_status_int=404)
        error_msg = (
            'Could not find the page '
            'http://localhost/mock_view_exploration_stats/%s.' % (
                self.published_exp_id
            )
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()


class RequireUserIdElseRedirectToHomepageTests(test_utils.GenericTestBase):
    """Tests for require_user_id_else_redirect_to_homepage decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_HTML
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.require_user_id_else_redirect_to_homepage
        def get(self) -> None:
            self.redirect('/access_page')

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_logged_in_user_is_redirected_to_access_page(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response('/mock/', expected_status_int=302)
        self.assertEqual(
            'http://localhost/access_page', response.headers['location'])
        self.logout()

    def test_guest_user_is_redirected_to_homepage(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response('/mock/', expected_status_int=302)
        self.assertEqual(
            'http://localhost/', response.headers['location'])


class PlayExplorationDecoratorTests(test_utils.GenericTestBase):
    """Tests for play exploration decorator."""

    user_email = 'user@example.com'
    username = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_play_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_cannot_access_exploration_with_disabled_exploration_ids(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_exploration/%s'
                % (feconf.DISABLED_EXPLORATION_IDS[0]), expected_status_int=404)

    def test_guest_can_access_published_exploration(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_exploration/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)

    def test_guest_cannot_access_private_exploration(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_exploration/%s' % self.private_exp_id,
                expected_status_int=404)

    def test_moderator_can_access_private_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_owner_can_access_private_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_logged_in_user_cannot_access_not_owned_exploration(self) -> None:
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'collection_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_play_collection
        def get(self, collection_id: str) -> None:
            self.render_json({'collection_id': collection_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_guest_can_access_published_collection(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_collection/%s' % self.published_col_id)
        self.assertEqual(response['collection_id'], self.published_col_id)

    def test_guest_cannot_access_private_collection(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_collection/%s' % self.private_col_id,
                expected_status_int=404)

    def test_moderator_can_access_private_collection(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_owner_can_access_private_collection(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_play_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_logged_in_user_cannot_access_not_owned_private_collection(
        self
    ) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_collection/%s' % self.private_col_id,
                expected_status_int=404)
        self.logout()

    def test_cannot_access_collection_with_invalid_collection_id(self) -> None:
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
    published_col_id = 'col_id_1'
    private_col_id = 'col_id_2'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'collection_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_edit_collection
        def get(self, collection_id: str) -> None:
            self.render_json({'collection_id': collection_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_collection_editors([self.OWNER_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_edit_collection/<collection_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_collection(
            self.published_col_id, self.owner_id,
            exploration_id=self.published_col_id)
        self.save_new_valid_collection(
            self.private_col_id, self.owner_id,
            exploration_id=self.private_col_id)
        rights_manager.publish_collection(self.owner, self.published_col_id)

    def test_cannot_edit_collection_with_invalid_collection_id(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_collection/invalid_col_id', expected_status_int=404)
        self.logout()

    def test_guest_cannot_edit_collection_via_json_handler(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_collection/%s' % self.published_col_id,
                expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self) -> None:
        with self.swap(
            self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
            feconf.HANDLER_TYPE_HTML):
            response = self.mock_testapp.get(
                '/mock_edit_collection/%s' % self.published_col_id,
                expect_errors=True)
        self.assertEqual(response.status_int, 302)

    def test_normal_user_cannot_edit_collection(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_collection/%s' % self.private_col_id,
                expected_status_int=401)
        self.logout()

    def test_owner_can_edit_owned_collection(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_moderator_can_edit_private_collection(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_collection/%s' % self.private_col_id)

        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_moderator_can_edit_public_collection(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_collection/%s' % self.published_col_id)
        self.assertEqual(response['collection_id'], self.published_col_id)
        self.logout()

    def test_admin_can_edit_any_private_collection(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()


class ClassroomExistDecoratorTests(test_utils.GenericTestBase):
    """Tests for does_classroom_exist decorator"""

    class MockDataHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'classroom_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.does_classroom_exist
        def get(self, _: str) -> None:
            self.render_json({'success': True})

    class MockPageHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        URL_PATH_ARGS_SCHEMAS = {
            'classroom_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.does_classroom_exist
        def get(self, _: str) -> None:
            self.render_json('oppia-root.mainpage.html')

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        config_services.set_property(
            self.user_id_admin, 'classroom_pages_data', [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [],
                'course_details': '',
                'topic_list_intro': ''
            }])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_classroom_data/<classroom_url_fragment>',
                self.MockDataHandler),
            webapp2.Route(
                '/mock_classroom_page/<classroom_url_fragment>',
                self.MockPageHandler
            )],
            debug=feconf.DEBUG
        ))

    def test_any_user_can_access_a_valid_classroom(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_classroom_data/math', expected_status_int=200)

    def test_redirects_user_to_default_classroom_if_given_not_available(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_classroom_data/invalid', expected_status_int=404)

    def test_raises_error_if_return_type_is_not_json(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_html_response(
                '/mock_classroom_page/invalid', expected_status_int=500)


class CreateExplorationDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_create_exploration decorator."""

    username = 'banneduser'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_create_exploration
        def get(self) -> None:
            self.render_json({'success': True})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.mark_user_banned(self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/create', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_create_exploration(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/create', expected_status_int=401)
        self.logout()

    def test_normal_user_can_create_exploration(self) -> None:
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/create')
        self.assertTrue(response['success'])
        self.logout()

    def test_guest_cannot_create_exploration_via_json_handler(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/create', expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self) -> None:
        with self.swap(
            self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
            feconf.HANDLER_TYPE_HTML):
            response = self.mock_testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 302)


class CreateCollectionDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_create_collection decorator."""

    username = 'collectioneditor'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_create_collection
        def get(self) -> None:
            self.render_json({'success': True})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_collection_editors([self.username])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/create', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_create_collection_via_json_handler(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/create', expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self) -> None:
        with self.swap(
            self.MockHandler, 'GET_HANDLER_ERROR_RETURN_TYPE',
            feconf.HANDLER_TYPE_HTML):
            response = self.mock_testapp.get('/mock/create', expect_errors=True)
        self.assertEqual(response.status_int, 302)

    def test_normal_user_cannot_create_collection(self) -> None:
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/create', expected_status_int=401)
        self.logout()

    def test_collection_editor_can_create_collection(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/create')
        self.assertTrue(response['success'])
        self.logout()


class AccessCreatorDashboardTests(test_utils.GenericTestBase):
    """Tests for can_access_creator_dashboard decorator."""

    username = 'banneduser'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_creator_dashboard
        def get(self) -> None:
            self.render_json({'success': True})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.mark_user_banned(self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/access', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_access_editor_dashboard(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/access', expected_status_int=401)
        self.logout()

    def test_normal_user_can_access_editor_dashboard(self) -> None:
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/access')
        self.assertTrue(response['success'])
        self.logout()

    def test_guest_user_cannot_access_editor_dashboard(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/access', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class CommentOnFeedbackThreadTests(test_utils.GenericTestBase):
    """Tests for can_comment_on_feedback_thread decorator."""

    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'thread_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_comment_on_feedback_thread
        def get(self, thread_id: str) -> None:
            self.render_json({'thread_id': thread_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_cannot_comment_on_feedback_threads_with_disabled_exp_id(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % feconf.DISABLED_EXPLORATION_IDS[0],
                expected_status_int=404)
        self.logout()

    def test_viewer_cannot_comment_on_feedback_for_private_exploration(
        self
    ) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % self.private_exp_id, expected_status_int=401)
            self.assertEqual(
                response['error'], 'You do not have credentials to comment on '
                'exploration feedback.')
        self.logout()

    def test_cannot_comment_on_feedback_threads_with_invalid_thread_id(
        self
    ) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_comment_on_feedback_thread/invalid_thread_id',
                expected_status_int=400)
            self.assertEqual(response['error'], 'Not a valid thread id.')
        self.logout()

    def test_guest_cannot_comment_on_feedback_threads_via_json_handler(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.private_exp_id), expected_status_int=401)
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.published_exp_id), expected_status_int=401)

    def test_guest_is_redirected_when_using_html_handler(self) -> None:
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

    def test_owner_can_comment_on_feedback_for_private_exploration(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.private_exp_id))
        self.logout()

    def test_moderator_can_comment_on_feeback_for_public_exploration(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_comment_on_feedback_thread/exploration.%s.thread1'
                % (self.published_exp_id))
        self.logout()

    def test_moderator_can_comment_on_feeback_for_private_exploration(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_create_feedback_thread
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_cannot_create_feedback_threads_with_disabled_exp_id(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_create_feedback_thread/%s'
                % (feconf.DISABLED_EXPLORATION_IDS[0]), expected_status_int=404)

    def test_viewer_cannot_create_feedback_for_private_exploration(
        self
    ) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_create_feedback_thread/%s' % self.private_exp_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'], 'You do not have credentials to create '
                'exploration feedback.')
        self.logout()

    def test_guest_can_create_feedback_threads_for_public_exploration(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_create_feedback_thread/%s' % self.published_exp_id)

    def test_owner_cannot_create_feedback_for_private_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_create_feedback_thread/%s' % self.private_exp_id)
        self.logout()

    def test_moderator_can_create_feeback_for_public_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_create_feedback_thread/%s' % self.published_exp_id)
        self.logout()

    def test_moderator_can_create_feeback_for_private_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'thread_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_view_feedback_thread
        def get(self, thread_id: str) -> None:
            self.render_json({'thread_id': thread_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_cannot_view_feedback_threads_with_disabled_exp_id(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_feedback_thread/%s' % self.disabled_exp_thread_id,
                expected_status_int=404)

    def test_viewer_cannot_view_feedback_for_private_exploration(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_feedback_thread/%s' % self.private_exp_thread_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'], 'You do not have credentials to view '
                'exploration feedback.')
        self.logout()

    def test_viewer_cannot_view_feedback_threads_with_invalid_thread_id(
        self
    ) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_feedback_thread/invalid_thread_id',
                expected_status_int=400)
            self.assertEqual(response['error'], 'Not a valid thread id.')
        self.logout()

    def test_viewer_can_view_non_exploration_related_feedback(self) -> None:
        self.login(self.viewer_email)
        skill_thread_id = feedback_services.create_thread(
            'skill', 'skillid1', None, 'unused subject', 'unused text')
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_view_feedback_thread/%s' % skill_thread_id)

    def test_guest_can_view_feedback_threads_for_public_exploration(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_feedback_thread/%s' % self.public_exp_thread_id)

    def test_owner_cannot_view_feedback_for_private_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_feedback_thread/%s' % self.private_exp_thread_id)
        self.logout()

    def test_moderator_can_view_feeback_for_public_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_feedback_thread/%s' % self.public_exp_thread_id)
        self.logout()

    def test_moderator_can_view_feeback_for_private_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_feedback_thread/%s' % self.private_exp_thread_id)
        self.logout()


class ManageEmailDashboardTests(test_utils.GenericTestBase):
    """Tests for can_manage_email_dashboard decorator."""

    query_id = 'query_id'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'query_id': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
            'GET': {},
            'PUT': {}
        }

        @acl_decorators.can_manage_email_dashboard
        def get(self) -> None:
            self.render_json({'success': 1})

        @acl_decorators.can_manage_email_dashboard
        def put(self, query_id: str) -> None:
            return self.render_json({'query_id': query_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [
                webapp2.Route('/mock/', self.MockHandler),
                webapp2.Route('/mock/<query_id>', self.MockHandler)
            ],
            debug=feconf.DEBUG,
        ))

    def test_moderator_cannot_access_email_dashboard(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_super_admin_can_access_email_dashboard(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.mock_testapp.put('/mock/%s' % self.query_id)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_error_when_user_is_not_logged_in(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class RateExplorationTests(test_utils.GenericTestBase):
    """Tests for can_rate_exploration decorator."""

    username = 'user'
    user_email = 'user@example.com'
    exp_id = 'exp_id'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_rate_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_give_rating(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.exp_id, expected_status_int=401)

    def test_normal_user_can_give_rating(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.exp_id)
        self.assertEqual(response['exploration_id'], self.exp_id)
        self.logout()


class AccessModeratorPageTests(test_utils.GenericTestBase):
    """Tests for can_access_moderator_page decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_moderator_page
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_access_moderator_page(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_moderator_can_access_moderator_page(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()

    def test_guest_cannot_access_moderator_page(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class FlagExplorationTests(test_utils.GenericTestBase):
    """Tests for can_flag_exploration decorator."""

    username = 'user'
    user_email = 'user@example.com'
    exp_id = 'exp_id'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_flag_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_flag_exploration(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.exp_id, expected_status_int=401)

    def test_normal_user_can_flag_exploration(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.exp_id)
        self.assertEqual(response['exploration_id'], self.exp_id)
        self.logout()


class SubscriptionToUsersTests(test_utils.GenericTestBase):
    """Tests for can_subscribe_to_users decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_subscribe_to_users
        def get(self) -> None:
            self.render_json({'success': True})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_subscribe_to_users(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)

    def test_normal_user_can_subscribe_to_users(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertTrue(response['success'])
        self.logout()


class SendModeratorEmailsTests(test_utils.GenericTestBase):
    """Tests for can_send_moderator_emails decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_send_moderator_emails
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_send_moderator_emails(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_moderator_can_send_moderator_emails(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()

    def test_guest_cannot_send_moderator_emails(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class CanAccessReleaseCoordinatorPageDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_access_release_coordinator_page decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_release_coordinator_page
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(feconf.SYSTEM_EMAIL_ADDRESS, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)

        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/release-coordinator', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_access_release_coordinator_page(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/release-coordinator', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to access release coordinator page.')
        self.logout()

    def test_guest_user_cannot_access_release_coordinator_page(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/release-coordinator', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')
        self.logout()

    def test_super_admin_cannot_access_release_coordinator_page(self) -> None:
        self.login(feconf.SYSTEM_EMAIL_ADDRESS)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/release-coordinator', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to access release coordinator page.')
        self.logout()

    def test_release_coordinator_can_access_release_coordinator_page(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/release-coordinator')

        self.assertEqual(response['success'], 1)
        self.logout()


class CanAccessBlogAdminPageDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_access_blog_admin_page decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_blog_admin_page
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)
        self.signup(self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)

        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/blog-admin', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_access_blog_admin_page(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/blog-admin', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to access blog admin page.')
        self.logout()

    def test_guest_user_cannot_access_blog_admin_page(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/blog-admin', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')
        self.logout()

    def test_blog_post_editor_cannot_access_blog_admin_page(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/blog-admin', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to access blog admin page.')
        self.logout()

    def test_blog_admin_can_access_blog_admin_page(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/blog-admin')

        self.assertEqual(response['success'], 1)
        self.logout()


class CanManageBlogPostEditorsDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_manage_blog_post_editors decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_manage_blog_post_editors
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)
        self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.signup(self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)

        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/blogadminrolehandler', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_manage_blog_post_editors(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/blogadminrolehandler', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to add or remove blog post editors.')
        self.logout()

    def test_guest_user_cannot_manage_blog_post_editors(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/blogadminrolehandler', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')
        self.logout()

    def test_blog_post_editors_cannot_manage_blog_post_editors(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/blogadminrolehandler', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to add or remove blog post editors.')
        self.logout()

    def test_blog_admin_can_manage_blog_editors(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/blogadminrolehandler')

        self.assertEqual(response['success'], 1)
        self.logout()


class CanAccessBlogDashboardDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_access_blog_dashboard decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_blog_dashboard
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)

        self.signup(self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)

        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)

        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/blog-dashboard', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_access_blog_dashboard(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/blog-dashboard', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to access blog dashboard page.')
        self.logout()

    def test_guest_user_cannot_access_blog_dashboard(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/blog-dashboard', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')
        self.logout()

    def test_blog_editors_can_access_blog_dashboard(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/blog-dashboard')

        self.assertEqual(response['success'], 1)
        self.logout()

    def test_blog_admins_can_access_blog_dashboard(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/blog-dashboard')

        self.assertEqual(response['success'], 1)
        self.logout()


class CanDeleteBlogPostTests(test_utils.GenericTestBase):
    """Tests for can_delete_blog_post decorator."""

    username = 'userone'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'blog_post_id': {
                'schema': {
                    'type': 'unicode'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_delete_blog_post
        def get(self, blog_post_id: str) -> None:
            self.render_json({'blog_id': blog_post_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)

        self.signup(self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)

        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.add_user_role(self.username, feconf.ROLE_ID_BLOG_POST_EDITOR)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_delete_blog_post/<blog_post_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.user_id = self.get_user_id_from_email(self.user_email)
        self.blog_editor_id = (
            self.get_user_id_from_email(self.BLOG_EDITOR_EMAIL))
        blog_post = blog_services.create_new_blog_post(self.blog_editor_id)
        self.blog_post_id = blog_post.id

    def test_guest_cannot_delete_blog_post(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_blog_post/%s' % self.blog_post_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_blog_editor_can_delete_owned_blog_post(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_blog_post/%s' % self.blog_post_id)
        self.assertEqual(response['blog_id'], self.blog_post_id)
        self.logout()

    def test_blog_admin_can_delete_any_blog_post(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_blog_post/%s' % self.blog_post_id)
        self.assertEqual(response['blog_id'], self.blog_post_id)
        self.logout()

    def test_blog_editor_cannot_delete_not_owned_blog_post(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_blog_post/%s' % self.blog_post_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'],
                'User %s does not have permissions to delete blog post %s'
                % (self.user_id, self.blog_post_id))
        self.logout()

    def test_error_with_invalid_blog_post_id(self) -> None:
        self.login(self.user_email)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        blog_post_rights_swap = self.swap_to_always_return(
            blog_services, 'get_blog_post_rights', value=None)
        with testapp_swap, blog_post_rights_swap:
            response = self.get_json(
                '/mock_delete_blog_post/%s' % self.blog_post_id,
                expected_status_int=404)
        error_msg = (
            'Could not find the page '
            'http://localhost/mock_delete_blog_post/%s.' % self.blog_post_id
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()


class CanEditBlogPostTests(test_utils.GenericTestBase):
    """Tests for can_edit_blog_post decorator."""

    username = 'userone'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'blog_post_id': {
                'schema': {
                    'type': 'unicode'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_edit_blog_post
        def get(self, blog_post_id: str) -> None:
            self.render_json({'blog_id': blog_post_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)

        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.add_user_role(self.username, feconf.ROLE_ID_BLOG_POST_EDITOR)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_edit_blog_post/<blog_post_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

        self.blog_editor_id = self.get_user_id_from_email(
            self.BLOG_EDITOR_EMAIL)
        self.user_id = self.get_user_id_from_email(self.user_email)
        blog_post = blog_services.create_new_blog_post(self.blog_editor_id)
        self.blog_post_id = blog_post.id

    def test_guest_cannot_edit_blog_post(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_blog_post/%s' % self.blog_post_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_blog_editor_can_edit_owned_blog_post(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_blog_post/%s' % self.blog_post_id)
        self.assertEqual(response['blog_id'], self.blog_post_id)
        self.logout()

    def test_blog_admin_can_edit_any_blog_post(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_blog_post/%s' % self.blog_post_id)
        self.assertEqual(response['blog_id'], self.blog_post_id)
        self.logout()

    def test_blog_editor_cannot_edit_not_owned_blog_post(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_blog_post/%s' % self.blog_post_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'],
                'User %s does not have permissions to edit blog post %s'
                % (self.user_id, self.blog_post_id))
        self.logout()

    def test_error_with_invalid_blog_post_id(self) -> None:
        self.login(self.user_email)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        blog_post_rights_swap = self.swap_to_always_return(
            blog_services, 'get_blog_post_rights', value=None)
        with testapp_swap, blog_post_rights_swap:
            response = self.get_json(
                '/mock_edit_blog_post/%s' % self.blog_post_id,
                expected_status_int=404)
        error_msg = (
            'Could not find the page '
            'http://localhost/mock_edit_blog_post/%s.' % self.blog_post_id
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()


class CanRunAnyJobDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_run_any_job decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_run_any_job
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(feconf.SYSTEM_EMAIL_ADDRESS, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)

        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/run-anny-job', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_access_release_coordinator_page(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/run-anny-job', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to run jobs.')
        self.logout()

    def test_guest_user_cannot_access_release_coordinator_page(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/run-anny-job', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')
        self.logout()

    def test_super_admin_cannot_access_release_coordinator_page(self) -> None:
        self.login(feconf.SYSTEM_EMAIL_ADDRESS)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/run-anny-job', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to run jobs.')
        self.logout()

    def test_release_coordinator_can_run_any_job(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/run-anny-job')

        self.assertEqual(response['success'], 1)
        self.logout()


class CanManageMemcacheDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_manage_memcache decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_manage_memcache
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(feconf.SYSTEM_EMAIL_ADDRESS, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)

        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/manage-memcache', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_access_release_coordinator_page(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/manage-memcache', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to manage memcache.')
        self.logout()

    def test_guest_user_cannot_access_release_coordinator_page(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/manage-memcache', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')
        self.logout()

    def test_super_admin_cannot_access_release_coordinator_page(self) -> None:
        self.login(feconf.SYSTEM_EMAIL_ADDRESS)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/manage-memcache', expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to manage memcache.')
        self.logout()

    def test_release_coordinator_can_run_any_job(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/manage-memcache')

        self.assertEqual(response['success'], 1)
        self.logout()


class CanManageContributorsRoleDecoratorTests(test_utils.GenericTestBase):
    """Tests for can_manage_contributors_role decorator."""

    username = 'user'
    user_email = 'user@example.com'
    QUESTION_ADMIN_EMAIL: Final = 'questionExpert@app.com'
    QUESTION_ADMIN_USERNAME: Final = 'questionExpert'
    TRANSLATION_ADMIN_EMAIL: Final = 'translatorExpert@app.com'
    TRANSLATION_ADMIN_USERNAME: Final = 'translationExpert'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'category': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_manage_contributors_role
        def get(self, unused_category: str) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)

        self.signup(
            self.TRANSLATION_ADMIN_EMAIL, self.TRANSLATION_ADMIN_USERNAME)
        self.signup(self.QUESTION_ADMIN_EMAIL, self.QUESTION_ADMIN_USERNAME)

        self.add_user_role(
            self.TRANSLATION_ADMIN_USERNAME, feconf.ROLE_ID_TRANSLATION_ADMIN)

        self.add_user_role(
            self.QUESTION_ADMIN_USERNAME, feconf.ROLE_ID_QUESTION_ADMIN)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication([
            webapp2.Route(
                '/can_manage_contributors_role/<category>', self.MockHandler)
            ], debug=feconf.DEBUG))

    def test_normal_user_cannot_access_release_coordinator_page(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/can_manage_contributors_role/translation',
                expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to modify contributor\'s role.')
        self.logout()

    def test_guest_user_cannot_manage_contributors_role(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/can_manage_contributors_role/translation',
                expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')
        self.logout()

    def test_translation_admin_can_manage_translation_role(self) -> None:
        self.login(self.TRANSLATION_ADMIN_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/can_manage_contributors_role/translation')

        self.assertEqual(response['success'], 1)
        self.logout()

    def test_translation_admin_cannot_manage_question_role(self) -> None:
        self.login(self.TRANSLATION_ADMIN_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/can_manage_contributors_role/question',
                expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to modify contributor\'s role.')
        self.logout()

    def test_question_admin_can_manage_question_role(self) -> None:
        self.login(self.QUESTION_ADMIN_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/can_manage_contributors_role/question')

        self.assertEqual(response['success'], 1)
        self.logout()

    def test_question_admin_cannot_manage_translation_role(self) -> None:
        self.login(self.QUESTION_ADMIN_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/can_manage_contributors_role/translation',
                expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You do not have credentials to modify contributor\'s role.')
        self.logout()

    def test_invalid_category_raise_error(self) -> None:
        self.login(self.QUESTION_ADMIN_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/can_manage_contributors_role/invalid',
                expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid category: invalid')
        self.logout()


class DeleteAnyUserTests(test_utils.GenericTestBase):
    """Tests for can_delete_any_user decorator."""

    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_delete_any_user
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(feconf.SYSTEM_EMAIL_ADDRESS, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_normal_user_cannot_delete_any_user(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_not_logged_user_cannot_delete_any_user(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)

    def test_primary_admin_can_delete_any_user(self) -> None:
        self.login(feconf.SYSTEM_EMAIL_ADDRESS)
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_voiceover_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.signup(self.banned_user_email, self.banned_username)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.voiceover_admin_id = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.mark_user_banned(self.banned_username)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.add_user_role(
            self.VOICEOVER_ADMIN_USERNAME, feconf.ROLE_ID_VOICEOVER_ADMIN)
        self.voiceover_admin = user_services.get_user_actions_info(
            self.voiceover_admin_id)
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
            self.voiceover_admin, self.published_exp_id_1, self.voice_artist_id,
            self.role)

    def test_banned_user_cannot_voiceover_exploration(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)
        self.logout()

    def test_owner_can_voiceover_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_moderator_can_voiceover_public_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id_1)
        self.assertEqual(response['exploration_id'], self.published_exp_id_1)
        self.logout()

    def test_moderator_can_voiceover_private_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)

        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_admin_can_voiceover_private_exploration(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_voice_artist_can_only_voiceover_assigned_public_exploration(
        self
    ) -> None:
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

    def test_user_without_voice_artist_role_of_exploration_cannot_voiceover_public_exploration(  # pylint: disable=line-too-long
        self
    ) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.published_exp_id_1, expected_status_int=401)
        self.logout()

    def test_user_without_voice_artist_role_of_exploration_cannot_voiceover_private_exploration(  # pylint: disable=line-too-long
        self
    ) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)
        self.logout()

    def test_guest_cannot_voiceover_exploration(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)

    def test_error_with_invalid_voiceover_exploration_id(self) -> None:
        self.login(self.user_email)
        invalid_id = 'invalid'
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % invalid_id, expected_status_int=404)
        error_msg = (
            'Could not find the page http://localhost/mock/%s.' % invalid_id)
        self.assertEqual(response['error'], error_msg)
        self.logout()


class VoiceArtistManagementTests(test_utils.GenericTestBase):
    """Tests for can_add_voice_artist and can_remove_voice_artist decorator."""

    role = rights_domain.ROLE_VOICE_ARTIST
    username = 'user'
    user_email = 'user@example.com'
    banned_username = 'banneduser'
    banned_user_email = 'banneduser@example.com'
    published_exp_id_1 = 'exp_1'
    published_exp_id_2 = 'exp_2'
    private_exp_id_1 = 'exp_3'
    private_exp_id_2 = 'exp_4'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'entity_type': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'entity_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
            'POST': {},
            'DELETE': {}
        }

        @acl_decorators.can_add_voice_artist
        def post(self, entity_type: str, entity_id: str) -> None:
            self.render_json({
                'entity_type': entity_type,
                'entity_id': entity_id
            })

        @acl_decorators.can_remove_voice_artist
        def delete(self, entity_type: str, entity_id: str) -> None:
            self.render_json({
                'entity_type': entity_type,
                'entity_id': entity_id
            })

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.signup(self.banned_user_email, self.banned_username)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.voiceover_admin_id = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.mark_user_banned(self.banned_username)
        user_services.add_user_role(
            self.voiceover_admin_id, feconf.ROLE_ID_VOICEOVER_ADMIN)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.voiceover_admin = user_services.get_user_actions_info(
            self.voiceover_admin_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock/<entity_type>/<entity_id>', self.MockHandler)],
            debug=feconf.DEBUG,))
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
            self.voiceover_admin, self.published_exp_id_1, self.voice_artist_id,
            self.role)

    def test_voiceover_admin_can_add_voice_artist_to_public_exp(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/mock/exploration/%s' % self.published_exp_id_1,
                {}, csrf_token=csrf_token)
        self.logout()

    def test_voiceover_admin_can_remove_voice_artist_from_public_exp(
        self
    ) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.delete_json(
                '/mock/exploration/%s' % self.published_exp_id_1, {})
        self.logout()

    def test_adding_voice_artist_to_unsupported_entity_type_raises_400(
        self
    ) -> None:
        unsupported_entity_type = 'topic'
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.post_json(
                '/mock/%s/abc' % unsupported_entity_type,
                {}, csrf_token=csrf_token, expected_status_int=400)
            self.assertEqual(
                response['error'],
                'Unsupported entity_type: topic')
        self.logout()

    def test_removing_voice_artist_from_unsupported_entity_type_raises_400(
        self
    ) -> None:
        unsupported_entity_type = 'topic'
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.delete_json(
                '/mock/%s/abc' % unsupported_entity_type,
                {}, expected_status_int=400
            )
            self.assertEqual(
                response['error'],
                'Unsupported entity_type: topic')
        self.logout()

    def test_voiceover_admin_cannot_add_voice_artist_to_private_exp(
        self
    ) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.post_json(
                '/mock/exploration/%s' % self.private_exp_id_1, {},
                csrf_token=csrf_token, expected_status_int=400
            )
            self.assertEqual(
                response['error'],
                'Could not assign voice artist to private activity.')
        self.logout()

    def test_voiceover_admin_can_remove_voice_artist_from_private_exp(
        self
    ) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.delete_json('/mock/exploration/%s' % self.private_exp_id_1, {})
        self.logout()

    def test_owner_cannot_add_voice_artist_to_public_exp(self) -> None:
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.post_json(
                '/mock/exploration/%s' % self.published_exp_id_1, {},
                csrf_token=csrf_token, expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have credentials to manage voice artists.')
        self.logout()

    def test_owner_cannot_remove_voice_artist_in_public_exp(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.delete_json(
                '/mock/exploration/%s' % self.private_exp_id_1, {},
                expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have credentials to manage voice artists.')
        self.logout()

    def test_random_user_cannot_add_voice_artist_to_public_exp(self) -> None:
        self.login(self.user_email)
        csrf_token = self.get_new_csrf_token()
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.post_json(
                '/mock/exploration/%s' % self.published_exp_id_1, {},
                csrf_token=csrf_token, expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have credentials to manage voice artists.')
        self.logout()

    def test_random_user_cannot_remove_voice_artist_from_public_exp(
        self
    ) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.delete_json(
                '/mock/exploration/%s' % self.published_exp_id_1, {},
                expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have credentials to manage voice artists.')
        self.logout()

    def test_voiceover_admin_cannot_add_voice_artist_to_invalid_exp(
        self
    ) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/mock/exploration/invalid_exp_id', {},
                csrf_token=csrf_token, expected_status_int=404)
        self.logout()

    def test_voiceover_admin_cannot_remove_voice_artist_to_invalid_exp(
        self
    ) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.delete_json(
                '/mock/exploration/invalid_exp_id', {},
                expected_status_int=404)
        self.logout()

    def test_voiceover_admin_cannot_add_voice_artist_without_login(
        self
    ) -> None:
        csrf_token = self.get_new_csrf_token()
        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/mock/exploration/%s' % self.private_exp_id_1, {},
                csrf_token=csrf_token, expected_status_int=401)

    def test_voiceover_admin_cannot_remove_voice_artist_without_login(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.delete_json(
                '/mock/exploration/%s' % self.private_exp_id_1, {},
                expected_status_int=401)


class EditExplorationTests(test_utils.GenericTestBase):
    """Tests for can_edit_exploration decorator."""

    username = 'banneduser'
    user_email = 'user@example.com'
    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_edit_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.mark_user_banned(self.username)
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_cannot_edit_exploration_with_invalid_exp_id(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_exploration/invalid_exp_id',
                expected_status_int=404)
        self.logout()

    def test_banned_user_cannot_edit_exploration(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_exploration/%s' % self.private_exp_id,
                expected_status_int=401)
        self.logout()

    def test_owner_can_edit_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_moderator_can_edit_public_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_exploration/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)
        self.logout()

    def test_moderator_can_edit_private_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_exploration/%s' % self.private_exp_id)

        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_admin_can_edit_private_exploration(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_guest_cannot_cannot_edit_exploration(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_exploration/%s' % self.private_exp_id,
                expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class ManageOwnAccountTests(test_utils.GenericTestBase):
    """Tests for decorator can_manage_own_account."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'
    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_manage_own_account
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.banned_user_email, self.banned_user)
        self.signup(self.user_email, self.username)
        self.mark_user_banned(self.banned_user)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_update_preferences(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_normal_user_can_manage_preferences(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()

    def test_guest_cannot_update_preferences(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class AccessAdminPageTests(test_utils.GenericTestBase):
    """Tests for decorator can_access_admin_page."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'
    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_admin_page
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.banned_user_email, self.banned_user)
        self.signup(self.user_email, self.username)
        self.mark_user_banned(self.banned_user)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_access_admin_page(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/', expected_status_int=401)
        self.logout()

    def test_normal_user_cannot_access_admin_page(self) -> None:
        self.login(self.user_email)
        user_id = user_services.get_user_id_from_username(self.username)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = '%s is not a super admin of this application' % user_id
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_super_admin_can_access_admin_page(self) -> None:
        self.login(self.user_email, is_super_admin=True)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()

    def test_guest_cannot_access_admin_page(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class AccessContributorDashboardAdminPageTests(test_utils.GenericTestBase):
    """Tests for decorator can_access_contributor_dashboard_admin_page."""

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'
    username = 'user'
    user_email = 'user@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_contributor_dashboard_admin_page
        def get(self) -> None:
            self.render_json({'success': 1})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.banned_user_email, self.banned_user)
        self.signup(self.user_email, self.username)
        self.mark_user_banned(self.banned_user)
        self.user = user_services.get_user_actions_info(
            user_services.get_user_id_from_username(self.username))
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_access_contributor_dashboard_admin_page(
        self
    ) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = (
            'You do not have credentials to access contributor dashboard '
            'admin page.'
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_question_admin_can_access_contributor_dashboard_admin_page(
        self
    ) -> None:
        self.add_user_role(
            self.username, feconf.ROLE_ID_QUESTION_ADMIN)
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertEqual(response['success'], 1)
        self.logout()

    def test_guest_cannot_access_contributor_dashboard_admin_page(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)

    def test_normal_user_cannot_access_contributor_dashboard_admin_page(
        self
    ) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = (
            'You do not have credentials to access contributor dashboard '
            'admin page.'
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()


class UploadExplorationTests(test_utils.GenericTestBase):
    """Tests for can_upload_exploration decorator."""

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_upload_exploration
        def get(self) -> None:
            self.render_json({})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_upload_exploration/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_super_admin_can_upload_explorations(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_upload_exploration/')
        self.logout()

    def test_normal_user_cannot_upload_explorations(self) -> None:
        self.login(self.EDITOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_upload_exploration/', expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You do not have credentials to upload explorations.')
        self.logout()

    def test_guest_cannot_upload_explorations(self) -> None:
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_delete_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_guest_cannot_delete_exploration(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_exploration/%s' % self.private_exp_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_owner_can_delete_owned_private_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_moderator_can_delete_published_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_exploration/%s' % self.published_exp_id)
        self.assertEqual(response['exploration_id'], self.published_exp_id)
        self.logout()

    def test_owner_cannot_delete_published_exploration(self) -> None:
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

    def test_moderator_can_delete_private_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_exploration/%s' % self.private_exp_id)

        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()


class SuggestChangesToExplorationTests(test_utils.GenericTestBase):
    """Tests for can_suggest_changes_to_exploration decorator."""

    username = 'user'
    user_email = 'user@example.com'
    banned_username = 'banneduser'
    banned_user_email = 'banned@example.com'
    exploration_id = 'exp_id'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_suggest_changes_to_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)
        self.signup(self.banned_user_email, self.banned_username)
        self.mark_user_banned(self.banned_username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_suggest_changes(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.exploration_id, expected_status_int=401)
        self.logout()

    def test_normal_user_can_suggest_changes(self) -> None:
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_suggest_changes
        def get(self) -> None:
            self.render_json({})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.username)
        self.signup(self.banned_user_email, self.banned_username)
        self.mark_user_banned(self.banned_username)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_suggest_changes(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock', expected_status_int=401)
        self.logout()

    def test_normal_user_can_suggest_changes(self) -> None:
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
    TARGET_TYPE: Final = 'exploration'
    SUGGESTION_TYPE: Final = 'edit_exploration_state_content'
    exploration_id = 'exp_id'
    target_version_id = 1
    change_dict = {
        'cmd': 'edit_state_property',
        'property_name': 'content',
        'state_name': 'Introduction',
        'new_value': ''
    }

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'suggestion_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_resubmit_suggestion
        def get(self, suggestion_id: str) -> None:
            self.render_json({'suggestion_id': suggestion_id})

    def setUp(self) -> None:
        super().setUp()
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

    def test_author_can_resubmit_suggestion(self) -> None:
        self.login(self.author_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.suggestion_id)
        self.assertEqual(response['suggestion_id'], self.suggestion_id)
        self.logout()

    def test_non_author_cannot_resubmit_suggestion(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.suggestion_id, expected_status_int=401)
        self.logout()

    def test_error_with_invalid_suggestion_id(self) -> None:
        invalid_id = 'invalid'
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % invalid_id, expected_status_int=400)
        error_msg = 'No suggestion found with given suggestion id'
        self.assertEqual(response['error'], error_msg)
        self.logout()


class DecoratorForAcceptingSuggestionTests(test_utils.GenericTestBase):
    """Tests for get_decorator_for_accepting_suggestion decorator."""

    AUTHOR_USERNAME: Final = 'author'
    AUTHOR_EMAIL: Final = 'author@example.com'
    TARGET_TYPE: Final = feconf.ENTITY_TYPE_EXPLORATION
    SUGGESTION_TYPE_1: Final = feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT
    SUGGESTION_TYPE_2: Final = feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
    SUGGESTION_TYPE_3: Final = feconf.SUGGESTION_TYPE_ADD_QUESTION
    EXPLORATION_ID: Final = 'exp_id'
    SKILL_ID: Final = 'skill_id'
    TARGET_VERSION_ID: Final = 1
    CHANGE_DICT_1: Final = {
        'cmd': 'edit_state_property',
        'property_name': 'content',
        'state_name': 'Introduction',
        'new_value': ''
    }
    CHANGE_DICT_2: Final = {
        'cmd': 'add_written_translation',
        'state_name': 'Introduction',
        'language_code': constants.DEFAULT_LANGUAGE_CODE,
        'content_id': feconf.DEFAULT_NEW_STATE_CONTENT_ID,
        'content_html': '',
        'translation_html': '',
        'data_format': 'html'
    }

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'suggestion_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'target_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        # Here we use MyPy ignore because the signature of 'get' method does not
        # match with the signature of super class's (BaseHandler) 'get' method.
        @acl_decorators.get_decorator_for_accepting_suggestion(
            acl_decorators.open_access)  # type: ignore[override]
        def get(self, target_id: str, suggestion_id: str) -> None:
            self.render_json({
                'target_id': target_id,
                'suggestion_id': suggestion_id
            })

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, self.AUTHOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_accept_suggestion/<target_id>/<suggestion_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        change_dict: Dict[
            str, Union[str, question_domain.QuestionDict, float]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': (
                    self._create_valid_question_data('default_state').to_dict()
                ),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'version': 44,
                'id': ''
            },
            'skill_id': self.SKILL_ID,
            'skill_difficulty': 0.3
        }
        self.save_new_default_exploration(self.EXPLORATION_ID, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.EXPLORATION_ID)
        self.save_new_skill(self.SKILL_ID, self.author_id)
        self.suggestion_1 = suggestion_services.create_suggestion(
            self.SUGGESTION_TYPE_1, self.TARGET_TYPE,
            self.EXPLORATION_ID, self.TARGET_VERSION_ID,
            self.author_id,
            self.CHANGE_DICT_1, '')
        self.suggestion_2 = suggestion_services.create_suggestion(
            self.SUGGESTION_TYPE_2, self.TARGET_TYPE,
            self.EXPLORATION_ID, self.TARGET_VERSION_ID,
            self.author_id,
            self.CHANGE_DICT_2, '')
        self.suggestion_3 = suggestion_services.create_suggestion(
            self.SUGGESTION_TYPE_3, self.TARGET_TYPE,
            self.EXPLORATION_ID, self.TARGET_VERSION_ID,
            self.author_id,
            change_dict, '')
        self.suggestion_id_1 = self.suggestion_1.suggestion_id
        self.suggestion_id_2 = self.suggestion_2.suggestion_id
        self.suggestion_id_3 = self.suggestion_3.suggestion_id

    def test_guest_cannot_accept_suggestion(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, self.suggestion_id_1),
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_owner_can_accept_suggestion(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, self.suggestion_id_1))
        self.assertEqual(response['suggestion_id'], self.suggestion_id_1)
        self.assertEqual(response['target_id'], self.EXPLORATION_ID)
        self.logout()

    def test_user_with_review_rights_can_accept_suggestion(self) -> None:
        self.login(self.EDITOR_EMAIL)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        review_swap = self.swap_to_always_return(
            suggestion_services, 'can_user_review_category', value=True)
        with testapp_swap, review_swap:
            response = self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, self.suggestion_id_1))
        self.assertEqual(response['suggestion_id'], self.suggestion_id_1)
        self.assertEqual(response['target_id'], self.EXPLORATION_ID)
        self.logout()

    def test_user_with_review_rights_can_accept_translation_suggestion(
        self
    ) -> None:
        self.login(self.EDITOR_EMAIL)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        translation_review_swap = self.swap_to_always_return(
            user_services, 'can_review_translation_suggestions', value=True)
        with testapp_swap, translation_review_swap:
            response = self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, self.suggestion_id_2))
        self.assertEqual(response['suggestion_id'], self.suggestion_id_2)
        self.assertEqual(response['target_id'], self.EXPLORATION_ID)
        self.logout()

    def test_user_with_review_rights_can_accept_question_suggestion(
        self
    ) -> None:
        self.login(self.EDITOR_EMAIL)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        question_review_swap = self.swap_to_always_return(
            user_services, 'can_review_question_suggestions', value=True)
        with testapp_swap, question_review_swap:
            response = self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, self.suggestion_id_3))
        self.assertEqual(response['suggestion_id'], self.suggestion_id_3)
        self.assertEqual(response['target_id'], self.EXPLORATION_ID)
        self.logout()

    def test_curriculum_admin_can_accept_suggestions(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, self.suggestion_id_1))
        self.assertEqual(response['suggestion_id'], self.suggestion_id_1)
        self.assertEqual(response['target_id'], self.EXPLORATION_ID)
        self.logout()

    def test_error_when_format_of_suggestion_id_is_invalid(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, 'invalid_suggestion_id'),
                expected_status_int=400)
        error_msg = (
            'Invalid format for suggestion_id.'
            ' It must contain 3 parts separated by \'.\''
        )
        self.assertEqual(response['error'], error_msg)

    def test_page_not_found_exception_when_suggestion_id_is_invalid(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_accept_suggestion/%s/%s'
                % (self.EXPLORATION_ID, 'invalid.suggestion.id'),
                expected_status_int=404)


class ViewReviewableSuggestionsTests(test_utils.GenericTestBase):
    """Tests for can_view_reviewable_suggestions decorator."""

    TARGET_TYPE = feconf.ENTITY_TYPE_EXPLORATION

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'target_type': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'suggestion_type': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_view_reviewable_suggestions
        def get(self, target_type: str, suggestion_type: str) -> None:
            self.render_json({
                'target_type': target_type,
                'suggestion_type': suggestion_type
            })

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_review_suggestion/<target_type>/<suggestion_type>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_review_suggestion(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_review_suggestion/%s/%s' % (
                    self.TARGET_TYPE, feconf.SUGGESTION_TYPE_ADD_QUESTION),
                expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)

    def test_error_when_suggestion_type_is_invalid(self) -> None:
        self.login(self.VIEWER_EMAIL)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        with testapp_swap:
            response = self.get_json(
                '/mock_review_suggestion/%s/%s' % (
                    self.TARGET_TYPE, 'invalid'),
                expected_status_int=404)
        error_msg = (
            'Could not find the page http://localhost/'
            'mock_review_suggestion/%s/%s.' % (self.TARGET_TYPE, 'invalid')
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_user_with_review_rights_can_review_translation_suggestions(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        translation_review_swap = self.swap_to_always_return(
            user_services, 'can_review_translation_suggestions', value=True)
        with testapp_swap, translation_review_swap:
            response = self.get_json(
                '/mock_review_suggestion/%s/%s' % (
                    self.TARGET_TYPE, feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT))
        self.assertEqual(response['target_type'], self.TARGET_TYPE)
        self.assertEqual(
            response['suggestion_type'],
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
        )
        self.logout()

    def test_user_with_review_rights_can_review_question_suggestions(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        question_review_swap = self.swap_to_always_return(
            user_services, 'can_review_question_suggestions', value=True)
        with testapp_swap, question_review_swap:
            response = self.get_json(
                '/mock_review_suggestion/%s/%s' % (
                    self.TARGET_TYPE, feconf.SUGGESTION_TYPE_ADD_QUESTION))
        self.assertEqual(response['target_type'], self.TARGET_TYPE)
        self.assertEqual(
            response['suggestion_type'],
            feconf.SUGGESTION_TYPE_ADD_QUESTION
        )
        self.logout()

    def test_user_without_review_rights_cannot_review_question_suggestions(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        question_review_swap = self.swap_to_always_return(
            user_services, 'can_review_question_suggestions', value=False)
        with testapp_swap, question_review_swap:
            response = self.get_json(
                '/mock_review_suggestion/%s/%s' % (
                    self.TARGET_TYPE, feconf.SUGGESTION_TYPE_ADD_QUESTION
                ),
                expected_status_int=500
            )
        self.assertEqual(
            'User with user_id: %s is not allowed to review '
            'question suggestions.' % user_id,
            response['error']
        )
        self.logout()

    def test_user_without_review_rights_cannot_review_translation_suggestions(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        translation_review_swap = self.swap_to_always_return(
            user_services, 'can_review_translation_suggestions', value=False)
        with testapp_swap, translation_review_swap:
            response = self.get_json(
                '/mock_review_suggestion/%s/%s' % (
                    self.TARGET_TYPE, feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                ),
                expected_status_int=500
            )
        self.assertEqual(
            'User with user_id: %s is not allowed to review '
            'translation suggestions.' % user_id,
            response['error']
        )
        self.logout()


class PublishExplorationTests(test_utils.GenericTestBase):
    """Tests for can_publish_exploration decorator."""

    private_exp_id = 'exp_0'
    public_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_publish_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_cannot_publish_exploration_with_invalid_exp_id(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_publish_exploration/invalid_exp_id',
                expected_status_int=404)
        self.logout()

    def test_owner_can_publish_owned_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_publish_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_already_published_exploration_cannot_be_published(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_publish_exploration/%s' % self.public_exp_id,
                expected_status_int=401)
        self.logout()

    def test_moderator_cannot_publish_private_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_publish_exploration/%s' % self.private_exp_id,
                expected_status_int=401)
        self.logout()

    def test_admin_can_publish_any_exploration(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_publish_exploration/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)


class ModifyExplorationRolesTests(test_utils.GenericTestBase):
    """Tests for can_modify_exploration_roles decorator."""

    private_exp_id = 'exp_0'
    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_modify_exploration_roles
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.banned_user_email, self.banned_user)
        self.mark_user_banned(self.banned_user)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<exploration_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)

    def test_banned_user_cannot_modify_exploration_roles(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % self.private_exp_id, expected_status_int=401)
        error_msg = (
            'You do not have credentials to change rights '
            'for this exploration.'
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_owner_can_modify_exploration_roles(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id)
        self.assertEqual(response['exploration_id'], self.private_exp_id)
        self.logout()

    def test_moderator_can_modify_roles_of_unowned_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock/%s' % self.private_exp_id)
        self.logout()

    def test_admin_can_modify_roles_of_any_exploration(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
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

    class MockPublishHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'collection_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_publish_collection
        def get(self, collection_id: str) -> None:
            return self.render_json({'collection_id': collection_id})

    class MockUnpublishHandler(
        base.BaseHandler[Dict[str, str], Dict[str, str]]
    ):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'collection_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_unpublish_collection
        def get(self, collection_id: str) -> None:
            return self.render_json({'collection_id': collection_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_collection_editors([self.OWNER_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_cannot_publish_collection_with_invalid_exp_id(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_publish_collection/invalid_col_id',
                expected_status_int=404)
        self.logout()

    def test_cannot_unpublish_collection_with_invalid_exp_id(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_unpublish_collection/invalid_col_id',
                expected_status_int=404)
        self.logout()

    def test_owner_can_publish_collection(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_publish_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_owner_cannot_unpublish_public_collection(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_unpublish_collection/%s' % self.published_col_id,
                expected_status_int=401)
        self.logout()

    def test_moderator_can_unpublish_public_collection(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_unpublish_collection/%s' % self.published_col_id)
        self.assertEqual(response['collection_id'], self.published_col_id)
        self.logout()

    def test_admin_can_publish_any_collection(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_publish_collection/%s' % self.private_col_id)
        self.assertEqual(response['collection_id'], self.private_col_id)
        self.logout()

    def test_admin_cannot_publish_already_published_collection(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_learner_dashboard
        def get(self) -> None:
            self.render_json({'success': True})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.user)
        self.signup(self.banned_user_email, self.banned_user)
        self.mark_user_banned(self.banned_user)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_access_learner_dashboard(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = 'You do not have the credentials to access this page.'
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_exploration_editor_can_access_learner_dashboard(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertTrue(response['success'])
        self.logout()

    def test_guest_user_cannot_access_learner_dashboard(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class AccessLearnerGroupsDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_access_learner_groups."""

    user = 'user'
    user_email = 'user@example.com'
    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_learner_groups
        def get(self) -> None:
            self.render_json({'success': True})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.user_email, self.user)
        self.signup(self.banned_user_email, self.banned_user)
        self.mark_user_banned(self.banned_user)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_banned_user_cannot_access_teacher_dashboard(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = 'You do not have the credentials to access this page.'
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_exploration_editor_can_access_learner_groups(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/')
        self.assertTrue(response['success'])
        self.logout()

    def test_guest_user_cannot_access_teacher_dashboard(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class EditTopicDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_edit_topic."""

    manager_username = 'topicmanager'
    manager_email = 'topicmanager@example.com'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    topic_id = 'topic_1'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'topic_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_edit_topic
        def get(self, topic_id: str) -> None:
            self.render_json({'topic_id': topic_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.manager_email, self.manager_username)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.viewer_email)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_edit_topic/<topic_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.viewer_id)
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)
        self.set_topic_managers([self.manager_username], self.topic_id)

    def test_cannot_edit_topic_with_invalid_topic_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_topic/invalid_topic_id', expected_status_int=404)
        self.logout()

    def test_admin_can_edit_topic(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_topic/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_topic_manager_can_edit_topic(self) -> None:
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_topic/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_normal_user_cannot_edit_topic(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_topic/%s' % self.topic_id, expected_status_int=401)
        self.logout()

    def test_guest_user_cannot_edit_topic(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_topic/%s' % self.topic_id, expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class DeleteTopicDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_delete_topic."""

    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    topic_id = 'topic_1'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'topic_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_delete_topic
        def get(self, topic_id: str) -> None:
            self.render_json({'topic_id': topic_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.viewer_email)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_delete_topic/<topic_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.viewer_id)
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)

    def test_cannot_delete_topic_with_invalid_topic_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_delete_topic/invalid_topic_id', expected_status_int=404)
        self.logout()

    def test_admin_can_delete_topic(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_delete_topic/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_normal_user_cannot_delete_topic(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_topic/%s' % self.topic_id,
                expected_status_int=401)
        error_msg = (
            '%s does not have enough rights to delete the'
            ' topic.' % self.viewer_id
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_guest_user_cannot_delete_topic(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_topic/%s' % self.topic_id,
                expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class ViewAnyTopicEditorDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_view_any_topic_editor."""

    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    topic_id = 'topic_1'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'topic_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_view_any_topic_editor
        def get(self, topic_id: str) -> None:
            self.render_json({'topic_id': topic_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.viewer_email)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_view_topic_editor/<topic_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.viewer_id)
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)

    def test_cannot_delete_topic_with_invalid_topic_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_view_topic_editor/invalid_topic_id',
                expected_status_int=404)
        self.logout()

    def test_admin_can_view_topic_editor(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_view_topic_editor/%s' % (
                self.topic_id))
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_normal_user_cannot_view_topic_editor(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_topic_editor/%s' % self.topic_id,
                expected_status_int=401)
        error_msg = (
            '%s does not have enough rights to view any'
            ' topic editor.' % self.viewer_id
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_guest_user_cannot_view_topic_editor(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_topic_editor/%s' % self.topic_id,
                expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class EditStoryDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_edit_story."""

    manager_username = 'topicmanager'
    manager_email = 'topicmanager@example.com'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'story_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_edit_story
        def get(self, story_id: str) -> None:
            self.render_json({'story_id': story_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_edit_story/<story_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.story_id = story_services.get_new_story_id()
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_story(self.story_id, self.admin_id, self.topic_id)
        self.topic = self.save_new_topic(
            self.topic_id, self.admin_id, canonical_story_ids=[self.story_id])
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)

    def test_cannot_edit_story_with_invalid_story_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_story/story_id_new', expected_status_int=404)
        self.logout()

    def test_cannot_edit_story_with_invalid_topic_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        story_id = story_services.get_new_story_id()
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_story(story_id, self.admin_id, topic_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_story/%s' % story_id, expected_status_int=404)
        self.logout()

    def test_cannot_edit_story_with_invalid_canonical_story_ids(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        canonical_story_ids_swap = self.swap_to_always_return(
            topic_domain.Topic, 'get_canonical_story_ids', value=[])
        with testapp_swap, canonical_story_ids_swap:
            response = self.get_json(
                '/mock_edit_story/%s' % self.story_id, expected_status_int=404)
        error_msg = (
            'Could not find the page http://localhost/mock_edit_story/%s.' % (
                self.story_id)
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_admin_can_edit_story(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_story/%s' % self.story_id)
        self.assertEqual(response['story_id'], self.story_id)
        self.logout()

    def test_topic_manager_can_edit_story(self) -> None:
        self.signup(self.manager_email, self.manager_username)
        self.set_topic_managers([self.manager_username], self.topic_id)

        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_story/%s' % self.story_id)
        self.assertEqual(response['story_id'], self.story_id)
        self.logout()

    def test_normal_user_cannot_edit_story(self) -> None:
        self.signup(self.viewer_email, self.viewer_username)

        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_story/%s' % self.story_id, expected_status_int=401)
        self.logout()

    def test_guest_user_cannot_edit_story(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_story/%s' % self.story_id, expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class DeleteStoryDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_delete_story."""

    manager_username = 'topicmanager'
    manager_email = 'topicmanager@example.com'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'story_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_delete_story
        def get(self, story_id: str) -> None:
            self.render_json({'story_id': story_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_delete_story/<story_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.story_id = story_services.get_new_story_id()
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_story(self.story_id, self.admin_id, self.topic_id)
        self.topic = self.save_new_topic(
            self.topic_id, self.admin_id, canonical_story_ids=[self.story_id])
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)

    def test_cannot_delete_story_with_invalid_story_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_delete_story/story_id_new', expected_status_int=404)
        self.logout()

    def test_cannot_delete_story_with_invalid_topic_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        story_id = story_services.get_new_story_id()
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_story(story_id, self.admin_id, topic_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_delete_story/%s' % story_id, expected_status_int=404)
        self.logout()

    def test_admin_can_delete_story(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_delete_story/%s' % self.story_id)
        self.assertEqual(response['story_id'], self.story_id)
        self.logout()

    def test_topic_manager_can_delete_story(self) -> None:
        self.signup(self.manager_email, self.manager_username)
        self.set_topic_managers([self.manager_username], self.topic_id)

        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_delete_story/%s' % self.story_id)
        self.assertEqual(response['story_id'], self.story_id)
        self.logout()

    def test_normal_user_cannot_delete_story(self) -> None:
        self.signup(self.viewer_email, self.viewer_username)

        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_story/%s' % self.story_id,
                expected_status_int=401)
        error_msg = 'You do not have credentials to delete this story.'
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_guest_user_cannot_delete_story(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_story/%s' % self.story_id,
                expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class AccessTopicsAndSkillsDashboardDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_access_topics_and_skills_dashboard."""

    manager_username = 'topicmanager'
    manager_email = 'topicmanager@example.com'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    topic_id = 'topic_1'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_topics_and_skills_dashboard
        def get(self) -> None:
            self.render_json({'success': True})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.manager_email, self.manager_username)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.viewer_email)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_access_dashboard/', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.viewer_id)
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)
        self.set_topic_managers([self.manager_username], self.topic_id)

    def test_admin_can_access_dashboard(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_access_dashboard/')
        self.assertTrue(response['success'])
        self.logout()

    def test_topic_manager_can_access_dashboard(self) -> None:
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_access_dashboard/')
        self.assertTrue(response['success'])
        self.logout()

    def test_normal_user_cannot_access_dashboard(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_access_dashboard/', expected_status_int=401)
        error_msg = (
            '%s does not have enough rights to access the topics and skills'
            ' dashboard.' % self.viewer_id
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_guest_user_cannot_access_dashboard(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_access_dashboard/', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class AddStoryToTopicTests(test_utils.GenericTestBase):
    """Tests for decorator can_add_new_story_to_topic."""

    manager_username = 'topicmanager'
    manager_email = 'topicmanager@example.com'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    topic_id = 'topic_1'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'topic_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_add_new_story_to_topic
        def get(self, topic_id: str) -> None:
            self.render_json({'topic_id': topic_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.manager_email, self.manager_username)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.viewer_email)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_add_story_to_topic/<topic_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.viewer_id)
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)
        self.set_topic_managers([self.manager_username], self.topic_id)

    def test_cannot_add_story_to_topic_with_invalid_topic_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_add_story_to_topic/invalid_topic_id',
                expected_status_int=404)
        self.logout()

    def test_admin_can_add_story_to_topic(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_add_story_to_topic/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_topic_manager_cannot_add_story_to_topic_with_invalid_topic_id(
        self
    ) -> None:
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_add_story_to_topic/incorrect_id',
                expected_status_int=404)
        self.logout()

    def test_topic_manager_can_add_story_to_topic(self) -> None:
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_add_story_to_topic/%s' % self.topic_id)
        self.assertEqual(response['topic_id'], self.topic_id)
        self.logout()

    def test_normal_user_cannot_add_story_to_topic(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_add_story_to_topic/%s' % self.topic_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have credentials to add a story to this topic.')
        self.logout()

    def test_guest_cannot_add_story_to_topic(self) -> None:
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

    class MockDataHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'topic_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'story_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'classroom_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_story_viewer_page
        def get(self, story_url_fragment: str) -> None:
            self.render_json({'story_url_fragment': story_url_fragment})

    class MockPageHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        URL_PATH_ARGS_SCHEMAS = {
            'topic_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'story_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'classroom_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_story_viewer_page
        def get(self, _: str) -> None:
            self.render_template('oppia-root.mainpage.html')

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.mark_user_banned(self.banned_user)
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
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[self.story_id],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1], next_subtopic_id=2)

    def test_cannot_access_non_existent_story(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_story_data/staging/topic/non-existent-frag',
                expected_status_int=404)

    def test_cannot_access_story_when_topic_is_not_published(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_story_data/staging/topic/%s'
                % self.story_url_fragment,
                expected_status_int=404)

    def test_cannot_access_story_when_story_is_not_published(self) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_story_data/staging/topic/%s'
                % self.story_url_fragment,
                expected_status_int=404)

    def test_can_access_story_when_story_and_topic_are_published(self) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_story_data/staging/topic/%s'
                % self.story_url_fragment,
                expected_status_int=200)

    def test_can_access_story_when_all_url_fragments_are_valid(self) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_html_response(
                '/mock_story_page/staging/topic/story/%s'
                % self.story_url_fragment,
                expected_status_int=200)

    def test_redirect_to_story_page_if_story_url_fragment_is_invalid(
        self
    ) -> None:
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

    def test_redirect_to_correct_url_if_abbreviated_topic_is_invalid(
        self
    ) -> None:
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

    def test_redirect_with_correct_classroom_name_in_url(self) -> None:
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

    def test_redirect_lowercase_story_url_fragment(self) -> None:
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

    class MockDataHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'topic_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'subtopic_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'classroom_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_subtopic_viewer_page
        def get(
            self,
            unused_topic_url_fragment: str,
            subtopic_url_fragment: str
        ) -> None:
            self.render_json({'subtopic_url_fragment': subtopic_url_fragment})

    class MockPageHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        URL_PATH_ARGS_SCHEMAS = {
            'topic_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'subtopic_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'classroom_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_subtopic_viewer_page
        def get(
            self,
            unused_topic_url_fragment: str,
            unused_subtopic_url_fragment: str
        ) -> None:
            self.render_template('subtopic-viewer-page.mainpage.html')

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.mark_user_banned(self.banned_user)
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
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        subtopic_2 = topic_domain.Subtopic.create_default_subtopic(
            2, 'Subtopic Title 2', 'url-frag-two')
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
                'title': 'Sample',
                'url_fragment': 'sample-fragment'
            })]
        )
        self.save_new_topic(
            self.topic_id, self.admin_id, name='topic name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1, subtopic_2], next_subtopic_id=3,
            url_fragment='topic-frag')

    def test_cannot_access_non_existent_subtopic(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_subtopic_data/staging/topic-frag/non-existent-frag',
                expected_status_int=404)

    def test_cannot_access_subtopic_when_topic_is_not_published(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_subtopic_data/staging/topic-frag/sub-one-frag',
                expected_status_int=404)

    def test_can_access_subtopic_when_topic_is_published(self) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_subtopic_data/staging/topic-frag/sub-one-frag',
                expected_status_int=200)

    def test_redirect_to_classroom_if_user_is_banned(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_subtopic_page/staging/topic-frag/revision/000',
                expected_status_int=302)
            self.assertEqual(
                response.headers['location'], 'http://localhost/learn/staging')
        self.logout()

    def test_can_access_subtopic_when_all_url_fragments_are_valid(self) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_html_response(
                '/mock_subtopic_page/staging/topic-frag/revision/sub-one-frag',
                expected_status_int=200)

    def test_fall_back_to_revision_page_if_subtopic_url_frag_is_invalid(
        self
    ) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_subtopic_page/staging/topic-frag/revision/000',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic-frag/revision',
                response.headers['location'])

    def test_fall_back_to_revision_page_when_subtopic_page_does_not_exist(
        self
    ) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        testapp_swap = self.swap(self, 'testapp', self.mock_testapp)
        subtopic_swap = self.swap_to_always_return(
            subtopic_page_services, 'get_subtopic_page_by_id', None)
        with testapp_swap, subtopic_swap:
            response = self.get_html_response(
                '/mock_subtopic_page/staging/topic-frag/revision/sub-one-frag',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic-frag/revision',
                response.headers['location'])

    def test_redirect_to_classroom_if_abbreviated_topic_is_invalid(
        self
    ) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_subtopic_page/math/invalid-topic/revision/sub-one-frag',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/math',
                response.headers['location'])

    def test_redirect_with_correct_classroom_name_in_url(self) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_subtopic_page/math/topic-frag/revision/sub-one-frag',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic-frag/revision'
                '/sub-one-frag',
                response.headers['location'])

    def test_redirect_with_lowercase_subtopic_url_fragment(self) -> None:
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

    class MockDataHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'topic_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'classroom_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_topic_viewer_page
        def get(self, topic_name: str) -> None:
            self.render_json({'topic_name': topic_name})

    class MockPageHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        URL_PATH_ARGS_SCHEMAS = {
            'topic_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'classroom_url_fragment': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_access_topic_viewer_page
        def get(self, unused_topic_name: str) -> None:
            self.render_template('topic-viewer-page.mainpage.html')

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.mark_user_banned(self.banned_user)
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
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1], next_subtopic_id=2)

    def test_cannot_access_non_existent_topic(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_topic_data/staging/invalid-topic',
                expected_status_int=404)

    def test_cannot_access_unpublished_topic(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_topic_data/staging/topic',
                expected_status_int=404)

    def test_can_access_published_topic(self) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_topic_data/staging/topic',
                expected_status_int=200)

    def test_can_access_topic_when_all_url_fragments_are_valid(self) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_html_response(
                '/mock_topic_page/staging/topic',
                expected_status_int=200)

    def test_redirect_to_classroom_if_abbreviated_topic_is_invalid(
        self
    ) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_topic_page/math/invalid-topic',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/math',
                response.headers['location'])

    def test_redirect_with_correct_classroom_name_in_url(self) -> None:
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_html_response(
                '/mock_topic_page/math/topic',
                expected_status_int=302)
            self.assertEqual(
                'http://localhost/learn/staging/topic',
                response.headers['location'])

    def test_redirect_with_lowercase_topic_url_fragment(self) -> None:
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_create_skill
        def get(self) -> None:
            self.render_json({})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.signup(self.banned_user_email, self.banned_user)
        self.mark_user_banned(self.banned_user)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_create_skill', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_admin_can_create_skill(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_create_skill')
        self.logout()

    def test_banned_user_cannot_create_skill(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_create_skill', expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have credentials to create a skill.')
        self.logout()

    def test_guest_cannot_add_create_skill(self) -> None:
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'skill_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_manage_question_skill_status
        def get(self, skill_id: str) -> None:
            self.render_json({'skill_id': skill_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

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

    def test_admin_can_manage_question_skill_status(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_manage_question_skill_status/%s' % self.skill_id)
            self.assertEqual(response['skill_id'], self.skill_id)
        self.logout()

    def test_viewer_cannot_manage_question_skill_status(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_manage_question_skill_status/%s' % self.skill_id,
                expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have credentials to publish a question.')
        self.logout()

    def test_guest_cannot_manage_question_skill_status(self) -> None:
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_create_topic
        def get(self) -> None:
            self.render_json({})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.mark_user_banned(self.banned_user)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_create_topic', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_admin_can_create_topic(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_create_topic')
        self.logout()

    def test_banned_user_cannot_create_topic(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_create_topic', expected_status_int=401)
            self.assertIn(
                'does not have enough rights to create a topic.',
                response['error'])
        self.logout()

    def test_guest_cannot_create_topic(self) -> None:
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'topic_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_manage_rights_for_topic
        def get(self, topic_id: str) -> None:
            self.render_json({'topic_id': topic_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.mark_user_banned(self.banned_user)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_manage_rights_for_topic/<topic_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        topic_services.create_new_topic_rights(self.topic_id, self.admin_id)

    def test_admin_can_manage_rights(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_manage_rights_for_topic/%s' % self.topic_id)
        self.logout()

    def test_banned_user_cannot_manage_rights(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_manage_rights_for_topic/%s' % self.topic_id,
                expected_status_int=401)
            self.assertIn(
                'does not have enough rights to assign roles for the topic.',
                response['error'])
        self.logout()

    def test_guest_cannot_manage_rights(self) -> None:
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'topic_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_change_topic_publication_status
        def get(self, topic_id: str) -> None:
            self.render_json({
                topic_id: topic_id
            })

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.banned_user_email, self.banned_user)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.mark_user_banned(self.banned_user)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.admin_id)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_change_publication_status/<topic_id>',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_admin_can_change_topic_publication_status(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_change_publication_status/%s' % self.topic_id)
        self.logout()

    def test_cannot_change_topic_publication_status_with_invalid_topic_id(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_change_publication_status/invalid_topic_id',
                expected_status_int=404)
        self.logout()

    def test_banned_user_cannot_change_topic_publication_status(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_change_publication_status/%s' % self.topic_id,
                expected_status_int=401)
            self.assertIn(
                'does not have enough rights to publish or unpublish the '
                'topic.', response['error'])
        self.logout()

    def test_guest_cannot_change_topic_publication_status(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_change_publication_status/%s' % self.topic_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')


class PerformTasksInTaskqueueTests(test_utils.GenericTestBase):
    """Tests for decorator can_perform_tasks_in_taskqueue."""

    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_perform_tasks_in_taskqueue
        def get(self) -> None:
            self.render_json({})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_perform_tasks_in_taskqueue', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_super_admin_can_perform_tasks_in_taskqueue(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_perform_tasks_in_taskqueue')
        self.logout()

    def test_normal_user_cannot_perform_tasks_in_taskqueue(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_perform_tasks_in_taskqueue', expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have the credentials to access this page.')
        self.logout()

    def test_request_with_appropriate_header_can_perform_tasks_in_taskqueue(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_perform_tasks_in_taskqueue',
                headers={'X-AppEngine-QueueName': 'name'})


class PerformCronTaskTests(test_utils.GenericTestBase):
    """Tests for decorator can_perform_cron_tasks."""

    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_perform_cron_tasks
        def get(self) -> None:
            self.render_json({})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.signup(self.viewer_email, self.viewer_username)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_perform_cron_task', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_super_admin_can_perform_cron_tasks(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_perform_cron_task')
        self.logout()

    def test_normal_user_cannot_perform_cron_tasks(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_perform_cron_task', expected_status_int=401)
            self.assertEqual(
                response['error'],
                'You do not have the credentials to access this page.')
        self.logout()

    def test_request_with_appropriate_header_can_perform_cron_tasks(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_perform_cron_task', headers={'X-AppEngine-Cron': 'true'})


class EditSkillDecoratorTests(test_utils.GenericTestBase):
    """Tests permissions for accessing the skill editor."""

    manager_username = 'topicmanager'
    manager_email = 'topicmanager@example.com'
    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    skill_id = '1'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'skill_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_edit_skill
        def get(self, skill_id: str) -> None:
            self.render_json({'skill_id': skill_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.manager_email, self.manager_username)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.admin_id)
        self.set_topic_managers([self.manager_username], self.topic_id)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_edit_skill/<skill_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_cannot_edit_skill_with_invalid_skill_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_custom_response(
                '/mock_edit_skill/', 'text/plain', expected_status_int=404)
        self.logout()

    def test_admin_can_edit_skill(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_skill/%s' % self.skill_id)
        self.assertEqual(response['skill_id'], self.skill_id)
        self.logout()

    def test_topic_manager_can_edit_public_skill(self) -> None:
        self.login(self.manager_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_skill/%s' % self.skill_id)
        self.assertEqual(response['skill_id'], self.skill_id)
        self.logout()

    def test_normal_user_cannot_edit_public_skill(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_skill/%s' % self.skill_id, expected_status_int=401)
        self.logout()

    def test_guest_cannot_edit_public_skill(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_skill/%s' % self.skill_id, expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class DeleteSkillDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_delete_skill."""

    viewer_username = 'viewer'
    viewer_email = 'viewer@example.com'
    skill_id = '1'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_delete_skill
        def get(self) -> None:
            self.render_json({'success': True})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.viewer_email, self.viewer_username)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_delete_skill', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_admin_can_delete_skill(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_delete_skill')
        self.assertTrue(response['success'])
        self.logout()

    def test_normal_user_cannot_delete_public_skill(self) -> None:
        self.login(self.viewer_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_delete_skill', expected_status_int=401)
        self.logout()

    def test_guest_cannot_delete_public_skill(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_skill', expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)


class EditQuestionDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_edit_question."""

    question_id = 'question_id'
    user_a = 'A'
    user_a_email = 'a@example.com'
    user_b = 'B'
    user_b_email = 'b@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'question_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_edit_question
        def get(self, question_id: str) -> None:
            self.render_json({'question_id': question_id})

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.user_a_email, self.user_a)
        self.signup(self.user_b_email, self.user_b)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.admin_id)
        self.save_new_question(
            self.question_id, self.owner_id,
            self._create_valid_question_data('ABC'), ['skill_1'])
        self.set_topic_managers([self.user_a], self.topic_id)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_edit_question/<question_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_edit_question(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_question/%s' % self.question_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_cannot_edit_question_with_invalid_question_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_question/invalid_question_id',
                expected_status_int=404)
        self.logout()

    def test_admin_can_edit_question(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_question/%s' % self.question_id)
        self.assertEqual(response['question_id'], self.question_id)
        self.logout()

    def test_topic_manager_can_edit_question(self) -> None:
        self.login(self.user_a_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_edit_question/%s' % self.question_id)
        self.assertEqual(response['question_id'], self.question_id)
        self.logout()

    def test_any_user_cannot_edit_question(self) -> None:
        self.login(self.user_b_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_question/%s' % self.question_id,
                expected_status_int=401)
        self.logout()


class ViewQuestionEditorDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_view_question_editor."""

    question_id = 'question_id'
    user_a = 'A'
    user_a_email = 'a@example.com'
    user_b = 'B'
    user_b_email = 'b@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'question_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_view_question_editor
        def get(self, question_id: str) -> None:
            self.render_json({'question_id': question_id})

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.user_a_email, self.user_a)
        self.signup(self.user_b_email, self.user_b)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.admin_id)
        self.save_new_question(
            self.question_id, self.owner_id,
            self._create_valid_question_data('ABC'), ['skill_1'])
        self.set_topic_managers([self.user_a], self.topic_id)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_view_question_editor/<question_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_view_question_editor(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_question_editor/%s' % self.question_id,
                expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)

    def test_cannot_view_question_editor_with_invalid_question_id(
        self
    ) -> None:
        invalid_id = 'invalid_question_id'
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_question_editor/%s' % invalid_id,
                expected_status_int=404)
        error_msg = (
            'Could not find the page http://localhost/'
            'mock_view_question_editor/%s.' % invalid_id
        )
        self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_curriculum_admin_can_view_question_editor(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_question_editor/%s' % self.question_id)
        self.assertEqual(response['question_id'], self.question_id)
        self.logout()

    def test_topic_manager_can_view_question_editor(self) -> None:
        self.login(self.user_a_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_question_editor/%s' % self.question_id)
        self.assertEqual(response['question_id'], self.question_id)
        self.logout()

    def test_normal_user_cannot_view_question_editor(self) -> None:
        self.login(self.user_b_email)
        user_id_b = self.get_user_id_from_email(self.user_b_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_view_question_editor/%s' % self.question_id,
                expected_status_int=401)
        error_msg = (
            '%s does not have enough rights to access the questions editor'
            % user_id_b)
        self.assertEqual(response['error'], error_msg)
        self.logout()


class DeleteQuestionDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_delete_question."""

    question_id = 'question_id'
    user_a = 'A'
    user_a_email = 'a@example.com'
    user_b = 'B'
    user_b_email = 'b@example.com'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'question_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_delete_question
        def get(self, question_id: str) -> None:
            self.render_json({'question_id': question_id})

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.user_a_email, self.user_a)
        self.signup(self.user_b_email, self.user_b)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.manager_id = self.get_user_id_from_email(self.user_a_email)

        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.admin_id)
        self.set_topic_managers([self.user_a], self.topic_id)

        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_delete_question/<question_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_guest_cannot_delete_question(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_question/%s' % self.question_id,
                expected_status_int=401)
        error_msg = 'You must be logged in to access this resource.'
        self.assertEqual(response['error'], error_msg)

    def test_curriculum_admin_can_delete_question(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_question/%s' % self.question_id)
        self.assertEqual(response['question_id'], self.question_id)
        self.logout()

    def test_topic_manager_can_delete_question(self) -> None:
        self.login(self.user_a_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_question/%s' % self.question_id)
        self.assertEqual(response['question_id'], self.question_id)
        self.logout()

    def test_normal_user_cannot_delete_question(self) -> None:
        self.login(self.user_b_email)
        user_id_b = self.get_user_id_from_email(self.user_b_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock_delete_question/%s' % self.question_id,
                expected_status_int=401)
        error_msg = (
            '%s does not have enough rights to delete the question.'
            % user_id_b)
        self.assertEqual(response['error'], error_msg)
        self.logout()


class PlayQuestionDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_play_question."""

    question_id = 'question_id'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'question_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_play_question
        def get(self, question_id: str) -> None:
            self.render_json({'question_id': question_id})

    def setUp(self) -> None:
        super().setUp()
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

    def test_can_play_question_with_valid_question_id(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_play_question/%s' % (
                self.question_id))
            self.assertEqual(response['question_id'], self.question_id)


class PlayEntityDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_play_entity."""

    user_email = 'user@example.com'
    username = 'user'
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'entity_type': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'entity_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_play_entity
        def get(self, entity_type: str, entity_id: str) -> None:
            self.render_json(
                {'entity_type': entity_type, 'entity_id': entity_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_cannot_play_exploration_on_disabled_exploration_ids(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_play_entity/%s/%s' % (
                feconf.ENTITY_TYPE_EXPLORATION,
                feconf.DISABLED_EXPLORATION_IDS[0]), expected_status_int=404)

    def test_guest_can_play_exploration_on_published_exploration(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_play_entity/%s/%s' % (
                feconf.ENTITY_TYPE_EXPLORATION, self.published_exp_id))
            self.assertEqual(
                response['entity_type'], feconf.ENTITY_TYPE_EXPLORATION)
            self.assertEqual(
                response['entity_id'], self.published_exp_id)

    def test_guest_cannot_play_exploration_on_private_exploration(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_play_entity/%s/%s' % (
                feconf.ENTITY_TYPE_EXPLORATION,
                self.private_exp_id), expected_status_int=404)

    def test_cannot_play_exploration_with_none_exploration_rights(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_play_entity/%s/%s'
                % (feconf.ENTITY_TYPE_EXPLORATION, 'fake_exp_id'),
                expected_status_int=404)

    def test_can_play_question_for_valid_question_id(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_play_entity/%s/%s' % (
                feconf.ENTITY_TYPE_QUESTION, self.question_id))
        self.assertEqual(
            response['entity_type'], feconf.ENTITY_TYPE_QUESTION)
        self.assertEqual(response['entity_id'], self.question_id)
        self.assertEqual(response['entity_type'], 'question')

    def test_cannot_play_question_invalid_question_id(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_play_entity/%s/%s' % (
                feconf.ENTITY_TYPE_QUESTION, 'question_id'),
                          expected_status_int=404)

    def test_cannot_play_entity_for_invalid_entity(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_play_entity/%s/%s' % (
                'fake_entity_type', 'fake_entity_id'), expected_status_int=404)


class EditEntityDecoratorTests(test_utils.GenericTestBase):
    """Tests the decorator can_edit_entity."""

    username = 'banneduser'
    user_email = 'user@example.com'
    published_exp_id = 'exp_0'
    private_exp_id = 'exp_1'

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'entity_type': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'entity_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_edit_entity
        def get(self, entity_type: str, entity_id: str) -> None:
            return self.render_json(
                {'entity_type': entity_type, 'entity_id': entity_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.mark_user_banned(self.username)
        self.owner = user_services.get_user_actions_info(self.owner_id)
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

    def test_can_edit_exploration_with_valid_exp_id(self) -> None:
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

    def test_cannot_edit_exploration_with_invalid_exp_id(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_entity/exploration/invalid_exp_id',
                expected_status_int=404)
        self.logout()

    def test_banned_user_cannot_edit_exploration(self) -> None:
        self.login(self.user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_entity/%s/%s' % (
                    feconf.ENTITY_TYPE_EXPLORATION, self.private_exp_id),
                expected_status_int=401)
        self.logout()

    def test_can_edit_question_with_valid_question_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_entity/%s/%s' % (
                feconf.ENTITY_TYPE_QUESTION, self.question_id))
            self.assertEqual(response['entity_id'], self.question_id)
            self.assertEqual(response['entity_type'], 'question')
        self.logout()

    def test_can_edit_topic(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
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

    def test_cannot_edit_topic_with_invalid_topic_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        topic_id = 'incorrect_id'
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock_edit_entity/%s/%s' % (
                    feconf.ENTITY_TYPE_TOPIC, topic_id),
                expected_status_int=404)
        self.logout()

    def test_can_edit_skill(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.admin_id, description='Description')
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_entity/%s/%s' % (
                feconf.ENTITY_TYPE_SKILL, skill_id))
            self.assertEqual(response['entity_id'], skill_id)
            self.assertEqual(response['entity_type'], 'skill')
        self.logout()

    def test_can_submit_images_to_questions(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.admin_id, description='Description')
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_entity/%s/%s' % (
                feconf.IMAGE_CONTEXT_QUESTION_SUGGESTIONS, skill_id))
            self.assertEqual(response['entity_id'], skill_id)
            self.assertEqual(response['entity_type'], 'question_suggestions')
        self.logout()

    def test_unauthenticated_users_cannot_submit_images_to_questions(
        self
    ) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.admin_id, description='Description')
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json('/mock_edit_entity/%s/%s' % (
                feconf.IMAGE_CONTEXT_QUESTION_SUGGESTIONS, skill_id),
                expected_status_int=401)

    def test_cannot_submit_images_to_questions_without_having_permissions(
        self
    ) -> None:
        self.login(self.user_email)
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.admin_id, description='Description')
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_entity/%s/%s' % (
                feconf.IMAGE_CONTEXT_QUESTION_SUGGESTIONS, skill_id),
                expected_status_int=401)
            self.assertEqual(
                response['error'], 'You do not have credentials to submit'
                ' images to questions.')
        self.logout()

    def test_can_edit_blog_post(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        blog_admin_id = (
            self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL))
        blog_post = blog_services.create_new_blog_post(blog_admin_id)
        blog_post_id = blog_post.id
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock_edit_entity/%s/%s' % (
                feconf.ENTITY_TYPE_BLOG_POST, blog_post_id))
            self.assertEqual(response['entity_id'], blog_post_id)
            self.assertEqual(response['entity_type'], 'blog_post')
        self.logout()

    def test_can_edit_story(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
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

    def test_cannot_edit_entity_invalid_entity(self) -> None:
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

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_save_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.user_email, self.username)
        self.signup(self.banned_user_email, self.banned_username)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.voiceover_admin_id = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL)

        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.mark_user_banned(self.banned_username)
        self.add_user_role(
            self.VOICEOVER_ADMIN_USERNAME, feconf.ROLE_ID_VOICEOVER_ADMIN)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.voiceover_admin = user_services.get_user_actions_info(
            self.voiceover_admin_id)
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
            self.voiceover_admin, self.published_exp_id_1, self.voice_artist_id,
            self.role)

    def test_unautheticated_user_cannot_save_exploration(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)

    def test_cannot_save_exploration_with_invalid_exp_id(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/invalid_exp_id', expected_status_int=404)
        self.logout()

    def test_banned_user_cannot_save_exploration(self) -> None:
        self.login(self.banned_user_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % self.private_exp_id_1, expected_status_int=401)
        self.logout()

    def test_owner_can_save_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_moderator_can_save_public_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.published_exp_id_1)
        self.assertEqual(response['exploration_id'], self.published_exp_id_1)
        self.logout()

    def test_moderator_can_save_private_exploration(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)

        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_admin_can_save_private_exploration(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.private_exp_id_1)
        self.assertEqual(response['exploration_id'], self.private_exp_id_1)
        self.logout()

    def test_voice_artist_can_only_save_assigned_exploration(self) -> None:
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


class MockHandlerNormalizedPayloadDict(TypedDict):
    """Type for the MockHandler's normalized_payload dictionary."""

    signature: str
    vm_id: str
    message: bytes


class OppiaMLAccessDecoratorTest(test_utils.GenericTestBase):
    """Tests for oppia_ml_access decorator."""

    class MockHandler(
        base.OppiaMLVMHandler[
            MockHandlerNormalizedPayloadDict, Dict[str, str]
        ]
    ):
        REQUIRE_PAYLOAD_CSRF_CHECK = False
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'POST': {
                'vm_id': {
                    'schema': {
                        'type': 'basestring'
                    }
                },
                'message': {
                    'schema': {
                        'type': 'basestring'
                    }
                },
                'signature': {
                    'schema': {
                        'type': 'basestring'
                    }
                }
            }
        }

        def extract_request_message_vm_id_and_signature(
            self
        ) -> classifier_domain.OppiaMLAuthInfo:
            """Returns message, vm_id and signature retrived from incoming
            request.

            Returns:
                OppiaMLAuthInfo. Message at index 0, vm_id at index 1 and
                signature at index 2.
            """
            assert self.normalized_payload is not None
            signature = self.normalized_payload['signature']
            vm_id = self.normalized_payload['vm_id']
            message = self.normalized_payload['message']
            return classifier_domain.OppiaMLAuthInfo(message, vm_id, signature)

        @acl_decorators.is_from_oppia_ml
        def post(self) -> None:
            self.render_json({'job_id': 'new_job'})

    def setUp(self) -> None:
        super().setUp()
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/ml/nextjobhandler', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_unauthorized_vm_cannot_fetch_jobs(self) -> None:
        payload = {}
        payload['vm_id'] = 'fake_vm'
        secret = 'fake_secret'
        payload['message'] = json.dumps('malicious message')
        payload['signature'] = classifier_services.generate_signature(
            secret.encode('utf-8'),
            payload['message'].encode('utf-8'),
            payload['vm_id'])

        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/ml/nextjobhandler', payload,
                expected_status_int=401)

    def test_default_vm_id_raises_exception_in_prod_mode(self) -> None:
        payload = {}
        payload['vm_id'] = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        payload['message'] = json.dumps('malicious message')
        payload['signature'] = classifier_services.generate_signature(
            secret.encode('utf-8'),
            payload['message'].encode('utf-8'),
            payload['vm_id'])
        with self.swap(self, 'testapp', self.mock_testapp):
            with self.swap(constants, 'DEV_MODE', False):
                self.post_json(
                    '/ml/nextjobhandler', payload, expected_status_int=401)

    def test_that_invalid_signature_raises_exception(self) -> None:
        payload = {}
        payload['vm_id'] = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        payload['message'] = json.dumps('malicious message')
        payload['signature'] = classifier_services.generate_signature(
            secret.encode('utf-8'), 'message'.encode('utf-8'), payload['vm_id'])

        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/ml/nextjobhandler', payload, expected_status_int=401)

    def test_that_no_excpetion_is_raised_when_valid_vm_access(self) -> None:
        payload = {}
        payload['vm_id'] = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        payload['message'] = json.dumps('message')
        payload['signature'] = classifier_services.generate_signature(
            secret.encode('utf-8'),
            payload['message'].encode('utf-8'),
            payload['vm_id'])

        with self.swap(self, 'testapp', self.mock_testapp):
            json_response = self.post_json('/ml/nextjobhandler', payload)

        self.assertEqual(json_response['job_id'], 'new_job')


class DecoratorForUpdatingSuggestionTests(test_utils.GenericTestBase):
    """Tests for can_update_suggestion decorator."""

    curriculum_admin_username = 'adn'
    curriculum_admin_email = 'admin@example.com'
    author_username = 'author'
    author_email = 'author@example.com'
    hi_language_reviewer = 'reviewer1@example.com'
    en_language_reviewer = 'reviewer2@example.com'
    username = 'user'
    user_email = 'user@example.com'
    TARGET_TYPE: Final = 'exploration'
    exploration_id = 'exp_id'
    target_version_id = 1
    change_dict = {
        'cmd': 'add_written_translation',
        'content_id': 'content',
        'language_code': 'hi',
        'content_html': '<p>old content html</p>',
        'state_name': 'State 1',
        'translation_html': '<p>Translation for content.</p>',
        'data_format': 'html'
    }

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'suggestion_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_update_suggestion
        def get(self, suggestion_id: str) -> None:
            self.render_json({'suggestion_id': suggestion_id})

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.author_email, self.author_username)
        self.signup(self.user_email, self.username)
        self.signup(self.curriculum_admin_email, self.curriculum_admin_username)
        self.signup(self.hi_language_reviewer, 'reviewer1')
        self.signup(self.en_language_reviewer, 'reviewer2')
        self.author_id = self.get_user_id_from_email(self.author_email)
        self.admin_id = self.get_user_id_from_email(self.curriculum_admin_email)
        self.hi_language_reviewer_id = self.get_user_id_from_email(
            self.hi_language_reviewer)
        self.en_language_reviewer_id = self.get_user_id_from_email(
            self.en_language_reviewer)
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.author = user_services.get_user_actions_info(self.author_id)
        user_services.add_user_role(
            self.admin_id, feconf.ROLE_ID_CURRICULUM_ADMIN)
        user_services.allow_user_to_review_translation_in_language(
            self.hi_language_reviewer_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.en_language_reviewer_id, 'en')
        user_services.allow_user_to_review_question(
            self.hi_language_reviewer_id)
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock/<suggestion_id>', self.MockHandler)],
            debug=feconf.DEBUG,
        ))

        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                self.exploration_id, self.author_id, [
                    'State 1', 'State 2', 'State 3'],
                ['TextInput'], category='Algebra'))

        self.old_content = state_domain.SubtitledHtml(
            'content', '<p>old content html</p>').to_dict()
        exploration.states['State 1'].update_content(
            state_domain.SubtitledHtml.from_dict(self.old_content))
        exploration.states['State 2'].update_content(
            state_domain.SubtitledHtml.from_dict(self.old_content))
        exploration.states['State 3'].update_content(
            state_domain.SubtitledHtml.from_dict(self.old_content))
        exp_models = (
            exp_services._compute_models_for_updating_exploration( # pylint: disable=protected-access
                self.author_id,
                exploration,
                '',
                []
            )
        )
        datastore_services.update_timestamps_multi(exp_models)
        datastore_services.put_multi(exp_models)

        rights_manager.publish_exploration(self.author, self.exploration_id)

        self.new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        self.resubmit_change_content = state_domain.SubtitledHtml(
            'content', '<p>resubmit change content html</p>').to_dict()

        self.save_new_skill('skill_123', self.admin_id)

        add_question_change_dict: Dict[
            str, Union[str, question_domain.QuestionDict, float]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'version': 44,
                'id': ''
            },
            'skill_id': 'skill_123',
            'skill_difficulty': 0.3
        }

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT, self.TARGET_TYPE,
            self.exploration_id, self.target_version_id,
            self.author_id,
            self.change_dict, '')

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_123', feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_question_change_dict,
            'test description')

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.exploration_id, exploration.version,
            self.author_id, {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'State 2',
                'old_value': self.old_content,
                'new_value': self.new_content
            },
            'change to state 1')

        translation_suggestions = suggestion_services.get_submitted_suggestions(
            self.author_id, feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        question_suggestions = suggestion_services.get_submitted_suggestions(
            self.author_id, feconf.SUGGESTION_TYPE_ADD_QUESTION)
        edit_state_suggestions = suggestion_services.get_submitted_suggestions(
            self.author_id, feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)

        self.assertEqual(len(translation_suggestions), 1)
        self.assertEqual(len(question_suggestions), 1)
        self.assertEqual(len(edit_state_suggestions), 1)

        translation_suggestion = translation_suggestions[0]
        question_suggestion = question_suggestions[0]
        edit_state_suggestion = edit_state_suggestions[0]

        self.translation_suggestion_id = translation_suggestion.suggestion_id
        self.question_suggestion_id = question_suggestion.suggestion_id
        self.edit_state_suggestion_id = edit_state_suggestion.suggestion_id

    def test_authors_cannot_update_suggestion_that_they_created(self) -> None:
        self.login(self.author_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % self.translation_suggestion_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'The user, %s is not allowed to update self-created'
            'suggestions.' % self.author_username)
        self.logout()

    def test_admin_can_update_any_given_translation_suggestion(self) -> None:
        self.login(self.curriculum_admin_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % self.translation_suggestion_id)
        self.assertEqual(
            response['suggestion_id'], self.translation_suggestion_id)
        self.logout()

    def test_admin_can_update_any_given_question_suggestion(self) -> None:
        self.login(self.curriculum_admin_email)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.question_suggestion_id)
        self.assertEqual(response['suggestion_id'], self.question_suggestion_id)
        self.logout()

    def test_reviewer_can_update_translation_suggestion(self) -> None:
        self.login(self.hi_language_reviewer)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % self.translation_suggestion_id)
        self.assertEqual(
            response['suggestion_id'], self.translation_suggestion_id)
        self.logout()

    def test_reviewer_can_update_question_suggestion(self) -> None:
        self.login(self.hi_language_reviewer)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json('/mock/%s' % self.question_suggestion_id)
        self.assertEqual(
            response['suggestion_id'], self.question_suggestion_id)
        self.logout()

    def test_guest_cannot_update_any_suggestion(self) -> None:
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % self.translation_suggestion_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_reviewers_without_permission_cannot_update_any_suggestion(
        self
    ) -> None:
        self.login(self.en_language_reviewer)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % self.translation_suggestion_id,
                expected_status_int=401)
        self.assertEqual(
            response['error'], 'You are not allowed to update the suggestion.')
        self.logout()

    def test_suggestions_with_invalid_suggestion_id_cannot_be_updated(
        self
    ) -> None:
        self.login(self.hi_language_reviewer)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % 'suggestion-id',
                expected_status_int=400)
        self.assertEqual(
            response['error'], 'Invalid format for suggestion_id. ' +
            'It must contain 3 parts separated by \'.\'')
        self.logout()

    def test_non_existent_suggestions_cannot_be_updated(self) -> None:
        self.login(self.hi_language_reviewer)
        with self.swap(self, 'testapp', self.mock_testapp):
            self.get_json(
                '/mock/%s' % 'exploration.exp1.' +
                'WzE2MTc4NzExNzExNDEuOTE0XQ==WzQ5NTs',
                expected_status_int=404)
        self.logout()

    def test_not_allowed_suggestions_cannot_be_updated(self) -> None:
        self.login(self.en_language_reviewer)
        with self.swap(self, 'testapp', self.mock_testapp):
            response = self.get_json(
                '/mock/%s' % self.edit_state_suggestion_id,
                expected_status_int=400)
        self.assertEqual(
            response['error'], 'Invalid suggestion type.')
        self.logout()


class OppiaAndroidDecoratorTest(test_utils.GenericTestBase):
    """Tests for is_from_oppia_android decorator."""

    class MockHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
        REQUIRE_PAYLOAD_CSRF_CHECK = False
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'POST': {
                'report': {
                    'schema': {
                        'type': 'dict',
                        'properties': [{
                            'name': 'platform_type',
                            'schema': {
                                'type': 'unicode'
                            }
                        }, {
                            'name': 'android_report_info_schema_version',
                            'schema': {
                                'type': 'int'
                            }
                        }, {
                            'name': 'app_context',
                            'schema': incoming_app_feedback_report.ANDROID_APP_CONTEXT_DICT_SCHEMA  # pylint: disable=line-too-long
                        }, {
                            'name': 'device_context',
                            'schema': incoming_app_feedback_report.ANDROID_DEVICE_CONTEXT_DICT_SCHEMA  # pylint: disable=line-too-long
                        }, {
                            'name': 'report_submission_timestamp_sec',
                            'schema': {
                                'type': 'int'
                            }
                        }, {
                            'name': 'report_submission_utc_offset_hrs',
                            'schema': {
                                'type': 'int'
                            }
                        }, {
                            'name': 'system_context',
                            'schema': incoming_app_feedback_report.ANDROID_SYSTEM_CONTEXT_DICT_SCHEMA  # pylint: disable=line-too-long
                        }, {
                            'name': 'user_supplied_feedback',
                            'schema': incoming_app_feedback_report.USER_SUPPLIED_FEEDBACK_DICT_SCHEMA  # pylint: disable=line-too-long
                        }]
                    }
                }
            }
        }

        @acl_decorators.is_from_oppia_android
        def post(self) -> None:
            self.render_json({})

    REPORT_JSON = {
        'platform_type': 'android',
        'android_report_info_schema_version': 1,
        'app_context': {
            'entry_point': {
                'entry_point_name': 'navigation_drawer',
                'entry_point_exploration_id': None,
                'entry_point_story_id': None,
                'entry_point_topic_id': None,
                'entry_point_subtopic_id': None,
            },
            'text_size': 'large_text_size',
            'text_language_code': 'en',
            'audio_language_code': 'en',
            'only_allows_wifi_download_and_update': True,
            'automatically_update_topics': False,
            'account_is_profile_admin': False,
            'event_logs': ['example', 'event'],
            'logcat_logs': ['example', 'log']
        },
        'device_context': {
            'android_device_model': 'example_model',
            'android_sdk_version': 23,
            'build_fingerprint': 'example_fingerprint_id',
            'network_type': 'wifi'
        },
        'report_submission_timestamp_sec': 1615519337,
        'report_submission_utc_offset_hrs': 0,
        'system_context': {
            'platform_version': '0.1-alpha-abcdef1234',
            'package_version_code': 1,
            'android_device_country_locale_code': 'in',
            'android_device_language_locale_code': 'en'
        },
        'user_supplied_feedback': {
            'report_type': 'suggestion',
            'category': 'language_suggestion',
            'user_feedback_selected_items': [],
            'user_feedback_other_text_input': 'french'
        }
    }

    ANDROID_APP_VERSION_NAME = '1.0.0-flavor-commithash'
    ANDROID_APP_VERSION_CODE = '2'

    def setUp(self) -> None:
        super().setUp()
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/appfeedbackreporthandler/incoming_android_report',
                self.MockHandler)],
            debug=feconf.DEBUG,
        ))

    def test_that_no_exception_is_raised_when_valid_oppia_android_headers(
        self
    ) -> None:
        headers = {
            'api_key': android_validation_constants.ANDROID_API_KEY,
            'app_package_name': (
                android_validation_constants.ANDROID_APP_PACKAGE_NAME),
            'app_version_name': self.ANDROID_APP_VERSION_NAME,
            'app_version_code': self.ANDROID_APP_VERSION_CODE
        }
        payload = {}
        payload['report'] = self.REPORT_JSON

        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/appfeedbackreporthandler/incoming_android_report', payload,
                headers=headers)

    def test_invalid_api_key_raises_exception(self) -> None:
        invalid_headers = {
            'api_key': 'bad_key',
            'app_package_name': (
                android_validation_constants.ANDROID_APP_PACKAGE_NAME),
            'app_version_name': self.ANDROID_APP_VERSION_NAME,
            'app_version_code': self.ANDROID_APP_VERSION_CODE
        }
        payload = {}
        payload['report'] = self.REPORT_JSON

        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/appfeedbackreporthandler/incoming_android_report', payload,
                headers=invalid_headers, expected_status_int=401)

    def test_invalid_package_name_raises_exception(self) -> None:
        invalid_headers = {
            'api_key': android_validation_constants.ANDROID_API_KEY,
            'app_package_name': 'bad_package_name',
            'app_version_name': self.ANDROID_APP_VERSION_NAME,
            'app_version_code': self.ANDROID_APP_VERSION_CODE
        }
        payload = {}
        payload['report'] = self.REPORT_JSON

        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/appfeedbackreporthandler/incoming_android_report', payload,
                headers=invalid_headers, expected_status_int=401)

    def test_invalid_version_name_raises_exception(self) -> None:
        invalid_headers = {
            'api_key': android_validation_constants.ANDROID_API_KEY,
            'app_package_name': (
                android_validation_constants.ANDROID_APP_PACKAGE_NAME),
            'app_version_name': 'bad_version_name',
            'app_version_code': self.ANDROID_APP_VERSION_CODE
        }
        payload = {}
        payload['report'] = self.REPORT_JSON

        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/appfeedbackreporthandler/incoming_android_report', payload,
                headers=invalid_headers, expected_status_int=401)

    def test_invalid_version_code_raises_exception(self) -> None:
        invalid_headers = {
            'api_key': android_validation_constants.ANDROID_API_KEY,
            'app_package_name': (
                android_validation_constants.ANDROID_APP_PACKAGE_NAME),
            'app_version_name': self.ANDROID_APP_VERSION_NAME,
            'app_version_code': 'bad_version_code'
        }
        payload = {}
        payload['report'] = self.REPORT_JSON

        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/appfeedbackreporthandler/incoming_android_report', payload,
                headers=invalid_headers, expected_status_int=401)
