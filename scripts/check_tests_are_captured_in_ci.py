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

from typing import List, TypedDict

ACCEPTANCE_TEST_SUITES_THAT_ARE_NOT_RUN_IN_CI: List[str] = []

CI_TEST_SUITE_CONFIGS_DIRECTORY = os.path.join(
    os.getcwd(), 'core', 'tests', 'ci-test-suite-configs'
)
ACCEPTANCE_CI_TEST_SUITE_CONFIG_FILE_PATH = os.path.join(
    CI_TEST_SUITE_CONFIGS_DIRECTORY, 'acceptance.json'
)

ACCEPTANCE_TEST_SPECS_DIRECTORY = os.path.join(
    os.getcwd(), 'core', 'tests', 'puppeteer-acceptance-tests', 'specs'
)
PLAYWRIGHT_ACCEPTANCE_TEST_SPECS_DIRECTORY = os.path.join(
    os.getcwd(), 'core', 'tests', 'playwright-acceptance-tests', 'specs'
)


class TestSuiteDict(TypedDict):
    """Dictionary representing a test suite. The framework field
    distinguishes between puppeteer and playwright acceptance tests during
    their incremental migration."""

    name: str
    module: str
    # TODO(#24715): Remove the 'framework' field once the migration from
    # Puppeteer to Playwright acceptance tests is complete.
    framework: str


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
            acceptance_test_suites.extend(acceptance_test_suite_config.get(key))
    return sorted(acceptance_test_suites, key=lambda x: x['name'])


def get_acceptance_test_suites_from_acceptance_directory() -> (
    List[TestSuiteDict]
):  # pylint: disable=line-too-long
    """Gets the acceptance test suites from the acceptance test
    specs directory.

    Returns:
        list(dict). A list of test suites dictionaries, each containing
        the name and module of a test suite from the acceptance test
        specs directory.
    """
    acceptance_test_suites: List[TestSuiteDict] = []
    for test_specs_directory, framework in [
        (ACCEPTANCE_TEST_SPECS_DIRECTORY, 'puppeteer'),
        (PLAYWRIGHT_ACCEPTANCE_TEST_SPECS_DIRECTORY, 'playwright'),
    ]:
        acceptance_test_files = glob.glob(
            os.path.join(test_specs_directory, '**/*.spec.ts'), recursive=True
        )

        for module in acceptance_test_files:
            acceptance_test_suite_name = os.path.relpath(
                module, test_specs_directory
            ).replace('.spec.ts', '')
            if (
                acceptance_test_suite_name
                in ACCEPTANCE_TEST_SUITES_THAT_ARE_NOT_RUN_IN_CI
            ):
                continue
            acceptance_test_suites.append(
                {
                    'name': acceptance_test_suite_name,
                    'module': os.path.relpath(module, os.getcwd()),
                    'framework': framework,
                }
            )
    return sorted(acceptance_test_suites, key=lambda x: x['name'])


def compute_test_suites_difference(
    test_suites_from_config: List[TestSuiteDict],
    test_suites_from_directory: List[TestSuiteDict],
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
        test_suite
        for test_suite in test_suites_from_directory + test_suites_from_config
        if test_suite not in test_suites_from_config
        or test_suite not in test_suites_from_directory
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
        get_acceptance_test_suites_from_ci_config_file()
    )
    acceptance_test_suites_from_directory = (
        get_acceptance_test_suites_from_acceptance_directory()
    )
    acceptance_test_suites_difference = compute_test_suites_difference(
        acceptance_test_suites_from_config,
        acceptance_test_suites_from_directory,
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


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_tests_are_captured_in_ci.py
# is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
