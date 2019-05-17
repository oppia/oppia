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

        bash scripts/start.sh

    at least once.

2.  This script should be run from the oppia root folder:

        python scripts/deploy.py --app_name=[APP_NAME]

    where [APP_NAME] is the name of your app. Note that the root folder MUST be
    named 'oppia'.
"""

# Pylint has issues with the import order of argparse.
# pylint: disable=wrong-import-order
import argparse
import datetime
import os
import random
import shutil
import string
import subprocess

import common  # pylint: disable=relative-import
import gcloud_adapter  # pylint: disable=relative-import

# pylint: enable=wrong-import-order


_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--app_name', help='name of the app to deploy to', type=str)
_PARSER.add_argument(
    '--version', help='version to deploy', type=str)

APP_NAME_OPPIASERVER = 'oppiaserver'
APP_NAME_OPPIATESTSERVER = 'oppiatestserver'

PARSED_ARGS = _PARSER.parse_args()
if PARSED_ARGS.app_name:
    APP_NAME = PARSED_ARGS.app_name
    if APP_NAME not in [
            APP_NAME_OPPIASERVER, APP_NAME_OPPIATESTSERVER] and (
                'migration' not in APP_NAME):
        raise Exception('Invalid app name: %s' % APP_NAME)
    if PARSED_ARGS.version and APP_NAME == APP_NAME_OPPIASERVER:
        raise Exception('Cannot use custom version with production app.')
    # Note that CUSTOM_VERSION may be None.
    CUSTOM_VERSION = PARSED_ARGS.version
else:
    raise Exception('No app name specified.')

CURRENT_DATETIME = datetime.datetime.utcnow()

CURRENT_BRANCH_NAME = common.get_current_branch_name()

RELEASE_DIR_NAME = 'deploy-%s-%s-%s' % (
    '-'.join('-'.join(APP_NAME.split('.')).split(':')),
    CURRENT_BRANCH_NAME,
    CURRENT_DATETIME.strftime('%Y%m%d-%H%M%S'))
RELEASE_DIR_PATH = os.path.join(os.getcwd(), '..', RELEASE_DIR_NAME)

LOG_FILE_PATH = os.path.join('..', 'deploy.log')
INDEX_YAML_PATH = os.path.join('.', 'index.yaml')
THIRD_PARTY_DIR = os.path.join('.', 'third_party')
DEPLOY_DATA_PATH = os.path.join(
    os.getcwd(), os.pardir, 'release-scripts', 'deploy_data', APP_NAME)

FILES_AT_ROOT = ['favicon.ico', 'robots.txt']
IMAGE_DIRS = ['avatar', 'general', 'sidebar', 'logo']

# Denotes length for cache slug used in production mode. It consists of
# lowercase alphanumeric characters.
CACHE_SLUG_PROD_LENGTH = 6


def preprocess_release():
    """Pre-processes release files.

    This function should be called from within RELEASE_DIR_NAME. Currently it
    does the following:

    (1) Substitutes files from the per-app deployment data.
    (2) Change the DEV_MODE constant in assets/constants.js.
    (3) Removes the "version" field from app.yaml, since gcloud does not like
        it (when deploying).
    """
    if not os.path.exists(DEPLOY_DATA_PATH):
        raise Exception(
            'Could not find deploy_data directory at %s' % DEPLOY_DATA_PATH)

    # Copies files in root folder to assets/.
    for filename in FILES_AT_ROOT:
        src = os.path.join(DEPLOY_DATA_PATH, filename)
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
        src_dir = os.path.join(DEPLOY_DATA_PATH, 'images', dir_name)
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

    # Changes the DEV_MODE constant in assets/constants.js.
    with open(os.path.join('assets', 'constants.js'), 'r') as assets_file:
        content = assets_file.read()
    assert '"DEV_MODE": true' in content
    os.remove(os.path.join('assets', 'constants.js'))
    content = content.replace('"DEV_MODE": true', '"DEV_MODE": false')
    with open(os.path.join('assets', 'constants.js'), 'w+') as new_assets_file:
        new_assets_file.write(content)

    # Removes the version field from app.yaml.
    print 'Removing the version field from app.yaml ...'
    with open('app.yaml', 'r') as f:
        content = f.read()
        assert content.count('version: default') == 1
    os.remove('app.yaml')
    content = content.replace('version: default', '')
    with open('app.yaml', 'w') as f:
        f.write(content)
    print 'Version field removed.'


def _execute_deployment():
    """Executes the deployment process after doing the prerequisite checks."""

    if not common.is_current_branch_a_release_branch():
        raise Exception(
            'The deployment script must be run from a release branch.')
    current_release_version = CURRENT_BRANCH_NAME[len(
        common.RELEASE_BRANCH_NAME_PREFIX):].replace('.', '-')

    # Do prerequisite checks.
    common.require_cwd_to_be_oppia()
    common.ensure_release_scripts_folder_exists_and_is_up_to_date()
    gcloud_adapter.require_gcloud_to_be_available()
    if APP_NAME in [APP_NAME_OPPIASERVER, APP_NAME_OPPIATESTSERVER]:
        if not common.is_current_branch_a_release_branch():
            raise Exception(
                'The deployment script must be run from a release branch.')
    if APP_NAME == APP_NAME_OPPIASERVER:
        with open('./feconf.py', 'r') as f:
            feconf_contents = f.read()
            if ('MAILGUN_API_KEY' not in feconf_contents or
                    'MAILGUN_API_KEY = None' in feconf_contents):
                raise Exception(
                    'The mailgun API key must be added before deployment.')
    if not os.path.exists(THIRD_PARTY_DIR):
        raise Exception(
            'Could not find third_party directory at %s. Please run start.sh '
            'prior to running this script.' % THIRD_PARTY_DIR)

    current_git_revision = subprocess.check_output(
        ['git', 'rev-parse', 'HEAD']).strip()

    # Create a folder in which to save the release candidate.
    print 'Ensuring that the release directory parent exists'
    common.ensure_directory_exists(os.path.dirname(RELEASE_DIR_PATH))

    # Copy files to the release directory. Omits the .git subfolder.
    print 'Copying files to the release directory'
    shutil.copytree(
        os.getcwd(), RELEASE_DIR_PATH, ignore=shutil.ignore_patterns('.git'))

    # Change the current directory to the release candidate folder.
    with common.CD(RELEASE_DIR_PATH):
        if not os.getcwd().endswith(RELEASE_DIR_NAME):
            raise Exception(
                'Invalid directory accessed during deployment: %s'
                % os.getcwd())

        print 'Changing directory to %s' % os.getcwd()

        print 'Preprocessing release...'
        preprocess_release()

        # Update indexes, then prompt for a check that they are all serving
        # before continuing with the deployment.
        # NOTE: This assumes that the build process does not modify the
        # index.yaml file or create a different version of it to use in
        # production.
        gcloud_adapter.update_indexes(INDEX_YAML_PATH, APP_NAME)
        datastore_indexes_url = (
            'https://console.cloud.google.com/datastore/indexes?project=%s' %
            APP_NAME)
        common.open_new_tab_in_browser_if_possible(datastore_indexes_url)
        while True:
            print '******************************************************'
            print (
                'PLEASE CONFIRM: are all datastore indexes serving? See %s '
                '(y/n)' % datastore_indexes_url)
            answer = raw_input().lower()
            if answer in ['y', 'ye', 'yes']:
                break
            elif answer:
                raise Exception(
                    'Please wait for all indexes to serve, then run this '
                    'script again to complete the deployment. Exiting.')

        # Do a build, while outputting to the terminal.
        print 'Building and minifying scripts...'
        build_process = subprocess.Popen(
            ['python', 'scripts/build.py', '--prod_env'],
            stdout=subprocess.PIPE)
        while True:
            line = build_process.stdout.readline().strip()
            if not line:
                break
            print line
        # Wait for process to terminate, then check return code.
        build_process.communicate()
        if build_process.returncode > 0:
            raise Exception('Build failed.')

        # Deploy export service to GAE.
        gcloud_adapter.deploy_application('export/app.yaml', APP_NAME)
        # Deploy app to GAE.
        gcloud_adapter.deploy_application(
            './app.yaml', APP_NAME, version=(
                CUSTOM_VERSION if CUSTOM_VERSION else current_release_version))

        # Writing log entry.
        common.ensure_directory_exists(os.path.dirname(LOG_FILE_PATH))
        with open(LOG_FILE_PATH, 'a') as log_file:
            log_file.write(
                'Successfully deployed to %s at %s (version %s)\n' % (
                    APP_NAME, CURRENT_DATETIME.strftime('%Y-%m-%d %H:%M:%S'),
                    current_git_revision))

        print 'Returning to oppia/ root directory.'

    # If this is a test server deployment and the current release version is
    # already serving, open the library page (for sanity checking) and the GAE
    # error logs.
    currently_served_version = (
        gcloud_adapter.get_currently_served_version(APP_NAME))
    if (APP_NAME == APP_NAME_OPPIATESTSERVER or 'migration' in APP_NAME) and (
            currently_served_version == current_release_version):
        common.open_new_tab_in_browser_if_possible(
            'https://%s.appspot.com/library' % APP_NAME_OPPIATESTSERVER)
        common.open_new_tab_in_browser_if_possible(
            'https://console.cloud.google.com/logs/viewer?'
            'project=%s&key1=default&minLogLevel=500'
            % APP_NAME_OPPIATESTSERVER)

    print 'Done!'


def get_unique_id():
    """Returns a unique id."""
    unique_id = ''.join(random.choice(string.ascii_lowercase + string.digits)
                        for _ in range(CACHE_SLUG_PROD_LENGTH))
    return unique_id


if __name__ == '__main__':
    _execute_deployment()
