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

"""Common utilities for test classes."""

import contextlib
import copy
import inspect
import json
import os
import re
import unittest

from constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
import feconf
import main
import main_mail
import main_taskqueue
import utils

from google.appengine.api import apiproxy_stub
from google.appengine.api import apiproxy_stub_map
from google.appengine.api import mail
import webtest

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
current_user_services = models.Registry.import_current_user_services()

CSRF_REGEX = (
    r'csrf_token: JSON\.parse\(\'\\\"([A-Za-z0-9/=_-]+)\\\"\'\)')
# Prefix to append to all lines printed by tests to the console.
LOG_LINE_PREFIX = 'LOG_INFO_TEST: '


def empty_environ():
    """Create an empty environment for the tests."""
    os.environ['AUTH_DOMAIN'] = 'example.com'
    os.environ['SERVER_NAME'] = 'localhost'
    os.environ['HTTP_HOST'] = 'localhost'
    os.environ['SERVER_PORT'] = '8080'
    os.environ['USER_EMAIL'] = ''
    os.environ['USER_ID'] = ''
    os.environ['USER_IS_ADMIN'] = '0'
    os.environ['DEFAULT_VERSION_HOSTNAME'] = '%s:%s' % (
        os.environ['HTTP_HOST'], os.environ['SERVER_PORT'])


class URLFetchServiceMock(apiproxy_stub.APIProxyStub):
    """Mock for google.appengine.api.urlfetch."""

    def __init__(self, service_name='urlfetch'):
        super(URLFetchServiceMock, self).__init__(service_name)
        self.return_values = {}
        self.response = None
        self.request = None

    def set_return_values(self, content='', status_code=200, headers=None):
        """Set the content, status_code and headers to return in subsequent
        calls to the urlfetch mock.

        Args:
            content: str. The content to return in subsequent calls to the
                urlfetch mock.
            status_code: int. The status_code to return in subsequent calls to
                the urlfetch mock.
            headers: dict. The headers to return in subsequent calls to the
                urlfetch mock. The keys of this dict are strings that represent
                the header name and each value represents the corresponding
                value of that header.
        """
        self.return_values['content'] = content
        self.return_values['status_code'] = status_code
        self.return_values['headers'] = headers

    def _Dynamic_Fetch(self, request, response): # pylint: disable=invalid-name
        """Simulates urlfetch mock by setting request & response object.

        Args:
            request: dict. Request object for the URLMock.
            response: dict. Response object for the URLMock.
        """
        return_values = self.return_values
        response.set_content(return_values.get('content', ''))
        response.set_statuscode(return_values.get('status_code', 200))
        for header_key, header_value in return_values.get(
                'headers', {}).items():
            new_header = response.add_header()
            new_header.set_key(header_key)
            new_header.set_value(header_value)

        self.request = request
        self.response = response


class TestBase(unittest.TestCase):
    """Base class for all tests."""

    maxDiff = 2500

    # This is the value that gets returned by default when
    # app_identity.get_application_id() is called during tests.
    EXPECTED_TEST_APP_ID = 'testbed-test'

    # A test unicode string.
    UNICODE_TEST_STRING = u'unicode ¡马!'

    # Dummy strings representing user attributes. Note that it is up to the
    # individual test to actually register these users as editors, admins, etc.
    ADMIN_EMAIL = 'admin@example.com'
    # Usernames containing the string 'admin' are reserved, so we use 'adm'
    # instead.
    ADMIN_USERNAME = 'adm'
    MODERATOR_EMAIL = 'moderator@example.com'
    MODERATOR_USERNAME = 'moderator'
    OWNER_EMAIL = 'owner@example.com'
    OWNER_USERNAME = 'owner'
    EDITOR_EMAIL = 'editor@example.com'
    EDITOR_USERNAME = 'editor'
    VIEWER_EMAIL = 'viewer@example.com'
    VIEWER_USERNAME = 'viewer'
    NEW_USER_EMAIL = 'new.user@example.com'
    NEW_USER_USERNAME = 'newuser'
    DEFAULT_END_STATE_NAME = 'End'

    VERSION_0_STATES_DICT = {
        feconf.DEFAULT_INIT_STATE_NAME: {
            'content': [{'type': 'text', 'value': ''}],
            'param_changes': [],
            'interaction': {
                'customization_args': {},
                'id': 'Continue',
                'handlers': [{
                    'name': 'submit',
                    'rule_specs': [{
                        'dest': 'END',
                        'feedback': [],
                        'param_changes': [],
                        'definition': {'rule_type': 'default'}
                    }]
                }]
            },
        }
    }

    # Dictionary-like data structures within sample YAML must be formatted
    # alphabetically to match string equivalence with YAML generation tests.
    #
    # If evaluating differences in YAML, conversion to dict form via
    # utils.dict_from_yaml can isolate differences quickly.

    SAMPLE_YAML_CONTENT = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: %s
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: %d
states:
  %s:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: %s
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: New state
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    param_changes: []
states_schema_version: %d
tags: []
title: Title
""") % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)

    SAMPLE_UNTITLED_YAML_CONTENT = ("""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: %s
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: %d
states:
  %s:
    content:
    - type: text
      value: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: %s
        feedback: []
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      fallbacks: []
      id: null
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: New state
        feedback: []
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      fallbacks: []
      id: null
    param_changes: []
