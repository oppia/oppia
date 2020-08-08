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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import contextlib
import copy
import datetime
import inspect
import itertools
import json
import os
import unittest

from constants import constants
from core.controllers import base
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import interaction_registry
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
import feconf
import main
import main_mail
import main_taskqueue
import python_utils
import schema_utils
import utils

from google.appengine.api import apiproxy_stub
from google.appengine.api import apiproxy_stub_map
from google.appengine.api import mail
import webtest

(exp_models, question_models, skill_models, story_models, topic_models,) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.question, models.NAMES.skill,
        models.NAMES.story, models.NAMES.topic]))
current_user_services = models.Registry.import_current_user_services()
email_services = models.Registry.import_email_services()

# Prefix to append to all lines printed by tests to the console.
# We are using the b' prefix as all the stdouts are in bytes.
LOG_LINE_PREFIX = b'LOG_INFO_TEST: '


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


def get_filepath_from_filename(filename, rootdir):
    """Returns filepath using the filename. Different files are present
    in different subdirectories in the rootdir. So, we walk through the
    rootdir and match the all the filenames with the given filename.
    When a match is found the function returns the complete path of the
    filename by using os.path.join(root, filename).

    For example signup-page.mainpage.html is present in
    core/templates/pages/signup-page and error-page.mainpage.html is
    present in core/templates/pages/error-pages. So we walk through
    core/templates/pages and a match for signup-page.component.html
    is found in signup-page subdirectory and a match for
    error-page.directive.html is found in error-pages subdirectory.

    Args:
        filename: str. The name of the file.
        rootdir: str. The directory to search the file in.

    Returns:
        str | None. The path of the file if file is found otherwise
        None.
    """
    # This is required since error files are served according to error status
    # code. The file served is error-page.mainpage.html but it is compiled
    # and stored as error-page-{status_code}.mainpage.html.
    # So, we need to swap the name here to obtain the correct filepath.
    if filename.startswith('error-page'):
        filename = 'error-page.mainpage.html'

    filepath = None
    for root, _, filenames in os.walk(rootdir):
        for name in filenames:
            if name == filename:
                if filepath is None:
                    filepath = os.path.join(root, filename)
                else:
                    raise Exception(
                        'Multiple files found with name: %s' % filename)
    return filepath


def mock_load_template(filename):
    """Mock for load_template function. This mock is required for backend tests
    since we do not have webpack compilation before backend tests. The folder
    to search templates is webpack_bundles which is generated after webpack
    compilation. Since this folder will be missing, load_template function will
    return an error. So, we use a mock for load_template which returns the html
    file from the source directory instead.

    Args:
        filename: str. The name of the file for which template is
            to be returned.

    Returns:
        str. The contents of the given file.
    """
    filepath = get_filepath_from_filename(
        filename, os.path.join('core', 'templates', 'pages'))
    with python_utils.open_file(filepath, 'r') as f:
        file_content = f.read()
    return file_content


