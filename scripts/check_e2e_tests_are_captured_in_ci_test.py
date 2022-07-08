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

"""Unit tests for scripts/check_e2e_tests_are_captured_in_ci.py."""

from __future__ import annotations

import os
import re

from core import utils
from core.tests import test_utils

from typing import List

from . import check_e2e_tests_are_captured_in_ci

DUMMY_TEST_SUITES_PROTRACTOR = ['oneword', 'twoWords']
DUMMY_TEST_SUITES_WEBDRIVERIO = ['fourWords', 'threeWords']
DUMMY_TEST_SUITES = ['fourWords', 'oneword', 'threeWords', 'twoWords']

DUMMY_CONF_FILES = os.path.join(
    os.getcwd(), 'core', 'tests', 'data', 'dummy_ci_tests')


class CheckE2eTestsCapturedInCITests(test_utils.GenericTestBase):
    """Test the methods which performs CI config files and
    protractor.conf.js sync checks.
    """

    def test_read_ci_file(self) -> None:
        ci_filepath = os.path.join(DUMMY_CONF_FILES)

        ci_filepath_swap = self.swap(
            check_e2e_tests_are_captured_in_ci, 'CI_PATH',
            ci_filepath)
        with ci_filepath_swap:
            actual_ci_list = (
                check_e2e_tests_are_captured_in_ci
                .read_and_parse_ci_config_files())
            self.assertEqual(EXPECTED_CI_LIST, actual_ci_list)

    def test_read_protractor_file(self) -> None:
        protractor_config_file = os.path.join(
            DUMMY_CONF_FILES, 'dummy_protractor.conf.js')

        protractor_config_file_swap = self.swap(
            check_e2e_tests_are_captured_in_ci, 'PROTRACTOR_CONF_FILE_PATH',
            protractor_config_file)
        with protractor_config_file_swap:
            actual_protractor_config_file = (
                check_e2e_tests_are_captured_in_ci.read_protractor_conf_file())
        self.assertEqual(
            EXPECTED_PROTRACTOR_CONF_FILE, actual_protractor_config_file)

    def test_read_webdriverio_file(self) -> None:
        webdriverio_config_file = os.path.join(
            DUMMY_CONF_FILES, 'dummy_webdriverio.conf.js')

        webdriverio_config_file_swap = self.swap(
            check_e2e_tests_are_captured_in_ci, 'WEBDRIVERIO_CONF_FILE_PATH',
            webdriverio_config_file)
        with webdriverio_config_file_swap:
            actual_webdriverio_config_file = (
                check_e2e_tests_are_captured_in_ci.read_webdriverio_conf_file())
        self.assertEqual(
            EXPECTED_WEBDRIVERIO_CONF_FILE, actual_webdriverio_config_file)

    def test_get_e2e_suite_names_from_script_ci_files(self) -> None:
        def mock_read_ci_config_file() -> List[str]:
            return EXPECTED_CI_LIST

        dummy_path = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'read_and_parse_ci_config_files',
            mock_read_ci_config_file)
        with dummy_path:
            actual_ci_suite_names = (
                check_e2e_tests_are_captured_in_ci
                .get_e2e_suite_names_from_ci_config_file())
        self.assertEqual(DUMMY_TEST_SUITES, actual_ci_suite_names)

    def test_get_e2e_suite_names_from_protractor_file(self) -> None:
        def mock_read_protractor_conf_file() -> str:
            protractor_config_file = utils.open_file(
                os.path.join(
                    DUMMY_CONF_FILES, 'dummy_protractor.conf.js'), 'r').read()
            return protractor_config_file

        dummy_path = self.swap(
            check_e2e_tests_are_captured_in_ci, 'read_protractor_conf_file',
            mock_read_protractor_conf_file)
        with dummy_path:
            actual_protractor_suites = (
                check_e2e_tests_are_captured_in_ci
                .get_e2e_suite_names_from_protractor_file())
        self.assertEqual(DUMMY_TEST_SUITES_PROTRACTOR, actual_protractor_suites)

    def test_get_e2e_suite_names_from_webdriverio_file(self) -> None:
        def mock_read_webdriverio_conf_file() -> str:
            webdriverio_config_file = utils.open_file(
                os.path.join(
                    DUMMY_CONF_FILES, 'dummy_webdriverio.conf.js'), 'r').read()
            return webdriverio_config_file

        dummy_path = self.swap(
            check_e2e_tests_are_captured_in_ci, 'read_webdriverio_conf_file',
            mock_read_webdriverio_conf_file)
        with dummy_path:
            actual_webdriverio_suites = (
                check_e2e_tests_are_captured_in_ci
                .get_e2e_suite_names_from_webdriverio_file())
        self.assertEqual(
            DUMMY_TEST_SUITES_WEBDRIVERIO, actual_webdriverio_suites)

    def test_main_with_invalid_test_suites(self) -> None:
        def mock_get_e2e_suite_names_from_protractor_file() -> List[str]:
            return ['oneword', 'fourWord', 'invalid', 'notPresent']

        def mock_get_e2e_suite_names_from_webdriverio_file() -> List[str]:
            return ['oneword', 'fourWord', 'invalid', 'notPresent']

        def mock_get_e2e_suite_names_from_ci() -> List[str]:
            return ['oneword', 'twoWords']
        mock_protractor_test_suites = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_suite_names_from_protractor_file',
            mock_get_e2e_suite_names_from_protractor_file)

        mock_webdriverio_test_suites = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_suite_names_from_webdriverio_file',
            mock_get_e2e_suite_names_from_webdriverio_file)

        mock_ci_scripts = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_suite_names_from_ci_config_file',
            mock_get_e2e_suite_names_from_ci)

        mock_tests_to_remove = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'TEST_SUITES_NOT_RUN_IN_CI', ['fourWord'])

        common_test_swap = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST',
            'oneword')

        with common_test_swap, mock_tests_to_remove:
            with mock_protractor_test_suites:
                with mock_webdriverio_test_suites:
                    with mock_ci_scripts:
                        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                            Exception,
                            re.escape(
                                'Protractor and WebdriverIO test suites and CI '
                                'test suites are not in sync. '
                                'Following suites are not in sync: '
                                '[\'invalid\', \'notPresent\']'
                            )
                        ):
                            check_e2e_tests_are_captured_in_ci.main()

    def test_main_with_missing_test_fail(self) -> None:
        def mock_get_e2e_suite_names() -> List[str]:
            return ['oneword', 'twoWords']

        mock_ci_scripts = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_suite_names_from_ci_config_file',
            mock_get_e2e_suite_names)

        mock_protractor_test_suites = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_suite_names_from_protractor_file',
            mock_get_e2e_suite_names)

        mock_tests_not_in_ci = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'TEST_SUITES_NOT_RUN_IN_CI', [])

        with mock_ci_scripts:
            with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                Exception, 'coreEditorAndPlayerFeatures is expected to be in '
                           'the e2e test suites extracted from the script '
                           'section of CI config files, but it is '
                           'missing.'):
                check_e2e_tests_are_captured_in_ci.main()

        with mock_protractor_test_suites, mock_tests_not_in_ci:
            with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                Exception, 'coreEditorAndPlayerFeatures is expected to be in '
                           'the e2e test suites extracted from the '
                           'protractor.conf.js file, but it is missing.'):
                check_e2e_tests_are_captured_in_ci.main()

    def test_main_with_invalid_ci_script_test_suite_length(self) -> None:
        def mock_read_ci_config_file() -> List[str]:
            return EXPECTED_CI_LIST

        def mock_return_empty_list() -> List[str]:
            return []

        ci_path_swap = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'read_and_parse_ci_config_files',
            mock_read_ci_config_file)

        mock_tests_to_remove = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'TEST_SUITES_NOT_RUN_IN_CI', [])

        mock_get_e2e_suite_names_from_ci_config_file = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_suite_names_from_ci_config_file',
            mock_return_empty_list)

        with ci_path_swap, mock_tests_to_remove:
            with mock_get_e2e_suite_names_from_ci_config_file:
                with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                    Exception, 'The e2e test suites that have been extracted '
                               'from script section from CI config files '
                               'are empty.'):
                    check_e2e_tests_are_captured_in_ci.main()

    def test_main_with_invalid_protractor_test_suite_length(self) -> None:
        def mock_read_protractor_conf_file() -> str:
            protractor_config_file = utils.open_file(
                os.path.join(
                    DUMMY_CONF_FILES, 'dummy_protractor.conf.js'), 'r').read()
            return protractor_config_file

        def mock_return_empty_list() -> List[str]:
            return []

        def mock_get_e2e_test_filenames_from_protractor_dir() -> List[str]:
            return ['oneword.js', 'twoWords.js']

        protractor_test_suite_files_swap = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_test_filenames_from_protractor_dir',
            mock_get_e2e_test_filenames_from_protractor_dir)

        protractor_path_swap = self.swap(
            check_e2e_tests_are_captured_in_ci, 'read_protractor_conf_file',
            mock_read_protractor_conf_file)

        mock_tests_to_remove = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'TEST_SUITES_NOT_RUN_IN_CI', [])

        mock_e2e_test_suites = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_suite_names_from_protractor_file',
            mock_return_empty_list)

        with protractor_path_swap, mock_tests_to_remove:
            with mock_e2e_test_suites, protractor_test_suite_files_swap:
                with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                    Exception, 'The e2e test suites that have been extracted'
                               ' from protractor.conf.js are empty.'):
                    check_e2e_tests_are_captured_in_ci.main()

    def test_main_with_invalid_webdriverio_test_suite_length(self) -> None:
        def mock_read_webdriverio_conf_file() -> str:
            webdriverio_config_file = utils.open_file(
                os.path.join(
                    DUMMY_CONF_FILES, 'dummy_webdriverio.conf.js'), 'r').read()
            return webdriverio_config_file

        def mock_return_empty_list() -> List[str]:
            return []

        def mock_get_e2e_test_filenames_from_webdriverio_dir() -> List[str]:
            return ['fourWords.js', 'threeWords.js']

        webdriverio_test_suite_files_swap = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_test_filenames_from_webdriverio_dir',
            mock_get_e2e_test_filenames_from_webdriverio_dir)

        webdriverio_path_swap = self.swap(
            check_e2e_tests_are_captured_in_ci, 'read_webdriverio_conf_file',
            mock_read_webdriverio_conf_file)

        mock_tests_to_remove = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'TEST_SUITES_NOT_RUN_IN_CI', [])

        mock_e2e_test_suites = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_suite_names_from_webdriverio_file',
            mock_return_empty_list)

        with webdriverio_path_swap, mock_tests_to_remove:
            with mock_e2e_test_suites, webdriverio_test_suite_files_swap:
                with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                    Exception, 'The e2e test suites that have been extracted'
                               ' from wdio.conf.js are empty.'):
                    check_e2e_tests_are_captured_in_ci.main()

    def test_main_with_missing_file_from_protractor_conf_file_fail(
        self
    ) -> None:
        def mock_get_e2e_test_filenames_from_protractor_dir() -> List[str]:
            return ['oneword.js', 'twoWords.js']

        protractor_test_suite_files_swap = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_test_filenames_from_protractor_dir',
            mock_get_e2e_test_filenames_from_protractor_dir)

        with protractor_test_suite_files_swap:
            with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                Exception, 'One or more test file from protractor or '
                           'protractor_desktop directory is missing from '
                           'protractor.conf.js'):
                check_e2e_tests_are_captured_in_ci.main()

    def test_main_with_missing_file_from_webdriverio_conf_file_fail(
        self
    ) -> None:
        def mock_get_e2e_test_filenames_from_webdriverio_dir() -> List[str]:
            return ['fourWords.js', 'threeWords.js']

        webdriverio_test_suite_files_swap = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_test_filenames_from_webdriverio_dir',
            mock_get_e2e_test_filenames_from_webdriverio_dir)

        with webdriverio_test_suite_files_swap:
            with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                Exception, 'One or more test file from webdriverio or '
                           'webdriverio_desktop directory is missing from '
                           'wdio.conf.js'):
                check_e2e_tests_are_captured_in_ci.main()

    def test_main_without_errors(self) -> None:
        def mock_get_e2e_test_filenames_from_protractor_dir() -> List[str]:
            return ['oneword.js', 'twoWords.js']

        def mock_read_protractor_conf_file() -> str:
            protractor_config_file = utils.open_file(
                os.path.join(
                    DUMMY_CONF_FILES, 'dummy_protractor.conf.js'), 'r').read()
            return protractor_config_file

        def mock_get_e2e_test_filenames_from_webdriverio_dir() -> List[str]:
            return ['fourWords.js', 'threeWords.js']

        def mock_read_webdriverio_conf_file() -> str:
            webdriverio_config_file = utils.open_file(
                os.path.join(
                    DUMMY_CONF_FILES, 'dummy_webdriverio.conf.js'), 'r').read()
            return webdriverio_config_file

        def mock_read_ci_config() -> List[str]:
            return EXPECTED_CI_LIST

        protractor_test_suite_files_swap = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_test_filenames_from_protractor_dir',
            mock_get_e2e_test_filenames_from_protractor_dir)
        protractor_path_swap = self.swap(
            check_e2e_tests_are_captured_in_ci, 'read_protractor_conf_file',
            mock_read_protractor_conf_file)
        webdriverio_test_suite_files_swap = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'get_e2e_test_filenames_from_webdriverio_dir',
            mock_get_e2e_test_filenames_from_webdriverio_dir)
        webdriverio_path_swap = self.swap(
            check_e2e_tests_are_captured_in_ci, 'read_webdriverio_conf_file',
            mock_read_webdriverio_conf_file)
        ci_path_swap = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'read_and_parse_ci_config_files', mock_read_ci_config)
        common_test_swap = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST',
            'oneword')

        mock_tests_to_remove = self.swap(
            check_e2e_tests_are_captured_in_ci,
            'TEST_SUITES_NOT_RUN_IN_CI', [])

        with protractor_path_swap, ci_path_swap, mock_tests_to_remove:
            with common_test_swap, protractor_test_suite_files_swap:
                with webdriverio_path_swap, webdriverio_test_suite_files_swap:
                    check_e2e_tests_are_captured_in_ci.main()


