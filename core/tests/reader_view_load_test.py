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

"""Performance test for the Oppia reader view.

Before running this script, exploration 0 should be loaded in the target
server.

Run this script from the Oppia root directory:

    python core/tests/reader_view_load_test.py --thread_count=5 --start_uid=1 \
    https://my-oppia-instance.appspot.com

"""

# Pylint has issues with import order of argparse.
#pylint: disable=wrong-import-order
import argparse
import cookielib
import json
import logging
import sys
import threading
import time
import urllib
import urllib2
#pylint: enable=wrong-import-order


XSSI_PREFIX = ')]}\'\n'


# command line arguments parser
PARSER = argparse.ArgumentParser()
PARSER.add_argument(
    'base_url', help=('Base URL of the Oppia installation to test'), type=str)
PARSER.add_argument(
    '--start_uid',
    help='Initial value for unique thread identifier.', default=1, type=int)
PARSER.add_argument(
    '--thread_count',
    help='Number of concurrent threads for executing the test.',
    default=1, type=int)
PARSER.add_argument(
    '--iteration_count',
    help='Number of iterations for executing the test. Each thread of each '
    'iteration acts as a unique user with the uid equal to:'
    'start_uid + thread_count * iteration_index.',
    default=1, type=int)


def assert_contains(needle, haystack):
    if needle not in haystack:
        raise Exception('Expected to find term: %s\n%s', needle, haystack)


def assert_equals(expected, actual):
    if expected != actual:
        raise Exception('Expected equality of %s and %s.', expected, actual)


class WebSession(object):
    """A class that allows navigation of web pages keeping cookie session."""

    PROGRESS_LOCK = threading.Lock()
    MAX_RETRIES = 3
    RETRY_SLEEP_SEC = 3

    GET_COUNT = 0
    POST_COUNT = 0
    RETRY_COUNT = 0
    PROGRESS_BATCH = 10
    RESPONSE_TIME_HISTOGRAM = [0, 0, 0, 0, 0, 0]

    def __init__(self, uid, common_headers=None):
        if common_headers is None:
            common_headers = {}
        self.uid = uid
        self.common_headers = common_headers
        self.cookie_jar = cookielib.CookieJar()
        self.opener = urllib2.build_opener(
            urllib2.HTTPCookieProcessor(self.cookie_jar))

    @classmethod
    def increment_duration_bucket(cls, index):
        cls.RESPONSE_TIME_HISTOGRAM[index] += 1

    @classmethod
    def update_duration(cls, duration):
        if duration > 30:
            cls.increment_duration_bucket(0)
        elif duration > 15:
            cls.increment_duration_bucket(1)
        elif duration > 7:
            cls.increment_duration_bucket(2)
        elif duration > 3:
            cls.increment_duration_bucket(3)
        elif duration > 1:
            cls.increment_duration_bucket(4)
        else:
            cls.increment_duration_bucket(5)

    @classmethod
    def log_progress(cls, force=False):
        update = ((cls.GET_COUNT + cls.POST_COUNT) % (
            cls.PROGRESS_BATCH) == 0)
        if update or force:
            logging.info(
                'GET/POST:[%s, %s], RETRIES:[%s], SLA:%s',
                cls.GET_COUNT, cls.POST_COUNT, cls.RETRY_COUNT,
                cls.RESPONSE_TIME_HISTOGRAM)

    def get_cookie_value(self, name):
        for cookie in self.cookie_jar:
            if cookie.name == name:
                return cookie.value
        return None

    def is_soft_error(self, http_error):
        """Checks if HTTPError is due to starvation of frontend instances."""
        body = http_error.fp.read()

        # this is the text specific to the front end instance starvation, which
        # is a retriable error for both GET and POST; normal HTTP error 500 has
        # this specific text '<h1>500 Internal Server Error</h1>'
        if http_error.code == 500 and '<h1>Error: Server Error</h1>' in body:
            return True

        logging.error(
            'Non-retriable HTTP %s error:\n%s', http_error.code, body)
        return False

    def open(self, request, hint):
        """Executes any HTTP request."""
        start_time = time.time()
        try:
            try_count = 0
            while True:
                try:
                    return self.opener.open(request)
                except urllib2.HTTPError as http_error:
                    if (try_count < WebSession.MAX_RETRIES and
                            self.is_soft_error(http_error)):
                        try_count += 1
                        with WebSession.PROGRESS_LOCK:
                            WebSession.RETRY_COUNT += 1
                        time.sleep(WebSession.RETRY_SLEEP_SEC)
                        continue
                    raise http_error
        except Exception as e:
            logging.info(
                'Error in session %s executing: %s', self.uid, hint)
            raise e
        finally:
            with WebSession.PROGRESS_LOCK:
                self.update_duration(time.time() - start_time)

    def get(self, url, expected_code=200):
        """HTTP GET."""
        with WebSession.PROGRESS_LOCK:
            WebSession.GET_COUNT += 1
            self.log_progress()

        request = urllib2.Request(url)
        for key, value in self.common_headers.items():
            request.add_header(key, value)
        response = self.open(request, 'GET %s' % url)
        assert_equals(expected_code, response.code)
        return response.read()

    def post(self, url, args_dict, expected_code=200):
        """HTTP POST."""
        with WebSession.PROGRESS_LOCK:
            WebSession.POST_COUNT += 1
            self.log_progress()

        data = urllib.urlencode(args_dict)
        request = urllib2.Request(url, data)
        response = self.open(request, 'POST %s' % url)
        assert_equals(expected_code, response.code)
        return response.read()


