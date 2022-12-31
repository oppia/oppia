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

from __future__ import annotations

import argparse
import getpass
import os
import re

import github
from typing import Final, List, Optional

# TODO(#15567): The order can be fixed after Literal in utils.py is loaded
# from typing instead of typing_extensions, this will be possible after
# we migrate to Python 3.8.
from .. import common  # isort:skip  # pylint: disable=wrong-import-position
from core import utils  # isort:skip  # pylint: disable=wrong-import-position

CONSTANTS_CONFIG_PATH: Final = os.path.join(
    os.getcwd(), os.pardir, 'release-scripts', 'constants_updates.config')
FECONF_REGEX: Final = '^([A-Z_]+ = ).*$'
CONSTANTS_REGEX: Final = '^(  "[A-Z_]+": ).*$'
TERMS_PAGE_FOLDER_URL: Final = (
    'https://github.com/oppia/oppia/commits/develop/core/'
    'templates/pages/terms-page')

_PARSER: Final = argparse.ArgumentParser(description='Updates configs.')
_PARSER.add_argument(
    '--release_dir_path',
    dest='release_dir_path',
    help='Path of directory where all files are copied for release.',
    required=True)
_PARSER.add_argument(
    '--deploy_data_path',
    dest='deploy_data_path',
    help='Path for deploy data directory.',
    required=True)
_PARSER.add_argument(
    '--personal_access_token',
    dest='personal_access_token',
    help='The personal access token for the GitHub id of user.',
    default=None)
_PARSER.add_argument(
    '--prompt_for_mailgun_and_terms_update',
    action='store_true',
    default=False,
    dest='prompt_for_mailgun_and_terms_update',
    help='Whether to update mailgun api and last updated time for terms page.')


def apply_changes_based_on_config(
    local_filepath: str, config_filepath: str, expected_config_line_regex: str
) -> None:
    """Updates the local file based on the deployment configuration specified
    in the config file.

    Each line of the config file should match the expected config line regex.

    Args:
        local_filepath: str. Absolute path of the local file to be modified.
        config_filepath: str. Absolute path of the config file to use.
        expected_config_line_regex: str. The regex to use to verify each line
            of the config file. It should have a single group, which
            corresponds to the prefix to extract.

    Raises:
        Exception. Line(s) in config file are not matching with the regex.
    """
    with utils.open_file(config_filepath, 'r') as config_file:
        config_lines = config_file.read().splitlines()

    with utils.open_file(local_filepath, 'r') as local_file:
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
            'Could not find correct number of lines in %s matching: %s, %s' %
            (local_filename, config_line, matching_local_line_numbers))
        local_line_numbers.append(matching_local_line_numbers[0])

    # Then, apply the changes.
    for index, config_line in enumerate(config_lines):
        local_lines[local_line_numbers[index]] = config_line

    with utils.open_file(local_filepath, 'w') as writable_local_file:
        writable_local_file.write('\n'.join(local_lines) + '\n')


def check_updates_to_terms_of_service(
    release_feconf_path: str, personal_access_token: str
) -> None:
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
    print(
        'Are the terms of service changed? Check commits/changes made '
        'to the files in: core/templates/pages/terms-page. '
        'Enter y/ye/yes if they are changed else enter n/no.')
    terms_of_service_are_changed = input().lower()
    while terms_of_service_are_changed not in ['y', 'ye', 'yes', 'n', 'no']:
        print(
            'Invalid Input: %s. Please enter yes or no.' % (
                terms_of_service_are_changed))
        terms_of_service_are_changed = input().lower()

    if terms_of_service_are_changed in (
            common.AFFIRMATIVE_CONFIRMATIONS):
        print('Enter sha of the commit which changed the terms of service.')
        commit_sha = input().lstrip().rstrip()
        commit_time = repo.get_commit(commit_sha).commit.committer.date
        time_tuple = (
            commit_time.year, commit_time.month, commit_time.day,
            commit_time.hour, commit_time.minute, commit_time.second)
        feconf_lines = []
        with utils.open_file(release_feconf_path, 'r') as f:
            feconf_lines = f.readlines()
        with utils.open_file(release_feconf_path, 'w') as f:
            for line in feconf_lines:
                if line.startswith('REGISTRATION_PAGE_LAST_UPDATED_UTC'):
                    line = (
                        'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
                        'datetime.datetime(%s, %s, %s, %s, %s, %s)\n' % (
                            time_tuple))
                f.write(line)


