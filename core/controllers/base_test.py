# coding: utf-8
#
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

"""Tests for generic controller behavior."""

from __future__ import annotations

import contextlib
import importlib
import inspect
import io
import json
import logging
import os
import re
import types

from core import feconf
from core import handler_schema_constants
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import payload_validator
from core.domain import auth_domain
from core.domain import classifier_domain
from core.domain import classifier_services
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import taskqueue_services
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils
import main

from typing import Dict, Final, FrozenSet, List, Optional, TypedDict, cast
import webapp2
from webapp2_extras import routes
import webtest

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import platform_auth_services as auth_services

auth_services = models.Registry.import_auth_services()

FORTY_EIGHT_HOURS_IN_SECS: Final = 48 * 60 * 60
PADDING: Final = 1


class HelperFunctionTests(test_utils.GenericTestBase):

    def test_load_template(self) -> None:
        oppia_root_path = os.path.join(
            'core', 'templates', 'pages', 'oppia-root')
        with self.swap(feconf, 'FRONTEND_TEMPLATES_DIR', oppia_root_path):
            self.assertIn(
                '"Loading | Oppia"',
                base.load_template('oppia-root.mainpage.html'))


class UniqueTemplateNamesTests(test_utils.GenericTestBase):
    """Tests to ensure that all template filenames in
    core/templates/pages have unique filenames. This is required
    for the backend tests to work correctly since they fetch templates
    from this directory based on name of the template. For details, refer
    get_filepath_from_filename function in test_utils.py.
    """

    def test_template_filenames_are_unique(self) -> None:
        templates_dir = os.path.join(
            'core', 'templates', 'pages')
        all_template_names: List[str] = []
        for root, _, filenames in os.walk(templates_dir):
            template_filenames = [
                filename for filename in filenames if filename.endswith(
                    '.html')]
            all_template_names = all_template_names + template_filenames
        self.assertEqual(len(all_template_names), len(set(all_template_names)))


class BaseHandlerTests(test_utils.GenericTestBase):

    TEST_LEARNER_EMAIL: Final = 'test.learner@example.com'
    TEST_LEARNER_USERNAME: Final = 'testlearneruser'
    TEST_CREATOR_EMAIL: Final = 'test.creator@example.com'
    TEST_CREATOR_USERNAME: Final = 'testcreatoruser'
    TEST_EDITOR_EMAIL: Final = 'test.editor@example.com'
    TEST_EDITOR_USERNAME: Final = 'testeditoruser'
    DELETED_USER_EMAIL: Final = 'deleted.user@example.com'
    DELETED_USER_USERNAME: Final = 'deleteduser'
    PARTIALLY_LOGGED_IN_USER_EMAIL: Final = 'partial@example.com'

    class MockHandlerWithInvalidReturnType(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = 'invalid_type'
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        def get(self) -> None:
            self.render_template('invalid_page.html')

        def options(self) -> None:
            """Do a OPTIONS request. This is an unrecognized request method in our
            codebase.
            """
            self.render_template('invalid_page.html')

    class MockHandlerForTestingErrorPageWithIframed(base.BaseHandler):
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        def get(self) -> None:
            self.iframed = True
            self.render_template('invalid_page.html')

    class MockHandlerForTestingUiAccessWrapper(base.BaseHandler):
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        def get(self) -> None:
            """Handles GET requests."""
            pass

    class MockHandlerForTestingAuthorizationWrapper(base.BaseHandler):
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        def get(self) -> None:
            """Handles GET requests."""
            pass

    def setUp(self) -> None:
        super(BaseHandlerTests, self).setUp()
        self.signup('user@example.com', 'user')

        # Create a user to test redirect behavior for the learner.
        # A "learner" is defined as a user who has not created or contributed
        # to any exploration ever.
        self.signup(self.TEST_LEARNER_EMAIL, self.TEST_LEARNER_USERNAME)

        # Create two users to test redirect behavior for the creators.
        # A "creator" is defined as a user who has created, edited or
        # contributed to any exploration at present or in past.
        self.signup(self.TEST_CREATOR_EMAIL, self.TEST_CREATOR_USERNAME)
        self.signup(self.TEST_EDITOR_EMAIL, self.TEST_EDITOR_USERNAME)

        # Create user that is scheduled for deletion.
        self.signup(self.DELETED_USER_EMAIL, self.DELETED_USER_USERNAME)
        deleted_user_id = self.get_user_id_from_email(self.DELETED_USER_EMAIL)
        wipeout_service.pre_delete_user(deleted_user_id)

        # Create a new user but do not submit their registration form.
        user_services.create_new_user(
            self.get_auth_id_from_email(self.PARTIALLY_LOGGED_IN_USER_EMAIL),
            self.PARTIALLY_LOGGED_IN_USER_EMAIL)

    def test_that_no_get_results_in_500_error(self) -> None:
        """Test that no GET request results in a 500 error."""

        for route in main.URLS:
            # This was needed for the Django tests to pass (at the time we had
            # a Django branch of the codebase).
            if isinstance(route, tuple):
                continue
            else:
                url = route.template
            url = re.sub('<([^/^:]+)>', 'abc123', url)

            # This url is ignored since it is only needed for a protractor test.
            # The backend tests fetch templates from
            # core/templates/pages instead of webpack_bundles since we
            # skip webpack compilation for backend tests.
            # The console_errors.html template is present in
            # core/templates/tests and we want one canonical
            # directory for retrieving templates so we ignore this url.
            if url == '/console_errors':
                continue

            # Some of these will 404 or 302. This is expected.
            self.get_response_without_checking_for_errors(
                url, [200, 301, 302, 400, 401, 404])

        # TODO(sll): Add similar tests for POST, PUT, DELETE.
        # TODO(sll): Set a self.payload attr in the BaseHandler for
        #     POST, PUT and DELETE. Something needs to regulate what
        #     the fields in the payload should be.

    def test_requests_for_missing_csrf_token(self) -> None:
        """Tests request without csrf_token results in 401 error."""

        self.post_json(
            '/community-library/any', data={}, expected_status_int=401)

        self.put_json(
            '/community-library/any', payload={}, expected_status_int=401)

    def test_requests_for_invalid_paths(self) -> None:
        """Test that requests for invalid paths result in a 404 error."""
        user_id = user_services.get_user_id_from_username('learneruser')
        csrf_token = base.CsrfTokenManager.create_csrf_token(user_id)

        self.get_html_response(
            '/community-library/extra', expected_status_int=404)

        self.get_html_response(
            '/community-library/data/extra', expected_status_int=404)

        self.post_json(
            '/community-library/extra', data={}, csrf_token=csrf_token,
            expected_status_int=404)

        self.put_json(
            '/community-library/extra', payload={}, csrf_token=csrf_token,
            expected_status_int=404)

        self.delete_json('/community-library/data', expected_status_int=404)

    def test_html_requests_have_no_store_cache_policy(self) -> None:
        response = self.get_html_response('/community-library')
        # We set 'no-store' and 'must-revalidate', but webapp
        # adds 'no-cache' since it is basically a subset of 'no-store'.
        self.assertEqual(
            response.headers['Cache-Control'],
            'must-revalidate, no-cache, no-store'
        )

    def test_root_redirect_rules_for_deleted_user_prod_mode(self) -> None:
        with self.swap(constants, 'DEV_MODE', False):
            self.login(self.DELETED_USER_EMAIL)
            response = self.get_html_response('/', expected_status_int=302)
            self.assertIn('pending-account-deletion', response.headers['location'])

    def test_root_redirect_rules_for_deleted_user_dev_mode(self) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            self.login(self.DELETED_USER_EMAIL)
            response = self.get_html_response('/', expected_status_int=302)
            self.assertIn('pending-account-deletion', response.headers['location'])

    def test_get_with_invalid_return_type_logs_correct_warning(self) -> None:
        # Modify the testapp to use the mock handler.
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock', self.MockHandlerWithInvalidReturnType,
                name='MockHandlerWithInvalidReturnType')],
            debug=feconf.DEBUG,
        ))

        observed_log_messages: List[str] = []
        def mock_logging_function(msg: str) -> None:
            observed_log_messages.append(msg)

        with self.swap(logging, 'warning', mock_logging_function):
            self.get_json('/mock', expected_status_int=500)
            self.assertEqual(len(observed_log_messages), 1)
            self.assertEqual(
                observed_log_messages[0],
                'Not a recognized return type: defaulting to render JSON.')

    def test_unrecognized_request_method_logs_correct_warning(self) -> None:
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock', self.MockHandlerWithInvalidReturnType,
                name='MockHandlerWithInvalidReturnType')],
            debug=feconf.DEBUG,
        ))

        observed_log_messages: List[str] = []
        def mock_logging_function(msg: str) -> None:
            observed_log_messages.append(msg)

        with self.swap(logging, 'warning', mock_logging_function):
            self.testapp.options('/mock', status=500)
            self.assertEqual(len(observed_log_messages), 1)
            self.assertEqual(
                observed_log_messages[0],
                'Not a recognized request method.')

    def test_renders_error_page_with_iframed(self) -> None:
        # Modify the testapp to use the mock handler.
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_iframed', self.MockHandlerForTestingErrorPageWithIframed,
                name='MockHandlerForTestingErrorPageWithIframed')],
            debug=feconf.DEBUG,
        ))
        # The 500 is expected because the template file does not exist
        # (so it is a legitimate server error caused by the
        # MockHandlerForTestingErrorPageWithIframed).
        response = self.get_html_response(
            '/mock_iframed', expected_status_int=500)

        self.assertIn(
            b'<oppia-error-iframed-page-root></oppia-error-iframed-page-root>',
            response.body
        )

    def test_dev_mode_cannot_be_true_on_production(self) -> None:
        server_software_swap = self.swap(
            os, 'environ', {'SERVER_SOFTWARE': 'Production'})
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'DEV_MODE can\'t be true on production.')
        with assert_raises_regexp_context_manager, server_software_swap:
            # This reloads the feconf module so that all the checks in
            # the module are reexecuted.
            importlib.reload(feconf)  # pylint: disable-all

    def test_frontend_error_handler(self) -> None:
        observed_log_messages: List[str] = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        with self.swap(logging, 'error', _mock_logging_function):
            self.post_json('/frontend_errors', {'error': 'errors'})

        self.assertEqual(observed_log_messages, ['Frontend error: errors'])

    def test_redirect_when_user_is_disabled(self) -> None:
        get_auth_claims_from_request_swap = self.swap_to_always_raise(
            auth_services,
            'get_auth_claims_from_request',
            auth_domain.UserDisabledError
        )
        with get_auth_claims_from_request_swap:
            response = self.get_html_response('/', expected_status_int=302)
            self.assertIn(
                'pending-account-deletion', response.headers['location'])

    def test_redirect_oppia_test_server(self) -> None:
        # The old demo server redirects to the new demo server.
        response = self.get_html_response(
            'https://oppiaserver.appspot.com/splash', expected_status_int=301)
        self.assertEqual(
            response.headers['Location'], 'https://oppiatestserver.appspot.com')

    def test_no_redirection_for_cron_jobs(self) -> None:
        # Valid URL, where user now has permissions.
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.get_json('/cron/models/cleanup', expected_status_int=200)
        self.logout()

        # Valid URL, but user does not have permissions.
        self.get_json(
            'https://oppiaserver.appspot.com/cron/models/cleanup',
            expected_status_int=401)

        # Invalid URL.
        self.get_html_response(
            'https://oppiaserver.appspot.com/cron/unknown',
            expected_status_int=404)

    def test_no_redirection_for_tasks(self) -> None:
        tasks_data = '{"fn_identifier": "%s", "args": [[]], "kwargs": {}}' % (
            taskqueue_services.FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS
        )

        # Valid URL, where user now has permissions.
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.post_json(
            'https://oppiaserver.appspot.com/task/deferredtaskshandler',
            tasks_data,
            use_payload=False,
            expected_status_int=200
        )
        self.logout()

        # Valid URL, but user does not have permissions.
        self.post_json(
            'https://oppiaserver.appspot.com/task/deferredtaskshandler',
            tasks_data,
            expected_status_int=401
        )

    def test_splash_redirect(self) -> None:
        # Tests that the old '/splash' URL is redirected to '/'.
        response = self.get_html_response('/splash', expected_status_int=302)
        self.assertEqual('http://localhost/', response.headers['location'])

    def test_partially_logged_in_redirect(self) -> None:
        login_context = self.login_context(
            self.PARTIALLY_LOGGED_IN_USER_EMAIL)

        with login_context:
            response = self.get_html_response(
                '/splash', expected_status_int=302)
            self.assertEqual(
                response.location,
                'http://localhost/logout?redirect_url=/splash')

    def test_no_partially_logged_in_redirect_from_logout(self) -> None:
        login_context = self.login_context(
            self.PARTIALLY_LOGGED_IN_USER_EMAIL)

        with login_context:
            response = self.get_html_response(
                '/logout', expected_status_int=200)

    def test_unauthorized_user_exception_raised_when_session_is_stale(
        self
    ) -> None:
        with contextlib.ExitStack() as exit_stack:
            call_counter = exit_stack.enter_context(self.swap_with_call_counter(
                auth_services, 'destroy_auth_session'))
            logs = exit_stack.enter_context(
                self.capture_logging(min_level=logging.ERROR))
            exit_stack.enter_context(self.swap_to_always_raise(
                auth_services, 'get_auth_claims_from_request',
                error=auth_domain.StaleAuthSessionError('uh-oh')))

            response = self.get_html_response('/', expected_status_int=302)

        self.assertEqual(call_counter.times_called, 1)
        self.assertEqual(
            response.location,
            'http://localhost/login?return_url=http%3A%2F%2Flocalhost%2F')

    def test_unauthorized_user_exception_raised_when_session_is_invalid(
        self
    ) -> None:
        with contextlib.ExitStack() as exit_stack:
            call_counter = exit_stack.enter_context(self.swap_with_call_counter(
                auth_services, 'destroy_auth_session'))
            logs = exit_stack.enter_context(
                self.capture_logging(min_level=logging.ERROR))
            exit_stack.enter_context(self.swap_to_always_raise(
                auth_services, 'get_auth_claims_from_request',
                error=auth_domain.InvalidAuthSessionError('uh-oh')))

            response = self.get_html_response('/', expected_status_int=302)

        self.assert_matches_regexps(logs, ['User session is invalid!'])
        self.assertEqual(call_counter.times_called, 1)
        self.assertEqual(
            response.location,
            'http://localhost/login?return_url=http%3A%2F%2Flocalhost%2F')

    def test_signup_attempt_on_wrong_page_fails(self) -> None:
        with contextlib.ExitStack() as exit_stack:
            call_counter = exit_stack.enter_context(self.swap_with_call_counter(
                auth_services, 'destroy_auth_session'))
            logs = exit_stack.enter_context(
                self.capture_logging(min_level=logging.ERROR))
            exit_stack.enter_context(self.swap_to_always_return(
                auth_services,
                'get_auth_claims_from_request',
                auth_domain.AuthClaims(
                    'auth_id', self.NEW_USER_EMAIL, role_is_super_admin=False)
            ))
            response = self.get_html_response('/', expected_status_int=200)
            self.assertIn(
                b'<lightweight-oppia-root></lightweight-oppia-root>',
                response.body
            )

        self.assert_matches_regexps(
            logs,
            [
                'Cannot find user auth_id with email %s on '
                'page http://localhost/\nNoneType: None' % self.NEW_USER_EMAIL
            ]
        )
        self.assertEqual(call_counter.times_called, 1)

    def test_user_without_email_id_raises_exception(self) -> None:
        with contextlib.ExitStack() as exit_stack:
            swap_auth_claim = self.swap_to_always_return(
                auth_services,
                'get_auth_claims_from_request',
                auth_domain.AuthClaims(
                    'auth_id', None, role_is_super_admin=False)
            )
            logs = exit_stack.enter_context(
                self.capture_logging(min_level=logging.ERROR)
            )
            with swap_auth_claim:
                self.get_html_response('/')

        self.assert_matches_regexps(
            logs,
            [
                'No email address was found for the user.'
            ]
        )

    def test_logs_request_with_invalid_payload(self) -> None:
        with contextlib.ExitStack() as exit_stack:
            logs = exit_stack.enter_context(
                self.capture_logging(min_level=logging.ERROR))
            exit_stack.enter_context(self.swap_to_always_raise(
                webapp2.Request, 'get',
                error=ValueError('uh-oh')))
            self.get_custom_response(
                '/',
                expected_content_type='text/plain',
                params=None,
                expected_status_int=500)

        self.assertRegexpMatches(
            logs[0],
            'uh-oh: request GET /')