EXPECTED_CI_LIST = [
    """name: End-to-End tests
jobs:
  e2e_additional_editor_and_player:
    steps:
      - name: Run Additional Editor E2E Test
        if: startsWith(github.head_ref, 'update-changelog-for-release') == false
        run: python -m scripts.run_e2e_tests --suite="oneword" --prod_env
      - name: Run Additional Player E2E Test
        if: startsWith(github.head_ref, 'update-changelog-for-release') == false
        run: python -m scripts.run_e2e_tests --suite="twoWords" --prod_env
      - name: Run Additional Editor E2E Test
        if: startsWith(github.head_ref, 'update-changelog-for-release') == false
        run: python -m scripts.run_e2e_tests --suite="threeWords" --prod_env
      - name: Run Additional Player E2E Test
        if: startsWith(github.head_ref, 'update-changelog-for-release') == false
        run: python -m scripts.run_e2e_tests --suite="fourWords" --prod_env
"""]

EXPECTED_PROTRACTOR_CONF_FILE = """var path = require('path')
var suites = {
  oneword: [
    'protractor/oneword.js'
  ],

  twoWords: [
    'protractor_desktop/twoWords.js'
  ]
};
"""

EXPECTED_WEBDRIVERIO_CONF_FILE = """var path = require('path')
var suites = {
  threeWords: [
    'webdriverio/threeWords.js'
  ],

  fourWords: [
    'webdriverio_desktop/fourWords.js'
  ]
};
"""
