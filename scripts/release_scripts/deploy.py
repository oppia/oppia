# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""This is a deployment script for Oppia that should only be used by release
coordinators.

The script creates a build with unnecessary files removed, and saves a copy of
the uploaded files to a deployment folder in the parent directory of the oppia/
folder. It then pushes this build to the production server.

IMPORTANT NOTES:
1.  Before running this script, you must install third-party dependencies by
    running

        python -m scripts.install_third_party_libs

    at least once.

2.  This script should be run from the oppia root folder:

        python -m scripts.deploy --app_name=[app_name]

    where [app_name] is the name of your app. Note that the root folder MUST be
    named 'oppia'.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

# Pylint has issues with the import order of argparse.
# pylint: disable=wrong-import-order
import argparse
import datetime
import os
import shutil
import subprocess
import sys

import python_utils
import release_constants
from scripts import common
from scripts import install_third_party_libs
from scripts.release_scripts import gcloud_adapter
from scripts.release_scripts import update_configs
# pylint: enable=wrong-import-order

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--app_name', help='name of the app to deploy to', type=str)
_PARSER.add_argument(
    '--version', help='version to deploy', type=str)

APP_NAME_OPPIASERVER = 'oppiaserver'
APP_NAME_OPPIATESTSERVER = 'oppiatestserver'
BUCKET_NAME_SUFFIX = '-resources'

CURRENT_DATETIME = datetime.datetime.utcnow()

LOG_FILE_PATH = os.path.join('..', 'deploy.log')
INDEX_YAML_PATH = os.path.join('.', 'index.yaml')
THIRD_PARTY_DIR = os.path.join('.', 'third_party')
FECONF_PATH = os.path.join('.', 'feconf.py')
CONSTANTS_FILE_PATH = os.path.join('assets', 'constants.ts')

FILES_AT_ROOT = ['favicon.ico', 'robots.txt']
IMAGE_DIRS = ['avatar', 'general', 'sidebar', 'logo']

# Denotes length for cache slug used in production mode. It consists of
# lowercase alphanumeric characters.
CACHE_SLUG_PROD_LENGTH = 6

DOT_CHAR = '.'
HYPHEN_CHAR = '-'


def preprocess_release(app_name, deploy_data_path):
    """Pre-processes release files.

    This function should be called from within release_dir_name defined
    in execute_deployment function. Currently it does the following:

    (1) Substitutes files from the per-app deployment data.
    (2) Change the DEV_MODE constant in assets/constants.ts.
    (3) Change GCS_RESOURCE_BUCKET in assets/constants.ts.
    (4) Removes the "version" field from app.yaml, since gcloud does not like
        it (when deploying).

    Args:
        app_name: str. Name of the app to deploy.
        deploy_data_path: str. Path for deploy data directory.

    Raises:
        Exception: Could not find deploy data directory.
        Exception: Could not find source path.
        Exception: Could not find destination path.
    """
    if not os.path.exists(deploy_data_path):
        raise Exception(
            'Could not find deploy_data directory at %s' % deploy_data_path)

    # Copies files in root folder to assets/.
    for filename in FILES_AT_ROOT:
        src = os.path.join(deploy_data_path, filename)
        dst = os.path.join(os.getcwd(), 'assets', filename)
        if not os.path.exists(src):
            raise Exception(
                'Could not find source path %s. Please check your deploy_data '
                'folder.' % src)
        if not os.path.exists(dst):
            raise Exception(
                'Could not find destination path %s. Has the code been '
                'updated in the meantime?' % dst)
        shutil.copyfile(src, dst)

    # Copies files in images to /assets/images.
    for dir_name in IMAGE_DIRS:
        src_dir = os.path.join(deploy_data_path, 'images', dir_name)
        dst_dir = os.path.join(os.getcwd(), 'assets', 'images', dir_name)

        if not os.path.exists(src_dir):
            raise Exception(
                'Could not find source dir %s. Please check your deploy_data '
                'folder.' % src_dir)
        common.ensure_directory_exists(dst_dir)

        for filename in os.listdir(src_dir):
            src = os.path.join(src_dir, filename)
            dst = os.path.join(dst_dir, filename)
            shutil.copyfile(src, dst)

    # Changes the DEV_MODE constant in assets/constants.ts.
    with python_utils.open_file(
        os.path.join(CONSTANTS_FILE_PATH), 'r') as assets_file:
        content = assets_file.read()
    bucket_name = app_name + BUCKET_NAME_SUFFIX
    assert '"DEV_MODE": true' in content
    assert '"GCS_RESOURCE_BUCKET_NAME": "None-resources",' in content
    os.remove(os.path.join(CONSTANTS_FILE_PATH))
    content = content.replace('"DEV_MODE": true', '"DEV_MODE": false')
    content = content.replace(
        '"GCS_RESOURCE_BUCKET_NAME": "None-resources",',
        '"GCS_RESOURCE_BUCKET_NAME": "%s",' % bucket_name)
    with python_utils.open_file(
        os.path.join(CONSTANTS_FILE_PATH), 'w+') as new_assets_file:
        new_assets_file.write(content)