def check_image_png_or_webp(image_string):
    """Checks if the image is in png or webp format only.

    Args:
        image_string: str. Image url in base64 format.

    Returns:
        boolean. Returns true if image is in WebP format.
    """
    if (image_string.startswith('data:image/png') or
            image_string.startswith('data:image/webp')):
        return True
    return False


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

    SUPER_ADMIN_EMAIL = 'tmpsuperadmin@example.com'

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
    TOPIC_MANAGER_EMAIL = 'topicmanager@example.com'
    TOPIC_MANAGER_USERNAME = 'topicmanager'
    VOICE_ARTIST_EMAIL = 'voiceartist@example.com'
    VOICE_ARTIST_USERNAME = 'voiceartist'
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

    VERSION_27_STATE_DICT = {
        'content': {'content_id': u'content', 'html': u''},
        'param_changes': [],
        'content_ids_to_audio_translations': {
            u'content': {},
            u'default_outcome': {},
            u'hint_1': {},
            u'solution': {}
        },
        'written_translations': {
            'translations_mapping': {
                u'content': {},
                u'default_outcome': {},
                u'hint_1': {},
                u'solution': {}
            }
        },
        'interaction': {
            'solution': {
                'correct_answer': u'Solution',
                'explanation': {
                    'content_id': u'solution',
                    'html': u'<p>Solution explanation</p>'
                },
                'answer_is_exclusive': False
            },
            'answer_groups': [],
            'default_outcome': {
                'param_changes': [],
                'feedback': {
                    'content_id': u'default_outcome',
                    'html': u''
                },
                'dest': None,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': True
            },
            'customization_args': {
                u'rows': {u'value': 1},
                u'placeholder': {u'value': u'Enter text here'}
            },
            'confirmed_unclassified_answers': [],
            'id': u'TextInput',
            'hints': [{
                'hint_content': {
                    'content_id': u'hint_1',
                    'html': u'<p>Hint 1</p>'
                }
            }]
        },
        'classifier_model_id': None
    }

    VERSION_21_STATE_DICT = {
        'END': {
            'classifier_model_id': None,
            'content': {
                'content_id': 'content',
                'html': 'Congratulations, you have finished!'},
            'content_ids_to_audio_translations': {
                'content': {}},
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'recommendedExplorationIds': {'value': []}},
                'default_outcome': None,
                'hints': [],
                'id': 'EndExploration',
                'solution': None
            },
            'param_changes': []
        },
        'Introduction': {
            'classifier_model_id': None,
            'content': {
                'content_id': 'content',
                'html': ''
            },
            'content_ids_to_audio_translations': {
                'content': {},
                'default_outcome': {},
                'feedback_1': {}
            },
            'interaction': {
                'answer_groups': [{
                    'outcome': {
                        'dest': 'END',
                        'feedback': {
                            'content_id': 'feedback_1',
                            'html': '<p>Correct!</p>'},
                        'labelled_as_correct': False,
                        'missing_prerequisite_skill_id': None,
                        'param_changes': [],
                        'refresher_exploration_id': None},
                    'rule_specs': [{
                        'inputs': {'x': 'InputString'},
                        'rule_type': 'Equals'}],
                    'tagged_misconception_id': None,
                    'training_data': ['answer1', 'answer2', 'answer3']}],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'placeholder': {'value': ''},
                    'rows': {'value': 1}},
                'default_outcome': {
                    'dest': 'Introduction',
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': ''},
                    'labelled_as_correct': False,
                    'missing_prerequisite_skill_id': None,
                    'param_changes': [],
                    'refresher_exploration_id': None},
                'hints': [],
                'id': 'TextInput',
                'solution': None
            },
            'param_changes': []
        }
    }


    VERSION_1_STORY_CONTENTS_DICT = {
        'nodes': [{
            'outline': (
                '<p>Value</p><oppia-noninteractive-math ' +
                'raw_latex-with-value="&amp;quot;+,-,-,+&amp;quot' +
                ';"></oppia-noninteractive-math>'),
            'exploration_id': None,
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_1',
            'title': 'Chapter 1',
            'prerequisite_skill_ids': []}],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_2'
    }

    VERSION_2_STORY_CONTENTS_DICT = {
        'nodes': [{
            'outline': (
                '<p>Value</p><oppia-noninteractive-math ' +
                'raw_latex-with-value="&amp;quot;+,-,-,+&amp;quot' +
                ';"></oppia-noninteractive-math>'),
            'exploration_id': None,
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_1',
            'title': 'Chapter 1',
            'prerequisite_skill_ids': [],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None}],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_2'
    }

    VERSION_3_STORY_CONTENTS_DICT = {
        'nodes': [{
            'outline': (
                '<p>Value</p><oppia-noninteractive-math ' +
                'raw_latex-with-value="&amp;quot;+,-,-,+&amp;quot' +
                ';"></oppia-noninteractive-math>'),
            'exploration_id': None,
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_1',
            'title': 'Chapter 1',
            'description': '',
            'prerequisite_skill_ids': [],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None}],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_2'
    }
    VERSION_4_STORY_CONTENTS_DICT = {
        'nodes': [{
            'outline': (
                '<p>Value</p><oppia-noninteractive-'
                'math math_content-with-value="{&amp;quot;raw_latex&amp;quot;'
                ': &amp;quot;+,-,-,+&amp;quot;, &amp;quot;svg_filename&amp;'
                'quot;: &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'),
            'exploration_id': None,
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_1',
            'title': 'Chapter 1',
            'description': '',
            'prerequisite_skill_ids': [],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None}],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_2'
    }

    VERSION_1_SUBTOPIC_DICT = {
        'skill_ids': ['skill_1'],
        'id': 1,
        'title': 'A subtitle'
    }

    # Dictionary-like data structures within sample YAML must be formatted
    # alphabetically to match string equivalence with YAML generation tests.
    #
    # If evaluating differences in YAML, conversion to dict form via
    # utils.dict_from_yaml can isolate differences quickly.

    SAMPLE_YAML_CONTENT = (
        """author_notes: ''
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
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: %s
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: New state
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: %d
tags: []
title: Title
""") % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.CURRENT_STATE_SCHEMA_VERSION)

    SAMPLE_UNTITLED_YAML_CONTENT = (
        """author_notes: ''
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
        missing_prerequisite_skill_id: null
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
        missing_prerequisite_skill_id: null
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
    feconf.CURRENT_STATE_SCHEMA_VERSION)

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

    def _assert_validation_error(self, item, error_substring):
        """Checks that the given item passes default validation."""
        with self.assertRaisesRegexp(utils.ValidationError, error_substring):
            item.validate()

    def signup_superadmin_user(self):
        """Signs up a superadmin user. Should be called at the end of
        setUp().
        """
        self.signup(self.SUPER_ADMIN_EMAIL, 'tmpsuperadm1n')

    def log_line(self, line):
        """Print the line with a prefix that can be identified by the
        script that calls the test.
        """
        # We are using the b' prefix as all the stdouts are in bytes.
        python_utils.PRINT(
            b'%s%s' % (LOG_LINE_PREFIX, python_utils.convert_to_bytes(line)))

    def login(self, email, is_super_admin=False):
        """Sets the environment variables to simulate a login.

        Args:
            email: str. The email of the user who is to be logged in.
            is_super_admin: bool. Whether the user is a super admin.
       """
        os.environ['USER_EMAIL'] = email
        os.environ['USER_ID'] = self.get_gae_id_from_email(email)
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

    def _get_response(
            self, url, expected_content_type, params=None,
            expected_status_int=200):
        """Get a response, transformed to a Python object.

        Args:
            url: str. The URL to fetch the response.
            expected_content_type: str. The content type to expect.
            params: dict. A dictionary that will be encoded into a query string.
            expected_status_int: int. The integer status code to expect. Will
                be 200 if not specified.

        Returns:
            webtest.TestResponse. The test response.
        """
        if params is not None:
            self.assertTrue(isinstance(params, dict))

        expect_errors = False
        if expected_status_int >= 400:
            expect_errors = True

        # This swap is required to ensure that the templates are fetched from
        # source directory instead of webpack_bundles since webpack_bundles
        # is only produced after webpack compilation which is not performed
        # during backend tests.
        with self.swap(
            base, 'load_template', mock_load_template):
            response = self.testapp.get(
                url, params, expect_errors=expect_errors,
                status=expected_status_int)

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/
        # bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119 .
        self.assertEqual(response.status_int, expected_status_int)
        if not expect_errors:
            self.assertTrue(
                response.status_int >= 200 and response.status_int < 400)
        else:
            self.assertTrue(response.status_int >= 400)
        self.assertEqual(
            response.content_type, expected_content_type)

        return response

    def get_html_response(self, url, params=None, expected_status_int=200):
        """Get a HTML response, transformed to a Python object.

        Args:
            url: str. The URL to fetch the response.
            params: dict. A dictionary that will be encoded into a query string.
            expected_status_int: int. The integer status code to expect. Will
                be 200 if not specified.

        Returns:
            webtest.TestResponse. The test response.
        """
        response = self._get_response(
            url, 'text/html', params=params,
            expected_status_int=expected_status_int)

        return response

    def get_custom_response(
            self, url, expected_content_type, params=None,
            expected_status_int=200):
        """Get a response other than HTML or JSON, transformed to a Python
        object.

        Args:
            url: str. The URL to fetch the response.
            expected_content_type: str. The content type to expect.
            params: dict. A dictionary that will be encoded into a query string.
            expected_status_int: int. The integer status code to expect. Will
                be 200 if not specified.

        Returns:
            webtest.TestResponse. The test response.
        """
        self.assertNotIn(
            expected_content_type, ['text/html', 'application/json'])

        response = self._get_response(
            url, expected_content_type, params=params,
            expected_status_int=expected_status_int)

        return response

    def get_response_without_checking_for_errors(
            self, url, expected_status_int_list, params=None):
        """Get a response, transformed to a Python object and
        checks for a list of status codes.

        Args:
            url: str. The URL to fetch the response.
            expected_status_int_list: list(int). A list of integer status
                code to expect.
            params: dict. A dictionary that will be encoded into a query string.

        Returns:
            webtest.TestResponse. The test response.
        """
        if params is not None:
            self.assertTrue(
                isinstance(params, dict),
                msg='Expected params to be a dict, received %s' % params)

        # This swap is required to ensure that the templates are fetched from
        # source directory instead of webpack_bundles since webpack_bundles
        # is only produced after webpack compilation which is not performed
        # during backend tests.
        with self.swap(
            base, 'load_template', mock_load_template):
            response = self.testapp.get(url, params, expect_errors=True)

        self.assertIn(response.status_int, expected_status_int_list)

        return response

    def _parse_json_response(self, json_response, expect_errors):
        """Convert a JSON server response to an object (such as a dict)."""
        if not expect_errors:
            self.assertTrue(
                json_response.status_int >= 200 and
                json_response.status_int < 400)
        else:
            self.assertTrue(json_response.status_int >= 400)
        self.assertEqual(
            json_response.content_type, 'application/json')
        self.assertTrue(json_response.body.startswith(feconf.XSSI_PREFIX))

        return json.loads(json_response.body[len(feconf.XSSI_PREFIX):])

    def get_json(self, url, params=None, expected_status_int=200):
        """Get a JSON response, transformed to a Python object."""
        if params is not None:
            self.assertTrue(isinstance(params, dict))

        expect_errors = False
        if expected_status_int >= 400:
            expect_errors = True

        json_response = self.testapp.get(
            url, params, expect_errors=expect_errors,
            status=expected_status_int)

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/
        # bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119 .
        self.assertEqual(json_response.status_int, expected_status_int)
        return self._parse_json_response(json_response, expect_errors)

    def post_json(
            self, url, payload, csrf_token=None,
            expected_status_int=200, upload_files=None):
        """Post an object to the server by JSON; return the received object."""
        data = {'payload': json.dumps(payload)}
        if csrf_token:
            data['csrf_token'] = csrf_token

        expect_errors = False
        if expected_status_int >= 400:
            expect_errors = True
        json_response = self._send_post_request(
            self.testapp, url, data,
            expect_errors,
            expected_status_int=expected_status_int,
            upload_files=upload_files)
        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/
        # bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119 .

        self.assertEqual(json_response.status_int, expected_status_int)
        return self._parse_json_response(json_response, expect_errors)

    def delete_json(self, url, params='', expected_status_int=200):
        """Delete object on the server using a JSON call."""
        if params:
            self.assertTrue(
                isinstance(params, dict),
                msg='Expected params to be a dict, received %s' % params)

        expect_errors = False
        if expected_status_int >= 400:
            expect_errors = True
        json_response = self.testapp.delete(
            url, params, expect_errors=expect_errors,
            status=expected_status_int)

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/
        # bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119 .
        self.assertEqual(json_response.status_int, expected_status_int)
        return self._parse_json_response(json_response, expect_errors)

    def _send_post_request(
            self, app, url, data, expect_errors,
            expected_status_int=200,
            upload_files=None, headers=None):
        """Sends a post request with the data provided to the url specified.

        Args:
            app: TestApp. The WSGI application which receives the
                request and produces response.
            url: str. The URL to send the POST request to.
            data: *. To be put in the body of the request. If params is an
                iterator, it will be urlencoded. If it is a string, it will
                not be encoded, but placed in the body directly. Can be a
                collections.OrderedDict with webtest.forms.Upload fields
                included.
            expect_errors: bool. Whether errors are expected.
            expected_status_int: int. The expected status code.
            upload_files: list(tuple). A list of (fieldname, filename,
                file_content). You can also use just (fieldname, filename) and
                the file contents will be read from disk.
            headers: dict(str, *). Extra headers to send.

        Returns:
            webtest.TestResponse. The response of the POST request.
        """
        # Convert the files to bytes.
        if upload_files is not None:
            upload_files = tuple(
                tuple(python_utils.convert_to_bytes(
                    j) for j in i) for i in upload_files)

        json_response = app.post(
            url, data, expect_errors=expect_errors,
            upload_files=upload_files, headers=headers,
            status=expected_status_int)
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
            app, incoming_email_url, data,
            expect_errors, headers=headers,
            expected_status_int=expected_status_int)

    def put_json(self, url, payload, csrf_token=None, expected_status_int=200):
        """Put an object to the server by JSON; return the received object."""
        data = {'payload': json.dumps(payload)}
        if csrf_token:
            data['csrf_token'] = csrf_token

        expect_errors = False
        if expected_status_int >= 400:
            expect_errors = True
        json_response = self.testapp.put(
            python_utils.UNICODE(url), data, expect_errors=expect_errors)

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/
        # bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119 .
        self.assertEqual(json_response.status_int, expected_status_int)
        return self._parse_json_response(json_response, expect_errors)

    def get_new_csrf_token(self):
        """Generates CSRF token for test."""
        response = self.get_json('/csrfhandler')
        return response['token']

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
        # external calls being made to Gravatar when running the backend
        # tests.
        gae_id = self.get_gae_id_from_email(email)
        user_services.create_new_user(gae_id, email)
        with self.urlfetch_mock():
            response = self.get_html_response(feconf.SIGNUP_URL)
            self.assertEqual(response.status_int, 200)
            csrf_token = self.get_new_csrf_token()
            response = self.testapp.post(
                feconf.SIGNUP_DATA_URL, params={
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
        with self.login_context(self.SUPER_ADMIN_EMAIL, is_super_admin=True):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/adminhandler', {
                    'action': 'save_config_properties',
                    'new_config_property_values': {
                        config_obj.name: new_config_value,
                    }
                }, csrf_token=csrf_token)

    def set_user_role(self, username, user_role):
        """Sets the given role for this user.

        Args:
            username: str. Username of the given user.
            user_role: str. Role of the given user.
        """
        with self.login_context(self.SUPER_ADMIN_EMAIL, is_super_admin=True):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/adminrolehandler', {
                    'username': username,
                    'role': user_role
                }, csrf_token=csrf_token)

    def set_admins(self, admin_usernames):
        """Sets role of given users as ADMIN.

        Args:
            admin_usernames: list(str). List of usernames.
        """
        for name in admin_usernames:
            self.set_user_role(name, feconf.ROLE_ID_ADMIN)

    def set_topic_managers(self, topic_manager_usernames):
        """Sets role of given users as TOPIC_MANAGER.

        Args:
            topic_manager_usernames: list(str). List of usernames.
        """
        for name in topic_manager_usernames:
            self.set_user_role(name, feconf.ROLE_ID_TOPIC_MANAGER)

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

    def get_user_id_from_email(self, email):
        """Gets the user ID corresponding to the given email.

        Args:
            email: str. A valid email stored in the App Engine database.

        Returns:
            str. ID of the user possessing the given email.
        """
        gae_id = self.get_gae_id_from_email(email)
        return (
            user_services.get_user_settings_by_gae_id(gae_id).user_id)

    def get_gae_id_from_email(self, email):
        """Gets the GAE user ID corresponding to the given email.

        Args:
            email: str. A valid email stored in the App Engine database.

        Returns:
            str. GAE ID of the user possessing the given email.
        """
        return current_user_services.get_gae_id_from_email(email)

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
            exploration_id, title=title, category='Algebra')
        exp_services.save_new_exploration(owner_id, exploration)
        return exploration

    def set_interaction_for_state(self, state, interaction_id):
        """Sets the interaction_id, sets the fully populated default
        interaction customization arguments, and increments
        next_content_id_index as needed.

        Args:
            state: State. The state domain object to set the interaction for.
            interaction_id: str. The interaction id to set. Also sets the
                default customization args for the given interaction id.
        """

        # We wrap next_content_id_index in a dict so that modifying it in the
        # inner function modifies the value.
        next_content_id_index_dict = {
            'value': state.next_content_id_index
        }

        def traverse_schema_and_assign_content_ids(value, schema, contentId):
            """Generates content_id from recursively traversing the schema, and
            assigning to the current value.

            Args:
                value: *. The current traversed value in customization
                    arguments.
                schema: dict. The current traversed schema.
                contentId: str. The content_id generated so far.
            """
            is_subtitled_html_spec = (
                schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
                schema['obj_type'] ==
                schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML)
            is_subtitled_unicode_spec = (
                schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
                schema['obj_type'] ==
                schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE)

            if is_subtitled_html_spec or is_subtitled_unicode_spec:
                value['content_id'] = '%s_%i' % (
                    contentId, next_content_id_index_dict['value'])
                next_content_id_index_dict['value'] += 1
            elif schema['type'] == schema_utils.SCHEMA_TYPE_LIST:
                for x in value:
                    traverse_schema_and_assign_content_ids(
                        x, schema['items'], contentId)
            elif schema['type'] == schema_utils.SCHEMA_TYPE_DICT:
                for schema_property in schema['properties']:
                    traverse_schema_and_assign_content_ids(
                        x[schema_property.name],
                        schema_property['schema'],
                        '%s_%s' % (contentId, schema_property.name)
                    )

        interaction = interaction_registry.Registry.get_interaction_by_id(
            interaction_id)
        ca_specs = interaction.customization_arg_specs
        customization_args = {}

        for ca_spec in ca_specs:
            ca_name = ca_spec.name
            ca_value = ca_spec.default_value
            traverse_schema_and_assign_content_ids(
                ca_value,
                ca_spec.schema,
                'ca_%s' % ca_name
            )
            customization_args[ca_name] = {'value': ca_value}

        state.update_interaction_id(interaction_id)
        state.update_interaction_customization_args(customization_args)
        state.update_next_content_id_index(next_content_id_index_dict['value'])

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
            end_state_name: str. The name of the end state for the exploration.
            interaction_id: str. The id of the interaction.

        Returns:
            Exploration. The exploration domain object.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, title=title, category=category,
            language_code=language_code)
        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name], interaction_id)

        exploration.objective = objective

        # If an end state name is provided, add terminal node with that name.
        if end_state_name is not None:
            exploration.add_states([end_state_name])
            end_state = exploration.states[end_state_name]
            self.set_interaction_for_state(end_state, 'EndExploration')
            end_state.update_interaction_default_outcome(None)

            # Link first state to ending state (to maintain validity).
            init_state = exploration.states[exploration.init_state_name]
            init_interaction = init_state.interaction
            init_interaction.default_outcome.dest = end_state_name

        exp_services.save_new_exploration(owner_id, exploration)
        return exploration

    def save_new_linear_exp_with_state_names_and_interactions(
            self, exploration_id, owner_id, state_names, interaction_ids,
            title='A title', category='A category', objective='An objective',
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new strictly-validated exploration with a sequence of states.

        Args:
            exploration_id: str. The id of the new validated exploration.
            owner_id: str. The user_id of the creator of the exploration.
            state_names: list(str). The names of states to be linked
                sequentially in the exploration. Must be a non-empty list and
                contain no duplicates.
            interaction_ids: list(str). The names of the interaction ids to be
                assigned to each state. Values will be cycled, so it doesn't
                need to be the same size as state_names, but it must be
                non-empty.
            title: str. The title of the exploration.
            category: str. The category this exploration belongs to.
            objective: str. The objective of this exploration.
            language_code: str. The language_code of this exploration.

        Returns:
            Exploration. The exploration domain object.
        """
        if not state_names:
            raise ValueError('must provide at least one state name')
        if not interaction_ids:
            raise ValueError('must provide at least one interaction type')
        interaction_ids = itertools.cycle(interaction_ids)

        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, title=title, init_state_name=state_names[0],
            category=category, objective=objective, language_code=language_code)

        exploration.add_states(state_names[1:])
        for from_state_name, dest_state_name in (
                python_utils.ZIP(state_names[:-1], state_names[1:])):
            from_state = exploration.states[from_state_name]
            self.set_interaction_for_state(
                from_state, python_utils.NEXT(interaction_ids))
            from_state.interaction.default_outcome.dest = dest_state_name
        end_state = exploration.states[state_names[-1]]
        self.set_interaction_for_state(end_state, 'EndExploration')
        end_state.update_interaction_default_outcome(None)

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
        exp_model.commit(
            user_id, commit_message, [{
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

    def save_new_exp_with_states_schema_v34(self, exp_id, user_id, states_dict):
        """Saves a new default exploration with a default version 34 states
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
            states_dict: dict. The dict representation of all the states.
        """
        exp_model = exp_models.ExplorationModel(
            id=exp_id,
            category='category',
            title='title',
            objective='Old objective',
            language_code='en',
            tags=[],
            blurb='',
            author_notes='',
            states_schema_version=34,
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            states=states_dict,
            param_specs={},
            param_changes=[]
        )
        rights_manager.create_new_exploration_rights(exp_id, user_id)

        commit_message = 'New exploration created with title \'title\'.'
        exp_model.commit(
            user_id, commit_message, [{
                'cmd': 'create_new',
                'title': 'title',
                'category': 'category',
            }])
        exp_rights = exp_models.ExplorationRightsModel.get_by_id(exp_id)
        exp_summary_model = exp_models.ExpSummaryModel(
            id=exp_id,
            title='title',
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

    def save_new_exp_with_states_schema_v21(self, exp_id, user_id, title):
        """Saves a new default exploration with a default version 21 states
        dictionary. Version 21 is where training data of exploration is stored
        with the states dict.

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
            states_schema_version=21,
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            states=self.VERSION_21_STATE_DICT,
            param_specs={},
            param_changes=[]
        )
        rights_manager.create_new_exploration_rights(exp_id, user_id)

        commit_message = 'New exploration created with title \'%s\'.' % title
        exp_model.commit(
            user_id, commit_message, [{
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

    def publish_exploration(self, owner_id, exploration_id):
        """Publish the exploration with the given exploration_id.

        Args:
            owner_id: str. The user_id of the owner of the exploration.
            exploration_id: str. The ID of the new exploration.
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
            collection_id,
            title=title,
            category=category,
            objective=objective,
            language_code=language_code)

        # Check whether exploration with given exploration_id exists or not.
        exploration = exp_fetchers.get_exploration_by_id(
            exploration_id, strict=False)
        if exploration is None:
            exploration = self.save_new_valid_exploration(
                exploration_id, owner_id,
                title=title,
                category=category,
                objective=objective,
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

    def save_new_story(
            self, story_id, owner_id, corresponding_topic_id,
            title='Title', description='Description', notes='Notes',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='title'):
        """Creates an Oppia Story and saves it.

        NOTE: Callers are responsible for ensuring that the
        'corresponding_topic_id' provided is valid, unless a test explicitly
        requires it to be invalid.

        Args:
            story_id: str. ID for the story to be created.
            owner_id: str. The user_id of the creator of the story.
            title: str. The title of the story.
            description: str. The high level description of the story.
            notes: str. A set of notes, that describe the characters,
                main storyline, and setting.
            corresponding_topic_id: str. The id of the topic to which the story
                belongs.
            language_code: str. The ISO 639-1 code for the language this
                story is written in.
            url_fragment: str. The url fragment of the story.

        Returns:
            Story. A newly-created story.
        """
        story = story_domain.Story.create_default_story(
            story_id, title, description, corresponding_topic_id, url_fragment)
        story.title = title
        story.description = description
        story.notes = notes
        story.language_code = language_code
        story.url_fragment = url_fragment
        story_services.save_new_story(owner_id, story)
        return story

    def save_new_story_with_story_contents_schema_v1(
            self, story_id, thumbnail_filename, thumbnail_bg_color,
            owner_id, title, description,
            notes, corresponding_topic_id,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new story with a default version 1 story contents
        data dictionary.

        This function should only be used for creating stories in tests
        involving migration of datastore stories that use an old story
        contents schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating stories. This is
        because the latter approach would result in a story with the
        *current* story contents schema version.

        Args:
            story_id: str. ID for the story to be created.
            thumbnail_filename: str|None. Thumbnail filename for the story.
            thumbnail_bg_color: str|None. Thumbnail background color for the
                story.
            owner_id: str. The user_id of the creator of the story.
            title: str. The title of the story.
            description: str. The high level description of the story.
            notes: str. A set of notes, that describe the characters,
                main storyline, and setting.
            corresponding_topic_id: str. The id of the topic to which the story
                belongs.
            language_code: str. The ISO 639-1 code for the language this
                story is written in.
        """
        story_model = story_models.StoryModel(
            id=story_id,
            thumbnail_filename=thumbnail_filename,
            thumbnail_bg_color=thumbnail_bg_color,
            description=description,
            title=title,
            language_code=language_code,
            story_contents_schema_version=1,
            notes=notes,
            corresponding_topic_id=corresponding_topic_id,
            story_contents=self.VERSION_1_STORY_CONTENTS_DICT
        )
        commit_message = (
            'New story created with title \'%s\'.' % title)
        story_model.commit(
            owner_id, commit_message, [{
                'cmd': story_domain.CMD_CREATE_NEW,
                'title': title
            }])

    def save_new_topic(
            self, topic_id, owner_id, name='topic', abbreviated_name='topic',
            url_fragment='topic',
            thumbnail_filename='topic.svg',
            thumbnail_bg_color=(
                constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0]),
            description='description', canonical_story_ids=None,
            additional_story_ids=None, uncategorized_skill_ids=None,
            subtopics=None, next_subtopic_id=0,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Creates an Oppia Topic and saves it.

        Args:
            topic_id: str. ID for the topic to be created.
            owner_id: str. The user_id of the creator of the topic.
            name: str. The name of the topic.
            abbreviated_name: str. The abbreviated name of the topic.
            url_fragment: str. The url fragment of the topic.
            thumbnail_filename: str|None. The thumbnail filename of the topic.
            thumbnail_bg_color: str|None. The thumbnail background color of the
                topic.
            description: str. The description of the topic.
            canonical_story_ids: list(str). The list of ids of canonical stories
                that are part of the topic.
            additional_story_ids: list(str). The list of ids of additional
                stories that are part of the topic.
            uncategorized_skill_ids: list(str). The list of ids of skills that
                are not part of any subtopic.
            subtopics: list(Subtopic). The different subtopics that are part of
                this topic.
            next_subtopic_id: int. The id for the next subtopic.
            language_code: str. The ISO 639-1 code for the language this
                topic is written in.

        Returns:
            Topic. A newly-created topic.
        """
        canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(story_id)
            for story_id in (canonical_story_ids or [])
        ]
        additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(story_id)
            for story_id in (additional_story_ids or [])
        ]
        uncategorized_skill_ids = (uncategorized_skill_ids or [])
        subtopics = (subtopics or [])
        topic = topic_domain.Topic(
            topic_id, name, abbreviated_name, url_fragment,
            thumbnail_filename, thumbnail_bg_color,
            description, canonical_story_references,
            additional_story_references, uncategorized_skill_ids, subtopics,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION, next_subtopic_id,
            language_code, 0, feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION
        )
        topic_services.save_new_topic(owner_id, topic)
        return topic

    def save_new_topic_with_subtopic_schema_v1(
            self, topic_id, owner_id, name, abbreviated_name, url_fragment,
            canonical_name, description, thumbnail_filename,
            thumbnail_bg_color, canonical_story_references,
            additional_story_references,
            uncategorized_skill_ids, next_subtopic_id,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new topic with a default version 1 subtopic
        data dictionary.

        This function should only be used for creating topics in tests
        involving migration of datastore topics that use an old subtopic
        schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating topics. This is
        because the latter approach would result in a topic with the
        *current* subtopic schema version.

        Args:
            topic_id: str. ID for the topic to be created.
            owner_id: str. The user_id of the creator of the topic.
            name: str. The name of the topic.
            abbreviated_name: str. The abbreviated name of the topic.
            url_fragment: str. The url fragment of the topic.
            canonical_name: str. The canonical name (lowercase) of the topic.
            description: str. The description of the topic.
            thumbnail_filename: str. The thumbnail file name of the topic.
            thumbnail_bg_color: str. The thumbnail background color of the
                topic.
            canonical_story_references: list(StoryReference). A set of story
                reference objects representing the canonical stories that are
                part of this topic.
            additional_story_references: list(StoryReference). A set of story
                reference object representing the additional stories that are
                part of this topic.
            uncategorized_skill_ids: list(str). The list of ids of skills that
                are not part of any subtopic.
            next_subtopic_id: int. The id for the next subtopic.
            language_code: str. The ISO 639-1 code for the language this
                topic is written in.
        """
        topic_rights_model = topic_models.TopicRightsModel(
            id=topic_id,
            manager_ids=[],
            topic_is_published=True
        )
        topic_model = topic_models.TopicModel(
            id=topic_id,
            name=name,
            abbreviated_name=abbreviated_name,
            url_fragment=url_fragment,
            thumbnail_filename=thumbnail_filename,
            thumbnail_bg_color=thumbnail_bg_color,
            canonical_name=canonical_name,
            description=description,
            language_code=language_code,
            canonical_story_references=canonical_story_references,
            additional_story_references=additional_story_references,
            uncategorized_skill_ids=uncategorized_skill_ids,
            subtopic_schema_version=1,
            story_reference_schema_version=(
                feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION),
            next_subtopic_id=next_subtopic_id,
            subtopics=[self.VERSION_1_SUBTOPIC_DICT]
        )
        commit_message = (
            'New topic created with name \'%s\'.' % name)
        topic_rights_model.commit(
            committer_id=owner_id,
            commit_message='Created new topic rights',
            commit_cmds=[{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        topic_model.commit(
            owner_id, commit_message, [{
                'cmd': topic_domain.CMD_CREATE_NEW,
                'name': name
            }])

    def save_new_question(
            self, question_id, owner_id, question_state_data,
            linked_skill_ids,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Creates an Oppia Question and saves it.

        Args:
            question_id: str. ID for the question to be created.
            owner_id: str. The id of the user creating the question.
            question_state_data: State. The state data for the question.
            linked_skill_ids: list(str). List of skill IDs linked to the
                question.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.

        Returns:
            Question. A newly-created question.
        """
        question = question_domain.Question(
            question_id, question_state_data,
            feconf.CURRENT_STATE_SCHEMA_VERSION, language_code, 0,
            linked_skill_ids)
        question_services.add_question(owner_id, question)
        return question

    def save_new_question_with_state_data_schema_v27(
            self, question_id, owner_id,
            linked_skill_ids,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new default question with a default version 27 state
        data dictionary.

        This function should only be used for creating questions in tests
        involving migration of datastore questions that use an old state
        data schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating questions. This is
        because the latter approach would result in an question with the
        *current* state data schema version.

        Args:
            question_id: str. ID for the question to be created.
            owner_id: str. The id of the user creating the question.
            linked_skill_ids: list(str). The skill IDs linked to the question.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
        """
        question_model = question_models.QuestionModel(
            id=question_id,
            question_state_data=self.VERSION_27_STATE_DICT,
            language_code=language_code,
            version=1,
            question_state_data_schema_version=27,
            linked_skill_ids=linked_skill_ids
        )
        question_model.commit(
            owner_id, 'New question created',
            [{'cmd': question_domain.CMD_CREATE_NEW}])

    def save_new_skill(
            self, skill_id, owner_id,
            description='description', misconceptions=None, rubrics=None,
            skill_contents=None, language_code=constants.DEFAULT_LANGUAGE_CODE,
            prerequisite_skill_ids=None):
        """Creates an Oppia Skill and saves it.

        Args:
            skill_id: str. ID for the skill to be created.
            owner_id: str. The user_id of the creator of the skill.
            description: str. The description of the skill.
            misconceptions: list(Misconception)|None. A list of Misconception
                objects that contains the various misconceptions of the skill.
            rubrics: list(Rubric)|None. A list of Rubric objects that contain
                the rubric for each difficulty of the skill.
            skill_contents: SkillContents|None. A SkillContents object
                containing the explanation and examples of the skill.
            language_code: str. The ISO 639-1 code for the language this
                skill is written in.
            prerequisite_skill_ids: list(str)|None. The prerequisite skill IDs
                for the skill.

        Returns:
            Skill. A newly-created skill.
        """
        skill = skill_domain.Skill.create_default_skill(
            skill_id, description, [])
        if misconceptions is not None:
            skill.misconceptions = misconceptions
            skill.next_misconception_id = len(misconceptions) + 1
        if skill_contents is not None:
            skill.skill_contents = skill_contents
        if prerequisite_skill_ids is not None:
            skill.prerequisite_skill_ids = prerequisite_skill_ids
        if rubrics is not None:
            skill.rubrics = rubrics
        else:
            skill.rubrics = [
                skill_domain.Rubric(
                    constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
                skill_domain.Rubric(
                    constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
                skill_domain.Rubric(
                    constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skill.language_code = language_code
        skill.version = 0
        skill_services.save_new_skill(owner_id, skill)
        return skill

    def save_new_skill_with_defined_schema_versions(
            self, skill_id, owner_id, description, next_misconception_id,
            misconceptions=None, rubrics=None, skill_contents=None,
            misconceptions_schema_version=1, rubric_schema_version=1,
            skill_contents_schema_version=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new default skill with the given versions for misconceptions
        and skill contents.

        This function should only be used for creating skills in tests
        involving migration of datastore skills that use an old
        schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating skills. This is
        because the latter approach would result in a skill with the
        *current* schema version.

        Args:
            skill_id: str. ID for the skill to be created.
            owner_id: str. The user_id of the creator of the skill.
            description: str. The description of the skill.
            next_misconception_id: int. The misconception id to be used by
                the next misconception added.
            misconceptions: list(Misconception.to_dict()). The list
                of misconception dicts associated with the skill.
            rubrics: list(Rubric.to_dict()). The list of rubric dicts associated
                with the skill.
            skill_contents: SkillContents.to_dict(). A SkillContents dict
                containing the explanation and examples of the skill.
            misconceptions_schema_version: int. The schema version for the
                misconceptions object.
            rubric_schema_version: int. The schema version for the
                rubric object.
            skill_contents_schema_version: int. The schema version for the
                skill_contents object.
            language_code: str. The ISO 639-1 code for the language this
                skill is written in.
        """
        skill_model = skill_models.SkillModel(
            id=skill_id,
            description=description,
            language_code=language_code,
            misconceptions=misconceptions,
            rubrics=rubrics,
            skill_contents=skill_contents,
            next_misconception_id=next_misconception_id,
            misconceptions_schema_version=misconceptions_schema_version,
            rubric_schema_version=rubric_schema_version,
            skill_contents_schema_version=skill_contents_schema_version,
            superseding_skill_id=None,
            all_questions_merged=False
        )
        skill_model.commit(
            owner_id, 'New skill created.',
            [{'cmd': skill_domain.CMD_CREATE_NEW}])

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
        if not constants.DEV_MODE:
            filepath = os.path.join('build')

        return filepath

    def get_static_asset_url(self, asset_suffix):
        """Returns the relative path for the asset, appending it to the
        corresponding cache slug. asset_suffix should have a leading
        slash.
        """
        return '/assets%s%s' % (utils.get_asset_dir_prefix(), asset_suffix)

    @contextlib.contextmanager
    def mock_datetime_utcnow(self, mocked_datetime):
        """Mocks response from datetime.datetime.utcnow method.

        Example usage:
            import datetime
            mocked_datetime_utcnow = datetime.datetime.utcnow() -
                datetime.timedelta(days=1)
            with self.mock_datetime_utcnow(mocked_datetime_utcnow):
                print datetime.datetime.utcnow() # prints time reduced by 1 day
            print datetime.datetime.utcnow()  # prints current time.

        Args:
            mocked_datetime: datetime.datetime. The datetime which will be used
                instead of the current UTC datetime.

        Yields:
            None. Empty yield statement.
        """
        if not isinstance(mocked_datetime, datetime.datetime):
            raise utils.ValidationError(
                'Expected mocked_datetime to be datetime.datetime, got %s' % (
                    type(mocked_datetime)))

        original_datetime_type = datetime.datetime

        class PatchedDatetimeType(type):
            """Validates the datetime instances."""

            def __instancecheck__(cls, other):
                """Validates whether the given instance is datetime
                instance.
                """
                return isinstance(other, original_datetime_type)

        class MockDatetime( # pylint: disable=inherit-non-class
                python_utils.with_metaclass(
                    PatchedDatetimeType, datetime.datetime)):
            @classmethod
            def utcnow(cls):
                """Returns the mocked datetime."""

                return mocked_datetime

        setattr(datetime, 'datetime', MockDatetime)

        try:
            yield
        finally:
            setattr(datetime, 'datetime', original_datetime_type)

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

    @contextlib.contextmanager
    def swap_with_checks(
            self, obj, attr, new_value, expected_args=None,
            expected_kwargs=None, called=True):
        """Swap an object's function value within the context of a
        'with' statement. The object can be anything that supports
        getattr and setattr, such as class instances, modules, ...

        Examples:
            If you want to check subprocess.Popen is invoked twice
            like `subprocess.Popen(['python'], shell=True)` and
            `subprocess.Popen(['python2], shell=False), you can first
            define the mock function, then the swap, and just run the
            target function in context, as follows:
                def mock_popen(command, shell):
                    return

                popen_swap = self.swap_with_checks(
                    subprocess, 'Popen', mock_popen, expected_args=[
                        (['python'],), (['python2'],)], expected_kwargs=[
                            {'shell': True,}, {'shell': False}])
                with popen_swap:
                    function_that_invokes_popen()

        Args:
            obj: *. The Python object whose attribute you want to swap.
            attr: str. The name of the function to be swapped.
            new_value: function. The new function you want to use.
            expected_args: None|list(tuple). The expected args that you
                want this function to be invoked with. When its value is None,
                args will not be checked. If the value type is list, the
                function will check whether the called args is the first element
                in the list. If matched, this tuple will be removed from the
                list.
            expected_kwargs: None|list(dict). The expected keyword args
                you want this function to be invoked with. Similar to
                expected_args.
            called: bool. Whether the function is expected to be invoked. This
                will always be checked.

        Yields:
            context. The context with function replaced.
        """
        original = getattr(obj, attr)
        # The actual error message will also include detail assert error message
        # via the `self.longMessage` below.
        msg = 'Expected checks failed when swapping out in %s.%s tests.' % (
            obj.__name__, attr)

        def wrapper(*args, **kwargs):
            """Wrapper function for the new value. This function will do the
            check before the wrapped function is invoked. After the function
            finished, the wrapper will update how many times this function is
            invoked.

            Args:
                *args: list(*). The args passed into `attr` function.
                **kwargs: dict. The key word args passed into `attr` function.

            Returns:
                *. Result of `new_value`.
            """
            wrapper.called = True
            if expected_args is not None:
                self.assertEqual(args, expected_args[0], msg=msg)
                expected_args.pop(0)
            if expected_kwargs is not None:
                self.assertEqual(kwargs, expected_kwargs[0], msg=msg)
                expected_kwargs.pop(0)
            result = new_value(*args, **kwargs)
            return result

        wrapper.called = False
        setattr(obj, attr, wrapper)
        error_occurred = False
        try:
            # This will show the detailed assert message.
            self.longMessage = True
            yield
        except Exception:
            error_occurred = True
            # Raise issues thrown by the called function or assert error.
            raise
        finally:
            setattr(obj, attr, original)
            if not error_occurred:
                self.assertEqual(wrapper.called, called, msg=msg)
                self.assertFalse(expected_args, msg=msg)
                self.assertFalse(expected_kwargs, msg=msg)
            self.longMessage = False

    @contextlib.contextmanager
    def login_context(self, email, is_super_admin=False):
        """Log in with the given email under the context of a 'with' statement.

        Args:
            email: str. An email associated to a user account.
            is_super_admin: bool. Whether the user is a super admin.

        Yields:
            str. The id of the user associated to the given email, who is now
            'logged in'.
        """
        initial_user_env = {
            'USER_EMAIL': os.environ['USER_EMAIL'],
            'USER_ID': os.environ['USER_ID'],
            'USER_IS_ADMIN': os.environ['USER_IS_ADMIN']
        }
        self.login(email, is_super_admin=is_super_admin)
        try:
            yield self.get_user_id_from_email(email)
        finally:
            self.logout()
            os.environ.update(initial_user_env)

    def assertRaises(self, exc, fun, *args, **kwds):
        raise NotImplementedError(
            'self.assertRaises should not be used in these tests. Please use '
            'self.assertRaisesRegexp instead.')

    def assertRaisesRegexp(  # pylint: disable=keyword-arg-before-vararg
            self, expected_exception, expected_regexp, callable_obj=None,
            *args, **kwargs):
        if expected_regexp == '':
            raise Exception(
                'Please provide a sufficiently strong regexp string to '
                'validate that the correct error is being raised.')

        return super(TestBase, self).assertRaisesRegexp(
            expected_exception, expected_regexp,
            callable_obj=callable_obj, *args, **kwargs)


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
        self.testbed.init_images_stub()

        # The root path tells the testbed where to find the queue.yaml file.
        self.testbed.init_taskqueue_stub(root_path=os.getcwd())
        self.taskqueue_stub = self.testbed.get_stub(
            testbed.TASKQUEUE_SERVICE_NAME)

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

        Yields:
            None. Yields nothing.
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
        return len(self.get_pending_tasks(queue_name=queue_name))

    def get_pending_tasks(self, queue_name=None):
        """Returns the jobs in the given queue. If queue_name is None, defaults
        to returning the jobs in all available queues.
        """
        if queue_name is not None:
            return self.taskqueue_stub.get_filtered_tasks(
                queue_names=[queue_name])
        else:
            return self.taskqueue_stub.get_filtered_tasks()

    def _execute_tasks(self, tasks):
        """Execute queued tasks.

        Args:
            tasks: list(google.appengine.api.taskqueue.taskqueue.Task). The
                queued tasks.
        """
        for task in tasks:
            if task.url == '/_ah/queue/deferred':
                from google.appengine.ext import deferred
                deferred.run(task.payload)
            else:
                # All other tasks are expected to be mapreduce ones, or
                # Oppia-taskqueue-related ones.
                headers = {
                    key: python_utils.convert_to_bytes(
                        val) for key, val in task.headers.items()
                }
                headers['Content-Length'] = python_utils.convert_to_bytes(
                    len(task.payload or ''))

                app = (
                    webtest.TestApp(main_taskqueue.app)
                    if task.url.startswith('/task')
                    else self.testapp)
                response = app.post(
                    url=python_utils.UNICODE(
                        task.url), params=(task.payload or ''),
                    headers=headers, expect_errors=True)
                if response.status_code != 200:
                    raise RuntimeError(
                        'MapReduce task to URL %s failed' % task.url)

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
            self._execute_tasks(tasks)
            tasks = self.taskqueue_stub.get_filtered_tasks(
                queue_names=queue_names)
            for queue in queue_names:
                self.taskqueue_stub.FlushQueue(queue)

    def run_but_do_not_flush_pending_tasks(self):
        """"Runs but not flushes pending tasks."""
        queue_names = self._get_all_queue_names()

        tasks = self.taskqueue_stub.get_filtered_tasks(queue_names=queue_names)
        for queue in queue_names:
            self.taskqueue_stub.FlushQueue(queue)

        self._execute_tasks(tasks)

    def _create_valid_question_data(self, default_dest_state_name):
        """Creates a valid question_data dict.

        Args:
            default_dest_state_name: str. The default destination state.

        Returns:
            dict. The default question_data dict.
        """
        state = state_domain.State.create_default_state(
            default_dest_state_name, is_initial_state=True)
        state.update_interaction_id('TextInput')
        solution_dict = {
            'answer_is_exclusive': False,
            'correct_answer': 'Solution',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is a solution.</p>'
            }
        }
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>This is a hint.</p>')
            )
        ]
        solution = state_domain.Solution.from_dict(
            state.interaction.id, solution_dict)
        state.update_interaction_solution(solution)
        state.update_interaction_hints(hints_list)
        state.update_interaction_customization_args({
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder',
                    'unicode_str': 'Enter text here'
                }
            },
            'rows': {'value': 1}
        })
        state.update_next_content_id_index(2)
        state.interaction.default_outcome.labelled_as_correct = True
        state.interaction.default_outcome.dest = None
        return state


