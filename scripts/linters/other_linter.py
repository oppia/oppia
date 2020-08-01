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

"""Lint checks for codeowner file."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json
import glob
import os
import subprocess
import sys

import python_utils
from . import linter_utils
from .. import concurrent_task_utils

WEBPACK_CONFIG_FILE_NAME = 'webpack.common.config.ts'
WEBPACK_CONFIG_FILEPATH = os.path.join(os.getcwd(), WEBPACK_CONFIG_FILE_NAME)

APP_YAML_FILEPATH = os.path.join(os.getcwd(), 'app_dev.yaml')

MANIFEST_JSON_FILE_PATH = os.path.join(os.getcwd(), 'manifest.json')
PACKAGE_JSON_FILE_PATH = os.path.join(os.getcwd(), 'package.json')
_TYPE_DEFS_FILE_EXTENSION_LENGTH = len('.d.ts')
_DEPENDENCY_SOURCE_MANIFEST = 'manifest.json'
_DEPENDENCY_SOURCE_PACKAGE = 'package.json'

THIRD_PARTY_LIBS = [
    {
        'name': 'Guppy',
        'dependency_key': 'guppy',
        'dependency_source': _DEPENDENCY_SOURCE_MANIFEST,
        'type_defs_filename_prefix': 'guppy-defs-'
    },
    {
        'name': 'Skulpt',
        'dependency_key': 'skulpt-dist',
        'dependency_source': _DEPENDENCY_SOURCE_MANIFEST,
        'type_defs_filename_prefix': 'skulpt-defs-'
    },
    {
        'name': 'Math Expressions',
        'dependency_key': 'mathExpressions',
        'dependency_source': _DEPENDENCY_SOURCE_MANIFEST,
        'type_defs_filename_prefix': 'math-expressions-defs-'
    },
    {
        'name': 'MIDI',
        'dependency_key': 'midiJs',
        'dependency_source': _DEPENDENCY_SOURCE_MANIFEST,
        'type_defs_filename_prefix': 'midi-defs-'
    },
    {
        'name': 'Nerdamer',
        'dependency_key': 'nerdamer',
        'dependency_source': _DEPENDENCY_SOURCE_PACKAGE,
        'type_defs_filename_prefix': 'nerdamer-defs-'
    }
]

class CustomLintChecksManager(python_utils.OBJECT):
    """Manages codeowner checks."""

    def __init__(self, file_cache):
        """Constructs a PythonLintChecksManager object.

        Args:
            file_cache: object(FileCache). Provides thread-safe access to cached
                file content.
        """
        self.file_cache = file_cache

    def check_skip_files_in_app_dev_yaml(self):
        """Check to ensure that all lines in skip_files in app_dev.yaml reference
        valid files in the repository.
        """
        name = 'App dev file'

        with linter_utils.redirect_stdout(sys.stdout):
            failed = False
            summary_messages = []
            skip_files_section_found = False
            for line_num, line in enumerate(self.file_cache.readlines(
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
                    failed = True

        return linter_utils.OutputStream(
            name, failed, summary_messages, summary_messages)

    def check_third_party_libs_type_defs(self):
        """Checks the type definitions for third party libs
        are up to date.
        """
        name = 'Third party type defs'

        with linter_utils.redirect_stdout(sys.stdout):
            failed = False
            summary_messages = []

            manifest = json.load(python_utils.open_file(
                MANIFEST_JSON_FILE_PATH, 'r'))['dependencies']['frontend']

            package = json.load(python_utils.open_file(
                PACKAGE_JSON_FILE_PATH, 'r'))['dependencies']

            files_in_typings_dir = os.listdir(
                os.path.join(os.getcwd(), 'typings'))

            for third_party_lib in THIRD_PARTY_LIBS:
                lib_dependency_source = third_party_lib['dependency_source']

                if lib_dependency_source == _DEPENDENCY_SOURCE_MANIFEST:
                    lib_version = (
                        manifest[third_party_lib['dependency_key']]['version'])

                elif lib_dependency_source == _DEPENDENCY_SOURCE_PACKAGE:
                    lib_version = package[third_party_lib['dependency_key']]

                    if lib_version[0] == '^':
                        lib_version = lib_version[1:]

                prefix_name = third_party_lib['type_defs_filename_prefix']

                files_with_prefix_name = []

                files_with_prefix_name = [
                    file_name for file_name in files_in_typings_dir
                    if file_name.startswith(prefix_name)]

                if len(files_with_prefix_name) > 1:
                    summary_message = (
                        'There are multiple type definitions for %s in the typings '
                        'dir.' % third_party_lib['name'])
                    summary_messages.append(summary_message)
                    failed = True
                elif len(files_with_prefix_name) == 0:
                    summary_message = (
                        'There are no type definitions for %s in the typings '
                        'dir.' % third_party_lib['name'])
                    summary_messages.append(summary_message)
                    failed = True
                else:
                    type_defs_filename = files_with_prefix_name[0]

                    type_defs_version = type_defs_filename[
                        len(prefix_name): -_TYPE_DEFS_FILE_EXTENSION_LENGTH]

                    if lib_version != type_defs_version:
                        summary_message = (
                            'Type definitions for %s are not up to date. The '
                            'current version of %s is %s and the type definitions '
                            'are for version %s. Please refer typings/README.md '
                            'for more details.' % (
                                third_party_lib['name'], third_party_lib['name'],
                                lib_version, type_defs_version))
                        summary_messages.append(summary_message)
                        failed = True

        return linter_utils.OutputStream(
            name, failed, summary_messages, summary_messages)

    def check_webpack_config_file(self):
        """Check to ensure that the instances of HtmlWebpackPlugin in
        webpack.common.config.ts contains all needed keys.
        """
        name = 'Webpack config file'

        with linter_utils.redirect_stdout(sys.stdout):
            failed = False
            summary_messages = []
            plugins_section_found = False
            htmlwebpackplugin_section_found = False
            for line_num, line in enumerate(self.file_cache.readlines(
                    WEBPACK_CONFIG_FILEPATH)):
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

        return linter_utils.OutputStream(
            name, failed, summary_messages, summary_messages)

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        linter_stdout = []
        
        linter_stdout.append(self.check_skip_files_in_app_dev_yaml())
        linter_stdout.append(self.check_third_party_libs_type_defs())
        linter_stdout.append(self.check_webpack_config_file())
        
        return linter_stdout

def get_linters(file_cache):
    """Creates ThirdPartyCSSLintChecksManager and returns it.

    Args:
        file_cache: object(FileCache). Provides thread-safe access to cached
            file content.

    Returns:
        tuple(None, ThirdPartyCSSLintChecksManager). A 2-tuple of custom and
        third_party linter objects.
    """
    custom_linter = CustomLintChecksManager(file_cache)

    return custom_linter, None