class MissingHandlerArgsTests(test_utils.GenericTestBase):

    class MissingArgsHandler(base.BaseHandler):
        """Mock handler for testing."""
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}

        def post(self) -> None:
            """Handles POST requests."""
            self.render_json({})

    def setUp(self) -> None:
        super(MissingHandlerArgsTests, self).setUp()

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        # Modify the testapp to use the MissingArgsHandler.
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [
                webapp2.Route(
                    '/MissingArgHandler',
                    self.MissingArgsHandler,
                    name='MissingArgHandler'
                )
            ],
            debug=feconf.DEBUG,
        ))

    def test_missing_arg_handler_raises_error(self) -> None:
        response = self.testapp.post('/MissingArgHandler', status=500)
        parsed_response = json.loads(response.body[len(feconf.XSSI_PREFIX):])
        self.assertEqual(
            parsed_response['error'],
            'Missing schema for POST method in MissingArgsHandler handler class.'
        )


class MaintenanceModeTests(test_utils.GenericTestBase):
    """Tests BaseHandler behavior when maintenance mode is enabled.

    Each test case runs within a context where ENABLE_MAINTENANCE_MODE is True.
    """

    def setUp(self) -> None:
        super(MaintenanceModeTests, self).setUp()
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)
        with contextlib.ExitStack() as context_stack:
            context_stack.enter_context(
                self.swap(feconf, 'ENABLE_MAINTENANCE_MODE', True))
            self.context_stack = context_stack.pop_all()

    def tearDown(self) -> None:
        self.context_stack.close()
        super(MaintenanceModeTests, self).tearDown()

    def test_html_response_is_rejected(self) -> None:
        destroy_auth_session_call_counter = self.context_stack.enter_context(
            self.swap_with_call_counter(auth_services, 'destroy_auth_session'))

        response = self.get_html_response(
            '/community-library', expected_status_int=200)

        self.assertIn(b'<oppia-maintenance-page>', response.body)
        self.assertNotIn(b'<oppia-library-page-root>', response.body)
        self.assertEqual(destroy_auth_session_call_counter.times_called, 1)

    def test_html_response_is_not_rejected_when_user_is_super_admin(
        self
    ) -> None:
        self.context_stack.enter_context(self.super_admin_context())
        destroy_auth_session_call_counter = self.context_stack.enter_context(
            self.swap_with_call_counter(auth_services, 'destroy_auth_session'))

        response = self.get_html_response('/community-library')

        self.assertIn(b'<oppia-root></oppia-root>', response.body)
        self.assertNotIn(b'<oppia-maintenance-page>', response.body)
        self.assertEqual(destroy_auth_session_call_counter.times_called, 0)

    def test_html_response_is_not_rejected_when_user_is_release_coordinator(
        self
    ) -> None:
        self.context_stack.enter_context(
            self.login_context(self.RELEASE_COORDINATOR_EMAIL))
        destroy_auth_session_call_counter = self.context_stack.enter_context(
            self.swap_with_call_counter(auth_services, 'destroy_auth_session'))

        response = self.get_html_response('/community-library')

        self.assertIn(b'<oppia-root></oppia-root>', response.body)
        self.assertNotIn(b'<oppia-maintenance-page>', response.body)
        self.assertEqual(destroy_auth_session_call_counter.times_called, 0)

    def test_csrfhandler_handler_is_not_rejected(self) -> None:
        response = self.get_json('/csrfhandler')

        self.assertTrue(
            base.CsrfTokenManager.is_csrf_token_valid(None, response['token']))

    def test_session_begin_handler_is_not_rejected(self) -> None:
        call_counter = self.context_stack.enter_context(
            self.swap_with_call_counter(
                auth_services, 'establish_auth_session'))

        self.get_html_response('/session_begin', expected_status_int=200)

        self.assertEqual(call_counter.times_called, 1)

    def test_session_end_handler_is_not_rejected(self) -> None:
        call_counter = self.context_stack.enter_context(
            self.swap_with_call_counter(auth_services, 'destroy_auth_session'))

        self.get_html_response('/session_end', expected_status_int=200)

        self.assertEqual(call_counter.times_called, 1)

    def test_signup_fails(self) -> None:
        with self.assertRaisesRegex(
            Exception, '\'<oppia-maintenance-page>\' unexpectedly found in'):
            self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_signup_succeeds_when_maintenance_mode_is_disabled(self) -> None:
        with self.swap(feconf, 'ENABLE_MAINTENANCE_MODE', False):
            self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_signup_succeeds_when_user_is_super_admin(self) -> None:
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL,
            self.CURRICULUM_ADMIN_USERNAME,
            is_super_admin=True
        )

    def test_admin_auth_session_is_preserved_when_in_maintenance_mode(
        self
    ) -> None:
        # TODO(#12692): Use stateful login sessions to assert the behavior of
        # logging out, rather than asserting that destroy_auth_session() gets
        # called.
        destroy_auth_session_call_counter = self.context_stack.enter_context(
            self.swap_with_call_counter(auth_services, 'destroy_auth_session'))
        self.context_stack.enter_context(self.super_admin_context())

        with self.swap(feconf, 'ENABLE_MAINTENANCE_MODE', False):
            self.get_json('/url_handler?current_url=/')

        self.assertEqual(destroy_auth_session_call_counter.times_called, 0)

        self.get_json('/url_handler?current_url=/')

        self.assertEqual(destroy_auth_session_call_counter.times_called, 0)

    def test_non_admin_auth_session_is_destroyed_when_in_maintenance_mode(
        self
    ) -> None:
        # TODO(#12692): Use stateful login sessions to assert the behavior of
        # logging out, rather than asserting that destroy_auth_session() gets
        # called.
        destroy_auth_session_call_counter = self.context_stack.enter_context(
            self.swap_with_call_counter(auth_services, 'destroy_auth_session'))

        with self.swap(feconf, 'ENABLE_MAINTENANCE_MODE', False):
            self.get_json('/url_handler?current_url=/')

        self.assertEqual(destroy_auth_session_call_counter.times_called, 0)

        response = self.get_html_response('/url_handler?current_url=/')
        self.assertIn(b'<oppia-maintenance-page>', response.body)

        self.assertEqual(destroy_auth_session_call_counter.times_called, 1)