GenericTestBase = AppEngineTestBase


class LinterTestBase(GenericTestBase):
    """Base class for linter tests."""

    def setUp(self):
        super(LinterTestBase, self).setUp()
        self.linter_stdout = []

        def mock_print(*args):
            """Mock for python_utils.PRINT. Append the values to print to
            linter_stdout list.

            Args:
                *args: list(*). Variable length argument list of values to print
                    in the same line of output.
            """
            self.linter_stdout.append(
                ' '.join(python_utils.UNICODE(arg) for arg in args))

        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def assert_same_list_elements(self, phrases, stdout):
        """Checks to see if all of the phrases appear in at least one of the
        stdout outputs.

        Args:
            phrases: list(str). A list of phrases we are trying to find in
                one of the stdout outputs. For example, python linting
                outputs a success string that includes data we don't have easy
                access to, like how long the test took, so we may want to search
                for a substring of that success string in stdout.

            stdout: list(str). A list of the output results from the
                method's execution.
        """
        self.assertTrue(
            any(
                all(phrase in output for phrase in phrases) for
                output in stdout))

    def assert_failed_messages_count(self, stdout, expected_failed_count):
        """Assert number of expected failed checks to actual number of failed
        checks.

        Args:
            stdout: list(str). A list of linter output messages.

            expected_failed_count: int. Expected number of failed messages.
        """
        failed_count = sum(msg.startswith('FAILED') for msg in stdout)
        self.assertEqual(failed_count, expected_failed_count)


