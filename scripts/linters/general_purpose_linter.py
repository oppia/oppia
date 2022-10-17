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

"""Lint checks used by all the linters."""

from __future__ import annotations

import os
import re

from typing import Dict, List, Pattern, Tuple
from typing_extensions import Final, TypedDict

from . import js_ts_linter
from . import warranted_angular_security_bypasses

from .. import build
from .. import common
from .. import concurrent_task_utils

MYPY = False
if MYPY:  # pragma: no cover
    from scripts.linters import pre_commit_linter


class BadPatternRegexpDict(TypedDict):
    """Dictionary representation of bad pattern regular expressions."""

    regexp: Pattern[str]
    message: str
    excluded_files: Tuple[str, ...]
    excluded_dirs: Tuple[str, ...]


class BadPatternsDict(TypedDict):
    """Dictionary representation of bad patterns."""

    message: str
    excluded_files: Tuple[str, ...]
    excluded_dirs: Tuple[str, ...]


class MandatoryPatternsRegexpDict(TypedDict):
    """Dictionary representation of mandatory pattern regular expressions."""

    regexp: Pattern[str]
    message: str
    included_types: Tuple[str, ...]
    excluded_files: Tuple[str, ...]
    excluded_dirs: Tuple[str, ...]


class BadStringsConstantsDict(TypedDict):
    """Type for the dictionary representation of BAD_STRINGS_CONSTANTS dict."""

    message: str
    excluded_files: Tuple[str, ...]


EXCLUDED_PATHS: Final = (
    'third_party/*', 'build/*', '.git/*', '*.pyc', 'CHANGELOG',
    'integrations/*', 'integrations_dev/*', '*.svg', '*.gif', '*.png',
    '*.webp', '*.zip', '*.ico', '*.jpg', '*.min.js', 'backend_prod_files/*',
    'assets/scripts/*', 'core/domain/proto/*.py', 'core/tests/data/*',
    'core/tests/build_sources/*', '*.mp3', '*.mp4', 'node_modules/*',
    'typings/*', 'local_compiled_js/*', 'webpack_bundles/*',
    'core/tests/services_sources/*', 'core/tests/release_sources/tmp_unzip.zip',
    'scripts/linters/test_files/*', 'proto_files/*',
    'core/tests/release_sources/tmp_unzip.tar.gz',
    'core/templates/combined-tests.spec.ts',
    'core/templates/css/oppia-material.css',
    'core/templates/google-analytics.initializer.ts',
    'extensions/classifiers/proto/*',
    '%s/*' % js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH)

GENERATED_FILE_PATHS: Final = (
    'core/templates/expressions/parser.js',)

CONFIG_FILE_PATHS: Final = (
    'core/tests/.browserstack.env.example',
    'core/tests/wdio.conf.js',
    'core/tests/karma.conf.ts',
    'core/templates/mathjaxConfig.ts',
    'assets/constants.ts',
    'assets/rich_text_components_definitions.ts',
    'webpack.config.ts',
    'webpack.dev.config.ts',
    'webpack.prod.config.ts')

BAD_STRINGS_CONSTANTS: Dict[str, BadStringsConstantsDict] = {
    '"DEV_MODE": false': {
        'message': 'Please set the DEV_MODE variable in constants.ts '
                   'to true before committing.',
        'excluded_files': ()
    },
    '"EMULATOR_MODE": false': {
        'message': 'Please set the EMULATOR_MODE variable in constants.ts '
                   'to true before committing.',
        'excluded_files': ()
    }
}

BAD_PATTERNS: Dict[str, BadPatternsDict] = {
    '\t': {
        'message': 'Please use spaces instead of tabs.',
        'excluded_files': (),
        'excluded_dirs': (
            'assets/i18n/', 'core/tests/build_sources/assets/')},
    '\r': {
        'message': 'Please make sure all files only have LF endings (no CRLF).',
        'excluded_files': (),
        'excluded_dirs': ()},
    '<<<<<<<': {
        'message': 'Please fully resolve existing merge conflicts.',
        'excluded_files': (),
        'excluded_dirs': ()},
    '>>>>>>>': {
        'message': 'Please fully resolve existing merge conflicts.',
        'excluded_files': (),
        'excluded_dirs': ()},
    'glyphicon': {
        'message': 'Please use equivalent material-icons '
                   'instead of glyphicons.',
        'excluded_files': (),
        'excluded_dirs': ()}
}

