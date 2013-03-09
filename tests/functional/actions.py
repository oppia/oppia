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

"""Common actions used in Oppia functional tests."""

import feconf
import main
import suite

import logging
import os


class ShouldHaveFailedByNow(Exception):
    """Special exception raised when a prior method did not raise."""
    pass


class TestBase(suite.AppEngineTestBase):
    """Contains methods common to all tests."""
    def getApp(self):
        feconf.DEBUG = True
        return main.app

    def setUp(self):  # pylint: disable-msg=g-bad-name
        super(TestBase, self).setUp()

    def tearDown(self):  # pylint: disable-msg=g-bad-name
        super(TestBase, self).tearDown()

    def get(self, url):
        logging.info('HTTP Get: %s', url)
        return self.testapp.get(url)

    def post(self, url, params):
        logging.info('HTTP Post: %s', url)
        return self.testapp.post(url, params)

    def put(self, url, params):
        logging.info('HTTP Put: %s', url)
        return self.testapp.put(url, params)

    def delete(self, url, params):
        logging.info('HTTP Delete: %s', url)
        return self.testapp.delete(url, params)

    def click(self, response, name):
        logging.info('Link click: %s', name)
        return response.click(name)

    def submit(self, form):
        logging.info('Form submit: %s', form)
        return form.submit()


def assert_equals(expected, actual):
    if not expected == actual:
        raise Exception('Expected \'%s\', does not match actual \'%s\'.' %
                        (expected, actual))


def to_unicode(text):
    """Converts text to Unicode if is not Unicode already."""
    if not isinstance(text, unicode):
        return unicode(text, 'utf-8')
    return text


def assert_contains(needle, haystack):
    if not to_unicode(needle) in to_unicode(haystack):
        raise Exception('Can\'t find \'%s\' in \'%s\'.' % (needle, haystack))


def assert_contains_all_of(needles, haystack):
    for needle in needles:
        if not to_unicode(needle) in to_unicode(haystack):
            raise Exception(
                'Can\'t find \'%s\' in \'%s\'.' % (needle, haystack))


def assert_does_not_contain(needle, haystack):
    if to_unicode(needle) in to_unicode(haystack):
        raise Exception('Found \'%s\' in \'%s\'.' % (needle, haystack))


def assert_contains_none_of(needles, haystack):
    for needle in needles:
        if to_unicode(needle) in to_unicode(haystack):
            raise Exception('Found \'%s\' in \'%s\'.' % (needle, haystack))


def assert_none_fail(browser, callbacks):
    """Invokes all callbacks and expects each one not to fail."""
    for callback in callbacks:
        callback(browser)


def assert_all_fail(browser, callbacks):
    """Invokes all callbacks and expects each one to fail."""

    for callback in callbacks:
        try:
            callback(browser)
            raise ShouldHaveFailedByNow(
                'Expected to fail: %s().' % callback.__name__)
        except ShouldHaveFailedByNow as e:
            raise e
        except Exception:
            pass


def login(email, is_admin=False):
    os.environ['USER_EMAIL'] = email
    os.environ['USER_ID'] = 'user1'

    is_admin_value = '0'
    if is_admin:
        is_admin_value = '1'
    os.environ['USER_IS_ADMIN'] = is_admin_value


def get_current_user_email():
    email = os.environ['USER_EMAIL']
    if not email:
        raise Exception('No current user.')
    return email


def logout():
    del os.environ['USER_EMAIL']
    del os.environ['USER_ID']
    del os.environ['USER_IS_ADMIN']


def view_index(browser):
    response = browser.get('/')
    assert_contains('you can create', response.body)
    return response
