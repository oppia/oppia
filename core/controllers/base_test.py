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

import datetime
import inspect
import json
import os
import re
import types

from constants import constants
from core.controllers import base
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import main
import utils

import webapp2
import webtest

current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])

FORTY_EIGHT_HOURS_IN_SECS = 48 * 60 * 60
PADDING = 1


class BaseHandlerTests(test_utils.GenericTestBase):

    TEST_LEARNER_EMAIL = 'test.learner@example.com'
    TEST_LEARNER_USERNAME = 'testlearneruser'
    TEST_CREATOR_EMAIL = 'test.creator@example.com'
    TEST_CREATOR_USERNAME = 'testcreatoruser'
    TEST_EDITOR_EMAIL = 'test.editor@example.com'
    TEST_EDITOR_USERNAME = 'testeditoruser'

    def setUp(self):
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

    def test_dev_indicator_appears_in_dev_and_not_in_production(self):
        """Test dev indicator appears in dev and not in production."""

        with self.swap(constants, 'DEV_MODE', True):
            response = self.get_html_response(feconf.LIBRARY_INDEX_URL)
            self.assertIn(
                '<div ng-if="DEV_MODE" class="oppia-dev-mode" ng-cloak>',
                response.body)

        with self.swap(constants, 'DEV_MODE', False):
            response = self.get_html_response(feconf.LIBRARY_INDEX_URL)
            self.assertIn(
                '<div ng-if="DEV_MODE" class="oppia-dev-mode" ng-cloak>',
                response.body)

    def test_that_no_get_results_in_500_error(self):
        """Test that no GET request results in a 500 error."""

        for route in main.URLS:
            # This was needed for the Django tests to pass (at the time we had
            # a Django branch of the codebase).
            if isinstance(route, tuple):
                continue
            else:
                url = route.template
            url = re.sub('<([^/^:]+)>', 'abc123', url)

            # Some of these will 404 or 302. This is expected.
            self.get_response_without_checking_for_errors(
                url, [200, 302, 400, 401, 404])

        # TODO(sll): Add similar tests for POST, PUT, DELETE.
        # TODO(sll): Set a self.payload attr in the BaseHandler for
        #     POST, PUT and DELETE. Something needs to regulate what
        #     the fields in the payload should be.

    def test_requests_for_invalid_paths(self):
        """Test that requests for invalid paths result in a 404 error."""

        self.get_html_response(
            '/library/extra', expected_status_int=404)

        self.get_html_response(
            '/library/data/extra', expected_status_int=404)

        self.post_json(
            '/library/extra', payload={}, expected_status_int=404)

        self.put_json(
            '/library/extra', payload={}, expected_status_int=404)

    def test_redirect_in_logged_out_states(self):
        """Test for a redirect in logged out state on '/'."""

        response = self.get_html_response('/', expected_status_int=302)
        self.assertIn('splash', response.headers['location'])

    def test_root_redirect_rules_for_logged_in_learners(self):
        self.login(self.TEST_LEARNER_EMAIL)

        # Since by default the homepage for all logged in users is the
        # learner dashboard, going to '/' should redirect to the learner
        # dashboard page.
        response = self.get_html_response('/', expected_status_int=302)
        self.assertIn('learner_dashboard', response.headers['location'])
        self.logout()

    def test_root_redirect_rules_for_users_with_no_user_contribution_model(
            self):
        self.login(self.TEST_LEARNER_EMAIL)
        # Delete the UserContributionModel.
        user_id = user_services.get_user_id_from_username(
            self.TEST_LEARNER_USERNAME)
        user_contribution_model = user_models.UserContributionsModel.get(
            user_id)
        user_contribution_model.delete()

        # Since by default the homepage for all logged in users is the
        # learner dashboard, going to '/' should redirect to the learner
        # dashboard page.
        response = self.get_html_response('/', expected_status_int=302)
        self.assertIn('learner_dashboard', response.headers['location'])
        self.logout()

    def test_root_redirect_rules_for_logged_in_creators(self):
        self.login(self.TEST_CREATOR_EMAIL)
        creator_user_id = self.get_user_id_from_email(self.TEST_CREATOR_EMAIL)
        # Set the default dashboard as creator dashboard.
        user_services.update_user_default_dashboard(
            creator_user_id, constants.DASHBOARD_TYPE_CREATOR)

        # Since the default dashboard has been set as creator dashboard, going
        # to '/' should redirect to the creator dashboard.
        response = self.get_html_response('/', expected_status_int=302)
        self.assertIn('creator_dashboard', response.headers['location'])

    def test_root_redirect_rules_for_logged_in_editors(self):
        self.login(self.TEST_CREATOR_EMAIL)
        creator_user_id = self.get_user_id_from_email(self.TEST_CREATOR_EMAIL)
        creator = user_services.UserActionsInfo(creator_user_id)
        editor_user_id = self.get_user_id_from_email(self.TEST_EDITOR_EMAIL)
        exploration_id = '1_en_test_exploration'
        self.save_new_valid_exploration(
            exploration_id, creator_user_id, title='Test',
            category='Test', language_code='en')
        rights_manager.assign_role_for_exploration(
            creator, exploration_id, editor_user_id,
            rights_manager.ROLE_EDITOR)
        self.logout()
        self.login(self.TEST_EDITOR_EMAIL)
        exp_services.update_exploration(
            editor_user_id, exploration_id, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'edited title'
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'category',
                'new_value': 'edited category'
            })], 'Change title and category')

        # Since user has edited one exploration created by another user,
        # going to '/' should redirect to the dashboard page.
        response = self.get_html_response('/', expected_status_int=302)
        self.assertIn('dashboard', response.headers['location'])
        self.logout()


