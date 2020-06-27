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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re
import sys

import python_utils

from . import linter_utils
from .. import common


EXCLUDED_PATHS = (
    'third_party/*', 'build/*', '.git/*', '*.pyc', 'CHANGELOG',
    'integrations/*', 'integrations_dev/*', '*.svg', '*.gif', '*.png',
    '*.webp', '*.zip', '*.ico', '*.jpg', '*.min.js', 'backend_prod_files/*',
    'assets/scripts/*', 'core/tests/data/*', 'core/tests/build_sources/*',
    '*.mp3', '*.mp4', 'node_modules/*', 'typings/*', 'local_compiled_js/*',
    'webpack_bundles/*', 'core/tests/services_sources/*',
    'core/tests/release_sources/tmp_unzip.zip',
    'core/tests/release_sources/tmp_unzip.tar.gz')

GENERATED_FILE_PATHS = (
    'extensions/interactions/LogicProof/static/js/generatedDefaultData.ts',
    'extensions/interactions/LogicProof/static/js/generatedParser.ts',
    'core/templates/expressions/parser.js')

CONFIG_FILE_PATHS = (
    'core/tests/.browserstack.env.example',
    'core/tests/protractor.conf.js',
    'core/tests/karma.conf.ts',
    'core/templates/mathjaxConfig.ts',
    'assets/constants.ts',
    'assets/rich_text_components_definitions.ts',
    'webpack.config.ts',
    'webpack.dev.config.ts',
    'webpack.prod.config.ts')

REQUIRED_STRINGS_CONSTANTS = {
    'DEV_MODE: true': {
        'message': 'Please set the DEV_MODE variable in constants.ts'
                   'to true before committing.',
        'excluded_files': ()
    }
}