def check_errors_in_a_page(url_to_check, msg_to_confirm):
    """Prompts user to check errors in a page.

    Args:
        url_to_check: str. The url of the page to be tested.
        msg_to_confirm: str. The message displayed asking user for confirmation.

    Returns:
        bool. Whether the page has errors or not.
    """

    common.open_new_tab_in_browser_if_possible(url_to_check)
    while True:
        python_utils.PRINT(
            '******************************************************')
        python_utils.PRINT(
            'PLEASE CONFIRM: %s See %s '
            '(y/n)' % (msg_to_confirm, url_to_check))
        answer = python_utils.INPUT().lower()
        if answer in release_constants.AFFIRMATIVE_CONFIRMATIONS:
            return True
        elif answer:
            return False


def update_and_check_indexes(app_name):
    """Updates indexes and checks if all indexes are serving.

    Args:
        app_name: str. The name of the app to deploy.

    Raises:
        Exception: All indexes are not serving on the indexes page.
    """
    # Update indexes, then prompt for a check that they are all serving
    # before continuing with the deployment.
    # NOTE: This assumes that the build process does not modify the
    # index.yaml file or create a different version of it to use in
    # production.
    indexes_page_url = (
        'https://console.cloud.google.com/datastore/indexes'
        '?project=%s') % app_name
    gcloud_adapter.update_indexes(INDEX_YAML_PATH, app_name)
    if not gcloud_adapter.check_all_indexes_are_serving(app_name):
        common.open_new_tab_in_browser_if_possible(indexes_page_url)
        raise Exception(
            'Please wait for all indexes to serve, then run this '
            'script again to complete the deployment. For details, '
            'visit the indexes page. Exiting.')


def build_scripts():
    """Builds and Minifies all the scripts.

    Raises:
        Exception: The build process fails.
    """
    # Do a build, while outputting to the terminal.
    python_utils.PRINT('Building and minifying scripts...')
    build_process = subprocess.Popen(
        ['python', '-m', 'scripts.build', '--prod_env', '--deploy_mode'],
        stdout=subprocess.PIPE)
    while True:
        line = build_process.stdout.readline().strip()
        if not line:
            break
        python_utils.PRINT(line)
    # Wait for process to terminate, then check return code.
    build_process.communicate()
    if build_process.returncode > 0:
        raise Exception('Build failed.')


