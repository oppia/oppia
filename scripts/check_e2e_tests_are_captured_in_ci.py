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
same test suites."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re

import python_utils
import utils


def extract_travis_jobs_section():
    """Extracts the env/jobs section from the .travis.yml file.

    Returns:
        list(str). A list of all jobs in travis.yml file.
    """
    travis_file = read_travis_yml_file()
    jobs_raw = travis_file['env']['jobs']
    suites_from_jobs = []
    for job in jobs_raw:
        # The jobs are in the form RUN_E2E_TESTS_ACCESSIBILITY=true
        # so the following line removes the RUN_E2E_TESTS_(14 length)
        # and =true(5 length) part.
        suites_from_jobs.append(utils.snake_case_to_camel_case(job[14:-5].lower()))
    suites_from_jobs.sort()

    return suites_from_jobs


def extract_travis_script_section():
    """Extracts the script section from the .travis.yml file.

    Returns:
        list(str). A list of all scripts in travis.yml file.
    """
    travis_file = read_travis_yml_file()
    script_raw = travis_file['script']
    # The following line extracts the test suites from patterns like
    # --suite="accessibility" --
    hyphen_between_regex = re.compile(r'--suite="(.+?)" --')
    suites_from_script = []

    for script in script_raw:
        matches = hyphen_between_regex.finditer(script)
        for match in matches:
            # The extracted data is of the form --suite="subscriptions" --
            # hence 9 to remove --suite=" and -4 to remove " --
            suites_from_script.append(match.group()[9:-4])
    suites_from_script.sort()

    return suites_from_script


def extract_protractor_test_suites():
    """Extracts the test suites section from the .travis.yml file.

    Returns:
        list(str). A list of all test suites in protractor.conf.js file.
    """
    protractor_config_file = read_protractor_conf_file()
    # The following line extracts suite object from protractor.conf.js.
    suite = re.compile(r'suites = {([^}]+)}').findall(protractor_config_file)[0]

    # The following line extracts the keys/test suites from the suites object.
    key_regex = re.compile(r'\s(.*?):')
    protractor_suites = []
    for match in key_regex.finditer(suite):
        # Since the keys are in the form adminPage: so -1 to remove the
        # colon part :
        protractor_suites.append(match.group()[:-1].strip())

    protractor_suites.sort()
    return protractor_suites


def read_protractor_conf_file():
    """Returns the core/tests/protractor.conf.js. file.

    Returns:
        str. The protractor.conf.js as a string.
    """
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


def main():
    """Test the travis ci file and protractor.conf.js have same test suites."""
    python_utils.PRINT('Checking e2e tests are captured in travis.yml started')
    protractor_test_suites = extract_protractor_test_suites()
    yaml_jobs = extract_travis_jobs_section()
    yaml_scripts = extract_travis_script_section()

    # These 4 test suites are not present in travis ci.
    # One is extra ie. (full: [*.js]), and three other tests that
    # are being run by circleCi.
    excluded_travis_tests = [
        'full', 'classroomPage', 'fileUploadFeatures', 'topicAndStoryEditor']
    for excluded_test in excluded_travis_tests:
        protractor_test_suites.remove(excluded_test)

    if not (len(yaml_jobs) > 0 and len(yaml_scripts) > 0
            and len(protractor_test_suites) > 0):
        raise Exception('The tests suites that have been extracted from '
                        'protractor.conf.js or travis.ci are empty.')

    if not (protractor_test_suites.sort() == yaml_jobs.sort()
            and (yaml_jobs.sort() == yaml_scripts.sort())):
        raise Exception('Protractor test suites and Travis Ci test suites are not in sync.')

    python_utils.PRINT('Done!')


if __name__ == "__main__":
    main()