class TaskThread(threading.Thread):
    """Runs a task in a separate thread."""

    def __init__(self, func, name=None):
        super(TaskThread, self).__init__()
        self.func = func
        self.exception = None
        self.name = name

    @classmethod
    def start_all_tasks(cls, tasks):
        """Starts all tasks."""
        for task in tasks:
            task.start()

    @classmethod
    def check_all_tasks(cls, tasks):
        """Checks results of all tasks; fails on the first exception found."""
        failed_count = 0
        for task in tasks:
            while True:
                # Timeouts should happen after 30 seconds.
                task.join(30)
                if task.isAlive():
                    logging.info('Still waiting for: %s.', task.name)
                    continue
                else:
                    break
            if task.exception:
                failed_count += 1

        if failed_count:
            raise Exception('Tasks failed: %s', failed_count)

    @classmethod
    def execute_task_list(cls, tasks):
        """Starts all tasks and checks the results."""
        cls.start_all_tasks(tasks)
        cls.check_all_tasks(tasks)

    def run(self):
        try:
            self.func()
        except Exception as e:
            logging.error('Error in %s: %s', self.name, e)
            exc_info = sys.exc_info()
            raise exc_info[1], None, exc_info[2]


class ReaderViewLoadTest(object):
    """A reader view load test."""

    def __init__(self, base_url, uid):
        self.uid = uid
        self.host = base_url
        self.exp_id = None
        self.last_state_name = None
        self.last_params = None
        self.state_history = None

        self.session = WebSession(uid=uid)

    def run(self):
        self.init_player(
            '0', 'Welcome to Oppia!', 'do you know where the name \'Oppia\'')
        self.submit_and_compare(
            '0', 'In fact, the word Oppia means \'learn\'.')
        self.submit_and_compare('Finish', 'Check your spelling!')
        self.submit_and_compare(
            'Finnish', 'Yes! Oppia is the Finnish word for learn.')

    def _get(self, url):
        return self.session.get(url)

    def _get_json(self, url):
        """Get a JSON response, transformed to a Python object."""
        json_body = self.session.get(url)
        if not json_body.startswith(XSSI_PREFIX):
            raise Exception('Expected an XSSI prefix; found none.')
        return json.loads(json_body[len(XSSI_PREFIX):])

    def _post(self, url, data):
        return self.session.post(url, data)

    def _post_json(self, url, data):
        """Post a JSON request, returning the response as a Python object."""
        json_body = self.session.post(str(url), {'payload': json.dumps(data)})
        if not json_body.startswith(XSSI_PREFIX):
            raise Exception('Expected an XSSI prefix; found none.')
        return json.loads(json_body[len(XSSI_PREFIX):])

    def init_player(self, exploration_id, expected_title, expected_response):
        self.exp_id = exploration_id

        body = self._get('%s/explore/%s' % (self.host, self.exp_id))
        assert_contains('Learn', body)
        assert_contains('Return to Library', body)

        body = self._get_json(
            '%s/explorehandler/init/%s' % (self.host, self.exp_id))
        assert_equals(body['title'], expected_title)
        assert_contains(expected_response, body['init_html'])

        self.last_state_name = body['state_name']
        self.last_params = body['params']
        self.state_history = [self.last_state_name]

    def submit_and_compare(self, answer, expected_response):
        url = '%s/explorehandler/transition/%s/%s' % (
            self.host, self.exp_id, urllib.quote(self.last_state_name))
        body = self._post_json(url, {
            'answer': answer, 'params': self.last_params,
            'state_history': self.state_history,
        })

        assert_contains(expected_response, body['oppia_html'])

        self.last_state_name = body['state_name']
        self.last_params = body['params']
        self.state_history += [self.last_state_name]


def run_all(args):
    """Runs test scenario in multiple threads."""
    if args.thread_count < 1 or args.thread_count > 256:
        raise Exception('Please use between 1 and 256 threads.')
    if not args.base_url:
        raise Exception('Please specify a base URL to load-test against.')

    start_time = time.time()
    logging.info('Started testing: %s', args.base_url)
    logging.info('base_url: %s', args.base_url)
    logging.info('start_uid: %s', args.start_uid)
    logging.info('thread_count: %s', args.thread_count)
    logging.info('iteration_count: %s', args.iteration_count)
    logging.info('SLAs are [>30s, >15s, >7s, >3s, >1s, <1s]')
    try:
        for iteration_index in range(0, args.iteration_count):
            logging.info('Started iteration: %s', iteration_index)
            tasks = []
            WebSession.PROGRESS_BATCH = args.thread_count
            for index in range(0, args.thread_count):
                test = ReaderViewLoadTest(args.base_url, (
                    args.start_uid + iteration_index * args.thread_count +
                    index))
                task = TaskThread(
                    test.run, name='ReaderViewLoadTest-%s' % index)
                tasks.append(task)
            try:
                TaskThread.execute_task_list(tasks)
            except Exception as e:
                logging.info('Failed iteration: %s', iteration_index)
                raise e
    finally:
        WebSession.log_progress(force=True)
        logging.info('Done! Duration (s): %s', time.time() - start_time)


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run_all(PARSER.parse_args())
