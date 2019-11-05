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

"""Script for backup restoration on backup migration server.

This script should be run from the oppia root folder:

    python -m scripts.restore_backup --project_name={{name_of_project}}

The name of the project should match the project name on App Engine.

If the status of a backup restoration is to be checked, run the script as:

    python -m scripts.restore_backup --check_status
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import os
import sys

import python_utils

from . import common

GCLOUD_PATH = os.path.join(
    '..', 'oppia_tools', 'google-cloud-sdk-251.0.0', 'google-cloud-sdk',
    'bin', 'gcloud')

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')
GAE_DIR = os.path.join(
    OPPIA_TOOLS_DIR, 'google_appengine_1.9.67', 'google_appengine')
LIST_OF_BUCKETS_URL = (
    'https://console.cloud.google.com/storage/browser/'
    'oppia-export-backups?project=oppiaserver')

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--project_name', help='name of the project to set for backup', type=str)
_PARSER.add_argument(
    '--check_status', action='store_true', default=False)


def set_project(project_name):
    """Sets the project to the given project name.

    Args:
        project_name: str. The name of the project.
    """
    common.run_cmd([GCLOUD_PATH, 'config', 'set', 'project', project_name])


def initiate_backup_restoration_process():
    """Initiate the backup restoration process on backup migration server."""
    common.open_new_tab_in_browser_if_possible(LIST_OF_BUCKETS_URL)
    python_utils.PRINT(
        'Navigate into the newest backup folder. \n'
        'There should be a file here of the form '
        '<date_time>.overall_export_metadata. \n'
        'For example, "20181122-090002.overall_export_metadata". '
        'This is the file you want to import.\n'
        'Please copy and enter the name of this file\n')
    export_metadata_filepath = python_utils.INPUT()
    common.run_cmd([
        GCLOUD_PATH, 'datastore', 'import',
        'gs://%s' % export_metadata_filepath, '--async'])


def check_backup_restoration_status():
    """Checks the status of backup restoration process."""
    python_utils.PRINT(
        common.run_cmd([GCLOUD_PATH, 'datastore', 'operations', 'list']))


def main(args=None):
    """Performs task to restore backup or check the status of
    backup restoration.
    """
    common.require_cwd_to_be_oppia()
    if not os.path.exists(os.path.dirname(GAE_DIR)):
        raise Exception('Directory %s does not exist.' % GAE_DIR)
    sys.path.insert(0, GAE_DIR)

    if not common.is_current_branch_a_release_branch():
        raise Exception(
            'This script should only be run from the latest release branch.')

    options = _PARSER.parse_args(args=args)

    if options.check_status:
        check_backup_restoration_status()
    else:
        if options.project_name is None:
            raise Exception(
                'Please provide project name for backup restoration.')
        set_project(options.project_name)
        initiate_backup_restoration_process()


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when restore_backup.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
