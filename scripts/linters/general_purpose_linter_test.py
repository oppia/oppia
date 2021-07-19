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

"""Unit tests for scripts/linters/js_ts_linter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import multiprocessing
import os

from core.tests import test_utils

from . import general_purpose_linter
from . import pre_commit_linter

NAME_SPACE = multiprocessing.Manager().Namespace()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')

# HTML filepaths.
INVALID_NG_TEMPLATE_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_ng_template.html')
INVALID_TRAILING_WHITESPACE_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_trailing_whitespace.html')
INVALID_PARENT_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_parent.html')
INVALID_GLYPHICON_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_glyphicon.html')
INVALID_STYLE_TAG_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_style_tag.html')

# CSS filepaths.
INVALID_CSS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid.css')

# Js and Ts filepaths.
FILE_IN_EXCLUDED_PATH = os.path.join(
    'core', 'tests', 'build_sources', 'assets', 'constants.js')
EXTRA_JS_FILEPATH = os.path.join('core', 'templates', 'demo.js')
INVALID_TEMPLATE_URL_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_templateurl.ts')
INVALID_FILEOVERVIEW_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_fileoverview.ts')

# PY filepaths.
INVALID_OBJECT_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_object.py')
INVALID_REQUEST_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_request.py')
INVALID_NO_NEWLINE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_no_newline.py')
INVALID_URLOPEN_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_urlopen.py')
INVALID_URLRETRIEVE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_urlretrieve.py')
INVALID_AUTHOR_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_author.py')
INVALID_NDB_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_ndb.py')
INVALID_PYLINT_ID_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_pylint_id.py')
INVALID_QUOTE_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_quote.py')
INVALID_UNQUOTE_PLUS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_urlunquote_plus.py')
INVALID_URLENCODE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_urlencode.py')
INVALID_TABS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_tabs.py')
INVALID_MERGE_CONFLICT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_merge_conflict.py')
INVALID_TODO_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_todo.py')
INVALID_COPYRIGHT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_copyright.py')
INVALID_UNICODE_LITERAL_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_unicode_literal.py')
CONSTANTS_FILEPATH = 'constants.ts'
VALID_PY_IGNORE_PRAGMA_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_py_ignore_pragma.py')


class HTMLLintTests(test_utils.LinterTestBase):
    """Test the HTML lint functions."""

    def test_invalid_use_of_ng_template(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_NG_TEMPLATE_HTML_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 9: The directives must be directly referenced.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_trailing_whitespace(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_TRAILING_WHITESPACE_HTML_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 9: There should not be any trailing whitespaces.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_parent(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_PARENT_HTML_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 13: Please do not access parent properties using '
            '$parent. Use the scope object for this purpose.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_style(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_STYLE_TAG_HTML_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 2: Please do not use inline styling.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)


class JsTsLintTests(test_utils.LinterTestBase):
    """Test the JsTs lint functions."""

    def test_invalid_use_of_template_url(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_TEMPLATE_URL_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 24: The directives must be directly referenced.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)


class PythonLintTests(test_utils.LinterTestBase):
    """Test the Python lint functions."""

    def test_invalid_use_of_author(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_AUTHOR_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 26: Please remove author tags from this file.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_ndb(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_NDB_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 31: Please use datastore_services instead of ndb'],
            lint_task_report.trimmed_messages)
        self.assert_same_list_elements(
            ['Line 34: Please use datastore_services instead of ndb'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_pylint_id(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_PYLINT_ID_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 43: Please remove pylint exclusion if it is unnecessary,'
            ' or make it human readable with a sentence instead of an id. '
            'The id-to-message list can be seen '
            'here->http://pylint-messages.wikidot.com/all-codes'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_quote(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_QUOTE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 44: Please use python_utils.url_quote().'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_unquote_plus(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_UNQUOTE_PLUS_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 45: Please use python_utils.url_unquote_plus().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_urlencode(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_URLENCODE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 46: Please use python_utils.url_encode().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_urlretrieve(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_URLRETRIEVE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 46: Please use python_utils.url_retrieve().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_urlopen(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_URLOPEN_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 45: Please use python_utils.url_open().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_request(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_REQUEST_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 47: Please use python_utils.url_request().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_object(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_OBJECT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 25: Please use python_utils.OBJECT.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)


class GeneralLintTests(test_utils.LinterTestBase):
    """Test all other general lint functions."""

    def test_invalid_use_of_tabs(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_TABS_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Please use spaces instead of tabs.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_merge_conflict_present(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_MERGE_CONFLICT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Please fully resolve existing merge conflicts.',
            'Please fully resolve existing merge conflicts.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_glyphicon(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_GLYPHICON_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Please use equivalent material-icons instead of glyphicons.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_todo(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_TODO_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 33: Please assign TODO comments to a user in the format'
            ' TODO(username): XXX.'], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_missing_copyright(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_COPYRIGHT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_mandatory_patterns()
        self.assert_same_list_elements([
            'Please ensure this file should contain a proper copyright '
            'notice.'], lint_task_report.trimmed_messages)
        self.assertEqual('Mandatory pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_missing_unicode_literal(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_UNICODE_LITERAL_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_mandatory_patterns()
        self.assert_same_list_elements([
            'Please ensure this file should contain unicode_literals '
            'future import.'], lint_task_report.trimmed_messages)
        self.assertEqual('Mandatory pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_missing_fileoverview(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_FILEOVERVIEW_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_mandatory_patterns()
        self.assert_same_list_elements([
            'Please ensure this file should contain a file overview i.e. '
            'a short description of the file.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Mandatory pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_dev_mode_in_constants_ts(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                'Copyright 2020 The Oppia Authors. All Rights Reserved.',
                ' * @fileoverview Initializes constants for '
                'the Oppia codebase.',
                '"DEV_MODE": false,\n'
                '"EMULATOR_MODE": true\n')

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)

        with readlines_swap:
            linter = general_purpose_linter.GeneralPurposeLinter(
                [CONSTANTS_FILEPATH], FILE_CACHE)
            lint_task_report = linter.check_bad_patterns()
        self.assertItemsEqual(
            [
                'constants.ts --> Please set the DEV_MODE variable in '
                'constants.ts to true before committing.',
            ],
            lint_task_report.trimmed_messages
        )
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_emulator_mode_in_constants_ts(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                'Copyright 2020 The Oppia Authors. All Rights Reserved.',
                ' * @fileoverview Initializes constants for '
                'the Oppia codebase.',
                '"DEV_MODE": true,\n'
                '"EMULATOR_MODE": false\n')

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)

        with readlines_swap:
            linter = general_purpose_linter.GeneralPurposeLinter(
                [CONSTANTS_FILEPATH], FILE_CACHE)
            lint_task_report = linter.check_bad_patterns()
        self.assertItemsEqual(
            [
                'constants.ts --> Please set the EMULATOR_MODE variable in '
                'constants.ts to true before committing.',
            ],
            lint_task_report.trimmed_messages
        )
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_linter_with_no_files(self):
        lint_task_report = general_purpose_linter.GeneralPurposeLinter(
            [], FILE_CACHE).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no files to be checked.',
                'SUCCESS  General purpose lint check passed'],
            lint_task_report[0].get_report())
        self.assertEqual('General purpose lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_file_with_no_newline_at_eof(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_NO_NEWLINE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_newline_at_eof()
        self.assert_same_list_elements(
            ['There should be a single newline at the end of file.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Newline at EOF', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_check_extra_js_file_found(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [EXTRA_JS_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_extra_js_files()
        self.assertEqual([
            'core/templates/demo.js  --> Found extra .js file',
            'If you want the above files to be present as js files, add '
            'them to the list JS_FILEPATHS_NOT_TO_BUILD in build.py. '
            'Otherwise, rename them to .ts'], lint_task_report.trimmed_messages)
        self.assertEqual('Extra JS files', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_with_excluded_filepath(self):
        def mock_is_filepath_excluded_for_bad_patterns_check(
                unused_pattern, unused_filepath):
            return True

        filepath_excluded_swap = self.swap(
            general_purpose_linter,
            'is_filepath_excluded_for_bad_patterns_check',
            mock_is_filepath_excluded_for_bad_patterns_check)

        with filepath_excluded_swap:
            linter = general_purpose_linter.GeneralPurposeLinter(
                [INVALID_NO_NEWLINE_FILEPATH], FILE_CACHE)
            lint_task_report = linter.check_bad_patterns()
        self.assertEqual(
            ['SUCCESS  Bad pattern check passed'],
            lint_task_report.get_report())
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_perform_all_lint_checks_with_success(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_NO_NEWLINE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.perform_all_lint_checks()
        self.assertTrue(isinstance(lint_task_report, list))

    def test_get_linters_with_success(self):
        custom_linter, third_party_linter = general_purpose_linter.get_linters(
            [INVALID_AUTHOR_FILEPATH], FILE_CACHE)
        self.assertTrue(
            isinstance(
                custom_linter, general_purpose_linter.GeneralPurposeLinter))
        self.assertEqual(third_party_linter, None)

    def test_linter_ignore_pragma(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [VALID_PY_IGNORE_PRAGMA_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assertFalse(lint_task_report.failed)
