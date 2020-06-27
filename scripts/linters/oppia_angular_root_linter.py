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

"""Lint checks for oppia-angular-root and oppia-root files."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import sys

import python_utils

from . import linter_utils


class OppiaAngularRootLinter(python_utils.OBJECT):
    """Custom linter for OppiaAngularRootComponent and OppiaRoot
        Attributes:
        file_paths: list(str). A list of filepaths to look for Injectables.
        oppia_angular_root: str. Contains file content of
            oppia-angular-root.component.ts.
        oppia_root: str. Contains file content of oppia-root.directve.ts.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(self, file_paths, verbose_mode_enabled):
        """Constructs a OppiaAngularRootLinter object.

        Args:
            file_paths: list(str). A list of filepaths to look for Injectables.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        self.file_paths = file_paths
        self.verbose_mode_enabled = verbose_mode_enabled
        self.oppia_angular_root = FILE_CACHE.read(
            './core/templates/components/oppia-angular-root.component.ts')
        self.oppia_root = FILE_CACHE.read(
            './core/templates/base-components/oppia-root.directive.ts')

    def get_injectable_class_name(self, file_content):
        """Extarcts the class name from a file that has an Injectable class.

        Args:
            file_content: str. File content of the file that has an Injectable
                class.

        Returns:
            tuple(str, str). A two-tuple of class name and class name in
                camelCase.
        """
        class_name = file_content.split(
            '@Injectable({')[1].split(
                'export class ')[1].split('{')[0].replace(' ', '')
        camel_case_class_name = class_name[0].lower() + class_name[1:]
        return class_name, camel_case_class_name

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        summary_messages = []
        total_error_count = 0
        total_files_checked = 0
        for file_path in self.file_paths:
            file_content = FILE_CACHE.read(file_path)
            if '@Injectable({' in file_content:
                total_files_checked += 1
                class_name, camel_case_class_name = (
                    self.get_injectable_class_name(file_content))
                if not 'import { ' + class_name in self.oppia_angular_root:
                    total_error_count += 1
                    summary_messages.append(
                        'Please import ' + class_name +
                        ' to Oppia Angular Root\n')

                if not (
                        'static ' + camel_case_class_name + ': ' + class_name in
                        self.oppia_angular_root):
                    total_error_count += 1
                    summary_messages.append(
                        'Please add a static class member '
                        + camel_case_class_name + ' to Oppia Angular Root:')
                    summary_messages.append(
                        '  static ' + camel_case_class_name + ': ' + class_name
                        + '\n')

                if not (
                        'private ' + camel_case_class_name + ': ' + class_name
                        in self.oppia_angular_root):
                    total_error_count += 1
                    summary_messages.append(
                        'Please add the class' + class_name +
                        ' to Oppia Angular Root constructor:')
                    summary_messages.append(
                        '  private ' + camel_case_class_name + ': ' + class_name
                        + '\n')

                if not (
                        'OppiaAngularRootComponent.' + camel_case_class_name +
                        ' = ' + 'this.' + camel_case_class_name + ';' in
                        self.oppia_angular_root):
                    total_error_count += 1
                    summary_messages.append(
                        'The static variable hasn\'t been assigned value:')
                    summary_messages.append(
                        '  OppiaAngularRootComponent.' + camel_case_class_name +
                        ' = ' + 'this.' + camel_case_class_name + ';\n')

                if not '\'' + class_name + '\'' in self.oppia_root:
                    total_error_count += 1
                    summary_message = 'The class ' + class_name
                    summary_message += ' hasn\'t been added to'
                    summary_message += ' in ANGULAR_SERVICES'
                    summary_message += ' oppia-root.directive.ts.\n'
                    summary_messages.append(summary_message)

        with linter_utils.redirect_stdout(sys.stdout):
            if self.verbose_mode_enabled:
                python_utils.PRINT('----------------------------------------')
            if total_error_count:
                python_utils.PRINT('(%s files checked, %s errors found)' % (
                    total_files_checked, total_error_count))
                summary_message = linter_utils.FAILED_MESSAGE_PREFIX
                summary_message += 'OppiaAngularRootComponent linting failed,'
                summary_message += ' fix the errors listed below'
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s OppiaAngularRootComponent linting linting passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))
                summary_messages.append(summary_message)

            python_utils.PRINT('')
            python_utils.PRINT(summary_message)
            python_utils.PRINT('OppiaAngularRootComponent linting finished.')
            python_utils.PRINT('')
        return summary_messages


class ThirdPartyLinter(python_utils.OBJECT):
    """Mock thrid party linter to satisfy custom_linter specifications.
        Attributes:
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(self, verbose_mode_enabled):
        """Constructs a MockThirdPartyLinter object.

        Args:
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        self.verbose_mode_enabled = verbose_mode_enabled

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
            the checks.

            Returns: void.
        """
        return


def get_linters(ts_filepaths, verbose_mode_enabled=False):
    """Creates OppiaAngularRootLinter and a mock ThirdPartyLinter
        objects and returns them.

    Args:
        ts_filepaths: list(str). A list of ts filepaths to check for
          Injectables.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        tuple(OppiaAngularRootLinter, ThirdPartyLinter). A 2-tuple
        of custom and third_party linter objects.
    """
    custom_linter = OppiaAngularRootLinter(ts_filepaths, verbose_mode_enabled)
    third_party_linter = ThirdPartyLinter(verbose_mode_enabled)

    return custom_linter, third_party_linter
