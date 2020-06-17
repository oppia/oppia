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

"""A script to check that travis.yml file & protractor.conf.js have the
same e2e test suites.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re

import python_utils
import utils

# These 4 test suites are not present in travis ci.
# One is extra (ie. (full: [*.js])) and three other test suites are
# are being run by CircleCI.
TEST_SUITES_NOT_RUN_ON_TRAVIS = [
    'full', 'adminPage', 'accessibility', 'classroomPage',
    'classroomPageFileUploadFeatures', 'collections', 'embedding',
    'fileUploadFeatures', 'library', 'navigation', 'preferences',
    'profileFeatures', 'profileMenu', 'publication', 'subscriptions',
    'topicsAndSkillsDashboard', 'topicAndStoryEditor',
    'topicAndStoryEditorFileUploadFeatures', 'users']

TRAVIS_CI_FILE_PATH = os.path.join(os.getcwd(), '.travis.yml')
PROTRACTOR_CONF_FILE_PATH = os.path.join(
    os.getcwd(), 'core', 'tests', 'protractor.conf.js')
SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST = 'coreEditorAndPlayerFeatures'


def get_e2e_suite_names_from_jobs_travis_yml_file():
    """Extracts the test suites from env/jobs section from
    the .travis.yml file.

    Returns:
        list(str): An alphabetically-sorted list of names of test suites
        from the jobs section in the .travis.yml file.
    """
    travis_file_content = read_and_parse_travis_yml_file()
    jobs_str = python_utils.convert_to_bytes(travis_file_content['env']['jobs'])
    suites_from_jobs = []
    # The following line extracts the test suite name from the jobs section
    # that is in the form RUN_E2E_TESTS_ACCESSIBILITY=true.
    test_regex = re.compile(r'RUN_E2E_TESTS_([A-Z_]*)=')
    jobs = test_regex.findall(jobs_str)
    for job in jobs:
        suites_from_jobs.append(
            utils.snake_case_to_camel_case(job.lower()))

    return sorted(suites_from_jobs)


def get_e2e_suite_names_from_script_travis_yml_file():
    """Extracts the script section from the .travis.yml file.

    Returns:
        list(str): An alphabetically-sorted list of names of test suites
        from the script section in the .travis.yml file.
    """
    travis_file_content = read_and_parse_travis_yml_file()
    script_str = python_utils.convert_to_bytes(travis_file_content['script'])
    # The following line extracts the test suites from patterns like
    # python -m scripts.run_e2e_tests --suite="accessibility".
    e2e_test_suite_regex = re.compile(
        r'python -m scripts.run_e2e_tests --suite="([a-zA-Z_-]*)"')
    suites_list = e2e_test_suite_regex.findall(script_str)

    return sorted(suites_list)


def get_e2e_suite_names_from_protractor_file():
    """Extracts the test suites section from the protractor.conf.js file.

    Returns:
        list(str): An alphabetically-sorted list of names of test suites
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


def read_protractor_conf_file():
    """Returns the contents of core/tests/protractor.conf.js file.

    Returns:
        str. The contents of protractor.conf.js, as a string.
    """
    protractor_config_file_content = python_utils.open_file(
        PROTRACTOR_CONF_FILE_PATH, 'r').read()
    return protractor_config_file_content


def read_and_parse_travis_yml_file():
    """Returns the contents of .travis.yml, as a dict.

    Returns:
        dict. Contents of the .travis.yml file parsed as a dict.
    """
    travis_ci_file_content = python_utils.open_file(
        TRAVIS_CI_FILE_PATH, 'r').read()
    travis_ci_dict = utils.dict_from_yaml(travis_ci_file_content)
    return travis_ci_dict


def get_e2e_test_filenames_from_protractor_dir():
    """Extracts the names of the all test files in core/tests/protractor
    and core/tests/protractor_desktop directory.

    Returns:
        list(str): An alphabetically-sorted list of of the all test files
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


def get_e2e_test_filenames_from_protractor_conf_file():
    """Extracts the filenames from the suites object of
    protractor.conf.js file.

    Returns:
        list(str): An alphabetically-sorted list of filenames extracted
        from the protractor.conf.js file.
    """
    protractor_config_file_content = read_protractor_conf_file()
    # The following line extracts suite object from protractor.conf.js.
    suite_object_string = re.compile(
        r'suites = {([^}]+)}').findall(protractor_config_file_content)[0]
    test_files_regex = re.compile(r'/([a-zA-Z]*.js)')
    e2e_test_files = test_files_regex.findall(suite_object_string)
    return sorted(e2e_test_files)


def main():
    """Test the travis ci file and protractor.conf.js to have same
    e2e test suites.
    """
    python_utils.PRINT('Checking all e2e test files are captured '
                       'in protractor.conf.js...')
    protractor_test_suite_files = get_e2e_test_filenames_from_protractor_dir()
    protractor_conf_test_suites = (
        get_e2e_test_filenames_from_protractor_conf_file())

    if not protractor_test_suite_files == protractor_conf_test_suites:
        raise Exception(
            'One or more test file from protractor or protractor_desktop '
            'directory is missing from protractor.conf.js')
    python_utils.PRINT('Done!')

    python_utils.PRINT('Checking e2e tests are captured in .travis.yml...')
    protractor_test_suites = get_e2e_suite_names_from_protractor_file()
    travis_e2e_jobs = get_e2e_suite_names_from_jobs_travis_yml_file()
    travis_e2e_scripts = get_e2e_suite_names_from_script_travis_yml_file()

    for excluded_test in TEST_SUITES_NOT_RUN_ON_TRAVIS:
        protractor_test_suites.remove(excluded_test)

    if not travis_e2e_jobs:
        raise Exception('The e2e test suites that have been extracted from '
                        'jobs section from travis.ci are empty.')
    if not travis_e2e_scripts:
        raise Exception('The e2e test suites that have been extracted from '
                        'script section from travis.ci are empty.')
    if not protractor_test_suites:
        raise Exception('The e2e test suites that have been extracted from '
                        'protractor.conf.js are empty.')

    if SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST not in travis_e2e_jobs:
        raise Exception('{} is expected to be in the e2e test suites '
                        'extracted from the jobs section of .travis.yml '
                        'file, but it is missing.'
                        .format(SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST))

    if SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST not in travis_e2e_scripts:
        raise Exception('{} is expected to be in the e2e test suites '
                        'extracted from the script section of .travis.yml '
                        'file, but it is missing.'
                        .format(SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST))

    if SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST not in protractor_test_suites:
        raise Exception('{} is expected to be in the e2e test suites '
                        'extracted from the protractor.conf.js file, '
                        'but it is missing.'
                        .format(SAMPLE_TEST_SUITE_THAT_IS_KNOWN_TO_EXIST))

    if not (protractor_test_suites == travis_e2e_jobs and
            travis_e2e_jobs == travis_e2e_scripts):
        raise Exception(
            'Protractor test suites and Travis Ci test suites are not in sync.')

    python_utils.PRINT('Done!')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_e2e_tests_are_captured_in_ci.py
# is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
