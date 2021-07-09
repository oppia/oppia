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

    python -m scripts.release_scripts.update_configs
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import getpass
import os
import re
import sys

import python_utils
from scripts import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(
    _PARENT_DIR, 'oppia_tools', 'PyGithub-%s' % common.PYGITHUB_VERSION)
sys.path.insert(0, _PY_GITHUB_PATH)

import github  # isort:skip pylint: disable=wrong-import-position

CONSTANTS_CONFIG_PATH = os.path.join(
    os.getcwd(), os.pardir, 'release-scripts', 'constants_updates.config')
FECONF_REGEX = '^([A-Z_]+ = ).*$'
CONSTANTS_REGEX = '^(  "[A-Z_]+": ).*$'
TERMS_PAGE_FOLDER_URL = (
    'https://github.com/oppia/oppia/commits/develop/core/'
    'templates/pages/terms-page')


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


def check_updates_to_terms_of_service(
        release_feconf_path, personal_access_token):
    """Checks if updates are made to terms of service and updates
    REGISTRATION_PAGE_LAST_UPDATED_UTC in feconf.py if there are updates.

    Args:
        release_feconf_path: str. The path to feconf file in release
            directory.
        personal_access_token: str. The personal access token for the
            GitHub id of user.
    """
    g = github.Github(personal_access_token)
    repo = g.get_organization('oppia').get_repo('oppia')

    common.open_new_tab_in_browser_if_possible(TERMS_PAGE_FOLDER_URL)
    python_utils.PRINT(
        'Are the terms of service changed? Check commits/changes made '
        'to the files in: core/templates/pages/terms-page. '
        'Enter y/ye/yes if they are changed else enter n/no.')
    terms_of_service_are_changed = python_utils.INPUT().lower()
    while terms_of_service_are_changed not in ['y', 'ye', 'yes', 'n', 'no']:
        python_utils.PRINT(
            'Invalid Input: %s. Please enter yes or no.' % (
                terms_of_service_are_changed))
        terms_of_service_are_changed = python_utils.INPUT().lower()

    if terms_of_service_are_changed in (
            common.AFFIRMATIVE_CONFIRMATIONS):
        python_utils.PRINT(
            'Enter sha of the commit which changed the terms of service.')
        commit_sha = python_utils.INPUT().lstrip().rstrip()
        commit_time = repo.get_commit(commit_sha).commit.committer.date
        time_tuple = (
            commit_time.year, commit_time.month, commit_time.day,
            commit_time.hour, commit_time.minute, commit_time.second)
        feconf_lines = []
        with python_utils.open_file(release_feconf_path, 'r') as f:
            feconf_lines = f.readlines()
        with python_utils.open_file(release_feconf_path, 'w') as f:
            for line in feconf_lines:
                if line.startswith('REGISTRATION_PAGE_LAST_UPDATED_UTC'):
                    line = (
                        'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
                        'datetime.datetime(%s, %s, %s, %s, %s, %s)\n' % (
                            time_tuple))
                f.write(line)


def verify_feconf(release_feconf_path, verify_email_api_keys):
    """Verifies that feconf is updated correctly to include
    mailgun api key, mailchimp api key and redishost.

    Args:
        release_feconf_path: str. The path to feconf file in release
            directory.
        verify_email_api_keys: bool. Whether to verify both mailgun and
            mailchimp api keys.
    """
    feconf_contents = python_utils.open_file(
        release_feconf_path, 'r').read()
    if verify_email_api_keys and (
            'MAILGUN_API_KEY' not in feconf_contents or
            'MAILGUN_API_KEY = None' in feconf_contents):
        raise Exception('The mailgun API key must be added before deployment.')

    if verify_email_api_keys and (
            'MAILCHIMP_API_KEY' not in feconf_contents or
            'MAILCHIMP_API_KEY = None' in feconf_contents):
        raise Exception(
            'The mailchimp API key must be added before deployment.')

    if ('REDISHOST' not in feconf_contents or
            'REDISHOST = \'localhost\'' in feconf_contents):
        raise Exception('REDISHOST must be updated before deployment.')