def deploy_application_and_write_log_entry(
        app_name, version_to_deploy_to, current_git_revision):
    """Deploys the app and writes the log entry.

    Args:
        app_name: str. The name of the app to deploy.
        version_to_deploy_to: str. The version to deploy to.
        current_git_revision: str. The current git revision.
    """
    # Deploy export service to GAE.
    gcloud_adapter.deploy_application('export/app.yaml', app_name)
    # Deploy app to GAE.
    gcloud_adapter.deploy_application(
        './app.yaml', app_name, version=version_to_deploy_to)
    # Writing log entry.
    common.ensure_directory_exists(os.path.dirname(LOG_FILE_PATH))
    with python_utils.open_file(LOG_FILE_PATH, 'a') as log_file:
        log_file.write(
            'Successfully deployed to %s at %s (version %s)\n' % (
                app_name, CURRENT_DATETIME.strftime('%Y-%m-%d %H:%M:%S'),
                current_git_revision))


def flush_memcache(app_name):
    """Flushes the memcache.

    Args:
        app_name: str. The name of the app to deploy.
    """
    memcache_url = (
        'https://pantheon.corp.google.com/appengine/memcache?'
        'project=%s') % app_name
    if not gcloud_adapter.flush_memcache(app_name):
        python_utils.PRINT('Memcache flushing failed. Please do it manually.')
        common.open_new_tab_in_browser_if_possible(memcache_url)


def switch_version(app_name, current_release_version):
    """Switches version if library page loads correctly.

    Args:
        app_name: str. The name of the app to deploy.
        current_release_version: str. The version of the current release.

    Raises:
        Exception. The library page does not load correctly.
    """
    release_version_library_url = (
        'https://%s-dot-%s.appspot.com/library' % (
            current_release_version, app_name))
    library_page_loads_correctly = check_errors_in_a_page(
        release_version_library_url, 'Library page is loading correctly?')
    if library_page_loads_correctly:
        gcloud_adapter.switch_version(
            app_name, current_release_version)
        python_utils.PRINT('Successfully migrated traffic to release version!')
    else:
        raise Exception(
            'Aborting version switch due to issues in library page '
            'loading.')


def check_breakage(app_name, current_release_version):
    """Checks if there is any major breakage for test server deployment
    and asks the user to file an issue if that is the case.

    Args:
        app_name: str. The name of the app to deploy.
        current_release_version: str. The version of the current release.

    Raises:
        Exception. There is major breakage found through test server logs.
    """
    # If this is a test server deployment and the current release version is
    # already serving, open the GAE error logs.

    test_server_error_logs_url = (
        'https://console.cloud.google.com/logs/viewer?'
        'project=%s&key1=default&minLogLevel=500') % app_name

    currently_served_version = (
        gcloud_adapter.get_currently_served_version(app_name))
    if (app_name == APP_NAME_OPPIATESTSERVER or 'migration' in app_name) and (
            currently_served_version == current_release_version):
        major_breakage = check_errors_in_a_page(
            test_server_error_logs_url, 'Is anything major broken?')
        if major_breakage:
            common.open_new_tab_in_browser_if_possible(
                release_constants.RELEASE_DRIVE_URL)
            common.open_new_tab_in_browser_if_possible(
                release_constants.ISSUE_FILING_URL)
            raise Exception(
                'Please note the issue in the release journal for this month, '
                'file a blocking bug and switch to the last known good '
                'version.')