class CsrfTokenManagerTests(test_utils.GenericTestBase):

    def test_create_and_validate_token(self) -> None:
        uid = 'user_id'

        token = base.CsrfTokenManager.create_csrf_token(uid)
        self.assertTrue(base.CsrfTokenManager.is_csrf_token_valid(
            uid, token))

        self.assertFalse(
            base.CsrfTokenManager.is_csrf_token_valid('bad_user', token))
        self.assertFalse(
            base.CsrfTokenManager.is_csrf_token_valid(uid, 'new_token'))
        self.assertFalse(
            base.CsrfTokenManager.is_csrf_token_valid(uid, 'new/token'))

    def test_non_default_csrf_secret_is_used(self) -> None:
        base.CsrfTokenManager.create_csrf_token('uid')
        self.assertNotEqual(base.CSRF_SECRET.value, base.DEFAULT_CSRF_SECRET)

    def test_token_expiry(self) -> None:
        # This can be any value.
        orig_time = 100.0
        current_time = orig_time

        def mock_get_current_time(unused_cls: str) -> float:
            return current_time

        with self.swap(
            base.CsrfTokenManager, '_get_current_time',
            types.MethodType(mock_get_current_time, base.CsrfTokenManager)):
            # Create a token and check that it expires correctly.
            token = base.CsrfTokenManager().create_csrf_token('uid')
            self.assertTrue(base.CsrfTokenManager.is_csrf_token_valid(
                'uid', token))

            current_time = orig_time + 1
            self.assertTrue(base.CsrfTokenManager.is_csrf_token_valid(
                'uid', token))

            current_time = orig_time + FORTY_EIGHT_HOURS_IN_SECS - PADDING
            self.assertTrue(base.CsrfTokenManager.is_csrf_token_valid(
                'uid', token))

            current_time = orig_time + FORTY_EIGHT_HOURS_IN_SECS + PADDING
            self.assertFalse(base.CsrfTokenManager.is_csrf_token_valid(
                'uid', token))


class EscapingTests(test_utils.GenericTestBase):

    class FakePage(base.BaseHandler):
        """Fake page for testing autoescaping."""
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'POST': {}}

        def post(self) -> None:
            """Handles POST requests."""
            self.render_json({'big_value': u'\n<script>马={{'})

    def setUp(self) -> None:
        super(EscapingTests, self).setUp()

        # Update a config property that shows in all pages.
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        # Modify the testapp to use the fake handler.
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/fake', self.FakePage, name='FakePage')],
            debug=feconf.DEBUG,
        ))

    def test_special_char_escaping(self) -> None:
        response = self.testapp.post('/fake', params={})
        self.assertEqual(response.status_int, 200)

        self.assertTrue(response.body.startswith(feconf.XSSI_PREFIX))
        self.assertIn(b'\\n\\u003cscript\\u003e\\u9a6c={{', response.body)
        self.assertNotIn(b'<script>', response.body)
        self.assertNotIn('马'.encode('utf-8'), response.body)


class RenderDownloadableTests(test_utils.GenericTestBase):

    class MockHandler(base.BaseHandler):
        """Mock handler that subclasses BaseHandler and serves a response
        that is of a 'downloadable' type.
        """
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        def get(self) -> None:
            """Handles GET requests."""
            file_contents = io.BytesIO(b'example')
            self.render_downloadable_file(
                file_contents, 'example.pdf', 'text/plain')

    def setUp(self) -> None:
        super(RenderDownloadableTests, self).setUp()

        # Modify the testapp to use the mock handler.
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock', self.MockHandler, name='MockHandler')],
            debug=feconf.DEBUG,
        ))

    def test_downloadable(self) -> None:
        response = self.testapp.get('/mock')
        self.assertEqual(
            response.content_disposition, 'attachment; filename=example.pdf')
        self.assertEqual(response.body, b'example')
        self.assertEqual(response.content_type, 'text/plain')


class SessionBeginHandlerTests(test_utils.GenericTestBase):
    """Tests for /session_begin handler."""

    def test_get(self) -> None:
        swap = self.swap_with_call_counter(
            auth_services, 'establish_auth_session')

        with swap as call_counter:
            self.get_html_response('/session_begin', expected_status_int=200)

        self.assertEqual(call_counter.times_called, 1)


class SessionEndHandlerTests(test_utils.GenericTestBase):
    """Tests for /session_end handler."""

    def test_get(self) -> None:
        swap = (
            self.swap_with_call_counter(auth_services, 'destroy_auth_session'))

        with swap as call_counter:
            self.get_html_response('/session_end', expected_status_int=200)

        self.assertEqual(call_counter.times_called, 1)


