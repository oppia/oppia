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

_MESSAGE_TYPE_SUCCESS = 'SUCCESS'
_MESSAGE_TYPE_FAILED = 'FAILED'

_MANIFEST_JSON_FILE_PATH = os.path.join(os.getcwd(), 'manifest.json')
_PACKAGE_JSON_FILE_PATH = os.path.join(os.getcwd(), 'package.json')

THIRD_PARTY_LIBS = [
    {
        'name': 'Guppy',
        'manifest.json': 'guppy',
        'type_defs_file_name': 'guppy-defs-'
    },
    {
        'name': 'Skulpt',
        'manifest.json': 'skulpt-dist',
        'type_defs_file_name': 'skulpt-defs-'
    },
    {
        'name': 'Math Expressions',
        'manifest.json': 'mathExpressions',
        'type_defs_file_name': 'math-expressions-defs-'
    },
    {
        'name': 'MIDI',
        'manifest.json': 'midiJs',
        'type_defs_file_name': 'midi-defs-'
    },
    {
        'name': 'Wavesurfer',
        'package.json': 'wavesurfer.js',
        'type_defs_file_name': 'wavesurfer-defs-'
    },
    {
        'name': 'Nerdamer',
        'package.json': 'nerdamer',
        'type_defs_file_name': 'nerdamer-defs-'
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

        with python_utils.open_file(_MANIFEST_JSON_FILE_PATH, 'r') as f:
            manifest = json.load(f)['dependencies']['frontend']

        with python_utils.open_file(_PACKAGE_JSON_FILE_PATH, 'r') as f:
            package = json.load(f)['dependencies']

        for third_party_lib in THIRD_PARTY_LIBS:
            if 'manifest.json' in third_party_lib:
                lib_version = (
                    manifest[third_party_lib['manifest.json']]['version'])

            if 'package.json' in third_party_lib:
                lib_version = package[third_party_lib['package.json']]

                if lib_version[0] == '^':
                    lib_version = lib_version[1:]

            files_in_typings_dir = os.listdir(
                os.path.join(os.getcwd(), 'typings')
            )

            prefix_name = third_party_lib['type_defs_file_name']

            files_with_prefix_name = []

            for file_name in files_in_typings_dir:
                if file_name.startswith(prefix_name):
                    files_with_prefix_name.append(file_name)

            if len(files_with_prefix_name) > 1:
                python_utils.PRINT(
                    'There are multiple type definitions for %s in the typings '
                    'dir.' % third_party_lib['name']
                )
                python_utils.PRINT('')
                failed = True
            elif len(files_with_prefix_name) == 0:
                python_utils.PRINT(
                    'There are no type definitions for %s in the typings '
                    'dir.' % third_party_lib['name']
                )
                python_utils.PRINT('')
                failed = True
            else:
                type_defs_file_name = files_with_prefix_name[0]

                type_defs_version = type_defs_file_name[len(prefix_name): -5]

                if lib_version != type_defs_version:
                    python_utils.PRINT(
                        'Type definitions for %s are not up to date. The '
                        'current version of %s is %s and the type definitions '
                        'are for version %s.' % (
                            third_party_lib['name'], third_party_lib['name'],
                            lib_version, type_defs_version))
                    python_utils.PRINT('')
                    failed = True

        if failed:
            summary_message = (
                '%s  Third party type defs check failed, see messages '
                'above for more detail.' % _MESSAGE_TYPE_FAILED)
        else:
            summary_message = '%s  Third party type defs check passed' % (
                _MESSAGE_TYPE_SUCCESS)
            python_utils.PRINT(summary_message)

        summary_messages.append(summary_message)

    return summary_messages
