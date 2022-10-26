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

from __future__ import annotations

import multiprocessing
import os
import re

from core.tests import test_utils

from typing import Final, Pattern, Tuple

from . import general_purpose_linter
from . import pre_commit_linter
from . import warranted_angular_security_bypasses

NAME_SPACE: Final = multiprocessing.Manager().Namespace()
NAME_SPACE.files = pre_commit_linter.FileCache()  # type: ignore[no-untyped-call]
FILE_CACHE: Final = NAME_SPACE.files

LINTER_TESTS_DIR: Final = os.path.join(
    os.getcwd(), 'scripts', 'linters', 'test_files'
)

# HTML filepaths.
INVALID_NG_TEMPLATE_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_ng_template.html')
INVALID_TRAILING_WHITESPACE_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_trailing_whitespace.html')
INVALID_PARENT_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_parent.html')
INVALID_GLYPHICON_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_glyphicon.html')
INVALID_STYLE_TAG_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_style_tag.html')

# CSS filepaths.
INVALID_CSS_FILEPATH: Final = os.path.join(LINTER_TESTS_DIR, 'invalid.css')

# Js and Ts filepaths.
FILE_IN_EXCLUDED_PATH: Final = os.path.join(
    'core', 'tests', 'build_sources', 'assets', 'constants.js')
EXTRA_JS_FILEPATH: Final = os.path.join('core', 'templates', 'demo.js')
INVALID_FILEOVERVIEW_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_fileoverview.ts')
INVALID_BYPASS_FLAG: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_bypass_flag.ts')
VALID_SERVICE_FILE_PATH = os.path.join(
    LINTER_TESTS_DIR, 'valid-backend-api.service.ts')

# PY filepaths.
INVALID_REQUEST_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_request.py'
)
INVALID_NO_NEWLINE_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_no_newline.py')
INVALID_URLOPEN_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_urlopen.py')
INVALID_AUTHOR_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_author.py'
)
INVALID_DATASTORE_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_datastore.py')
INVALID_PYLINT_ID_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_pylint_id.py')
INVALID_TABS_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_tabs.py'
)
INVALID_MERGE_CONFLICT_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_merge_conflict.py')
INVALID_TODO_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_todo.py'
)
INVALID_COPYRIGHT_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_copyright.py')
INVALID_ANNOTATIONS_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_annotations.py')
CONSTANTS_FILEPATH: Final = os.path.join(
    os.getcwd(), 'assets', 'constants.ts'
)
VALID_PY_IGNORE_PRAGMA_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'valid_py_ignore_pragma.py')
VALID_PY_FILE_PATH = os.path.join(
    LINTER_TESTS_DIR, 'valid.py')