class I18nDictsTests(test_utils.GenericTestBase):
    """Tests for I18n dicts."""

    def _extract_keys_from_json_file(self, filename: str) -> List[str]:
        """Returns the extracted keys from the json file corresponding to the
        given filename.
        """
        return sorted(json.loads(utils.get_file_contents(
            os.path.join(os.getcwd(), self.get_static_asset_filepath(),
                         'assets', 'i18n', filename)
        )).keys())

    def _extract_keys_from_html_file(self, filename: str) -> List[str]:
        """Returns the extracted keys from the html file corresponding to the
        given filename.
        """
        # The \b is added at the start to ensure that keys ending with
        # '_I18N_IDS' do not get matched. Instances of such keys can be found
        # in learner_dashboard.html.
        regex_pattern = r'(\bI18N_[A-Z/_\d]*)'
        return re.findall(regex_pattern, utils.get_file_contents(
            filename))

    def _get_tags(
        self, input_string: str, key: str, filename: str
    ) -> List[str]:
        """Returns the parts in the input string that lie within <...>
        characters.

        Args:
            input_string: str. The string to extract tags from.
            key: str. The key for the key-value pair in the dict where the
                string comes from (the string is typically the value in this
                key-value pair). This is used only for logging errors.
            filename: str. The filename which the string comes from. This is
                used only for logging errors.

        Returns:
            list(str). A list of all tags contained in the input string.
        """
        result = []
        bracket_level = 0
        current_string = ''
        for c in input_string:
            if c == '<':
                current_string += c
                bracket_level += 1
            elif c == '>':
                self.assertGreater(
                    bracket_level, 0,
                    msg='Invalid HTML: %s at %s in %s' % (
                        input_string, key, filename))
                result.append(current_string + c)
                current_string = ''
                bracket_level -= 1
            elif bracket_level > 0:
                current_string += c

        self.assertEqual(
            bracket_level, 0,
            msg='Invalid HTML: %s at %s in %s' % (input_string, key, filename))
        return sorted(result)

    def test_i18n_keys(self) -> None:
        """Tests that the keys in all JSON files are a subset of those in
        en.json.
        """
        master_key_list = self._extract_keys_from_json_file('en.json')
        self.assertGreater(len(master_key_list), 0)

        supported_language_filenames = [
            ('%s.json' % language_details['id'])
            for language_details in constants.SUPPORTED_SITE_LANGUAGES]

        filenames = os.listdir(
            os.path.join(os.getcwd(), self.get_static_asset_filepath(),
                         'assets', 'i18n'))
        for filename in filenames:
            if filename == 'en.json':
                continue

            key_list = self._extract_keys_from_json_file(filename)
            # All other JSON files should have a subset of the keys in en.json.
            self.assertEqual(len(set(key_list) - set(master_key_list)), 0)

            # If there are missing keys in supported site languages, log an
            # error, but don't fail the tests.
            if (filename in supported_language_filenames and
                    set(key_list) != set(master_key_list)):
                untranslated_keys = list(set(master_key_list) - set(key_list))
                self.log_line('Untranslated keys in %s:' % filename)
                for key in untranslated_keys:
                    self.log_line('- %s' % key)
                self.log_line('')

    def test_alphabetic_i18n_keys(self) -> None:
        """Tests that the keys of all i18n json files are arranged in
        alphabetical order.
        """
        filenames = os.listdir(
            os.path.join(os.getcwd(), self.get_static_asset_filepath(),
                         'assets', 'i18n'))
        for filename in filenames:
            with utils.open_file(
                os.path.join(os.getcwd(), 'assets', 'i18n', filename),
                mode='r') as f:
                lines = f.readlines()
                self.assertEqual(lines[0], '{\n')
                self.assertEqual(lines[-1], '}\n')
                lines = lines[1:-1]

                key_list = [line[:line.find(':')].strip() for line in lines]
                for key in key_list:
                    self.assertTrue(key.startswith('"I18N_'))
                    if not key.startswith('"I18N_'):
                        self.log_line('Bad line in file: %s' % filename)
                self.assertEqual(sorted(key_list), key_list)

    # TODO(#14645): Remove this method when translation service is extended.
    def test_hacky_tranlsation_keys_match_constants_en(self) -> None:
        """Tests that the hacky translation keys present in constants file
        are also present in en.json.
        """
        en_key_list = self._extract_keys_from_json_file('en.json')
        hacky_translation_keys = constants.HACKY_TRANSLATION_KEYS
        missing_hacky_translation_keys = list(
            set(hacky_translation_keys) - set(en_key_list))
        self.assertEqual(missing_hacky_translation_keys, [])

    def test_keys_match_en_qqq(self) -> None:
        """Tests that en.json and qqq.json have the exact same set of keys."""
        en_key_list = self._extract_keys_from_json_file('en.json')
        qqq_key_list = self._extract_keys_from_json_file('qqq.json')
        self.assertEqual(en_key_list, qqq_key_list)

    def test_keys_in_source_code_match_en(self) -> None:
        """Tests that keys in HTML files are present in en.json."""
        en_key_list = self._extract_keys_from_json_file('en.json')
        dirs_to_search = [
            os.path.join('core', 'templates', ''),
            'extensions']
        files_checked = 0
        missing_keys_count = 0
        for directory in dirs_to_search:
            for root, _, files in os.walk(os.path.join(os.getcwd(), directory)):
                for filename in files:
                    if filename.endswith('.html'):
                        files_checked += 1
                        html_key_list = self._extract_keys_from_html_file(
                            os.path.join(root, filename))
                        if not set(html_key_list) <= set(en_key_list): #pylint: disable=unneeded-not
                            self.log_line('ERROR: Undefined keys in %s:'
                                          % os.path.join(root, filename))
                            missing_keys = list(
                                set(html_key_list) - set(en_key_list))
                            missing_keys_count += len(missing_keys)
                            for key in missing_keys:
                                self.log_line(' - %s' % key)
                            self.log_line('')
        self.assertEqual(missing_keys_count, 0)
        self.assertGreater(files_checked, 0)

    def test_html_in_translations_is_preserved_correctly(self) -> None:
        """Tests that HTML in translated strings matches the original
        structure.
        """
        # For this test, show the entire diff if there is a mismatch.
        self.maxDiff = 0

        master_translation_dict = json.loads(utils.get_file_contents(
            os.path.join(os.getcwd(), 'assets', 'i18n', 'en.json')))
        # Remove anything outside '<'...'>' tags. Note that this handles both
        # HTML tags and Angular variable interpolations.
        master_tags_dict = {
            key: self._get_tags(value, key, 'en.json')
            for key, value in master_translation_dict.items()
        }

        mismatches = []

        filenames = os.listdir(os.path.join(
            os.getcwd(), self.get_static_asset_filepath(), 'assets', 'i18n'))
        for filename in filenames:
            if filename == 'qqq.json':
                continue
            translation_dict = json.loads(utils.get_file_contents(
                os.path.join(os.getcwd(), 'assets', 'i18n', filename)))
            for key, value in translation_dict.items():
                tags = self._get_tags(value, key, filename)
                if tags != master_tags_dict[key]:
                    mismatches.append('%s (%s): %s != %s' % (
                        filename, key, tags, master_tags_dict[key]))

        # Sorting the list before printing makes it easier to systematically
        # fix any issues that arise.
        self.assertEqual(sorted(mismatches), [])


class GetHandlerTypeIfExceptionRaisedTests(test_utils.GenericTestBase):

    class FakeHandler(base.BaseHandler):
        """A fake handler class."""
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        def get(self) -> None:
            """Handles get requests."""
            raise self.InternalErrorException('fake exception')

    def test_error_response_for_get_request_of_type_json_has_json_format(
        self
    ) -> None:
        fake_urls = []
        fake_urls.append(main.get_redirect_route(r'/fake', self.FakeHandler))
        fake_urls.append(main.URLS[-1])
        with self.swap(main, 'URLS', fake_urls):
            self.testapp = webtest.TestApp(
                webapp2.WSGIApplication(main.URLS, debug=feconf.DEBUG))
            response = self.get_json(
                '/fake', expected_status_int=500)
            self.assertTrue(isinstance(response, dict))


class CheckAllHandlersHaveDecoratorTests(test_utils.GenericTestBase):
    """Tests that all methods in handlers have authentication decorators
    applied on them.
    """

    # Following handlers are present in base.py where acl_decorators cannot be
    # imported.
    UNDECORATED_HANDLERS: FrozenSet[str] = frozenset([
        'CsrfTokenHandler',
        'Error404Handler',
        'SessionBeginHandler',
        'SessionEndHandler',
        'SeedFirebaseHandler',
    ])

    def test_every_method_has_decorator(self) -> None:
        handlers_checked = []

        for route in main.URLS:
            # URLS = MAPREDUCE_HANDLERS + other handlers. MAPREDUCE_HANDLERS
            # are tuples. So, below check is to handle them.
            if isinstance(route, tuple):
                continue
            else:
                handler = route.handler

            if handler.__name__ in self.UNDECORATED_HANDLERS:
                continue

            if handler.get != base.BaseHandler.get:
                handler_is_decorated = hasattr(handler.get, '__wrapped__')
                handlers_checked.append(
                    (handler.__name__, 'GET', handler_is_decorated))

            if handler.post != base.BaseHandler.post:
                handler_is_decorated = hasattr(handler.post, '__wrapped__')
                handlers_checked.append(
                    (handler.__name__, 'POST', handler_is_decorated))

            if handler.put != base.BaseHandler.put:
                handler_is_decorated = hasattr(handler.put, '__wrapped__')
                handlers_checked.append(
                    (handler.__name__, 'PUT', handler_is_decorated))

            if handler.delete != base.BaseHandler.delete:
                handler_is_decorated = hasattr(handler.delete, '__wrapped__')
                handlers_checked.append(
                    (handler.__name__, 'DELETE', handler_is_decorated))

        self.log_line('Verifying decorators for handlers .... ')
        for (name, method, handler_is_decorated) in handlers_checked:
            self.log_line('%s %s method: %s' % (
                name, method, 'PASS' if handler_is_decorated else 'FAIL'))
        self.log_line(
            'Total number of handlers checked: %s' % len(handlers_checked))

        self.assertGreater(len(handlers_checked), 0)

        for (name, method, handler_is_decorated) in handlers_checked:
            with self.subTest('%s.%s' % (name, method)):
                self.assertTrue(handler_is_decorated)


class GetItemsEscapedCharactersTests(test_utils.GenericTestBase):
    """Test that request.GET.items() correctly retrieves escaped characters."""
    class MockHandler(base.BaseHandler):
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        def get(self) -> None:
            self.values.update(list(self.request.GET.items()))
            self.render_json(self.values)

    def test_get_items(self) -> None:
        mock_testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock', self.MockHandler)],
            debug=feconf.DEBUG,
        ))
        with self.swap(self, 'testapp', mock_testapp):
            params = {
                'param1': 'value1',
                'param2': 'value2'
            }
            result = self.get_json('/mock?param1=value1&param2=value2')
            self.assertDictContainsSubset(params, result)
            params = {
                'param1': 'value with space',
                'param2': 'value with & + - /',
                'param3': 'value with . % @ 123 = ! <>'
            }
            result = self.get_json(
                r'/mock?param1=value%20with%20space&'
                'param2=value%20with%20%26%20%2B%20-%20/&'
                'param3=value%20with%20.%20%%20@%20123%20=%20!%20%3C%3E')
            self.assertDictContainsSubset(params, result)


