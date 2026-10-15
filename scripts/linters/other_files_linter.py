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
from typing import Any, Dict, Final, List, Set, Tuple, TypedDict

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

ASSETS_CONSTANTS_FILEPATH: Final = os.path.join(
    os.getcwd(), 'assets', 'constants.ts'
)

ROUTE_KEY_REGEX: Final = (
    r'PAGES_REGISTERED_WITH_FRONTEND(?:\s*\n\s*\.?|\.)([A-Z][A-Z_0-9]+)\s*\.ROUTE'
)

# Matches each PAGES_REGISTERED_WITH_FRONTEND entry and captures its key and
# ROUTE path. Non-brace characters are allowed between the entry's opening brace
# and "ROUTE" so that a leading comment (as on the story-viewer entry) does not
# hide the path; no nested object literal ever precedes "ROUTE" in this block.
FRONTEND_ROUTE_PATH_REGEX: Final = (
    r'"([A-Z][A-Z_0-9]+)"\s*:\s*\{[^{}]*"ROUTE"\s*:\s*"([^"]*)"'
)
ROUTES_WITH_NO_STANDALONE_PAGE_REGEX: Final = (
    r'"ROUTES_WITH_NO_STANDALONE_PAGE"\s*:\s*\[([^\]]*)\]'
)
QUOTED_STRING_REGEX: Final = r'"([^"]+)"'


def _extract_top_level_route_objects(content: str) -> List[str]:
    """Returns each top-level (outermost) balanced curly-brace group.

    Route objects in app.routing.module.ts are object literals that follow a
    `PAGES_REGISTERED_WITH_FRONTEND.<KEY>.ROUTE` path. Scanning for balanced
    braces keeps each route object's key and its lazy import together even
    when the object contains nested object literals (such as a data block) or
    a block-bodied loadChildren.

    Args:
        content: str. The normalized routing module source.

    Returns:
        list(str). The text of each outermost balanced {...} group, in
        source order.
    """
    route_objects = []
    start_index = -1
    depth = 0
    for index, char in enumerate(content):
        if char == '{':
            if depth == 0:
                start_index = index
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0 and start_index != -1:
                route_objects.append(content[start_index : index + 1])
                start_index = -1
    return route_objects


def _get_routes_without_standalone_pages(constants_content: str) -> Set[str]:
    """Gets the route keys that have no standalone Lighthouse page.

    The ROUTES_WITH_NO_STANDALONE_PAGE constant lists the keys of routes that
    are pure redirect handlers (for example login and logout), so that the
    coverage check can skip them without an inline hardcoded list.

    Args:
        constants_content: str. The contents of assets/constants.ts, where
            ROUTES_WITH_NO_STANDALONE_PAGE is defined.

    Returns:
        set(str). The route keys listed in ROUTES_WITH_NO_STANDALONE_PAGE,
        or an empty set if the constant is not present.
    """
    array_match = re.search(
        ROUTES_WITH_NO_STANDALONE_PAGE_REGEX, constants_content
    )
    if not array_match:
        return set()
    return set(re.findall(QUOTED_STRING_REGEX, array_match.group(1)))


def _get_frontend_route_paths(constants_content: str) -> Dict[str, str]:
    """Maps each PAGES_REGISTERED_WITH_FRONTEND key to its ROUTE path.

    The path pattern only exists in assets/constants.ts, so it is read here to
    compare each route against the URLs audited by Lighthouse.

    Args:
        constants_content: str. The contents of assets/constants.ts, where
            PAGES_REGISTERED_WITH_FRONTEND is defined.

    Returns:
        dict(str, str). Maps each route key to its registered path pattern (for
        example EXPLORATION_PLAYER_EMBED to
        "embed/exploration/:exploration_id").
    """
    return dict(re.findall(FRONTEND_ROUTE_PATH_REGEX, constants_content))


def _path_to_segments(path: str) -> List[str]:
    """Splits a path into its non-empty segments.

    Args:
        path: str. The path to split, possibly including a query or fragment.

    Returns:
        list(str). The non-empty segments of the path. The root path yields an
        empty list.
    """
    stripped_path = path.split('?', 1)[0].split('#', 1)[0].strip()
    segments = stripped_path.strip('/').split('/')
    return [segment for segment in segments if segment]


def _url_to_path_segments(url: str) -> List[str]:
    """Splits a URL into its path segments, ignoring host, query and fragment.

    Args:
        url: str. The URL to split.

    Returns:
        list(str). The path segments, without leading or trailing empty
        segments. The root path yields an empty list.
    """
    without_scheme = url.split('://', 1)[-1]
    slash_index = without_scheme.find('/')
    path = without_scheme[slash_index:] if slash_index != -1 else '/'
    return _path_to_segments(path)


