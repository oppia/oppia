# Copyright 2012 Google Inc. All Rights Reserved.
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

import main
import os
import unittest
import webtest

from core.domain import exp_services
from core.domain import stats_services

import feconf


def empty_environ():
    os.environ['AUTH_DOMAIN'] = 'example.com'
    os.environ['SERVER_NAME'] = 'localhost'
    os.environ['HTTP_HOST'] = 'localhost'
    os.environ['SERVER_PORT'] = '8080'
    os.environ['USER_EMAIL'] = ''
    os.environ['USER_ID'] = ''
    os.environ['USER_IS_ADMIN'] = '0'


class TestTags(object):
    """Tags for labelling particular tests."""

    # Tag that is used to flag tests which take a long time to run, so that
    # they can be excluded via a command-line argument.
    SLOW_TEST = 1


class TestBase(unittest.TestCase):
    """Base class for all tests."""

    maxDiff = 2500

    TAGS = []

    def setUp(self):
        self.testapp = webtest.TestApp(main.app)

    def tearDown(self):  # pylint: disable-msg=g-bad-name
        exp_services.delete_all_explorations()
        stats_services.delete_all_stats()

    def shortDescription(self):
        """Additional information logged during unit test invocation."""
        # Suppress default logging of docstrings.
        return None


class AppEngineTestBase(TestBase):
    """Base class for tests requiring App Engine services."""

    def login(self, email, is_admin=False):
        os.environ['USER_EMAIL'] = email
        os.environ['USER_ID'] = email
        os.environ['USER_IS_ADMIN'] = '1' if is_admin else '0'

    def logout(self):
        os.environ['USER_EMAIL'] = ''
        os.environ['USER_ID'] = ''
        del os.environ['USER_IS_ADMIN']

    def setUp(self):  # pylint: disable-msg=g-bad-name
        empty_environ()

        from google.appengine.datastore import datastore_stub_util
        from google.appengine.ext import testbed

        # Set up an app to be tested.
        self.testapp = webtest.TestApp(main.app)
        self.testbed = testbed.Testbed()
        self.testbed.activate()

        # Configure datastore policy to emulate instantaneously and globally
        # consistent HRD; we also patch dev_appserver in main.py to run under
        # the same policy.
        policy = datastore_stub_util.PseudoRandomHRConsistencyPolicy(
            probability=1)

        # Declare any relevant App Engine service stubs here.
        self.testbed.init_user_stub()
        self.testbed.init_memcache_stub()
        self.testbed.init_datastore_v3_stub(consistency_policy=policy)
        self.testbed.init_taskqueue_stub()
        self.taskq = self.testbed.get_stub(testbed.TASKQUEUE_SERVICE_NAME)

    def tearDown(self):  # pylint: disable-msg=g-bad-name
        os.environ['USER_IS_ADMIN'] = '0'
        self.testbed.deactivate()

if feconf.PLATFORM == 'gae':
    GenericTestBase = AppEngineTestBase
else:
    GenericTestBase = TestBase