BAD_PATTERNS_REGEXP: List[BadPatternRegexpDict] = [
    {
        'regexp': re.compile(r'TODO[^\(]*[^\)][^:]*[^A-Z]+[^\w]*$'),
        'message': 'Please link TODO comments to an issue '
                   'in the format TODO(#issuenum): XXX. ',
        'excluded_files': (),
        'excluded_dirs': ()
    }
]

MANDATORY_PATTERNS_REGEXP: List[MandatoryPatternsRegexpDict] = [
    {
        'regexp': re.compile(
            r'Copyright \d{4} The Oppia Authors\. All Rights Reserved\.'),
        'message': 'Please ensure this file should contain a proper '
                   'copyright notice.',
        'included_types': ('.py', '.js', '.sh', '.ts'),
        'excluded_files': GENERATED_FILE_PATHS + CONFIG_FILE_PATHS + (
            '__init__.py', ),
        'excluded_dirs': EXCLUDED_PATHS
    },
    {
        'regexp': re.compile('from __future__ import annotations'),
        'message': 'Please ensure this file should contain annotations '
                   'future import.',
        'included_types': ('.py',),
        'excluded_files': GENERATED_FILE_PATHS + CONFIG_FILE_PATHS + (
            '__init__.py',),
        'excluded_dirs': EXCLUDED_PATHS
    }
]

MANDATORY_PATTERNS_JS_REGEXP: List[MandatoryPatternsRegexpDict] = [
    {
        'regexp': re.compile(r'^\s\*\s@fileoverview\s[a-zA-Z0-9_]+'),
        'message': 'Please ensure this file should contain a file '
                   'overview i.e. a short description of the file.',
        'included_types': ('.js', '.ts'),
        'excluded_files': GENERATED_FILE_PATHS + CONFIG_FILE_PATHS,
        'excluded_dirs': EXCLUDED_PATHS
    }
]

BAD_LINE_PATTERNS_HTML_REGEXP: List[BadPatternRegexpDict] = [
    {
        'regexp': re.compile(r'text\/ng-template'),
        'message': 'The directives must be directly referenced.',
        'excluded_files': (),
        'excluded_dirs': (
            'extensions/answer_summarizers/',
            'extensions/classifiers/',
            'extensions/objects/',
            'extensions/value_generators/')
    },
    {
        'regexp': re.compile(r'[ \t]+$'),
        'message': 'There should not be any trailing whitespaces.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\$parent'),
        'message': 'Please do not access parent properties ' +
                   'using $parent. Use the scope object ' +
                   'for this purpose.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\s+style\s*=\s*'),
        'message': 'Please do not use inline styling.',
        'excluded_files': (),
        'excluded_dirs': ()
    }
]

