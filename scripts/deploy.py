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
1.  You will need to first create a folder called ../deploy_data/[APP_NAME],
    where [APP_NAME] is the name of your app as defined in app.yaml. This
    folder should contain a folder called /images, which in turn should
    contain:
    - four folders: /avatar, /general, /logo and /sidebar, containing
        images used for the avatar, general-purpose usage, logo and sidebar,
        respectively.
    It should also contain a folder called /common, which should contain:
    - favicon.ico and robots.txt.
    - one folder images/general which contains:
        - warning.png

2.  Before running this script, you must install third-party dependencies by
    running

        bash scripts/start.sh

    at least once.

3.  This script should be run from the oppia root folder:

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

# pylint: enable=wrong-import-order


_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--app_name', help='name of the app to deploy to', type=str)

APP_NAME_OPPIASERVER = 'oppiaserver'
APP_NAME_OPPIATESTSERVER = 'oppiatestserver'

PARSED_ARGS = _PARSER.parse_args()
if PARSED_ARGS.app_name:
    APP_NAME = PARSED_ARGS.app_name
    if APP_NAME not in [
            APP_NAME_OPPIASERVER, APP_NAME_OPPIATESTSERVER] and (
                'migration' not in APP_NAME):
        raise Exception('Invalid app name: %s' % APP_NAME)
else:
    raise Exception('No app name specified.')

CURRENT_DATETIME = datetime.datetime.utcnow()

CURRENT_BRANCH_NAME = common.get_current_branch_name()

RELEASE_DIR_NAME = 'deploy-%s-%s-%s' % (
    '-'.join('-'.join(APP_NAME.split('.')).split(':')),
    CURRENT_BRANCH_NAME,
    CURRENT_DATETIME.strftime('%Y%m%d-%H%M%S'))
RELEASE_DIR_PATH = os.path.join(os.getcwd(), '..', RELEASE_DIR_NAME)

APPCFG_PATH = os.path.join(
    '..', 'oppia_tools', 'google_appengine_1.9.67', 'google_appengine',
    'appcfg.py')

LOG_FILE_PATH = os.path.join('..', 'deploy.log')
THIRD_PARTY_DIR = os.path.join('.', 'third_party')
DEPLOY_DATA_PATH = os.path.join(
    os.getcwd(), os.pardir, 'release-scripts', 'deploy_data', APP_NAME)

FILES_AT_ROOT_IN_COMMON = ['favicon.ico', 'robots.txt']
IMAGE_DIRS = ['avatar', 'general', 'sidebar', 'logo']

# Denotes length for cache slug used in production mode. It consists of
# lowercase alphanumeric characters.
CACHE_SLUG_PROD_LENGTH = 6


def preprocess_release():
    """Pre-processes release files.

    This function should be called from within RELEASE_DIR_NAME. Currently it
    does the following:

    (1) Changes the app name in app.yaml to APP_NAME.
    (2) Substitutes files from the per-app deployment data.
    """
    # Change the app name in app.yaml.
    f = open('app.yaml', 'r')
    content = f.read()
    os.remove('app.yaml')
    content = content.replace('oppiaserver', APP_NAME)
    d = open('app.yaml', 'w+')
    d.write(content)

    if not os.path.exists(DEPLOY_DATA_PATH):
        raise Exception(
            'Could not find deploy_data directory at %s' % DEPLOY_DATA_PATH)

    # Copies files in common folder to assets/common.
    for filename in FILES_AT_ROOT_IN_COMMON:
        src = os.path.join(DEPLOY_DATA_PATH, 'common', filename)
        dst = os.path.join(os.getcwd(), 'assets', 'common', filename)
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


def _get_served_version():
    """Retrieves the default version being served on the specified application
    being served on app engine.

    Returns:
        (str): The current serving version.
    """
    listed_versions = subprocess.check_output(
        [APPCFG_PATH, '--application=%s' % APP_NAME, 'list_versions'])
    default_version_line_start_str = 'default: ['
    listed_versions = listed_versions[
        listed_versions.index(default_version_line_start_str) + len(
            default_version_line_start_str):]
    return listed_versions[:listed_versions.index(',')].replace('-', '.')


def _get_current_release_version():
    """Retrieves the current branch's release version.

    Returns:
        (str): The current (local) Oppia release version.
    """
    release_branch_name_prefix = 'release-'
    if not CURRENT_BRANCH_NAME.startswith(release_branch_name_prefix):
        raise Exception('Deploy script must be run from a release branch.')
    return CURRENT_BRANCH_NAME[len(
        release_branch_name_prefix):].replace('-', '.')


def _execute_deployment():
    # Do prerequisite checks.
    common.require_cwd_to_be_oppia()
    common.ensure_release_scripts_folder_exists_and_is_up_to_date()

    current_git_revision = subprocess.check_output(
        ['git', 'rev-parse', 'HEAD']).strip()

    if not os.path.exists(THIRD_PARTY_DIR):
        raise Exception(
            'Could not find third_party directory at %s. Please run start.sh '
            'prior to running this script.' % THIRD_PARTY_DIR)

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

        # Do a build; ensure there are no errors.
        print 'Building and minifying scripts...'
        subprocess.check_output(['python', 'scripts/build.py'])

        # Deploy to GAE.
        subprocess.check_output([APPCFG_PATH, 'update', '.'])

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
    if (APP_NAME == APP_NAME_OPPIATESTSERVER or 'migration' in APP_NAME) and (
            _get_served_version() == _get_current_release_version()):
        common.open_new_tab_in_browser_if_possible(
            'https://console.cloud.google.com/logs/viewer?'
            'project=%s&key1=default&minLogLevel=500'
            % APP_NAME_OPPIATESTSERVER)
        common.open_new_tab_in_browser_if_possible(
            'https://%s.appspot.com/library' % APP_NAME_OPPIATESTSERVER)

    print 'Done!'


def get_unique_id():
    """Returns a unique id."""
    unique_id = ''.join(random.choice(string.ascii_lowercase + string.digits)
                        for _ in range(CACHE_SLUG_PROD_LENGTH))
    return unique_id


if __name__ == '__main__':
    _execute_deployment()
