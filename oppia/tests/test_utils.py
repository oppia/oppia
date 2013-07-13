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


def empty_environ():
    os.environ['AUTH_DOMAIN'] = 'example.com'
    os.environ['SERVER_NAME'] = 'localhost'
    os.environ['HTTP_HOST'] = 'localhost'
    os.environ['SERVER_PORT'] = '8080'
    os.environ['USER_EMAIL'] = ''
    os.environ['USER_ID'] = ''


class TestBase(unittest.TestCase):
    """Base class for all tests."""

    def assertSubstring(self, needle, haystack, strict=True):
        """Tests whether 'needle' is a substring of 'haystack'.

        If strict is False, then all whitespace is stripped from both strings
        strings before the comparison.
        """
        if not strict:
            needle = ''.join(needle.split())
            haystack = ''.join(haystack.split())

        assert needle in haystack

    def shortDescription(self):
        """Additional information logged during unit test invocation."""
        # Suppress default logging of docstrings.
        return None


class AppEngineTestBase(TestBase):
    """Base class for tests requiring App Engine services."""

    def setUp(self):  # pylint: disable-msg=g-bad-name
        empty_environ()

        from google.appengine.datastore import datastore_stub_util
        from google.appengine.ext import testbed
        # setup an app to be tested

        self.testapp = webtest.TestApp(main.app)
        self.testbed = testbed.Testbed()
        self.testbed.activate()

        # configure datastore policy to emulate instantaneously and globally
        # consistent HRD; we also patch dev_appserver in main.py to run under
        # the same policy
        policy = datastore_stub_util.PseudoRandomHRConsistencyPolicy(
            probability=1)

        # declare any relevant App Engine service stubs here
        self.testbed.init_user_stub()
        self.testbed.init_memcache_stub()
        self.testbed.init_datastore_v3_stub(consistency_policy=policy)
        self.testbed.init_taskqueue_stub()
        self.taskq = self.testbed.get_stub(testbed.TASKQUEUE_SERVICE_NAME)

    def tearDown(self):  # pylint: disable-msg=g-bad-name
        self.testbed.deactivate()
