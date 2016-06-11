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

import webtest

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rule_domain
from core.domain import rights_manager
from core.platform import models
import feconf
import jinja_utils
import main
import utils

from google.appengine.api import apiproxy_stub
from google.appengine.api import apiproxy_stub_map

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
current_user_services = models.Registry.import_current_user_services()

CSRF_REGEX = (
    r'csrf_token: JSON\.parse\(\'\\\"([A-Za-z0-9/=_-]+)\\\"\'\)')
CSRF_I18N_REGEX = (
    r'csrf_token_i18n: JSON\.parse\(\'\\\"([A-Za-z0-9/=_-]+)\\\"\'\)')
CSRF_CREATE_EXPLORATION_REGEX = (
    r'csrf_token_create_exploration: JSON\.parse\(\'\\\"([A-Za-z0-9/=_-]+)\\\"\'\)') # pylint: disable=line-too-long
# Prefix to append to all lines printed by tests to the console.
LOG_LINE_PREFIX = 'LOG_INFO_TEST: '


def empty_environ():
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
    """Mock for google.appengine.api.urlfetch"""

    def __init__(self, service_name='urlfetch'):
        super(URLFetchServiceMock, self).__init__(service_name)
        self.return_values = {}
        self.response = None
        self.request = None

    def set_return_values(self, content='', status_code=200, headers=None):
        self.return_values['content'] = content
        self.return_values['status_code'] = status_code
        self.return_values['headers'] = headers

    def _Dynamic_Fetch(self, request, response): # pylint: disable=invalid-name
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
            }
        }
    }

    def _get_unicode_test_string(self, suffix):
        return '%s%s' % (self.UNICODE_TEST_STRING, suffix)

    def setUp(self):
        raise NotImplementedError

    def tearDown(self):
        raise NotImplementedError

    def assertFuzzyTrue(self, value):  # pylint: disable=invalid-name
        self.assertEqual(value, rule_domain.CERTAIN_TRUE_VALUE)
        self.assertTrue(isinstance(value, float))

    def assertFuzzyFalse(self, value):  # pylint: disable=invalid-name
        self.assertEqual(value, rule_domain.CERTAIN_FALSE_VALUE)
        self.assertTrue(isinstance(value, float))

    def _assert_validation_error(self, item, error_substring):
        """Checks that the given item passes default validation."""
        with self.assertRaisesRegexp(utils.ValidationError, error_substring):
            item.validate()

    def signup_superadmin_user(self):
        """Signs up a superadmin user. Should be called at the end of setUp().
        """
        self.signup('tmpsuperadmin@example.com', 'tmpsuperadm1n')

    def log_line(self, line):
        """Print the line with a prefix that can be identified by the
        script that calls the test.
        """
        print '%s%s' % (LOG_LINE_PREFIX, line)

    def _delete_all_models(self):
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
        os.environ['USER_EMAIL'] = email
        os.environ['USER_ID'] = self.get_user_id_from_email(email)
        os.environ['USER_IS_ADMIN'] = '1' if is_super_admin else '0'

    def logout(self):
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
            json_response.content_type, 'application/javascript')
        self.assertTrue(json_response.body.startswith(feconf.XSSI_PREFIX))

        return json.loads(json_response.body[len(feconf.XSSI_PREFIX):])

    def get_json(self, url, params=None):
        """Get a JSON response, transformed to a Python object. This method
        does not support calling testapp.get() with errors expected in response
        because testapp.get() in that case does not return a JSON object."""
        json_response = self.testapp.get(url, params)
        self.assertEqual(json_response.status_int, 200)
        return self._parse_json_response(json_response, expect_errors=False)

    def post_json(self, url, payload, csrf_token=None, expect_errors=False,
                  expected_status_int=200, upload_files=None):
        """Post an object to the server by JSON; return the received object."""
        data = {'payload': json.dumps(payload)}
        if csrf_token:
            data['csrf_token'] = csrf_token

        json_response = self.testapp.post(
            str(url), data, expect_errors=expect_errors,
            upload_files=upload_files)

        self.assertEqual(json_response.status_int, expected_status_int)
        return self._parse_json_response(
            json_response, expect_errors=expect_errors)

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

    def get_csrf_token_from_response(self, response, token_type=None):
        """Retrieve the CSRF token from a GET response."""
        if token_type is None:
            regex = CSRF_REGEX
        elif token_type == feconf.CSRF_PAGE_NAME_CREATE_EXPLORATION:
            regex = CSRF_CREATE_EXPLORATION_REGEX
        elif token_type == feconf.CSRF_PAGE_NAME_I18N:
            regex = CSRF_I18N_REGEX
        else:
            raise Exception('Invalid CSRF token type: %s' % token_type)

        return re.search(regex, response.body).group(1)

    def signup(self, email, username):
        """Complete the signup process for the user with the given username."""
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

    def set_admins(self, admin_usernames):
        """Set the ADMIN_USERNAMES property."""
        self.set_config_property(
            config_domain.ADMIN_USERNAMES, admin_usernames)

    def set_moderators(self, moderator_usernames):
        """Set the MODERATOR_USERNAMES property."""
        self.set_config_property(
            config_domain.MODERATOR_USERNAMES, moderator_usernames)

    def get_current_logged_in_user_id(self):
        return os.environ['USER_ID']

    def get_user_id_from_email(self, email):
        return current_user_services.get_user_id_from_email(email)

    def save_new_default_exploration(
            self, exploration_id, owner_id, title='A title'):
        """Saves a new default exploration written by owner_id.

        Returns the exploration domain object.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, title=title, category='A category')
        exp_services.save_new_exploration(owner_id, exploration)
        return exploration

    def save_new_valid_exploration(
            self, exploration_id, owner_id, title='A title',
            category='A category', objective='An objective',
            language_code=feconf.DEFAULT_LANGUAGE_CODE,
            end_state_name=None):
        """Saves a new strictly-validated exploration.

        Returns the exploration domain object.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, title=title, category=category,
            language_code=language_code)
        exploration.states[exploration.init_state_name].update_interaction_id(
            'TextInput')
        exploration.objective = objective

        # If an end state name is provided, add terminal node with that name
        if end_state_name is not None:
            exploration.add_states([end_state_name])
            end_state = exploration.states[end_state_name]
            end_state.update_interaction_id('EndExploration')
            end_state.interaction.default_outcome = None

            # Link first state to ending state (to maintain validity)
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
            skin_customizations={'panels_contents': {}},
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

    def save_new_default_collection(
            self, collection_id, owner_id, title='A title',
            category='A category', objective='An objective',
            language_code=feconf.DEFAULT_LANGUAGE_CODE):
        """Saves a new default collection written by owner_id.

        Returns the collection domain object.
        """
        collection = collection_domain.Collection.create_default_collection(
            collection_id, title=title, category=category, objective=objective,
            language_code=language_code)
        collection_services.save_new_collection(owner_id, collection)
        return collection

    def save_new_valid_collection(
            self, collection_id, owner_id, title='A title',
            category='A category', objective='An objective',
            language_code=feconf.DEFAULT_LANGUAGE_CODE,
            exploration_id='an_exploration_id',
            end_state_name=DEFAULT_END_STATE_NAME):
        collection = collection_domain.Collection.create_default_collection(
            collection_id, title, category, objective,
            language_code=language_code)
        collection.add_node(
            self.save_new_valid_exploration(
                exploration_id, owner_id, title, category, objective,
                end_state_name=end_state_name).id)

        collection_services.save_new_collection(owner_id, collection)
        return collection

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

    def submit_answer(
            self, exploration_id, state_name, answer,
            params=None, unused_exploration_version=None):
        """Submits an answer as an exploration player and returns the
        corresponding dict. This function has strong parallels to code in
        PlayerServices.js which has the non-test code to perform the same
        functionality. This is replicated here so backend tests may utilize the
        functionality of PlayerServices.js without being able to access it.

        TODO(bhenning): Replicate this in an end-to-end Protractor test to
        protect against code skew here.
        """
        if params is None:
            params = {}

        exploration = exp_services.get_exploration_by_id(exploration_id)

        # First, the answer must be classified.
        classify_result = self.post_json(
            '/explorehandler/classify/%s' % exploration_id, {
                'old_state': exploration.states[state_name].to_dict(),
                'params': params,
                'answer': answer
            }
        )

        # Next, ensure the submission is recorded.
        self.post_json(
            '/explorehandler/answer_submitted_event/%s' % exploration_id, {
                'answer': answer,
                'params': params,
                'version': exploration.version,
                'old_state_name': state_name,
                'answer_group_index': classify_result['answer_group_index'],
                'rule_spec_index': classify_result['rule_spec_index']
            }
        )

        # Now the next state's data must be calculated.
        outcome = classify_result['outcome']
        new_state = exploration.states[outcome['dest']]
        params['answer'] = answer
        new_params = self.get_updated_param_dict(
            params, new_state.param_changes, exploration.param_specs)

        return {
            'feedback_html': jinja_utils.parse_string(
                utils.get_random_choice(outcome['feedback'])
                if outcome['feedback'] else '', params),
            'question_html': new_state.content[0].to_html(new_params),
            'state_name': outcome['dest']
        }

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
        return [q['name'] for q in self.taskqueue_stub.GetQueues()]

    @contextlib.contextmanager
    def urlfetch_mock(
            self, content='', status_code=200, headers=None):
        """Enables the custom urlfetch mock (URLFetchServiceMock) within the
        context of a 'with' statement.

        This mock is currently used for signup to prevent external HTTP
        requests to fetch the Gravatar profile picture for new users while the
        backend tests are being run.

        args:
          - content: Response content or body.
          - status_code: Response status code.
          - headers: Response headers.
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
            # Disables the custom mock
            self.testbed.init_urlfetch_stub(enable=False)
            # Enables the testbed urlfetch mock
            self.testbed.init_urlfetch_stub()

    def count_jobs_in_taskqueue(self, queue_name=None):
        """Counts the jobs in the given queue. If queue_name is None,
        defaults to counting the jobs in all queues available.
        """
        if queue_name:
            return len(self.taskqueue_stub.get_filtered_tasks(
                queue_names=[queue_name]))
        else:
            return len(self.taskqueue_stub.get_filtered_tasks())

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
                    # All other tasks are expected to be mapreduce ones.
                    headers = {
                        key: str(val) for key, val in task.headers.iteritems()
                    }
                    headers['Content-Length'] = str(len(task.payload or ''))
                    response = self.testapp.post(
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

        args:
          - func: a callable, or data descriptor. If it's a descriptor, its
            __get__ should return a bound method. For example, func can be a
            function, a method, a static or class method, but not a @property.
        """
        self._func = func
        self._instance = None

    def __call__(self, *args, **kwargs):
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
        pass

    def post_call_hook(self, args, result):
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
        return self._times_called

    def pre_call_hook(self, args):
        self._times_called += 1


class FailingFunction(FunctionWrapper):
    """A function wrapper that makes a function fail, raising a given
    exception. It can be set to succeed after a given number of calls.
    """

    INFINITY = 'infinity'

    def __init__(self, f, exception, num_tries_before_success):
        """Create a new Failing function.

        args:
          - f: see FunctionWrapper.
          - exception: the exception to be raised.
          - num_tries_before_success: the number of times to raise an
            exception, before a call succeeds. If this is 0, all calls will
            succeed, if it is FailingFunction.INFINITY, all calls will fail.
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
        self._times_called += 1
        call_should_fail = (
            self._num_tries_before_success >= self._times_called)
        if call_should_fail or self._always_fail:
            raise self._exception
