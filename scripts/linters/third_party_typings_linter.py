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

"""Lint checks for third party type definitions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json
import os
import sys

import python_utils
from . import linter_utils

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
        'name': 'Wavesurfer',
        'dependency_key': 'wavesurfer.js',
        'dependency_source': _DEPENDENCY_SOURCE_PACKAGE,
        'type_defs_filename_prefix': 'wavesurfer-defs-'
    },
    {
        'name': 'Nerdamer',
        'dependency_key': 'nerdamer',
        'dependency_source': _DEPENDENCY_SOURCE_PACKAGE,
        'type_defs_filename_prefix': 'nerdamer-defs-'
    }
]


def check_third_party_libs_type_defs(verbose_mode_enabled):
    """Checks the type definitions for third party libs
    are up to date.
    """
    if verbose_mode_enabled:
        python_utils.PRINT('Starting type defs check')
        python_utils.PRINT('----------------------------------------')

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
                python_utils.PRINT(
                    'There are multiple type definitions for %s in the typings '
                    'dir.' % third_party_lib['name'])
                python_utils.PRINT('')
                failed = True
            elif len(files_with_prefix_name) == 0:
                python_utils.PRINT(
                    'There are no type definitions for %s in the typings '
                    'dir.' % third_party_lib['name'])
                python_utils.PRINT('')
                failed = True
            else:
                type_defs_filename = files_with_prefix_name[0]

                type_defs_version = type_defs_filename[
                    len(prefix_name): -_TYPE_DEFS_FILE_EXTENSION_LENGTH]

                if lib_version != type_defs_version:
                    python_utils.PRINT(
                        'Type definitions for %s are not up to date. The '
                        'current version of %s is %s and the type definitions '
                        'are for version %s. Please refer typings/README.md '
                        'for more details.' % (
                            third_party_lib['name'], third_party_lib['name'],
                            lib_version, type_defs_version))
                    python_utils.PRINT('')
                    failed = True

        if failed:
            summary_message = (
                '%s Third party type defs check failed, see messages '
                'above for more detail.' % linter_utils.FAILED_MESSAGE_PREFIX)
        else:
            summary_message = '%s Third party type defs check passed' % (
                linter_utils.SUCCESS_MESSAGE_PREFIX)
            python_utils.PRINT(summary_message)

        summary_messages.append(summary_message)

    return summary_messages
