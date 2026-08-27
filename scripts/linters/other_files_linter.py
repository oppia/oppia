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

import json
import os
import re

import yaml
from typing import Any, Dict, Final, List, Tuple, TypedDict

from .. import concurrent_task_utils
from . import linter_utils

MYPY = False
if MYPY:  # pragma: no cover
    from scripts.linters import run_lint_checks


class ThirdPartyLibDict(TypedDict):
    """Type for the dictionary representation of elements of THIRD_PARTY_LIB."""

    name: str
    dependency_key: str
    dependency_source: str
    type_defs_filename_prefix: str


STRICT_TS_CONFIG_FILE_NAME: Final = 'tsconfig-strict.json'
STRICT_TS_CONFIG_FILEPATH: Final = os.path.join(
    os.getcwd(), STRICT_TS_CONFIG_FILE_NAME
)

PLAYWRIGHT_USER_UTILITIES_DIR: Final = os.path.join(
    os.getcwd(),
    'core',
    'tests',
    'playwright-acceptance-tests',
    'utilities',
    'user',
)
METHOD_NAME_REGEX: Final = r'async\s+(\w+)\s*\('

APP_YAML_FILEPATH: Final = os.path.join(os.getcwd(), 'app_dev.yaml')

APP_ROUTING_MODULE_FILEPATH: Final = os.path.join(
    os.getcwd(),
    'core',
    'templates',
    'pages',
    'oppia-root',
    'routing',
    'app.routing.module.ts',
)

LIGHTHOUSE_PAGES_JSON_FILEPATH: Final = os.path.join(
    os.getcwd(), 'core', 'tests', 'lighthouse-pages.json'
)

ROUTE_KEY_REGEX: Final = (
    r'PAGES_REGISTERED_WITH_FRONTEND(?:\s*\n\s*\.?|\.)([A-Z][A-Z_0-9]+)\s*\.ROUTE'
)

MODULE_IMPORT_REGEX: Final = r"""import\(\s*'(pages/[^']+)'\s*\)"""

PACKAGE_JSON_FILE_PATH: Final = os.path.join(os.getcwd(), 'package.json')
_TYPE_DEFS_FILE_EXTENSION_LENGTH: Final = len('.d.ts')
_DEPENDENCY_SOURCE_PACKAGE: Final = 'package.json'

WORKFLOWS_DIR: Final = os.path.join(os.getcwd(), '.github', 'workflows')
WORKFLOW_FILENAME_REGEX: Final = r'\.(yaml)|(yml)$'
GIT_COMMIT_HASH_REGEX: Final = r'^git\+https:\/\/github\.com\/.*#(.*)$'

THIRD_PARTY_LIBS: List[ThirdPartyLibDict] = [
    {
        'name': 'Guppy',
        'dependency_key': 'guppy-dev',
        'dependency_source': _DEPENDENCY_SOURCE_PACKAGE,
        'type_defs_filename_prefix': 'guppy-defs-',
    },
    {
        'name': 'Skulpt',
        'dependency_key': 'skulpt-dist',
        'dependency_source': _DEPENDENCY_SOURCE_PACKAGE,
        'type_defs_filename_prefix': 'skulpt-defs-',
    },
    {
        'name': 'MIDI',
        'dependency_key': 'midi',
        'dependency_source': _DEPENDENCY_SOURCE_PACKAGE,
        'type_defs_filename_prefix': 'midi-defs-',
    },
    {
        'name': 'Nerdamer',
        'dependency_key': 'nerdamer',
        'dependency_source': _DEPENDENCY_SOURCE_PACKAGE,
        'type_defs_filename_prefix': 'nerdamer-defs-',
    },
]

