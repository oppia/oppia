# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Python execution for checking whether the tests output is flaky."""

from __future__ import annotations

import datetime
import os

import requests

from typing import Dict, Final, List, Optional, TypedDict


class FlakeReportDict(TypedDict):
    """Dictionary representation of flake's report."""

    log: List[str]
    result: bool
    flake: Dict[str, str]
    rerun: str


class EnvVarDict(TypedDict):
    """Dictionary representation of environment variables."""

    identifier: str
    user_info: str
    branch: str
    build_url_template_vars: List[str]


class CIInfoValueDict(TypedDict):
    """Dictionary representation of CI_INFO dict's values."""

    env: EnvVarDict
    build_url_template: str


FLAKE_CHECK_AND_REPORT_URL: Final = (
    'https://oppia-e2e-test-results-logger.herokuapp.com'
    '/check-flake-and-report')
PASS_REPORT_URL: Final = (
    'https://oppia-e2e-test-results-logger.herokuapp.com'
    '/report-pass')
REPORT_API_KEY: Final = '7Ccp062JVjv9LUYwnLMqcm5Eu5gYqqhpl3zQmcO3cDQ'

CI_INFO: Dict[str, CIInfoValueDict] = {
    'githubActions': {
        'env': {
            'identifier': 'GITHUB_ACTIONS',
            'user_info': 'GITHUB_ACTOR',
            'branch': 'GITHUB_REF',
            'build_url_template_vars': ['GITHUB_REPOSITORY', 'GITHUB_RUN_ID'],
        },
        'build_url_template': 'https://github.com/%s/actions/runs/%s',
    },
    'circleCI': {
        'env': {
            'identifier': 'CIRCLECI',
            'user_info': 'CIRCLE_USERNAME',
            'branch': 'CIRCLE_BRANCH',
            'build_url_template_vars': ['CIRCLE_BUILD_URL']
        },
        'build_url_template': '%s',
    }
}

REQUEST_EXCEPTIONS: Final = (
    requests.RequestException, requests.ConnectionError,
    requests.HTTPError, requests.TooManyRedirects, requests.Timeout)

# Rerun policy overrides from logging server.

# Yes, rerun, even if rerun policy says otherwise.
RERUN_YES: Final = 'rerun yes'
# No, do not rerun, even if rerun policy says otherwise.
RERUN_NO: Final = 'rerun no'
# No instructions from logging server, so follow rerun policy.
RERUN_UNKNOWN: Final = 'rerun unknown'


def _print_color_message(message: str) -> None:
    """Prints the given message in red color.

    Args:
        message: str. The success message to print.
    """
    # \033[91m is the ANSI escape sequences for green color.
    print('\033[92m' + message + '\033[0m\n')


def check_if_on_ci() -> bool:
    """Check if the script is running on a CI server.

    Returns: bool. Whether we are running on a CI server.
    """
    for info in CI_INFO.values():
        ci_identifier = info['env']['identifier']
        if os.getenv(ci_identifier):
            return True
    return False


def _get_build_info() -> Dict[str, Optional[str]]:
    """Returns the info related to the build container."""
    build_info = {}

    for info in CI_INFO.values():
        ci_env = info['env']

        if not os.getenv(ci_env['identifier']):
            continue

        template_values = []
        for template_var in ci_env['build_url_template_vars']:
            value = os.getenv(template_var)
            if value is None:
                raise RuntimeError(
                    'Expected environment variable %s missing' %
                    template_var)
            template_values.append(value)
        build_url = info['build_url_template'] % tuple(template_values)
        timestamp = datetime.datetime.utcnow().isoformat() + '+00:00'

        build_info['username'] = os.getenv(ci_env['user_info'])
        build_info['build_url'] = build_url
        build_info['timestamp'] = timestamp
        build_info['branch'] = os.getenv(ci_env['branch'])

        return build_info

    raise Exception('Unknown build environment.')


def report_pass(suite_name: str) -> None:
    """Report a passing test to the logging server."""
    metadata = _get_build_info()
    payload = {
        'suite': suite_name,
        'metadata': metadata,
    }
    try:
        requests.post(
            PASS_REPORT_URL, json=payload,
            allow_redirects=False,
            headers={'report_key': REPORT_API_KEY})
    except REQUEST_EXCEPTIONS as e:
        _print_color_message((
            'Failed to contact E2E test logging server at %s.'
            'Please report to E2E team in case server is down.'
            'Exception: %s') % (PASS_REPORT_URL, e))
    _print_color_message(
        'Reported pass to E2E logging server at {}.'.format(
            PASS_REPORT_URL))


def check_test_flakiness(output_lines: List[bytes], suite_name: str) -> bool:
    """Checks whether the test output matches any flaky test log.

    Whether the test is flaky is printed to the console.

    Args:
        output_lines: list(bytes). The output from the test run.
        suite_name: str. Name of the E2E test suite.

    Returns:
        bool. Whether the test should be rerun.

    Raises:
        ValueError. Raised if the response from the logging server is invalid.
    """
    build_info = _get_build_info()
    payload = {
        'suite': suite_name,
        'output_lines': output_lines,
        'metadata': build_info,
    }
    response = None
    try:
        response = requests.post(
            FLAKE_CHECK_AND_REPORT_URL, json=payload,
            allow_redirects=False,
            headers={'report_key': REPORT_API_KEY})
    except REQUEST_EXCEPTIONS as e:
        _print_color_message((
            'Failed to contact E2E test logging server at %s.'
            'Please report to E2E team in case server is down.'
            'Exception: %s') % (FLAKE_CHECK_AND_REPORT_URL, e))

        return False

    if not response.ok:
        _print_color_message('Failed request with response code: %s (%s)' % (
            response.status_code, response.reason))
        return False

    try:
        report: FlakeReportDict = response.json()
    except ValueError as e:
        _print_color_message('Unable to convert json response: %s' % e)
        return False

    if 'log' in report:
        log_str = '\n'.join(report['log'])
        _print_color_message(
            'Logs from test result logging server:\n %s' % log_str)

    flaky = report['result'] if 'result' in report else False
    _print_color_message(
        'E2E logging server says test flaky: {}.'.format(flaky))
    if flaky:
        flake = report['flake']
        _print_color_message('Flake Detected:')
        _print_color_message('    Suite: %s' % flake['suite'])
        _print_color_message('    Test: %s' % flake['test'])
        _print_color_message(
            '    Error Message: %s' % flake['flake_id'])
    rerun = report['rerun']
    if rerun not in (RERUN_YES, RERUN_NO):
        _print_color_message(
            'Invalid rerun instruction from logging server: %s' % rerun)
        return False
    else:
        _print_color_message(
            'Rerun instruction from logging server: %s' %
            'rerun' if rerun == RERUN_YES else 'do not rerun')
    return rerun == RERUN_YES
