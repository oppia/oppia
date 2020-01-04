# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Test to check that travis.yml file & protractor.conf.js have the
same test suites"""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re

from core.tests import test_utils
import python_utils
import utils


def extract_travis_jobs_section():
    """Extracts the env/jobs section from the .travis.yml file.

    Returns:
        list. A list of all jobs in travis.yml file.
    """
    travis_file = read_travis_yml_file()
    jobs_raw = travis_file['env']['jobs']
    suites_from_jobs = []
    for job in jobs_raw:
        suites_from_jobs.append(utils.snake_case_to_camel_case(job[14:-5].lower()))
    return suites_from_jobs


def extract_travis_script_section():
    """Extracts the script section from the .travis.yml file.

    Returns:
        list. A list of all scripts in travis.yml file.
    """
    travis_file = read_travis_yml_file()
    script_raw = travis_file['script']
    # extracting test suite from patterns like --suite="accessibility"
    hyphen_between_regex = re.compile(r'--(.+?)--')
    suites_from_script = []
    for script in script_raw:
        matches = hyphen_between_regex.finditer(script)
        for match in matches:
            suites_from_script.append(match.group()[9:-4])

    return suites_from_script


def extract_protractor_test_suites():
    """Extracts the test suites section from the .travis.yml file.

    Returns:
        list. A list of all test suites in protractor.conf.js file.
    """
    protractor_config_file = read_protractor_conf_file()
    # Extracting suites object from protractor.conf.js.
    suites_object_regex = re.compile(r'suites = {([^}]+)}')
    for match in suites_object_regex.finditer(protractor_config_file):
        suite = match.group()

    comments_regex = re.compile(r'(//.*)')
    # Removing comments of the form // from suites object.
    suites_object = re.sub(comments_regex, '', suite)

    test_suites = suites_object[10:-1]
    words = test_suites.strip().split('\n')
    protractor_suites = []
    i = 0
    # extracting tests from strings like adminPage: ['protractor_desktop/adminTabFeatures.js'],
    unwanted_keys = ['.js', '[', ']']
    while i < len(words):
        key_raw = words[i].strip().split(':')[0]
        if not any(x in key_raw for x in unwanted_keys) and len(key_raw) != 0:
            protractor_suites.append(key_raw)
        i += 1

    return protractor_suites


def read_protractor_conf_file():
    """Returns the core/tests/protractor.conf.js. file."""
    protractor_config_file = (python_utils.open_file(
        os.path.join(
            os.getcwd(), 'core', 'tests', 'protractor.conf.js'), 'r').read())
    return protractor_config_file


def read_travis_yml_file():
    """Returns the /.travis.yml file.

    Returns:
        dict. A dict parsed from the travis.yml file.
    """
    travis_ci_file = python_utils.open_file(
        os.path.join(os.getcwd(), '.travis.yml'), 'r').read()
    travis_ci_dict = utils.dict_from_yaml(travis_ci_file)
    return travis_ci_dict


class TravisCIFileTests(test_utils.GenericTestBase):
    """Test the travis ci file and protractor.conf.js have same test suites."""
    def test_travis_and_protractor_length(self):

        protractor_test_suites = extract_protractor_test_suites()
        yaml_jobs = extract_travis_jobs_section()
        yaml_scripts = extract_travis_script_section()

        # Subtracting 4 since protractor test suites have one
        # extra test(full: [*.js]), and three other tests that
        # are being run by circleCi.
        excluded_travis_tests = ['full', 'classroomPage', 'fileUploadFeatures', 'topicAndStoryEditor']
        for excluded_test in excluded_travis_tests:
            protractor_test_suites.remove(excluded_test)

        self.assertTrue((len(yaml_jobs) == len(yaml_scripts)) and (
            len(yaml_jobs) == len(protractor_test_suites)))

        protractor_test_suites.sort()
        yaml_jobs.sort()
        yaml_scripts.sort()

        self.assertTrue(protractor_test_suites.sort() == yaml_jobs.sort() and (
          yaml_jobs.sort() == yaml_scripts.sort()))