class EmailMessageMock(python_utils.OBJECT):
    """Mock for core.platform.models email services messages."""

    def __init__(
            self, sender_email, recipient_email, subject, plaintext_body,
            html_body, bcc=None, reply_to=None, recipient_variables=None):
        """Inits a mock email message with all the necessary data.

        Args:
            sender_email: str. The email address of the sender. This should be
                in the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or
                'SENDER_EMAIL_ADDRESS'. Must be utf-8.
            recipient_email: str. The email address of the recipient.
                Must be utf-8.
            subject: str. The subject line of the email, Must be utf-8.
            plaintext_body: str. The plaintext body of the email. Must be utf-8.
            html_body: str. The HTML body of the email. Must fit in a datastore
                entity. Must be utf-8.
            bcc: list(str)|None. Optional argument. List of bcc emails.
                Emails must be utf-8.
            reply_to: str|None. Optional argument. Reply address formatted like
                “reply+<reply_id>@<incoming_email_domain_name>
                reply_id is the unique id of the sender.
            recipient_variables: dict|None. Optional argument. If batch sending
                requires differentiating each email based on the recipient, we
                assign a unique id to each recipient, including info relevant to
                that recipient so that we can reference it when composing the
                email like so:
                    recipient_variables =
                        {"bob@example.com": {"first":"Bob", "id":1},
                        "alice@example.com": {"first":"Alice", "id":2}}
                    subject = 'Hey, %recipient.first%’
                More info about this format at:
                https://documentation.mailgun.com/en/
                    latest/user_manual.html#batch-sending.
        """
        self.sender = sender_email
        self.to = recipient_email
        self.subject = subject
        self.body = plaintext_body
        self.html = html_body
        self.bcc = bcc
        self.reply_to = reply_to
        self.recipient_variables = recipient_variables