states_schema_version: %d
tags: []
""") % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.LAST_UNTITLED_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)

    def _get_unicode_test_string(self, suffix):
        """Returns a string that contains unicode characters and ends with the
        given suffix. This is used to test that functions behave correctly
        when handling strings with unicode characters.

        Args:
            suffix: str. The suffix to append to the UNICODE_TEST_STRING.

        Returns:
            str. A string that contains unicode characters and ends with the
                given suffix.
        """
        return '%s%s' % (self.UNICODE_TEST_STRING, suffix)

    def setUp(self):
        """Initializes the fixture for the test suite. Subclasses of TestBase
        should override this method.
        """
        raise NotImplementedError

    def tearDown(self):
        """Cleans up the fixture after the test runs. Subclasses of
        TestBase should override this method.
        """
        raise NotImplementedError

    def _assert_validation_error(self, item, error_substring):
        """Checks that the given item passes default validation."""
        with self.assertRaisesRegexp(utils.ValidationError, error_substring):
            item.validate()

    def signup_superadmin_user(self):
        """Signs up a superadmin user. Should be called at the end of
        setUp().
        """
        self.signup('tmpsuperadmin@example.com', 'tmpsuperadm1n')

    def log_line(self, line):
        """Print the line with a prefix that can be identified by the
        script that calls the test.
        """
        print '%s%s' % (LOG_LINE_PREFIX, line)

    def _delete_all_models(self):
        """Deletes all keys from the NDB datastore. Subclasses of TestBase
        should override this method.
        """
        raise NotImplementedError

    def _stash_current_user_env(self):
        """Stashes the current user-specific env variables for later retrieval.

        Developers: please don't use this method outside this class -- it makes
        the individual tests harder to follow.
        """
        self.stashed_user_env = {  # pylint: disable=attribute-defined-outside-init
            'USER_EMAIL': os.environ['USER_EMAIL'],
            'USER_ID': os.environ['USER_ID'],
            'USER_IS_ADMIN': os.environ['USER_IS_ADMIN']
        }

    def _restore_stashed_user_env(self):
        """Restores a stashed set of user-specific env variables.

        Developers: please don't use this method outside this class -- it makes
        the individual tests harder to follow.
        """
        if not self.stashed_user_env:
            raise Exception('No stashed user env to restore.')

        for key in self.stashed_user_env:
            os.environ[key] = self.stashed_user_env[key]

        self.stashed_user_env = None  # pylint: disable=attribute-defined-outside-init

    def login(self, email, is_super_admin=False):
        """Sets the environment variables to simulate a login.

        Args:
            email: str. The email of the user who is to be logged in.
            is_super_admin: bool. Whether the user is a super admin.
       """
        os.environ['USER_EMAIL'] = email
        os.environ['USER_ID'] = self.get_user_id_from_email(email)
        os.environ['USER_IS_ADMIN'] = '1' if is_super_admin else '0'

    def logout(self):
        """Simulates a logout by resetting the environment variables."""
        os.environ['USER_EMAIL'] = ''
        os.environ['USER_ID'] = ''
        os.environ['USER_IS_ADMIN'] = '0'

    def shortDescription(self):
        """Additional information logged during unit test invocation."""
        # Suppress default logging of docstrings.
        return None

    def get_expected_login_url(self, slug):
        """Returns the expected login URL."""
        return current_user_services.create_login_url(slug)

    def get_expected_logout_url(self, slug):
        """Returns the expected logout URL."""
        return current_user_services.create_logout_url(slug)

    def _parse_json_response(self, json_response, expect_errors=False):
        """Convert a JSON server response to an object (such as a dict)."""
        if not expect_errors:
            self.assertEqual(json_response.status_int, 200)
        self.assertEqual(
            json_response.content_type, 'application/json')
        self.assertTrue(json_response.body.startswith(feconf.XSSI_PREFIX))

        return json.loads(json_response.body[len(feconf.XSSI_PREFIX):])

    def get_json(self, url, params=None, expect_errors=False):
        """Get a JSON response, transformed to a Python object."""
        json_response = self.testapp.get(
            url, params, expect_errors=expect_errors)   
        if expect_errors:
            return json_response
        else:
            return self._parse_json_response(
                json_response, expect_errors=expect_errors)

    def post_json(self, url, payload, csrf_token=None, expect_errors=False,
                  expected_status_int=200, upload_files=None):
        """Post an object to the server by JSON; return the received object."""
        data = {'payload': json.dumps(payload)}
        if csrf_token:
            data['csrf_token'] = csrf_token

        json_response = self._send_post_request(
            self.testapp, url, data, expect_errors, expected_status_int,
            upload_files)

        return self._parse_json_response(
            json_response, expect_errors=expect_errors)

    def _send_post_request(
            self, app, url, data, expect_errors=False, expected_status_int=200,
            upload_files=None, headers=None):
        json_response = app.post(
            str(url), data, expect_errors=expect_errors,
            upload_files=upload_files, headers=headers)
        self.assertEqual(json_response.status_int, expected_status_int)
        return json_response

    def post_email(
            self, recipient_email, sender_email, subject, body, html_body=None,
            expect_errors=False, expected_status_int=200):
        """Post an email from the sender to the recipient.

        Args:
            recipient_email: str. The email of the recipient.
            sender_email: str. The email of the sender.
            subject: str. The subject of the email.
            body: str. The body of the email.
            html_body: str. The HTML body of the email.
            expect_errors: bool. Whether errors are expected.
            expected_status_int: int. The expected status code of
                the JSON response.

        Returns:
            json. A JSON response generated by _send_post_request function.
        """
        email = mail.EmailMessage(
            sender=sender_email, to=recipient_email, subject=subject,
            body=body)
        if html_body is not None:
            email.html = html_body

        mime_email = email.to_mime_message()
        headers = {'content-type': mime_email.get_content_type()}
        data = mime_email.as_string()
        app = webtest.TestApp(main_mail.app)
        incoming_email_url = '/_ah/mail/%s' % recipient_email

        return self._send_post_request(
            app, incoming_email_url, data, headers=headers,
            expect_errors=expect_errors,
            expected_status_int=expected_status_int)

    def put_json(self, url, payload, csrf_token=None, expect_errors=False,
                 expected_status_int=200):
        """Put an object to the server by JSON; return the received object."""
        data = {'payload': json.dumps(payload)}
        if csrf_token:
            data['csrf_token'] = csrf_token

        json_response = self.testapp.put(
            str(url), data, expect_errors=expect_errors)

        self.assertEqual(json_response.status_int, expected_status_int)
        return self._parse_json_response(
            json_response, expect_errors=expect_errors)

    def get_csrf_token_from_response(self, response):
        """Retrieve the CSRF token from a GET response."""
        return re.search(CSRF_REGEX, response.body).group(1)

    def signup(self, email, username):
        """Complete the signup process for the user with the given username.

        Args:
            email: str. Email of the given user.
            username: str. Username of the given user.
        """
        self.login(email)
        # Signup uses a custom urlfetch mock (URLFetchServiceMock), instead
        # of the stub provided by testbed. This custom mock is disabled
        # immediately once the signup is complete. This is done to avoid
        # external  calls being made to Gravatar when running the backend
        # tests.
        with self.urlfetch_mock():
            response = self.testapp.get(feconf.SIGNUP_URL)
            self.assertEqual(response.status_int, 200)
            csrf_token = self.get_csrf_token_from_response(response)
            response = self.testapp.post(feconf.SIGNUP_DATA_URL, {
                'csrf_token': csrf_token,
                'payload': json.dumps({
                    'username': username,
                    'agreed_to_terms': True
                })
            })
            self.assertEqual(response.status_int, 200)
        self.logout()

    def set_config_property(self, config_obj, new_config_value):
        """Sets a given configuration object's value to the new value specified
        using a POST request.
        """
        self._stash_current_user_env()

        self.login('tmpsuperadmin@example.com', is_super_admin=True)
        response = self.testapp.get('/admin')
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json('/adminhandler', {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_obj.name: new_config_value,
            }
        }, csrf_token)
        self.logout()

        self._restore_stashed_user_env()

    def set_user_role(self, username, user_role):
        """Sets the given role for this user.

        Args:
            username: str. Username of the given user.
            user_role: str. Role of the given user.
        """
        self._stash_current_user_env()

        self.login('tmpsuperadmin@example.com', is_super_admin=True)
        response = self.testapp.get('/admin')
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json('/adminrolehandler', {
            'username': username,
            'role': user_role
        }, csrf_token)
        self.logout()

        self._restore_stashed_user_env()

    def set_admins(self, admin_usernames):
        """Sets role of given users as ADMIN.

        Args:
            admin_usernames: list(str). List of usernames.
        """
        for name in admin_usernames:
            self.set_user_role(name, feconf.ROLE_ID_ADMIN)

    def set_moderators(self, moderator_usernames):
        """Sets role of given users as MODERATOR.

        Args:
            moderator_usernames: list(str). List of usernames.
        """
        for name in moderator_usernames:
            self.set_user_role(name, feconf.ROLE_ID_MODERATOR)

    def set_banned_users(self, banned_usernames):
        """Sets role of given users as BANNED_USER.

        Args:
            banned_usernames: list(str). List of usernames.
        """
        for name in banned_usernames:
            self.set_user_role(name, feconf.ROLE_ID_BANNED_USER)

    def set_collection_editors(self, collection_editor_usernames):
        """Sets role of given users as COLLECTION_EDITOR.

        Args:
            collection_editor_usernames: list(str). List of usernames.
        """
        for name in collection_editor_usernames:
            self.set_user_role(name, feconf.ROLE_ID_COLLECTION_EDITOR)

    def set_topic_managers(self, topic_manager_usernames):
        """Sets role of given users as TOPIC_MANAGER.

        Args:
            topic_manager_usernames: list(str). List of usernames.
        """
        for name in topic_manager_usernames:
            self.set_user_role(name, feconf.ROLE_ID_TOPIC_MANAGER)

    def get_current_logged_in_user_id(self):
        """Gets the user_id of the current logged-in user.

        Returns:
            str. The user_id of the currently logged-in user. In tests, we
                simulate this using a USER_ID env variable.
        """
        return os.environ['USER_ID']

    def get_user_id_from_email(self, email):
        """Gets the user_id corresponding to the given email.

        Args:
            email: str. A valid email stored in the App Engine database.

        Returns:
            user_id: str. ID of the user possessing the given email.
        """
        return current_user_services.get_user_id_from_email(email)

    def save_new_default_exploration(
            self, exploration_id, owner_id, title='A title'):
        """Saves a new default exploration written by owner_id.

        Args:
            exploration_id: str. The id of the new validated exploration.
            owner_id: str. The user_id of the creator of the exploration.
            title: str. The title of the exploration.

        Returns:
            Exploration. The exploration domain object.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, title=title, category='A category')
        exp_services.save_new_exploration(owner_id, exploration)
        return exploration

    def save_new_valid_exploration(
            self, exploration_id, owner_id, title='A title',
            category='A category', objective='An objective',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            end_state_name=None,
            interaction_id='TextInput'):
        """Saves a new strictly-validated exploration.

        Args:
            exploration_id: str. The id of the new validated exploration.
            owner_id: str. The user_id of the creator of the exploration.
            title: str. The title of the exploration.
            category: str. The category this exploration belongs to.
            objective: str. The objective of this exploration.
            language_code: str. The language_code of this exploration.

        Returns:
            Exploration. The exploration domain object.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, title=title, category=category,
            language_code=language_code)
        exploration.states[exploration.init_state_name].update_interaction_id(
            interaction_id)
        exploration.objective = objective

        # If an end state name is provided, add terminal node with that name.
        if end_state_name is not None:
            exploration.add_states([end_state_name])
            end_state = exploration.states[end_state_name]
            end_state.update_interaction_id('EndExploration')
            end_state.interaction.default_outcome = None

            # Link first state to ending state (to maintain validity).
            init_state = exploration.states[exploration.init_state_name]
            init_interaction = init_state.interaction
            init_interaction.default_outcome.dest = end_state_name

        exp_services.save_new_exploration(owner_id, exploration)
        return exploration

    def save_new_exp_with_states_schema_v0(self, exp_id, user_id, title):
        """Saves a new default exploration with a default version 0 states
        dictionary.

        This function should only be used for creating explorations in tests
        involving migration of datastore explorations that use an old states
        schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating explorations. This is
        because the latter approach would result in an exploration with the
        *current* states schema version.

        Args:
            exp_id: str. The exploration ID.
            user_id: str. The user_id of the creator.
            title: str. The title of the exploration.
        """
        exp_model = exp_models.ExplorationModel(
            id=exp_id,
            category='category',
            title=title,
            objective='Old objective',
            language_code='en',
            tags=[],
            blurb='',
            author_notes='',
            states_schema_version=0,
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            states=self.VERSION_0_STATES_DICT,
            param_specs={},
            param_changes=[]
        )
        rights_manager.create_new_exploration_rights(exp_id, user_id)

        commit_message = 'New exploration created with title \'%s\'.' % title
        exp_model.commit(user_id, commit_message, [{
            'cmd': 'create_new',
            'title': 'title',
            'category': 'category',
        }])
        exp_rights = exp_models.ExplorationRightsModel.get_by_id(exp_id)
        exp_summary_model = exp_models.ExpSummaryModel(
            id=exp_id,
            title=title,
            category='category',
            objective='Old objective',
            language_code='en',
            tags=[],
            ratings=feconf.get_empty_ratings(),
            scaled_average_rating=feconf.EMPTY_SCALED_AVERAGE_RATING,
            status=exp_rights.status,
            community_owned=exp_rights.community_owned,
            owner_ids=exp_rights.owner_ids,
            contributor_ids=[],
            contributors_summary={},
        )
        exp_summary_model.put()

        # Note: Also save state id mappping model for new exploration. If not
        # saved, it may cause errors in test cases.
        exploration = exp_services.get_exploration_from_model(exp_model)
        exp_services.create_and_save_state_id_mapping_model(exploration, [])

    def publish_exploration(self, owner_id, exploration_id):
        """Publish the exploration with the given exploration_id.

        Args:
            exploration_id: str. The ID of the new exploration.
            owner_id: str. The user_id of the owner of the exploration.
        """
        committer = user_services.UserActionsInfo(owner_id)
        rights_manager.publish_exploration(committer, exploration_id)

    def save_new_default_collection(
            self, collection_id, owner_id, title='A title',
            category='A category', objective='An objective',
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new default collection written by owner_id.

        Args:
            collection_id: str. The id of the new default collection.
            owner_id: str. The user_id of the creator of the collection.
            title: str. The title of the collection.
            category: str. The category this collection belongs to.
            objective: str. The objective of this collection.
            language_code: str. The language_code of this collection.

        Returns:
            Collection. The collection domain object.
        """
        collection = collection_domain.Collection.create_default_collection(
            collection_id, title=title, category=category, objective=objective,
            language_code=language_code)
        collection_services.save_new_collection(owner_id, collection)
        return collection

    def save_new_valid_collection(
            self, collection_id, owner_id, title='A title',
            category='A category', objective='An objective',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            exploration_id='an_exploration_id',
            end_state_name=DEFAULT_END_STATE_NAME):
        """Creates an Oppia collection and adds a node saving the
        exploration details.

        Args:
            collection_id: str. ID for the collection to be created.
            owner_id: str. The user_id of the creator of the collection.
            title: str. Title for the collection.
            category: str. The category of the exploration.
            objective: str. Objective for the exploration.
            language_code: str. The language code for the exploration.
            exploration_id: str. The exploration_id for the Oppia exploration.
            end_state_name: str. The name of the end state for the exploration.

        Returns:
            Collection. A newly-created collection containing the corresponding
                exploration details.
        """
        collection = collection_domain.Collection.create_default_collection(
            collection_id, title, category, objective,
            language_code=language_code)

        # Check whether exploration with given exploration_id exists or not.
        exploration = exp_services.get_exploration_by_id(
            exploration_id, strict=False)
        if exploration is None:
            exploration = self.save_new_valid_exploration(
                exploration_id, owner_id, title, category, objective,
                end_state_name=end_state_name)
        collection.add_node(exploration.id)

        collection_services.save_new_collection(owner_id, collection)
        return collection

    def publish_collection(self, owner_id, collection_id):
        """Publish the collection with the given collection_id.

        Args:
            owner_id: str. The user_id of the owner of the collection.
            collection_id: str. ID of the collection to be published.
        """
        committer = user_services.UserActionsInfo(owner_id)
        rights_manager.publish_collection(committer, collection_id)

    def get_updated_param_dict(
            self, param_dict, param_changes, exp_param_specs):
        """Updates a param dict using the given list of param_changes.

        Note that the list of parameter changes is ordered. Parameter
        changes later in the list may depend on parameter changes that have
        been set earlier in the same list.
        """
        new_param_dict = copy.deepcopy(param_dict)
        for pc in param_changes:
            try:
                obj_type = exp_param_specs[pc.name].obj_type
            except:
                raise Exception('Parameter %s not found' % pc.name)
            new_param_dict[pc.name] = pc.get_normalized_value(
                obj_type, new_param_dict)
        return new_param_dict

    def get_static_asset_filepath(self):
        """Returns filepath for referencing static files on disk.
        examples: '' or 'build/'.
        """
        filepath = ''
        if not feconf.DEV_MODE:
            filepath = os.path.join('build')

        return filepath

    def get_static_asset_url(self, asset_suffix):
        """Returns the relative path for the asset, appending it to the
        corresponding cache slug. asset_suffix should have a leading
        slash.
        """
        return '/assets%s%s' % (utils.get_asset_dir_prefix(), asset_suffix)

    @contextlib.contextmanager
    def swap(self, obj, attr, newvalue):
        """Swap an object's attribute value within the context of a
        'with' statement. The object can be anything that supports
        getattr and setattr, such as class instances, modules, ...

        Example usage:

            import math
            with self.swap(math, 'sqrt', lambda x: 42):
                print math.sqrt(16.0)  # prints 42
            print math.sqrt(16.0)  # prints 4 as expected.

        Note that this does not work directly for classmethods. In this case,
        you will need to import the 'types' module, as follows:

            import types
            with self.swap(
                SomePythonClass, 'some_classmethod',
                types.MethodType(new_classmethod, SomePythonClass)):

        NOTE: self.swap and other context managers that are created using
        contextlib.contextmanager use generators that yield exactly once. This
        means that you can only use them once after construction, otherwise,
        the generator will immediately raise StopIteration, and contextlib will
        raise a RuntimeError.
        """
        original = getattr(obj, attr)
        setattr(obj, attr, newvalue)
        try:
            yield
        finally:
            setattr(obj, attr, original)