class ControllerClassNameTests(test_utils.GenericTestBase):

    def test_controller_class_names(self) -> None:
        """This function checks that all controller class names end with
        either 'Handler', 'Page' or 'FileDownloader'.
        """
        # A mapping of returned handler types to expected name endings.
        handler_type_to_name_endings_dict = {
            feconf.HANDLER_TYPE_HTML: 'Page',
            feconf.HANDLER_TYPE_JSON: 'Handler',
            feconf.HANDLER_TYPE_DOWNLOADABLE: 'FileDownloader',
        }
        num_handlers_checked = 0
        for url in main.URLS:
            clazz = url.handler
            num_handlers_checked += 1
            all_base_classes = [
                base_class.__name__ for base_class in inspect.getmro(clazz)]

            # Check that it is a subclass of 'BaseHandler'.
            if 'BaseHandler' in all_base_classes:
                class_return_type = clazz.GET_HANDLER_ERROR_RETURN_TYPE
                # Check that any class with a get handler has a
                # GET_HANDLER_ERROR_RETURN_TYPE that's one of
                # the allowed values.
                if 'get' in clazz.__dict__.keys():
                    self.assertIn(
                        class_return_type, handler_type_to_name_endings_dict)
                class_name = clazz.__name__
                # BulkEmailWebhookEndpoint is a unique class, compared to
                # others, since it is never called from the frontend, and so
                # the error raised here on it - 'Please ensure that the name
                # of this class ends with 'Page'' - doesn't apply.
                # It is only called from the bulk email provider via a
                # webhook to update Oppia's database.
                if class_name == 'BulkEmailWebhookEndpoint':
                    continue
                file_name = inspect.getfile(clazz)
                line_num = inspect.getsourcelines(clazz)[1]
                allowed_class_ending = (
                    handler_type_to_name_endings_dict[class_return_type])
                # Check that the name of the class ends with
                # the proper word if it has a get function.
                if 'get' in clazz.__dict__.keys():
                    message = (
                        'Please ensure that the name of this class '
                        'ends with \'%s\'' % allowed_class_ending)
                    error_message = (
                        '%s --> Line %s: %s' % (file_name, line_num, message))
                    with self.subTest(class_name):
                        self.assertTrue(
                            class_name.endswith(allowed_class_ending),
                            msg=error_message)

                # Check that the name of the class ends with 'Handler'
                # if it does not has a get function.
                else:
                    message = (
                        'Please ensure that the name of this class '
                        'ends with \'Handler\'')
                    error_message = (
                        '%s --> Line %s: %s'
                        % (file_name, line_num, message))
                    with self.subTest(class_name):
                        self.assertTrue(
                            class_name.endswith('Handler'), msg=error_message)

        self.assertGreater(num_handlers_checked, 275)


class MockHandlerForTestingPageIframingNormalizedRequestDict(TypedDict):
    """Dict representation of MockHandlerForTestingPageIframing's
    normalized_request dictionary.
    """

    iframe_restriction: Optional[str]


class IframeRestrictionTests(test_utils.GenericTestBase):

    class MockHandlerForTestingPageIframing(base.BaseHandler):
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'GET': {
                'iframe_restriction': {
                    'schema': {
                        'type': 'basestring'
                    },
                    'default_value': None
                }
            }
        }

        def get(self) -> None:
            # Here we use cast because we are narrowing down the type of
            # 'normalized_request' from Dict[str, Any] to a particular
            # TypedDict that was defined according to the schemas. So that
            # the type of fetched values is not considered as Any type.
            request_data = cast(
                MockHandlerForTestingPageIframingNormalizedRequestDict,
                self.normalized_request
            )
            iframe_restriction = request_data.get('iframe_restriction', None)
            self.render_template(
                'oppia-root.mainpage.html',
                iframe_restriction=iframe_restriction)

    def setUp(self) -> None:
        super(IframeRestrictionTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        # Modify the testapp to use the mock handler.
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock', self.MockHandlerForTestingPageIframing,
                name='MockHandlerForTestingPageIframing')],
            debug=feconf.DEBUG,
        ))

    def test_responses_with_valid_iframe_restriction(self) -> None:
        self.login(self.OWNER_EMAIL)
        self.get_html_response('/mock')

        response = self.get_html_response(
            '/mock', params={'iframe_restriction': 'DENY'})
        self.assertEqual(response.headers['X-Frame-Options'], 'DENY')

        response = self.get_html_response(
            '/mock', params={'iframe_restriction': 'SAMEORIGIN'})
        self.assertEqual(response.headers['X-Frame-Options'], 'SAMEORIGIN')

        self.logout()

    def test_responses_with_invalid_iframe_restriction(self) -> None:
        self.login(self.OWNER_EMAIL)
        self.get_html_response(
            '/mock', params={
                'iframe_restriction': 'invalid_iframe_restriction'},
            expected_status_int=500)
        self.logout()


class SignUpTests(test_utils.GenericTestBase):

    def test_error_is_raised_on_opening_new_tab_during_signup(self) -> None:
        """Test that error is raised if user opens a new tab
        during signup.
        """
        self.login('abc@example.com')
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()

        response = self.get_html_response('/about', expected_status_int=302)
        self.assertIn('logout', response.location)
        self.logout()

        response = self.post_json(
            feconf.SIGNUP_DATA_URL, {
                'username': 'abc',
                'agreed_to_terms': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
            }, csrf_token=csrf_token, expected_status_int=401,
        )

        self.assertEqual(response['error'], 'Registration session expired.')

    def test_no_error_is_raised_on_opening_new_tab_after_signup(self) -> None:
        """Test that no error is raised if user opens a new tab
        after signup.
        """
        self.login('abc@example.com')
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.SIGNUP_DATA_URL, {
                'username': 'abc',
                'agreed_to_terms': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
            }, csrf_token=csrf_token,
        )

        self.get_html_response('/community-library')

    def test_error_is_raised_during_signup_using_invalid_token(self) -> None:
        """Test that error is raised if user tries to signup
        using invalid CSRF token.
        """
        self.login('abc@example.com')
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')

        response = self.post_json(
            feconf.SIGNUP_DATA_URL, {
                'username': 'abc',
                'agreed_to_terms': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
            }, csrf_token='invalid_token', expected_status_int=401,
        )

        self.assertEqual(response['error'],
            'Your session has expired, and unfortunately your '
            'changes cannot be saved. Please refresh the page.')


class CsrfTokenHandlerTests(test_utils.GenericTestBase):

    def test_valid_token_is_returned(self) -> None:
        """Test that a valid CSRF token is returned by
        the handler.
        """

        response = self.get_json('/csrfhandler')
        csrf_token = response['token']

        self.assertTrue(base.CsrfTokenManager.is_csrf_token_valid(
            None, csrf_token))


class CorrectMockVMHandlerNormalizedPayloadDict(TypedDict):
    """Type for the CorrectMockVMHandler's normalized_payload dictionary."""

    vm_id: str
    signature: str
    message: bytes


class OppiaMLVMHandlerTests(test_utils.GenericTestBase):
    """Unit tests for OppiaMLVMHandler class."""

    class IncorrectMockVMHandler(base.OppiaMLVMHandler):
        """Derived VM Handler class with missing function implementation for
        extract_request_message_vm_id_and_signature function.
        """

        REQUIRE_PAYLOAD_CSRF_CHECK = False
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'POST': {
                'vm_id': {'schema': {'type': 'basestring'}},
                'signature': {'schema': {'type': 'basestring'}},
                'message': {'schema': {'type': 'basestring'}},
            }
        }

        @acl_decorators.is_from_oppia_ml
        def post(self) -> None:
            return self.render_json({})

    class CorrectMockVMHandler(base.OppiaMLVMHandler):
        """Derived VM Handler class with
        extract_request_message_vm_id_and_signature function implementation.
        """

        REQUIRE_PAYLOAD_CSRF_CHECK = False
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'POST': {
                'vm_id': {'schema': {'type': 'basestring'}},
                'signature': {'schema': {'type': 'basestring'}},
                'message': {'schema': {'type': 'basestring'}},
            }
        }

        def extract_request_message_vm_id_and_signature(
            self
        ) -> classifier_domain.OppiaMLAuthInfo:
            """Returns the message, vm_id and signature retrieved from the
            incoming requests.
            """
            # Here we use cast because we are narrowing down the type of
            # 'normalized_payload' from Dict[str, Any] to a particular
            # TypedDict that was defined according to the schemas. So that
            # the type of fetched values is not considered as Any type.
            payload_data = cast(
                CorrectMockVMHandlerNormalizedPayloadDict,
                self.normalized_payload
            )
            signature = payload_data['signature']
            vm_id = payload_data['vm_id']
            message = payload_data['message']
            return classifier_domain.OppiaMLAuthInfo(message, vm_id, signature)

        @acl_decorators.is_from_oppia_ml
        def post(self) -> None:
            self.render_json({'job_id': 'new_job'})

    def setUp(self) -> None:
        super(OppiaMLVMHandlerTests, self).setUp()
        self.mock_testapp = webtest.TestApp(webapp2.WSGIApplication([
            webapp2.Route('/incorrectmock', self.IncorrectMockVMHandler),
            webapp2.Route('/correctmock', self.CorrectMockVMHandler)],
            debug=feconf.DEBUG,
        ))

    def test_that_incorrect_derived_class_raises_exception(self) -> None:
        payload = {}
        payload['vm_id'] = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        payload['message'] = json.dumps('message')
        payload['signature'] = classifier_services.generate_signature(
            secret.encode('utf-8'),
            payload['message'].encode('utf-8'),
            payload['vm_id'])

        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/incorrectmock', payload, expected_status_int=500)

    def test_that_correct_derived_class_does_not_raise_exception(self) -> None:
        payload = {}
        payload['vm_id'] = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        payload['message'] = json.dumps('message')
        payload['signature'] = classifier_services.generate_signature(
            secret.encode('utf-8'),
            payload['message'].encode('utf-8'),
            payload['vm_id'])
        with self.swap(self, 'testapp', self.mock_testapp):
            self.post_json(
                '/correctmock', payload, expected_status_int=200)


