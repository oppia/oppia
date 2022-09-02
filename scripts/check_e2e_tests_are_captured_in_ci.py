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

"""A script to check that the CI config files & protractor.conf.js have
the same e2e test suites.
"""

from __future__ import annotations

import os
import re

# TODO(#15567): This can be removed after Literal in utils.py is loaded
# from typing instead of typing_extensions, this will be possible after
# we migrate to Python 3.8.
from scripts import common  # isort:skip pylint: disable=wrong-import-position, unused-import

from core import utils  # isort:skip

from typing import List  # isort:skip

# These test suites are not present in CI. One is extra
# (ie. (full: [*.js])) and other test suites are being run by CircleCI.
TEST_SUITES_NOT_RUN_IN_CI = ['full']


PROTRACTOR_CONF_FILE_PATH = os.path.join(
    os.getcwd(), 'core', 'tests', 'protractor.conf.js')
WEBDRIVERIO_CONF_FILE_PATH = os.path.join(
    os.getcwd(), 'core', 'tests', 'wdio.conf.js')
SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST = 'publication'
CI_PATH = os.path.join(os.getcwd(), '.github', 'workflows')


def get_e2e_suite_names_from_ci_config_file() -> List[str]:
    """Extracts the script section from the CI config files.

    Returns:
        list(str). An alphabetically-sorted list of names of test suites
        from the script section in the CI config files.
    """
    suites_list = []
    # The following line extracts the test suites from patterns like
    # python -m scripts.run_e2e_tests --suite="accessibility".
    e2e_test_suite_regex = re.compile(r'--suite="([a-zA-Z_-]*)"')
    file_contents = read_and_parse_ci_config_files()
    for file_content in file_contents:
        suites_list.extend(e2e_test_suite_regex.findall(file_content))
    return sorted(suites_list)


def get_e2e_suite_names_from_protractor_file() -> List[str]:
    """Extracts the test suites section from the protractor.conf.js file.

    Returns:
        list(str). An alphabetically-sorted list of names of test suites
        from the protractor.conf.js file.
    """
    protractor_config_file_content = read_protractor_conf_file()
    # The following line extracts suite object from protractor.conf.js.
    suite_object_string = re.compile(
        r'suites = {([^}]+)}').findall(protractor_config_file_content)[0]

    # The following line extracts the keys/test suites from the "key: value"
    # pair from the suites object.
    key_regex = re.compile(r'\b([a-zA-Z_-]*):')
    protractor_suites = key_regex.findall(suite_object_string)

    return sorted(protractor_suites)


def get_e2e_suite_names_from_webdriverio_file() -> List[str]:
    """Extracts the test suites section from the wdio.conf.js file.

    Returns:
        list(str). An alphabetically-sorted list of names of test suites
        from the wdio.conf.js file.
    """
    webdriverio_config_file_content = read_webdriverio_conf_file()
    # The following line extracts suite object from protractor.conf.js.
    suite_object_string = re.compile(
        r'suites = {([^}]+)}').findall(webdriverio_config_file_content)[0]

    # The following line extracts the keys/test suites from the "key: value"
    # pair from the suites object.
    key_regex = re.compile(r'\b([a-zA-Z_-]*):')
    webdriverio_suites = key_regex.findall(suite_object_string)

    return sorted(webdriverio_suites)


def read_protractor_conf_file() -> str:
    """Returns the contents of core/tests/protractor.conf.js file.

    Returns:
        str. The contents of protractor.conf.js, as a string.
    """
    protractor_config_file_content = utils.open_file(
        PROTRACTOR_CONF_FILE_PATH, 'r').read()
    return protractor_config_file_content


def read_webdriverio_conf_file() -> str:
    """Returns the contents of core/tests/wdio.conf.js file.

    Returns:
        str. The contents of wdio.conf.js, as a string.
    """
    webdriverio_config_file_content = utils.open_file(
        WEBDRIVERIO_CONF_FILE_PATH, 'r').read()
    return webdriverio_config_file_content


def read_and_parse_ci_config_files() -> List[str]:
    """Returns the contents of CI config files.

    Returns:
        list(str). Contents of the CI config files.
    """
    ci_dicts = []
    for filepath in os.listdir(CI_PATH):
        if re.search(r'e2e_.*\.yml', filepath):
            ci_file_content = utils.open_file(
                os.path.join(CI_PATH, filepath), 'r').read()
            ci_dicts.append(ci_file_content)
    return ci_dicts


def get_e2e_test_filenames_from_protractor_dir() -> List[str]:
    """Extracts the names of the all test files in core/tests/protractor
    and core/tests/protractor_desktop directory.

    Returns:
        list(str). An alphabetically-sorted list of of the all test files
        in core/tests/protractor and core/tests/protractor_desktop directory.
    """
    protractor_test_suite_files = []
    protractor_files = os.path.join(
        os.getcwd(), 'core', 'tests', 'protractor')
    protractor_desktop_files = os.path.join(
        os.getcwd(), 'core', 'tests', 'protractor_desktop')
    for file_name in os.listdir(protractor_files):
        protractor_test_suite_files.append(file_name)
    for file_name in os.listdir(protractor_desktop_files):
        protractor_test_suite_files.append(file_name)

    return sorted(protractor_test_suite_files)