class HTMLLintTests(test_utils.LinterTestBase):
    """Test the HTML lint functions."""

    def test_invalid_use_of_ng_template(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_NG_TEMPLATE_HTML_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 9: The directives must be directly referenced.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_trailing_whitespace(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_TRAILING_WHITESPACE_HTML_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 9: There should not be any trailing whitespaces.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_parent(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_PARENT_HTML_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 13: Please do not access parent properties using '
            '$parent. Use the scope object for this purpose.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_style(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_STYLE_TAG_HTML_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 2: Please do not use inline styling.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)


class PythonLintTests(test_utils.LinterTestBase):
    """Test the Python lint functions."""

    def test_invalid_use_of_author(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_AUTHOR_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 23: Please remove author tags from this file.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_ndb(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_DATASTORE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 28: Please use datastore_services instead of ndb'],
            lint_task_report.trimmed_messages)
        self.assert_same_list_elements(
            ['Line 31: Please use datastore_services instead of ndb'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_pylint_id(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_PYLINT_ID_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 40: Please remove pylint exclusion if it is unnecessary,'
            ' or make it human readable with a sentence instead of an id. '
            'The id-to-message list can be seen '
            'here->http://pylint-messages.wikidot.com/all-codes'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)


class GeneralLintTests(test_utils.LinterTestBase):
    """Test all other general lint functions."""

    def test_invalid_use_of_tabs(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_TABS_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Please use spaces instead of tabs.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_merge_conflict_present(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_MERGE_CONFLICT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Please fully resolve existing merge conflicts.',
            'Please fully resolve existing merge conflicts.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_glyphicon(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_GLYPHICON_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Please use equivalent material-icons instead of glyphicons.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_todo(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_TODO_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 30: Please link TODO comments to an issue in the format'
            ' TODO(#issuenum): XXX.'], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_error_message_includes_filepath(self) -> None:
        def _mock_readlines_error(unused_self: str) -> None:
            raise Exception('filecache error')

        with self.swap(FILE_CACHE, 'readlines', _mock_readlines_error):
            linter = general_purpose_linter.GeneralPurposeLinter(
                [INVALID_ANNOTATIONS_FILEPATH], FILE_CACHE)
            with self.assertRaisesRegex(
                    Exception,
                    '%s filecache error' % INVALID_ANNOTATIONS_FILEPATH):
                linter.check_mandatory_patterns()

    def test_missing_unicode_literal(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_ANNOTATIONS_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_mandatory_patterns()
        self.assert_same_list_elements([
            'Please ensure this file should contain annotations future import.'
        ], lint_task_report.trimmed_messages)
        self.assertEqual('Mandatory pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_missing_copyright(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_COPYRIGHT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_mandatory_patterns()
        self.assert_same_list_elements([
            'Please ensure this file should contain a proper copyright '
            'notice.'], lint_task_report.trimmed_messages)
        self.assertEqual('Mandatory pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_missing_fileoverview(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_FILEOVERVIEW_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_mandatory_patterns()
        self.assert_same_list_elements([
            'Please ensure this file should contain a file overview i.e. '
            'a short description of the file.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Mandatory pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_dev_mode_in_constants_ts(self) -> None:
        def mock_readlines(unused_self: str) -> Tuple[str, ...]:
            return (
                'Copyright 2020 The Oppia Authors. All Rights Reserved.',
                ' * @fileoverview Initializes constants for '
                'the Oppia codebase.',
                '"DEV_MODE": false,\n'
                '"EMULATOR_MODE": true\n')

        with self.swap(FILE_CACHE, 'readlines', mock_readlines):
            linter = general_purpose_linter.GeneralPurposeLinter(
                [CONSTANTS_FILEPATH], FILE_CACHE)
            lint_task_report = linter.check_bad_patterns()
        self.assertEqual(len(lint_task_report.trimmed_messages), 1)
        self.assertTrue(lint_task_report.trimmed_messages[0].endswith(
            'constants.ts --> Please set the DEV_MODE variable in '
            'constants.ts to true before committing.'))

        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_emulator_mode_in_constants_ts(self) -> None:
        def mock_readlines(unused_self: str) -> Tuple[str, ...]:
            return (
                'Copyright 2020 The Oppia Authors. All Rights Reserved.',
                ' * @fileoverview Initializes constants for '
                'the Oppia codebase.',
                '"DEV_MODE": true,\n'
                '"EMULATOR_MODE": false\n')

        with self.swap(FILE_CACHE, 'readlines', mock_readlines):
            linter = general_purpose_linter.GeneralPurposeLinter(
                [CONSTANTS_FILEPATH], FILE_CACHE)
            lint_task_report = linter.check_bad_patterns()
        self.assertEqual(len(lint_task_report.trimmed_messages), 1)
        self.assertTrue(lint_task_report.trimmed_messages[0].endswith(
            'constants.ts --> Please set the EMULATOR_MODE variable in '
            'constants.ts to true before committing.'))

        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_linter_with_no_files(self) -> None:
        lint_task_report = general_purpose_linter.GeneralPurposeLinter(
            [], FILE_CACHE).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no files to be checked.',
                'SUCCESS  General purpose lint check passed'],
            lint_task_report[0].get_report())
        self.assertEqual('General purpose lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_file_with_no_newline_at_eof(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_NO_NEWLINE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_newline_at_eof()
        self.assert_same_list_elements(
            ['There should be a single newline at the end of file.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Newline at EOF', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_file_with_newline_at_eof(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [VALID_PY_FILE_PATH], FILE_CACHE)
        lint_task_report = linter.check_newline_at_eof()
        self.assertEqual('Newline at EOF', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_file_with_disallow_flags_raise_messsage(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [VALID_SERVICE_FILE_PATH, INVALID_BYPASS_FLAG], FILE_CACHE)
        lint_task_report = linter.check_disallowed_flags()
        self.assert_same_list_elements(
            ['Please do not use "no-bypass-security-phrase" flag. It is only '
             'expected to be used in files listed in '
             'warranted_angular_security_bypasses.py'],
            lint_task_report.trimmed_messages)
        self.assertEqual(lint_task_report.name, 'Disallow flags')
        self.assertTrue(lint_task_report.failed)

    def test_excluded_file_with_disallow_flags_raise_no_message(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_BYPASS_FLAG], FILE_CACHE)
        excluded_files_swap = self.swap(
            warranted_angular_security_bypasses,
            'EXCLUDED_BYPASS_SECURITY_TRUST_FILES',
            [INVALID_BYPASS_FLAG])
        with excluded_files_swap:
            lint_task_report = linter.check_disallowed_flags()
        self.assertEqual(
            lint_task_report.trimmed_messages, [])
        self.assertEqual(lint_task_report.name, 'Disallow flags')
        self.assertFalse(lint_task_report.failed)

    def test_check_extra_js_file_found(self) -> None:
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

    def test_with_excluded_filepath(self) -> None:
        def mock_is_filepath_excluded_for_bad_patterns_check(
            unused_pattern: Pattern[str], unused_filepath: str
        ) -> bool:
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

    def test_perform_all_lint_checks_with_success(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_NO_NEWLINE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.perform_all_lint_checks()
        self.assertTrue(isinstance(lint_task_report, list))

    def test_get_linters_with_success(self) -> None:
        custom_linter, third_party_linter = general_purpose_linter.get_linters(
            [INVALID_AUTHOR_FILEPATH], FILE_CACHE)
        self.assertTrue(
            isinstance(
                custom_linter, general_purpose_linter.GeneralPurposeLinter))
        self.assertEqual(third_party_linter, None)

    def test_linter_ignore_pragma(self) -> None:
        linter = general_purpose_linter.GeneralPurposeLinter(
            [VALID_PY_IGNORE_PRAGMA_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assertFalse(lint_task_report.failed)

    def test_check_bad_patterns_in_excluded_dirs(self) -> None:
        bad_pattern_regexp: general_purpose_linter.BadPatternRegexpDict = {
            'regexp': re.compile(r'[ \t]+$'),
            'message': 'There should not be any trailing whitespaces.',
            'excluded_files': (),
            'excluded_dirs': (LINTER_TESTS_DIR,)
        }
        check_status, error_messages = (
            general_purpose_linter.check_bad_pattern_in_file(
                os.path.join(LINTER_TESTS_DIR, 'some_file.py'),
                'unused_variable = 5 \n',
                bad_pattern_regexp
            )
        )
        self.assertFalse(check_status)
        self.assertEqual(error_messages, [])