class SchemaValidationIntegrationTests(test_utils.GenericTestBase):
    """Tests all the functionality of SVS(Schema-Validation-System)
    architecture.
    """
    handler_class_names_with_no_schema: Final = (
        handler_schema_constants.HANDLER_CLASS_NAMES_WITH_NO_SCHEMA)
    wiki_page_link: Final = (
        'https://github.com/oppia/oppia/wiki/Writing-schema-for-handler-args')

    def _get_list_of_routes_which_need_schemas(
        self
    ) -> List[routes.RedirectRoute]:
        """This method iterates over all the routes and returns those routes
        which need schemas.

        Returns:
            list(RedirectRoute). A list of RedirectRoute objects.
        """
        # TODO(#13139): Remove if condition from the list comprehension,
        # once all the MAPREDUCE_HANDLERS are removed from the codebase.
        return [route for route in main.URLS if not isinstance(route, tuple)]

    def test_every_handler_class_has_schema(self) -> None:
        """This test ensures that every child class of BaseHandler
        has an associated schema.
        """
        list_of_handlers_which_need_schemas = []
        list_of_routes_which_need_schemas = (
            self._get_list_of_routes_which_need_schemas())

        for route in list_of_routes_which_need_schemas:
            handler = route.handler

            handler_class_name = handler.__name__
            if handler_class_name in self.handler_class_names_with_no_schema:
                continue

            schema_written_for_request_methods = (
                handler.HANDLER_ARGS_SCHEMAS is not None)
            schema_written_for_url_path_args = (
                handler.URL_PATH_ARGS_SCHEMAS is not None)
            handler_has_schemas = (schema_written_for_request_methods and
                schema_written_for_url_path_args)

            if handler_has_schemas is False:
                list_of_handlers_which_need_schemas.append(handler_class_name)

        error_msg = (
            'The following handlers have missing schemas: [ %s ].'
            '\nVisit %s to learn how to write schemas for handler args.' % (
                ', '.join(
                    list_of_handlers_which_need_schemas), self.wiki_page_link))

        self.assertEqual(list_of_handlers_which_need_schemas, [], error_msg)

    def test_schema_keys_exactly_match_with_url_path_elements(self) -> None:
        """This test ensures that schema keys in URL_PATH_ARGS_SCHEMAS must
        exactly match with url path elements.
        """
        handlers_with_missing_url_schema_keys = []
        list_of_routes_which_need_schemas = (
            self._get_list_of_routes_which_need_schemas())

        for route in list_of_routes_which_need_schemas:
            handler = route.handler

            handler_class_name = handler.__name__
            if handler_class_name in self.handler_class_names_with_no_schema:
                continue
            if handler.URL_PATH_ARGS_SCHEMAS is None:
                continue

            regex_pattern = r'<.*?>'
            url_path_elements = [
                keyword[1:-1] for keyword in re.findall(
                    regex_pattern, route.name)]
            schema_keys = handler.URL_PATH_ARGS_SCHEMAS.keys()

            missing_schema_keys = set(url_path_elements) - set(schema_keys)
            if missing_schema_keys:
                handlers_with_missing_url_schema_keys.append(handler_class_name)
                self.log_line(
                    'Missing keys in URL_PATH_ARGS_SCHEMAS for %s: %s.' % (
                        handler_class_name, ', '.join(missing_schema_keys)))

        error_msg = (
            'Missing schema keys in URL_PATH_ARGS_SCHEMAS for [ %s ] classes.'
            '\nVisit %s to learn how to write schemas for handler args.' % (
                ', '.join(handlers_with_missing_url_schema_keys),
                    self.wiki_page_link))

        self.assertEqual(handlers_with_missing_url_schema_keys, [], error_msg)

    def test_schema_keys_exactly_match_with_request_methods_in_handlers(
        self
    ) -> None:
        """This test ensures that schema keys in HANDLER_ARGS_SCHEMAS must
        exactly match with request arguments.
        """
        handlers_with_missing_request_schema_keys = []
        list_of_routes_which_need_schemas = (
            self._get_list_of_routes_which_need_schemas())

        for route in list_of_routes_which_need_schemas:
            handler = route.handler

            handler_class_name = handler.__name__
            if handler_class_name in self.handler_class_names_with_no_schema:
                continue
            if handler.HANDLER_ARGS_SCHEMAS is None:
                continue

            handler_request_methods = []
            if handler.get != base.BaseHandler.get:
                handler_request_methods.append('GET')
            if handler.put != base.BaseHandler.put:
                handler_request_methods.append('PUT')
            if handler.post != base.BaseHandler.post:
                handler_request_methods.append('POST')
            if handler.delete != base.BaseHandler.delete:
                handler_request_methods.append('DELETE')
            methods_defined_in_schema = handler.HANDLER_ARGS_SCHEMAS.keys()

            missing_schema_keys = (
                set(handler_request_methods) - set(methods_defined_in_schema))
            if missing_schema_keys:
                handlers_with_missing_request_schema_keys.append(
                    handler_class_name)
                self.log_line(
                    'Missing keys in HANDLER_ARGS_SCHEMAS for %s: %s.' % (
                        handler_class_name, ', '.join(missing_schema_keys)))

        error_msg = (
            'Missing schema keys in HANDLER_ARGS_SCHEMAS for [ %s ] classes.'
            '\nVisit %s to learn how to write schemas for handler args.' % (
                ', '.join(handlers_with_missing_request_schema_keys),
                    self.wiki_page_link))

        self.assertEqual(
            handlers_with_missing_request_schema_keys, [], error_msg)

    def test_default_value_in_schema_conforms_with_schema(self) -> None:
        """This test checks whether the default_value provided in schema
        conforms with the rest of the schema.
        """
        handlers_with_non_conforming_default_schemas = []
        list_of_routes_which_need_schemas = (
            self._get_list_of_routes_which_need_schemas())

        for route in list_of_routes_which_need_schemas:
            handler = route.handler

            handler_class_name = handler.__name__
            if handler_class_name in self.handler_class_names_with_no_schema:
                continue
            if handler.HANDLER_ARGS_SCHEMAS is None:
                continue

            schemas = handler.HANDLER_ARGS_SCHEMAS
            for request_method, request_method_schema in schemas.items():
                for arg, schema in request_method_schema.items():
                    if 'default_value' not in schema:
                        continue
                    default_value = {arg: schema['default_value']}
                    default_value_schema = {arg: schema}

                    _, errors = (
                        payload_validator.validate_arguments_against_schema(
                            default_value,
                            default_value_schema,
                            allowed_extra_args=True,
                            allow_string_to_bool_conversion=False)
                    )
                    if len(errors) == 0:
                        continue
                    self.log_line(
                        'Handler: %s, argument: %s, default_value '
                            'validation failed.' % (handler_class_name, arg))

                    if (handler_class_name not in
                            handlers_with_non_conforming_default_schemas):
                        handlers_with_non_conforming_default_schemas.append(
                            handler_class_name)

        error_msg = (
            'Schema validation for default values failed for handlers: [ %s ].'
            '\nVisit %s to learn how to write schemas for handler args.' % (
                ', '.join(handlers_with_non_conforming_default_schemas),
                        self.wiki_page_link))

        self.assertEqual(
            handlers_with_non_conforming_default_schemas, [], error_msg)

    def test_handlers_with_schemas_are_not_in_handler_schema_todo_list(
        self
    ) -> None:
        """This test ensures that the
        HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS list in handler_schema_constants
        only contains handler class names which require schemas.
        """

        list_of_handlers_to_be_removed = []
        handler_names_which_require_schemas = (
        handler_schema_constants.HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS)
        list_of_routes_which_need_schemas = (
            self._get_list_of_routes_which_need_schemas())

        for route in list_of_routes_which_need_schemas:
            handler = route.handler

            handler_class_name = handler.__name__
            if handler_class_name not in handler_names_which_require_schemas:
                continue

            schema_written_for_request_methods = (
                handler.HANDLER_ARGS_SCHEMAS is not None)
            schema_written_for_url_path_args = (
                handler.URL_PATH_ARGS_SCHEMAS is not None)
            handler_has_schemas = (schema_written_for_request_methods and
                schema_written_for_url_path_args)

            if handler_has_schemas:
                list_of_handlers_to_be_removed.append(handler_class_name)

        error_msg = (
            'Handlers to be removed from schema requiring list in '
            'handler_schema_constants file: [ %s ].' % (
                ', '.join(list_of_handlers_to_be_removed)))

        self.assertEqual(list_of_handlers_to_be_removed, [], error_msg)


class SchemaValidationUrlArgsTests(test_utils.GenericTestBase):
    """Tests to check schema validation architecture for url path elements."""

    exp_id = 'exp_id'

    class MockHandlerWithInvalidSchema(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'exploration_id': {
                'schema': {
                    'type': 'int'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_play_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    class MockHandlerWithValidSchema(base.BaseHandler):
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

    class MockHandlerWithMissingUrlPathSchema(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        @acl_decorators.can_play_exploration
        def get(self, exploration_id: str) -> None:
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super(SchemaValidationUrlArgsTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.mock_testapp1 = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_exploration/<exploration_id>',
                    self.MockHandlerWithInvalidSchema)], debug=feconf.DEBUG))

        self.mock_testapp2 = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_exploration/<exploration_id>',
                    self.MockHandlerWithValidSchema)], debug=feconf.DEBUG))

        self.mock_testapp3 = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_exploration/<exploration_id>',
                    self.MockHandlerWithMissingUrlPathSchema)],
                debug=feconf.DEBUG))

        self.save_new_valid_exploration(self.exp_id, self.owner_id)

    def test_cannot_access_exploration_with_incorrect_schema(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp1):
            response = self.get_json(
                '/mock_play_exploration/%s' % self.exp_id,
                    expected_status_int=400)
            error_msg = (
                'At \'http://localhost/mock_play_exploration/exp_id\' '
                'these errors are happening:\n'
                'Schema validation for \'exploration_id\' failed: Could not '
                'convert str to int: %s' % self.exp_id)
            self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_can_access_exploration_with_correct_schema(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp2):
            response = self.get_json(
                '/mock_play_exploration/%s' % self.exp_id,
                    expected_status_int=200)
        self.logout()

    def test_cannot_access_exploration_with_missing_schema(self) -> None:
        self.login(self.OWNER_EMAIL)
        error_msg = (
            'Missing schema for url path args in '
            'MockHandlerWithMissingUrlPathSchema handler class.')

        with self.swap(self, 'testapp', self.mock_testapp3):
            response = self.get_json('/mock_play_exploration/%s' % self.exp_id,
                expected_status_int=500)
            self.assertEqual(response['error'], error_msg)
        self.logout()