class GenericEmailTestBase(GenericTestBase):
    """Base class for tests requiring email services."""

    emails_dict = collections.defaultdict(list)

    def run(self, result=None):
        """Adds a context swap on top of the test_utils.run() method so that
        test classes extending GenericEmailTestBase will automatically have
        a mailgun api key, mailgun domain name and mocked version of
        send_email_to_recipients().
        """
        with self.swap(
            email_services, 'send_email_to_recipients',
            self._send_email_to_recipients):
            super(EmailTestBase, self).run(result=result)

    def setUp(self):
        super(GenericEmailTestBase, self).setUp()
        self._wipe_emails_dict()

    def _wipe_emails_dict(self):
        """Reset email dictionary for a new test."""
        self.emails_dict = collections.defaultdict(list)

    def _send_email_to_recipients(
            self, sender_email, recipient_emails, subject, plaintext_body,
            html_body, bcc=None, reply_to=None, recipient_variables=None):
        """Mocks sending an email to each email in recipient_emails.

        Args:
            sender_email: str. The email address of the sender. This should be
                in the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or
                'SENDER_EMAIL_ADDRESS'. Must be utf-8.
            recipient_emails: list(str). The email addresses of the recipients.
                Must be utf-8.
            subject: str. The subject line of the email, Must be utf-8.
            plaintext_body: str. The plaintext body of the email. Must be utf-8.
            html_body: str. The HTML body of the email. Must fit in a datastore
                entity. Must be utf-8.
            bcc: list(str)|None. Optional argument. List of bcc emails.
                Must be utf-8.
            reply_to: str|None. Optional Argument. Reply address formatted like
                “reply+<reply_id>@<incoming_email_domain_name>
                reply_id is the unique id of the sender.
            recipient_variables: dict|None. Optional Argument.
                If batch sending requires differentiating each email based on
                the recipient, we assign a unique id to each recipient,
                including info relevant to that recipient so that we can
                reference it when composing the email like so:
                    recipient_variables =
                        {"bob@example.com": {"first":"Bob", "id":1},
                        "alice@example.com": {"first":"Alice", "id":2}}
                    subject = 'Hey, %recipient.first%’
                More info about this format at:
                https://documentation.mailgun.com/en/
                    latest/user_manual.html#batch-sending

        Returns:
            bool. Whether the emails are sent successfully.
        """
        bcc_emails = None

        if bcc:
            bcc_emails = bcc[0] if len(bcc) == 1 else bcc

        new_email = EmailMessageMock(
            sender_email, recipient_emails, subject, plaintext_body, html_body,
            bcc=bcc_emails, reply_to=(reply_to if reply_to else None),
            recipient_variables=(
                recipient_variables if (recipient_variables) else None))
        for recipient_email in recipient_emails:
            self.emails_dict[recipient_email].append(new_email)
        return True

    def _get_sent_email_messages(self, to):
        """Gets messages to a single recipient email.

        Args:
            to: str. The recipient email address.

        Returns:
            list(EmailMessageMock). The list of email messages corresponding to
            that recipient email.
        """
        return self.emails_dict[to] if to in self.emails_dict else []

    def _get_all_sent_email_messages(self):
        """Gets the entire messages dictionary.

        Returns:
            dict(str, (list(EmailMessageMock))). The dict keyed by recipient
            email. Each value contains a list of EmailMessageMock objects
            corresponding to that recipient email; in other words, all
            individual emails sent to that specific recipient email.
        """
        return self.emails_dict


EmailTestBase = GenericEmailTestBase


class FunctionWrapper(python_utils.OBJECT):
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
                'num_tries_before_success should either be an '
                'integer greater than or equal to 0, '
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