class CsrfTokenManagerTests(test_utils.GenericTestBase):

    def test_create_and_validate_token(self):
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

    def test_nondefault_csrf_secret_is_used(self):
        base.CsrfTokenManager.create_csrf_token('uid')
        self.assertNotEqual(base.CSRF_SECRET.value, base.DEFAULT_CSRF_SECRET)

    def test_token_expiry(self):
        # This can be any value.
        orig_time = 100.0
        current_time = orig_time

        def mock_get_current_time(unused_cls):
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

        def get(self):
            """Handles GET requests."""
            self.render_template('pages/tests/jinja_escaping.html')

        def post(self):
            """Handles POST requests."""
            self.render_json({'big_value': u'\n<script>马={{'})

    def setUp(self):
        super(EscapingTests, self).setUp()

        # Update a config property that shows in all pages.
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        # Modify the testapp to use the fake handler.
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/fake', self.FakePage, name='FakePage')],
            debug=feconf.DEBUG,
        ))

    def test_jinja_autoescaping(self):
        dangerous_field_contents = '<[angular_tag]> x{{51 * 3}}y'
        with self.swap(constants, 'DEV_MODE', dangerous_field_contents):
            response = self.get_html_response('/fake')

            self.assertIn('&lt;[angular_tag]&gt;', response.body)
            self.assertNotIn('<[angular_tag]>', response.body)

            self.assertIn('x{{51 * 3}}y', response.body)
            self.assertNotIn('x153y', response.body)

    def test_special_char_escaping(self):
        response = self.testapp.post('/fake', params={})
        self.assertEqual(response.status_int, 200)

        self.assertTrue(response.body.startswith(feconf.XSSI_PREFIX))
        self.assertIn('\\n\\u003cscript\\u003e\\u9a6c={{', response.body)
        self.assertNotIn('<script>', response.body)
        self.assertNotIn('马', response.body)


class RenderDownloadableTests(test_utils.GenericTestBase):

    class MockHandler(base.BaseHandler):
        """Mock handler that subclasses BaseHandler and serves a response
        that is of a 'downloadable' type.
        """
        def get(self):
            """Handles GET requests."""
            file_contents = 'example'
            self.render_downloadable_file(
                file_contents, 'example.pdf', 'text/plain')

    def setUp(self):
        super(RenderDownloadableTests, self).setUp()

        # Modify the testapp to use the mock handler.
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/mock', self.MockHandler, name='MockHandler')],
            debug=feconf.DEBUG,
        ))

    def test_downloadable(self):
        response = self.testapp.get('/mock')
        self.assertEqual(
            response.content_disposition,
            'attachment; filename=example.pdf')
        self.assertEqual(response.body, 'example')
        self.assertEqual(response.content_type, 'text/plain')


