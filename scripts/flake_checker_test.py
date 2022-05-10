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
from typing import Any, Dict, List, NoReturn, Union
from typing_extensions import Literal, TypedDict


class ResponseDict(TypedDict):
    """Dictionary that represents json response dictionary."""

    log: List[str]
    result: bool
    flake: FlakeDict


class FlakeDict(TypedDict):
    """Dictionary that represents flake dictionary."""

    suite: str
    test: str
    flake_id: str


class MetadataDict(TypedDict):
    """Dictionary that represents metadata dictionary."""

    username: str
    build_url: str
    timestamp: str
    branch: str


class ExpectedPayloadDict1(TypedDict):
    """Dictionary that represents payload dictionary with 2 keys."""

    suite: str
    metadata: MetadataDict


class ExpectedPayloadDict2(TypedDict):
    """Dictionary that represents payload dictionary with 3 keys."""

    suite: str
    output_lines: List[str]
    metadata: MetadataDict


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

        def mock_getenv(unused_variable: str) -> Literal[False]:
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
        super(ReportPassTests, self).setUp()
        self.example_date = datetime.datetime(2020, 1, 1, 0, 0, 0, 1)

    def test_successful_report(self) -> None:

        def mock_getenv(variable: str) -> Union[str, int, None]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            _url: str,
            _json: Dict[str, Any],
            _allow_redirects: bool,
            _headers: Dict[str, str]
        ) -> None:
            pass

        expected_payload: ExpectedPayloadDict1 = {
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
                '_json': expected_payload,
                '_allow_redirects': False,
                '_headers': {
                    'report_key': flake_checker.REPORT_API_KEY
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flake_checker.report_pass('suiteName')

    def test_successful_report_construct_url(self) -> None:

        def mock_getenv(variable: str) -> Union[int, str, None]:
            environment_vars: Dict[str, Union[int, str]] = {
                'GITHUB_ACTIONS': 1,
                'GITHUB_ACTOR': 'user',
                'GITHUB_RUN_ID': 1234,
                'GITHUB_REF': 'develop',
                'GITHUB_REPOSITORY': 'foo/oppia',
            }
            return environment_vars.get(variable)

        def mock_post(
            _url: str,
            _json: Dict[str, Any],
            _allow_redirects: bool,
            _headers: Dict[str, str]
        ) -> None:
            pass

        expected_payload: ExpectedPayloadDict1 = {
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
                '_json': expected_payload,
                '_allow_redirects': False,
                '_headers': {
                    'report_key': flake_checker.REPORT_API_KEY
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flake_checker.report_pass('suiteName')

    def test_unsuccessful_report(self) -> None:

        def mock_getenv(variable: str) -> Union[str, int, None]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            _url: str,
            _json: Dict[str, Any],
            _allow_redirects: bool,
            _headers: Dict[str, str]
        ) -> NoReturn:
            raise requests.HTTPError()

        expected_payload: ExpectedPayloadDict1 = {
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
                '_json': expected_payload,
                '_allow_redirects': False,
                '_headers': {
                    'report_key': flake_checker.REPORT_API_KEY,
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flake_checker.report_pass('suiteName')

    def test_unknown_build_environment(self) -> None:

        def mock_getenv(variable: str) -> Union[str, int, None]:
            environment_vars: Dict[str, Union[int, str]] = {}
            return environment_vars.get(variable)

        def mock_post(
            _url: str,
            _json: Dict[str, Any],
            _allow_redirects: bool,
            _headers: Dict[str, str]
        ) -> NoReturn:
            raise AssertionError('requests.post called.')

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        post_swap = self.swap(requests, 'post', mock_post)

        with getenv_swap, post_swap:
            with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                Exception, 'Unknown build environment.'):
                flake_checker.report_pass('suiteName')

    def test_missing_environment_variable(self) -> None:

        def mock_getenv(variable: str) -> Union[str, int, None]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            _url: str,
            _json: Dict[str, Any],
            _allow_redirects: bool,
            _headers: Dict[str, str]
        ) -> NoReturn:
            raise AssertionError('requests.post called.')

        getenv_swap = self.swap(os, 'getenv', mock_getenv)
        post_swap = self.swap(requests, 'post', mock_post)

        with getenv_swap, post_swap:
            with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                RuntimeError,
                'Expected environment variable CIRCLE_BUILD_URL missing'):
                flake_checker.report_pass('suiteName')


class MockResponse:

    def __init__(
        self,
        ok: bool = True,
        json: Union[ResponseDict, Dict[str, str], None] = None,
        status_code: int = 200,
        reason: str = 'foo'
    ) -> None:
        if json is None:
            json = {}
        self.ok = ok
        self.json_dict = json
        self.status_code = status_code
        self.reason = reason

    def json(self) -> Union[ResponseDict, Dict[str, str], None]:
        """Get json dict or raise ValueError if json_dict not a dict."""
        if not isinstance(self.json_dict, dict):
            raise ValueError('Payload not JSON.')
        return self.json_dict


class IsTestOutputFlakyTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super(IsTestOutputFlakyTests, self).setUp()
        self.example_date = datetime.datetime(2020, 1, 1, 0, 0, 0, 1)

    def test_successful_report(self) -> None:

        def mock_getenv(variable: str) -> Union[str, int, None]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            _url: str,
            _json: Dict[str, Any],
            _allow_redirects: bool,
            _headers: Dict[str, str]
        ) -> MockResponse:
            response: ResponseDict = {
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
                '_json': expected_payload,
                '_allow_redirects': False,
                '_headers': {
                    'report_key': flake_checker.REPORT_API_KEY
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flaky, rerun = flake_checker.is_test_output_flaky(
                ['line1', 'line2'], 'suiteName')
            self.assertTrue(flaky)
            self.assertEqual(rerun, flake_checker.RERUN_UNKNOWN)

    def test_successful_report_construct_url(self) -> None:

        def mock_getenv(variable: str) -> Union[str, int, None]:
            environment_vars: Dict[str, Union[str, int]] = {
                'GITHUB_ACTIONS': 1,
                'GITHUB_ACTOR': 'user',
                'GITHUB_RUN_ID': 1234,
                'GITHUB_REF': 'develop',
                'GITHUB_REPOSITORY': 'foo/oppia'
            }
            return environment_vars.get(variable)

        def mock_post(
            _url: str,
            _json: Dict[str, Any],
            _allow_redirects: bool,
            _headers: Dict[str, str]
        ) -> MockResponse:
            response: ResponseDict = {
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
                '_json': expected_payload,
                '_allow_redirects': False,
                '_headers': {
                    'report_key': flake_checker.REPORT_API_KEY
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flaky, rerun = flake_checker.is_test_output_flaky(
                ['line1', 'line2'], 'suiteName')
            self.assertTrue(flaky)
            self.assertEqual(rerun, flake_checker.RERUN_UNKNOWN)

    def test_unsuccessful_report_exception(self) -> None:

        def mock_getenv(variable: str) -> Union[str, int, None]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            _url: str,
            _json: Dict[str, Any],
            _allow_redirects: bool,
            _headers: Dict[str, str]
        ) -> NoReturn:
            raise requests.HTTPError()

        expected_payload = {
            'suite': 'suiteName',
            'output_lines': ['line1', 'line2'],
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
                '_json': expected_payload,
                '_allow_redirects': False,
                '_headers': {
                    'report_key': flake_checker.REPORT_API_KEY,
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flaky, rerun = flake_checker.is_test_output_flaky(
                ['line1', 'line2'], 'suiteName')
            self.assertFalse(flaky)
            self.assertEqual(rerun, flake_checker.RERUN_UNKNOWN)

    def test_unsuccessful_report_not_ok(self) -> None:

        def mock_getenv(variable: str) -> Union[str, int, None]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            _url: str,
            _json: Dict[str, Any],
            _allow_redirects: bool,
            _headers: Dict[str, str]
        ) -> MockResponse:
            return MockResponse(False, None)

        expected_payload: ExpectedPayloadDict2 = {
            'suite': 'suiteName',
            'output_lines': ['line1', 'line2'],
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
                '_json': expected_payload,
                '_allow_redirects': False,
                '_headers': {
                    'report_key': flake_checker.REPORT_API_KEY,
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flaky, rerun = flake_checker.is_test_output_flaky(
                ['line1', 'line2'], 'suiteName')
            self.assertFalse(flaky)
            self.assertEqual(rerun, flake_checker.RERUN_UNKNOWN)

    def test_unsuccessful_report_bad_payload(self) -> None:

        def mock_getenv(variable: str) -> Union[str, int, None]:
            environment_vars: Dict[str, Union[str, int]] = {
                'CIRCLECI': 1,
                'CIRCLE_USERNAME': 'user',
                'CIRCLE_BUILD_URL': 'https://example.com',
                'CIRCLE_BRANCH': 'develop',
            }
            return environment_vars.get(variable)

        def mock_post(
            _url: str,
            _json: Dict[str, Any],
            _allow_redirects: bool,
            _headers: Dict[str, str]
        ) -> MockResponse:
            # TODO(#13059): After we fully type the codebase we plan to get
            # rid of the tests that intentionally test wrong inputs that we
            # can normally catch by typing.
            return MockResponse(True, 'not json') # type: ignore[arg-type]

        expected_payload: ExpectedPayloadDict2 = {
            'suite': 'suiteName',
            'output_lines': ['line1', 'line2'],
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
                '_json': expected_payload,
                '_allow_redirects': False,
                '_headers': {
                    'report_key': flake_checker.REPORT_API_KEY,
                },
            }])

        with getenv_swap, datetime_swap, post_swap:
            flaky, rerun = flake_checker.is_test_output_flaky(
                ['line1', 'line2'], 'suiteName')
            self.assertFalse(flaky)
            self.assertEqual(rerun, flake_checker.RERUN_UNKNOWN)
