# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/flake_checker.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import os

from core.tests import test_utils
import python_utils

from scripts import flake_checker

import requests


class CheckIfOnCITests(test_utils.GenericTestBase):

    def test_returns_true_when_on_ci(self):

        def mock_getenv(variable):
            return variable == 'CIRCLECI'

        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[
                ('GITHUB_ACTIONS',),
                ('CIRCLECI',),
            ])

        with getenv_swap:
            on_ci = flake_checker.check_if_on_ci()
        self.assertTrue(on_ci)

    def test_returns_false_when_off_ci(self):

        def mock_getenv(unused_variable):
            return False

        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[
                ('GITHUB_ACTIONS',),
                ('CIRCLECI',),
            ])

        with getenv_swap:
            on_ci = flake_checker.check_if_on_ci()
        self.assertFalse(on_ci)


class MockDatetime(python_utils.OBJECT):

    def __init__(self, date):
        self.date = date

    def utcnow(self):
        """Get datetime.datetime object."""
        return self.date


class ReportPassTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ReportPassTests, self).setUp()
        self.example_date = datetime.datetime(2020, 1, 1, 0, 0, 0, 1)

    def test_successful_report(self):

        def mock_getenv(variable):
            environment_vars = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
            }
            return environment_vars.get(variable)

        def mock_post(url, json, allow_redirects, headers):  # pylint: disable=unused-argument
            pass

        expected_payload = {
            'suite': 'suiteName',
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
            }
        }

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        datetime_swap = self.swap(
            datetime, 'datetime', MockDatetime(self.example_date))
        post_swap = self.swap_with_checks(
            requests, 'post', mock_post, expected_args=[
                (flake_checker.PASS_REPORT_URL,)],
            expected_kwargs=[{
                'json': expected_payload,
                'allow_redirects': False,
                'headers': {
                    'report_key': flake_checker.REPORT_API_KEY
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flake_checker.report_pass('suiteName')

    def test_successful_report_construct_url(self):

        def mock_getenv(variable):
            environment_vars = {
                'GITHUB_ACTIONS': 1,
                'GITHUB_ACTOR': 'user',
                'GITHUB_RUN_ID': 1234,
            }
            return environment_vars.get(variable)

        def mock_post(url, json, allow_redirects, headers):  # pylint: disable=unused-argument
            pass

        expected_payload = {
            'suite': 'suiteName',
            'metadata': {
                'username': 'user',
                'build_url': 'https://github.com/oppia/oppia/actions/runs/1234',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
            }
        }

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        datetime_swap = self.swap(
            datetime, 'datetime', MockDatetime(self.example_date))
        post_swap = self.swap_with_checks(
            requests, 'post', mock_post, expected_args=[
                (flake_checker.PASS_REPORT_URL,)],
            expected_kwargs=[{
                'json': expected_payload,
                'allow_redirects': False,
                'headers': {
                    'report_key': flake_checker.REPORT_API_KEY
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flake_checker.report_pass('suiteName')

    def test_unsuccessful_report(self):

        def mock_getenv(variable):
            environment_vars = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
            }
            return environment_vars.get(variable)

        def mock_post(url, json, allow_redirects, headers):  # pylint: disable=unused-argument
            raise requests.HTTPError()

        expected_payload = {
            'suite': 'suiteName',
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
            },
        }

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        datetime_swap = self.swap(
            datetime, 'datetime', MockDatetime(self.example_date))
        post_swap = self.swap_with_checks(
            requests, 'post', mock_post, expected_args=[
                (flake_checker.PASS_REPORT_URL,)],
            expected_kwargs=[{
                'json': expected_payload,
                'allow_redirects': False,
                'headers': {
                    'report_key': flake_checker.REPORT_API_KEY,
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flake_checker.report_pass('suiteName')

    def test_unknown_build_environment(self):

        def mock_getenv(variable):
            environment_vars = dict()
            return environment_vars.get(variable)

        def mock_post(url, json, allow_redirects, headers):  # pylint: disable=unused-argument
            raise AssertionError('requests.post called.')

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        post_swap = self.swap(requests, 'post', mock_post)

        with getenv_swap, post_swap:
            with self.assertRaisesRegexp(
                Exception, 'Unknown build environment.'):
                flake_checker.report_pass('suiteName')


class MockResponse(python_utils.OBJECT):

    def __init__(
            self, ok=True, json=None, status_code=200, reason='foo'):
        if json is None:
            json = dict()
        self.ok = ok
        self.json_dict = json
        self.status_code = status_code
        self.reason = reason

    def json(self):
        """Get json dict or raise ValueError if json_dict not a dict."""
        if not isinstance(self.json_dict, dict):
            raise ValueError('Payload not JSON.')
        return self.json_dict


class IsTestOutputFlakyTests(test_utils.GenericTestBase):

    def setUp(self):
        super(IsTestOutputFlakyTests, self).setUp()
        self.example_date = datetime.datetime(2020, 1, 1, 0, 0, 0, 1)

    def test_successful_report(self):

        def mock_getenv(variable):
            environment_vars = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
            }
            return environment_vars.get(variable)

        def mock_post(url, json, allow_redirects, headers):  # pylint: disable=unused-argument
            response = {
                'log': ['log1', 'log2'],
                'result': True,
                'flake': {
                    'suite': 'suiteName',
                    'test': 'testName',
                    'flake_id': 'flake',
                },
            }
            return MockResponse(True, response)

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': ['line1', 'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
            }
        }

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        datetime_swap = self.swap(
            datetime, 'datetime', MockDatetime(self.example_date))
        post_swap = self.swap_with_checks(
            requests, 'post', mock_post, expected_args=[
                (flake_checker.FLAKE_CHECK_AND_REPORT_URL,)],
            expected_kwargs=[{
                'json': expected_payload,
                'allow_redirects': False,
                'headers': {
                    'report_key': flake_checker.REPORT_API_KEY
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flaky = flake_checker.is_test_output_flaky(
                ['line1', 'line2'], 'suiteName')
            self.assertTrue(flaky)

    def test_successful_report_construct_url(self):

        def mock_getenv(variable):
            environment_vars = {
                'GITHUB_ACTIONS': 1,
                'GITHUB_ACTOR': 'user',
                'GITHUB_RUN_ID': 1234,
            }
            return environment_vars.get(variable)

        def mock_post(url, json, allow_redirects, headers):  # pylint: disable=unused-argument
            response = {
                'log': ['log1', 'log2'],
                'result': True,
                'flake': {
                    'suite': 'suiteName',
                    'test': 'testName',
                    'flake_id': 'flake',
                },
            }
            return MockResponse(True, response)

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': ['line1', 'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://github.com/oppia/oppia/actions/runs/1234',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
            }
        }

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        datetime_swap = self.swap(
            datetime, 'datetime', MockDatetime(self.example_date))
        post_swap = self.swap_with_checks(
            requests, 'post', mock_post, expected_args=[
                (flake_checker.FLAKE_CHECK_AND_REPORT_URL,)],
            expected_kwargs=[{
                'json': expected_payload,
                'allow_redirects': False,
                'headers': {
                    'report_key': flake_checker.REPORT_API_KEY
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flaky = flake_checker.is_test_output_flaky(
                ['line1', 'line2'], 'suiteName')
            self.assertTrue(flaky)

    def test_unsuccessful_report_exception(self):

        def mock_getenv(variable):
            environment_vars = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
            }
            return environment_vars.get(variable)

        def mock_post(url, json, allow_redirects, headers):  # pylint: disable=unused-argument
            raise requests.HTTPError()

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': ['line1', 'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
            },
        }

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        datetime_swap = self.swap(
            datetime, 'datetime', MockDatetime(self.example_date))
        post_swap = self.swap_with_checks(
            requests, 'post', mock_post, expected_args=[
                (flake_checker.FLAKE_CHECK_AND_REPORT_URL,)],
            expected_kwargs=[{
                'json': expected_payload,
                'allow_redirects': False,
                'headers': {
                    'report_key': flake_checker.REPORT_API_KEY,
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flaky = flake_checker.is_test_output_flaky(
                ['line1', 'line2'], 'suiteName')
            self.assertFalse(flaky)

    def test_unsuccessful_report_not_ok(self):

        def mock_getenv(variable):
            environment_vars = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
            }
            return environment_vars.get(variable)

        def mock_post(url, json, allow_redirects, headers):  # pylint: disable=unused-argument
            return MockResponse(False, None)

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': ['line1', 'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
            },
        }

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        datetime_swap = self.swap(
            datetime, 'datetime', MockDatetime(self.example_date))
        post_swap = self.swap_with_checks(
            requests, 'post', mock_post, expected_args=[
                (flake_checker.FLAKE_CHECK_AND_REPORT_URL,)],
            expected_kwargs=[{
                'json': expected_payload,
                'allow_redirects': False,
                'headers': {
                    'report_key': flake_checker.REPORT_API_KEY,
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flaky = flake_checker.is_test_output_flaky(
                ['line1', 'line2'], 'suiteName')
            self.assertFalse(flaky)

    def test_unsuccessful_report_bad_payload(self):

        def mock_getenv(variable):
            environment_vars = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
            }
            return environment_vars.get(variable)

        def mock_post(url, json, allow_redirects, headers):  # pylint: disable=unused-argument
            return MockResponse(True, 'not json')

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': ['line1', 'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
            },
        }

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        datetime_swap = self.swap(
            datetime, 'datetime', MockDatetime(self.example_date))
        post_swap = self.swap_with_checks(
            requests, 'post', mock_post, expected_args=[
                (flake_checker.FLAKE_CHECK_AND_REPORT_URL,)],
            expected_kwargs=[{
                'json': expected_payload,
                'allow_redirects': False,
                'headers': {
                    'report_key': flake_checker.REPORT_API_KEY,
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flaky = flake_checker.is_test_output_flaky(
                ['line1', 'line2'], 'suiteName')
            self.assertFalse(flaky)
