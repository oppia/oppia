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

"""Lint checks of other file types."""

from __future__ import annotations

import glob
import json
import os
import re

from core import utils

from typing import Any, Dict, List, Tuple
from typing_extensions import Final, TypedDict
import yaml

from .. import concurrent_task_utils

MYPY = False
if MYPY:  # pragma: no cover
    from scripts.linters import pre_commit_linter


class ThirdPartyLibDict(TypedDict):
    """Type for the dictionary representation of elements of THIRD_PARTY_LIB."""

    name: str
    dependency_key: str
    dependency_source: str
    type_defs_filename_prefix: str


STRICT_TS_CONFIG_FILE_NAME: Final = 'tsconfig-strict.json'
STRICT_TS_CONFIG_FILEPATH: Final = os.path.join(
    os.getcwd(), STRICT_TS_CONFIG_FILE_NAME)

WEBPACK_CONFIG_FILE_NAME: Final = 'webpack.common.config.ts'
WEBPACK_CONFIG_FILEPATH: Final = os.path.join(
    os.getcwd(), WEBPACK_CONFIG_FILE_NAME
)

APP_YAML_FILEPATH: Final = os.path.join(os.getcwd(), 'app_dev.yaml')

DEPENDENCIES_JSON_FILE_PATH: Final = os.path.join(
    os.getcwd(), 'dependencies.json'
)
PACKAGE_JSON_FILE_PATH: Final = os.path.join(os.getcwd(), 'package.json')
_TYPE_DEFS_FILE_EXTENSION_LENGTH: Final = len('.d.ts')
_DEPENDENCY_SOURCE_DEPENDENCIES_JSON: Final = 'dependencies.json'
_DEPENDENCY_SOURCE_PACKAGE: Final = 'package.json'

WORKFLOWS_DIR: Final = os.path.join(os.getcwd(), '.github', 'workflows')
WORKFLOW_FILENAME_REGEX: Final = r'\.(yaml)|(yml)$'
MERGE_STEP: Final = {'uses': './.github/actions/merge'}
WORKFLOWS_EXEMPT_FROM_MERGE_REQUIREMENT: Final = (
    'backend_tests.yml', 'pending-review-notification.yml',
    'revert-web-wiki-updates.yml', 'frontend_tests.yml')

THIRD_PARTY_LIBS: List[ThirdPartyLibDict] = [
    {
        'name': 'Guppy',
        'dependency_key': 'guppy',
        'dependency_source': _DEPENDENCY_SOURCE_DEPENDENCIES_JSON,
        'type_defs_filename_prefix': 'guppy-defs-'
    },
    {
        'name': 'Skulpt',
        'dependency_key': 'skulpt-dist',
        'dependency_source': _DEPENDENCY_SOURCE_DEPENDENCIES_JSON,
        'type_defs_filename_prefix': 'skulpt-defs-'
    },
    {
        'name': 'MIDI',
        'dependency_key': 'midiJs',
        'dependency_source': _DEPENDENCY_SOURCE_DEPENDENCIES_JSON,
        'type_defs_filename_prefix': 'midi-defs-'
    },
    {
        'name': 'Nerdamer',
        'dependency_key': 'nerdamer',
        'dependency_source': _DEPENDENCY_SOURCE_PACKAGE,
        'type_defs_filename_prefix': 'nerdamer-defs-'
    }
]


