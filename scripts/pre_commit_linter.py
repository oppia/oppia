# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Pre-commit script for Oppia.

This script lints Python and JavaScript code, and prints a
list of lint errors to the terminal. If the directory path is passed,
it will lint all Python and JavaScript files in that directory; otherwise,
it will only lint files that have been touched in this commit.

This script ignores all filepaths contained within .eslintignore.

IMPORTANT NOTES:

1.  Before running this script, you must install third-party dependencies by
    running

        bash scripts/start.sh

    at least once.

=====================
CUSTOMIZATION OPTIONS
=====================
1.  To lint only files that have been touched in this commit
        python scripts/pre_commit_linter.py

2.  To lint all files in the folder or to lint just a specific file
        python scripts/pre_commit_linter.py --path filepath

3.  To lint a specific list of files (*.js/*.py only). Separate files by spaces
        python scripts/pre_commit_linter.py --files file_1 file_2 ... file_n

4.  To lint files in verbose mode
        python scripts/pre_commit_linter.py --verbose

Note that the root folder MUST be named 'oppia'.
 """

# Pylint has issues with the import order of argparse.
# pylint: disable=wrong-import-order
import HTMLParser
import StringIO
import argparse
import ast
import contextlib
import fnmatch
import glob
import multiprocessing
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time

import build # pylint: disable=relative-import
import docstrings_checker  # pylint: disable=relative-import

# pylint: enable=wrong-import-order

_PARSER = argparse.ArgumentParser()
_EXCLUSIVE_GROUP = _PARSER.add_mutually_exclusive_group()
_EXCLUSIVE_GROUP.add_argument(
    '--path',
    help='path to the directory with files to be linted',
    action='store')
_EXCLUSIVE_GROUP.add_argument(
    '--files',
    nargs='+',
    help='specific files to be linted. Space separated list',
    action='store')
_PARSER.add_argument(
    '--verbose',
    help='verbose mode. All details will be printed.',
    action='store_true')

EXCLUDED_PHRASES = [
    'utf', 'pylint:', 'http://', 'https://', 'scripts/', 'extract_node']

EXCLUDED_PATHS = (
    'third_party/*', 'build/*', '.git/*', '*.pyc', 'CHANGELOG',
    'integrations/*', 'integrations_dev/*', '*.svg', '*.gif',
    '*.png', '*.zip', '*.ico', '*.jpg', '*.min.js',
    'assets/scripts/*', 'core/tests/data/*', 'core/tests/build_sources/*',
    '*.mp3', '*.mp4', 'node_modules/*', 'typings/*', 'local_compiled_js/*')

GENERATED_FILE_PATHS = (
    'extensions/interactions/LogicProof/static/js/generatedDefaultData.js',
    'extensions/interactions/LogicProof/static/js/generatedParser.js',
    'core/templates/dev/head/expressions/ExpressionParserService.js')

CONFIG_FILE_PATHS = (
    'core/tests/.browserstack.env.example',
    'core/tests/protractor.conf.js',
    'core/tests/karma.conf.ts',
    'core/templates/dev/head/mathjaxConfig.ts',
    'assets/constants.js',
    'assets/rich_text_components_definitions.js')

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
        'regexp': r'TODO[^\(]*[^\)][^:]*[^\w]*$',
        'message': 'Please assign TODO comments to a user '
                   'in the format TODO(username): XXX. ',
        'excluded_files': (),
        'excluded_dirs': ()
    }
]

BAD_PATTERNS_JS_AND_TS_REGEXP = [
    {
        'regexp': r'\b(browser.explore)\(',
        'message': 'In tests, please do not use browser.explore().',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r'\b(browser.pause)\(',
        'message': 'In tests, please do not use browser.pause().',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r'\b(browser.sleep)\(',
        'message': 'In tests, please do not use browser.sleep().',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r'\b(browser.waitForAngular)\(',
        'message': 'In tests, please do not use browser.waitForAngular().',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r'\b(ddescribe|fdescribe)\(',
        'message': 'In tests, please use \'describe\' instead of \'ddescribe\''
                   'or \'fdescribe\'',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r'\b(iit|fit)\(',
        'message': 'In tests, please use \'it\' instead of \'iit\' or \'fit\'',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r'\b(beforeEach\(inject\(function)\(',
        'message': 'In tests, please use \'angular.mock.inject\' instead of '
                   '\'inject\'',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r'templateUrl: \'',
        'message': 'The directives must be directly referenced.',
        'excluded_files': (
            'core/templates/dev/head/pages/exploration-player-page/'
            'FeedbackPopupDirective.js'
        ),
        'excluded_dirs': (
            'extensions/answer_summarizers/',
            'extensions/classifiers/',
            'extensions/dependencies/',
            'extensions/value_generators/',
            'extensions/visualizations/')
    },
    {
        'regexp': r'\$parent',
        'message': 'Please do not access parent properties ' +
                   'using $parent. Use the scope object' +
                   'for this purpose.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r'require\(.*\.\..*\);',
        'message': 'Please, don\'t use relative imports in require().',
        'excluded_files': (),
        'excluded_dirs': ('core/tests/')
    }
]

MANDATORY_PATTERNS_REGEXP = [
    {
        'regexp': r'Copyright \d{4} The Oppia Authors\. All Rights Reserved\.',
        'message': 'Please ensure this file should contain a proper '
                   'copyright notice.',
        'included_types': ('.py', '.js', '.sh', '.ts'),
        'excluded_files': GENERATED_FILE_PATHS + CONFIG_FILE_PATHS + (
            '__init__.py', ),
        'excluded_dirs': EXCLUDED_PATHS
    }
]

MANDATORY_PATTERNS_JS_REGEXP = [
    {
        'regexp': r'^\s\*\s@fileoverview\s[a-zA-Z0-9_]+',
        'message': 'Please ensure this file should contain a file '
                   'overview i.e. a short description of the file.',
        'included_types': ('.js', '.ts'),
        'excluded_files': GENERATED_FILE_PATHS + CONFIG_FILE_PATHS,
        'excluded_dirs': EXCLUDED_PATHS
    }
]

BAD_LINE_PATTERNS_HTML_REGEXP = [
    {
        'regexp': r'text\/ng-template',
        'message': 'The directives must be directly referenced.',
        'excluded_files': (),
        'excluded_dirs': (
            'extensions/answer_summarizers/',
            'extensions/classifiers/',
            'extensions/objects/',
            'extensions/value_generators/')
    },
    {
        'regexp': r'[ \t]+$',
        'message': 'There should not be any trailing whitespaces.',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r'\$parent',
        'message': 'Please do not access parent properties ' +
                   'using $parent. Use the scope object' +
                   'for this purpose.',
        'excluded_files': (),
        'excluded_dirs': ()
    }
]

BAD_PATTERNS_PYTHON_REGEXP = [
    {
        'regexp': r'print ',
        'message': 'Please do not use print statement.',
        'excluded_files': (
            'core/tests/test_utils.py',
            'core/tests/performance_framework/perf_domain.py'),
        'excluded_dirs': ('scripts/',)
    },
    {
        'regexp': r'# pylint:\s*disable=[A-Z][0-9]{4}',
        'message': 'Please remove pylint exclusion if it is unnecessary, or '
                   'make it human readable with a sentence instead of an id. '
                   'The id-to-message list can be seen '
                   'here->http://pylint-messages.wikidot.com/all-codes',
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r'self.assertEquals\(',
        'message': 'Please do not use self.assertEquals method. ' +
                   'This method has been deprecated. Instead use ' +
                   'self.assertEqual method.',
        'excluded_files': (),
        'excluded_dirs': ()
    }
]

REQUIRED_STRINGS_CONSTANTS = {
    'DEV_MODE: true': {
        'message': 'Please set the DEV_MODE variable in constants.js'
                   'to true before committing.',
        'excluded_files': ()
    }
}

ALLOWED_TERMINATING_PUNCTUATIONS = ['.', '?', '}', ']', ')']

EXCLUDED_PHRASES = [
    'utf', 'pylint:', 'http://', 'https://', 'scripts/', 'extract_node']

EXCLUDED_PATHS = (
    'third_party/*', 'build/*', '.git/*', '*.pyc', 'CHANGELOG',
    'integrations/*', 'integrations_dev/*', '*.svg', '*.gif',
    '*.png', '*.zip', '*.ico', '*.jpg', '*.min.js',
    'assets/scripts/*', 'core/tests/data/*', 'core/tests/build_sources/*',
    '*.mp3', '*.mp4', 'node_modules/*', 'typings/*', 'local_compiled_js/*')

GENERATED_FILE_PATHS = (
    'extensions/interactions/LogicProof/static/js/generatedDefaultData.js',
    'extensions/interactions/LogicProof/static/js/generatedParser.js',
    'core/templates/dev/head/expressions/ExpressionParserService.js')

CONFIG_FILE_PATHS = (
    'core/tests/.browserstack.env.example',
    'core/tests/protractor.conf.js',
    'core/tests/karma.conf.ts',
    'core/templates/dev/head/mathjaxConfig.ts',
    'assets/constants.js',
    'assets/rich_text_components_definitions.js',
    'webpack.config.ts',
    'webpack.dev.config.ts',
    'webpack.prod.config.ts')

CODEOWNER_FILEPATH = '.github/CODEOWNERS'

# This list needs to be in sync with the important patterns in the CODEOWNERS
# file.
CODEOWNER_IMPORTANT_PATHS = [
    '/core/controllers/acl_decorators*.py',
    '/core/controllers/base*.py',
    '/core/domain/dependency_registry*.py',
    '/core/domain/html*.py',
    '/core/domain/rights_manager*.py',
    '/core/domain/role_services*.py',
    '/core/domain/user*.py',
    '/core/storage/',
    '/export/',
    '/manifest.json',
    '/package*.json',
    '/scripts/install_third_party.sh',
    '/.github/']

if not os.getcwd().endswith('oppia'):
    print ''
    print 'ERROR    Please run this script from the oppia root directory.'

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.9.4')
if not os.path.exists(_PYLINT_PATH):
    print ''
    print 'ERROR    Please run start.sh first to install pylint '
    print '         and its dependencies.'
    sys.exit(1)

_PATHS_TO_INSERT = [
    _PYLINT_PATH,
    os.getcwd(),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.67',
        'google_appengine', 'lib', 'webapp2-2.3'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.67',
        'google_appengine', 'lib', 'yaml-3.10'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.67',
        'google_appengine', 'lib', 'jinja2-2.6'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.67',
        'google_appengine'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'webtest-2.0.33'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'browsermob-proxy-0.8.0'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'esprima-4.0.1'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'pycodestyle-2.5.0'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-quotes-0.2.1'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'selenium-3.13.0'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'Pillow-6.0.0'),
    os.path.join('third_party', 'backports.functools_lru_cache-1.5'),
    os.path.join('third_party', 'beautifulsoup4-4.7.1'),
    os.path.join('third_party', 'bleach-3.1.0'),
    os.path.join('third_party', 'callbacks-0.3.0'),
    os.path.join('third_party', 'gae-cloud-storage-1.9.22.1'),
    os.path.join('third_party', 'gae-mapreduce-1.9.22.0'),
    os.path.join('third_party', 'gae-pipeline-1.9.22.1'),
    os.path.join('third_party', 'mutagen-1.42.0'),
    os.path.join('third_party', 'soupsieve-1.9.1'),
    os.path.join('third_party', 'six-1.12.0'),
    os.path.join('third_party', 'webencodings-0.5.1'),
]
for path in _PATHS_TO_INSERT:
    sys.path.insert(0, path)

# pylint: disable=wrong-import-order
# pylint: disable=wrong-import-position

import isort  # isort:skip
import pycodestyle  # isort:skip
import esprima  # isort:skip
from pylint import lint  # isort:skip

# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

_MESSAGE_TYPE_SUCCESS = 'SUCCESS'
_MESSAGE_TYPE_FAILED = 'FAILED'
_TARGET_STDOUT = StringIO.StringIO()


class FileCache(object):
    """Provides thread-safe access to cached file content."""

    _CACHE_DATA_DICT = {}
    _CACHE_LOCK_DICT = {}
    _CACHE_LOCK_DICT_LOCK = threading.Lock()

    @classmethod
    def read(cls, filepath, mode='r'):
        """Returns the data read from the file.

        Args:
            filepath: str. The file path from which data is to be read.
            mode: str. The mode in which the file is to be opened.

        Returns:
            str. The data read from the file.
        """
        return cls._get_data(filepath, mode)[0]

    @classmethod
    def readlines(cls, filepath, mode='r'):
        """Returns the tuple containing data line by line as read from the
        file.

        Args:
            filepath: str. The file path from which data is to be read.
            mode: str. The mode in which the file is to be opened.

        Returns:
            tuple(str). The tuple containing data line by line as read from the
                file.
        """
        return cls._get_data(filepath, mode)[1]

    @classmethod
    def _get_cache_lock(cls, key):
        """Returns the cache lock corresponding to the given key.

        Args:
            key: str. The key corresponding to which the cache lock is to be
                found.

        Returns:
            str. The cache lock corresponding to the given key.
        """
        if key not in cls._CACHE_LOCK_DICT:
            with cls._CACHE_LOCK_DICT_LOCK:
                if key not in cls._CACHE_LOCK_DICT:
                    cls._CACHE_LOCK_DICT[key] = threading.Lock()
        return cls._CACHE_LOCK_DICT[key]

    @classmethod
    def _get_data(cls, filepath, mode):
        """Returns the collected data from the file corresponding to the given
        filepath.

        Args:
            filepath: str. The file path from which data is to be read.
            mode: str. The mode in which the file is to be opened.

        Returns:
            tuple(str, tuple(str)). The tuple containing data read from the file
                as first element and tuple containing the text line by line as
                second element.
        """
        key = (filepath, mode)
        if key not in cls._CACHE_DATA_DICT:
            with cls._get_cache_lock(key):
                if key not in cls._CACHE_DATA_DICT:
                    with open(filepath, mode) as f:
                        lines = f.readlines()
                    cls._CACHE_DATA_DICT[key] = (''.join(lines), tuple(lines))
        return cls._CACHE_DATA_DICT[key]


def _is_filepath_excluded_for_bad_patterns_check(pattern, filepath):
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


def _get_expression_from_node_if_one_exists(
        parsed_node, components_to_check):
    """This function first checks whether the parsed node represents
    the required angular component that needs to be derived by checking if
    its in the 'components_to_check' list. If yes, then it  will return the
    expression part of the node from which the component can be derived.
    If no, it will return None. It is done by filtering out
    'AssignmentExpression' (as it represents an assignment) and 'Identifier'
    (as it represents a static expression).

    Args:
        parsed_node: dict. Parsed node of the body of a JS file.
        components_to_check: list(str). List of angular components to check
            in a JS file. These include directives, factories, controllers,
            etc.

    Returns:
        expression: dict or None. Expression part of the node if the node
            represents a component else None.
    """
    if parsed_node.type != 'ExpressionStatement':
        return
    # Separate the expression part of the node which is the actual
    # content of the node.
    expression = parsed_node.expression
    # Check whether the expression belongs to a
    # 'CallExpression' which always contains a call
    # and not an 'AssignmentExpression'.
    # For example, func() is a CallExpression.
    if expression.type != 'CallExpression':
        return
    # Check whether the expression belongs to a 'MemberExpression' which
    # represents a computed expression or an Identifier which represents
    # a static expression.
    # For example, 'thing.func' is a MemberExpression where
    # 'thing' is the object of the MemberExpression and
    # 'func' is the property of the MemberExpression.
    # Another example of a MemberExpression within a CallExpression is
    # 'thing.func()' where 'thing.func' is the callee of the CallExpression.
    if expression.callee.type != 'MemberExpression':
        return
    # Get the component in the JS file.
    component = expression.callee.property.name
    if component not in components_to_check:
        return
    return expression


def _walk_with_gitignore(root, exclude_dirs):
    """A walk function similar to os.walk but this would ignore the files and
    directories which is not tracked by git. Also, this will ignore the
    directories mentioned in exclude_dirs.

    Args:
        root: str. The path from where the function should start walking.
        exclude_dirs: list(str). A list of dir path which should be ignored.

    Yields:
        list(str). A list of unignored files.
    """
    dirs, file_paths = [], []
    for name in os.listdir(root):
        if os.path.isdir(os.path.join(root, name)):
            dirs.append(os.path.join(root, name))
        else:
            file_paths.append(os.path.join(root, name))

    yield [file_path for file_path in file_paths if not _is_path_ignored(
        file_path)]

    for dir_path in dirs:
        # Adding "/" in the end of the dir path according to the git dir path
        # structure.
        if (not _is_path_ignored(dir_path + '/')) and (
                dir_path not in exclude_dirs):
            for x in _walk_with_gitignore(dir_path, exclude_dirs):
                yield x


def _is_path_ignored(path_to_check):
    """Checks whether the given path is ignored by git.

    Args:
        path_to_check: str. A path to a file or a dir.

    Returns:
        bool. Whether the given path is ignored by git.
    """
    command = ['git', 'check-ignore', '-q', path_to_check]

    # The "git check-ignore <path>" command returns 0 when the path is ignored
    # otherwise it returns 1. subprocess.call then returns this returncode.
    if subprocess.call(command):
        return False
    else:
        return True


def _get_changed_filepaths():
    """Returns a list of modified files (both staged and unstaged)

    Returns:
        a list of filepaths of modified files.
    """
    unstaged_files = subprocess.check_output([
        'git', 'diff', '--name-only',
        '--diff-filter=ACM']).splitlines()
    staged_files = subprocess.check_output([
        'git', 'diff', '--cached', '--name-only',
        '--diff-filter=ACM']).splitlines()
    return unstaged_files + staged_files


def _get_all_files_in_directory(dir_path, excluded_glob_patterns):
    """Recursively collects all files in directory and
    subdirectories of specified path.

    Args:
        dir_path: str. Path to the folder to be linted.
        excluded_glob_patterns: set(str). Set of all glob patterns
            to be excluded.

    Returns:
        a list of files in directory and subdirectories without excluded files.
    """
    files_in_directory = []
    for _dir, _, files in os.walk(dir_path):
        for file_name in files:
            filepath = os.path.relpath(
                os.path.join(_dir, file_name), os.getcwd())
            if not any([fnmatch.fnmatch(filepath, gp) for gp in
                        excluded_glob_patterns]):
                files_in_directory.append(filepath)
    return files_in_directory


@contextlib.contextmanager
def _redirect_stdout(new_target):
    """Redirect stdout to the new target.

    Args:
        new_target: TextIOWrapper. The new target to which stdout is redirected.

    Yields:
        TextIOWrapper. The new target.
    """
    old_target = sys.stdout
    sys.stdout = new_target
    try:
        yield new_target
    finally:
        sys.stdout = old_target


def _get_all_filepaths(input_path, input_filenames):
    """This function is used to return the filepaths which needs to be linted
    and checked.

    Args:
        input_path: str. The path of the directory to be linted and checked.
        input_filenames: list(str). The list of filenames to be linted and
            checked, ignored if input_path is specified.

    Returns:
        all_filepaths: list(str). The list of filepaths to be linted and
            checked.
    """
    eslintignore_path = os.path.join(os.getcwd(), '.eslintignore')
    if input_path:
        input_path = os.path.join(os.getcwd(), input_path)
        if not os.path.exists(input_path):
            print 'Could not locate file or directory %s. Exiting.' % input_path
            print '----------------------------------------'
            sys.exit(1)
        if os.path.isfile(input_path):
            all_filepaths = [input_path]
        else:
            excluded_glob_patterns = FileCache.readlines(eslintignore_path)
            all_filepaths = _get_all_files_in_directory(
                input_path, excluded_glob_patterns)
    elif input_filenames:
        valid_filepaths = []
        invalid_filepaths = []
        for filename in input_filenames:
            if os.path.isfile(filename):
                valid_filepaths.append(filename)
            else:
                invalid_filepaths.append(filename)
        if invalid_filepaths:
            print ('The following file(s) do not exist: %s\n'
                   'Exiting.' % invalid_filepaths)
            sys.exit(1)
        all_filepaths = valid_filepaths
    else:
        all_filepaths = _get_changed_filepaths()
    all_filepaths = [
        filename for filename in all_filepaths if not
        any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATHS)]
    return all_filepaths


def _check_bad_pattern_in_file(filepath, file_content, pattern):
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
            or filepath in pattern['excluded_files']):
        bad_pattern_count = 0
        for line_num, line in enumerate(file_content.split('\n'), 1):
            if line.endswith('disable-bad-pattern-check'):
                continue
            if re.search(regexp, line):
                print '%s --> Line %s: %s' % (
                    filepath, line_num, pattern['message'])
                print ''
                bad_pattern_count += 1
        if bad_pattern_count:
            return True
    return False


class TagMismatchException(Exception):
    """Error class for mismatch between start and end tags."""
    pass


class CustomHTMLParser(HTMLParser.HTMLParser):
    """Custom HTML parser to check indentation."""

    def __init__(self, filepath, file_lines, debug, failed=False):
        """Define various variables to parse HTML."""
        HTMLParser.HTMLParser.__init__(self)
        self.tag_stack = []
        self.debug = debug
        self.failed = failed
        self.filepath = filepath
        self.file_lines = file_lines
        self.indentation_level = 0
        self.indentation_width = 2
        self.void_elements = [
            'area', 'base', 'br', 'col', 'embed',
            'hr', 'img', 'input', 'link', 'meta',
            'param', 'source', 'track', 'wbr']

    def handle_starttag(self, tag, attrs):
        """Handle start tag of a HTML line."""
        line_number, column_number = self.getpos()
        # Check the indentation of the tag.
        expected_indentation = self.indentation_level * self.indentation_width
        tag_line = self.file_lines[line_number - 1].lstrip()
        opening_tag = '<' + tag
        if tag_line.startswith(opening_tag) and (
                column_number != expected_indentation):
            print (
                '%s --> Expected indentation '
                'of %s, found indentation of %s '
                'for %s tag on line %s ' % (
                    self.filepath, expected_indentation,
                    column_number, tag, line_number))
            print ''
            self.failed = True

        if tag not in self.void_elements:
            self.tag_stack.append((tag, line_number, column_number))
            self.indentation_level += 1

        if self.debug:
            print 'DEBUG MODE: Start tag_stack'
            print self.tag_stack

        # Check the indentation of the attributes of the tag.
        indentation_of_first_attribute = (
            column_number + len(tag) + 2)
        starttag_text = self.get_starttag_text()

        # Check whether the values of all attributes are placed
        # in double quotes.
        for attr, value in attrs:
            # Not all attributes will have a value.
            # Therefore the check should run only for those
            # attributes which have a value.
            if value:
                expected_value = '"' + value + '"'

                # &quot; is rendered as a double quote by the parser.
                if '&quot;' in starttag_text:
                    rendered_text = starttag_text.replace('&quot;', '"')
                else:
                    rendered_text = starttag_text

                if not expected_value in rendered_text:
                    self.failed = True
                    print (
                        '%s --> The value %s of attribute '
                        '%s for the tag %s on line %s should '
                        'be enclosed within double quotes.' % (
                            self.filepath, value, attr,
                            tag, line_number))
                    print ''

        for line_num, line in enumerate(starttag_text.splitlines()):
            if line_num == 0:
                continue

            leading_spaces_count = len(line) - len(line.lstrip())
            list_of_attrs = []

            for attr, _ in attrs:
                list_of_attrs.append(attr)

            if not line.lstrip().startswith(tuple(list_of_attrs)):
                continue
            if indentation_of_first_attribute != leading_spaces_count:
                line_num_of_error = line_number + line_num
                print (
                    '%s --> Attribute for tag %s on line '
                    '%s should align with the leftmost '
                    'attribute on line %s ' % (
                        self.filepath, tag,
                        line_num_of_error, line_number))
                print ''
                self.failed = True

    def handle_endtag(self, tag):
        """Handle end tag of a HTML line."""
        line_number, _ = self.getpos()
        tag_line = self.file_lines[line_number - 1]
        leading_spaces_count = len(tag_line) - len(tag_line.lstrip())

        try:
            last_starttag, last_starttag_line_num, last_starttag_col_num = (
                self.tag_stack.pop())
        except IndexError:
            raise TagMismatchException('Error in line %s of file %s\n' % (
                line_number, self.filepath))

        if last_starttag != tag:
            raise TagMismatchException('Error in line %s of file %s\n' % (
                line_number, self.filepath))

        if leading_spaces_count != last_starttag_col_num and (
                last_starttag_line_num != line_number):
            print (
                '%s --> Indentation for end tag %s on line '
                '%s does not match the indentation of the '
                'start tag %s on line %s ' % (
                    self.filepath, tag, line_number,
                    last_starttag, last_starttag_line_num))
            print ''
            self.failed = True

        self.indentation_level -= 1

        if self.debug:
            print 'DEBUG MODE: End tag_stack'
            print self.tag_stack

    def handle_data(self, data):
        """Handle indentation level."""
        data_lines = data.split('\n')
        opening_block = tuple(
            ['{% block', '{% macro', '{% if', '% for', '% if'])
        ending_block = tuple(['{% end', '{%- end', '% } %>'])
        for data_line in data_lines:
            data_line = data_line.lstrip()
            if data_line.startswith(opening_block):
                self.indentation_level += 1
            elif data_line.startswith(ending_block):
                self.indentation_level -= 1


def _lint_css_files(
        node_path, stylelint_path, config_path, files_to_lint, stdout, result,
        verbose_mode_enabled):
    """Prints a list of lint errors in the given list of CSS files.

    Args:
        node_path: str. Path to the node binary.
        stylelint_path: str. Path to the Stylelint binary.
        config_path: str. Path to the configuration file.
        files_to_lint: list(str). A list of filepaths to lint.
        stdout:  multiprocessing.Queue. A queue to store Stylelint outputs.
        result: multiprocessing.Queue. A queue to put results of test.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    start_time = time.time()
    num_files_with_errors = 0

    num_css_files = len(files_to_lint)
    if not files_to_lint:
        result.put('')
        print 'There are no CSS files to lint.'
        return

    print 'Total css files: ', num_css_files
    stylelint_cmd_args = [
        node_path, stylelint_path, '--config=' + config_path]
    result_list = []
    if not verbose_mode_enabled:
        print 'Linting CSS files.'
    for _, filepath in enumerate(files_to_lint):
        if verbose_mode_enabled:
            print 'Linting: ', filepath
        proc_args = stylelint_cmd_args + [filepath]
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        linter_stdout, linter_stderr = proc.communicate()
        if linter_stderr:
            print 'LINTER FAILED'
            print linter_stderr
            sys.exit(1)

        if linter_stdout:
            num_files_with_errors += 1
            result_list.append(linter_stdout)
            print linter_stdout
            stdout.put(linter_stdout)

    if num_files_with_errors:
        for error in result_list:
            result.put(error)
        result.put('%s    %s CSS file' % (
            _MESSAGE_TYPE_FAILED, num_files_with_errors))
    else:
        result.put('%s   %s CSS file linted (%.1f secs)' % (
            _MESSAGE_TYPE_SUCCESS, num_css_files, time.time() - start_time))

    print 'CSS linting finished.'


def _lint_js_and_ts_files(
        node_path, eslint_path, files_to_lint, stdout, result,
        verbose_mode_enabled):
    """Prints a list of lint errors in the given list of JavaScript files.

    Args:
        node_path: str. Path to the node binary.
        eslint_path: str. Path to the ESLint binary.
        files_to_lint: list(str). A list of filepaths to lint.
        stdout:  multiprocessing.Queue. A queue to store ESLint outputs.
        result: multiprocessing.Queue. A queue to put results of test.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    start_time = time.time()
    num_files_with_errors = 0

    num_js_and_ts_files = len(files_to_lint)
    if not files_to_lint:
        result.put('')
        print 'There are no JavaScript or Typescript files to lint.'
        return

    print 'Total js and ts files: ', num_js_and_ts_files
    eslint_cmd_args = [node_path, eslint_path, '--quiet']
    result_list = []
    print 'Linting JS and TS files.'
    for _, filepath in enumerate(files_to_lint):
        if verbose_mode_enabled:
            print 'Linting: ', filepath
        proc_args = eslint_cmd_args + [filepath]
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        linter_stdout, linter_stderr = proc.communicate()
        if linter_stderr:
            print 'LINTER FAILED'
            print linter_stderr
            sys.exit(1)

        if linter_stdout:
            num_files_with_errors += 1
            result_list.append(linter_stdout)
            stdout.put(linter_stdout)

    if num_files_with_errors:
        for error in result_list:
            result.put(error)
        result.put('%s    %s JavaScript and Typescript files' % (
            _MESSAGE_TYPE_FAILED, num_files_with_errors))
    else:
        result.put(
            '%s   %s JavaScript and Typescript files linted (%.1f secs)' % (
                _MESSAGE_TYPE_SUCCESS, num_js_and_ts_files,
                time.time() - start_time))

    print 'Js and Ts linting finished.'


def _lint_py_files(
        config_pylint, config_pycodestyle, files_to_lint, result,
        verbose_mode_enabled):
    """Prints a list of lint errors in the given list of Python files.

    Args:
        config_pylint: str. Path to the .pylintrc file.
        config_pycodestyle: str. Path to the tox.ini file.
        files_to_lint: list(str). A list of filepaths to lint.
        result: multiprocessing.Queue. A queue to put results of test.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    start_time = time.time()
    are_there_errors = False

    num_py_files = len(files_to_lint)
    if not files_to_lint:
        result.put('')
        print 'There are no Python files to lint.'
        return

    print 'Linting %s Python files' % num_py_files

    _batch_size = 50
    current_batch_start_index = 0

    while current_batch_start_index < len(files_to_lint):
        # Note that this index is an exclusive upper bound -- i.e., the current
        # batch of files ranges from 'start_index' to 'end_index - 1'.
        current_batch_end_index = min(
            current_batch_start_index + _batch_size, len(files_to_lint))
        current_files_to_lint = files_to_lint[
            current_batch_start_index: current_batch_end_index]
        if verbose_mode_enabled:
            print 'Linting Python files %s to %s...' % (
                current_batch_start_index + 1, current_batch_end_index)

        with _redirect_stdout(_TARGET_STDOUT):
            # This line invokes Pylint and prints its output
            # to the target stdout.
            pylinter = lint.Run(
                current_files_to_lint + [config_pylint],
                exit=False).linter
            # These lines invoke Pycodestyle and print its output
            # to the target stdout.
            style_guide = pycodestyle.StyleGuide(config_file=config_pycodestyle)
            pycodestyle_report = style_guide.check_files(
                paths=current_files_to_lint)

        if pylinter.msg_status != 0 or pycodestyle_report.get_count() != 0:
            result.put(_TARGET_STDOUT.getvalue())
            are_there_errors = True

        current_batch_start_index = current_batch_end_index

    if are_there_errors:
        result.put('%s    Python linting failed' % _MESSAGE_TYPE_FAILED)
    else:
        result.put('%s   %s Python files linted (%.1f secs)' % (
            _MESSAGE_TYPE_SUCCESS, num_py_files, time.time() - start_time))

    print 'Python linting finished.'


class LintChecksManager(object):
    """Manages all the linting functions.

    Attributes:
        all_filepaths: list(str). The list of filepaths to be linted.
        parsed_js_files: dict. Contains the content of JS files, after
            validating and parsing the files.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """

    def __init__(self, all_filepaths, verbose_mode_enabled=False):
        """Constructs a LintChecksManager object.

        Args:
            all_filepaths: list(str). The list of filepaths to be linted.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        # Set path for node.
        # The path for node is set explicitly, since otherwise the lint
        # tests fail on CircleCI due to the TypeScript files not being
        # compilable.
        node_path = os.path.join(os.pardir, 'oppia_tools/node-10.15.3')
        os.environ['PATH'] = '%s/bin:' % node_path + os.environ['PATH']

        self.all_filepaths = all_filepaths
        self.verbose_mode_enabled = verbose_mode_enabled
        self.parsed_js_and_ts_files = self._validate_and_parse_js_and_ts_files()

    def _validate_and_parse_js_and_ts_files(self):
        """This function validates JavaScript and Typescript files and
        returns the parsed contents as a Python dictionary.
        """

        # Select JS files which need to be checked.
        files_to_check = [
            filepath for filepath in self.all_filepaths if (
                filepath.endswith(('.js', '.ts')))
            and not any(fnmatch.fnmatch(filepath, pattern) for pattern in
                        EXCLUDED_PATHS)]
        parsed_js_and_ts_files = dict()
        if not files_to_check:
            return parsed_js_and_ts_files
        compiled_js_dir = tempfile.mkdtemp(dir=os.getcwd())
        if not self.verbose_mode_enabled:
            print 'Validating and parsing JS and TS files ...'
        for filepath in files_to_check:
            if self.verbose_mode_enabled:
                print 'Validating and parsing %s file ...' % filepath
            file_content = FileCache.read(filepath).decode('utf-8')

            try:
                # Use esprima to parse a JS or TS file.
                parsed_js_and_ts_files[filepath] = esprima.parseScript(
                    file_content, comment=True)
            except Exception as e:
                # Compile typescript file which has syntax not valid for JS
                # file.
                if filepath.endswith('.js'):
                    shutil.rmtree(compiled_js_dir)
                    raise Exception(e)
                try:
                    compiled_js_filepath = self._compile_ts_file(
                        filepath, compiled_js_dir)
                    file_content = FileCache.read(compiled_js_filepath).decode(
                        'utf-8')
                    parsed_js_and_ts_files[filepath] = esprima.parseScript(
                        file_content)
                except Exception as e:
                    shutil.rmtree(compiled_js_dir)
                    raise Exception(e)

        shutil.rmtree(compiled_js_dir)

        return parsed_js_and_ts_files

    def _compile_ts_file(self, filepath, dir_path):
        """Compiles a typescript file and returns the path for compiled
        js file.
        """
        allow_js = 'true'
        lib = 'es2017,dom'
        no_implicit_use_strict = 'true'
        skip_lib_check = 'true'
        target = 'es5'
        type_roots = './node_modules/@types'
        cmd = (
            './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
            '-lib %s -noImplicitUseStrict %s -skipLibCheck '
            '%s -target %s -typeRoots %s %s typings/*') % (
                dir_path, allow_js, lib, no_implicit_use_strict,
                skip_lib_check, target, type_roots, filepath)
        subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)
        compiled_js_filepath = os.path.join(
            dir_path, os.path.basename(filepath).replace('.ts', '.js'))
        return compiled_js_filepath

    def _lint_all_files(self):
        """This function is used to check if node-eslint dependencies are
        installed and pass ESLint binary path and lint all the files(JS, Python,
        HTML, CSS) with their respective third party linters.
        """

        print 'Starting linter...'

        pylintrc_path = os.path.join(os.getcwd(), '.pylintrc')

        config_pylint = '--rcfile=%s' % pylintrc_path

        config_pycodestyle = os.path.join(os.getcwd(), 'tox.ini')

        parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

        node_path = os.path.join(
            parent_dir, 'oppia_tools', 'node-10.15.3', 'bin', 'node')
        eslint_path = os.path.join(
            'node_modules', 'eslint', 'bin', 'eslint.js')
        stylelint_path = os.path.join(
            'node_modules', 'stylelint', 'bin', 'stylelint.js')
        config_path_for_css_in_html = os.path.join(
            parent_dir, 'oppia', '.stylelintrc')
        config_path_for_oppia_css = os.path.join(
            parent_dir, 'oppia', 'core', 'templates', 'dev', 'head',
            'css', '.stylelintrc')
        if not (os.path.exists(eslint_path) and os.path.exists(stylelint_path)):
            print ''
            print 'ERROR    Please run start.sh first to install node-eslint '
            print '         or node-stylelint and its dependencies.'
            sys.exit(1)

        js_and_ts_files_to_lint = [
            filepath for filepath in self.all_filepaths if filepath.endswith(
                ('.js', '.ts'))]
        py_files_to_lint = [
            filepath for filepath in self.all_filepaths if filepath.endswith(
                '.py')]
        html_files_to_lint_for_css = [
            filepath for filepath in self.all_filepaths if filepath.endswith(
                '.html')]
        css_files_to_lint = [
            filepath for filepath in self.all_filepaths if filepath.endswith(
                'oppia.css')]

        css_in_html_result = multiprocessing.Queue()
        css_in_html_stdout = multiprocessing.Queue()

        linting_processes = []
        linting_processes.append(multiprocessing.Process(
            target=_lint_css_files, args=(
                node_path,
                stylelint_path,
                config_path_for_css_in_html,
                html_files_to_lint_for_css, css_in_html_stdout,
                css_in_html_result, self.verbose_mode_enabled)))

        css_result = multiprocessing.Queue()
        css_stdout = multiprocessing.Queue()

        linting_processes.append(multiprocessing.Process(
            target=_lint_css_files, args=(
                node_path,
                stylelint_path,
                config_path_for_oppia_css,
                css_files_to_lint, css_stdout,
                css_result, self.verbose_mode_enabled)))

        js_and_ts_result = multiprocessing.Queue()
        js_and_ts_stdout = multiprocessing.Queue()

        linting_processes.append(multiprocessing.Process(
            target=_lint_js_and_ts_files, args=(
                node_path, eslint_path, js_and_ts_files_to_lint,
                js_and_ts_stdout, js_and_ts_result, self.verbose_mode_enabled)))

        py_result = multiprocessing.Queue()

        linting_processes.append(multiprocessing.Process(
            target=_lint_py_files,
            args=(
                config_pylint, config_pycodestyle, py_files_to_lint,
                py_result, self.verbose_mode_enabled)))

        if self.verbose_mode_enabled:
            print 'Starting CSS, Javascript and Python Linting'
            print '----------------------------------------'

        for process in linting_processes:
            process.daemon = False
            process.start()

        for process in linting_processes:
            process.join()

        js_and_ts_messages = []
        while not js_and_ts_stdout.empty():
            js_and_ts_messages.append(js_and_ts_stdout.get())

        print ''
        print '\n'.join(js_and_ts_messages)

        summary_messages = []

        result_queues = [
            css_in_html_result, css_result,
            js_and_ts_result, py_result]

        for result_queue in result_queues:
            while not result_queue.empty():
                summary_messages.append(result_queue.get())

        with _redirect_stdout(_TARGET_STDOUT):
            print '\n'.join(summary_messages)
            print ''

        return summary_messages

    def _check_directive_scope(self):
        """This function checks that all directives have an explicit
        scope: {} and it should not be scope: true.
        """
        if self.verbose_mode_enabled:
            print 'Starting directive scope check'
            print '----------------------------------------'
        # Select JS and TS files which need to be checked.
        files_to_check = [
            filepath for filepath in self.all_filepaths if (
                filepath.endswith(('.js', '.ts')))
            and not any(fnmatch.fnmatch(filepath, pattern) for pattern in
                        EXCLUDED_PATHS)]
        failed = False
        summary_messages = []
        components_to_check = ['directive']

        for filepath in files_to_check:
            parsed_script = self.parsed_js_and_ts_files[filepath]
            with _redirect_stdout(_TARGET_STDOUT):
                # Parse the body of the content as nodes.
                parsed_nodes = parsed_script.body
                for parsed_node in parsed_nodes:
                    expression = _get_expression_from_node_if_one_exists(
                        parsed_node, components_to_check)
                    if not expression:
                        continue
                    # Separate the arguments of the expression.
                    arguments = expression.arguments
                    # The first argument of the expression is the
                    # name of the directive.
                    if arguments[0].type == 'Literal':
                        directive_name = str(arguments[0].value)
                    arguments = arguments[1:]
                    for argument in arguments:
                        # Check the type of an argument.
                        if argument.type != 'ArrayExpression':
                            continue
                        # Separate out the elements for the argument.
                        elements = argument.elements
                        for element in elements:
                            # Check the type of an element.
                            if element.type != 'FunctionExpression':
                                continue
                            # Separate out the body of the element.
                            body = element.body
                            if body.type != 'BlockStatement':
                                continue
                            # Further separate the body elements from the body.
                            body_elements = body.body
                            for body_element in body_elements:
                                # Check if the body element is a return
                                # statement.
                                body_element_type_is_not_return = (
                                    body_element.type != 'ReturnStatement')
                                body_element_argument_type_is_not_object = (
                                    body_element.argument.type != (
                                        'ObjectExpression'))
                                if (
                                        body_element_argument_type_is_not_object
                                        or (
                                            body_element_type_is_not_return)):
                                    continue
                                # Separate the properties of the return node.
                                return_node_properties = (
                                    body_element.argument.properties)
                                # Loop over all the properties of the return
                                # node to find out the scope key.
                                for return_node_property in (
                                        return_node_properties):
                                    # Check whether the property is scope.
                                    property_key_is_an_identifier = (
                                        return_node_property.key.type == (
                                            'Identifier'))
                                    property_key_name_is_scope = (
                                        return_node_property.key.name == (
                                            'scope'))
                                    if (
                                            property_key_is_an_identifier and (
                                                property_key_name_is_scope)):
                                        # Separate the scope value and
                                        # check if it is an Object Expression.
                                        # If it is not, then check for scope:
                                        # true and report the error message.
                                        scope_value = return_node_property.value
                                        if scope_value.type == 'Literal' and (
                                                scope_value.value):
                                            failed = True
                                            print (
                                                'Please ensure that %s '
                                                'directive in %s file '
                                                'does not have scope set to '
                                                'true.' %
                                                (directive_name, filepath))
                                            print ''
                                        elif scope_value.type != (
                                                'ObjectExpression'):
                                            # Check whether the directive has
                                            # scope: {} else report the error
                                            # message.
                                            failed = True
                                            print (
                                                'Please ensure that %s '
                                                'directive in %s file has a '
                                                'scope: {}.' % (
                                                    directive_name, filepath))
                                            print ''

        with _redirect_stdout(_TARGET_STDOUT):
            if failed:
                summary_message = '%s   Directive scope check failed' % (
                    _MESSAGE_TYPE_FAILED)
                print summary_message
                summary_messages.append(summary_message)
            else:
                summary_message = '%s  Directive scope check passed' % (
                    _MESSAGE_TYPE_SUCCESS)
                print summary_message
                summary_messages.append(summary_message)

            print ''
            return summary_messages

    def _check_js_and_ts_component_name_and_count(self):
        """This function ensures that all JS/TS files have exactly
        one component and and that the name of the component
        matches the filename.
        """
        if self.verbose_mode_enabled:
            print 'Starting js component name and count check'
            print '----------------------------------------'
        # Select JS files which need to be checked.
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS)
            and filepath.endswith(('.js', '.ts')) and (
                not filepath.endswith('App.ts'))]
        failed = False
        summary_messages = []
        components_to_check = ['controller', 'directive', 'factory', 'filter']
        for filepath in files_to_check:
            component_num = 0
            # Filename without its path and extension.
            parsed_script = self.parsed_js_and_ts_files[filepath]
            with _redirect_stdout(_TARGET_STDOUT):
                # Parse the body of the content as nodes.
                parsed_nodes = parsed_script.body
                for parsed_node in parsed_nodes:
                    expression = _get_expression_from_node_if_one_exists(
                        parsed_node, components_to_check)
                    if not expression:
                        continue
                    component_num += 1
                    # Check if the number of components in each file exceeds
                    # one.
                    if component_num > 1:
                        print (
                            '%s -> Please ensure that there is exactly one '
                            'component in the file.' % (filepath))
                        failed = True
                        break

        with _redirect_stdout(_TARGET_STDOUT):
            if failed:
                summary_message = (
                    '%s  JS and TS Component name and count check failed' %
                    (_MESSAGE_TYPE_FAILED))
                print summary_message
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s  JS and TS Component name and count check passed' %
                    (_MESSAGE_TYPE_SUCCESS))
                print summary_message
                summary_messages.append(summary_message)

            print ''
            return summary_messages

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
        file_content = FileCache.readlines(filepath)
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
                pattern_found_list.append(False)
                for line in file_content:
                    if re.search(regexp_to_check['regexp'], line):
                        pattern_found_list[index] = True
                        break
        if not all(pattern_found_list):
            failed = True
            for index, pattern_found in enumerate(
                    pattern_found_list):
                if not pattern_found:
                    print '%s --> %s' % (
                        filepath,
                        pattern_list[index]['message'])
        return failed

    def _check_mandatory_patterns(self):
        """This function checks that all files contain the mandatory
        patterns.
        """
        if self.verbose_mode_enabled:
            print 'Starting mandatory patterns check'
            print '----------------------------------------'

        summary_messages = []
        failed = False

        with _redirect_stdout(_TARGET_STDOUT):
            sets_of_patterns_to_match = [
                MANDATORY_PATTERNS_REGEXP, MANDATORY_PATTERNS_JS_REGEXP]
            for filepath in self.all_filepaths:
                for pattern_list in sets_of_patterns_to_match:
                    failed = self._check_for_mandatory_pattern_in_file(
                        pattern_list, filepath, failed)

            if failed:
                summary_message = (
                    '%s  Mandatory pattern check failed' % (
                        _MESSAGE_TYPE_FAILED))
            else:
                summary_message = (
                    '%s  Mandatory pattern check passed' % (
                        _MESSAGE_TYPE_SUCCESS))
            print summary_message

        print ''

        summary_messages.append(summary_message)
        return summary_messages

    def _check_sorted_dependencies(self):
        """This function checks that the dependencies which are
        imported in the controllers/directives/factories in JS
        files are in following pattern: dollar imports, regular
        imports, and constant imports, all in sorted order.
        """
        if self.verbose_mode_enabled:
            print 'Starting sorted dependencies check'
            print '----------------------------------------'
        files_to_check = [
            filepath for filepath in self.all_filepaths if
            filepath.endswith(('.js', '.ts')) and not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS)]
        components_to_check = ['controller', 'directive', 'factory']
        failed = False
        summary_messages = []

        for filepath in files_to_check:
            parsed_script = self.parsed_js_and_ts_files[filepath]
            with _redirect_stdout(_TARGET_STDOUT):
                parsed_nodes = parsed_script.body
                for parsed_node in parsed_nodes:
                    expression = _get_expression_from_node_if_one_exists(
                        parsed_node, components_to_check)
                    if not expression:
                        continue
                    # Separate the arguments of the expression.
                    arguments = expression.arguments
                    if arguments[0].type == 'Literal':
                        property_value = str(arguments[0].value)
                    arguments = arguments[1:]
                    for argument in arguments:
                        if argument.type != 'ArrayExpression':
                            continue
                        literal_args = []
                        function_args = []
                        dollar_imports = []
                        regular_imports = []
                        constant_imports = []
                        elements = argument.elements
                        for element in elements:
                            if element.type == 'Literal':
                                literal_args.append(str(element.value))
                            elif element.type == 'FunctionExpression':
                                func_args = element.params
                                for func_arg in func_args:
                                    function_args.append(str(func_arg.name))
                        for arg in function_args:
                            if arg.startswith('$'):
                                dollar_imports.append(arg)
                            elif re.search('[a-z]', arg):
                                regular_imports.append(arg)
                            else:
                                constant_imports.append(arg)
                        dollar_imports.sort()
                        regular_imports.sort()
                        constant_imports.sort()
                        sorted_imports = (
                            dollar_imports + regular_imports + constant_imports)
                        if sorted_imports != function_args:
                            failed = True
                            print (
                                'Please ensure that in %s in file %s, the '
                                'injected dependencies should be in the '
                                'following manner: dollar imports, regular '
                                'imports and constant imports, all in sorted '
                                'order.'
                                % (property_value, filepath))
                        if sorted_imports != literal_args:
                            failed = True
                            print (
                                'Please ensure that in %s in file %s, the '
                                'stringfied dependencies should be in the '
                                'following manner: dollar imports, regular '
                                'imports and constant imports, all in sorted '
                                'order.'
                                % (property_value, filepath))

        with _redirect_stdout(_TARGET_STDOUT):
            if failed:
                summary_message = (
                    '%s  Sorted dependencies check failed' % (
                        _MESSAGE_TYPE_FAILED))
            else:
                summary_message = (
                    '%s  Sorted dependencies check passed' % (
                        _MESSAGE_TYPE_SUCCESS))

        summary_messages.append(summary_message)
        print ''
        print summary_message
        if self.verbose_mode_enabled:
            print '----------------------------------------'

        return summary_messages

    def _match_line_breaks_in_controller_dependencies(self):
        """This function checks whether the line breaks between the dependencies
        listed in the controller of a directive or service exactly match those
        between the arguments of the controller function.
        """
        if self.verbose_mode_enabled:
            print 'Starting controller dependency line break check'
            print '----------------------------------------'
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS) and filepath.endswith(('.js', '.ts'))]
        failed = False
        summary_messages = []

        # For RegExp explanation, please see https://regex101.com/r/T85GWZ/2/.
        pattern_to_match = (
            r'controller.* \[(?P<stringfied_dependencies>[\S\s]*?)' +
            r'function\((?P<function_parameters>[\S\s]*?)\)')
        with _redirect_stdout(_TARGET_STDOUT):
            for filepath in files_to_check:
                file_content = FileCache.read(filepath)
                matched_patterns = re.findall(pattern_to_match, file_content)
                for matched_pattern in matched_patterns:
                    stringfied_dependencies, function_parameters = (
                        matched_pattern)
                    stringfied_dependencies = (
                        stringfied_dependencies.strip().replace(
                            '\'', '').replace(' ', ''))[:-1]
                    function_parameters = (
                        function_parameters.strip().replace(' ', ''))
                    if stringfied_dependencies != function_parameters:
                        failed = True
                        print (
                            'Please ensure that in file %s the line breaks '
                            'pattern between the dependencies mentioned as '
                            'strings:\n[%s]\nand the dependencies mentioned '
                            'as function parameters: \n(%s)\nfor the '
                            'corresponding controller should '
                            'exactly match.' % (
                                filepath, stringfied_dependencies,
                                function_parameters))
                        print ''

            if failed:
                summary_message = (
                    '%s   Controller dependency line break check failed' % (
                        _MESSAGE_TYPE_FAILED))
                print summary_message
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s  Controller dependency line break check passed' % (
                        _MESSAGE_TYPE_SUCCESS))
                print summary_message
                summary_messages.append(summary_message)

            print ''

        return summary_messages

    def _check_html_directive_name(self):
        """This function checks that all HTML directives end
        with _directive.html.
        """
        if self.verbose_mode_enabled:
            print 'Starting HTML directive name check'
            print '----------------------------------------'
        total_files_checked = 0
        total_error_count = 0
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS) and filepath.endswith(('.js', '.ts'))]
        failed = False
        summary_messages = []
        # For RegExp explanation, please see https://regex101.com/r/gU7oT6/37.
        pattern_to_match = (
            r'templateUrl: UrlInterpolationService\.[A-z\(]+' +
            r'(?P<directive_name>[^\)]+)')
        with _redirect_stdout(_TARGET_STDOUT):
            for filepath in files_to_check:
                file_content = FileCache.read(filepath)
                total_files_checked += 1
                matched_patterns = re.findall(pattern_to_match, file_content)
                for matched_pattern in matched_patterns:
                    matched_pattern = matched_pattern.split()
                    directive_filepath = ''.join(matched_pattern).replace(
                        '\'', '').replace('+', '')
                    if not directive_filepath.endswith('_directive.html'):
                        failed = True
                        total_error_count += 1
                        print (
                            '%s --> Please ensure that this file ends'
                            'with _directive.html.' % directive_filepath)
                        print ''

            if failed:
                summary_message = '%s   HTML directive name check failed' % (
                    _MESSAGE_TYPE_FAILED)
                summary_messages.append(summary_message)
            else:
                summary_message = '%s   HTML directive name check passed' % (
                    _MESSAGE_TYPE_SUCCESS)
                summary_messages.append(summary_message)

            print ''
            if total_files_checked == 0:
                if self.verbose_mode_enabled:
                    print 'There are no files to be checked.'
            else:
                print '(%s files checked, %s errors found)' % (
                    total_files_checked, total_error_count)
                print summary_message

        return summary_messages

    def _check_import_order(self):
        """This function is used to check that each file
        has imports placed in alphabetical order.
        """
        if self.verbose_mode_enabled:
            print 'Starting import-order checks'
            print '----------------------------------------'
        summary_messages = []
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS) and filepath.endswith('.py')]
        failed = False
        with _redirect_stdout(_TARGET_STDOUT):
            for filepath in files_to_check:
                # This line prints the error message along with file path
                # and returns True if it finds an error else returns False
                # If check is set to True, isort simply checks the file and
                # if check is set to False, it autocorrects import-order errors.
                if (isort.SortImports(
                        filepath, check=True, show_diff=(
                            True)).incorrectly_sorted):
                    failed = True
                    print ''

            print ''
            if failed:
                summary_message = (
                    '%s   Import order checks failed' % _MESSAGE_TYPE_FAILED)
                print summary_message
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s   Import order checks passed' % _MESSAGE_TYPE_SUCCESS)
                print summary_message
                summary_messages.append(summary_message)

        return summary_messages

    def _check_docstrings(self):
        """This function ensures that docstrings end in a period and the arg
        order in the function definition matches the order in the doc string.

        Returns:
            summary_messages: list(str). Summary of messages generated by the
            check.
        """
        if self.verbose_mode_enabled:
            print 'Starting docstring checks'
            print '----------------------------------------'
        summary_messages = []
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS) and filepath.endswith('.py')]
        missing_period_message = (
            'There should be a period at the end of the docstring.')
        multiline_docstring_message = (
            'Multiline docstring should end with a new line.')
        single_line_docstring_message = (
            'Single line docstring should not span two lines. '
            'If line length exceeds 80 characters, '
            'convert the single line docstring to a multiline docstring.')
        previous_line_message = (
            'There should not be any empty lines before the end of '
            'the multi-line docstring.')
        space_after_triple_quotes_in_docstring_message = (
            'There should be no space after """ in docstring.')
        failed = False
        is_docstring = False
        is_class_or_function = False
        with _redirect_stdout(_TARGET_STDOUT):
            for filepath in files_to_check:
                file_content = FileCache.readlines(filepath)
                file_length = len(file_content)
                for line_num in range(file_length):
                    line = file_content[line_num].strip()
                    prev_line = ''

                    if line_num > 0:
                        prev_line = file_content[line_num - 1].strip()

                    # Check if it is a docstring and not some multi-line string.
                    if (prev_line.startswith('class ') or
                            prev_line.startswith('def ')) or (
                                is_class_or_function):
                        is_class_or_function = True
                        if prev_line.endswith('):') and (
                                line.startswith('"""')):
                            is_docstring = True
                            is_class_or_function = False

                    # Check for space after """ in docstring.
                    if re.match(r'^""".+$', line) and is_docstring and (
                            line[3] == ' '):
                        failed = True
                        print '%s --> Line %s: %s' % (
                            filepath, line_num + 1,
                            space_after_triple_quotes_in_docstring_message)
                        print ''
                        is_docstring = False

                    # Check if single line docstring span two lines.
                    if line == '"""' and prev_line.startswith('"""') and (
                            is_docstring):
                        failed = True
                        print '%s --> Line %s: %s' % (
                            filepath, line_num, single_line_docstring_message)
                        print ''
                        is_docstring = False

                    # Check for single line docstring.
                    elif re.match(r'^""".+"""$', line) and is_docstring:
                        # Check for punctuation at line[-4] since last three
                        # characters are double quotes.
                        if (len(line) > 6) and (
                                line[-4] not in
                                ALLOWED_TERMINATING_PUNCTUATIONS):
                            failed = True
                            print '%s --> Line %s: %s' % (
                                filepath, line_num + 1, missing_period_message)
                            print ''
                        is_docstring = False

                    # Check for multiline docstring.
                    elif line.endswith('"""') and is_docstring:
                        # Case 1: line is """. This is correct for multiline
                        # docstring.
                        if line == '"""':
                            # Check for empty line before the end of docstring.
                            if prev_line == '':
                                failed = True
                                print '%s --> Line %s: %s' % (
                                    filepath, line_num, previous_line_message)
                                print ''
                            # Check for punctuation at end of docstring.
                            else:
                                last_char_is_invalid = prev_line[-1] not in (
                                    ALLOWED_TERMINATING_PUNCTUATIONS)
                                no_word_is_present_in_excluded_phrases = (
                                    not any(
                                        word in prev_line for word in(
                                            EXCLUDED_PHRASES)))
                                if last_char_is_invalid and (
                                        no_word_is_present_in_excluded_phrases):
                                    failed = True
                                    print '%s --> Line %s: %s' % (
                                        filepath, line_num,
                                        missing_period_message)
                                    print ''

                        # Case 2: line contains some words before """. """
                        # should shift to next line.
                        elif not any(word in line for word in EXCLUDED_PHRASES):
                            failed = True
                            print '%s --> Line %s: %s' % (
                                filepath, line_num + 1,
                                multiline_docstring_message)
                            print ''

                        is_docstring = False

            docstring_checker = docstrings_checker.ASTDocStringChecker()
            for filepath in files_to_check:
                ast_file = ast.walk(ast.parse(FileCache.read(filepath)))
                func_defs = [n for n in ast_file if isinstance(
                    n, ast.FunctionDef)]
                for func in func_defs:
                    # Check that the args in the docstring are listed in the
                    # same order as they appear in the function definition.
                    func_result = docstring_checker.check_docstrings_arg_order(
                        func)
                    for error_line in func_result:
                        print '%s --> Func %s: %s' % (
                            filepath, func.name, error_line)
                        print ''
                        failed = True

            print ''
            if failed:
                summary_message = (
                    '%s   Docstring check failed' % _MESSAGE_TYPE_FAILED)
                print summary_message
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s   Docstring check passed' % _MESSAGE_TYPE_SUCCESS)
                print summary_message
                summary_messages.append(summary_message)

        return summary_messages

    def _check_comments(self):
        """This function ensures that comments follow correct style."""
        if self.verbose_mode_enabled:
            print 'Starting comment checks'
            print '----------------------------------------'
        summary_messages = []
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS) and filepath.endswith('.py')]
        message = 'There should be a period at the end of the comment.'
        failed = False
        space_regex = re.compile(r'^#[^\s].*$')
        capital_regex = re.compile('^# [a-z][A-Za-z]* .*$')
        with _redirect_stdout(_TARGET_STDOUT):
            for filepath in files_to_check:
                file_content = FileCache.readlines(filepath)
                file_length = len(file_content)
                for line_num in range(file_length):
                    line = file_content[line_num].strip()
                    next_line = ''
                    previous_line = ''
                    if line_num + 1 < file_length:
                        next_line = file_content[line_num + 1].strip()
                    if line_num > 0:
                        previous_line = file_content[line_num - 1].strip()

                    if line.startswith('#') and not next_line.startswith('#'):
                        # Check that the comment ends with the proper
                        # punctuation.
                        last_char_is_invalid = line[-1] not in (
                            ALLOWED_TERMINATING_PUNCTUATIONS)
                        no_word_is_present_in_excluded_phrases = not any(
                            word in line for word in EXCLUDED_PHRASES)
                        if last_char_is_invalid and (
                                no_word_is_present_in_excluded_phrases):
                            failed = True
                            print '%s --> Line %s: %s' % (
                                filepath, line_num + 1, message)
                            print ''

                    # Check that comment starts with a space and is not a
                    # shebang expression at the start of a bash script which
                    # loses funtion when a space is added.
                    if space_regex.match(line) and not line.startswith('#!'):
                        message = (
                            'There should be a space at the beginning '
                            'of the comment.')
                        failed = True
                        print '%s --> Line %s: %s' % (
                            filepath, line_num + 1, message)
                        print ''

                    # Check that comment starts with a capital letter.
                    if not previous_line.startswith('#') and (
                            capital_regex.match(line)):
                        message = (
                            'There should be a capital letter'
                            ' to begin the content of the comment.')
                        failed = True
                        print '%s --> Line %s: %s' % (
                            filepath, line_num + 1, message)
                        print ''

            print ''
            if failed:
                summary_message = (
                    '%s   Comments check failed' % _MESSAGE_TYPE_FAILED)
                print summary_message
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s   Comments check passed' % _MESSAGE_TYPE_SUCCESS)
                print summary_message
                summary_messages.append(summary_message)

        return summary_messages

    def _check_html_tags_and_attributes(self, debug=False):
        """This function checks the indentation of lines in HTML files."""

        if self.verbose_mode_enabled:
            print 'Starting HTML tag and attribute check'
            print '----------------------------------------'

        html_files_to_lint = [
            filepath for filepath in self.all_filepaths if filepath.endswith(
                '.html')]

        failed = False
        summary_messages = []

        with _redirect_stdout(_TARGET_STDOUT):
            for filepath in html_files_to_lint:
                file_content = FileCache.read(filepath)
                file_lines = FileCache.readlines(filepath)
                parser = CustomHTMLParser(filepath, file_lines, debug)
                parser.feed(file_content)

                if len(parser.tag_stack) != 0:
                    raise TagMismatchException('Error in file %s\n' % filepath)

                if parser.failed:
                    failed = True

            if failed:
                summary_message = '%s   HTML tag and attribute check failed' % (
                    _MESSAGE_TYPE_FAILED)
                print summary_message
                summary_messages.append(summary_message)
            else:
                summary_message = '%s  HTML tag and attribute check passed' % (
                    _MESSAGE_TYPE_SUCCESS)
                print summary_message
                summary_messages.append(summary_message)

            print ''

        return summary_messages

    def _lint_html_files(self):
        """This function is used to check HTML files for linting errors."""
        parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

        node_path = os.path.join(
            parent_dir, 'oppia_tools', 'node-10.15.3', 'bin', 'node')
        htmllint_path = os.path.join(
            'node_modules', 'htmllint-cli', 'bin', 'cli.js')

        error_summary = []
        total_error_count = 0
        summary_messages = []
        htmllint_cmd_args = [node_path, htmllint_path, '--rc=.htmllintrc']
        html_files_to_lint = [
            filepath for filepath in self.all_filepaths if filepath.endswith(
                '.html')]
        if self.verbose_mode_enabled:
            print 'Starting HTML linter...'
            print '----------------------------------------'
        print ''
        if not self.verbose_mode_enabled:
            print 'Linting HTML files.'
        for filepath in html_files_to_lint:
            proc_args = htmllint_cmd_args + [filepath]
            if self.verbose_mode_enabled:
                print 'Linting %s file' % filepath
            with _redirect_stdout(_TARGET_STDOUT):
                proc = subprocess.Popen(
                    proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

                linter_stdout, _ = proc.communicate()
                # This line splits the output of the linter and extracts digits
                # from it. The digits are stored in a list. The second last
                # digit in the list represents the number of errors in the file.
                error_count = (
                    [int(s) for s in linter_stdout.split() if s.isdigit()][-2])
                if error_count:
                    error_summary.append(error_count)
                    print linter_stdout

        with _redirect_stdout(_TARGET_STDOUT):
            if self.verbose_mode_enabled:
                print '----------------------------------------'
            for error_count in error_summary:
                total_error_count += error_count
            total_files_checked = len(html_files_to_lint)
            if total_error_count:
                print '(%s files checked, %s errors found)' % (
                    total_files_checked, total_error_count)
                summary_message = '%s   HTML linting failed' % (
                    _MESSAGE_TYPE_FAILED)
                summary_messages.append(summary_message)
            else:
                summary_message = '%s   HTML linting passed' % (
                    _MESSAGE_TYPE_SUCCESS)
                summary_messages.append(summary_message)

            print ''
            print summary_message
            print 'HTML linting finished.'
            print ''

        return summary_messages

    def _check_bad_patterns(self):
        """This function is used for detecting bad patterns."""
        if self.verbose_mode_enabled:
            print 'Starting Pattern Checks'
            print '----------------------------------------'
        total_files_checked = 0
        total_error_count = 0
        summary_messages = []
        all_filepaths = [
            filepath for filepath in self.all_filepaths if not (
                filepath.endswith('pre_commit_linter.py') or
                any(
                    fnmatch.fnmatch(filepath, pattern)
                    for pattern in EXCLUDED_PATHS)
                )]
        failed = False
        with _redirect_stdout(_TARGET_STDOUT):
            for filepath in all_filepaths:
                file_content = FileCache.read(filepath)
                total_files_checked += 1
                for pattern in BAD_PATTERNS:
                    if (pattern in file_content and
                            not _is_filepath_excluded_for_bad_patterns_check(
                                pattern, filepath)):
                        failed = True
                        print '%s --> %s' % (
                            filepath, BAD_PATTERNS[pattern]['message'])
                        print ''
                        total_error_count += 1

                for regexp in BAD_PATTERNS_REGEXP:
                    if _check_bad_pattern_in_file(
                            filepath, file_content, regexp):
                        failed = True
                        total_error_count += 1

                if filepath.endswith(('.js', '.ts')):
                    for regexp in BAD_PATTERNS_JS_AND_TS_REGEXP:
                        if _check_bad_pattern_in_file(
                                filepath, file_content, regexp):
                            failed = True
                            total_error_count += 1

                if filepath.endswith('.html'):
                    for regexp in BAD_LINE_PATTERNS_HTML_REGEXP:
                        if _check_bad_pattern_in_file(
                                filepath, file_content, regexp):
                            failed = True
                            total_error_count += 1

                if filepath.endswith('.py'):
                    for regexp in BAD_PATTERNS_PYTHON_REGEXP:
                        if _check_bad_pattern_in_file(
                                filepath, file_content, regexp):
                            failed = True
                            total_error_count += 1

                if filepath == 'constants.js':
                    for pattern in REQUIRED_STRINGS_CONSTANTS:
                        if pattern not in file_content:
                            failed = True
                            print '%s --> %s' % (
                                filepath,
                                REQUIRED_STRINGS_CONSTANTS[pattern]['message'])
                            print ''
                            total_error_count += 1
            if failed:
                summary_message = '%s Pattern checks failed' % (
                    _MESSAGE_TYPE_FAILED)
                summary_messages.append(summary_message)
            else:
                summary_message = '%s Pattern checks passed' % (
                    _MESSAGE_TYPE_SUCCESS)
                summary_messages.append(summary_message)

            print ''
            if total_files_checked == 0:
                print 'There are no files to be checked.'
            else:
                print '(%s files checked, %s errors found)' % (
                    total_files_checked, total_error_count)
                print summary_message

        return summary_messages

    def check_for_important_patterns_at_bottom_of_codeowners(
            self, important_patterns):
        """Checks that the most important patterns are at the bottom
        of the CODEOWNERS file.

        Arguments:
            important_patterns: list(str). List of the important
                patterns for CODEOWNERS file.

        Returns:
            bool. Whether the CODEOWNERS "important pattern" check fails.
        """

        failed = False

        # Check that there are no duplicate elements in the lists.
        important_patterns_set = set(important_patterns)
        codeowner_important_paths_set = set(CODEOWNER_IMPORTANT_PATHS)
        if len(important_patterns_set) != len(important_patterns):
            print('%s --> Duplicate pattern(s) found in critical rules'
                  ' section.' % CODEOWNER_FILEPATH)
            failed = True
        if len(codeowner_important_paths_set) != len(CODEOWNER_IMPORTANT_PATHS):
            print('scripts/pre_commit_linter.py --> Duplicate pattern(s) found '
                  'in CODEOWNER_IMPORTANT_PATHS list.')
            failed = True

        # Check missing rules by set difference operation.
        critical_rule_section_minus_list_set = (
            important_patterns_set.difference(codeowner_important_paths_set))
        list_minus_critical_rule_section_set = (
            codeowner_important_paths_set.difference(important_patterns_set))
        for rule in critical_rule_section_minus_list_set:
            print('%s --> Rule %s is not present in the '
                  'CODEOWNER_IMPORTANT_PATHS list in '
                  'scripts/pre_commit_linter.py. Please add this rule in the '
                  'mentioned list or remove this rule from the \'Critical files'
                  '\' section.' % (CODEOWNER_FILEPATH, rule))
            failed = True
        for rule in list_minus_critical_rule_section_set:
            print('%s --> Rule \'%s\' is not present in the \'Critical files\' '
                  'section. Please place it under the \'Critical files\' '
                  'section since it is an important rule. Alternatively please '
                  'remove it from the \'CODEOWNER_IMPORTANT_PATHS\' list in '
                  'scripts/pre_commit_linter.py if it is no longer an '
                  'important rule.' % (CODEOWNER_FILEPATH, rule))
            failed = True

        return failed

    def _check_codeowner_file(self):
        """Checks the CODEOWNERS file for any uncovered dirs/files and also
        checks that every pattern in the CODEOWNERS file matches at least one
        file/dir. Note that this checks the CODEOWNERS file according to the
        glob patterns supported by Python2.7 environment. For more information
        please refer https://docs.python.org/2/library/glob.html.
        This function also ensures that the most important rules are at the
        bottom of the CODEOWNERS file.
        """
        if self.verbose_mode_enabled:
            print 'Starting CODEOWNERS file check'
            print '----------------------------------------'

        with _redirect_stdout(_TARGET_STDOUT):
            failed = False
            summary_messages = []
            # Checks whether every pattern in the CODEOWNERS file matches at
            # least one dir/file.
            critical_file_section_found = False
            important_rules_in_critical_section = []
            file_patterns = []
            dir_patterns = []
            for line_num, line in enumerate(FileCache.readlines(
                    CODEOWNER_FILEPATH)):
                stripped_line = line.strip()
                if '# Critical files' in line:
                    critical_file_section_found = True
                if stripped_line and stripped_line[0] != '#':
                    if '@' not in line:
                        print ('%s --> Pattern on line %s doesn\'t have '
                               'codeowner' % (CODEOWNER_FILEPATH, line_num + 1))
                        failed = True
                    else:
                        # Extract the file pattern from the line.
                        line_in_concern = line.split('@')[0].strip()
                        # This is being populated for the important rules
                        # check.
                        if critical_file_section_found:
                            important_rules_in_critical_section.append(
                                line_in_concern)
                        # Checks if the path is the full path relative to the
                        # root oppia directory.
                        if not line_in_concern.startswith('/'):
                            print ('%s --> Pattern on line %s is invalid. Use '
                                   'full path relative to the root directory'
                                   % (CODEOWNER_FILEPATH, line_num + 1))
                            failed = True

                        # The double asterisks pattern is supported by the
                        # CODEOWNERS syntax but not the glob in Python 2.
                        # The following condition checks this.
                        if '**' in line_in_concern:
                            print ('%s --> Pattern on line %s is invalid. '
                                   '\'**\' wildcard not allowed' % (
                                       CODEOWNER_FILEPATH, line_num + 1))
                            failed = True
                        # Adjustments to the dir paths in CODEOWNERS syntax
                        # for glob-style patterns to match correctly.
                        if line_in_concern.endswith('/'):
                            line_in_concern = line_in_concern[:-1]
                        # The following condition checks whether the specified
                        # path exists in the codebase or not. The CODEOWNERS
                        # syntax has paths starting with '/' which refers to
                        # full path relative to root, but python glob module
                        # does not conform to this logic and literally matches
                        # the '/' character. Therefore the leading '/' has to
                        # be changed to './' for glob patterns to match
                        # correctly.
                        line_in_concern = line_in_concern.replace('/', './', 1)
                        if not glob.glob(line_in_concern):
                            print ('%s --> Pattern on line %s doesn\'t match '
                                   'any file or directory' % (
                                       CODEOWNER_FILEPATH, line_num + 1))
                            failed = True
                        # The following list is being populated with the
                        # paths in the CODEOWNERS file with the removal of the
                        # leading '/' to aid in the glob pattern matching in
                        # the next part of the check wherein the valid patterns
                        # are used to check if they cover the entire codebase.
                        if os.path.isdir(line_in_concern):
                            dir_patterns.append(line_in_concern)
                        else:
                            file_patterns.append(line_in_concern)

            # Checks that every file (except those under the dir represented by
            # the dir_patterns) is covered under CODEOWNERS.
            for file_paths in _walk_with_gitignore('.', dir_patterns):
                for file_path in file_paths:
                    match = False
                    for file_pattern in file_patterns:
                        if file_path in glob.glob(file_pattern):
                            match = True
                            break
                    if not match:
                        print '%s is not covered under CODEOWNERS' % file_path
                        failed = True

            failed = failed or (
                self.check_for_important_patterns_at_bottom_of_codeowners(
                    important_rules_in_critical_section))

            if failed:
                summary_message = '%s   CODEOWNERS file check failed' % (
                    _MESSAGE_TYPE_FAILED)
            else:
                summary_message = '%s  CODEOWNERS file check passed' % (
                    _MESSAGE_TYPE_SUCCESS)

            summary_messages.append(summary_message)
            print summary_message
            print ''

        return summary_messages

    def _check_extra_js_files(self):
        """Checks if the changes made include extra js files in core
        or extensions folder which are not specified in
        build.JS_FILEPATHS_NOT_TO_BUILD.
        """

        if self.verbose_mode_enabled:
            print 'Starting extra js files check'
            print '----------------------------------------'

        summary_messages = []
        failed = False
        with _redirect_stdout(_TARGET_STDOUT):
            js_files_to_check = [
                filepath for filepath in self.all_filepaths if (
                    filepath.endswith('.js'))]

            for filepath in js_files_to_check:
                if filepath.startswith(('core/templates', 'extensions')) and (
                        filepath not in build.JS_FILEPATHS_NOT_TO_BUILD) and (
                            not filepath.endswith('protractor.js')):
                    print '%s  --> Found extra .js file\n' % filepath
                    failed = True

            if failed:
                err_msg = (
                    'If you want the above files to be present as js files, '
                    'add them to the list JS_FILEPATHS_NOT_TO_BUILD in '
                    'build.py. Otherwise, rename them to .ts\n')
                print err_msg

            if failed:
                summary_message = '%s  Extra JS files check failed' % (
                    _MESSAGE_TYPE_FAILED)
            else:
                summary_message = '%s  Extra JS files check passed' % (
                    _MESSAGE_TYPE_SUCCESS)
            summary_messages.append(summary_message)
            print summary_message
            print ''

        return summary_messages

    def _check_constants_declaration(self):
        """Checks the declaration of constants in the TS files to ensure that
        the constants are not declared in files other than *.constants.ts and
        that the constants are declared only single time.
        """

        if self.verbose_mode_enabled:
            print 'Starting constants declaration check'
            print '----------------------------------------'

        summary_messages = []
        failed = False

        with _redirect_stdout(_TARGET_STDOUT):
            ts_files_to_check = [
                filepath for filepath in self.all_filepaths if (
                    filepath.endswith('.ts'))]
            constants_to_source_filepaths_dict = {}
            for filepath in ts_files_to_check:
                # Check that the constants are declared only in a *.constants.ts
                # file.
                if not filepath.endswith('.constants.ts'):
                    for line_num, line in enumerate(FileCache.readlines(
                            filepath)):
                        if 'oppia.constant(' in line:
                            failed = True
                            print ('%s --> Constant declaration found at line '
                                   '%s. Please declare the constants in a '
                                   'separate constants file.' % (
                                       filepath, line_num))

                # Check if the constant has multiple declarations which is
                # prohibited.
                parsed_script = self.parsed_js_and_ts_files[filepath]
                parsed_nodes = parsed_script.body
                components_to_check = ['constant']
                for parsed_node in parsed_nodes:
                    expression = _get_expression_from_node_if_one_exists(
                        parsed_node, components_to_check)
                    if not expression:
                        continue
                    else:
                        constant_name = expression.arguments[0].raw
                        if constant_name in constants_to_source_filepaths_dict:
                            failed = True
                            print ('%s --> The constant %s is already declared '
                                   'in %s. Please import the file where the '
                                   'constant is declared or rename the constant'
                                   '.' % (
                                       filepath, constant_name,
                                       constants_to_source_filepaths_dict[
                                           constant_name]))
                        else:
                            constants_to_source_filepaths_dict[
                                constant_name] = filepath


            if failed:
                summary_message = '%s  Constants declaration check failed' % (
                    _MESSAGE_TYPE_FAILED)
            else:
                summary_message = '%s  Constants declaration check passed' % (
                    _MESSAGE_TYPE_SUCCESS)
            summary_messages.append(summary_message)
            print summary_message

        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """

        linter_messages = self._lint_all_files()
        extra_js_files_messages = self._check_extra_js_files()
        js_and_ts_component_messages = (
            self._check_js_and_ts_component_name_and_count())
        directive_scope_messages = self._check_directive_scope()
        mandatory_patterns_messages = self._check_mandatory_patterns()
        sorted_dependencies_messages = (
            self._check_sorted_dependencies())
        controller_dependency_messages = (
            self._match_line_breaks_in_controller_dependencies())
        import_order_messages = self._check_import_order()
        docstring_messages = self._check_docstrings()
        comment_messages = self._check_comments()
        # The html tags and attributes check has an additional
        # debug mode which when enabled prints the tag_stack for each file.
        html_tag_and_attribute_messages = (
            self._check_html_tags_and_attributes())
        html_linter_messages = self._lint_html_files()
        pattern_messages = self._check_bad_patterns()
        codeowner_messages = self._check_codeowner_file()
        constants_messages = self._check_constants_declaration()
        all_messages = (
            extra_js_files_messages + js_and_ts_component_messages +
            directive_scope_messages + sorted_dependencies_messages +
            controller_dependency_messages + import_order_messages +
            mandatory_patterns_messages + docstring_messages +
            comment_messages + html_tag_and_attribute_messages +
            html_linter_messages + linter_messages + pattern_messages +
            codeowner_messages + constants_messages)
        return all_messages


def _print_complete_summary_of_errors():
    """Print complete summary of errors."""
    error_messages = _TARGET_STDOUT.getvalue()
    if error_messages != '':
        print 'Summary of Errors:'
        print '----------------------------------------'
        print error_messages


def main():
    """Main method for pre commit linter script that lints Python, JavaScript,
    HTML, and CSS files.
    """
    parsed_args = _PARSER.parse_args()
    # Default mode is non-verbose mode, if arguments contains --verbose flag it
    # will be made True, which will represent verbose mode.
    verbose_mode_enabled = bool(parsed_args.verbose)
    all_filepaths = _get_all_filepaths(parsed_args.path, parsed_args.files)
    lint_checks_manager = LintChecksManager(all_filepaths, verbose_mode_enabled)
    all_messages = lint_checks_manager.perform_all_lint_checks()
    _print_complete_summary_of_errors()

    if any([message.startswith(_MESSAGE_TYPE_FAILED) for message in
            all_messages]):
        print '---------------------------'
        print 'Checks Not Passed.'
        print '---------------------------'
        sys.exit(1)
    else:
        print '---------------------------'
        print 'All Checks Passed.'
        print '---------------------------'


if __name__ == '__main__':
    main()