# Routes that are not covered by Lighthouse tests. Each entry is a
# PAGES_REGISTERED_WITH_FRONTEND key name. Do not add new routes to
# this list without asking @Hardikgoyal2003.
LIGHTHOUSE_ROUTE_EXCLUSIONS: Final = {
    'ANDROID',
    'BLOG_ADMIN',
    'BLOG_AUTHOR_PROFILE_PAGE',
    'BLOG_HOMEPAGE',
    'BLOG_HOMEPAGE_SEARCH',
    'BLOG_POST_PAGE',
    'CERTIFICATE_ASSESSMENT_PLAYER',
    'CERTIFICATE_ASSESSMENT_RESULT',
    'CERTIFICATE_CREATOR_DASHBOARD',
    'CERTIFICATE_OFFERING_AVAILABLE',
    'CLASSROOMS',
    'COLLECTION_EDITOR',
    'COLLECTION_PLAYER',
    'CONTRIBUTOR_DASHBOARD_ADMIN',
    'CREATE_CERTIFICATE_OFFERING',
    'CURRICULUM_ADMIN',
    'DIAGNOSTIC_TEST_PLAYER',
    'EDIT_CERTIFICATE_OFFERING',
    'END_OF_ARC_TEST',
    'ERROR',
    'ERROR_IFRAMED',
    'EXPLORATION_PLAYER_EMBED',
    'FACILITATOR_DASHBOARD',
    'FEEDBACK_UPDATES',
    'LEARNER_GROUP_CREATOR',
    'LEARNER_GROUP_EDITOR',
    'LEARNER_GROUP_VIEWER',
    'LESSON_PLAYER_EMBED',
    'LIBRARY_RECENTLY_PUBLISHED',
    'LIBRARY_SEARCH',
    'LIBRARY_TOP_RATED',
    'LOGIN',
    'LOGOUT',
    'MAINTENANCE',
    'MASTERY_CHALLENGE',
    'NEW_LESSON_PLAYER',
    'NODE_PRACTICE_SESSION',
    'PARTNERSHIPS',
    'PENDING_ACCOUNT_DELETION',
    'PRACTICE_SESSION',
    'RELEASE_COORDINATOR_PAGE',
    'REVIEW_TEST',
    'SUBTOPIC_VIEWER',
    'TECHNICAL_FEEDBACK_DASHBOARD',
    'TECHNICAL_FEEDBACK_DETAIL',
    'VOICEOVER_ADMIN',
}