class CustomLintChecksManager:
    """Manages other files lint checks."""

    def __init__(self, file_cache: pre_commit_linter.FileCache) -> None:
        """Constructs a CustomLintChecksManager object.

        Args:
            file_cache: FileCache. Provides thread-safe access to cached
                file content.
        """
        self.file_cache = file_cache

    def check_skip_files_in_app_dev_yaml(
        self
    ) -> concurrent_task_utils.TaskResult:
        """Check to ensure that all lines in skip_files in app_dev.yaml
        reference valid files in the repository.
        """
        name = 'App dev file'

        failed = False
        error_messages = []
        skip_files_section_found = False
        for line_num, line in enumerate(self.file_cache.readlines(  # type: ignore[no-untyped-call]
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
                error_message = (
                    '%s --> Pattern on line %s doesn\'t match '
                    'any file or directory' % (
                        APP_YAML_FILEPATH, line_num + 1))
                error_messages.append(error_message)
                failed = True

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def check_third_party_libs_type_defs(
        self
    ) -> concurrent_task_utils.TaskResult:
        """Checks the type definitions for third party libs
        are up to date.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.
        """
        name = 'Third party type defs'

        failed = False
        error_messages = []

        dependencies_json = json.load(utils.open_file(
            DEPENDENCIES_JSON_FILE_PATH, 'r'))['dependencies']['frontend']

        package = json.load(utils.open_file(
            PACKAGE_JSON_FILE_PATH, 'r'))['dependencies']

        files_in_typings_dir = os.listdir(
            os.path.join(os.getcwd(), 'typings'))

        for third_party_lib in THIRD_PARTY_LIBS:
            lib_dependency_source = third_party_lib['dependency_source']

            if lib_dependency_source == _DEPENDENCY_SOURCE_DEPENDENCIES_JSON:
                lib_version = (
                    dependencies_json[
                        third_party_lib['dependency_key']]['version'])

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
                error_message = (
                    'There are multiple type definitions for %s in the typings '
                    'dir.' % third_party_lib['name'])
                error_messages.append(error_message)
                failed = True
            elif len(files_with_prefix_name) == 0:
                error_message = (
                    'There are no type definitions for %s in the typings '
                    'dir.' % third_party_lib['name'])
                error_messages.append(error_message)
                failed = True
            else:
                type_defs_filename = files_with_prefix_name[0]

                type_defs_version = type_defs_filename[
                    len(prefix_name): -_TYPE_DEFS_FILE_EXTENSION_LENGTH]

                if lib_version != type_defs_version:
                    error_message = (
                        'Type definitions for %s are not up to date. The '
                        'current version of %s is %s and the type definitions '
                        'are for version %s. Please refer typings/README.md '
                        'for more details.' % (
                            third_party_lib['name'], third_party_lib['name'],
                            lib_version, type_defs_version))
                    error_messages.append(error_message)
                    failed = True

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def check_webpack_config_file(self) -> concurrent_task_utils.TaskResult:
        """Check to ensure that the instances of HtmlWebpackPlugin in
        webpack.common.config.ts contains all needed keys.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.
        """
        name = 'Webpack config file'

        failed = False
        error_messages = []
        plugins_section_found = False
        htmlwebpackplugin_section_found = False
        for line_num, line in enumerate(self.file_cache.readlines(  # type: ignore[no-untyped-call]
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
                    error_message = (
                        'Line %s: The following keys: %s are missing in '
                        'HtmlWebpackPlugin block in %s' % (
                            error_line_num + 1, ', '.join(keys),
                            WEBPACK_CONFIG_FILE_NAME))
                    error_messages.append(error_message)
                    failed = True
            if htmlwebpackplugin_section_found:
                key = stripped_line.split(':')[0]
                if key in keys:
                    keys.remove(key)

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def check_github_workflows_use_merge_action(
        self
    ) -> concurrent_task_utils.TaskResult:
        """Checks that all github actions workflows use the merge action.

        Returns:
            TaskResult. A TaskResult object describing any workflows
            that failed to use the merge action.
        """
        name = 'Github workflows use merge action'
        workflow_paths = {
            os.path.join(WORKFLOWS_DIR, filename)
            for filename in os.listdir(WORKFLOWS_DIR)
            if re.search(WORKFLOW_FILENAME_REGEX, filename)
            if filename not in WORKFLOWS_EXEMPT_FROM_MERGE_REQUIREMENT
        }
        errors = []
        for workflow_path in workflow_paths:
            workflow_str = self.file_cache.read(workflow_path)  # type: ignore[no-untyped-call]
            workflow_dict = yaml.load(workflow_str, Loader=yaml.Loader)
            errors += self._check_that_workflow_steps_use_merge_action(
                workflow_dict, workflow_path)
        return concurrent_task_utils.TaskResult(
            name, bool(errors), errors, errors)

    # Here we use type Any because the argument 'workflow_dict' accept
    # dictionaries that represents the content of workflow YAML file and
    # that dictionaries can contain various types of values.
    @staticmethod
    def _check_that_workflow_steps_use_merge_action(
        workflow_dict: Dict[str, Any], workflow_path: str
    ) -> List[str]:
        """Check that a workflow uses the merge action.

        Args:
            workflow_dict: dict. Dictionary representation of the
                workflow YAML file.
            workflow_path: str. Path to workflow file.

        Returns:
            list(str). A list of error messages describing any jobs
            failing to use the merge action.
        """
        jobs_without_merge = []
        for job, job_dict in workflow_dict['jobs'].items():
            if MERGE_STEP not in job_dict['steps']:
                jobs_without_merge.append(job)
        error_messages = [
            '%s --> Job %s does not use the .github/actions/merge action.' % (
                workflow_path, job)
            for job in jobs_without_merge
        ]
        return error_messages

    def perform_all_lint_checks(self) -> List[concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """
        linter_stdout = []

        linter_stdout.append(self.check_skip_files_in_app_dev_yaml())
        linter_stdout.append(self.check_third_party_libs_type_defs())
        linter_stdout.append(self.check_webpack_config_file())
        linter_stdout.append(self.check_github_workflows_use_merge_action())

        return linter_stdout


def get_linters(
    file_cache: pre_commit_linter.FileCache
) -> Tuple[CustomLintChecksManager, None]:
    """Creates CustomLintChecksManager and returns it.

    Args:
        file_cache: object(FileCache). Provides thread-safe access to cached
            file content.

    Returns:
        tuple(CustomLintChecksManager, None). A 2-tuple of custom and
        third_party linter objects.
    """
    custom_linter = CustomLintChecksManager(file_cache)

    return custom_linter, None
