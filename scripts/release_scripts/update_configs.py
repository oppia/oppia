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

import getpass
import os
import re
import sys

import python_utils
import release_constants
from scripts import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position

FECONF_CONFIG_PATH = os.path.join(
    os.getcwd(), os.pardir, 'release-scripts', 'feconf_updates.config')
CONSTANTS_CONFIG_PATH = os.path.join(
    os.getcwd(), os.pardir, 'release-scripts', 'constants_updates.config')
LOCAL_FECONF_PATH = os.path.join(os.getcwd(), 'feconf.py')
LOCAL_CONSTANTS_PATH = os.path.join(os.getcwd(), 'assets', 'constants.ts')
FECONF_REGEX = '^([A-Z_]+ = ).*$'
CONSTANTS_REGEX = '^(  "[A-Z_]+": ).*$'
TERMS_PAGE_URL = (
    'https://github.com/oppia/oppia/commits/develop/core/'
    'templates/dev/head/pages/terms-page/terms-page.mainpage.html')


def apply_changes_based_on_config(
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


def check_updates_to_terms_of_service(personal_access_token):
    """Checks if updates are made to terms of service and updates
    REGISTRATION_PAGE_LAST_UPDATED_UTC in feconf.py if there are updates.

    Args:
        personal_access_token: str. The personal access token for the
            GitHub id of user.
    """
    g = github.Github(personal_access_token)
    repo = g.get_organization('oppia').get_repo('oppia')

    common.open_new_tab_in_browser_if_possible(TERMS_PAGE_URL)
    python_utils.PRINT(
        'Are the terms of service changed? Check commits/changes made '
        'to the file: terms-page.mainpage.html. Enter y/ye/yes if they '
        'are changed else enter n/no.')
    terms_of_service_are_changed = python_utils.INPUT().lower()
    while terms_of_service_are_changed not in ['y', 'ye', 'yes', 'n', 'no']:
        python_utils.PRINT(
            'Invalid Input: %s. Please enter yes or no.' % (
                terms_of_service_are_changed))
        terms_of_service_are_changed = python_utils.INPUT().lower()

    if terms_of_service_are_changed in (
            release_constants.AFFIRMATIVE_CONFIRMATIONS):
        python_utils.PRINT(
            'Enter sha of the commit which changed the terms of service.')
        commit_sha = python_utils.INPUT().lstrip().rstrip()
        commit_time = repo.get_commit(commit_sha).commit.committer.date
        time_tuple = (
            commit_time.year, commit_time.month, commit_time.day,
            commit_time.hour, commit_time.minute, commit_time.second)
        feconf_lines = []
        with python_utils.open_file(LOCAL_FECONF_PATH, 'r') as f:
            feconf_lines = f.readlines()
        with python_utils.open_file(LOCAL_FECONF_PATH, 'w') as f:
            for line in feconf_lines:
                if line.startswith('REGISTRATION_PAGE_LAST_UPDATED_UTC'):
                    line = (
                        'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
                        'datetime.datetime(%s, %s, %s, %s, %s, %s)\n' % (
                            time_tuple))
                f.write(line)


def add_mailgun_api_key():
    """Adds mailgun api key to feconf.py."""
    mailgun_api_key = getpass.getpass(
        prompt=('Enter mailgun api key from the release process doc.'))

    if re.match('^key-[a-z0-9]{32}$', mailgun_api_key) is None:
        raise Exception('Invalid mailgun api key.')

    feconf_lines = []
    with python_utils.open_file(LOCAL_FECONF_PATH, 'r') as f:
        feconf_lines = f.readlines()

    assert 'MAILGUN_API_KEY = None\n' in feconf_lines

    with python_utils.open_file(LOCAL_FECONF_PATH, 'w') as f:
        for line in feconf_lines:
            if line == 'MAILGUN_API_KEY = None\n':
                line = line.replace('None', '\'%s\'' % mailgun_api_key)
            f.write(line)


def main(personal_access_token):
    """Updates the files corresponding to LOCAL_FECONF_PATH and
    LOCAL_CONSTANTS_PATH after doing the prerequisite checks.

    Args:
        personal_access_token: str. The personal access token for the
            GitHub id of user.
    """
    # Do prerequisite checks.
    common.require_cwd_to_be_oppia()
    assert common.is_current_branch_a_release_branch()
    common.ensure_release_scripts_folder_exists_and_is_up_to_date()
    try:
        python_utils.url_open(TERMS_PAGE_URL)
    except Exception:
        raise Exception('Terms mainpage does not exist on Github.')

    try:
        check_updates_to_terms_of_service(personal_access_token)
        add_mailgun_api_key()

        apply_changes_based_on_config(
            LOCAL_FECONF_PATH, FECONF_CONFIG_PATH, FECONF_REGEX)
        apply_changes_based_on_config(
            LOCAL_CONSTANTS_PATH, CONSTANTS_CONFIG_PATH, CONSTANTS_REGEX)
    except Exception as e:
        common.run_cmd([
            'git', 'checkout', '--', LOCAL_FECONF_PATH, LOCAL_CONSTANTS_PATH])
        raise Exception(e)

    common.ask_user_to_confirm(
        'Done! Please check manually to ensure all the changes are correct.')
