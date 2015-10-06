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

"""Deployment script for Oppia.

USE THIS SCRIPT AT YOUR OWN RISK! A safe option is to modify app.yaml manually
and run the 'appcfg.py update' command.

This script performs a deployment of Oppia to a Google App Engine appspot
instance. It creates a build with unnecessary files removed, which is saved
in ../deployment_history. It then pushes this build to the production server.

IMPORTANT NOTES:

1.  You will need to first create a folder called ../deploy_data/[APP_NAME],
    where [APP_NAME] is the name of your app as defined in app.yaml. This
    folder should contain a folder called /images, which in turn should
    contain:
    - one file: favicon.ico
    - three folders: /logo, /splash and /sidebar, containing images used for
        the logo, gallery carousel and sidebar, respectively.

2.  Before running this script, you must install third-party dependencies by
    running

        bash scripts/start.sh

    at least once.

3.  This script should be run from the oppia root folder:

        python scripts/deploy.py --app_name=[APP_NAME]

    where [APP_NAME] is the name of your app. Note that the root folder MUST be
    named 'oppia'.
"""

import argparse
import datetime
import os
import shutil
import subprocess

import common

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--app_name', help='name of the app to deploy to', type=str)

parsed_args = _PARSER.parse_args()
if parsed_args.app_name:
    APP_NAME = parsed_args.app_name
else:
    raise Exception('No app name specified.')

CURRENT_DATETIME = datetime.datetime.utcnow()

RELEASE_DIR_NAME = '%s-deploy-%s' % (
    '-'.join('-'.join(APP_NAME.split('.')).split(':')),
    CURRENT_DATETIME.strftime('%Y%m%d-%H%M%S'))
RELEASE_DIR_PATH = os.path.join(os.getcwd(), '..', RELEASE_DIR_NAME)

APPCFG_PATH = os.path.join(
    '..', 'oppia_tools', 'google_appengine_1.9.19', 'google_appengine',
    'appcfg.py')

LOG_FILE_PATH = os.path.join('..', 'deploy.log')

THIRD_PARTY_DIR = os.path.join('.', 'third_party')


def preprocess_release():
    """Pre-processes release files.

    This function should be called from within RELEASE_DIR_NAME. Currently it
    does the following:

    (1) Changes the app name in app.yaml to APP_NAME.
    (2) Substitutes image files in the images/ directory.
    """
    # Change the app name in app.yaml.
    f = open('app.yaml', 'r')
    content = f.read()
    os.remove('app.yaml')
    content = content.replace('oppiaserver', APP_NAME)
    d = open('app.yaml', 'w+')
    d.write(content)

    # Substitute image files for the splash page.
    SPLASH_PAGE_FILES = ['favicon.ico']
    DEPLOY_DATA_PATH = os.path.join(
        os.getcwd(), '..', 'deploy_data', APP_NAME)

    if not os.path.exists(DEPLOY_DATA_PATH):
        raise Exception(
            'Could not find deploy_data directory at %s' % DEPLOY_DATA_PATH)

    for filename in SPLASH_PAGE_FILES:
        src = os.path.join(DEPLOY_DATA_PATH, 'images', filename)
        dst = os.path.join(os.getcwd(), 'static', 'images', filename)
        if not os.path.exists(src):
            raise Exception(
                'Could not find source path %s. Please check your deploy_data '
                'folder.' % src)
        if not os.path.exists(dst):
            raise Exception(
                'Could not find destination path %s. Has the code been '
                'updated in the meantime?' % dst)
        shutil.copyfile(src, dst)

    IMAGE_DIRS = ['splash', 'sidebar', 'logo']
    for dir_name in IMAGE_DIRS:
        src_dir = os.path.join(DEPLOY_DATA_PATH, 'images', dir_name)
        dst_dir = os.path.join(os.getcwd(), 'static', 'images', dir_name)

        if not os.path.exists(src_dir):
            raise Exception(
                'Could not find source dir %s. Please check your deploy_data '
                'folder.' % src_dir)
        common.ensure_directory_exists(dst_dir)

        for filename in os.listdir(src_dir):
            src = os.path.join(src_dir, filename)
            dst = os.path.join(dst_dir, filename)
            shutil.copyfile(src, dst)


# Check that the current directory is correct.
common.require_cwd_to_be_oppia()

CURRENT_GIT_VERSION = subprocess.check_output(
    ['git', 'rev-parse', 'HEAD']).strip()

print ''
print 'Starting deployment process.'

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
            'Invalid directory accessed during deployment: %s' % os.getcwd())

    print 'Changing directory to %s' % os.getcwd()

    print 'Preprocessing release...'
    preprocess_release()

    # Do a build; ensure there are no errors.
    print 'Building and minifying scripts...'
    subprocess.check_output(['python', 'scripts/build.py'])

    # Run the tests; ensure there are no errors.
    print 'Running tests...'
    test_output = subprocess.check_output([
        'python', 'scripts/backend_tests.py'])

    if 'All tests passed.' not in test_output:
        raise Exception('Tests failed. Halting deployment.\n%s' % test_output)

    # Deploy to GAE.
    subprocess.check_output([APPCFG_PATH, 'update', '.', '--oauth2'])

    # Writing log entry.
    common.ensure_directory_exists(os.path.dirname(LOG_FILE_PATH))
    with open(LOG_FILE_PATH, 'a') as log_file:
        log_file.write('Successfully deployed to %s at %s (version %s)\n' % (
            APP_NAME, CURRENT_DATETIME.strftime('%Y-%m-%d %H:%M:%S'),
            CURRENT_GIT_VERSION))

    print 'Returning to oppia/ root directory.'

print 'Done!'