def check_travis_and_circleci_tests(current_branch_name):
    """Checks if all travis and circleci tests are passing on release/test
    branch.

    Args:
        current_branch_name: str. The name of current branch.

    Raises:
        Exception: The latest commit on release/test branch locally does not
            match the latest commit on local fork or upstream.
        Exception: The travis or circleci tests are failing on release/test
            branch.
    """
    local_sha = subprocess.check_output([
        'git', 'rev-parse', current_branch_name])
    origin_sha = subprocess.check_output([
        'git', 'rev-parse', 'origin/%s' % current_branch_name])
    upstream_sha = subprocess.check_output([
        'git', 'rev-parse', '%s/%s' % (
            common.get_remote_alias(release_constants.REMOTE_URL),
            current_branch_name)])
    if local_sha != origin_sha:
        raise Exception(
            'The latest commit on release branch locally does '
            'not match the latest commit on your local fork.')
    if local_sha != upstream_sha:
        raise Exception(
            'The latest commit on release branch locally does '
            'not match the latest commit on Oppia repo.')

    python_utils.PRINT('\nEnter your GitHub username.\n')
    github_username = python_utils.INPUT().lower()

    travis_url = 'https://travis-ci.org/%s/oppia/branches' % github_username
    circleci_url = 'https://circleci.com/gh/%s/workflows/oppia' % (
        github_username)

    try:
        python_utils.url_open(travis_url)
    except Exception:
        travis_url = 'https://travis-ci.org/oppia/oppia/branches'

    try:
        python_utils.url_open(circleci_url)
    except Exception:
        circleci_url = 'https://circleci.com/gh/oppia/workflows/oppia'

    common.open_new_tab_in_browser_if_possible(travis_url)
    python_utils.PRINT(
        'Are all travis tests passing on branch %s?\n' % current_branch_name)
    travis_tests_passing = python_utils.INPUT().lower()
    if travis_tests_passing not in release_constants.AFFIRMATIVE_CONFIRMATIONS:
        raise Exception(
            'Please fix the travis tests before deploying.')

    common.open_new_tab_in_browser_if_possible(circleci_url)
    python_utils.PRINT(
        'Are all circleci tests passing on branch %s?\n' % current_branch_name)
    circleci_tests_passing = python_utils.INPUT().lower()
    if circleci_tests_passing not in (
            release_constants.AFFIRMATIVE_CONFIRMATIONS):
        raise Exception(
            'Please fix the circleci tests before deploying.')


def create_release_doc():
    """Asks the co-ordinator to create a doc for the current release."""
    common.open_new_tab_in_browser_if_possible(
        release_constants.RELEASE_DRIVE_URL)
    common.open_new_tab_in_browser_if_possible(
        release_constants.RELEASE_NOTES_TEMPLATE_URL)
    common.open_new_tab_in_browser_if_possible(
        release_constants.RELEASE_NOTES_EXAMPLE_URL)
    common.ask_user_to_confirm(
        'Please create a dedicated section for this release in the '
        'release tracking document created by the QA Lead.\n'
        'The three tabs in your browser point to: '
        'Release drive url, template for the release notes, example of release '
        'notes from previous release.')


