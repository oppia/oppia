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

"""Test to ensure travis.yml file and protractor.conf.js have the same test suites"""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re

from core.tests import test_utils
import python_utils


class TravisCIFileTests(test_utils.GenericTestBase):
    """Test the travis ci file and protractor.conf.js have
    same test suites."""
    def test_travis_ci(self):

        def read_protractor_conf_file():
            protractor_config_file = open(os.path.join(os.getcwd(), 'core', 'tests', 'protractor.conf.js')).read()
            # extracting suites object from protractor.conf.js
            suites_object_regex = re.compile(r'suites = {([^}]+)}')

            for match in suites_object_regex.finditer(protractor_config_file):
                suite = match.group()

            pattern2 = re.compile(r'(//.*)')
            # removing comments of the form // from suites object
            suites_object = re.sub(pattern2, '', suite)

            test_suites = suites_object[9:]
            return test_suites.count(':')

        def read_travis_yml_file():
            travis_ci_file = open(os.path.join(os.getcwd(), '.travis.yml')).read()
            travis_ci_dict = python_utils.dict_from_yaml(travis_ci_file)
            return len(travis_ci_dict['env']['jobs']), len(travis_ci_dict['script'])

        protractor_test_suites = read_protractor_conf_file()
        yaml_jobs, yaml_scripts = read_travis_yml_file()
        # subtracting 1 since protractor test suites have one extra test(full: [*.js])
        self.assertTrue((yaml_jobs == yaml_scripts) and (
                                yaml_jobs + 1 == protractor_test_suites - 1))