class MockHandlerWithInvalidSchemaNormalizedRequestDict(TypedDict):
    """Type for the MockHandlerWithInvalidSchema's normalized_request
    dictionary.
    """

    exploration_id: int


class MockHandlerWithDefaultGetSchemaNormalizedRequestDict(TypedDict):
    """Type for the MockHandlerWithDefaultGetSchema's normalized_request
    dictionary.
    """

    exploration_id: str
    apply_draft: bool


class MockHandlerWithDefaultPutSchemaNormalizedPayloadDict(TypedDict):
    """Type for the MockHandlerWithDefaultPutSchema's normalized_payload
    dictionary.
    """

    exploration_id: str


class SchemaValidationRequestArgsTests(test_utils.GenericTestBase):
    """Tests to check schema validation architecture for request args."""

    exp_id: Final = 'exp_id'

    class MockHandlerWithInvalidSchema(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'GET': {
                'exploration_id': {
                    'schema': {
                        'type': 'int'
                    }
                }
            }
        }

        @acl_decorators.can_play_exploration
        def get(self) -> None:
            # Here we use cast because we are narrowing down the type of
            # 'normalized_request' from Dict[str, Any] to a particular
            # TypedDict that was defined according to the schemas. So that
            # the type of fetched values is not considered as Any type.
            request_data = cast(
                MockHandlerWithInvalidSchemaNormalizedRequestDict,
                self.normalized_request
            )
            exploration_id = request_data['exploration_id']
            self.render_json({'exploration_id': exploration_id})

    class MockHandlerWithMissingRequestSchema(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, str] = {}

        @acl_decorators.can_play_exploration
        def get(self) -> None:
            # Here we use cast because we are narrowing down the type of
            # 'normalized_request' from Dict[str, Any] to a particular
            # Dict type that was defined according to the schemas. So that
            # the type of fetched values is not considered as Any type.
            payload = cast(Dict[str, str], self.normalized_request)
            exploration_id = payload.get('exploration_id')
            self.render_json({'exploration_id': exploration_id})

    class MockHandlerWithDefaultGetSchema(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'GET': {
                'exploration_id': {
                    'schema': {
                        'type': 'basestring'
                    },
                    'default_value': 'random_exp_id'
                },
                'apply_draft': {
                    'schema': {
                        'type': 'bool'
                    },
                    'default_value': False
                }
            }
        }

        def get(self) -> None:
            # Here we use cast because we are narrowing down the type of
            # 'normalized_request' from Dict[str, Any] to a particular
            # TypedDict that was defined according to the schemas. So that
            # the type of fetched values is not considered as Any type.
            request_data = cast(
                MockHandlerWithDefaultGetSchemaNormalizedRequestDict,
                self.normalized_request
            )
            exploration_id = request_data['exploration_id']
            if exploration_id != 'random_exp_id':
                raise self.InvalidInputException(
                    'Expected exploration_id to be random_exp_id received %s'
                    % exploration_id)
            return self.render_json({'exploration_id': exploration_id})

    class MockHandlerWithDefaultPutSchema(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'PUT': {
                'exploration_id': {
                    'schema': {
                        'type': 'basestring'
                    },
                    'default_value': 'random_exp_id'
                }
            }
        }

        def put(self) -> None:
            # Here we use cast because we are narrowing down the type of
            # 'normalized_payload' from Dict[str, Any] to a particular
            # TypedDict that was defined according to the schemas. So that
            # the type of fetched values is not considered as Any type.
            payload_data = cast(
                MockHandlerWithDefaultPutSchemaNormalizedPayloadDict,
                self.normalized_payload
            )
            exploration_id = payload_data['exploration_id']
            if exploration_id != 'random_exp_id':
                raise self.InvalidInputException(
                    'Expected exploration_id to be random_exp_id received %s'
                    % exploration_id)
            self.render_json({'exploration_id': exploration_id})

    def setUp(self) -> None:
        super(SchemaValidationRequestArgsTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.mock_testapp1 = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_exploration',
                    self.MockHandlerWithInvalidSchema)], debug=feconf.DEBUG))

        self.mock_testapp2 = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_exploration',
                    self.MockHandlerWithMissingRequestSchema)],
                debug=feconf.DEBUG))

        self.mock_testapp3 = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_exploration',
                    self.MockHandlerWithDefaultGetSchema)], debug=feconf.DEBUG))

        self.mock_testapp4 = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route(
                '/mock_play_exploration',
                    self.MockHandlerWithDefaultPutSchema)], debug=feconf.DEBUG))

        self.save_new_valid_exploration(self.exp_id, self.owner_id)

    def test_cannot_access_exploration_with_incorrect_schema(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(self, 'testapp', self.mock_testapp1):
            response = self.get_json(
                '/mock_play_exploration?exploration_id=%s' % self.exp_id,
                    expected_status_int=400)
            error_msg = (
                'Schema validation for \'exploration_id\' failed: Could not '
                'convert str to int: %s' % self.exp_id)
            self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_cannot_access_exploration_with_missing_schema(self) -> None:
        self.login(self.OWNER_EMAIL)
        error_msg = (
            'Missing schema for GET method in '
            'MockHandlerWithMissingRequestSchema handler class.')

        with self.swap(self, 'testapp', self.mock_testapp2):
            response = self.get_json(
                '/mock_play_exploration?exploration_id=%s' % self.exp_id,
                    expected_status_int=500)
            self.assertEqual(response['error'], error_msg)
        self.logout()

    def test_can_access_exploration_with_default_value_in_schema(self) -> None:
        self.login(self.OWNER_EMAIL)

        with self.swap(self, 'testapp', self.mock_testapp3):
            self.get_json('/mock_play_exploration?apply_draft=true')

        csrf_token = self.get_new_csrf_token()
        with self.swap(self, 'testapp', self.mock_testapp4):
            self.put_json('/mock_play_exploration', {}, csrf_token=csrf_token)
        self.logout()


class HandlerClassWithSchemaInStillNeedsSchemaListRaiseErrorTest(
        test_utils.GenericTestBase):
    """This test ensures that, InternalServerError is raised for
    the request with handler class which has schema but class name is still in
    HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS.
    """

    class MockHandler(base.BaseHandler):
        """Mock handler with schema."""
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'POST': {
                'arg_a': {
                    'schema': {
                        'type': 'basestring'
                    }
                }
            }
        }

        def post(self) -> None:
            self.render_json({})

    def setUp(self) -> None:
        super().setUp()
        user_id = user_services.get_user_id_from_username('learneruser')
        self.csrf_token = base.CsrfTokenManager.create_csrf_token(user_id)
        self.payload = {'arg_a': 'val'}
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock', self.MockHandler, name='MockHandler')],
            debug=feconf.DEBUG,
        ))

    def test_post_request_raise_internal_server_error(self) -> None:
        test_app_ctx = self.swap(self, 'testapp', self.testapp)
        handler_class_still_needs_schema_list_ctx = self.swap(
            handler_schema_constants, 'HANDLER_CLASS_NAMES_WITH_NO_SCHEMA',
            ['MockHandler'])
        with test_app_ctx, handler_class_still_needs_schema_list_ctx:
            self.post_json(
                '/mock', self.payload, csrf_token=self.csrf_token,
                expected_status_int=500)