def update_app_yaml(
    release_app_dev_yaml_path: str, feconf_config_path: str
) -> None:
    """Updates app.yaml file with more strict CORS HTTP header.

    Args:
        release_app_dev_yaml_path: str. Absolute path of the app_dev.yaml file.
        feconf_config_path: str. Absolute path of the feconf config file.

    Raises:
        Exception. No OPPIA_SITE_URL key found.
    """
    with utils.open_file(feconf_config_path, 'r') as feconf_config_file:
        feconf_config_contents = feconf_config_file.read()

    with utils.open_file(release_app_dev_yaml_path, 'r') as app_yaml_file:
        app_yaml_contents = app_yaml_file.read()

    oppia_site_url_searched_key = re.search(
        r'OPPIA_SITE_URL = \'(.*)\'', feconf_config_contents)
    if oppia_site_url_searched_key is None:
        raise Exception(
            'Error: No OPPIA_SITE_URL key found.'
        )
    project_origin = oppia_site_url_searched_key.group(1)
    access_control_allow_origin_header = (
        'Access-Control-Allow-Origin: %s' % project_origin)

    edited_app_yaml_contents, _ = re.subn(
        r'Access-Control-Allow-Origin: \"\*\"',
        access_control_allow_origin_header,
        app_yaml_contents
    )

    with utils.open_file(release_app_dev_yaml_path, 'w') as app_yaml_file:
        app_yaml_file.write(edited_app_yaml_contents)


