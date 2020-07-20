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

"""Lint checks for HtmlWebpackPlugin in webpack.common.config.ts file."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

import python_utils
from . import linter_utils

WEBPACK_CONFIG_FILE_NAME = 'webpack.common.config.ts'
WEBPACK_CONFIG_FILEPATH = os.path.join(os.getcwd(), WEBPACK_CONFIG_FILE_NAME)


def check_webpack_config_file(file_cache, verbose_mode_enabled):
    """Check to ensure that the instances of HtmlWebpackPlugin in
    webpack.common.config.ts contains all needed keys.
    """
    if verbose_mode_enabled:
        python_utils.PRINT(
            'Starting webpack config file check\n'
            '----------------------------------------')

    with linter_utils.redirect_stdout(sys.stdout):
        failed = False
        summary_messages = []
        plugins_section_found = False
        htmlwebpackplugin_section_found = False
        for line_num, line in enumerate(
                file_cache.readlines(WEBPACK_CONFIG_FILEPATH)):
            stripped_line = line.strip()
            if stripped_line.startswith('plugins:'):
                plugins_section_found = True
            if not plugins_section_found:
                continue
            if stripped_line.startswith('new HtmlWebpackPlugin('):
                error_line_num = line_num
                htmlwebpackplugin_section_found = True
                keys = [
                    'chunks', 'filename', 'meta', 'template', 'minify',
                    'inject']
            elif (
                    htmlwebpackplugin_section_found and
                    stripped_line.startswith('}),')):
                htmlwebpackplugin_section_found = False
                if keys:
                    summary_message = (
                        'Line %s: The following keys: %s are missing in '
                        'HtmlWebpackPlugin block in %s' % (
                            error_line_num + 1, ', '.join(keys),
                            WEBPACK_CONFIG_FILE_NAME))
                    summary_messages.append(summary_message)
                    python_utils.PRINT(summary_message)
                    python_utils.PRINT('')
                    failed = True
            if htmlwebpackplugin_section_found:
                key = stripped_line.split(':')[0]
                if key in keys:
                    keys.remove(key)

        if failed:
            summary_message = (
                '%s webpack config file checks failed, see messages above '
                'for missing keys in HtmlWebpackPlugin block in '
                '%s file' % (
                    linter_utils.FAILED_MESSAGE_PREFIX,
                    WEBPACK_CONFIG_FILE_NAME))
        else:
            summary_message = '%s webpack config file checks passed' % (
                linter_utils.SUCCESS_MESSAGE_PREFIX)
        summary_messages.append(summary_message)
        python_utils.PRINT(summary_message)
        python_utils.PRINT('')

    return summary_messages