def add_mailgun_api_key(release_feconf_path):
    """Adds mailgun api key to feconf config file.

    Args:
        release_feconf_path: str. The path to feconf file in release
            directory.
    """
    mailgun_api_key = getpass.getpass(
        prompt=('Enter mailgun api key from the release process doc.'))
    mailgun_api_key = mailgun_api_key.strip()

    while re.match('^key-[a-z0-9]{32}$', mailgun_api_key) is None:
        mailgun_api_key = getpass.getpass(
            prompt=(
                'You have entered an invalid mailgun api '
                'key: %s, please retry.' % mailgun_api_key))
        mailgun_api_key = mailgun_api_key.strip()

    feconf_lines = []
    with python_utils.open_file(release_feconf_path, 'r') as f:
        feconf_lines = f.readlines()

    assert 'MAILGUN_API_KEY = None\n' in feconf_lines, 'Missing mailgun API key'

    with python_utils.open_file(release_feconf_path, 'w') as f:
        for line in feconf_lines:
            if line == 'MAILGUN_API_KEY = None\n':
                line = line.replace('None', '\'%s\'' % mailgun_api_key)
            f.write(line)


def add_mailchimp_api_key(release_feconf_path):
    """Adds mailchimp api key to feconf config file.

    Args:
        release_feconf_path: str. The path to feconf file in release
            directory.
    """
    mailchimp_api_key = getpass.getpass(
        prompt=('Enter mailchimp api key from the release process doc.'))
    mailchimp_api_key = mailchimp_api_key.strip()

    while re.match('^[a-z0-9]{32}-us18$', mailchimp_api_key) is None:
        mailchimp_api_key = getpass.getpass(
            prompt=(
                'You have entered an invalid mailchimp api '
                'key: %s, please retry.' % mailchimp_api_key))
        mailchimp_api_key = mailchimp_api_key.strip()

    feconf_lines = []
    with python_utils.open_file(release_feconf_path, 'r') as f:
        feconf_lines = f.readlines()

    error_text = 'Missing mailchimp API key'
    assert 'MAILCHIMP_API_KEY = None\n' in feconf_lines, error_text

    with python_utils.open_file(release_feconf_path, 'w') as f:
        for line in feconf_lines:
            if line == 'MAILCHIMP_API_KEY = None\n':
                line = line.replace('None', '\'%s\'' % mailchimp_api_key)
            f.write(line)


def main(
        release_dir_path, deploy_data_path, personal_access_token,
        prompt_for_mailgun_and_terms_update):
    """Updates the files corresponding to LOCAL_FECONF_PATH and
    LOCAL_CONSTANTS_PATH after doing the prerequisite checks.

    Args:
        release_dir_path: str. Path of directory where all files are copied
            for release.
        deploy_data_path: str. Path for deploy data directory.
        personal_access_token: str. The personal access token for the
            GitHub id of user.
        prompt_for_mailgun_and_terms_update: bool. Whether to update mailgun api
            and last updated time for terms page.
    """
    # Do prerequisite checks.
    feconf_config_path = os.path.join(deploy_data_path, 'feconf_updates.config')
    constants_config_path = os.path.join(
        deploy_data_path, 'constants_updates.config')

    release_feconf_path = os.path.join(release_dir_path, common.FECONF_PATH)
    release_constants_path = os.path.join(
        release_dir_path, common.CONSTANTS_FILE_PATH)

    if prompt_for_mailgun_and_terms_update:
        try:
            python_utils.url_open(TERMS_PAGE_FOLDER_URL)
        except Exception:
            raise Exception('Terms mainpage does not exist on Github.')
        add_mailgun_api_key(release_feconf_path)
        add_mailchimp_api_key(release_feconf_path)
        check_updates_to_terms_of_service(
            release_feconf_path, personal_access_token)

    apply_changes_based_on_config(
        release_feconf_path, feconf_config_path, FECONF_REGEX)
    apply_changes_based_on_config(
        release_constants_path, constants_config_path, CONSTANTS_REGEX)
    verify_feconf(release_feconf_path, prompt_for_mailgun_and_terms_update)