BAD_PATTERNS = {
    '__author__': {
        'message': 'Please remove author tags from this file.',
        'excluded_files': (),
        'excluded_dirs': ()},
    'datetime.datetime.now()': {
        'message': 'Please use datetime.datetime.utcnow() instead of'
                   'datetime.datetime.now().',
        'excluded_files': (),
        'excluded_dirs': ()},
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

BAD_PATTERNS_REGEXP = [
    {
        'regexp': re.compile(r'TODO[^\(]*[^\)][^:]*[^A-Z]+[^\w]*$'),
        'message': 'Please assign TODO comments to a user '
                   'in the format TODO(username): XXX. ',
        'excluded_files': (),
        'excluded_dirs': ()
    }
]

BAD_PATTERNS_JS_AND_TS_REGEXP = [
    {
        'regexp': re.compile(r'\b(browser.explore)\('),
        'message': 'In tests, please do not use browser.explore().',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\b(browser.pause)\('),
        'message': 'In tests, please do not use browser.pause().',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\b(browser.sleep)\('),
        'message': 'In tests, please do not use browser.sleep().',
        'excluded_files': (
            # TODO(#7622): Remove the file from the excluded list. Remove the
            # TODO in core/tests/protractor_desktop/embedding.js pointing to the
            # same issue. The following was placed due to a necessary sleep as
            # a temporary measure to keep the embedding tests from failing.
            'core/tests/protractor_desktop/embedding.js',
        ),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\b(browser.waitForAngular)\('),
        'message': 'In tests, please do not use browser.waitForAngular().',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\b(ddescribe|fdescribe)\('),
        'message': 'In tests, please use \'describe\' instead of \'ddescribe\''
                   'or \'fdescribe\'',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\b(iit|fit)\('),
        'message': 'In tests, please use \'it\' instead of \'iit\' or \'fit\'',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\b(beforeEach\(inject\(function)\('),
        'message': 'In tests, please use \'angular.mock.inject\' instead of '
                   '\'inject\'',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'templateUrl: \''),
        'message': 'The directives must be directly referenced.',
        'excluded_files': (
            'core/templates/pages/exploration-player-page/'
            'FeedbackPopupDirective.js',
            '.component.ts'
        ),
        'excluded_dirs': (
            'extensions/answer_summarizers/',
            'extensions/classifiers/',
            'extensions/dependencies/',
            'extensions/value_generators/',
            'extensions/visualizations/')
    },
    {
        'regexp': re.compile(r'toThrow[(]'),
        'message': 'Please use \'toThrowError\' instead of '
                   '\'toThrow\'',
        'excluded_files': (
            # Note to developers: In the excluded_files below,
            # we use custom errors which cannot be caught by regex.
            # The Logic Proof interaction which uses these custom errors
            # will be deprecated soon (see #9198).
            'extensions/interactions/LogicProof/static/js/student.spec.ts',
            'extensions/interactions/LogicProof/static/js/complete.spec.ts',
            'extensions/interactions/LogicProof/static/js/teacher.spec.ts'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'(?!catch\s(\n|.)*throw\s\w+;\n.*})'
                             r'throw\s\b(\bError|\bTypeError|\bRangeError'
                             r'\bSyntaxError|\bDimensionError)\('),
        'message': 'Please use \'throw new\' instead of \'throw\'',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'(?!catch\s(\n|.)*throw\s\w+;\n.*})'
                             r'throw\s\'.*\';'),
        'message': 'Please use '
                   '\'throw new Error\' instead of \'throw\'',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\$parent'),
        'message': 'Please do not access parent properties ' +
                   'using $parent. Use the scope object' +
                   'for this purpose.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'require\(.*\.\..*\);'),
        'message': 'Please, don\'t use relative imports in require().',
        'excluded_files': (),
        'excluded_dirs': ('core/tests/',)
    },
    {
        'regexp': re.compile(r'innerHTML'),
        'message': 'Please do not use innerHTML property.',
        'excluded_files': (
            'core/templates/Polyfills.ts',
            'core/templates/filters/translate.pipe.spec.ts'),
        'excluded_dirs': ('core/tests/',)
    },
    {
        'regexp': re.compile(
            r'eslint-(disable|enable)(-next-line)? camelcase'),
        'message': (
            'Please do not use eslint disable for camelcase. '
            'If you are using this statement to define properties '
            'in an interface for a backend dict. Wrap the property '
            'name in single quotes instead.'),
        'excluded_files': (
            'typings/guppy-defs-b5055b963fdbea5c6c1e92dbf58fdaf3ea0cd8ba.d.ts',
            'core/templates/services/UpgradedServices.ts'),
        'excluded_dirs': ()
    }
]

MANDATORY_PATTERNS_REGEXP = [
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
        'regexp': re.compile('from __future__ import unicode_literals'),
        'message': 'Please ensure this file should contain unicode_literals '
                   'future import.',
        'included_types': ('.py'),
        'excluded_files': GENERATED_FILE_PATHS + CONFIG_FILE_PATHS + (
            '__init__.py',),
        'excluded_dirs': EXCLUDED_PATHS
    }
]

MANDATORY_PATTERNS_JS_REGEXP = [
    {
        'regexp': re.compile(r'^\s\*\s@fileoverview\s[a-zA-Z0-9_]+'),
        'message': 'Please ensure this file should contain a file '
                   'overview i.e. a short description of the file.',
        'included_types': ('.js', '.ts'),
        'excluded_files': GENERATED_FILE_PATHS + CONFIG_FILE_PATHS,
        'excluded_dirs': EXCLUDED_PATHS
    }
]

BAD_LINE_PATTERNS_HTML_REGEXP = [
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
                   'using $parent. Use the scope object' +
                   'for this purpose.',
        'excluded_files': (),
        'excluded_dirs': ()
    }
]

BAD_PATTERNS_PYTHON_REGEXP = [
    {
        'regexp': re.compile(r'\Wprint\('),
        'message': 'Please do not use print statement.',
        'excluded_files': (
            'core/tests/test_utils.py',
            'core/tests/performance_framework/perf_domain.py'),
        'excluded_dirs': ('scripts/',)
    },
    {
        'regexp': re.compile(r'\sprint\('),
        'message': 'Please use python_utils.PRINT().',
        'excluded_files': ('python_utils.py',),
        'excluded_dirs': ()
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
        'regexp': re.compile(r'self.assertEquals\('),
        'message': 'Please do not use self.assertEquals method. ' +
                   'This method has been deprecated. Instead use ' +
                   'self.assertEqual method.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'with open\(|= open\('),
        'message': 'Please use python_utils.open_file() instead of open().',
        'excluded_files': ('python_utils.py',),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'StringIO'),
        'message': 'Please use python_utils.string_io() instead of ' +
                   'import StringIO.',
        'excluded_files': ('python_utils.py', 'python_utils_test.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urllib\..*quote\('),
        'message': 'Please use python_utils.url_quote().',
        'excluded_files': ('python_utils.py', 'python_utils_test.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urllib\..*unquote_plus\('),
        'message': 'Please use python_utils.url_unquote_plus().',
        'excluded_files': ('python_utils.py', 'python_utils_test.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urllib\..*urlencode\('),
        'message': 'Please use python_utils.url_encode().',
        'excluded_files': ('python_utils.py', 'python_utils_test.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urllib\..*urlretrieve\('),
        'message': 'Please use python_utils.url_retrieve().',
        'excluded_files': ('python_utils.py', 'python_utils_test.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urllib(2)?\..*urlopen\('),
        'message': 'Please use python_utils.url_open().',
        'excluded_files': ('python_utils.py', 'python_utils_test.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urlsplit'),
        'message': 'Please use python_utils.url_split().',
        'excluded_files': ('python_utils.py',),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urlparse'),
        'message': 'Please use python_utils.url_parse().',
        'excluded_files': ('python_utils.py',),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urlunsplit'),
        'message': 'Please use python_utils.url_unsplit().',
        'excluded_files': ('python_utils.py',),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'parse_qs'),
        'message': 'Please use python_utils.parse_query_string().',
        'excluded_files': ('python_utils.py',),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\Wunquote\('),
        'message': 'Please use python_utils.urllib_unquote().',
        'excluded_files': ('python_utils.py',),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urljoin'),
        'message': 'Please use python_utils.url_join().',
        'excluded_files': ('python_utils.py',),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urllib(2)?\..*Request\('),
        'message': 'Please use python_utils.url_request().',
        'excluded_files': ('python_utils.py', 'python_utils_test.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'[^.|\w]input\('),
        'message': 'Please use python_utils.INPUT.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'[^.|\w|\s]map\('),
        'message': 'Please use python_utils.MAP.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\Wnext\('),
        'message': 'Please use python_utils.NEXT.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'object\):'),
        'message': 'Please use python_utils.OBJECT.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\Wrange\('),
        'message': 'Please use python_utils.RANGE.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\Wround\('),
        'message': 'Please use python_utils.ROUND.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\Wstr\('),
        'message': (
            'Please try to use python_utils.convert_to_bytes() for the strings '
            'used in webapp2\'s built-in methods or for strings used directly '
            'in NDB datastore models. If you need to cast ints/floats to '
            'strings, please use python_utils.UNICODE() instead.'),
        'excluded_files': ('python_utils.py',),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\Wzip\('),
        'message': 'Please use python_utils.ZIP.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'basestring'),
        'message': 'Please use python_utils.BASESTRING.',
        'excluded_files': ('python_utils.py',),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'__metaclass__'),
        'message': 'Please use python_utils.with_metaclass().',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'iteritems'),
        'message': 'Please use items() instead.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'itervalues'),
        'message': 'Please use values() instead.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'iterkeys'),
        'message': 'Please use keys() instead.',
        'excluded_files': (),
        'excluded_dirs': ()
    }
]

BAD_PATTERNS_MAP = {
    '.js': BAD_PATTERNS_JS_AND_TS_REGEXP,
    '.ts': BAD_PATTERNS_JS_AND_TS_REGEXP,
    '.html': BAD_LINE_PATTERNS_HTML_REGEXP,
    '.py': BAD_PATTERNS_PYTHON_REGEXP
}


def is_filepath_excluded_for_bad_patterns_check(pattern, filepath):
    """Checks if file is excluded from the bad patterns check.

    Args:
        pattern: str. The pattern to be checked against.
        filepath: str. Path of the file.

    Returns:
        bool: Whether to exclude the given file from this
        particular pattern check.
    """
    return (any(filepath.startswith(bad_pattern)
                for bad_pattern in BAD_PATTERNS[pattern]['excluded_dirs'])
            or filepath in BAD_PATTERNS[pattern]['excluded_files'])


def check_bad_pattern_in_file(filepath, file_content, pattern):
    """Detects whether the given pattern is present in the file.

    Args:
        filepath: str. Path of the file.
        file_content: str. Contents of the file.
        pattern: dict. (regexp(regex pattern) : pattern to match,
            message(str) : message to show if pattern matches,
            excluded_files(tuple(str)) : files to be excluded from matching,
            excluded_dirs(tuple(str)) : directories to be excluded from
                matching).
            Object containing details for the pattern to be checked.

    Returns:
        bool. True if there is bad pattern else false.
    """
    regexp = pattern['regexp']
    if not (any(filepath.startswith(excluded_dir)
                for excluded_dir in pattern['excluded_dirs'])
            or any(filepath.endswith(excluded_file)
                   for excluded_file in pattern['excluded_files'])):
        bad_pattern_count = 0
        for line_num, line in enumerate(file_content):
            stripped_line = line.rstrip()
            if stripped_line.endswith('disable-bad-pattern-check'):
                continue
            if regexp.search(stripped_line):
                python_utils.PRINT('%s --> Line %s: %s' % (
                    filepath, line_num, pattern['message']))
                python_utils.PRINT('')
                bad_pattern_count += 1
        if bad_pattern_count:
            return True
    return False


def check_file_type_specific_bad_pattern(filepath, content):
    """Check the file content based on the file's extension.

    Args:
        filepath: str. Path of the file.
        content: str. Contents of the file.

     Returns:
        failed: bool. True if there is bad pattern else false.
        total_error_count: int. The number of errors.
    """
    _, extension = os.path.splitext(filepath)
    pattern = BAD_PATTERNS_MAP.get(extension)
    failed = False
    total_error_count = 0
    if pattern:
        for regexp in pattern:
            if check_bad_pattern_in_file(filepath, content, regexp):
                failed = True
                total_error_count += 1
    return failed, total_error_count


class GeneralPurposeLinter(python_utils.OBJECT):
    """Manages all the common linting functions. As an abstract base class, this
    is not intended to be used directly.

    Attributes:
        all_filepaths: list(str). The list of filepaths to be linted.
        parsed_js_files: dict. Contains the content of JS files, after
            validating and parsing the files.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """

    def __init__(self, files_to_lint, verbose_mode_enabled):
        """Constructs a GeneralPurposeLinter object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        # Set path for node.
        # The path for node is set explicitly, since otherwise the lint
        # tests fail on CircleCI due to the TypeScript files not being
        # compilable.
        os.environ['PATH'] = '%s/bin:' % common.NODE_PATH + os.environ['PATH']

        self.files_to_lint = files_to_lint
        self.verbose_mode_enabled = verbose_mode_enabled

    @property
    def all_filepaths(self):
        """Returns all file paths."""
        return self.files_to_lint

    def _check_for_mandatory_pattern_in_file(
            self, pattern_list, filepath, failed):
        """Checks for a given mandatory pattern in a file.

        Args:
            pattern_list: list(dict). The list of the mandatory patterns list to
                be checked for in the file.
            filepath: str. The path to the file to be linted.
            failed: bool. Status of failure of the check.

        Returns:
            bool. The failure status of the check.
        """
        # This boolean list keeps track of the regex matches
        # found in the file.
        pattern_found_list = []
        file_content = FILE_CACHE.readlines(filepath)
        for index, regexp_to_check in enumerate(
                pattern_list):
            if (any([filepath.endswith(
                    allowed_type) for allowed_type in (
                        regexp_to_check['included_types'])]) and (
                            not any([
                                filepath.endswith(
                                    pattern) for pattern in (
                                        regexp_to_check[
                                            'excluded_files'] +
                                        regexp_to_check[
                                            'excluded_dirs'])]))):
                pattern_found_list.append(index)
                for line in file_content:
                    if regexp_to_check['regexp'].search(line):
                        pattern_found_list.pop()
                        break
        if pattern_found_list:
            failed = True
            for pattern_found in pattern_found_list:
                python_utils.PRINT('%s --> %s' % (
                    filepath,
                    pattern_list[pattern_found]['message']))

        return failed

    def _check_mandatory_patterns(self):
        """This function checks that all files contain the mandatory
        patterns.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting mandatory patterns check')
            python_utils.PRINT('----------------------------------------')

        summary_messages = []
        failed = False
        stdout = sys.stdout
        with linter_utils.redirect_stdout(stdout):
            sets_of_patterns_to_match = [
                MANDATORY_PATTERNS_REGEXP, MANDATORY_PATTERNS_JS_REGEXP]
            for filepath in self.all_filepaths:
                for pattern_list in sets_of_patterns_to_match:
                    failed = self._check_for_mandatory_pattern_in_file(
                        pattern_list, filepath, failed)

            if failed:
                summary_message = (
                    '%s Mandatory pattern check failed, see errors above for'
                    'patterns that should be added.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
            else:
                summary_message = (
                    '%s Mandatory pattern check passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))
            python_utils.PRINT(summary_message)

        python_utils.PRINT('')

        summary_messages.append(summary_message)
        return summary_messages

    def _check_bad_patterns(self):
        """This function is used for detecting bad patterns."""
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting Pattern Checks')
            python_utils.PRINT('----------------------------------------')
        total_files_checked = 0
        total_error_count = 0
        summary_messages = []
        all_filepaths = [
            filepath for filepath in self.all_filepaths if not (
                filepath.endswith('general_purpose_linter.py'))]
        failed = False
        stdout = sys.stdout
        with linter_utils.redirect_stdout(stdout):
            for filepath in all_filepaths:
                file_content = FILE_CACHE.readlines(filepath)
                total_files_checked += 1
                for pattern in BAD_PATTERNS:
                    if is_filepath_excluded_for_bad_patterns_check(
                            pattern, filepath):
                        continue
                    for line_num, line in enumerate(file_content):
                        if pattern in line:
                            failed = True
                            summary_message = ('%s --> Line %s: %s' % (
                                filepath, line_num + 1,
                                BAD_PATTERNS[pattern]['message']))
                            summary_messages.append(summary_message)
                            python_utils.PRINT(summary_message)
                            python_utils.PRINT('')
                            total_error_count += 1

                for regexp in BAD_PATTERNS_REGEXP:
                    if check_bad_pattern_in_file(
                            filepath, file_content, regexp):
                        failed = True
                        total_error_count += 1

                temp_failed, temp_count = check_file_type_specific_bad_pattern(
                    filepath, file_content)
                failed = failed or temp_failed
                total_error_count += temp_count

                if filepath == 'constants.ts':
                    for pattern in REQUIRED_STRINGS_CONSTANTS:
                        if pattern not in file_content:
                            failed = True
                            python_utils.PRINT('%s --> %s' % (
                                filepath,
                                REQUIRED_STRINGS_CONSTANTS[pattern]['message']))
                            python_utils.PRINT('')
                            total_error_count += 1
            if failed:
                summary_message = (
                    '%s Pattern check failed, see errors above '
                    'for patterns that should be removed.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
                summary_messages.append(summary_message)
            else:
                summary_message = '%s Pattern checks passed' % (
                    linter_utils.SUCCESS_MESSAGE_PREFIX)
                summary_messages.append(summary_message)

            python_utils.PRINT('')
            if total_files_checked == 0:
                python_utils.PRINT('There are no files to be checked.')
            else:
                python_utils.PRINT('(%s files checked, %s errors found)' % (
                    total_files_checked, total_error_count))
                python_utils.PRINT(summary_message)
        return summary_messages

    def _check_newline_at_eof(self):
        """This function is used to detect newline at the end of file."""
        if self.verbose_mode_enabled:
            python_utils.PRINT(
                'Starting newline at eof check\n'
                '----------------------------------------')
        summary_messages = []
        files_to_lint = self.all_filepaths
        failed = False

        with linter_utils.redirect_stdout(sys.stdout):
            for filepath in files_to_lint:
                file_content = FILE_CACHE.readlines(filepath)
                file_length = len(file_content)
                if (
                        file_length >= 1 and
                        not re.search(r'[^\n]\n', file_content[-1])):
                    summary_message = (
                        '%s --> There should be a single newline at the '
                        'end of file.' % filepath)
                    summary_messages.append(summary_message)
                    python_utils.PRINT(summary_message)
                    failed = True

            if failed:
                summary_message = (
                    '%s Newline at the eof check failed.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
            else:
                summary_message = (
                    '%s Newline at the eof check passed.' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))
            summary_messages.append(summary_message)
            python_utils.PRINT(summary_message)

        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        mandatory_patterns_messages = self._check_mandatory_patterns()
        pattern_messages = self._check_bad_patterns()
        newline_at_eof_messages = self._check_newline_at_eof()

        all_messages = (
            mandatory_patterns_messages + pattern_messages +
            newline_at_eof_messages)
        return all_messages


def get_linters(
        files_to_lint, verbose_mode_enabled=False):
    """Creates GeneralPurposeLinter object and returns it.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        tuple(GeneralPurposeLinter, None). A 2-tuple of custom and third_party
        linter objects.
    """
    custom_linter = GeneralPurposeLinter(
        files_to_lint, verbose_mode_enabled)

    return custom_linter, None
