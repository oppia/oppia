# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""A script to check that the CI config files and the test files
have the same test suites.
"""

from __future__ import annotations

import glob
import json
import os
import re

from core import utils

from typing import List, TypedDict


E2E_TEST_SUITES_THAT_ARE_NOT_RUN_IN_CI = ['full']
ACCEPTANCE_TEST_SUITES_THAT_ARE_NOT_RUN_IN_CI: List[str] = []


CI_TEST_SUITE_CONFIGS_DIRECTORY = os.path.join(
    os.getcwd(), 'core', 'tests', 'ci-test-suite-configs')
ACCEPTANCE_CI_TEST_SUITE_CONFIG_FILE_PATH = os.path.join(
    CI_TEST_SUITE_CONFIGS_DIRECTORY, 'acceptance.json')
E2E_CI_TEST_SUITE_CONFIG_FILE_PATH = os.path.join(
    CI_TEST_SUITE_CONFIGS_DIRECTORY, 'e2e.json')

ACCEPTANCE_TEST_SPECS_DIRECTORY = os.path.join(
    os.getcwd(), 'core', 'tests', 'puppeteer-acceptance-tests', 'specs')
E2E_WEBDRIVERIO_CONFIG_FILE_PATH = os.path.join(
    os.getcwd(), 'core', 'tests', 'wdio.conf.js')


class TestSuiteDict(TypedDict):
    """Dictionary representing a test suite."""

    name: str
    module: str


def get_acceptance_test_suites_from_ci_config_file() -> List[TestSuiteDict]:
    """Extracts the test suite names from the acceptance test suite config file.

    Returns:
        list(dict). A list of test suites dictionaries, each containing
        the name and module of a test suite from the acceptance test suite
        config file.
    """
    with open(
        ACCEPTANCE_CI_TEST_SUITE_CONFIG_FILE_PATH, 'r', encoding='utf-8'
    ) as f:
        acceptance_test_suite_config = json.load(f)
        acceptance_test_suites: List[TestSuiteDict] = []
        for key in acceptance_test_suite_config.keys():
            acceptance_test_suites.extend(
                acceptance_test_suite_config.get(key)
            )
    return sorted(
        acceptance_test_suites,
        key=lambda x: x['name']
    )


def get_e2e_test_suites_from_ci_config_file() -> List[TestSuiteDict]:
    """Extracts the test suite names from the e2e test suite config file.

    Returns:
        list(dict). A list of test suites dictionaries, each containing
        the name and module of a test suite from the e2e test suite config file.
    """
    with open(E2E_CI_TEST_SUITE_CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
        e2e_test_suite_config = json.load(f)
        e2e_test_suites: List[TestSuiteDict] = e2e_test_suite_config['suites']
    return sorted(e2e_test_suites, key=lambda x: x['name'])


def read_webdriverio_config_file() -> str:
    """Returns the contents of core/tests/wdio.conf.js file.

    Returns:
        str. The contents of wdio.conf.js, as a string.
    """
    webdriverio_config_file_content = utils.open_file(
        E2E_WEBDRIVERIO_CONFIG_FILE_PATH, 'r').read()
    return webdriverio_config_file_content


def get_e2e_test_modules_from_webdriverio_directory() -> List[str]:
    """Extracts the names of the all test files in core/tests/webdriverio
    and core/tests/webdriverio_desktop directory.

    Returns:
        list(str). A list of filenames from the webdriverio and
        webdriverio_desktop directories.
    """
    webdriverio_test_suite_modules = []
    webdriverio_files = os.path.join(
        os.getcwd(), 'core', 'tests', 'webdriverio')
    webdriverio_desktop_files = os.path.join(
        os.getcwd(), 'core', 'tests', 'webdriverio_desktop')
    for file_name in os.listdir(webdriverio_files):
        webdriverio_test_suite_modules.append(file_name)
    for file_name in os.listdir(webdriverio_desktop_files):
        webdriverio_test_suite_modules.append(file_name)

    return webdriverio_test_suite_modules


def get_e2e_test_modules_from_webdriverio_config_file() -> List[str]:
    """Extracts the filenames from the suites object of
    wdio.conf.js file.

    Returns:
        list(str). A list of filenames from the suites object of
        wdio.conf.js file.
    """
    webdriverio_config_file_content = read_webdriverio_config_file()
    # The following line extracts suite object from wdio.conf.js.
    suite_object_string = re.compile(
        r'suites = {([^}]+)}').findall(webdriverio_config_file_content)[0]
    test_files_regex = re.compile(r'/([a-zA-Z]*.js)')
    e2e_test_modules = test_files_regex.findall(suite_object_string)
    return e2e_test_modules


def get_e2e_test_suites_from_webdriverio_config_file() -> List[TestSuiteDict]:
    """Extracts the test suites from the wdio.conf.js file.

    Returns:
        list(dict). A list of test suites dictionaries, each containing
        the name and module of a test suite from the wdio.conf.js file.
    """
    webdriverio_config_file_content = read_webdriverio_config_file()
    # The following line extracts suite object from wdio.conf.js.
    suite_object_string = re.sub(r'[\n\t\s]*', '', re.compile(
        r'suites = {([^}]+)}').findall(webdriverio_config_file_content)[0])
    test_suite_regex = re.compile(r'\b([a-zA-Z_-]*):\[(.*?)\]')
    e2e_test_suites: List[TestSuiteDict] = []
    for test_suite_match in test_suite_regex.findall(suite_object_string):
        test_suite_name = test_suite_match[0]
        test_suite_modules = [
            test_suite for test_suite in
            test_suite_match[1].split(',') if test_suite
        ]
        test_suite_modules = [
            module.strip()[1:-1].replace('./', '')
            for module in test_suite_modules
        ]
        for test_suite_module in test_suite_modules:
            if test_suite_name in E2E_TEST_SUITES_THAT_ARE_NOT_RUN_IN_CI:
                continue
            e2e_test_suites.append(
                {
                    'name': test_suite_name,
                    'module': test_suite_module
                }
            )
    return sorted(
        e2e_test_suites,
        key=lambda x: x['name']
    )


def get_acceptance_test_suites_from_acceptance_directory() -> List[TestSuiteDict]: # pylint: disable=line-too-long
    """Gets the acceptance test suites from the acceptance test 
    specs directory.

    Returns:
        list(dict). A list of test suites dictionaries, each containing
        the name and module of a test suite from the acceptance test
        specs directory.
    """

    acceptance_test_files = glob.glob(
        os.path.join(ACCEPTANCE_TEST_SPECS_DIRECTORY, '**/*.spec.ts'))
    acceptance_test_suites: List[TestSuiteDict] = []
    for module in acceptance_test_files:
        acceptance_test_suite_name = os.path.relpath(
            module, ACCEPTANCE_TEST_SPECS_DIRECTORY).replace('.spec.ts', '')
        if (
            acceptance_test_suite_name in
            ACCEPTANCE_TEST_SUITES_THAT_ARE_NOT_RUN_IN_CI
        ):
            continue
        acceptance_test_suites.append({
            'name': acceptance_test_suite_name,
            'module': os.path.relpath(module, os.getcwd())
        })
    return sorted(
        acceptance_test_suites,
        key=lambda x: x['name']
    )


def compute_test_suites_difference(
    test_suites_from_config: List[TestSuiteDict],
    test_suites_from_directory: List[TestSuiteDict]
) -> List[TestSuiteDict]:
    """Computes the difference between the test suites from the CI config files
    and the test suites from the test files.

    Args:
        test_suites_from_config: list(dict). A list of dictionaries sorted
            by name, each containing the name and module of a test suite from
            the CI config files.
        test_suites_from_directory: list(dict). A list of dictionaries sorted 
            by name, each containing the name and module of a test suite from
            the test files.

    Returns:
        list(dict). A list of test suites which are not present in both 
        the CI config files and the test files, but are present in
        either of them.
    """
    test_suites_difference = [
        test_suite for test_suite in test_suites_from_directory +
        test_suites_from_config if test_suite not in test_suites_from_config or
        test_suite not in test_suites_from_directory
    ]
    return test_suites_difference


def main() -> None:
    """Checks that the CI config files and the test files have 
    the same test suites.
    """

    print(
        'Checking all acceptance test suites are captured in CI '
        'config files...'
    )
    acceptance_test_suites_from_config = (
        get_acceptance_test_suites_from_ci_config_file())
    acceptance_test_suites_from_directory = (
        get_acceptance_test_suites_from_acceptance_directory())
    acceptance_test_suites_difference = compute_test_suites_difference(
        acceptance_test_suites_from_config,
        acceptance_test_suites_from_directory
    )

    if len(acceptance_test_suites_difference) > 0:
        raise Exception(
            'Acceptance test suites and CI test suites are not in sync. '
            'The following suites are not in sync: %s. Please update the '
            'CI config file for acceptance tests at core/tests/ci-test-'
            'suite-configs/acceptance.json with the suites listed above.'
                % (json.dumps(acceptance_test_suites_difference))
        )
    print('Done!')

    print('Checking all e2e test modules are captured in wdio.conf.js...')
    webdriverio_test_suite_modules = (
        get_e2e_test_modules_from_webdriverio_directory())
    webdriverio_conf_test_modules = (
        get_e2e_test_modules_from_webdriverio_config_file())

    if not (
        sorted(
            webdriverio_test_suite_modules
        ) == sorted(webdriverio_conf_test_modules)
    ):
        raise Exception(
            'One or more test module from webdriverio or webdriverio_desktop '
            'directory is missing from wdio.conf.js. Please update wdio.conf.js'
            ' with the missing test modules.'
        )
    print('Done!')

    print('Checking all e2e test suites are captured in CI config files...')
    e2e_test_suites_from_config = (
        get_e2e_test_suites_from_ci_config_file())
    e2e_test_suites_from_directory = (
        get_e2e_test_suites_from_webdriverio_config_file())
    e2e_test_suites_difference = compute_test_suites_difference(
        e2e_test_suites_from_config, e2e_test_suites_from_directory)

    if len(e2e_test_suites_difference) > 0:
        raise Exception(
            'E2E test suites and CI test suites are not in sync. The following '
            'suites are not in sync: %s. Please update the CI config file for '
            'e2e tests at core/tests/ci-test-suite-configs/e2e.json with the '
            'suites listed above.' % (
                json.dumps(e2e_test_suites_difference))
        )
    print('Done!')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_e2e_tests_are_captured_in_ci.py
# is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
