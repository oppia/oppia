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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from core.tests import test_utils
import python_utils
import utils

from . import check_e2e_tests_are_captured_in_ci

TRAVIS_SUITES = [
    'accessibility', 'additionalEditorFeatures', 'additionalPlayerFeatures',
    'adminPage', 'collections', 'communityDashboard',
    'coreEditorAndPlayerFeatures', 'creatorDashboard', 'embedding',
    'explorationFeedbackTab', 'explorationHistoryTab',
    'explorationImprovementsTab', 'explorationStatisticsTab',
    'explorationTranslationTab', 'extensions', 'learner', 'learnerDashboard',
    'library', 'navigation', 'preferences', 'profileFeatures', 'profileMenu',
    'publication', 'skillEditor', 'subscriptions', 'topicsAndSkillsDashboard', 'users'
    ]


PROTRACTOR_SUITES = [
    'accessibility', 'additionalEditorFeatures', 'additionalPlayerFeatures',
    'adminPage', 'classroomPage', 'collections', 'communityDashboard',
    'coreEditorAndPlayerFeatures', 'creatorDashboard', 'embedding',
    'explorationFeedbackTab', 'explorationHistoryTab', 'explorationImprovementsTab',
    'explorationStatisticsTab', 'explorationTranslationTab', 'extensions', 'fileUploadFeatures',
    'full', 'learner', 'learnerDashboard', 'library', 'navigation', 'preferences', 'profileFeatures',
    'profileMenu', 'publication', 'skillEditor', 'subscriptions', 'topicAndStoryEditor',
    'topicsAndSkillsDashboard', 'users'
    ]


class CheckE2eTestsCapturedInCI(test_utils.GenericTestBase):
    """Test the methods which performs travis.yml and
    protractor.conf.js sync checks.
    """
    def test_read_protractor_file(self):
        expected_protractor_config_file = (python_utils.open_file(
            os.path.join(
                os.getcwd(), 'core', 'tests', 'protractor.conf.js'), 'r').read())
        actual_protractor_config_file = check_e2e_tests_are_captured_in_ci.read_protractor_conf_file()
        self.assertEqual(expected_protractor_config_file, actual_protractor_config_file)

    def test_read_travis_ci_file(self):
        travis_ci_file = python_utils.open_file(
            os.path.join(os.getcwd(), '.travis.yml'), 'r').read()
        expected_travis_ci_dict = utils.dict_from_yaml(travis_ci_file)
        actual_travis_ci_dict = check_e2e_tests_are_captured_in_ci.read_travis_yml_file()
        self.assertEqual(expected_travis_ci_dict, actual_travis_ci_dict)

    def test_extract_travis_jobs_section(self):
        actual_travis_jobs = check_e2e_tests_are_captured_in_ci.extract_travis_jobs_section()
        print actual_travis_jobs
        self.assertEqual(TRAVIS_SUITES, actual_travis_jobs)

    def test_extract_travis_script_section(self):
        actual_travis_script = check_e2e_tests_are_captured_in_ci.extract_travis_script_section()
        self.assertEqual(TRAVIS_SUITES, actual_travis_script)

    def test_extract_protractor_test_suites(self):
        actual_travis_jobs = check_e2e_tests_are_captured_in_ci.extract_protractor_test_suites()
        self.assertEqual(PROTRACTOR_SUITES, actual_travis_jobs)