class CustomLintChecksManager(linter_utils.BaseLinter):
    """Manages other files lint checks."""

    def __init__(self, file_cache: run_lint_checks.FileCache) -> None:
        """Constructs a CustomLintChecksManager object.

        Args:
            file_cache: FileCache. Provides thread-safe access to cached
                file content.
        """
        self.file_cache = file_cache

    def check_duplicate_method_names_in_user_utilities(
        self,
    ) -> concurrent_task_utils.TaskResult:
        """Checks that no method name is defined in more than one file
        under the Playwright user utilities directory.

        Since UserFactory composes multiple role classes onto a single
        user object, two files defining a method with the same name can
        silently overwrite one another at runtime. This check ensures
        every method name is unique across all user utility files.

        Returns:
            TaskResult. A TaskResult object representing the result of the
            lint check.
        """
        name = 'Duplicate method names in user utilities'

        utility_filenames = {
            filename
            for filename in os.listdir(PLAYWRIGHT_USER_UTILITIES_DIR)
            if filename.endswith('.ts')
        }

        method_name_to_filenames: Dict[str, List[str]] = {}
        for filename in utility_filenames:
            filepath = os.path.join(PLAYWRIGHT_USER_UTILITIES_DIR, filename)
            file_content = self.file_cache.read(filepath)
            method_names = re.findall(METHOD_NAME_REGEX, file_content)
            for method_name in method_names:
                method_name_to_filenames.setdefault(method_name, []).append(
                    filename
                )

        error_messages = []
        for method_name, filenames in sorted(method_name_to_filenames.items()):
            if len(filenames) > 1:
                error_messages.append(
                    'Method "%s" is defined in multiple user utility '
                    'files: %s. Rename to disambiguate, following the '
                    'convention {action}In{PageContext}Page.'
                    % (method_name, ', '.join(sorted(filenames)))
                )

        return concurrent_task_utils.TaskResult(
            name, bool(error_messages), error_messages, error_messages
        )

    def check_skip_files_in_app_dev_yaml(
        self,
    ) -> concurrent_task_utils.TaskResult:
        """Check skip_files section in app_dev.yaml follows expected format.

        We validate the format of entries in the "# Third party files:" block
        using a regex that matches versioned paths under third_party/static
        instead of consulting the filesystem.
        """
        name = 'App dev file'

        failed = False
        error_messages: List[str] = []
        skip_files_section_found = False

        for line_num, line in enumerate(
            self.file_cache.readlines(APP_YAML_FILEPATH)
        ):
            stripped_line = line.strip()

            if '# Third party files:' in stripped_line:
                skip_files_section_found = True
                continue

            if not skip_files_section_found:
                continue

            # Stop once we leave the section.
            if stripped_line and not stripped_line.startswith(('-', '#')):
                break

            if not stripped_line or stripped_line.startswith('#'):
                continue

            # Extract pattern (remove "- ")
            line_in_concern = stripped_line[len('- ') :]

            # Validate expected format instead of checking filesystem.
            if not re.match(
                r'^third_party/static/.+-\d+\.\d+\.\d+/?$',
                line_in_concern,
            ):
                error_message = (
                    '%s --> Pattern on line %s doesn\'t match '
                    'any file or directory' % (APP_YAML_FILEPATH, line_num + 1)
                )
                error_messages.append(error_message)
                failed = True

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages
        )

    def check_third_party_libs_type_defs(
        self,
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

        package = json.load(
            open(PACKAGE_JSON_FILE_PATH, 'r', encoding='utf-8')
        )['dependencies']

        files_in_typings_dir = os.listdir(os.path.join(os.getcwd(), 'typings'))

        for third_party_lib in THIRD_PARTY_LIBS:
            lib_dependency_source = third_party_lib['dependency_source']

            if lib_dependency_source == _DEPENDENCY_SOURCE_PACKAGE:
                lib_version = package[third_party_lib['dependency_key']]

                if lib_version[0] == '^':
                    lib_version = lib_version[1:]
                # In cases where the version is in the form of git commit hashes
                # such as 'git+https://github.com/username/repo#commit-hash',
                # we extract the commit hash and use it as the version.
                elif re.search(GIT_COMMIT_HASH_REGEX, lib_version):
                    match = re.search(GIT_COMMIT_HASH_REGEX, lib_version)
                    # We must verify that the match is not None because
                    # re.search() returns None when no match is found. Although
                    # we already check this in the elif statement, the mypy type
                    # check fails, so we need to include this check here.
                    if match:
                        lib_version = match.group(1)

            prefix_name = third_party_lib['type_defs_filename_prefix']

            files_with_prefix_name = []

            files_with_prefix_name = [
                file_name
                for file_name in files_in_typings_dir
                if file_name.startswith(prefix_name)
            ]

            if len(files_with_prefix_name) > 1:
                error_message = (
                    'There are multiple type definitions for %s in the typings '
                    'dir.' % third_party_lib['name']
                )
                error_messages.append(error_message)
                failed = True
            elif len(files_with_prefix_name) == 0:
                error_message = (
                    'There are no type definitions for %s in the typings '
                    'dir.' % third_party_lib['name']
                )
                error_messages.append(error_message)
                failed = True
            else:
                type_defs_filename = files_with_prefix_name[0]

                type_defs_version = type_defs_filename[
                    len(prefix_name) : -_TYPE_DEFS_FILE_EXTENSION_LENGTH
                ]

                if lib_version != type_defs_version:
                    error_message = (
                        'Type definitions for %s are not up to date. The '
                        'current version of %s is %s and the type definitions '
                        'are for version %s. Please refer typings/README.md '
                        'for more details.'
                        % (
                            third_party_lib['name'],
                            third_party_lib['name'],
                            lib_version,
                            type_defs_version,
                        )
                    )
                    error_messages.append(error_message)
                    failed = True

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages
        )

    def check_github_workflows_have_name(
        self,
    ) -> concurrent_task_utils.TaskResult:
        """Checks that all github actions workflow steps have a name.

        Returns:
            TaskResult. A TaskResult object describing any workflows
            steps that do not have a name.
        """
        name = 'Github workflow steps have a name'
        workflow_paths = {
            os.path.join(WORKFLOWS_DIR, filename)
            for filename in os.listdir(WORKFLOWS_DIR)
            if re.search(WORKFLOW_FILENAME_REGEX, filename)
        }
        errors = []
        for workflow_path in workflow_paths:
            workflow_str = self.file_cache.read(workflow_path)
            workflow_dict = yaml.safe_load(workflow_str)
            errors += self._check_that_workflow_steps_have_name(
                workflow_dict, workflow_path
            )
        return concurrent_task_utils.TaskResult(
            name, bool(errors), errors, errors
        )

    # Here we use type Any because the argument 'workflow_dict' accepts
    # dictionaries that represents the content of workflow YAML file and
    # those dictionaries can contain various types of values.
    @staticmethod
    def _check_that_workflow_steps_have_name(
        workflow_dict: Dict[str, Any], workflow_path: str
    ) -> List[str]:
        """Check that workflow steps has a name.

        Args:
            workflow_dict: dict. Dictionary representation of the
                workflow YAML file.
            workflow_path: str. Path to workflow file.

        Returns:
            list(str). A list of error messages describing any jobs
            with unnamed steps.
        """
        jobs_with_unnamed_step = []
        for job, job_dict in workflow_dict['jobs'].items():
            if 'steps' in job_dict and any(
                'name' not in step for step in job_dict['steps']
            ):
                jobs_with_unnamed_step.append(job)
        return [
            '%s --> Job %s has an unnamed step' % (workflow_path, job)
            for job in jobs_with_unnamed_step
        ]

    def check_lighthouse_page_coverage(
        self,
    ) -> concurrent_task_utils.TaskResult:
        """Checks that every route in the routing module has a corresponding
        Lighthouse page entry in lighthouse-pages.json, or is explicitly
        listed in the exclusion set.

        Returns:
            TaskResult. A TaskResult object representing the result of the
            lint check.
        """
        name = 'Lighthouse page coverage'

        error_messages: List[str] = []

        routing_content = self.file_cache.read(APP_ROUTING_MODULE_FILEPATH)
        lh_pages_content = self.file_cache.read(LIGHTHOUSE_PAGES_JSON_FILEPATH)

        # Normalize routing content: remove single-line comments and
        # join string-concatenated import paths so that the regex can
        # match them reliably.
        normalized = re.sub(r'//[^\n]*', '', routing_content)
        # The regex and replacement contain literal single quotes from
        # the TypeScript source, so double-quote delimiters are required.
        normalized = re.sub(
            r"'([^']+)'\s*\+\s*\n?\s*'([^']+)'",  # pylint: disable=invalid-string-quote
            r"'\1\2'",  # pylint: disable=invalid-string-quote
            normalized,
        )

        # Parse lighthouse-pages.json and extract page_module paths,
        # normalized to match the routing module import format.
        lh_pages = json.loads(lh_pages_content)
        lh_modules = set()
        for page_entry in lh_pages.values():
            page_module = page_entry.get('page_module', '')
            if page_module.startswith('core/templates/'):
                page_module = page_module[len('core/templates/') :]
            if page_module.endswith('.ts'):
                page_module = page_module[:-3]
            lh_modules.add(os.path.normpath(page_module))

        # Parse each route block to find the key and its associated
        # module import path. Splitting on '{' captures each route
        # object as a block.
        key_to_modules: Dict[str, List[str]] = {}
        route_blocks = re.split(r'\{', normalized)
        for block in route_blocks:
            key_match = re.search(ROUTE_KEY_REGEX, block)
            if not key_match:
                continue
            key = key_match.group(1)
            import_matches = re.findall(MODULE_IMPORT_REGEX, block)
            if import_matches:
                key_to_modules.setdefault(key, []).extend(import_matches)

        # Also check routes pushed dynamically (via routes.push).
        push_blocks = re.split(r'routes\.push\(', normalized)
        for block in push_blocks:
            key_match = re.search(ROUTE_KEY_REGEX, block)
            if not key_match:
                continue
            key = key_match.group(1)
            import_matches = re.findall(MODULE_IMPORT_REGEX, block)
            if import_matches:
                key_to_modules.setdefault(key, []).extend(import_matches)

        # Find routes that have no corresponding Lighthouse page entry.
        uncovered_keys = []
        for key, modules in sorted(key_to_modules.items()):
            if key in LIGHTHOUSE_ROUTE_EXCLUSIONS:
                continue
            covered = any(os.path.normpath(m) in lh_modules for m in modules)
            if not covered:
                uncovered_keys.append(key)

        if uncovered_keys:
            error_messages.append(
                'New routes found in app.routing.module.ts that are '
                'missing from core/tests/lighthouse-pages.json:\n\n'
                '  %s\n\n'
                'Add a corresponding page_module entry to '
                'lighthouse-pages.json for each route above.'
                % '\n  '.join(sorted(uncovered_keys))
            )

        return concurrent_task_utils.TaskResult(
            name, bool(error_messages), error_messages, error_messages
        )

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
        linter_stdout.append(self.check_github_workflows_have_name())
        linter_stdout.append(
            self.check_duplicate_method_names_in_user_utilities()
        )
        linter_stdout.append(self.check_lighthouse_page_coverage())

        return linter_stdout


def get_linters(
    file_cache: run_lint_checks.FileCache,
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
