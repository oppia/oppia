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

"""Unit tests for scripts/check_tests_are_captured_in_ci.py."""

from __future__ import annotations

import json
import os
import re
import tempfile

from core.tests import test_utils
from scripts import check_tests_are_captured_in_ci

from typing import List

ACCEPTANCE_TEST_SUITES: List[check_tests_are_captured_in_ci.TestSuiteDict] = [ # pylint: disable=line-too-long
    {
        'name': 'test/acceptance_suite1',
        'module': 'acceptance/specs/test/acceptance_suite1.spec.ts'
    },
    {
        'name': 'test2/acceptance_suite2',
        'module': 'acceptance/specs/test2/acceptance_suite2.spec.ts'
    }
]

E2E_TEST_SUITES: List[check_tests_are_captured_in_ci.TestSuiteDict] = [
    {
        'name': 'suiteA',
        'module': 'webdriverio/suiteA.js'
    },
    {
        'name': 'suiteB',
        'module': 'webdriverio/suiteB.js'
    }
]

E2E_TEST_CONFIG_FILE_CONTENT = """
var path = require('path');
var suites = {
    suiteA: [
        './webdriverio/suiteA.js'
    ],
    suiteB: [
        './webdriverio/suiteB.js'
    ]
}
"""


class CheckTestsAreCapturedInCiTest(test_utils.GenericTestBase):
    """Tests the methods for checking if tests are captured in CI."""

    def setUp(self) -> None:
        super().setUp()
        self.temp_directory = tempfile.TemporaryDirectory()
        self.dummy_e2e_directory = os.path.join(
            self.temp_directory.name, 'webdriverio')
        os.mkdir(self.dummy_e2e_directory)
        self.dummy_e2e_webdriverio_config_file = os.path.join(
            self.dummy_e2e_directory, 'wdio.conf.js')
        with open(
            self.dummy_e2e_webdriverio_config_file, 'w+', encoding='utf-8'
        ) as f:
            f.write(E2E_TEST_CONFIG_FILE_CONTENT)
        self.dummy_acceptance_directory = os.path.join(
            self.temp_directory.name, 'acceptance')
        os.mkdir(self.dummy_acceptance_directory)
        self.dummy_acceptance_specs_directory = os.path.join(
            self.dummy_acceptance_directory, 'specs')
        os.mkdir(self.dummy_acceptance_specs_directory)
        for suite in ACCEPTANCE_TEST_SUITES:
            suite_file = os.path.join(
                self.temp_directory.name, suite['module'])
            os.makedirs(os.path.dirname(suite_file), exist_ok=True)
            os.mknod(suite_file)
        self.ci_test_suite_configs_directory = os.path.join(
            self.temp_directory.name, 'ci-test-suite-configs')
        os.mkdir(self.ci_test_suite_configs_directory)
        e2e_ci_test_suite_config_file = os.path.join(
            self.ci_test_suite_configs_directory, 'e2e.json')
        with open(e2e_ci_test_suite_config_file, 'w+', encoding='utf-8') as f:
            f.write(json.dumps({
                'suites': E2E_TEST_SUITES
            }))
        acceptance_ci_test_suite_config_file = os.path.join(
            self.ci_test_suite_configs_directory, 'acceptance.json')
        with open(
            acceptance_ci_test_suite_config_file, 'w+', encoding='utf-8'
        ) as f:
            f.write(json.dumps({
                'suites': ACCEPTANCE_TEST_SUITES
            }))

        self.acceptance_ci_test_suite_config_file_path_swap = self.swap(
            check_tests_are_captured_in_ci,
            'ACCEPTANCE_CI_TEST_SUITE_CONFIG_FILE_PATH',
            acceptance_ci_test_suite_config_file)
        self.e2e_ci_test_suite_config_file_path_swap = self.swap(
            check_tests_are_captured_in_ci,
            'E2E_CI_TEST_SUITE_CONFIG_FILE_PATH',
            e2e_ci_test_suite_config_file)
        self.e2e_webdriverio_config_file_swap = self.swap(
            check_tests_are_captured_in_ci, 'E2E_WEBDRIVERIO_CONFIG_FILE_PATH',
            self.dummy_e2e_webdriverio_config_file)
        self.acceptance_test_specs_directory_swap = self.swap(
            check_tests_are_captured_in_ci, 'ACCEPTANCE_TEST_SPECS_DIRECTORY',
            self.dummy_acceptance_specs_directory)

    def tearDown(self) -> None:
        super().tearDown()
        self.temp_directory.cleanup()

    def test_compute_test_suites_difference(self) -> None:
        test_suites_one: List[check_tests_are_captured_in_ci.TestSuiteDict] = [
            {
                'name': 'test1',
                'module': 'test1.js'
            },
            {
                'name': 'test2',
                'module': 'test2.js' 
            }
        ]

        test_suites_two: List[check_tests_are_captured_in_ci.TestSuiteDict] = [
            {
                'name': 'test1',
                'module': 'test1.js'
            },
            {
                'name': 'test3',
                'module': 'test3.js'
            }
        ]

        test_suites_difference = (
            check_tests_are_captured_in_ci.compute_test_suites_difference(
                test_suites_one, test_suites_two))
        self.assertEqual(
            test_suites_difference,
            [
                {
                    'name': 'test3',
                    'module': 'test3.js'
                },
                {
                    'name': 'test2',
                    'module': 'test2.js'
                }
            ]
        )

    def test_get_acceptance_test_suites_from_ci_config_file(self) -> None:
        with self.acceptance_ci_test_suite_config_file_path_swap:
            acceptance_test_suites = (
                check_tests_are_captured_in_ci
                    .get_acceptance_test_suites_from_ci_config_file())
            self.assertEqual(acceptance_test_suites, ACCEPTANCE_TEST_SUITES)

    def test_get_e2e_test_suites_from_ci_config_file(self) -> None:
        with self.e2e_ci_test_suite_config_file_path_swap:
            e2e_test_suites = (
                check_tests_are_captured_in_ci
                    .get_e2e_test_suites_from_ci_config_file())
            self.assertEqual(e2e_test_suites, E2E_TEST_SUITES)

    def test_read_webdriverio_config_file(self) -> None:
        with self.e2e_webdriverio_config_file_swap:
            webdriverio_config_file_content = (
                check_tests_are_captured_in_ci
                    .read_webdriverio_config_file())
            self.assertEqual(
                webdriverio_config_file_content,
                E2E_TEST_CONFIG_FILE_CONTENT)

    def test_get_e2e_test_modules_from_webdriverio_directory(self) -> None:
        webdriverio_files_path = os.path.join(
            os.getcwd(), 'core', 'tests', 'webdriverio')
        webdriverio_desktop_files_path = os.path.join(
            os.getcwd(), 'core', 'tests', 'webdriverio_desktop')
        def mock_listdir(path: str) -> List[str]:
            if path == webdriverio_files_path:
                return ['suiteA.js', 'suiteB.js']
            elif path == webdriverio_desktop_files_path:
                return ['suiteC.js', 'suiteD.js']
            return []
        os_listdir_swap = self.swap(os, 'listdir', mock_listdir)

        with os_listdir_swap:
            e2e_test_modules = (
                check_tests_are_captured_in_ci
                    .get_e2e_test_modules_from_webdriverio_directory())
            self.assertEqual(
                e2e_test_modules,
                ['suiteA.js', 'suiteB.js', 'suiteC.js', 'suiteD.js']
            )

    def test_get_e2e_test_modules_from_webdriverio_config_file(self) -> None:
        with self.e2e_webdriverio_config_file_swap:
            e2e_test_modules = (
                check_tests_are_captured_in_ci
                    .get_e2e_test_modules_from_webdriverio_config_file())
            self.assertEqual(
                e2e_test_modules,
                ['suiteA.js', 'suiteB.js']
            )

    def test_get_e2e_test_suites_from_webdriverio_config_file(self) -> None:
        with self.e2e_webdriverio_config_file_swap:
            e2e_test_suites = (
                check_tests_are_captured_in_ci
                    .get_e2e_test_suites_from_webdriverio_config_file())
            print('e2e_test_suites:', e2e_test_suites)
            self.assertEqual(
                e2e_test_suites,
                [
                    {
                        'name': 'suiteA',
                        'module': 'webdriverio/suiteA.js'
                    },
                    {
                        'name': 'suiteB',
                        'module': 'webdriverio/suiteB.js'
                    }
                ]
            )

    def test_get_e2e_test_suites_from_webdriverio_config_file_with_exclusion(self) -> None: # pylint: disable=line-too-long
        e2e_test_suites_that_are_not_run_in_ci_swap = self.swap(
            check_tests_are_captured_in_ci,
            'E2E_TEST_SUITES_THAT_ARE_NOT_RUN_IN_CI',
            ['suiteB'])
        with self.e2e_webdriverio_config_file_swap:
            with e2e_test_suites_that_are_not_run_in_ci_swap:
                e2e_test_suites = (
                    check_tests_are_captured_in_ci
                        .get_e2e_test_suites_from_webdriverio_config_file())
                self.assertEqual(
                    e2e_test_suites,
                    [
                        {
                            'name': 'suiteA',
                            'module': 'webdriverio/suiteA.js'
                        }
                    ]
                )

    def test_get_acceptance_test_suites_from_acceptance_directory(self) -> None:
        def mock_get_cwd() -> str:
            return self.temp_directory.name
        os_getcwd_swap = self.swap(os, 'getcwd', mock_get_cwd)

        with self.acceptance_test_specs_directory_swap, os_getcwd_swap:
            acceptance_test_suites = (
                check_tests_are_captured_in_ci
                    .get_acceptance_test_suites_from_acceptance_directory())
            self.assertEqual(
                acceptance_test_suites, ACCEPTANCE_TEST_SUITES)

    def test_get_acceptance_test_suites_from_acceptance_directory_with_exclusion(self) -> None: # pylint: disable=line-too-long
        def mock_get_cwd() -> str:
            return self.temp_directory.name
        acceptance_test_suites_that_are_not_run_in_ci_swap = self.swap(
            check_tests_are_captured_in_ci,
            'ACCEPTANCE_TEST_SUITES_THAT_ARE_NOT_RUN_IN_CI',
            ['test2/acceptance_suite2'])
        os_getcwd_swap = self.swap(os, 'getcwd', mock_get_cwd)

        with self.acceptance_test_specs_directory_swap, os_getcwd_swap:
            with acceptance_test_suites_that_are_not_run_in_ci_swap:
                acceptance_test_suites = (
                    check_tests_are_captured_in_ci
                        .get_acceptance_test_suites_from_acceptance_directory())
                self.assertEqual(
                    acceptance_test_suites,
                    ACCEPTANCE_TEST_SUITES[:1]
                )

    def test_check_tests_are_captured_in_ci_with_acceptance_error(self) -> None:
        def mock_get_acceptance_test_suites_from_ci_config_file() -> List[check_tests_are_captured_in_ci.TestSuiteDict]: # pylint: disable=line-too-long
            return ACCEPTANCE_TEST_SUITES[:1]

        def mock_get_acceptance_test_suites_from_acceptance_directory() -> List[check_tests_are_captured_in_ci.TestSuiteDict]: # pylint: disable=line-too-long
            return ACCEPTANCE_TEST_SUITES

        get_acceptance_test_suites_from_ci_config_file_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_acceptance_test_suites_from_ci_config_file',
            mock_get_acceptance_test_suites_from_ci_config_file)
        get_acceptance_test_suites_from_acceptance_directory_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_acceptance_test_suites_from_acceptance_directory',
            mock_get_acceptance_test_suites_from_acceptance_directory)

        with get_acceptance_test_suites_from_ci_config_file_swap:
            with get_acceptance_test_suites_from_acceptance_directory_swap:
                with self.assertRaisesRegex(
                    Exception,
                    re.escape(
                        'Acceptance test suites and CI test suites are not '
                        'in sync. The following suites are not in sync: %s. '
                        'Please update the CI config file for acceptance tests '
                        'at core/tests/ci-test-suite-configs/acceptance.json '
                        'with the suites listed above.' % (
                            json.dumps(ACCEPTANCE_TEST_SUITES[1:2]))
                    )
                ):
                    check_tests_are_captured_in_ci.main()

    def test_check_tests_are_captured_in_ci_with_wdio_error(self) -> None:
        def mock_get_e2e_test_modules_from_webdriverio_directory() -> List[str]:
            return ['suiteA.js']

        def mock_get_e2e_test_modules_from_webdriverio_config_file() -> List[str]: # pylint: disable=line-too-long
            return ['suiteA.js', 'suiteB.js']

        get_e2e_test_modules_from_webdriverio_directory_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_e2e_test_modules_from_webdriverio_directory',
            mock_get_e2e_test_modules_from_webdriverio_directory)
        get_e2e_test_modules_from_webdriverio_config_file_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_e2e_test_modules_from_webdriverio_config_file',
            mock_get_e2e_test_modules_from_webdriverio_config_file)

        with get_e2e_test_modules_from_webdriverio_directory_swap:
            with get_e2e_test_modules_from_webdriverio_config_file_swap:
                with self.assertRaisesRegex(
                    Exception,
                    'One or more test module from webdriverio or '
                    'webdriverio_desktop directory is missing from '
                    'wdio.conf.js'
                ):
                    check_tests_are_captured_in_ci.main()

    def test_check_tests_are_captured_in_ci_with_e2e_error(self) -> None:
        def mock_get_e2e_test_suites_from_ci_config_file() -> List[check_tests_are_captured_in_ci.TestSuiteDict]: # pylint: disable=line-too-long
            return E2E_TEST_SUITES[:1]

        def mock_get_e2e_test_suites_from_webdriverio_config_file() -> List[check_tests_are_captured_in_ci.TestSuiteDict]: # pylint: disable=line-too-long
            return E2E_TEST_SUITES

        get_e2e_test_suites_from_ci_config_file_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_e2e_test_suites_from_ci_config_file',
            mock_get_e2e_test_suites_from_ci_config_file)
        get_e2e_test_suites_from_webdriverio_config_file_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_e2e_test_suites_from_webdriverio_config_file',
            mock_get_e2e_test_suites_from_webdriverio_config_file)

        with get_e2e_test_suites_from_ci_config_file_swap:
            with get_e2e_test_suites_from_webdriverio_config_file_swap:
                with self.assertRaisesRegex(
                    Exception,
                    re.escape(
                        'E2E test suites and CI test suites are not in sync. '
                        'The following suites are not in sync: %s. Please '
                        'update the CI config file for e2e tests at core/tests/'
                        'ci-test-suite-configs/e2e.json with the suites listed '
                        'above.' % (json.dumps(E2E_TEST_SUITES[1:2]))
                    )
                ):
                    check_tests_are_captured_in_ci.main()

    def test_check_tests_are_captured_in_ci_with_no_error(self) -> None:
        def mock_get_acceptance_test_suites_from_ci_config_file() -> List[check_tests_are_captured_in_ci.TestSuiteDict]: # pylint: disable=line-too-long
            return ACCEPTANCE_TEST_SUITES

        def mock_get_acceptance_test_suites_from_acceptance_directory() -> List[check_tests_are_captured_in_ci.TestSuiteDict]: # pylint: disable=line-too-long
            return ACCEPTANCE_TEST_SUITES

        def mock_get_e2e_test_modules_from_webdriverio_directory() -> List[str]:
            return ['suiteA.js', 'suiteB.js']

        def mock_get_e2e_test_modules_from_webdriverio_config_file() -> List[str]: # pylint: disable=line-too-long
            return ['suiteA.js', 'suiteB.js']

        def mock_get_e2e_test_suites_from_ci_config_file() -> List[check_tests_are_captured_in_ci.TestSuiteDict]: # pylint: disable=line-too-long
            return E2E_TEST_SUITES

        def mock_get_e2e_test_suites_from_webdriverio_config_file() -> List[check_tests_are_captured_in_ci.TestSuiteDict]: # pylint: disable=line-too-long
            return E2E_TEST_SUITES

        get_acceptance_test_suites_from_ci_config_file_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_acceptance_test_suites_from_ci_config_file',
            mock_get_acceptance_test_suites_from_ci_config_file)
        get_acceptance_test_suites_from_acceptance_directory_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_acceptance_test_suites_from_acceptance_directory',
            mock_get_acceptance_test_suites_from_acceptance_directory)
        get_e2e_test_modules_from_webdriverio_directory_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_e2e_test_modules_from_webdriverio_directory',
            mock_get_e2e_test_modules_from_webdriverio_directory)
        get_e2e_test_modules_from_webdriverio_config_file_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_e2e_test_modules_from_webdriverio_config_file',
            mock_get_e2e_test_modules_from_webdriverio_config_file)
        get_e2e_test_suites_from_ci_config_file_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_e2e_test_suites_from_ci_config_file',
            mock_get_e2e_test_suites_from_ci_config_file)
        get_e2e_test_suites_from_webdriverio_config_file_swap = self.swap(
            check_tests_are_captured_in_ci,
            'get_e2e_test_suites_from_webdriverio_config_file',
            mock_get_e2e_test_suites_from_webdriverio_config_file)

        with get_acceptance_test_suites_from_ci_config_file_swap:
            with get_acceptance_test_suites_from_acceptance_directory_swap:
                with get_e2e_test_modules_from_webdriverio_directory_swap:
                    with get_e2e_test_modules_from_webdriverio_config_file_swap:
                        with get_e2e_test_suites_from_ci_config_file_swap:
                            with get_e2e_test_suites_from_webdriverio_config_file_swap: # pylint: disable=line-too-long
                                check_tests_are_captured_in_ci.main()
