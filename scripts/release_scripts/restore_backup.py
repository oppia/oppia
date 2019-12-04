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

If you want to cancel a backup restoration operation, run the script as:

    python -m scripts.restore_backup --cancel_operation
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import os
import re
import sys

import python_utils
import release_constants
from scripts import common

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
    '--cancel_operation', action='store_true', default=False)
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
        'Please copy and enter the path of this file\n')
    export_metadata_filepath = python_utils.INPUT()
    if not re.match(
            r'^oppia-export-backups/(\d{8}-\d{6})/\1\.overall_export_metadata$',
            export_metadata_filepath):
        raise Exception('Invalid export metadata filepath: %s' % (
            export_metadata_filepath))
    common.run_cmd([
        GCLOUD_PATH, 'datastore', 'import',
        'gs://%s' % export_metadata_filepath, '--async'])


def check_backup_restoration_status():
    """Checks the status of backup restoration process."""
    python_utils.PRINT(
        common.run_cmd([GCLOUD_PATH, 'datastore', 'operations', 'list']))


def cancel_operation():
    """Cancels a datastore operation."""
    python_utils.PRINT(
        'Cancellation of operation may corrupt the datastore. '
        'Refer: https://cloud.google.com/datastore/docs/'
        'export-import-entities#cancel_an_operation\n'
        'Do you want to continue?\n')
    execute_cancellation = python_utils.INPUT().lower()
    if execute_cancellation not in release_constants.AFFIRMATIVE_CONFIRMATIONS:
        python_utils.PRINT('Aborting Cancellation.')
        return

    python_utils.PRINT('List of operations in progress:\n')
    check_backup_restoration_status()
    python_utils.PRINT(
        'Enter the name of the operation to cancel from the above list. '
        'The name of an operation is listed in the field called "name". '
        'Check the example here: https://stackoverflow.com/a/53630367 for '
        'details.\n')
    operation_name = python_utils.INPUT()
    common.run_cmd([
        GCLOUD_PATH, 'datastore', 'operations', 'cancel', operation_name])


def main(args=None):
    """Performs task to restore backup or check the status of
    backup restoration.
    """
    common.require_cwd_to_be_oppia()
    if not os.path.exists(os.path.dirname(GAE_DIR)):
        raise Exception('Directory %s does not exist.' % GAE_DIR)
    sys.path.insert(0, GAE_DIR)

    options = _PARSER.parse_args(args=args)

    if options.check_status or options.cancel_operation:
        if options.check_status:
            check_backup_restoration_status()
        if options.cancel_operation:
            cancel_operation()
    else:
        if options.project_name is None:
            raise Exception(
                'Please provide project name for backup restoration.')
        set_project(options.project_name)
        initiate_backup_restoration_process()
        python_utils.PRINT(
            'Backup restoration process initiated!\n'
            'To check the status of the project please run: '
            'python -m scripts.restore_backup --check_status')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when restore_backup.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