class AppEngineTestBase(TestBase):
    """Base class for tests requiring App Engine services."""

    def _delete_all_models(self):
        """Deletes all models from the NDB datastore."""
        from google.appengine.ext import ndb
        ndb.delete_multi(ndb.Query().iter(keys_only=True))

    def setUp(self):
        empty_environ()

        from google.appengine.datastore import datastore_stub_util
        from google.appengine.ext import testbed

        self.testbed = testbed.Testbed()
        self.testbed.activate()

        # Configure datastore policy to emulate instantaneously and globally
        # consistent HRD.
        policy = datastore_stub_util.PseudoRandomHRConsistencyPolicy(
            probability=1)

        # Declare any relevant App Engine service stubs here.
        self.testbed.init_user_stub()
        self.testbed.init_app_identity_stub()
        self.testbed.init_memcache_stub()
        self.testbed.init_datastore_v3_stub(consistency_policy=policy)
        self.testbed.init_urlfetch_stub()
        self.testbed.init_files_stub()
        self.testbed.init_blobstore_stub()
        self.testbed.init_search_stub()

        # The root path tells the testbed where to find the queue.yaml file.
        self.testbed.init_taskqueue_stub(root_path=os.getcwd())
        self.taskqueue_stub = self.testbed.get_stub(
            testbed.TASKQUEUE_SERVICE_NAME)

        self.testbed.init_mail_stub()
        self.mail_stub = self.testbed.get_stub(testbed.MAIL_SERVICE_NAME)

        # Set up the app to be tested.
        self.testapp = webtest.TestApp(main.app)

        self.signup_superadmin_user()

    def tearDown(self):
        self.logout()
        self._delete_all_models()
        self.testbed.deactivate()

    def _get_all_queue_names(self):
        """Returns all the queue names.

        Returns:
            list(str). All the queue names.
        """
        return [q['name'] for q in self.taskqueue_stub.GetQueues()]

    @contextlib.contextmanager
    def urlfetch_mock(
            self, content='', status_code=200, headers=None):
        """Enables the custom urlfetch mock (URLFetchServiceMock) within the
        context of a 'with' statement.

        This mock is currently used for signup to prevent external HTTP
        requests to fetch the Gravatar profile picture for new users while the
        backend tests are being run.

        Args:
            content: str. Response content or body.
            status_code: int. Response status code.
            headers: dict. The headers in subsequent calls to the
                urlfetch mock. The keys of this dict are strings that represent
                the header name and the value represents corresponding value of
                that header.
        """
        if headers is None:
            response_headers = {}
        else:
            response_headers = headers
        self.testbed.init_urlfetch_stub(enable=False)
        urlfetch_mock = URLFetchServiceMock()
        apiproxy_stub_map.apiproxy.RegisterStub('urlfetch', urlfetch_mock)
        urlfetch_mock.set_return_values(
            content=content, status_code=status_code, headers=response_headers)
        try:
            yield
        finally:
            # Disables the custom mock.
            self.testbed.init_urlfetch_stub(enable=False)
            # Enables the testbed urlfetch mock.
            self.testbed.init_urlfetch_stub()

    def count_jobs_in_taskqueue(self, queue_name):
        """Counts the jobs in the given queue."""
        return len(self.get_pending_tasks(queue_name))

    def get_pending_tasks(self, queue_name=None):
        """Returns the jobs in the given queue. If queue_name is None, defaults
        to returning the jobs in all available queues.
        """
        if queue_name is not None:
            return self.taskqueue_stub.get_filtered_tasks(
                queue_names=[queue_name])
        else:
            return self.taskqueue_stub.get_filtered_tasks()

    def process_and_flush_pending_tasks(self, queue_name=None):
        """Runs and flushes pending tasks. If queue_name is None, does so for
        all queues; otherwise, this only runs and flushes tasks for the
        specified queue.

        For more information on self.taskqueue_stub see

            https://code.google.com/p/googleappengine/source/browse/trunk/python/google/appengine/api/taskqueue/taskqueue_stub.py
        """
        queue_names = (
            [queue_name] if queue_name else self._get_all_queue_names())

        tasks = self.taskqueue_stub.get_filtered_tasks(queue_names=queue_names)
        for queue in queue_names:
            self.taskqueue_stub.FlushQueue(queue)

        while tasks:
            for task in tasks:
                if task.url == '/_ah/queue/deferred':
                    from google.appengine.ext import deferred
                    deferred.run(task.payload)
                else:
                    # All other tasks are expected to be mapreduce ones, or
                    # Oppia-taskqueue-related ones.
                    headers = {
                        key: str(val) for key, val in task.headers.iteritems()
                    }
                    headers['Content-Length'] = str(len(task.payload or ''))

                    app = (
                        webtest.TestApp(main_taskqueue.app)
                        if task.url.startswith('/task')
                        else self.testapp)
                    response = app.post(
                        url=str(task.url), params=(task.payload or ''),
                        headers=headers)
                    if response.status_code != 200:
                        raise RuntimeError(
                            'MapReduce task to URL %s failed' % task.url)

            tasks = self.taskqueue_stub.get_filtered_tasks(
                queue_names=queue_names)
            for queue in queue_names:
                self.taskqueue_stub.FlushQueue(queue)


