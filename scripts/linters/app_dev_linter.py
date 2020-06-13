# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Lint checks for skip_files in app.yaml file."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import glob
import os
import sys

import python_utils
from . import linter_utils

APP_YAML_FILEPATH = os.path.join(os.getcwd(), 'app_dev.yaml')


def check_skip_files_in_app_dev_yaml(file_cache, verbose_mode_enabled):
    """Check to ensure that all lines in skip_files in app_dev.yaml reference
    valid files in the repository.
    """
    if verbose_mode_enabled:
        python_utils.PRINT(
            'Starting app_dev file check\n'
            '----------------------------------------')

    with linter_utils.redirect_stdout(sys.stdout):
        failed = False
        summary_messages = []
        skip_files_section_found = False
        for line_num, line in enumerate(file_cache.readlines(
                APP_YAML_FILEPATH)):
            stripped_line = line.strip()
            if '# Third party files:' in stripped_line:
                skip_files_section_found = True
            if not skip_files_section_found:
                continue
            if not stripped_line or stripped_line[0] == '#':
                continue
            # Extract the file pattern from the line as all skipped file
            # lines start with a dash(-).
            line_in_concern = stripped_line[len('- '):]
            # Adjustments to the dir paths in app_dev.yaml file
            # for glob-style patterns to match correctly.
            if line_in_concern.endswith('/'):
                line_in_concern = line_in_concern[:-1]
            if not glob.glob(line_in_concern):
                summary_message = (
                    '%s --> Pattern on line %s doesn\'t match '
                    'any file or directory' % (
                        APP_YAML_FILEPATH, line_num + 1))
                summary_messages.append(summary_message)
                python_utils.PRINT(summary_message)
                failed = True

        if failed:
            summary_message = (
                '%s app_dev file coverage check failed, see messages above '
                'for invalid file names in app_dev.yaml file' %
                linter_utils.FAILED_MESSAGE_PREFIX)
        else:
            summary_message = '%s app_dev file check passed' % (
                linter_utils.SUCCESS_MESSAGE_PREFIX)
        summary_messages.append(summary_message)
        python_utils.PRINT(summary_message)
        python_utils.PRINT('')

    return summary_messages
