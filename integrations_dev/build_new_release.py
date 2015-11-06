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

"""Deployment script for building new integration releases.

THIS SCRIPT SHOULD ONLY BE RUN BY MEMBERS OF THE DEVELOPMENT TEAM.

Each run of the script creates a new versioned directory containing code that
can be used to integrate Oppia explorations with other platforms.

This script should be run from the oppia root folder:

    python integrations_dev/build_new_release.py
        --name=[INTEGRATION_NAME]
        --version_number=[VERSION_NUMBER]

where [INTEGRATION_NAME] is the name of the source directory, and
[VERSION_NUMBER] is the desired version number to build.
"""

import argparse
import datetime
import os
import re
import shutil
import tarfile

INTEGRATION_NAME_GCB_OPPIA_TAG = 'gcb_oppia_tag'
INTEGRATION_NAME_GOOGLE_SITES = 'google_sites'
INTEGRATION_NAME_OPPIA_PLAYER = 'oppia_player'
ALLOWED_INTEGRATION_NAMES = [
    INTEGRATION_NAME_GCB_OPPIA_TAG,
    INTEGRATION_NAME_GOOGLE_SITES,
    INTEGRATION_NAME_OPPIA_PLAYER
]

SCRIPT_FILEPATH = os.path.join(
    os.getcwd(), 'static', 'scripts', 'oppia-player-0.0.1.min.js')
README_FILENAME = 'README'

VERSION_NUMBER_REGEX = re.compile(r'^\d+\.\d+\.\d+$')
INTEGRATIONS_DEV_ROOT = os.path.join(os.getcwd(), 'integrations_dev')
INTEGRATIONS_ROOT = os.path.join(os.getcwd(), 'integrations')

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--name', help='name of the source directory', type=str)
_PARSER.add_argument(
    '--version_number', help='version number for the release', type=str)

parsed_args = _PARSER.parse_args()

if not parsed_args.name:
    raise Exception(
        'No name specified: expected one of %s' % ALLOWED_INTEGRATION_NAMES)
elif parsed_args.name not in ALLOWED_INTEGRATION_NAMES:
    raise Exception(
        'Invalid name: expected one of %s' % ALLOWED_INTEGRATION_NAMES)

if not parsed_args.version_number:
    raise Exception('No version_number specified.')
elif not VERSION_NUMBER_REGEX.match(parsed_args.version_number):
    raise Exception('Invalid version_number: %s' % parsed_args.version_number)

# Check that the current directory is correct.
if not os.getcwd().endswith('oppia'):
    raise Exception('Please run this script from the oppia/ root directory.')


INTEGRATION_NAME = parsed_args.name
VERSION_NUMBER = parsed_args.version_number

DATE_STR = datetime.datetime.utcnow().strftime('%Y%m%d')
SOURCE_DIR = os.path.join(INTEGRATIONS_DEV_ROOT, INTEGRATION_NAME)
TARGET_DIR = os.path.join(
    INTEGRATIONS_ROOT,
    '%s_%s_v%s' % (INTEGRATION_NAME, DATE_STR, VERSION_NUMBER))


def _make_tarfile(output_filename, source_dir):
    with tarfile.open(output_filename, 'w:gz') as tar:
        tar.add(source_dir, arcname=os.path.basename(source_dir))


print ''
print 'Starting deployment process for %s' % SOURCE_DIR

# Check that the source directory exists.
if not os.path.exists(SOURCE_DIR):
    raise Exception('Source directory %s not found' % SOURCE_DIR)
if not os.path.exists(os.path.join(SOURCE_DIR, README_FILENAME)):
    raise Exception('Source README file not found')

# Check that the target directory does not exist.
if os.path.exists(TARGET_DIR):
    raise Exception('Target directory %s already exists' % TARGET_DIR)

try:
    # Copy the source to the target directory.
    print 'Copying files to the target directory'
    shutil.copytree(SOURCE_DIR, TARGET_DIR)

    # Substitute the date and version numbers to create the README file.
    print 'Creating new README file'
    README_FILEPATH = os.path.join(TARGET_DIR, README_FILENAME)
    f = open(README_FILEPATH, 'r')
    content = f.read()
    os.remove(README_FILEPATH)
    content = content.replace('{{DATE}}', DATE_STR)
    content = content.replace('{{VERSION}}', VERSION_NUMBER)
    if DATE_STR not in content:
        raise Exception('Invalid README file: does not contain DATE_STR')
    if VERSION_NUMBER not in content:
        raise Exception('Invalid README file: does not contain VERSION_NUMBER')
    d = open(README_FILEPATH, 'w+')
    d.write(content)

    # Copy the embedding script into the relevant subfolder.
    print (
        'Copying the embedding script to the desired location in the target '
        'directory')
    SCRIPT_LOCATIONS = {
        INTEGRATION_NAME_GCB_OPPIA_TAG: os.path.join(
            'coursebuilder', 'modules', 'oppia_tag', 'resources'),
        INTEGRATION_NAME_OPPIA_PLAYER: '.',
    }
    if INTEGRATION_NAME in SCRIPT_LOCATIONS:
        shutil.copy(
            SCRIPT_FILEPATH,
            os.path.join(TARGET_DIR, SCRIPT_LOCATIONS[INTEGRATION_NAME]))

    print ''
    print 'Done! Please check %s for the release candidate.' % TARGET_DIR
    print ''
except Exception:
    # Remove destination folder.
    shutil.rmtree(TARGET_DIR)
    raise