if feconf.PLATFORM == 'gae':
    GenericTestBase = AppEngineTestBase
else:
    raise Exception('Invalid platform: expected one of [\'gae\']')


class FunctionWrapper(object):
    """A utility for making function wrappers. Create a subclass and override
    any or both of the pre_call_hook and post_call_hook methods. See these
    methods for more info.
    """

    def __init__(self, func):
        """Creates a new FunctionWrapper instance.

        Args:
            func: a callable, or data descriptor. If it's a descriptor, its
                __get__ should return a bound method. For example, func can be
                a function, a method, a static or class method, but not a
                @property.
        """
        self._func = func
        self._instance = None

    def __call__(self, *args, **kwargs):
        """Overrides the call method for the function to call pre_call_hook
        method which would be called before the function is executed and
        post_call_hook which would be called after the function is executed.
        """
        if self._instance is not None:
            args = [self._instance] + list(args)

        args_dict = inspect.getcallargs(self._func, *args, **kwargs)

        self.pre_call_hook(args_dict)

        result = self._func(*args, **kwargs)

        self.post_call_hook(args_dict, result)

        return result

    def __get__(self, instance, owner):
        # We have to implement __get__ because otherwise, we don't have a
        # chance to bind to the instance self._func was bound to. See the
        # following SO answer: https://stackoverflow.com/a/22555978/675311
        self._instance = instance
        return self

    def pre_call_hook(self, args):
        """Override this to do tasks that should be executed before the
        actual function call.

        Args:
            args: list(*). Set of arguments that the function accepts.
        """
        pass

    def post_call_hook(self, args, result):
        """Override this to do tasks that should be executed after the
        actual function call.

        Args:
            args: list(*). Set of arguments that the function accepts.
            result: *. Result returned from the function.
        """
        pass


