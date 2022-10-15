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

from __future__ import annotations

import datetime
import os

from core.tests import test_utils
from scripts import flake_checker

import requests

from typing import Dict, Optional, Union
from typing_extensions import TypedDict


class FlakeReportDictWithoutLog(TypedDict):
    """Dictionary representation of flake's report without log."""

    result: bool
    flake: Dict[str, str]
    rerun: str


AllowedMockJsonTypes = Union[
    flake_checker.FlakeReportDict,
    FlakeReportDictWithoutLog, Dict[str, str], str, None
]


class CheckIfOnCITests(test_utils.GenericTestBase):

    def test_returns_true_when_on_ci(self) -> None:

        def mock_getenv(variable: str) -> bool:
            return variable == 'CIRCLECI'

        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[
                ('GITHUB_ACTIONS',),
                ('CIRCLECI',),
            ])

        with getenv_swap:
            on_ci = flake_checker.check_if_on_ci()
        self.assertTrue(on_ci)

    def test_returns_false_when_off_ci(self) -> None:

        def mock_getenv(unused_variable: str) -> bool:
            return False

        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[
                ('GITHUB_ACTIONS',),
                ('CIRCLECI',),
            ])

        with getenv_swap:
            on_ci = flake_checker.check_if_on_ci()
        self.assertFalse(on_ci)


class MockDatetime:

    def __init__(self, date: datetime.datetime) -> None:
        self.date = date

    def utcnow(self) -> datetime.datetime:
        """Get datetime.datetime object."""
        return self.date


class ReportPassTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.example_date = datetime.datetime(2020, 1, 1, 0, 0, 0, 1)

    def test_successful_report(self) -> None:

        def mock_getenv(variable: str) -> Optional[Union[str, int]]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            url: str,  # pylint: disable=unused-argument
            json: Dict[str, str],  # pylint: disable=unused-argument
            allow_redirects: bool,  # pylint: disable=unused-argument
            headers: Dict[str, str]  # pylint: disable=unused-argument
        ) -> None:
            pass

        expected_payload = {
            'suite': 'suiteName',
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
                'branch': 'develop',
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

    def test_successful_report_construct_url(self) -> None:

        def mock_getenv(variable: str) -> Optional[Union[str, int]]:
            environment_vars: Dict[str, Union[str, int]] = {
                'GITHUB_ACTIONS': 1,
                'GITHUB_ACTOR': 'user',
                'GITHUB_RUN_ID': 1234,
                'GITHUB_REF': 'develop',
                'GITHUB_REPOSITORY': 'foo/oppia',
            }
            return environment_vars.get(variable)

        def mock_post(
            url: str,  # pylint: disable=unused-argument
            json: Dict[str, str],  # pylint: disable=unused-argument
            allow_redirects: bool,  # pylint: disable=unused-argument
            headers: Dict[str, str]  # pylint: disable=unused-argument
        ) -> None:
            pass

        expected_payload = {
            'suite': 'suiteName',
            'metadata': {
                'username': 'user',
                'build_url': 'https://github.com/foo/oppia/actions/runs/1234',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
                'branch': 'develop',
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

    def test_unsuccessful_report(self) -> None:

        def mock_getenv(variable: str) -> Optional[Union[str, int]]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            url: str,
            json: Dict[str, str],
            allow_redirects: bool,
            headers: Dict[str, str]
        ) -> None:
            raise requests.HTTPError()

        expected_payload = {
            'suite': 'suiteName',
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
                'branch': 'develop',
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

    def test_unknown_build_environment(self) -> None:

        def mock_getenv(unused_variable: str) -> None:
            return None

        def mock_post(
            url: str,
            json: Dict[str, str],
            allow_redirects: bool,
            headers: Dict[str, str]
        ) -> None:
            raise AssertionError('requests.post called.')

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        post_swap = self.swap(requests, 'post', mock_post)

        with getenv_swap, post_swap:
            with self.assertRaisesRegex(
                Exception, 'Unknown build environment.'):
                flake_checker.report_pass('suiteName')

    def test_missing_environment_variable(self) -> None:

        def mock_getenv(variable: str) -> Optional[Union[str, int]]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            url: str,
            json: Dict[str, str],
            allow_redirects: bool,
            headers: Dict[str, str]
        ) -> None:
            raise AssertionError('requests.post called.')

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        post_swap = self.swap(requests, 'post', mock_post)

        with getenv_swap, post_swap:
            with self.assertRaisesRegex(
                RuntimeError,
                'Expected environment variable CIRCLE_BUILD_URL missing'):
                flake_checker.report_pass('suiteName')


class MockResponse:

    def __init__(
        self,
        ok: bool = True,
        json: AllowedMockJsonTypes = None,
        status_code: int = 200,
        reason: str = 'foo'
    ) -> None:
        if json is None:
            json = {}
        self.ok = ok
        self.json_dict = json
        self.status_code = status_code
        self.reason = reason

    def json(self) -> AllowedMockJsonTypes:
        """Get json dict or raise ValueError if json_dict not a dict."""
        if not isinstance(self.json_dict, dict):
            raise ValueError('Payload not JSON.')
        return self.json_dict


class IsTestOutputFlakyTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.example_date = datetime.datetime(2020, 1, 1, 0, 0, 0, 1)

    def test_successful_report(self) -> None:

        def mock_getenv(variable: str) -> Optional[Union[str, int]]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            url: str,  # pylint: disable=unused-argument
            json: Dict[str, str],  # pylint: disable=unused-argument
            allow_redirects: bool,  # pylint: disable=unused-argument
            headers: Dict[str, str]  # pylint: disable=unused-argument
        ) -> MockResponse:
            response: flake_checker.FlakeReportDict = {
                'log': ['log1', 'log2'],
                'result': True,
                'flake': {
                    'suite': 'suiteName',
                    'test': 'testName',
                    'flake_id': 'flake',
                },
                'rerun': 'rerun yes',
            }
            return MockResponse(True, response)

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': [b'line1', b'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
                'branch': 'develop',
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
            rerun = flake_checker.check_test_flakiness(
                [b'line1', b'line2'], 'suiteName')
            self.assertTrue(rerun)

    def test_successful_report_unknown_rerun(self) -> None:

        def mock_getenv(variable: str) -> Optional[Union[str, int]]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            url: str,  # pylint: disable=unused-argument
            json: Dict[str, str],  # pylint: disable=unused-argument
            allow_redirects: bool,  # pylint: disable=unused-argument
            headers: Dict[str, str]  # pylint: disable=unused-argument
        ) -> MockResponse:
            response: flake_checker.FlakeReportDict = {
                'log': ['log1', 'log2'],
                'result': True,
                'flake': {
                    'suite': 'suiteName',
                    'test': 'testName',
                    'flake_id': 'flake',
                },
                'rerun': 'unknown',
            }
            return MockResponse(True, response)

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': [b'line1', b'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
                'branch': 'develop',
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
            rerun = flake_checker.check_test_flakiness(
                [b'line1', b'line2'], 'suiteName')
            self.assertFalse(rerun)

    def test_successful_report_construct_url(self) -> None:

        def mock_getenv(variable: str) -> Optional[Union[str, int]]:
            environment_vars: Dict[str, Union[str, int]] = {
                'GITHUB_ACTIONS': 1,
                'GITHUB_ACTOR': 'user',
                'GITHUB_RUN_ID': 1234,
                'GITHUB_REF': 'develop',
                'GITHUB_REPOSITORY': 'foo/oppia'
            }
            return environment_vars.get(variable)

        def mock_post(
            url: str,  # pylint: disable=unused-argument
            json: Dict[str, str],  # pylint: disable=unused-argument
            allow_redirects: bool,  # pylint: disable=unused-argument
            headers: Dict[str, str]  # pylint: disable=unused-argument
        ) -> MockResponse:
            response: FlakeReportDictWithoutLog = {
                'result': False,
                'flake': {
                    'suite': 'suiteName',
                    'test': 'testName',
                    'flake_id': 'flake',
                },
                'rerun': 'rerun no',
            }
            return MockResponse(True, response)

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': [b'line1', b'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://github.com/foo/oppia/actions/runs/1234',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
                'branch': 'develop',
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
            rerun = flake_checker.check_test_flakiness(
                [b'line1', b'line2'], 'suiteName')
            self.assertFalse(rerun)

    def test_unsuccessful_report_exception(self) -> None:

        def mock_getenv(variable: str) -> Optional[Union[str, int]]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            url: str,
            json: Dict[str, str],
            allow_redirects: bool,
            headers: Dict[str, str]
        ) -> None:
            raise requests.HTTPError()

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': [b'line1', b'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
                'branch': 'develop',
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
            rerun = flake_checker.check_test_flakiness(
                [b'line1', b'line2'], 'suiteName')
            self.assertFalse(rerun)

    def test_unsuccessful_report_not_ok(self) -> None:

        def mock_getenv(variable: str) -> Optional[Union[str, int]]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            url: str,  # pylint: disable=unused-argument
            json: Dict[str, str],  # pylint: disable=unused-argument
            allow_redirects: bool,  # pylint: disable=unused-argument
            headers: Dict[str, str]  # pylint: disable=unused-argument
        ) -> MockResponse:
            return MockResponse(False, None)

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': [b'line1', b'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
                'branch': 'develop',
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
            rerun = flake_checker.check_test_flakiness(
                [b'line1', b'line2'], 'suiteName')
            self.assertFalse(rerun)

    def test_unsuccessful_report_bad_payload(self) -> None:

        def mock_getenv(variable: str) -> Optional[Union[str, int]]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            url: str,  # pylint: disable=unused-argument
            json: Dict[str, str],  # pylint: disable=unused-argument
            allow_redirects: bool,  # pylint: disable=unused-argument
            headers: Dict[str, str]  # pylint: disable=unused-argument
        ) -> MockResponse:
            return MockResponse(True, 'not json')

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': [b'line1', b'line2'],
            'metadata': {
                'username': 'user',
                'build_url': 'https://example.com',
                'timestamp': '2020-01-01T00:00:00.000001+00:00',
                'branch': 'develop',
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
            rerun = flake_checker.check_test_flakiness(
                [b'line1', b'line2'], 'suiteName')
            self.assertFalse(rerun)