def execute_deployment():
    """Executes the deployment process after doing the prerequisite checks.

    Raises:
        Exception: App name is invalid.
        Exception: Custom version is used with production app.
        Exception: App name is not specified.
        Exception: The deployment script is not run from a release or test
            branch.
        Exception: The deployment script is run for prod server from a test
            branch.
        Exception: Current release version has '.' character.
        Exception: Last commit message is invalid.
        Exception: The mailgun API key is not added before deployment.
        Exception: Could not find third party directory.
        Exception: Invalid directory accessed during deployment.
    """
    parsed_args = _PARSER.parse_args()
    custom_version = None
    if parsed_args.app_name:
        app_name = parsed_args.app_name
        if app_name not in [
                APP_NAME_OPPIASERVER, APP_NAME_OPPIATESTSERVER] and (
                    'migration' not in app_name):
            raise Exception('Invalid app name: %s' % app_name)
        if parsed_args.version and app_name == APP_NAME_OPPIASERVER:
            raise Exception('Cannot use custom version with production app.')
        # Note that custom_version may be None.
        custom_version = parsed_args.version
    else:
        raise Exception('No app name specified.')

    current_branch_name = common.get_current_branch_name()

    release_dir_name = 'deploy-%s-%s-%s' % (
        '-'.join('-'.join(app_name.split('.')).split(':')),
        current_branch_name,
        CURRENT_DATETIME.strftime('%Y%m%d-%H%M%S'))
    release_dir_path = os.path.join(os.getcwd(), '..', release_dir_name)

    deploy_data_path = os.path.join(
        os.getcwd(), os.pardir, 'release-scripts', 'deploy_data', app_name)

    install_third_party_libs.main()

    if not (common.is_current_branch_a_release_branch() or (
            common.is_current_branch_a_test_branch())):
        raise Exception(
            'The deployment script must be run from a release or test branch.')
    if common.is_current_branch_a_test_branch() and (
            app_name == APP_NAME_OPPIASERVER):
        raise Exception('Test branch cannot be deployed to prod.')
    if custom_version is not None:
        current_release_version = custom_version.replace(
            DOT_CHAR, HYPHEN_CHAR)
    else:
        current_release_version = current_branch_name[
            len(common.RELEASE_BRANCH_NAME_PREFIX):].replace(
                DOT_CHAR, HYPHEN_CHAR)

    # This is required to compose the release_version_library_url
    # (defined in switch_version function) correctly.
    if '.' in current_release_version:
        raise Exception('Current release version has \'.\' character.')

    # Do prerequisite checks.
    common.require_cwd_to_be_oppia()
    common.ensure_release_scripts_folder_exists_and_is_up_to_date()
    gcloud_adapter.require_gcloud_to_be_available()
    try:
        if app_name == APP_NAME_OPPIASERVER:
            create_release_doc()
            release_version_number = common.get_current_release_version_number(
                current_branch_name)
            last_commit_message = subprocess.check_output(
                'git log -1 --pretty=%B'.split())
            if not last_commit_message.startswith(
                    'Update authors and changelog for v%s' % (
                        release_version_number)):
                raise Exception(
                    'Invalid last commit message: %s.' % last_commit_message)

            check_travis_and_circleci_tests(current_branch_name)

            personal_access_token = common.get_personal_access_token()
            g = github.Github(personal_access_token)
            repo = g.get_organization('oppia').get_repo('oppia')
            common.check_blocking_bug_issue_count(repo)
            common.check_prs_for_current_release_are_released(repo)
            update_configs.main(personal_access_token)
            with python_utils.open_file(FECONF_PATH, 'r') as f:
                feconf_contents = f.read()
                if ('MAILGUN_API_KEY' not in feconf_contents or
                        'MAILGUN_API_KEY = None' in feconf_contents):
                    raise Exception(
                        'The mailgun API key must be added before deployment.')
        if not os.path.exists(THIRD_PARTY_DIR):
            raise Exception(
                'Could not find third_party directory at %s. Please run '
                'install_third_party_libs.py prior to running this script.'
                % THIRD_PARTY_DIR)

        current_git_revision = subprocess.check_output(
            ['git', 'rev-parse', 'HEAD']).strip()

        # Create a folder in which to save the release candidate.
        python_utils.PRINT('Ensuring that the release directory parent exists')
        common.ensure_directory_exists(os.path.dirname(release_dir_path))

        # Copy files to the release directory. Omits the .git subfolder.
        python_utils.PRINT('Copying files to the release directory')
        shutil.copytree(
            os.getcwd(), release_dir_path,
            ignore=shutil.ignore_patterns('.git'))

        # Change the current directory to the release candidate folder.
        with common.CD(release_dir_path):
            if not os.getcwd().endswith(release_dir_name):
                raise Exception(
                    'Invalid directory accessed during deployment: %s'
                    % os.getcwd())

            python_utils.PRINT('Changing directory to %s' % os.getcwd())

            python_utils.PRINT('Preprocessing release...')
            preprocess_release(app_name, deploy_data_path)

            update_and_check_indexes(app_name)
            build_scripts()
            deploy_application_and_write_log_entry(
                app_name, current_release_version,
                current_git_revision)

            python_utils.PRINT('Returning to oppia/ root directory.')

        switch_version(app_name, current_release_version)
        flush_memcache(app_name)
        check_breakage(app_name, current_release_version)

        python_utils.PRINT('Done!')
    finally:
        common.run_cmd([
            'git', 'checkout', '--',
            update_configs.LOCAL_FECONF_PATH,
            update_configs.LOCAL_CONSTANTS_PATH])


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when deploy.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    execute_deployment()