class CallCounter(FunctionWrapper):
    """A function wrapper that keeps track of how often the function is called.
    Note that the counter is incremented before each call, so it is also
    increased when the function raises an exception.
    """

    def __init__(self, f):
        """Counts the number of times the given function has been called.
        See FunctionWrapper for arguments.
        """
        super(CallCounter, self).__init__(f)
        self._times_called = 0

    @property
    def times_called(self):
        """Property that returns the number of times the wrapped function has
        been called.

        Returns:
            int. The number of times the wrapped function has been called.
        """
        return self._times_called

    def pre_call_hook(self, args):
        """Method that is called before each function call to increment the
        counter tracking the number of times a function is called. This
        will also be called even when the function raises an exception.

        Args:
            args: list(*). Set of arguments that the function accepts.
        """
        self._times_called += 1


class FailingFunction(FunctionWrapper):
    """A function wrapper that makes a function fail, raising a given
    exception. It can be set to succeed after a given number of calls.
    """

    INFINITY = 'infinity'

    def __init__(self, f, exception, num_tries_before_success):
        """Create a new Failing function.

        Args:
            f: func. See FunctionWrapper.
            exception: Exception. The exception to be raised.
            num_tries_before_success: int. The number of times to raise an
                exception, before a call succeeds. If this is 0, all calls will
                succeed, if it is FailingFunction. INFINITY, all calls will
                fail.
        """
        super(FailingFunction, self).__init__(f)
        self._exception = exception
        self._num_tries_before_success = num_tries_before_success
        self._always_fail = (
            self._num_tries_before_success == FailingFunction.INFINITY)
        self._times_called = 0

        if not (self._num_tries_before_success >= 0 or self._always_fail):
            raise ValueError(
                'num_tries_before_success should either be an'
                'integer greater than or equal to 0,'
                'or FailingFunction.INFINITY')

    def pre_call_hook(self, args):
        """Method that is called each time before the actual function call
        to check if the exception is to be raised based on the number of
        tries before success.

        Args:
            args: list(*). Set of arguments this function accepts.
        """
        self._times_called += 1
        call_should_fail = (
            self._num_tries_before_success >= self._times_called)
        if call_should_fail or self._always_fail:
            raise self._exception
