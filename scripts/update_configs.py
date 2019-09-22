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

"""Helper script used for updating feconf.

ONLY RELEASE COORDINATORS SHOULD USE THIS SCRIPT.

Usage: Run this script from your oppia root folder:

    python -m scripts.update_configs
"""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re

import python_utils

from . import common

FECONF_CONFIG_PATH = os.path.join(
    os.getcwd(), os.pardir, 'release-scripts', 'feconf_updates.config')
CONSTANTS_CONFIG_PATH = os.path.join(
    os.getcwd(), os.pardir, 'release-scripts', 'constants_updates.config')
LOCAL_FECONF_PATH = os.path.join(os.getcwd(), 'feconf.py')
LOCAL_CONSTANTS_PATH = os.path.join(os.getcwd(), 'assets', 'constants.ts')


def _apply_changes_based_on_config(
        local_filepath, config_filepath, expected_config_line_regex):
    """Updates the local file based on the deployment configuration specified
    in the config file.

    Each line of the config file should match the expected config line regex.

    Args:
        local_filepath: str. Absolute path of the local file to be modified.
        config_filepath: str. Absolute path of the config file to use.
        expected_config_line_regex: str. The regex to use to verify each line
            of the config file. It should have a single group, which
            corresponds to the prefix to extract.
    """
    with python_utils.open_file(config_filepath, 'r') as config_file:
        config_lines = config_file.read().splitlines()

    with python_utils.open_file(local_filepath, 'r') as local_file:
        local_lines = local_file.read().splitlines()

    local_filename = os.path.basename(local_filepath)
    config_filename = os.path.basename(config_filepath)

    # First, verify the config file.
    local_line_numbers = []
    for config_line in config_lines:
        match_result = re.match(expected_config_line_regex, config_line)
        if match_result is None:
            raise Exception(
                'Invalid line in %s config file: %s' %
                (config_filename, config_line))

        matching_local_line_numbers = [
            line_number for (line_number, line) in enumerate(local_lines)
            if line.startswith(match_result.group(1))]
        assert len(matching_local_line_numbers) == 1, (
            'Could not find correct number of lines in %s matching: %s' %
            (local_filename, config_line))
        local_line_numbers.append(matching_local_line_numbers[0])

    # Then, apply the changes.
    for index, config_line in enumerate(config_lines):
        local_lines[local_line_numbers[index]] = config_line

    with python_utils.open_file(local_filepath, 'w') as writable_local_file:
        writable_local_file.write('\n'.join(local_lines) + '\n')


def _update_configs():
    """Updates the 'feconf.py' and 'constants.ts' files after doing the
    prerequisite checks.
    """
    # Do prerequisite checks.
    common.require_cwd_to_be_oppia()
    assert common.get_current_branch_name().startswith('release-')
    common.ensure_release_scripts_folder_exists_and_is_up_to_date()

    _apply_changes_based_on_config(
        LOCAL_FECONF_PATH, FECONF_CONFIG_PATH, '^([A-Z_]+ = ).*$')
    _apply_changes_based_on_config(
        LOCAL_CONSTANTS_PATH, CONSTANTS_CONFIG_PATH, '^(  "[A-Z_]+": ).*$')

    python_utils.PRINT(
        'Done! Please check manually to ensure all the changes are correct.')


if __name__ == '__main__':
    _update_configs()