def get_e2e_test_filenames_from_webdriverio_dir() -> List[str]:
    """Extracts the names of the all test files in core/tests/webdriverio
    and core/tests/webdriverio_desktop directory.

    Returns:
        list(str). An alphabetically-sorted list of of the all test files
        in core/tests/webdriverio and core/tests/webdriverio_desktop directory.
    """
    webdriverio_test_suite_files = []
    webdriverio_files = os.path.join(
        os.getcwd(), 'core', 'tests', 'webdriverio')
    webdriverio_desktop_files = os.path.join(
        os.getcwd(), 'core', 'tests', 'webdriverio_desktop')
    for file_name in os.listdir(webdriverio_files):
        webdriverio_test_suite_files.append(file_name)
    for file_name in os.listdir(webdriverio_desktop_files):
        webdriverio_test_suite_files.append(file_name)

    return sorted(webdriverio_test_suite_files)


def get_e2e_test_filenames_from_protractor_conf_file() -> List[str]:
    """Extracts the filenames from the suites object of
    protractor.conf.js file.

    Returns:
        list(str). An alphabetically-sorted list of filenames extracted
        from the protractor.conf.js file.
    """
    protractor_config_file_content = read_protractor_conf_file()
    # The following line extracts suite object from protractor.conf.js.
    suite_object_string = re.compile(
        r'suites = {([^}]+)}').findall(protractor_config_file_content)[0]
    test_files_regex = re.compile(r'/([a-zA-Z]*.js)')
    e2e_test_files = test_files_regex.findall(suite_object_string)
    return sorted(e2e_test_files)


def get_e2e_test_filenames_from_webdriverio_conf_file() -> List[str]:
    """Extracts the filenames from the suites object of
    wdio.conf.js file.

    Returns:
        list(str). An alphabetically-sorted list of filenames extracted
        from the wdio.conf.js file.
    """
    webdriverio_config_file_content = read_webdriverio_conf_file()
    # The following line extracts suite object from wdio.conf.js.
    suite_object_string = re.compile(
        r'suites = {([^}]+)}').findall(webdriverio_config_file_content)[0]
    test_files_regex = re.compile(r'/([a-zA-Z]*.js)')
    e2e_test_files = test_files_regex.findall(suite_object_string)
    return sorted(e2e_test_files)


def main() -> None:
    """Test the CI config files and protractor.conf.js and wdio.conf.js
    to have same e2e test suites.
    """
    print('Checking all e2e test files are captured in protractor.conf.js...')
    protractor_test_suite_files = get_e2e_test_filenames_from_protractor_dir()
    protractor_conf_test_suites = (
        get_e2e_test_filenames_from_protractor_conf_file())

    if not protractor_test_suite_files == protractor_conf_test_suites:
        raise Exception(
            'One or more test file from protractor or protractor_desktop '
            'directory is missing from protractor.conf.js')
    print('Done!')

    print('Checking all e2e test files are captured in wdio.conf.js...')
    webdriverio_test_suite_files = (
        get_e2e_test_filenames_from_webdriverio_dir())
    webdriverio_conf_test_suites = (
        get_e2e_test_filenames_from_webdriverio_conf_file())

    if not webdriverio_test_suite_files == webdriverio_conf_test_suites:
        print(webdriverio_test_suite_files)
        print(webdriverio_conf_test_suites)
        raise Exception(
            'One or more test file from webdriverio or webdriverio_desktop '
            'directory is missing from wdio.conf.js')
    print('Done!')

    print('Checking e2e tests are captured in CI config files...')
    protractor_test_suites = get_e2e_suite_names_from_protractor_file()
    webdriverio_test_suites = get_e2e_suite_names_from_webdriverio_file()
    ci_suite_names = get_e2e_suite_names_from_ci_config_file()

    for excluded_test in TEST_SUITES_NOT_RUN_IN_CI:
        protractor_test_suites.remove(excluded_test)
        webdriverio_test_suites.remove(excluded_test)

    if not ci_suite_names:
        raise Exception(
            'The e2e test suites that have been extracted from '
            'script section from CI config files are empty.')
    if not protractor_test_suites:
        raise Exception(
            'The e2e test suites that have been extracted from '
            'protractor.conf.js are empty.')
    if not webdriverio_test_suites:
        raise Exception(
            'The e2e test suites that have been extracted from '
            'wdio.conf.js are empty.')

    if SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST not in ci_suite_names:
        raise Exception(
            '{} is expected to be in the e2e test suites '
            'extracted from the script section of CI config '
            'files, but it is missing.'
            .format(SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST))

    if SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST not in protractor_test_suites:
        raise Exception(
            '{} is expected to be in the e2e test suites '
            'extracted from the protractor.conf.js file, '
            'but it is missing.'
            .format(SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST))

    if set(protractor_test_suites).union(set(webdriverio_test_suites)) != (
        set(ci_suite_names)):
        raise Exception(
            'Protractor and WebdriverIO test suites and CI test suites are '
            'not in sync. '
            'Following suites are not in sync: {}'.format(
                utils.compute_list_difference(
                    protractor_test_suites + webdriverio_test_suites,
                    ci_suite_names)))

    print('Done!')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_e2e_tests_are_captured_in_ci.py
# is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
