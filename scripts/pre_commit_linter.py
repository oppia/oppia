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

=====================
CUSTOMIZATION OPTIONS
=====================
1.  To lint only files that have been touched in this commit
        python -m scripts.pre_commit_linter

2.  To lint all files in the folder or to lint just a specific file
        python -m scripts.pre_commit_linter --path filepath

3.  To lint a specific list of files (*.js/*.py only). Separate files by spaces
        python -m scripts.pre_commit_linter --files file_1 file_2 ... file_n

4.  To lint files in verbose mode
        python -m scripts.pre_commit_linter --verbose

Note that the root folder MUST be named 'oppia'.
 """
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

# Pylint has issues with the import order of argparse.
# pylint: disable=wrong-import-order
import abc
import argparse
import ast
import collections
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

# Install third party dependencies before proceeding.
from . import install_third_party_libs
install_third_party_libs.main(args=[])

# pylint: disable=wrong-import-position
import python_utils  # isort:skip

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
    '*.png', '*.zip', '*.ico', '*.jpg', '*.min.js', 'backend_prod_files/*',
    'assets/scripts/*', 'core/tests/data/*', 'core/tests/build_sources/*',
    '*.mp3', '*.mp4', 'node_modules/*', 'typings/*', 'local_compiled_js/*',
    'webpack_bundles/*', 'core/tests/services_sources/*',
    'core/tests/release_sources/tmp_unzip.zip',
    'core/tests/release_sources/tmp_unzip.tar.gz')

GENERATED_FILE_PATHS = (
    'extensions/interactions/LogicProof/static/js/generatedDefaultData.ts',
    'extensions/interactions/LogicProof/static/js/generatedParser.ts',
    'core/templates/dev/head/expressions/expression-parser.service.js')

CONFIG_FILE_PATHS = (
    'core/tests/.browserstack.env.example',
    'core/tests/protractor.conf.js',
    'core/tests/karma.conf.ts',
    'core/templates/dev/head/mathjaxConfig.ts',
    'assets/constants.ts',
    'assets/rich_text_components_definitions.ts',
    'webpack.config.ts',
    'webpack.dev.config.ts',
    'webpack.prod.config.ts')

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
        'regexp': re.compile(r'TODO[^\(]*[^\)][^:]*[^\w]*$'),
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
            'core/tests/protractor_desktop/embedding.js'
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
        'excluded_dirs': ('core/tests/')
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
        'excluded_files': ('python_utils.py'),
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
        'excluded_files': ('python_utils.py'),
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
        'excluded_files': ('python_utils.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urlparse'),
        'message': 'Please use python_utils.url_parse().',
        'excluded_files': ('python_utils.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urlunsplit'),
        'message': 'Please use python_utils.url_unsplit().',
        'excluded_files': ('python_utils.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'parse_qs'),
        'message': 'Please use python_utils.parse_query_string().',
        'excluded_files': ('python_utils.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'\Wunquote\('),
        'message': 'Please use python_utils.urllib_unquote().',
        'excluded_files': ('python_utils.py'),
        'excluded_dirs': ()
    },
    {
        'regexp': re.compile(r'urljoin'),
        'message': 'Please use python_utils.url_join().',
        'excluded_files': ('python_utils.py'),
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
        'excluded_files': ('python_utils.py'),
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
        'excluded_files': ('python_utils.py'),
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

REQUIRED_STRINGS_CONSTANTS = {
    'DEV_MODE: true': {
        'message': 'Please set the DEV_MODE variable in constants.ts'
                   'to true before committing.',
        'excluded_files': ()
    }
}

ALLOWED_TERMINATING_PUNCTUATIONS = ['.', '?', '}', ']', ')']

CODEOWNER_FILEPATH = '.github/CODEOWNERS'

# This list needs to be in sync with the important patterns in the CODEOWNERS
# file.
CODEOWNER_IMPORTANT_PATHS = [
    '/core/controllers/acl_decorators*.py',
    '/core/controllers/base*.py',
    '/core/domain/html*.py',
    '/core/domain/rights_manager*.py',
    '/core/domain/role_services*.py',
    '/core/domain/user*.py',
    '/core/storage/',
    '/export/',
    '/manifest.json',
    '/package.json',
    '/yarn.lock',
    '/scripts/install_third_party_libs.py',
    '/.github/']

# NOTE TO DEVELOPERS: This should match the version of Node used in common.py.
NODE_DIR = os.path.abspath(
    os.path.join(os.getcwd(), os.pardir, 'oppia_tools', 'node-10.18.0'))

if not os.getcwd().endswith('oppia'):
    python_utils.PRINT('')
    python_utils.PRINT(
        'ERROR    Please run this script from the oppia root directory.')

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.9.4')
if not os.path.exists(_PYLINT_PATH):
    python_utils.PRINT('')
    python_utils.PRINT(
        'ERROR  Please run install_third_party_libs.py first to install pylint')
    python_utils.PRINT('         and its dependencies.')
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
    os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-quotes-0.1.8'),
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
from . import build  # isort:skip
from . import docstrings_checker  # isort:skip
import html.parser  # isort:skip
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

_MESSAGE_TYPE_SUCCESS = 'SUCCESS'
_MESSAGE_TYPE_FAILED = 'FAILED'
_TARGET_STDOUT = python_utils.string_io()
_STDOUT_LIST = multiprocessing.Manager().list()
_FILES = multiprocessing.Manager().dict()


class FileCache(python_utils.OBJECT):
    """Provides thread-safe access to cached file content."""

    def __init__(self):
        self._CACHE_DATA_DICT = {}

    def read(self, filepath, mode='r'):
        """Returns the data read from the file in unicode form.

        Args:
            filepath: str. The file path from which data is to be read.
            mode: str. The mode in which the file is to be opened.

        Returns:
            str. The data read from the file.
        """
        return self._get_data(filepath, mode)[0]

    def readlines(self, filepath, mode='r'):
        """Returns the tuple containing data line by line as read from the
        file in unicode form.

        Args:
            filepath: str. The file path from which data is to be read.
            mode: str. The mode in which the file is to be opened.

        Returns:
            tuple(str). The tuple containing data line by line as read from the
                file.
        """
        return self._get_data(filepath, mode)[1]

    def _get_data(self, filepath, mode):
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
        if key not in self._CACHE_DATA_DICT:
            with python_utils.open_file(filepath, mode) as f:
                lines = f.readlines()
                self._CACHE_DATA_DICT[key] = (''.join(lines), tuple(lines))
        return self._CACHE_DATA_DICT[key]


def _lint_all_files(
        js_filepaths, ts_filepaths, py_filepaths, html_filepaths,
        css_filepaths, verbose_mode_enabled):
    """This function is used to check if node-eslint dependencies are
    installed and pass ESLint binary path and lint all the files(JS, Python,
    HTML, CSS) with their respective third party linters.

    Args:
        js_filepaths: list(str). The list of js filepaths to be linted.
        ts_filepaths: list(str). The list of ts filepaths to be linted.
        py_filepaths: list(str). The list of python filepaths to be linted.
        html_filepaths: list(str). The list of HTML filepaths to be linted.
        css_filepaths: list(str). The list of CSS filepaths to be linted.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        linting_processes: list(multiprocessing.Process). A list of linting
        processes.
        result_queues: list(multiprocessing.Queue). A list of queues to put
        results of tests.
        stdout_queus: list(multiprocessing.Queue). A list of queues to store
        Stylelint outputs.
    """

    python_utils.PRINT('Starting Js, Ts, Python, HTML, and CSS linter...')

    pylintrc_path = os.path.join(os.getcwd(), '.pylintrc')

    config_pylint = '--rcfile=%s' % pylintrc_path

    config_pycodestyle = os.path.join(os.getcwd(), 'tox.ini')

    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

    node_path = os.path.join(NODE_DIR, 'bin', 'node')
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
        python_utils.PRINT('')
        python_utils.PRINT(
            'ERROR    Please run start.sh first to install node-eslint ')
        python_utils.PRINT(
            '         or node-stylelint and its dependencies.')
        sys.exit(1)

    js_and_ts_files_to_lint = js_filepaths + ts_filepaths

    linting_processes = []

    js_and_ts_result = multiprocessing.Queue()

    linting_processes.append(multiprocessing.Process(
        target=_lint_js_and_ts_files, args=(
            node_path, eslint_path, js_and_ts_files_to_lint,
            js_and_ts_result, verbose_mode_enabled)))

    css_in_html_result = multiprocessing.Queue()
    css_in_html_stdout = multiprocessing.Queue()

    linting_processes.append(multiprocessing.Process(
        target=_lint_css_files, args=(
            node_path,
            stylelint_path,
            config_path_for_css_in_html,
            html_filepaths, css_in_html_stdout,
            css_in_html_result, verbose_mode_enabled)))

    css_result = multiprocessing.Queue()
    css_stdout = multiprocessing.Queue()

    linting_processes.append(multiprocessing.Process(
        target=_lint_css_files, args=(
            node_path,
            stylelint_path,
            config_path_for_oppia_css,
            css_filepaths, css_stdout,
            css_result, verbose_mode_enabled)))

    py_result = multiprocessing.Queue()

    linting_processes.append(multiprocessing.Process(
        target=_lint_py_files,
        args=(
            config_pylint, config_pycodestyle, py_filepaths,
            py_result, verbose_mode_enabled)))

    py_result_for_python3_compatibility = multiprocessing.Queue()

    linting_processes.append(multiprocessing.Process(
        target=_lint_py_files_for_python3_compatibility,
        args=(
            py_filepaths, py_result_for_python3_compatibility,
            verbose_mode_enabled)))

    for process in linting_processes:
        process.daemon = False
        process.start()

    result_queues = [
        js_and_ts_result, css_in_html_result, css_result, py_result,
        py_result_for_python3_compatibility
    ]

    stdout_queus = [
        css_in_html_stdout, css_stdout
    ]
    return linting_processes, result_queues, stdout_queus


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
    all_changed_filepaths = unstaged_files + staged_files
    return [filepath for filepath in all_changed_filepaths]


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
            python_utils.PRINT(
                'Could not locate file or directory %s. Exiting.' % input_path)
            python_utils.PRINT('----------------------------------------')
            sys.exit(1)
        if os.path.isfile(input_path):
            all_filepaths = [input_path]
        else:
            excluded_glob_patterns = FILE_CACHE.readlines(eslintignore_path)
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
            python_utils.PRINT(
                'The following file(s) do not exist: %s\n'
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
            if regexp.search(line):
                python_utils.PRINT('%s --> Line %s: %s' % (
                    filepath, line_num, pattern['message']))
                python_utils.PRINT('')
                bad_pattern_count += 1
        if bad_pattern_count:
            return True
    return False


def _check_file_type_specific_bad_pattern(filepath, content):
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
            if _check_bad_pattern_in_file(filepath, content, regexp):
                failed = True
                total_error_count += 1
    return failed, total_error_count


class TagMismatchException(Exception):
    """Error class for mismatch between start and end tags."""
    pass


class CustomHTMLParser(html.parser.HTMLParser):
    """Custom HTML parser to check indentation."""

    def __init__(self, filepath, file_lines, debug, failed=False):
        """Define various variables to parse HTML.

        Args:
            filepath: str. path of the file.
            file_lines: list(str). list of the lines in the file.
            debug: bool. if true prints tag_stack for the file.
            failed: bool. true if the HTML indentation check fails.
        """
        html.parser.HTMLParser.__init__(self)
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
        """Handle start tag of a HTML line.

        Args:
            tag: str. start tag of a HTML line.
            attrs: list(str). list of attributes in the start tag.
        """
        line_number, column_number = self.getpos()
        # Check the indentation of the tag.
        expected_indentation = self.indentation_level * self.indentation_width
        tag_line = self.file_lines[line_number - 1].lstrip()
        opening_tag = '<' + tag

        # Check the indentation for content of style tag.
        if tag_line.startswith(opening_tag) and tag == 'style':
            # Getting next line after style tag.
            next_line = self.file_lines[line_number]
            next_line_expected_indentation = (
                self.indentation_level + 1) * self.indentation_width
            next_line_column_number = len(next_line) - len(next_line.lstrip())

            if next_line_column_number != next_line_expected_indentation:
                python_utils.PRINT(
                    '%s --> Expected indentation '
                    'of %s, found indentation of %s '
                    'for content of %s tag on line %s ' % (
                        self.filepath, next_line_expected_indentation,
                        next_line_column_number, tag, line_number + 1))
                python_utils.PRINT('')
                self.failed = True

        if tag_line.startswith(opening_tag) and (
                column_number != expected_indentation):
            python_utils.PRINT(
                '%s --> Expected indentation '
                'of %s, found indentation of %s '
                'for %s tag on line %s ' % (
                    self.filepath, expected_indentation,
                    column_number, tag, line_number))
            python_utils.PRINT('')
            self.failed = True

        if tag not in self.void_elements:
            self.tag_stack.append((tag, line_number, column_number))
            self.indentation_level += 1

        if self.debug:
            python_utils.PRINT('DEBUG MODE: Start tag_stack')
            python_utils.PRINT(self.tag_stack)

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
                    python_utils.PRINT(
                        '%s --> The value %s of attribute '
                        '%s for the tag %s on line %s should '
                        'be enclosed within double quotes.' % (
                            self.filepath, value, attr,
                            tag, line_number))
                    python_utils.PRINT('')

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
                python_utils.PRINT(
                    '%s --> Attribute for tag %s on line '
                    '%s should align with the leftmost '
                    'attribute on line %s ' % (
                        self.filepath, tag,
                        line_num_of_error, line_number))
                python_utils.PRINT('')
                self.failed = True

    def handle_endtag(self, tag):
        """Handle end tag of a HTML line.

        Args:
            tag: str. end tag of a HTML line.
        """
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
            python_utils.PRINT(
                '%s --> Indentation for end tag %s on line '
                '%s does not match the indentation of the '
                'start tag %s on line %s ' % (
                    self.filepath, tag, line_number,
                    last_starttag, last_starttag_line_num))
            python_utils.PRINT('')
            self.failed = True

        self.indentation_level -= 1

        if self.debug:
            python_utils.PRINT('DEBUG MODE: End tag_stack')
            python_utils.PRINT(self.tag_stack)

    def handle_data(self, data):
        """Handle indentation level.

        Args:
            data: str. contents of HTML file to be parsed.
        """
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


def check_for_important_patterns_at_bottom_of_codeowners(important_patterns):
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
        python_utils.PRINT(
            '%s --> Duplicate pattern(s) found in critical rules'
            ' section.' % CODEOWNER_FILEPATH)
        failed = True
    if len(codeowner_important_paths_set) != len(CODEOWNER_IMPORTANT_PATHS):
        python_utils.PRINT(
            'scripts/pre_commit_linter.py --> Duplicate pattern(s) found '
            'in CODEOWNER_IMPORTANT_PATHS list.')
        failed = True

    # Check missing rules by set difference operation.
    critical_rule_section_minus_list_set = (
        important_patterns_set.difference(codeowner_important_paths_set))
    list_minus_critical_rule_section_set = (
        codeowner_important_paths_set.difference(important_patterns_set))
    for rule in critical_rule_section_minus_list_set:
        python_utils.PRINT(
            '%s --> Rule %s is not present in the '
            'CODEOWNER_IMPORTANT_PATHS list in '
            'scripts/pre_commit_linter.py. Please add this rule in the '
            'mentioned list or remove this rule from the \'Critical files'
            '\' section.' % (CODEOWNER_FILEPATH, rule))
        failed = True
    for rule in list_minus_critical_rule_section_set:
        python_utils.PRINT(
            '%s --> Rule \'%s\' is not present in the \'Critical files\' '
            'section. Please place it under the \'Critical files\' '
            'section since it is an important rule. Alternatively please '
            'remove it from the \'CODEOWNER_IMPORTANT_PATHS\' list in '
            'scripts/pre_commit_linter.py if it is no longer an '
            'important rule.' % (CODEOWNER_FILEPATH, rule))
        failed = True

    return failed


def _check_codeowner_file(verbose_mode_enabled):
    """Checks the CODEOWNERS file for any uncovered dirs/files and also
    checks that every pattern in the CODEOWNERS file matches at least one
    file/dir. Note that this checks the CODEOWNERS file according to the
    glob patterns supported by Python2.7 environment. For more information
    please refer https://docs.python.org/2/library/glob.html.
    This function also ensures that the most important rules are at the
    bottom of the CODEOWNERS file.
    """
    if verbose_mode_enabled:
        python_utils.PRINT('Starting CODEOWNERS file check')
        python_utils.PRINT('----------------------------------------')

    with _redirect_stdout(_TARGET_STDOUT):
        failed = False
        summary_messages = []
        # Checks whether every pattern in the CODEOWNERS file matches at
        # least one dir/file.
        critical_file_section_found = False
        important_rules_in_critical_section = []
        file_patterns = []
        dir_patterns = []
        for line_num, line in enumerate(FILE_CACHE.readlines(
                CODEOWNER_FILEPATH)):
            stripped_line = line.strip()
            if '# Critical files' in line:
                critical_file_section_found = True
            if stripped_line and stripped_line[0] != '#':
                if '@' not in line:
                    python_utils.PRINT(
                        '%s --> Pattern on line %s doesn\'t have '
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
                        python_utils.PRINT(
                            '%s --> Pattern on line %s is invalid. Use '
                            'full path relative to the root directory'
                            % (CODEOWNER_FILEPATH, line_num + 1))
                        failed = True

                    # The double asterisks pattern is supported by the
                    # CODEOWNERS syntax but not the glob in Python 2.
                    # The following condition checks this.
                    if '**' in line_in_concern:
                        python_utils.PRINT(
                            '%s --> Pattern on line %s is invalid. '
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
                        python_utils.PRINT(
                            '%s --> Pattern on line %s doesn\'t match '
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
                    python_utils.PRINT(
                        '%s is not listed in the .github/CODEOWNERS file.' % (
                            file_path))
                    failed = True

        failed = failed or (
            check_for_important_patterns_at_bottom_of_codeowners(
                important_rules_in_critical_section))

        if failed:
            summary_message = (
                '%s   CODEOWNERS file coverage check failed, see messages '
                'above for files that need to be added or patterns that need '
                'to be fixed.' % _MESSAGE_TYPE_FAILED)
        else:
            summary_message = '%s  CODEOWNERS file coverage check passed' % (
                _MESSAGE_TYPE_SUCCESS)

        summary_messages.append(summary_message)
        python_utils.PRINT(summary_message)
        python_utils.PRINT('')

    return summary_messages


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
        python_utils.PRINT('There are no CSS files to lint.')
        return

    python_utils.PRINT('Total css files: ', num_css_files)
    stylelint_cmd_args = [
        node_path, stylelint_path, '--config=' + config_path]
    result_list = []
    if not verbose_mode_enabled:
        python_utils.PRINT('Linting CSS files.')
    for _, filepath in enumerate(files_to_lint):
        if verbose_mode_enabled:
            python_utils.PRINT('Linting: ', filepath)
        proc_args = stylelint_cmd_args + [filepath]
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        encoded_linter_stdout, encoded_linter_stderr = proc.communicate()
        linter_stdout = encoded_linter_stdout.decode(encoding='utf-8')
        linter_stderr = encoded_linter_stderr.decode(encoding='utf-8')
        if linter_stderr:
            python_utils.PRINT('LINTER FAILED')
            python_utils.PRINT(linter_stderr)
            sys.exit(1)

        if linter_stdout:
            num_files_with_errors += 1
            result_list.append(linter_stdout)
            python_utils.PRINT(linter_stdout)
            stdout.put(linter_stdout)

    if num_files_with_errors:
        for error in result_list:
            result.put(error)
        result.put('%s    %s CSS file' % (
            _MESSAGE_TYPE_FAILED, num_files_with_errors))
    else:
        result.put('%s   %s CSS file linted (%.1f secs)' % (
            _MESSAGE_TYPE_SUCCESS, num_css_files, time.time() - start_time))

    python_utils.PRINT('CSS linting finished.')


def _lint_js_and_ts_files(
        node_path, eslint_path, files_to_lint, result, verbose_mode_enabled):
    """Prints a list of lint errors in the given list of JavaScript files.

    Args:
        node_path: str. Path to the node binary.
        eslint_path: str. Path to the ESLint binary.
        files_to_lint: list(str). A list of filepaths to lint.
        result: multiprocessing.Queue. A queue to put results of test.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    start_time = time.time()
    num_files_with_errors = 0

    num_js_and_ts_files = len(files_to_lint)
    if not files_to_lint:
        result.put('')
        python_utils.PRINT(
            'There are no JavaScript or Typescript files to lint.')
        return

    python_utils.PRINT('Total js and ts files: ', num_js_and_ts_files)
    eslint_cmd_args = [node_path, eslint_path, '--quiet']
    result_list = []
    python_utils.PRINT('Linting JS and TS files.')
    for _, filepath in enumerate(files_to_lint):
        if verbose_mode_enabled:
            python_utils.PRINT('Linting: ', filepath)
        proc_args = eslint_cmd_args + [filepath]
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        encoded_linter_stdout, encoded_linter_stderr = proc.communicate()
        linter_stdout = encoded_linter_stdout.decode(encoding='utf-8')
        linter_stderr = encoded_linter_stderr.decode(encoding='utf-8')
        if linter_stderr:
            python_utils.PRINT('LINTER FAILED')
            python_utils.PRINT(linter_stderr)
            sys.exit(1)

        if linter_stdout:
            num_files_with_errors += 1
            result_list.append(linter_stdout)

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

    python_utils.PRINT('Js and Ts linting finished.')


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
        python_utils.PRINT('There are no Python files to lint.')
        return

    python_utils.PRINT('Linting %s Python files' % num_py_files)

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
            python_utils.PRINT('Linting Python files %s to %s...' % (
                current_batch_start_index + 1, current_batch_end_index))

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

    python_utils.PRINT('Python linting finished.')


def _lint_py_files_for_python3_compatibility(
        files_to_lint, result, verbose_mode_enabled):
    """Prints a list of Python 3 compatibility errors in the given list of
    Python files.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.
        result: multiprocessing.Queue. A queue to put results of test.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    start_time = time.time()
    any_errors = False

    files_to_lint_for_python3_compatibility = [
        file_name for file_name in files_to_lint if not re.match(
            r'^.*python_utils.*\.py$', file_name)]
    num_py_files = len(files_to_lint_for_python3_compatibility)
    if not files_to_lint_for_python3_compatibility:
        result.put('')
        python_utils.PRINT(
            'There are no Python files to lint for Python 3 compatibility.')
        return

    python_utils.PRINT(
        'Linting %s Python files for Python 3 compatibility.' % num_py_files)

    _batch_size = 50
    current_batch_start_index = 0

    while current_batch_start_index < len(
            files_to_lint_for_python3_compatibility):
        # Note that this index is an exclusive upper bound -- i.e., the current
        # batch of files ranges from 'start_index' to 'end_index - 1'.
        current_batch_end_index = min(
            current_batch_start_index + _batch_size, len(
                files_to_lint_for_python3_compatibility))
        current_files_to_lint = files_to_lint_for_python3_compatibility[
            current_batch_start_index: current_batch_end_index]
        if verbose_mode_enabled:
            python_utils.PRINT(
                'Linting Python files for Python 3 compatibility %s to %s...'
                % (current_batch_start_index + 1, current_batch_end_index))

        with _redirect_stdout(_TARGET_STDOUT):
            # This line invokes Pylint and prints its output
            # to the target stdout.
            python_utils.PRINT('Messages for Python 3 support:')
            pylinter_for_python3 = lint.Run(
                current_files_to_lint + ['--py3k'], exit=False).linter

        if pylinter_for_python3.msg_status != 0:
            result.put(_TARGET_STDOUT.getvalue())
            any_errors = True

        current_batch_start_index = current_batch_end_index

    if any_errors:
        result.put(
            '%s    Python linting for Python 3 compatibility failed'
            % _MESSAGE_TYPE_FAILED)
    else:
        result.put(
            '%s   %s Python files linted for Python 3 compatibility (%.1f secs)'
            % (_MESSAGE_TYPE_SUCCESS, num_py_files, time.time() - start_time))

    python_utils.PRINT('Python linting for Python 3 compatibility finished.')


def _check_codeowner_file(verbose_mode_enabled):
    """Checks the CODEOWNERS file for any uncovered dirs/files and also
    checks that every pattern in the CODEOWNERS file matches at least one
    file/dir. Note that this checks the CODEOWNERS file according to the
    glob patterns supported by Python2.7 environment. For more information
    please refer https://docs.python.org/2/library/glob.html.
    This function also ensures that the most important rules are at the
    bottom of the CODEOWNERS file.
    """
    if verbose_mode_enabled:
        python_utils.PRINT('Starting CODEOWNERS file check')
        python_utils.PRINT('----------------------------------------')

    with _redirect_stdout(_TARGET_STDOUT):
        failed = False
        summary_messages = []
        # Checks whether every pattern in the CODEOWNERS file matches at
        # least one dir/file.
        critical_file_section_found = False
        important_rules_in_critical_section = []
        file_patterns = []
        dir_patterns = []
        for line_num, line in enumerate(FILE_CACHE.readlines(
                CODEOWNER_FILEPATH)):
            stripped_line = line.strip()
            if '# Critical files' in line:
                critical_file_section_found = True
            if stripped_line and stripped_line[0] != '#':
                if '@' not in line:
                    python_utils.PRINT(
                        '%s --> Pattern on line %s doesn\'t have '
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
                        python_utils.PRINT(
                            '%s --> Pattern on line %s is invalid. Use '
                            'full path relative to the root directory'
                            % (CODEOWNER_FILEPATH, line_num + 1))
                        failed = True

                    # The double asterisks pattern is supported by the
                    # CODEOWNERS syntax but not the glob in Python 2.
                    # The following condition checks this.
                    if '**' in line_in_concern:
                        python_utils.PRINT(
                            '%s --> Pattern on line %s is invalid. '
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
                        python_utils.PRINT(
                            '%s --> Pattern on line %s doesn\'t match '
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
                    python_utils.PRINT(
                        '%s is not listed in the .github/CODEOWNERS file.' % (
                            file_path))
                    failed = True

        failed = failed or (
            check_for_important_patterns_at_bottom_of_codeowners(
                important_rules_in_critical_section))

        if failed:
            summary_message = (
                '%s   CODEOWNERS file coverage check failed, see messages '
                'above for files that need to be added or patterns that need '
                'to be fixed.' % _MESSAGE_TYPE_FAILED)
        else:
            summary_message = '%s  CODEOWNERS file check passed' % (
                _MESSAGE_TYPE_SUCCESS)

        summary_messages.append(summary_message)
        python_utils.PRINT(summary_message)
        python_utils.PRINT('')

    return summary_messages


class LintChecksManager( # pylint: disable=inherit-non-class
        python_utils.with_metaclass(abc.ABCMeta, python_utils.OBJECT)):
    """Manages all the common linting functions. As an abstract base class, this
    is not intended to be used directly.

    Attributes:
        all_filepaths: list(str). The list of filepaths to be linted.
        parsed_js_files: dict. Contains the content of JS files, after
            validating and parsing the files.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """

    def __init__(self, verbose_mode_enabled=False): # pylint: disable=super-init-not-called
        """Constructs a LintChecksManager object.

        Args:
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        # Set path for node.
        # The path for node is set explicitly, since otherwise the lint
        # tests fail on CircleCI due to the TypeScript files not being
        # compilable.
        os.environ['PATH'] = '%s/bin:' % NODE_DIR + os.environ['PATH']

        self.verbose_mode_enabled = verbose_mode_enabled
        self.process_manager = multiprocessing.Manager().dict()

    @abc.abstractproperty
    def all_filepaths(self):
        """Returns all file paths."""
        pass

    def _run_multiple_checks(self, *checks):
        """Run multiple checks in parallel."""
        processes = []
        for check in checks:
            p = multiprocessing.Process(target=check)
            processes.append(p)
            p.start()

        for p in processes:
            p.join()

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
        stdout = python_utils.string_io()
        with _redirect_stdout(stdout):
            sets_of_patterns_to_match = [
                MANDATORY_PATTERNS_REGEXP, MANDATORY_PATTERNS_JS_REGEXP]
            for filepath in self.all_filepaths:
                for pattern_list in sets_of_patterns_to_match:
                    failed = self._check_for_mandatory_pattern_in_file(
                        pattern_list, filepath, failed)

            if failed:
                summary_message = (
                    '%s  Mandatory pattern check failed, see errors above for'
                    'patterns that should be added.' % _MESSAGE_TYPE_FAILED)
            else:
                summary_message = (
                    '%s  Mandatory pattern check passed' % (
                        _MESSAGE_TYPE_SUCCESS))
            python_utils.PRINT(summary_message)

        python_utils.PRINT('')

        summary_messages.append(summary_message)
        self.process_manager['mandatory'] = summary_messages
        _STDOUT_LIST.append(stdout)

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
                filepath.endswith('pre_commit_linter.py') or
                any(
                    fnmatch.fnmatch(filepath, pattern)
                    for pattern in EXCLUDED_PATHS)
                )]
        failed = False
        stdout = python_utils.string_io()
        with _redirect_stdout(stdout):
            for filepath in all_filepaths:
                file_content = FILE_CACHE.read(filepath)
                total_files_checked += 1
                for pattern in BAD_PATTERNS:
                    if (pattern in file_content and
                            not _is_filepath_excluded_for_bad_patterns_check(
                                pattern, filepath)):
                        failed = True
                        python_utils.PRINT('%s --> %s' % (
                            filepath, BAD_PATTERNS[pattern]['message']))
                        python_utils.PRINT('')
                        total_error_count += 1

                for regexp in BAD_PATTERNS_REGEXP:
                    if _check_bad_pattern_in_file(
                            filepath, file_content, regexp):
                        failed = True
                        total_error_count += 1

                temp_failed, temp_count = _check_file_type_specific_bad_pattern(
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
                        _MESSAGE_TYPE_FAILED))
                summary_messages.append(summary_message)
            else:
                summary_message = '%s Pattern checks passed' % (
                    _MESSAGE_TYPE_SUCCESS)
                summary_messages.append(summary_message)

            python_utils.PRINT('')
            if total_files_checked == 0:
                python_utils.PRINT('There are no files to be checked.')
            else:
                python_utils.PRINT('(%s files checked, %s errors found)' % (
                    total_files_checked, total_error_count))
                python_utils.PRINT(summary_message)
        self.process_manager['bad_pattern'] = summary_messages
        _STDOUT_LIST.append(stdout)

    def _check_patterns(self):
        """Run checks relate to bad patterns."""
        methods = [self._check_bad_patterns, self._check_mandatory_patterns]
        self._run_multiple_checks(*methods)

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        self._check_patterns()
        mandatory_patterns_messages = self.process_manager['mandatory']
        pattern_messages = self.process_manager['bad_pattern']

        return (
            mandatory_patterns_messages + pattern_messages)


class JsTsLintChecksManager(LintChecksManager):
    """Manages all the Js and Ts linting functions.

    Attributes:
        all_filepaths: list(str). The list of filepaths to be linted.
        js_filepaths: list(str): The list of js filepaths to be linted.
        ts_filepaths: list(str): The list of ts filepaths to be linted.
        parsed_js_and_ts_files: dict. Contains the content of JS files, after
            validating and parsing the files.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(self, verbose_mode_enabled=False):
        """Constructs a JsTsLintChecksManager object.

        Args:
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        os.environ['PATH'] = '%s/bin:' % NODE_DIR + os.environ['PATH']

        super(JsTsLintChecksManager, self).__init__(
            verbose_mode_enabled=verbose_mode_enabled)
        self.parsed_js_and_ts_files = []
        self.parsed_expressions_in_files = []

    @property
    def js_filepaths(self):
        """Return all js filepaths."""
        return _FILES['.js']

    @property
    def ts_filepaths(self):
        """Return all ts filepaths."""
        return _FILES['.ts']

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.js_filepaths + self.ts_filepaths

    def _validate_and_parse_js_and_ts_files(self):
        """This function validates JavaScript and Typescript files and
        returns the parsed contents as a Python dictionary.

        Returns:
            dict. contains the contents of js and ts files after
            validating and parsing the files.
        """

        # Select JS files which need to be checked.
        files_to_check = [
            filepath for filepath in self.all_filepaths if
            not any(fnmatch.fnmatch(filepath, pattern) for pattern in
                    EXCLUDED_PATHS)]
        parsed_js_and_ts_files = dict()
        if not files_to_check:
            return parsed_js_and_ts_files
        compiled_js_dir = tempfile.mkdtemp(
            dir=os.getcwd(), prefix='tmpcompiledjs')
        if not self.verbose_mode_enabled:
            python_utils.PRINT('Validating and parsing JS and TS files ...')
        for filepath in files_to_check:
            if self.verbose_mode_enabled:
                python_utils.PRINT(
                    'Validating and parsing %s file ...' % filepath)
            file_content = FILE_CACHE.read(filepath)

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
                    file_content = FILE_CACHE.read(compiled_js_filepath)
                    parsed_js_and_ts_files[filepath] = esprima.parseScript(
                        file_content)
                except Exception as e:
                    shutil.rmtree(compiled_js_dir)
                    raise Exception(e)

        shutil.rmtree(compiled_js_dir)

        return parsed_js_and_ts_files

    def _get_expressions_from_parsed_script(self):
        """This function returns the expressions in the script parsed using
        js and ts files.

        Returns:
            dict. contains the expressions in the script parsed using js
            and ts files.
        """

        parsed_expressions_in_files = collections.defaultdict(dict)
        components_to_check = ['controller', 'directive', 'factory', 'filter']

        for filepath, parsed_script in self.parsed_js_and_ts_files.items():
            parsed_expressions_in_files[filepath] = collections.defaultdict(
                list)
            parsed_nodes = parsed_script.body
            for parsed_node in parsed_nodes:
                for component in components_to_check:
                    expression = _get_expression_from_node_if_one_exists(
                        parsed_node, [component])
                    parsed_expressions_in_files[filepath][component].append(
                        expression)

        return parsed_expressions_in_files

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

    def _check_extra_js_files(self):
        """Checks if the changes made include extra js files in core
        or extensions folder which are not specified in
        build.JS_FILEPATHS_NOT_TO_BUILD.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting extra js files check')
            python_utils.PRINT('----------------------------------------')

        summary_messages = []
        failed = False
        stdout = python_utils.string_io()
        with _redirect_stdout(stdout):
            js_files_to_check = self.js_filepaths

            for filepath in js_files_to_check:
                if filepath.startswith(('core/templates', 'extensions')) and (
                        filepath not in build.JS_FILEPATHS_NOT_TO_BUILD) and (
                            not filepath.endswith('protractor.js')):
                    python_utils.PRINT(
                        '%s  --> Found extra .js file\n' % filepath)
                    failed = True

            if failed:
                err_msg = (
                    'If you want the above files to be present as js files, '
                    'add them to the list JS_FILEPATHS_NOT_TO_BUILD in '
                    'build.py. Otherwise, rename them to .ts\n')
                python_utils.PRINT(err_msg)

            if failed:
                summary_message = (
                    '%s  Extra JS files check failed, see '
                    'message above on resolution steps.' % (
                        _MESSAGE_TYPE_FAILED))
            else:
                summary_message = '%s  Extra JS files check passed' % (
                    _MESSAGE_TYPE_SUCCESS)
            summary_messages.append(summary_message)
            python_utils.PRINT(summary_message)
            python_utils.PRINT('')
        self.process_manager['extra'] = summary_messages
        _STDOUT_LIST.append(stdout)

    def _check_js_and_ts_component_name_and_count(self):
        """This function ensures that all JS/TS files have exactly
        one component and and that the name of the component
        matches the filename.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting js component name and count check')
            python_utils.PRINT('----------------------------------------')
        # Select JS files which need to be checked.
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS)
            and (not filepath.endswith('App.ts'))]
        failed = False
        summary_messages = []
        components_to_check = ['controller', 'directive', 'factory', 'filter']
        stdout = python_utils.string_io()
        for filepath in files_to_check:
            component_num = 0
            parsed_expressions = self.parsed_expressions_in_files[filepath]
            with _redirect_stdout(stdout):
                for component in components_to_check:
                    if component_num > 1:
                        break
                    for expression in parsed_expressions[component]:
                        if not expression:
                            continue
                        component_num += 1
                        # Check if the number of components in each file exceeds
                        # one.
                        if component_num > 1:
                            python_utils.PRINT(
                                '%s -> Please ensure that there is exactly one '
                                'component in the file.' % (filepath))
                            failed = True
                            break

        with _redirect_stdout(stdout):
            if failed:
                summary_message = (
                    '%s  JS and TS Component name and count check failed, '
                    'see messages above for duplicate names.' % (
                        _MESSAGE_TYPE_FAILED))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s  JS and TS Component name and count check passed' %
                    (_MESSAGE_TYPE_SUCCESS))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)

            python_utils.PRINT('')
            self.process_manager['component'] = summary_messages
            _STDOUT_LIST.append(stdout)

    def _check_directive_scope(self):
        """This function checks that all directives have an explicit
        scope: {} and it should not be scope: true.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting directive scope check')
            python_utils.PRINT('----------------------------------------')
        # Select JS and TS files which need to be checked.
        files_to_check = [
            filepath for filepath in self.all_filepaths if
            not any(fnmatch.fnmatch(filepath, pattern) for pattern in
                    EXCLUDED_PATHS)]
        failed = False
        summary_messages = []
        components_to_check = ['directive']

        stdout = python_utils.string_io()
        for filepath in files_to_check:
            parsed_expressions = self.parsed_expressions_in_files[filepath]
            with _redirect_stdout(stdout):
                # Parse the body of the content as nodes.
                for component in components_to_check:
                    for expression in parsed_expressions[component]:
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
                                # Further separate the body elements from the
                                # body.
                                body_elements = body.body
                                for body_element in body_elements:
                                    # Check if the body element is a return
                                    # statement.
                                    body_element_type_is_not_return = (
                                        body_element.type != 'ReturnStatement')
                                    body_element_arg_type_is_not_object = (
                                        body_element.argument.type != (
                                            'ObjectExpression'))
                                    if (
                                            body_element_arg_type_is_not_object
                                            or (
                                                body_element_type_is_not_return
                                                )):
                                        continue
                                    # Separate the properties of the return
                                    # node.
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
                                                property_key_is_an_identifier
                                                and (
                                                    property_key_name_is_scope
                                                    )):
                                            # Separate the scope value and
                                            # check if it is an Object
                                            # Expression. If it is not, then
                                            # check for scope: true and report
                                            # the error message.
                                            scope_value = (
                                                return_node_property.value)
                                            if (
                                                    scope_value.type == (
                                                        'Literal')
                                                    and (
                                                        scope_value.value)):
                                                failed = True
                                                python_utils.PRINT(
                                                    'Please ensure that %s '
                                                    'directive in %s file '
                                                    'does not have scope set '
                                                    'to true.' %
                                                    (directive_name, filepath))
                                                python_utils.PRINT('')
                                            elif scope_value.type != (
                                                    'ObjectExpression'):
                                                # Check whether the directive
                                                # has scope: {} else report
                                                # the error message.
                                                failed = True
                                                python_utils.PRINT(
                                                    'Please ensure that %s '
                                                    'directive in %s file has '
                                                    'a scope: {}.' % (
                                                        directive_name, filepath
                                                        ))
                                                python_utils.PRINT('')

        with _redirect_stdout(stdout):
            if failed:
                summary_message = (
                    '%s   Directive scope check failed, '
                    'see messages above for suggested fixes.' % (
                        _MESSAGE_TYPE_FAILED))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = '%s  Directive scope check passed' % (
                    _MESSAGE_TYPE_SUCCESS)
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)

            python_utils.PRINT('')
            self.process_manager['directive'] = summary_messages
            _STDOUT_LIST.append(stdout)

    def _check_sorted_dependencies(self):
        """This function checks that the dependencies which are
        imported in the controllers/directives/factories in JS
        files are in following pattern: dollar imports, regular
        imports, and constant imports, all in sorted order.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting sorted dependencies check')
            python_utils.PRINT('----------------------------------------')
        files_to_check = [
            filepath for filepath in self.all_filepaths if
            not any(fnmatch.fnmatch(filepath, pattern) for pattern in
                    EXCLUDED_PATHS)]
        components_to_check = ['controller', 'directive', 'factory']
        failed = False
        summary_messages = []

        stdout = python_utils.string_io()
        for filepath in files_to_check:
            parsed_expressions = self.parsed_expressions_in_files[filepath]
            with _redirect_stdout(stdout):
                for component in components_to_check:
                    for expression in parsed_expressions[component]:
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
                                dollar_imports + regular_imports + (
                                    constant_imports))
                            if sorted_imports != function_args:
                                failed = True
                                python_utils.PRINT(
                                    'Please ensure that in %s in file %s, the '
                                    'injected dependencies should be in the '
                                    'following manner: dollar imports, regular '
                                    'imports and constant imports, all in '
                                    'sorted order.'
                                    % (property_value, filepath))
                            if sorted_imports != literal_args:
                                failed = True
                                python_utils.PRINT(
                                    'Please ensure that in %s in file %s, the '
                                    'stringfied dependencies should be in the '
                                    'following manner: dollar imports, regular '
                                    'imports and constant imports, all in '
                                    'sorted order.'
                                    % (property_value, filepath))
        with _redirect_stdout(stdout):
            if failed:
                summary_message = (
                    '%s  Sorted dependencies check failed, fix files that '
                    'that don\'t have sorted dependencies mentioned above.' % (
                        _MESSAGE_TYPE_FAILED))
            else:
                summary_message = (
                    '%s  Sorted dependencies check passed' % (
                        _MESSAGE_TYPE_SUCCESS))

        summary_messages.append(summary_message)
        python_utils.PRINT('')
        python_utils.PRINT(summary_message)
        if self.verbose_mode_enabled:
            python_utils.PRINT('----------------------------------------')
        self.process_manager['sorted'] = summary_messages
        _STDOUT_LIST.append(stdout)

    def _match_line_breaks_in_controller_dependencies(self):
        """This function checks whether the line breaks between the dependencies
        listed in the controller of a directive or service exactly match those
        between the arguments of the controller function.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT(
                'Starting controller dependency line break check')
            python_utils.PRINT('----------------------------------------')
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS)]
        failed = False
        summary_messages = []

        # For RegExp explanation, please see https://regex101.com/r/T85GWZ/2/.
        pattern_to_match = (
            r'controller.* \[(?P<stringfied_dependencies>[\S\s]*?)' +
            r'function\((?P<function_parameters>[\S\s]*?)\)')
        stdout = python_utils.string_io()
        with _redirect_stdout(stdout):
            for filepath in files_to_check:
                file_content = FILE_CACHE.read(filepath)
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
                        python_utils.PRINT(
                            'Please ensure that in file %s the line breaks '
                            'pattern between the dependencies mentioned as '
                            'strings:\n[%s]\nand the dependencies mentioned '
                            'as function parameters: \n(%s)\nfor the '
                            'corresponding controller should '
                            'exactly match.' % (
                                filepath, stringfied_dependencies,
                                function_parameters))
                        python_utils.PRINT('')

            if failed:
                summary_message = (
                    '%s   Controller dependency line break check failed, '
                    'see messages above for the affected files.' % (
                        _MESSAGE_TYPE_FAILED))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s  Controller dependency line break check passed' % (
                        _MESSAGE_TYPE_SUCCESS))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)

            python_utils.PRINT('')
        self.process_manager['line_breaks'] = summary_messages
        _STDOUT_LIST.append(stdout)

    def _check_constants_declaration(self):
        """Checks the declaration of constants in the TS files to ensure that
        the constants are not declared in files other than *.constants.ajs.ts
        and that the constants are declared only single time. This also checks
        that the constants are declared in both *.constants.ajs.ts (for
        AngularJS) and in *.constants.ts (for Angular 8).
        """

        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting constants declaration check')
            python_utils.PRINT('----------------------------------------')

        summary_messages = []
        failed = False

        with _redirect_stdout(_TARGET_STDOUT):
            ts_files_to_check = self.ts_filepaths
            constants_to_source_filepaths_dict = {}
            angularjs_source_filepaths_to_constants_dict = {}
            for filepath in ts_files_to_check:
                # The following block extracts the corresponding Angularjs
                # constants file for the Angular constants file. This is
                # required since the check cannot proceed if the AngularJS
                # constants file is not provided before the Angular constants
                # file.
                if filepath.endswith('.constants.ts'):
                    filename_without_extension = filepath[:-3]
                    corresponding_angularjs_filepath = (
                        filename_without_extension + '.ajs.ts')
                    compiled_js_dir = tempfile.mkdtemp(dir=os.getcwd())
                    try:
                        if os.path.isfile(corresponding_angularjs_filepath):
                            compiled_js_filepath = self._compile_ts_file(
                                corresponding_angularjs_filepath,
                                compiled_js_dir)
                            file_content = FILE_CACHE.read(
                                compiled_js_filepath).decode('utf-8')

                            parsed_script = esprima.parseScript(file_content)
                            parsed_nodes = parsed_script.body
                            angularjs_constants_list = []
                            components_to_check = ['constant']
                            for parsed_node in parsed_nodes:
                                expression = (
                                    _get_expression_from_node_if_one_exists(
                                        parsed_node, components_to_check))
                                if not expression:
                                    continue
                                else:
                                    # The following block populates a set to
                                    # store constants for the Angular-AngularJS
                                    # constants file consistency check.
                                    angularjs_constants_name = (
                                        expression.arguments[0].value)
                                    angularjs_constants_value = (
                                        expression.arguments[1].property.name)
                                    if angularjs_constants_value != (
                                            angularjs_constants_name):
                                        failed = True
                                        python_utils.PRINT(
                                            '%s --> Please ensure that the '
                                            'constant %s is initialized '
                                            'from the value from the '
                                            'corresponding Angular constants'
                                            ' file (the *.constants.ts '
                                            'file). Please create one in the'
                                            ' Angular constants file if it '
                                            'does not exist there.' % (
                                                filepath,
                                                angularjs_constants_name))
                                    angularjs_constants_list.append(
                                        angularjs_constants_name)
                            angularjs_constants_set = set(
                                angularjs_constants_list)
                            if len(angularjs_constants_set) != len(
                                    angularjs_constants_list):
                                failed = True
                                python_utils.PRINT(
                                    '%s --> Duplicate constant declaration '
                                    'found.' % (
                                        corresponding_angularjs_filepath))
                            angularjs_source_filepaths_to_constants_dict[
                                corresponding_angularjs_filepath] = (
                                    angularjs_constants_set)
                        else:
                            failed = True
                            python_utils.PRINT(
                                '%s --> Corresponding AngularJS constants '
                                'file not found.' % filepath)

                    finally:
                        shutil.rmtree(compiled_js_dir)
                # Check that the constants are declared only in a
                # *.constants.ajs.ts file.
                if not filepath.endswith('.constants.ajs.ts'):
                    for line_num, line in enumerate(FILE_CACHE.readlines(
                            filepath)):
                        if 'oppia.constant(' in line:
                            failed = True
                            python_utils.PRINT(
                                '%s --> Constant declaration found at line '
                                '%s. Please declare the constants in a '
                                'separate constants file.' % (
                                    filepath, line_num))

                # Check if the constant has multiple declarations which is
                # prohibited.
                parsed_script = self.parsed_js_and_ts_files[filepath]
                parsed_nodes = parsed_script.body
                components_to_check = ['constant']
                angular_constants_list = []
                for parsed_node in parsed_nodes:
                    expression = _get_expression_from_node_if_one_exists(
                        parsed_node, components_to_check)
                    if not expression:
                        continue
                    else:
                        constant_name = expression.arguments[0].raw
                        if constant_name in constants_to_source_filepaths_dict:
                            failed = True
                            python_utils.PRINT(
                                '%s --> The constant %s is already declared '
                                'in %s. Please import the file where the '
                                'constant is declared or rename the constant'
                                '.' % (
                                    filepath, constant_name,
                                    constants_to_source_filepaths_dict[
                                        constant_name]))
                        else:
                            constants_to_source_filepaths_dict[
                                constant_name] = filepath

                # Checks that the *.constants.ts and the corresponding
                # *.constants.ajs.ts file are in sync.
                if filepath.endswith('.constants.ts'):
                    angular_constants_nodes = (
                        parsed_nodes[1].declarations[0].init.callee.body.body)
                    for angular_constant_node in angular_constants_nodes:
                        if not angular_constant_node.expression:
                            continue
                        angular_constant_name = (
                            angular_constant_node.expression.left.property.name)
                        angular_constants_list.append(angular_constant_name)

                    angular_constants_set = set(angular_constants_list)
                    if len(angular_constants_set) != len(
                            angular_constants_list):
                        failed = True
                        python_utils.PRINT(
                            '%s --> Duplicate constant declaration found.'
                            % filepath)
                    if corresponding_angularjs_filepath in (
                            angularjs_source_filepaths_to_constants_dict):
                        angular_minus_angularjs_constants = (
                            angular_constants_set.difference(
                                angularjs_source_filepaths_to_constants_dict[
                                    corresponding_angularjs_filepath]))
                        for constant in angular_minus_angularjs_constants:
                            failed = True
                            python_utils.PRINT(
                                '%s --> The constant %s is not declared '
                                'in the corresponding angularjs '
                                'constants file.' % (filepath, constant))

            if failed:
                summary_message = (
                    '%s  Constants declaration check failed, '
                    'see messages above for constants with errors.' % (
                        _MESSAGE_TYPE_FAILED))
            else:
                summary_message = '%s  Constants declaration check passed' % (
                    _MESSAGE_TYPE_SUCCESS)
            summary_messages.append(summary_message)
            python_utils.PRINT(summary_message)

        return summary_messages

    def _check_dependencies(self):
        """Check the dependencies related issues. This runs
        _check_sorted_dependencies and
        _match_line_breaks_in_controller_dependencies
        in parallel.
        """
        methods = [
            self._check_sorted_dependencies,
            self._match_line_breaks_in_controller_dependencies
        ]
        super(JsTsLintChecksManager, self)._run_multiple_checks(*methods)

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """

        self.parsed_js_and_ts_files = self._validate_and_parse_js_and_ts_files()
        self.parsed_expressions_in_files = (
            self._get_expressions_from_parsed_script())

        common_messages = super(
            JsTsLintChecksManager, self).perform_all_lint_checks()

        super(JsTsLintChecksManager, self)._run_multiple_checks(
            self._check_extra_js_files,
            self._check_js_and_ts_component_name_and_count,
            self._check_directive_scope
        )
        self._check_dependencies()
        extra_js_files_messages = self.process_manager['extra']
        js_and_ts_component_messages = self.process_manager['component']
        directive_scope_messages = self.process_manager['directive']
        sorted_dependencies_messages = self.process_manager['sorted']
        controller_dependency_messages = self.process_manager['line_breaks']

        all_messages = (
            common_messages + extra_js_files_messages +
            js_and_ts_component_messages + directive_scope_messages +
            sorted_dependencies_messages + controller_dependency_messages)
        return all_messages

    def _check_html_directive_name(self):
        """This function checks that all HTML directives end
        with _directive.html.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting HTML directive name check')
            python_utils.PRINT('----------------------------------------')
        total_files_checked = 0
        total_error_count = 0
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS)]
        failed = False
        summary_messages = []
        # For RegExp explanation, please see https://regex101.com/r/gU7oT6/37.
        pattern_to_match = (
            r'templateUrl: UrlInterpolationService\.[A-z\(]+' +
            r'(?P<directive_name>[^\)]+)')
        with _redirect_stdout(_TARGET_STDOUT):
            for filepath in files_to_check:
                file_content = FILE_CACHE.read(filepath)
                total_files_checked += 1
                matched_patterns = re.findall(pattern_to_match, file_content)
                for matched_pattern in matched_patterns:
                    matched_pattern = matched_pattern.split()
                    directive_filepath = ''.join(matched_pattern).replace(
                        '\'', '').replace('+', '')
                    if not directive_filepath.endswith('_directive.html'):
                        failed = True
                        total_error_count += 1
                        python_utils.PRINT(
                            '%s --> Please ensure that this file ends'
                            'with _directive.html.' % directive_filepath)
                        python_utils.PRINT('')

            if failed:
                summary_message = (
                    '%s   HTML directive name check failed, see files above '
                    'that did not end with _directive.html but '
                    'should have.' % _MESSAGE_TYPE_FAILED)
                summary_messages.append(summary_message)
            else:
                summary_message = '%s   HTML directive name check passed' % (
                    _MESSAGE_TYPE_SUCCESS)
                summary_messages.append(summary_message)

            python_utils.PRINT('')
            if total_files_checked == 0:
                if self.verbose_mode_enabled:
                    python_utils.PRINT('There are no files to be checked.')
            else:
                python_utils.PRINT('(%s files checked, %s errors found)' % (
                    total_files_checked, total_error_count))
                python_utils.PRINT(summary_message)

        return summary_messages


class OtherLintChecksManager(LintChecksManager):
    """Manages all the linting functions except the ones against Js and Ts. It
    checks Python, CSS, and HTML files.

    Attributes:
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(
            self, verbose_mode_enabled=False):
        """Constructs a OtherLintChecksManager object.

        Args:
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        super(OtherLintChecksManager, self).__init__(
            verbose_mode_enabled=verbose_mode_enabled)

    @property
    def py_filepaths(self):
        """Return all python filepaths."""
        return _FILES['.py']

    @property
    def html_filepaths(self):
        """Return all html filepaths."""
        return _FILES['.html']

    @property
    def other_filepaths(self):
        """Return other filepaths."""
        return _FILES['other']

    @property
    def css_filepaths(self):
        """Return css filepaths."""
        return _FILES['.css']

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return (
            self.css_filepaths + self.html_filepaths +
            self.other_filepaths + self.py_filepaths)

    def _check_import_order(self):
        """This function is used to check that each file
        has imports placed in alphabetical order.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting import-order checks')
            python_utils.PRINT('----------------------------------------')
        summary_messages = []
        files_to_check = [
            filepath for filepath in self.py_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS)]
        failed = False
        stdout = python_utils.string_io()
        with _redirect_stdout(stdout):
            for filepath in files_to_check:
                # This line prints the error message along with file path
                # and returns True if it finds an error else returns False
                # If check is set to True, isort simply checks the file and
                # if check is set to False, it autocorrects import-order errors.
                if (isort.SortImports(
                        filepath, check=True, show_diff=(
                            True)).incorrectly_sorted):
                    failed = True
                    python_utils.PRINT('')

            python_utils.PRINT('')
            if failed:
                summary_message = (
                    '%s   Import order checks failed, file imports should be '
                    'alphabetized, see affect files above.' % (
                        _MESSAGE_TYPE_FAILED))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s   Import order checks passed' % _MESSAGE_TYPE_SUCCESS)
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
        self.process_manager['import'] = summary_messages
        _STDOUT_LIST.append(stdout)


    def _check_import(self):
        """Run checks relates to import order."""
        methods = [self._check_import_order]
        super(OtherLintChecksManager, self)._run_multiple_checks(*methods)

    def _check_docstring(self):
        """Run checks related to docstring."""
        methods = [self._check_docstrings]
        super(OtherLintChecksManager, self)._run_multiple_checks(*methods)

    def _check_docstrings(self):
        """This function ensures that docstrings end in a period and the arg
        order in the function definition matches the order in the doc string.

        Returns:
            summary_messages: list(str). Summary of messages generated by the
            check.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting docstring checks')
            python_utils.PRINT('----------------------------------------')
        summary_messages = []
        files_to_check = [
            filepath for filepath in self.py_filepaths if not
            any(fnmatch.fnmatch(filepath, pattern) for pattern in
                EXCLUDED_PATHS)]
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
        stdout = python_utils.string_io()
        with _redirect_stdout(stdout):
            for filepath in files_to_check:
                file_content = FILE_CACHE.readlines(filepath)
                file_length = len(file_content)
                for line_num in python_utils.RANGE(file_length):
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
                        python_utils.PRINT('%s --> Line %s: %s' % (
                            filepath, line_num + 1,
                            space_after_triple_quotes_in_docstring_message))
                        python_utils.PRINT('')
                        is_docstring = False

                    # Check if single line docstring span two lines.
                    if line == '"""' and prev_line.startswith('"""') and (
                            is_docstring):
                        failed = True
                        python_utils.PRINT('%s --> Line %s: %s' % (
                            filepath, line_num, single_line_docstring_message))
                        python_utils.PRINT('')
                        is_docstring = False

                    # Check for single line docstring.
                    elif re.match(r'^""".+"""$', line) and is_docstring:
                        # Check for punctuation at line[-4] since last three
                        # characters are double quotes.
                        if (len(line) > 6) and (
                                line[-4] not in
                                ALLOWED_TERMINATING_PUNCTUATIONS):
                            failed = True
                            python_utils.PRINT('%s --> Line %s: %s' % (
                                filepath, line_num + 1, missing_period_message))
                            python_utils.PRINT('')
                        is_docstring = False

                    # Check for multiline docstring.
                    elif line.endswith('"""') and is_docstring:
                        # Case 1: line is """. This is correct for multiline
                        # docstring.
                        if line == '"""':
                            # Check for empty line before the end of docstring.
                            if prev_line == '':
                                failed = True
                                python_utils.PRINT('%s --> Line %s: %s' % (
                                    filepath, line_num, previous_line_message))
                                python_utils.PRINT('')
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
                                    python_utils.PRINT('%s --> Line %s: %s' % (
                                        filepath, line_num,
                                        missing_period_message))
                                    python_utils.PRINT('')

                        # Case 2: line contains some words before """. """
                        # should shift to next line.
                        elif not any(word in line for word in EXCLUDED_PHRASES):
                            failed = True
                            python_utils.PRINT('%s --> Line %s: %s' % (
                                filepath, line_num + 1,
                                multiline_docstring_message))
                            python_utils.PRINT('')

                        is_docstring = False

            docstring_checker = docstrings_checker.ASTDocStringChecker()
            for filepath in files_to_check:
                ast_file = ast.walk(
                    ast.parse(
                        python_utils.convert_to_bytes(
                            FILE_CACHE.read(filepath))))
                func_defs = [n for n in ast_file if isinstance(
                    n, ast.FunctionDef)]
                for func in func_defs:
                    # Check that the args in the docstring are listed in the
                    # same order as they appear in the function definition.
                    func_result = docstring_checker.check_docstrings_arg_order(
                        func)
                    for error_line in func_result:
                        python_utils.PRINT('%s --> Func %s: %s' % (
                            filepath, func.name, error_line))
                        python_utils.PRINT('')
                        failed = True

            python_utils.PRINT('')
            if failed:
                summary_message = (
                    '%s   Docstring check failed, see files above with bad'
                    'docstrings to be fixed.' % _MESSAGE_TYPE_FAILED)
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s   Docstring check passed' % _MESSAGE_TYPE_SUCCESS)
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
        self.process_manager['docstrings'] = summary_messages
        _STDOUT_LIST.append(stdout)

    def _check_html_tags_and_attributes(self, debug=False):
        """This function checks the indentation of lines in HTML files."""

        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting HTML tag and attribute check')
            python_utils.PRINT('----------------------------------------')

        html_files_to_lint = self.html_filepaths

        failed = False
        summary_messages = []

        with _redirect_stdout(_TARGET_STDOUT):
            for filepath in html_files_to_lint:
                file_content = FILE_CACHE.read(filepath)
                file_lines = FILE_CACHE.readlines(filepath)
                parser = CustomHTMLParser(filepath, file_lines, debug)
                parser.feed(file_content)

                if len(parser.tag_stack) != 0:
                    raise TagMismatchException('Error in file %s\n' % filepath)

                if parser.failed:
                    failed = True

            if failed:
                summary_message = (
                    '%s   HTML tag and attribute check failed, fix the HTML '
                    'files listed above.' % _MESSAGE_TYPE_FAILED)
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = '%s  HTML tag and attribute check passed' % (
                    _MESSAGE_TYPE_SUCCESS)

                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)

            python_utils.PRINT('')

        return summary_messages

    def _lint_html_files(self):
        """This function is used to check HTML files for linting errors."""
        node_path = os.path.join(NODE_DIR, 'bin', 'node')
        htmllint_path = os.path.join(
            'node_modules', 'htmllint-cli', 'bin', 'cli.js')

        error_summary = []
        total_error_count = 0
        summary_messages = []
        htmllint_cmd_args = [node_path, htmllint_path, '--rc=.htmllintrc']
        html_files_to_lint = self.html_filepaths
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting HTML linter...')
            python_utils.PRINT('----------------------------------------')
        python_utils.PRINT('')
        if not self.verbose_mode_enabled:
            python_utils.PRINT('Linting HTML files.')
        for filepath in html_files_to_lint:
            proc_args = htmllint_cmd_args + [filepath]
            if self.verbose_mode_enabled:
                python_utils.PRINT('Linting %s file' % filepath)
            with _redirect_stdout(_TARGET_STDOUT):
                proc = subprocess.Popen(
                    proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

                encoded_linter_stdout, _ = proc.communicate()
                linter_stdout = encoded_linter_stdout.decode(encoding='utf-8')
                # This line splits the output of the linter and extracts digits
                # from it. The digits are stored in a list. The second last
                # digit in the list represents the number of errors in the file.
                error_count = (
                    [int(s) for s in linter_stdout.split() if s.isdigit()][-2])
                if error_count:
                    error_summary.append(error_count)
                    python_utils.PRINT(linter_stdout)

        with _redirect_stdout(_TARGET_STDOUT):
            if self.verbose_mode_enabled:
                python_utils.PRINT('----------------------------------------')
            for error_count in error_summary:
                total_error_count += error_count
            total_files_checked = len(html_files_to_lint)
            if total_error_count:
                python_utils.PRINT('(%s files checked, %s errors found)' % (
                    total_files_checked, total_error_count))
                summary_message = (
                    '%s   HTML linting failed, '
                    'fix the HTML files listed above.' % _MESSAGE_TYPE_FAILED)
                summary_messages.append(summary_message)
            else:
                summary_message = '%s   HTML linting passed' % (
                    _MESSAGE_TYPE_SUCCESS)
                summary_messages.append(summary_message)

            python_utils.PRINT('')
            python_utils.PRINT(summary_message)
            python_utils.PRINT('HTML linting finished.')
            python_utils.PRINT('')

        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """

        common_messages = super(
            OtherLintChecksManager, self).perform_all_lint_checks()
        # division_operator_messages = self._check_division_operator()
        # import_order_messages = self._check_import_order()
        self._check_import()
        self._check_docstring()
        docstring_messages = self.process_manager['docstrings']
        # The html tags and attributes check has an additional
        # debug mode which when enabled prints the tag_stack for each file.
        html_tag_and_attribute_messages = (
            self._check_html_tags_and_attributes())
        html_linter_messages = self._lint_html_files()
        import_order_messages = self.process_manager['import']

        all_messages = (
            import_order_messages + common_messages +
            docstring_messages + html_tag_and_attribute_messages +
            html_linter_messages)
        return all_messages


def _print_complete_summary_of_errors():
    """Print complete summary of errors."""
    error_messages = _TARGET_STDOUT.getvalue()
    piped_messages = ''.join([x.getvalue() for x in _STDOUT_LIST])
    error_messages += piped_messages
    if error_messages != '':
        python_utils.PRINT('Summary of Errors:')
        python_utils.PRINT('----------------------------------------')
        python_utils.PRINT(error_messages)


def read_files(file_paths):
    """Read all files to be checked and cache them. This will spin off multiple
    threads to increase the efficiency.
    """
    threads = []
    for file_path in file_paths:
        thread = threading.Thread(target=FILE_CACHE.read, args=(file_path,))
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()


def categorize_files(file_paths):
    """Categorize all the files and store them in shared variable _FILES."""
    all_filepaths_dict = {
        '.py': [], '.html': [], '.ts': [], '.js': [], 'other': [], '.css': []
    }
    for file_path in file_paths:
        _, extension = os.path.splitext(file_path)
        if extension in all_filepaths_dict:
            all_filepaths_dict[extension].append(file_path)
        else:
            all_filepaths_dict['other'].append(file_path)
    _FILES.update(all_filepaths_dict)


def _join_linting_process(linting_processes, result_queues, result_stdouts):
    """Join process spawn off by _lint_all_files and capture the outputs."""
    for process in linting_processes:
        process.join()

    summary_messages = []

    for result_queue in result_queues:
        while not result_queue.empty():
            summary_messages.append(result_queue.get())

    for result_stdout in result_stdouts:
        while not result_stdout.empty():
            summary_messages.append(result_stdout.get())

    with _redirect_stdout(_TARGET_STDOUT):
        python_utils.PRINT(b'\n'.join(summary_messages))
        python_utils.PRINT('')

    python_utils.PRINT('')
    return summary_messages


def main(args=None):
    """Main method for pre commit linter script that lints Python, JavaScript,
    HTML, and CSS files.
    """
    parsed_args = _PARSER.parse_args(args=args)
    # Default mode is non-verbose mode, if arguments contains --verbose flag it
    # will be made True, which will represent verbose mode.
    verbose_mode_enabled = bool(parsed_args.verbose)
    all_filepaths = _get_all_filepaths(parsed_args.path, parsed_args.files)

    if len(all_filepaths) == 0:
        python_utils.PRINT('---------------------------')
        python_utils.PRINT('No files to check.')
        python_utils.PRINT('---------------------------')
        return

    read_files(all_filepaths)
    categorize_files(all_filepaths)
    linting_processes, result_queues, result_stdout = _lint_all_files(
        _FILES['.js'], _FILES['.ts'], _FILES['.py'], _FILES['.html'],
        _FILES['.css'], verbose_mode_enabled)
    code_owner_message = _check_codeowner_file(verbose_mode_enabled)
    # Pylint requires to provide paramter "this_bases" and "d", guess due to
    # meta class.
    js_ts_lint_checks_manager = JsTsLintChecksManager( # pylint: disable=no-value-for-parameter
        verbose_mode_enabled)
    other_lint_checks_manager = OtherLintChecksManager(   # pylint: disable=no-value-for-parameter
        verbose_mode_enabled)
    all_messages = code_owner_message
    js_message = js_ts_lint_checks_manager.perform_all_lint_checks()
    other_messages = other_lint_checks_manager.perform_all_lint_checks()
    all_messages += js_message + other_messages

    all_messages += _join_linting_process(
        linting_processes, result_queues, result_stdout)

    _print_complete_summary_of_errors()

    if any([message.startswith(_MESSAGE_TYPE_FAILED) for message in
            all_messages]):
        python_utils.PRINT('---------------------------')
        python_utils.PRINT('Checks Not Passed.')
        python_utils.PRINT('---------------------------')
        sys.exit(1)
    else:
        python_utils.PRINT('---------------------------')
        python_utils.PRINT('All Checks Passed.')
        python_utils.PRINT('---------------------------')


NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = FileCache()
FILE_CACHE = NAME_SPACE.files


if __name__ == '__main__':
    main()
