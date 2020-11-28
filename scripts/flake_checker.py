# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

import python_utils

import requests

FLAKE_REPORT_URL = os.getenv('FLAKE_REPORT_URL')

CI_INFO = {
    'circleCI': {
        'env': {
            'identifier': 'CIRCLECI',
            'user_info': 'CIRCLE_USERNAME',
            'build_url': 'CIRCLE_BUILD_URL',
            'build_id': None
        }
    },
    'githubActions': {
        'env': {
            'identifier': 'GITHUB_ACTIONS',
            'user_info': 'GITHUB_ACTOR',
            'build_url': None,
            'build_id': 'GITHUB_ACTION'
        },
        'build_url_template': 'https://github.com/oppia/oppia/runs/%s'
    }
}


def _print_color_message(message):
    """Prints the given message in red color.

    Args:
        message: str. The success message to print.
    """
    # \033[91m is the ANSI escape sequences for green color.
    python_utils.PRINT('\033[92m' + message + '\033[0m\n')


def _get_build_info():
    """Returns the info related to the build container."""
    build_info = {}

    for info in CI_INFO.values():
        ci_env = info['env']

        if not os.getenv(ci_env['identifier']):
            continue

        if os.getenv(ci_env['build_url']) is not None:
            build_url = os.getenv(ci_env['build_url'])
        else:
            build_url = info['build_url_template'] % os.getenv(
                ci_env['build_id'])

        build_info['username'] = os.getenv(ci_env['user_info'])
        build_info['build_url'] = build_url

        return build_info

    raise Exception('Unknown build environment.')


def is_test_output_flaky(output_lines, suite_name):
    """Returns whether the test output matches any flaky test log."""
    if FLAKE_REPORT_URL is None:
        _print_color_message('No URL found to check flakiness.')
        return False

    build_info = _get_build_info()
    payload = {
        'suite': suite_name,
        'output_lines': output_lines,
        'username': build_info['username'],
        'build_url': build_info['build_url']
    }
    response = None
    try:
        response = requests.post(
            FLAKE_REPORT_URL, json=payload, allow_redirects=False)
    except Exception as e:
        _print_color_message('Failed to fetch report from %s: %s' % (
            FLAKE_REPORT_URL, e))

    if not response.ok:
        _print_color_message('Failed request with response code: %s' % (
            response.status_code))
        return False

    report = {}
    try:
        report = response.json()
        _print_color_message(report['log'])
    except Exception as e:
        _print_color_message('Unable to convert json response: %s' % e)

    if 'logs' in report:
        _print_color_message('\n'.join(report['logs']))

    return report['result'] if 'result' in report else False