def verify_config_files(
    release_feconf_path: str,
    release_app_dev_yaml_path: str,
    verify_email_api_keys: bool
) -> None:
    """Verifies that feconf is updated correctly to include
    mailgun api key, mailchimp api key and redishost.

    Args:
        release_feconf_path: str. The path to feconf file in release
            directory.
        release_app_dev_yaml_path: str. The path to app_dev.yaml file in release
            directory.
        verify_email_api_keys: bool. Whether to verify both mailgun and
            mailchimp api keys.

    Raises:
        Exception. The mailgun API key not added before deployment.
        Exception. The mailchimp API key not added before deployment.
        Exception. REDISHOST not updated before deployment.
    """
    feconf_contents = utils.open_file(
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

    with utils.open_file(release_app_dev_yaml_path, 'r') as app_yaml_file:
        app_yaml_contents = app_yaml_file.read()

    if 'Access-Control-Allow-Origin: \"*\"' in app_yaml_contents:
        raise Exception(
            '\'Access-Control-Allow-Origin: "*"\' must be updated to '
            'a specific origin before deployment.'
        )


def add_mailgun_api_key(release_feconf_path: str) -> None:
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

    with utils.open_file(release_feconf_path, 'r') as f:
        feconf_lines = f.readlines()

    assert 'MAILGUN_API_KEY = None\n' in feconf_lines, 'Missing mailgun API key'

    with utils.open_file(release_feconf_path, 'w') as f:
        for line in feconf_lines:
            if line == 'MAILGUN_API_KEY = None\n':
                line = line.replace('None', '\'%s\'' % mailgun_api_key)
            f.write(line)


def add_mailchimp_api_key(release_feconf_path: str) -> None:
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
    with utils.open_file(release_feconf_path, 'r') as f:
        feconf_lines = f.readlines()

    error_text = 'Missing mailchimp API key'
    assert 'MAILCHIMP_API_KEY = None\n' in feconf_lines, error_text

    with utils.open_file(release_feconf_path, 'w') as f:
        for line in feconf_lines:
            if line == 'MAILCHIMP_API_KEY = None\n':
                line = line.replace('None', '\'%s\'' % mailchimp_api_key)
            f.write(line)


def update_analytics_constants_based_on_config(
    release_analytics_constants_path: str,
    analytics_constants_config_path: str
) -> None:
    """Updates the GA4 and UA IDs in the analytics constants JSON file.

    Args:
        release_analytics_constants_path: str. The path to constants file.
        analytics_constants_config_path: str. The path to constants config file.

    Raises:
        Exception. No GA_ANALYTICS_ID key found.
        Exception. No UA_ANALYTICS_ID key found.
        Exception. No SITE_NAME_FOR_ANALYTICS key found.
        Exception. No CAN_SEND_ANALYTICS_EVENTS key found.
    """
    with utils.open_file(analytics_constants_config_path, 'r') as config_file:
        config_file_contents = config_file.read()
    ga_analytics_searched_key = re.search(
        r'"GA_ANALYTICS_ID": "(.*)"', config_file_contents)
    if ga_analytics_searched_key is None:
        raise Exception(
            'Error: No GA_ANALYTICS_ID key found.'
        )
    ga_analytics_id = ga_analytics_searched_key.group(1)
    ua_analytics_searched_key = re.search(
        r'"UA_ANALYTICS_ID": "(.*)"', config_file_contents)
    if ua_analytics_searched_key is None:
        raise Exception(
            'Error: No UA_ANALYTICS_ID key found.'
        )
    ua_analytics_id = ua_analytics_searched_key.group(1)
    site_name_for_analytics_searched_key = re.search(
        r'"SITE_NAME_FOR_ANALYTICS": "(.*)"', config_file_contents)
    if site_name_for_analytics_searched_key is None:
        raise Exception(
            'Error: No SITE_NAME_FOR_ANALYTICS key found.'
        )
    site_name_for_analytics = site_name_for_analytics_searched_key.group(1)
    can_send_analytics_events_searched_key = re.search(
        r'"CAN_SEND_ANALYTICS_EVENTS": (true|false)',
        config_file_contents)
    if can_send_analytics_events_searched_key is None:
        raise Exception(
            'Error: No CAN_SEND_ANALYTICS_EVENTS key found.'
        )
    can_send_analytics_events = can_send_analytics_events_searched_key.group(1)
    common.inplace_replace_file(
        release_analytics_constants_path,
        '"GA_ANALYTICS_ID": ""',
        '"GA_ANALYTICS_ID": "%s"' % ga_analytics_id)
    common.inplace_replace_file(
        release_analytics_constants_path,
        '"UA_ANALYTICS_ID": ""',
        '"UA_ANALYTICS_ID": "%s"' % ua_analytics_id)
    common.inplace_replace_file(
        release_analytics_constants_path,
        '"SITE_NAME_FOR_ANALYTICS": ""',
        '"SITE_NAME_FOR_ANALYTICS": "%s"' % site_name_for_analytics)
    common.inplace_replace_file(
        release_analytics_constants_path,
        '"CAN_SEND_ANALYTICS_EVENTS": false',
        '"CAN_SEND_ANALYTICS_EVENTS": %s' % can_send_analytics_events)


def main(args: Optional[List[str]] = None) -> None:
    """Updates the files corresponding to LOCAL_FECONF_PATH and
    LOCAL_CONSTANTS_PATH after doing the prerequisite checks.
    """
    options = _PARSER.parse_args(args=args)

    # Do prerequisite checks.
    feconf_config_path = os.path.join(
        options.deploy_data_path, 'feconf_updates.config')
    constants_config_path = os.path.join(
        options.deploy_data_path, 'constants_updates.config')
    analytics_constants_config_path = os.path.join(
        options.deploy_data_path, 'analytics_constants_updates.config')

    release_feconf_path = os.path.join(
        options.release_dir_path, common.FECONF_PATH)
    release_constants_path = os.path.join(
        options.release_dir_path, common.CONSTANTS_FILE_PATH)
    release_app_dev_yaml_path = os.path.join(
        options.release_dir_path, common.APP_DEV_YAML_PATH)
    release_analytics_constants_path = os.path.join(
        options.release_dir_path, common.ANALYTICS_CONSTANTS_FILE_PATH)

    if options.prompt_for_mailgun_and_terms_update:
        try:
            utils.url_open(TERMS_PAGE_FOLDER_URL)
        except Exception as e:
            raise Exception('Terms mainpage does not exist on Github.') from e
        add_mailgun_api_key(release_feconf_path)
        add_mailchimp_api_key(release_feconf_path)
        check_updates_to_terms_of_service(
            release_feconf_path, options.personal_access_token)

    apply_changes_based_on_config(
        release_feconf_path, feconf_config_path, FECONF_REGEX)
    apply_changes_based_on_config(
        release_constants_path, constants_config_path, CONSTANTS_REGEX)
    update_app_yaml(release_app_dev_yaml_path, feconf_config_path)
    update_analytics_constants_based_on_config(
        release_analytics_constants_path,
        analytics_constants_config_path)
    verify_config_files(
        release_feconf_path,
        release_app_dev_yaml_path,
        options.prompt_for_mailgun_and_terms_update
    )


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when deploy.py is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
