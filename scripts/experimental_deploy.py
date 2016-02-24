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

"""This is an experimental deployment script for Oppia. It should only be used
for experimental testing, since it omits several safeguards: for example, it
does not run tests and it does not use a 'deploy_data' folder.

USE THIS SCRIPT AT YOUR OWN RISK!

Note:

1.  Before running this script, you must install third-party dependencies by
    running

        bash scripts/start.sh

    at least once.

2.  This script should be run from the oppia root folder:

        python scripts/experimental_deploy.py --app_name=[APP_NAME]

    where [APP_NAME] is the name of your app. Note that the root folder MUST be
    named 'oppia'.
"""

# Pylint has issues with the import order of argparse.
# pylint: disable=wrong-import-order
import argparse
import datetime
import os
import shutil
import subprocess
# pylint: enable=wrong-import-order

import common

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--app_name', help='name of the app to deploy to', type=str)

PARSED_ARGS = _PARSER.parse_args()
if PARSED_ARGS.app_name:
    APP_NAME = PARSED_ARGS.app_name
    if APP_NAME in ['oppiaserver', 'oppiatestserver']:
        raise Exception(
            'This script should not be used for updating %s. Please use '
            'scripts/deploy.py instead.' % APP_NAME)
else:
    raise Exception('No app name specified.')

CURRENT_DATETIME = datetime.datetime.utcnow()

RELEASE_DIR_NAME = 'deploy-EXPERIMENT-%s-%s' % (
    '-'.join('-'.join(APP_NAME.split('.')).split(':')),
    CURRENT_DATETIME.strftime('%Y%m%d-%H%M%S'))
RELEASE_DIR_PATH = os.path.join(os.getcwd(), '..', RELEASE_DIR_NAME)

APPCFG_PATH = os.path.join(
    '..', 'oppia_tools', 'google_appengine_1.9.19', 'google_appengine',
    'appcfg.py')

LOG_FILE_PATH = os.path.join('..', 'experimental_deploy.log')

THIRD_PARTY_DIR = os.path.join('.', 'third_party')


def preprocess_release():
    """Pre-processes release files.

    This function should be called from within RELEASE_DIR_NAME. Currently it
    does the following:

    (1) Changes the app name in app.yaml to APP_NAME.
    """
    # Change the app name in app.yaml.
    f = open('app.yaml', 'r')
    content = f.read()
    os.remove('app.yaml')
    content = content.replace('oppiaserver', APP_NAME)
    d = open('app.yaml', 'w+')
    d.write(content)


# Check that the current directory is correct.
common.require_cwd_to_be_oppia()

CURRENT_GIT_VERSION = subprocess.check_output(
    ['git', 'rev-parse', 'HEAD']).strip()

print ''
print 'Starting experimental deployment process.'

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

    # Deploy to GAE.
    subprocess.check_output([APPCFG_PATH, 'update', '.', '--oauth2'])

    # Writing log entry.
    common.ensure_directory_exists(os.path.dirname(LOG_FILE_PATH))
    with open(LOG_FILE_PATH, 'a') as log_file:
        log_file.write(
            'Successfully completed experimental deployment to %s at %s '
            '(version %s)\n' % (
                APP_NAME, CURRENT_DATETIME.strftime('%Y-%m-%d %H:%M:%S'),
                CURRENT_GIT_VERSION))

    print 'Returning to oppia/ root directory.'

print 'Done!'