class LogoutPageTests(test_utils.GenericTestBase):

    def test_logout_page(self):
        """Tests for logout handler."""
        exp_services.load_demo('0')
        # Logout with valid query arg. This test only validates that the login
        # cookies have expired after hitting the logout url.
        current_page = '/explore/0'
        response = self.get_html_response(current_page)
        response = self.get_html_response('/logout', expected_status_int=302)
        expiry_date = response.headers['Set-Cookie'].rsplit('=', 1)

        self.assertTrue(
            datetime.datetime.utcnow() > datetime.datetime.strptime(
                expiry_date[1], '%a, %d %b %Y %H:%M:%S GMT',))


class I18nDictsTests(test_utils.GenericTestBase):
    """Tests for I18n dicts."""

    def _extract_keys_from_json_file(self, filename):
        """Returns the extracted keys from the json file corresponding to the
        given filename.
        """
        return sorted(json.loads(utils.get_file_contents(
            os.path.join(os.getcwd(), self.get_static_asset_filepath(),
                         'assets', 'i18n', filename)
        )).keys())

    def _extract_keys_from_html_file(self, filename):
        """Returns the extracted keys from the html file corresponding to the
        given filename.
        """
        # The \b is added at the start to ensure that keys ending with
        # '_I18N_IDS' do not get matched. Instances of such keys can be found
        # in learner_dashboard.html.
        regex_pattern = r'(\bI18N_[A-Z/_\d]*)'
        return re.findall(regex_pattern, utils.get_file_contents(
            filename))

    def _get_tags(self, input_string, key, filename):
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

    def test_i18n_keys(self):
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

    def test_alphabetic_i18n_keys(self):
        """Tests that the keys of all i18n json files are arranged in
        alphabetical order.
        """
        filenames = os.listdir(
            os.path.join(os.getcwd(), self.get_static_asset_filepath(),
                         'assets', 'i18n'))
        for filename in filenames:
            with open(os.path.join(os.getcwd(), 'assets', 'i18n', filename),
                      mode='r') as f:
                lines = f.readlines()
                self.assertEqual(lines[0], '{\n')
                self.assertEqual(lines[-1], '}\n')
                lines = lines[1:-1]

                key_list = [line[:line.find(':')].strip() for line in lines]
                for key in key_list:
                    self.assertTrue(key.startswith('"I18N_'))
                self.assertEqual(sorted(key_list), key_list)

    def test_keys_match_en_qqq(self):
        """Tests that en.json and qqq.json have the exact same set of keys."""
        en_key_list = self._extract_keys_from_json_file('en.json')
        qqq_key_list = self._extract_keys_from_json_file('qqq.json')
        self.assertEqual(en_key_list, qqq_key_list)

    def test_keys_in_source_code_match_en(self):
        """Tests that keys in HTML files are present in en.json."""
        en_key_list = self._extract_keys_from_json_file('en.json')
        dirs_to_search = [
            os.path.join('core', 'templates', 'dev', 'head'),
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

    def test_html_in_translations_is_preserved_correctly(self):
        """Tests that HTML in translated strings matches the original
        structure.
        """
        # For this test, show the entire diff if there is a mismatch.
        self.maxDiff = None

        master_translation_dict = json.loads(utils.get_file_contents(
            os.path.join(os.getcwd(), 'assets', 'i18n', 'en.json')))
        # Remove anything outside '<'...'>' tags. Note that this handles both
        # HTML tags and Angular variable interpolations.
        master_tags_dict = {
            key: self._get_tags(value, key, 'en.json')
            for key, value in master_translation_dict.iteritems()
        }

        mismatches = []

        filenames = os.listdir(os.path.join(
            os.getcwd(), self.get_static_asset_filepath(), 'assets', 'i18n'))
        for filename in filenames:
            if filename == 'qqq.json':
                continue
            translation_dict = json.loads(utils.get_file_contents(
                os.path.join(os.getcwd(), 'assets', 'i18n', filename)))
            for key, value in translation_dict.iteritems():
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

        def get(self):
            """Handles get requests."""
            raise self.InternalErrorException('fake exception')

    def test_error_response_for_get_request_of_type_json_has_json_format(self):
        fake_urls = []
        fake_urls.append(main.get_redirect_route(r'/fake', self.FakeHandler))
        fake_urls.append(main.URLS[-1])
        with self.swap(main, 'URLS', fake_urls):
            transaction_services = models.Registry.import_transaction_services()
            app = transaction_services.toplevel_wrapper(  # pylint: disable=invalid-name
                webapp2.WSGIApplication(main.URLS, debug=feconf.DEBUG))
            self.testapp = webtest.TestApp(app)

            response = self.get_json(
                '/fake', expected_status_int=500)
            self.assertTrue(isinstance(response, dict))


class CheckAllHandlersHaveDecoratorTests(test_utils.GenericTestBase):
    """Tests that all methods in handlers have authentication decorators
    applied on them.
    """

    def test_every_method_has_decorator(self):
        handlers_checked = []

        for route in main.URLS:
            # URLS = MAPREDUCE_HANDLERS + other handlers. MAPREDUCE_HANDLERS
            # are tuples. So, below check is to handle them.
            if isinstance(route, tuple):
                continue
            else:
                handler = route.handler

            # Following handler are present in base.py where acl_decorators
            # cannot be imported.
            if (handler.__name__ == 'LogoutPage' or
                    handler.__name__ == 'Error404Handler'):
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
            self.assertTrue(handler_is_decorated)


class GetItemsEscapedCharactersTests(test_utils.GenericTestBase):
    """Test that request.GET.items() correctly retrieves escaped characters."""
    class MockHandler(base.BaseHandler):

        def get(self):
            self.values.update(self.request.GET.items())
            self.render_json(self.values)

    def test_get_items(self):
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

    def test_controller_class_names(self):
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
            # URLS = MAPREDUCE_HANDLERS + other handlers. MAPREDUCE_HANDLERS
            # are tuples. So, below check is to pick only those which have
            # a RedirectRoute associated with it.
            if isinstance(url, main.routes.RedirectRoute):
                clazz = url.handler
                num_handlers_checked += 1
                all_base_classes = [base_class.__name__ for base_class in
                                    (inspect.getmro(clazz))]
                # Check that it is a subclass of 'BaseHandler'.
                if 'BaseHandler' in all_base_classes:
                    class_return_type = clazz.GET_HANDLER_ERROR_RETURN_TYPE
                    # Check that any class with a get handler has a
                    # GET_HANDLER_ERROR_RETURN_TYPE that's one of
                    # the allowed values.
                    if 'get' in clazz.__dict__.keys():
                        self.assertIn(
                            class_return_type,
                            handler_type_to_name_endings_dict)
                    class_name = clazz.__name__
                    file_name = inspect.getfile(clazz)
                    line_num = inspect.getsourcelines(clazz)[1]
                    allowed_class_ending = handler_type_to_name_endings_dict[
                        class_return_type]
                    # Check that the name of the class ends with
                    # the proper word if it has a get function.
                    if 'get' in clazz.__dict__.keys():
                        message = (
                            'Please ensure that the name of this class '
                            'ends with \'%s\'' % allowed_class_ending)
                        error_message = (
                            '%s --> Line %s: %s'
                            % (file_name, line_num, message))
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
                        self.assertTrue(class_name.endswith('Handler'),
                                        msg=error_message)

        self.assertGreater(num_handlers_checked, 150)


class SignUpTests(test_utils.GenericTestBase):

    def test_error_is_raised_on_opening_new_tab_during_signup(self):
        """Test that error is raised if user opens a new tab
        during signup.
        """
        self.login('abc@example.com')
        response = self.get_html_response(feconf.SIGNUP_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        response = self.get_html_response('/about', expected_status_int=302)
        self.assertIn('Logout', response.location)
        self.logout()

        response = self.post_json(
            feconf.SIGNUP_DATA_URL, {
                'username': 'abc',
                'agreed_to_terms': True
            }, csrf_token=csrf_token, expected_status_int=401,
        )

        self.assertEqual(response['error'], 'Registration session expired.')

    def test_no_error_is_raised_on_opening_new_tab_after_signup(self):
        """Test that no error is raised if user opens a new tab
        after signup.
        """
        self.login('abc@example.com')
        response = self.get_html_response(feconf.SIGNUP_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        self.post_json(
            feconf.SIGNUP_DATA_URL, {
                'username': 'abc',
                'agreed_to_terms': True
            }, csrf_token=csrf_token,
        )

        self.get_html_response('/about')