BAD_PATTERNS_PYTHON_REGEXP: List[BadPatternRegexpDict] = [
    {
        'regexp': re.compile(r'__author__'),
        'message': 'Please remove author tags from this file.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'ndb\.'),
        'message': (
            'Please use datastore_services instead of ndb, for example:\n'
            '\n'
            'datastore_services = models.Registry.import_datastore_services()\n'
            '\n'
            'class SampleModel(datastore_services.Model):\n'
            '    ...\n'),
        'excluded_files': (),
        'excluded_dirs': ('core/platform',),
    },
    {
        'regexp': re.compile(r'\Wprint\('),
        'message': 'Please do not use print statement.',
        'excluded_files': (
            'core/tests/test_utils.py',
            'core/tests/performance_framework/perf_domain.py',
            'core/tests/test_utils_test.py'),
        'excluded_dirs': ('scripts/',)
    },
    {
        'regexp': re.compile(r'# pylint:\s*disable=[A-Z][0-9]{4}'),
        'message': 'Please remove pylint exclusion if it is unnecessary, or '
                   'make it human readable with a sentence instead of an id. '
                   'The id-to-message list can be seen '
                   'here->http://pylint-messages.wikidot.com/all-codes',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urlretrieve\('),
        'message': 'Please use scripts.common.url_retrieve instead of '
                   'urllib.request.urlretrieve.',
        'excluded_files': (),
        'excluded_dirs': (
            'assets/',
            'core/',
            'data/',
            'extensions/',
            'jobs/',
        ),
    },
]

BAD_PATTERNS_MAP: Dict[str, List[BadPatternRegexpDict]] = {
    '.html': BAD_LINE_PATTERNS_HTML_REGEXP,
    '.py': BAD_PATTERNS_PYTHON_REGEXP
}


def is_filepath_excluded_for_bad_patterns_check(
    pattern: str, filepath: str
) -> bool:
    """Checks if file is excluded from the bad patterns check.

    Args:
        pattern: str. The pattern to be checked against.
        filepath: str. Path of the file.

    Returns:
        bool. Whether to exclude the given file from this
        particular pattern check.
    """
    return (any(
        filepath.startswith(bad_pattern)
        for bad_pattern in BAD_PATTERNS[pattern]['excluded_dirs'])
            or filepath in BAD_PATTERNS[pattern]['excluded_files'])


def check_bad_pattern_in_file(
    filepath: str, file_content: str, pattern: BadPatternRegexpDict
) -> Tuple[bool, List[str]]:
    """Detects whether the given pattern is present in the file.

    Args:
        filepath: str. Path of the file.
        file_content: str. Contents of the file.
        pattern: dict. (regexp(regex pattern) : Object containing details for
            the pattern to be checked. Pattern to match:
                message: str. Message to show if pattern matches.
                excluded_files: tuple(str). Files to be excluded from matching.
                excluded_dirs: tuple(str). Directories to be excluded from
                    matching).

    Returns:
        tuple(bool, list(str)). A 2-tuple whose first element is a bool
        which set to True if there is bad pattern found else False, whose second
        element is a list of failed messages.
    """
    error_messages = []
    failed = False
    regexp = pattern['regexp']
    if not (any(
            filepath.startswith(excluded_dir)
            for excluded_dir in pattern['excluded_dirs'])
            or any(
                filepath.endswith(excluded_file)
                for excluded_file in pattern['excluded_files'])):
        bad_pattern_count = 0
        for line_num, line in enumerate(file_content, 1):
            if line.endswith('\n'):
                stripped_line = line[:-1]
            else:
                stripped_line = line
            if stripped_line.endswith('disable-bad-pattern-check'):
                continue
            if regexp.search(stripped_line):
                error_message = ('%s --> Line %s: %s' % (
                    filepath, line_num, pattern['message']))
                error_messages.append(error_message)
                bad_pattern_count += 1
        if bad_pattern_count:
            failed = True
            return failed, error_messages
    return failed, error_messages


def check_file_type_specific_bad_pattern(
    filepath: str, content: str
) -> Tuple[bool, int, List[str]]:
    """Check the file content based on the file's extension.

    Args:
        filepath: str. Path of the file.
        content: str. Contents of the file.

    Returns:
        bool. True if there is bad pattern else false.
        int. The number of errors.
        List[str]. All error messages.
    """
    error_messages = []
    failed = False
    _, extension = os.path.splitext(filepath)
    pattern = BAD_PATTERNS_MAP.get(extension)
    total_error_count = 0
    if pattern:
        for regexp in pattern:
            failed, error_message = check_bad_pattern_in_file(
                filepath, content, regexp)
            error_messages.extend(error_message)
            if failed:
                total_error_count += 1
    if total_error_count:
        failed = True
    return failed, total_error_count, error_messages


class GeneralPurposeLinter:
    """Manages all the common linting functions. As an abstract base class, this
    is not intended to be used directly.
    """

    def __init__(
        self, files_to_lint: List[str], file_cache: pre_commit_linter.FileCache
    ) -> None:
        """Constructs a GeneralPurposeLinter object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            file_cache: object(FileCache). Provides thread-safe access to cached
                file content.
        """
        # Set path for node.
        # The path for node is set explicitly, since otherwise the lint
        # tests fail on CircleCI due to the TypeScript files not being
        # compilable.
        os.environ['PATH'] = '%s/bin:' % common.NODE_PATH + os.environ['PATH']

        self.files_to_lint = files_to_lint
        self.file_cache = file_cache

    @property
    def all_filepaths(self) -> List[str]:
        """Returns all file paths."""
        return self.files_to_lint

    def _check_for_mandatory_pattern_in_file(
        self,
        pattern_list: List[MandatoryPatternsRegexpDict],
        filepath: str,
        failed: bool
    ) -> Tuple[bool, List[str]]:
        """Checks for a given mandatory pattern in a file.

        Args:
            pattern_list: list(dict). The list of the mandatory patterns list to
                be checked for in the file.
            filepath: str. The path to the file to be linted.
            failed: bool. Status of failure of the check.

        Returns:
            Tuple[bool, List[str]]. The failure status of the check
            and error messages.

        Raises:
            Exception. Given file at filepath is not readable.
        """
        # This boolean list keeps track of the regex matches
        # found in the file.
        pattern_found_list = []
        error_messages = []

        try:
            file_content = self.file_cache.readlines(filepath)  # type: ignore[no-untyped-call]
        except Exception as e:
            raise Exception('%s %s' % (filepath, e)) from e
        for index, regexp_to_check in enumerate(
                pattern_list):
            if (any(filepath.endswith(
                    allowed_type) for allowed_type in (
                        regexp_to_check['included_types'])) and (
                            not any(
                                filepath.endswith(
                                    pattern) for pattern in (
                                        regexp_to_check['excluded_files'] +
                                        regexp_to_check['excluded_dirs'])))):
                pattern_found_list.append(index)
                for line in file_content:
                    if regexp_to_check['regexp'].search(line):
                        pattern_found_list.pop()
                        break
        if pattern_found_list:
            failed = True
            for pattern_found in pattern_found_list:
                error_message = ('%s --> %s' % (
                    filepath,
                    pattern_list[pattern_found]['message']))
                error_messages.append(error_message)

        return failed, error_messages

    def check_mandatory_patterns(self) -> concurrent_task_utils.TaskResult:
        """This function checks that all files contain the mandatory
        patterns.
        """
        name = 'Mandatory pattern'
        error_messages = []
        failed = False
        sets_of_patterns_to_match = [
            MANDATORY_PATTERNS_REGEXP, MANDATORY_PATTERNS_JS_REGEXP]
        for filepath in self.all_filepaths:
            for pattern_list in sets_of_patterns_to_match:
                failed, mandatory_error_messages = (
                    self._check_for_mandatory_pattern_in_file(
                        pattern_list, filepath, failed))
                error_messages.extend(mandatory_error_messages)
        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def check_bad_patterns(self) -> concurrent_task_utils.TaskResult:
        """This function is used for detecting bad patterns."""
        name = 'Bad pattern'
        total_files_checked = 0
        total_error_count = 0
        error_messages = []
        all_filepaths = [
            filepath for filepath in self.all_filepaths if not (
                filepath.endswith('general_purpose_linter.py') or (
                    filepath.endswith('general_purpose_linter_test.py')))]
        failed = False
        for filepath in all_filepaths:
            file_content = self.file_cache.readlines(filepath)  # type: ignore[no-untyped-call]
            total_files_checked += 1
            for pattern, error in BAD_PATTERNS.items():
                if is_filepath_excluded_for_bad_patterns_check(
                        pattern, filepath):
                    continue
                for line_num, line in enumerate(file_content):
                    if pattern in line:
                        failed = True
                        error_message = ('%s --> Line %s: %s' % (
                            filepath, line_num + 1,
                            error['message']))
                        error_messages.append(error_message)
                        total_error_count += 1

            for regexp in BAD_PATTERNS_REGEXP:
                bad_pattern_check_failed, bad_pattern_error_messages = (
                    check_bad_pattern_in_file(
                        filepath, file_content, regexp))
                if bad_pattern_check_failed:
                    error_messages.extend(bad_pattern_error_messages)
                    total_error_count += 1

            (
                file_type_specific_bad_pattern_failed,
                temp_count, bad_pattern_error_messages) = (
                    check_file_type_specific_bad_pattern(
                        filepath, file_content))
            failed = (
                failed or file_type_specific_bad_pattern_failed or
                bad_pattern_check_failed)
            total_error_count += temp_count
            error_messages.extend(bad_pattern_error_messages)

            if filepath.endswith('constants.ts'):
                for pattern, constants in BAD_STRINGS_CONSTANTS.items():
                    for line in file_content:
                        if pattern in line:
                            failed = True
                            error_message = ('%s --> %s' % (
                                filepath,
                                constants['message']))
                            error_messages.append(error_message)
                            total_error_count += 1
        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def check_newline_at_eof(self) -> concurrent_task_utils.TaskResult:
        """This function is used to detect newline at the end of file."""
        name = 'Newline at EOF'
        error_messages = []
        files_to_lint = self.all_filepaths
        failed = False

        for filepath in files_to_lint:
            file_content = self.file_cache.readlines(filepath)  # type: ignore[no-untyped-call]
            file_length = len(file_content)
            if (
                    file_length >= 1 and
                    not re.search(r'[^\n]\n', file_content[-1])):
                error_message = (
                    '%s --> There should be a single newline at the '
                    'end of file.' % filepath)
                error_messages.append(error_message)
                failed = True
        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def check_disallowed_flags(self) -> concurrent_task_utils.TaskResult:
        """This function is used to disallow flags."""
        name = 'Disallow flags'
        disallow_flag = (
            'eslint-disable-next-line oppia/no-bypass-security-phrase')
        error_messages = []
        files_to_lint = self.all_filepaths
        failed = False
        excluded_files = (
            warranted_angular_security_bypasses
            .EXCLUDED_BYPASS_SECURITY_TRUST_FILES)
        allowed_files = ''
        for filepath in files_to_lint:
            for excluded_file in excluded_files:
                if excluded_file in filepath:
                    allowed_files = filepath
            if not filepath.endswith('.ts') or filepath == allowed_files:
                continue
            file_content = self.file_cache.read(filepath)  # type: ignore[no-untyped-call]

            if disallow_flag in file_content:
                error_message = (
                    '%s --> Please do not use "no-bypass-security-phrase" flag.'
                    ' It is only expected to be used in files listed in'
                    ' warranted_angular_security_bypasses.py' % filepath)
                error_messages.append(error_message)
                failed = True
        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def check_extra_js_files(self) -> concurrent_task_utils.TaskResult:
        """Checks if the changes made include extra js files in core
        or extensions folder which are not specified in
        build.JS_FILEPATHS_NOT_TO_BUILD.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.
        """
        name = 'Extra JS files'
        error_messages = []
        files_to_lint = self.all_filepaths
        failed = False

        for filepath in files_to_lint:
            if filepath.endswith(
                ('.js')) and filepath.startswith(
                    ('core/templates', 'extensions')) and (
                        filepath not in build.JS_FILEPATHS_NOT_TO_BUILD
                        ) and not filepath.endswith('webdriverio.js'):
                error_message = (
                    '%s  --> Found extra .js file' % filepath)
                error_messages.append(error_message)
                failed = True

        if failed:
            err_msg = (
                'If you want the above files to be present as js files, '
                'add them to the list JS_FILEPATHS_NOT_TO_BUILD in '
                'build.py. Otherwise, rename them to .ts')
            error_messages.append(err_msg)
        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def perform_all_lint_checks(self) -> List[concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """
        if not self.all_filepaths:
            return [
                concurrent_task_utils.TaskResult(
                    'General purpose lint', False, [],
                    ['There are no files to be checked.'])]
        task_results = [
            self.check_mandatory_patterns(), self.check_bad_patterns(),
            self.check_newline_at_eof(), self.check_extra_js_files(),
            self.check_disallowed_flags()]
        return task_results


def get_linters(
    files_to_lint: List[str], file_cache: pre_commit_linter.FileCache
) -> Tuple[GeneralPurposeLinter, None]:
    """Creates GeneralPurposeLinter object and returns it.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.
        file_cache: object(FileCache). Provides thread-safe access to cached
            file content.

    Returns:
        tuple(GeneralPurposeLinter, None). A 2-tuple of custom and third_party
        linter objects.
    """
    custom_linter = GeneralPurposeLinter(files_to_lint, file_cache)

    return custom_linter, None
