# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

    python scripts/update_feconf.py
"""

import os

import common  # pylint: disable=relative-import

FECONF_CONFIG_PATH = os.path.join(
    os.getcwd(), os.pardir, 'release-scripts', 'feconf_updates.config')
LOCAL_FECONF_PATH = os.path.join(os.getcwd(), 'feconf.py')


def _apply_changes_to_feconf():
    """Each line of the file should have a single '=' character and match a
    line in feconf.py.
    """
    with open(FECONF_CONFIG_PATH, 'r') as f1:
        config_lines = f1.read().splitlines()

    with open(LOCAL_FECONF_PATH, 'r') as f2:
        feconf_lines = f2.read().splitlines()

    # First, verify the config file.
    feconf_line_numbers = []
    for config_line in config_lines:
        assert config_line.count('=') == 1, (
            'Invalid line in feconf config file: %s' % config_line)
        config_line_parts = config_line.split('=')
        # We intentionally check for the space before the '=' to avoid possible
        # overlap with prefixes.
        assert config_line_parts[0].endswith(' ')
        matching_feconf_line_numbers = [
            feconf_line_number
            for (feconf_line_number, feconf_line) in enumerate(feconf_lines)
            if feconf_line.startswith(config_line_parts[0])]
        assert len(matching_feconf_line_numbers) == 1, (
            'Could not find correct number of lines in feconf.py matching: %s'
            % config_line)
        feconf_line_numbers.append(matching_feconf_line_numbers[0])

    # Then, apply the changes.
    for index, config_line in enumerate(config_lines):
        feconf_lines[feconf_line_numbers[index]] = config_line

    with open(LOCAL_FECONF_PATH, 'w') as f3:
        f3.write('\n'.join(feconf_lines) + '\n')


def _update_feconf():
    """Updates the 'feconf.py' file after doing the prerequisite checks."""
    # Do prerequisite checks.
    common.require_cwd_to_be_oppia()
    assert common.get_current_branch_name().startswith('release-')
    common.ensure_release_scripts_folder_exists_and_is_up_to_date()

    _apply_changes_to_feconf()
    print 'Done! Please check manually to ensure all the changes are correct.'


if __name__ == '__main__':
    _update_feconf()