def _route_path_covers_page(
    route_segments: List[str], page_segments: List[str]
) -> bool:
    """Checks whether a route's path is audited by a page's URL path.

    A route is covered when its path matches the leading segments of a page's
    URL path. A route segment is a wildcard when it is a router parameter
    (``:name``), and a page segment is a wildcard when it is a Lighthouse
    placeholder (``{{name}}``). This lets a concrete sample value in the page
    URL (for example ``collection/0``) match a parameterised route
    (``collection/:collection_id``), and lets a page URL that extends a route
    with child-route segments (for example ``.../story`` under the topic-viewer
    route) still count as covering that route.

    Matching on the URL rather than on the lazy-imported module is deliberate:
    a route that merely shares a module with an audited route (for example the
    embedded exploration player, which reuses the exploration-player module)
    must still be reported as uncovered.

    Args:
        route_segments: list(str). The segments of the route's path.
        page_segments: list(str). The segments of the page URL's path.

    Returns:
        bool. Whether the page's URL audits the route.
    """
    if len(route_segments) > len(page_segments):
        return False
    for route_segment, page_segment in zip(route_segments, page_segments):
        if route_segment.startswith(':'):
            continue
        if page_segment.startswith('{{') and page_segment.endswith('}}'):
            continue
        if route_segment != page_segment:
            return False
    return True


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

        A route is covered only when the URL of some Lighthouse page audits it:
        the page's URL path must lead with the route's path, treating router
        parameters and Lighthouse placeholders as wildcards. Matching on the
        URL rather than on the lazy-imported module is deliberate, so that a
        route which merely shares a module with an audited route (for example
        the embedded exploration player, which reuses the exploration-player
        module) is still reported as uncovered.

        The entries in lighthouse-pages.json and lighthouse-shards.json are
        intentionally ordered to group pages that share the same puppeteer
        setup under one shard, which keeps each shard's data setup minimal.
        This check only requires every route to be covered, so re-sorting the
        files for alphabetical consistency is neither needed nor desired.

        Returns:
            TaskResult. A TaskResult object representing the result of the
            lint check.
        """
        name = 'Lighthouse page coverage'

        error_messages: List[str] = []

        routing_content = self.file_cache.read(APP_ROUTING_MODULE_FILEPATH)
        lh_pages_content = self.file_cache.read(LIGHTHOUSE_PAGES_JSON_FILEPATH)
        constants_content = self.file_cache.read(ASSETS_CONSTANTS_FILEPATH)

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

        # The path segments that each Lighthouse page's URL audits.
        lh_pages = json.loads(lh_pages_content)
        page_paths = [
            _url_to_path_segments(page_entry.get('url', ''))
            for page_entry in lh_pages.values()
        ]

        # The registered path of each route key, used to compare a route
        # against the URLs audited above.
        key_to_route_path = _get_frontend_route_paths(constants_content)

        # Find routes that have no corresponding Lighthouse page entry.
        routes_without_standalone_pages = _get_routes_without_standalone_pages(
            constants_content
        )
        # Splitting on every '{' would break routes that contain nested object
        # literals (e.g. a data object) or a block-bodied loadChildren, so each
        # top-level route object is extracted as a whole to keep the key
        # together with the rest of the route. A dict keeps only the distinct
        # route keys.
        routing_keys: Dict[str, bool] = {}
        for route_object in _extract_top_level_route_objects(normalized):
            key_match = re.search(ROUTE_KEY_REGEX, route_object)
            if not key_match:
                continue
            routing_keys[key_match.group(1)] = True

        uncovered_keys = []
        for key in sorted(routing_keys):
            # Routes listed in ROUTES_WITH_NO_STANDALONE_PAGE (for example
            # login and logout) are pure redirect handlers without a dedicated
            # page to audit, so they cannot have a Lighthouse page entry and
            # are not part of the coverage check.
            if key in routes_without_standalone_pages:
                continue
            route_path = key_to_route_path.get(key)
            if route_path is None:
                uncovered_keys.append(key)
                continue
            route_segments = _path_to_segments(route_path)
            covered = any(
                _route_path_covers_page(route_segments, page_path)
                for page_path in page_paths
            )
            if not covered:
                uncovered_keys.append(key)

        if uncovered_keys:
            error_messages.append(
                'Routes found in app.routing.module.ts whose URL is not '
                'audited by any page in core/tests/lighthouse-pages.json:\n\n'
                '  %s\n\n'
                'Add a lighthouse-pages.json entry whose url reaches each '
                'route above.' % '\n  '.join(sorted(uncovered_keys))
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
