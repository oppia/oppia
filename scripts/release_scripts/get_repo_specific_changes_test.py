# coding: utf-8
#
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

"""Unit tests for scripts/release_scripts/get_repo_specific_changes.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from core.tests import test_utils
from scripts import common
from scripts.release_scripts import get_repo_specific_changes

RELEASE_TEST_DIR = os.path.join('core', 'tests', 'release_sources', '')
MOCK_FECONF_FILEPATH = os.path.join(RELEASE_TEST_DIR, 'feconf.txt')


class GetRepoSpecificChangesTest(test_utils.GenericTestBase):
    """Test the methods for obtaining repo specific changes."""

    def test_get_changes_in_version_numbers_with_no_diff(self):
        def mock_run_cmd(unused_cmd):
            return (
                'CURRENT_STATE_SCHEMA_VERSION = 3'
                '\nCURRENT_COLLECTION_SCHEMA_VERSION = 4\n')
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        feconf_swap = self.swap(
            get_repo_specific_changes, 'FECONF_FILEPATH', MOCK_FECONF_FILEPATH)
        with run_cmd_swap, feconf_swap:
            actual_version_changes = (
                get_repo_specific_changes.get_changes_in_version_numbers(
                    'release_tag'))
        self.assertEqual(actual_version_changes, [])

    def test_get_changes_in_version_numbers_with_diff(self):
        def mock_run_cmd(unused_cmd):
            return (
                'CURRENT_STATE_SCHEMA_VERSION = 8'
                '\nCURRENT_COLLECTION_SCHEMA_VERSION = 4\n')
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        feconf_swap = self.swap(
            get_repo_specific_changes, 'FECONF_FILEPATH', MOCK_FECONF_FILEPATH)
        with run_cmd_swap, feconf_swap:
            actual_version_changes = (
                get_repo_specific_changes.get_changes_in_version_numbers(
                    'release_tag'))
        self.assertEqual(
            actual_version_changes, ['CURRENT_STATE_SCHEMA_VERSION'])

    def test_get_changes_in_setup_scripts_to_get_changed_scripts_status(self):
        def mock_run_cmd(unused_cmd):
            return 'scripts/setup.py\nscripts/setup_gae.py'
        with self.swap(common, 'run_cmd', mock_run_cmd):
            actual_scripts = (
                get_repo_specific_changes.get_changes_in_setup_scripts(
                    'release_tag'))
        expected_scripts = {
            'scripts/setup.py': True,
            'scripts/setup_gae.py': True,
            'scripts/install_third_party_libs.py': False,
            'scripts/install_third_party.py': False
        }
        self.assertEqual(actual_scripts, expected_scripts)

    def test_get_changes_in_storage_models(self):
        def mock_run_cmd(unused_cmd):
            return (
                'scripts/setup.py\nextensions/test.ts\n'
                'core/storage/activity/gae_models.py\n'
                'core/storage/user/gae_models.py')
        with self.swap(common, 'run_cmd', mock_run_cmd):
            actual_storgae_models = (
                get_repo_specific_changes.get_changes_in_storage_models(
                    'release_tag'))
        expected_storage_models = [
            'core/storage/activity/gae_models.py',
            'core/storage/user/gae_models.py']
        self.assertEqual(actual_storgae_models, expected_storage_models)

    def test_get_changes(self):
        def mock_get_changes_in_version_numbers(
                unused_release_tag_to_diff_against):
            return ['version_change']
        def mock_get_changes_in_setup_scripts(
                unused_release_tag_to_diff_against):
            return {'setup_changes': True}
        def mock_get_changes_in_storage_models(
                unused_release_tag_to_diff_against):
            return ['storage_changes']

        versions_swap = self.swap(
            get_repo_specific_changes, 'get_changes_in_version_numbers',
            mock_get_changes_in_version_numbers)
        setup_scripts_swap = self.swap(
            get_repo_specific_changes, 'get_changes_in_setup_scripts',
            mock_get_changes_in_setup_scripts)
        storage_models_swap = self.swap(
            get_repo_specific_changes, 'get_changes_in_storage_models',
            mock_get_changes_in_storage_models)

        expected_changes = [
            '\n### Feconf version changes:\nThis indicates '
            'that a migration may be needed\n\n', '* version_change\n',
            '\n### Changed setup scripts:\n', '* setup_changes\n',
            '\n### Changed storage models:\n', '* setup_changes\n']
        with versions_swap, setup_scripts_swap, storage_models_swap:
            self.assertEqual(
                get_repo_specific_changes.get_changes('release_tag'),
                expected_changes)