class HeaderRequestsTests(test_utils.GenericTestBase):
    """Tests to check header requests."""

    class MockHandler(base.BaseHandler):
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
        URL_PATH_ARGS_SCHEMAS = {
            'entity_id': {
                'schema': {
                    'type': 'int'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

        def get(self, entity_id: str) -> None:
            self.render_json({'entity_id': entity_id})

    def setUp(self) -> None:
        super().setUp()
        self.testapp = webtest.TestApp(webapp2.WSGIApplication([
            webapp2.Route(
                '/mock/<entity_id>', self.MockHandler, name='MockHandler')],
            debug=feconf.DEBUG,
        ))

    def test_head_request_with_invalid_url_args_raises(self) -> None:
        with self.swap(self, 'testapp', self.testapp):
            self.testapp.head('/mock/not_int', status=400)

    def test_valid_head_request_returns_only_headers(self) -> None:
        with self.swap(self, 'testapp', self.testapp):
            response = self.testapp.head('/mock/234', status=200)
            self.assertEqual(response.body, b'')
            self.assertIsNotNone(response.headers)


class RequestMethodNotInHandlerClassDoNotRaiseMissingSchemaErrorTest(
        test_utils.GenericTestBase):
    """This test ensures that, NotImplementedError should not be raised for
    the request method which are not present in the handler class.
    """

    class MockHandler(base.BaseHandler):
        """Mock handler with no get method.
        """
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS: Dict[str, str] = {}
        GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def setUp(self) -> None:
        super(RequestMethodNotInHandlerClassDoNotRaiseMissingSchemaErrorTest,
            self).setUp()

        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock', self.MockHandler, name='MockHandler')],
            debug=feconf.DEBUG,
        ))

    def test_get_request_do_not_raise_notimplemented_error(self) -> None:
        with self.swap(self, 'testapp', self.testapp):
            self.get_json('/mock', expected_status_int=404)


class MockHandlerNormalizedRequestDict(TypedDict):
    """Type for the MockHandler's normalized_payload
    dictionary.
    """

    arg_b: str
    arg_a: str


class HandlerClassWithBothRequestAndPayloadTest(test_utils.GenericTestBase):
    """This test class ensures that SVS architecture validates both request args
    and payload args if they are present in a single request method."""

    class MockHandler(base.BaseHandler):
        """Fake page for testing autoescaping."""
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'POST': {
                'arg_b': {
                    'schema': {
                        'type': 'basestring'
                    }
                },
                'arg_a': {
                    'schema': {
                        'type': 'basestring'
                    }
                }
            }
        }

        def post(self) -> None:
            """Handles POST requests. This request method contains both type
            of args, i.e., request args as well as payload args.
            """
            # Here we use cast because we are narrowing down the type of
            # 'normalized_request' from Dict[str, Any] to a particular
            # TypedDict that was defined according to the schemas. So that
            # the type of fetched values is not considered as Any type.
            request_data = cast(
                MockHandlerNormalizedRequestDict,
                self.normalized_request
            )
            # arg_a = self.request.get('arg_a') is not used, since we
            # intend to use normalized value.
            arg_a = request_data.get('arg_a')

            # arg_b = self.payload.get('arg_b') is not used, since we
            # intend to use normalized value.
            arg_b = request_data.get('arg_b')

            self.render_json({'arg_a': arg_a, 'arg_b': arg_b})

    def setUp(self) -> None:
        super(HandlerClassWithBothRequestAndPayloadTest, self).setUp()
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock', self.MockHandler, name='MockHandler')],
            debug=feconf.DEBUG,
        ))
        self.payload = {'arg_b': 'arg_in_payload'}
        user_id = user_services.get_user_id_from_username('learneruser')
        self.csrf_token = base.CsrfTokenManager.create_csrf_token(user_id)

    def test_both_args_in_post_request(self) -> None:
        with self.swap(self, 'testapp', self.testapp):
            self.post_json(
                '/mock?arg_a=arg_in_request', self.payload,
                csrf_token=self.csrf_token)

    def test_post_request_with_invalid_source_raise_error(self) -> None:
        with self.swap(self, 'testapp', self.testapp):
            self.post_json(
                '/mock?arg_a=arg_in_request', self.payload,
                csrf_token=self.csrf_token, source='fake_url',
                expected_status_int=400)

    def test_post_request_with_valid_source_do_not_raise_error(self) -> None:
        with self.swap(self, 'testapp', self.testapp):
            self.post_json(
                '/mock?arg_a=arg_in_request', self.payload,
                csrf_token=self.csrf_token,
                source='http://localhost:8181/sample_url/')


class MockUploadHandlerNormalizedPayloadDict(TypedDict):
    """Type for the MockUploadHandler's normalized_payload
    dictionary.
    """

    filename: str
    filename_prefix: Optional[str]


class MockUploadHandlerNormalizedRequestDict(TypedDict):
    """Type for the MockUploadHandler's normalized_request
    dictionary.
    """

    image: bytes


class ImageUploadHandlerTest(test_utils.GenericTestBase):
    """This test class ensures that schema validation is done successfully
    for handlers which upload image files.
    """

    TEST_LEARNER_EMAIL: Final = 'test.learner@example.com'
    TEST_LEARNER_USERNAME: Final = 'testlearneruser'

    class MockUploadHandler(base.BaseHandler):
        """Handles image uploads."""
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
        HANDLER_ARGS_SCHEMAS = {
            'POST': {
                'image': {
                    'schema': {
                        'type': 'basestring'
                    }
                },
                'filename': {
                    'schema': {
                        'type': 'basestring'
                    }
                },
                'filename_prefix': {
                    'schema': {
                        'type': 'basestring'
                    },
                    'default_value': None
                }
            }
        }

        def post(self, entity_type: str, entity_id: str) -> None:
            """Saves an image uploaded by a content creator."""

            # Here we use cast because we are narrowing down the type of
            # 'normalized_payload' from Dict[str, Any] to a particular
            # TypedDict that was defined according to the schemas. So that
            # the type of fetched values is not considered as Any type.
            payload_data = cast(
                MockUploadHandlerNormalizedPayloadDict,
                self.normalized_payload
            )

            # Here we use cast because we are narrowing down the type of
            # 'normalized_request' from Dict[str, Any] to a particular
            # TypedDict that was defined according to the schemas. So that
            # the type of fetched values is not considered as Any type.
            request_data = cast(
                MockUploadHandlerNormalizedRequestDict,
                self.normalized_request
            )
            raw = request_data.get('image')
            filename = payload_data.get('filename')
            filename_prefix = payload_data.get('filename_prefix')

            self.render_json({'filename': filename})

    def setUp(self) -> None:
        super(ImageUploadHandlerTest, self).setUp()
        self.signup(self.TEST_LEARNER_EMAIL, self.TEST_LEARNER_USERNAME)
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_upload/<entity_type>/<entity_id>',
            self.MockUploadHandler, name='MockUploadHandler')],
            debug=feconf.DEBUG,
        ))

        self.system_user = user_services.get_system_user()
        exp_services.load_demo('0')

        rights_manager.release_ownership_of_exploration(
            self.system_user, '0')

    def test_image_upload_and_download(self) -> None:
        """Test image uploading and downloading."""
        self.login(self.TEST_LEARNER_EMAIL)
        user_id = user_services.get_user_id_from_username('testlearneruser')
        csrf_token = base.CsrfTokenManager.create_csrf_token(user_id)

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        with self.swap(self, 'testapp', self.testapp):
            response_dict = self.post_json(
                '/mock_upload/exploration/0', {'filename': 'test.png'},
                csrf_token=csrf_token,
                upload_files=[('image', 'unused_filename', raw_image)]
            )
            filename = response_dict['filename']
        self.logout()


class UrlPathNormalizationTest(test_utils.GenericTestBase):
    """Tests that ensure url path arguments are normalized"""

    class MockHandler(base.BaseHandler):
        URL_PATH_ARGS_SCHEMAS = {
            'mock_list': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                }
            },
            'mock_int': {
                'schema': {
                    'type': 'int'
                }
            }
        }
        HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
            'GET': {}
        }

        def get(self, mock_list: List[str], mock_int: int) -> None:
            if not isinstance(mock_list, list):
                raise self.InvalidInputException(
                    'Expected arg mock_list to be a list. Was type %s' %
                    type(mock_list))
            if not isinstance(mock_int, int):
                raise self.InvalidInputException(
                    'Expected arg mock_int to be a int. Was type %s' %
                    type(mock_int))
            self.render_json({'mock_list': mock_list, 'mock_int': mock_int})

    def setUp(self) -> None:
        super(UrlPathNormalizationTest, self).setUp()
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock_normalization/<mock_int>/<mock_list>',
            self.MockHandler, name='MockHandler')],
            debug=feconf.DEBUG,
        ))

    def test_url_path_arg_normalization_is_successful(self) -> None:
        list_string = '["id1", "id2", "id3"]'
        int_string = '1'

        with self.swap(self, 'testapp', self.testapp):
            self.get_json(
                '/mock_normalization/%s/%s' % (int_string, list_string),
                expected_status_int=200)


class RaiseErrorOnGetTest(test_utils.GenericTestBase):
    """This test class is to ensure handlers with schema raises error
    when they use self.request or self.payload."""

    class MockHandlerWithSchema(base.BaseHandler):
        """Mock handler with schema."""
        URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
        HANDLER_ARGS_SCHEMAS = {
            'POST': {
                'mock_int': {
                    'schema': {
                        'type': 'int'
                    }
                }
            }
        }

        def post(self) -> None:
            self.payload.get('mock_int')
            return self.render_json({})

    class MockHandlerWithoutSchema(base.BaseHandler):
        """Mock handler without schema."""

        def post(self) -> None:
            self.payload.get('mock_int')
            return self.render_json({})

    def setUp(self) -> None:
        super().setUp()
        user_id = user_services.get_user_id_from_username('learneruser')
        self.csrf_token = base.CsrfTokenManager.create_csrf_token(user_id)
        self.payload = {'mock_int': 1}
        self.testapp = webtest.TestApp(webapp2.WSGIApplication([
            webapp2.Route('/mock_with_schema', self.MockHandlerWithSchema),
            webapp2.Route(
                '/mock_without_schema', self.MockHandlerWithoutSchema),
        ], debug=feconf.DEBUG))

    def test_object_which_raises_error_on_get(self) -> None:
        error_message = 'error_message'
        object_that_raises_error_on_get = base.RaiseErrorOnGet(error_message)
        with self.assertRaisesRegex(ValueError, error_message):
            object_that_raises_error_on_get.get('key')

    def test_request_with_schema_using_payload_or_request_attr_raise_error(
        self
    ) -> None:
        with self.swap(self, 'testapp', self.testapp):
            self.post_json(
                '/mock_with_schema', self.payload, csrf_token=self.csrf_token,
                expected_status_int=500)

    def test_request_without_schema_using_payload_or_request_attr_raise_no_err(
        self
    ) -> None:
        test_app_ctx = self.swap(self, 'testapp', self.testapp)
        handler_class_still_needs_schema_list_ctx = self.swap(
            handler_schema_constants, 'HANDLER_CLASS_NAMES_WITH_NO_SCHEMA',
            ['MockHandlerWithoutSchema'])
        with test_app_ctx, handler_class_still_needs_schema_list_ctx:
            self.post_json(
                '/mock_without_schema', self.payload, csrf_token=self.csrf_token,
                expected_status_int=200)
