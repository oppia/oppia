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

# CSS filepaths.
INVALID_CSS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid.css')

# Js and Ts filepaths.
FILE_IN_EXCLUDED_PATH = os.path.join(
    'core', 'tests', 'build_sources', 'assets', 'constants.js')
INVALID_EXPLORE_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_explore.js')
INVALID_PAUSE_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_pause.js')
INVALID_SLEEP_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_sleep.js')
INVALID_WAIT_FOR_ANGULAR_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_wait_for_angular.js')
INVALID_FDESCRIBE_DDESCRIBE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_ddescribe_fdescribe.ts')
INVALID_IIT_FIT_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_iit_fit.ts')
INVALID_INJECT_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_inject.ts')
INVALID_INNER_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_innerhtml.ts')
INVALID_RELATIVE_IMPORT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_relative_import.js')
INVALID_PARENT_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_parent.ts')
INVALID_TEMPLATE_URL_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_templateurl.ts')
INVALID_FILEOVERVIEW_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_fileoverview.ts')
INVALID_TO_THROW_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_toThrow.ts')
INVALID_THROW_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_throw.ts')
INVALID_THROW_WITH_STRING_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_throw_with_string.ts')
INVALID_ESLINT_CAMELCASE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_eslint_camelcase.ts')
INVALID_ESLINT_ANY_TYPE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_eslint_any_type.ts')
INVALID_BROADCAST_USE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_broadcast_use.ts')

# PY filepaths.
INVALID_ITERKEY_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_iterkeys.py')
INVALID_ITERVALUES_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_itervalues.py')
INVALID_ITERITEMS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_iteritems.py')
INVALID_METACLASS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_metaclass.py')
INVALID_BASESTRING_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_basestring.py')
INVALID_ZIP_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_zip.py')
INVALID_STR_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_str.py')
INVALID_ROUND_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_round.py')
INVALID_RANGE_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_range.py')
INVALID_OBJECT_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_object.py')
INVALID_NEXT_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_next.py')
INVALID_MAP_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_map.py')
INVALID_INPUT_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_input.py')
INVALID_REQUEST_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_request.py')
INVALID_URLJOIN_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_urljoin.py')
INVALID_UNQUOTE_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_unquote.py')
INVALID_NO_NEWLINE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_no_newline.py')
INVALID_PARSE_QS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_parse_qs.py')
INVALID_URL_UNSPLIT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_urlunsplit.py')
INVALID_URLPARSE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_urlparse.py')
INVALID_URLSPLIT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_urlsplit.py')
INVALID_URLOPEN_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_urlopen.py')
INVALID_URLRETRIEVE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_urlretrieve.py')
INVALID_AUTHOR_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_author.py')
INVALID_DATETIME_NOW_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_datetime_now.py')
INVALID_PRINT_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_print.py')
INVALID_PYLINT_ID_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_pylint_id.py')
INVALID_ASSERT_EQUALS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_assert_equals.py')
INVALID_OPEN_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_open.py')
INVALID_STRINGIO_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_stringio.py')
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
INVALID_DEV_MODE_IN_CONSTANT_FILEPATH = 'constants.ts'


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


class JsTsLintTests(test_utils.LinterTestBase):
    """Test the JsTs lint functions."""

    def test_invalid_use_of_browser_explore(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_EXPLORE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 30: In tests, please do not use browser.explore().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_browser_pause(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_PAUSE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 30: In tests, please do not use browser.pause().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_browser_sleep(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_SLEEP_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 30: In tests, please do not use browser.sleep().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_browser_wait_for_angular(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_WAIT_FOR_ANGULAR_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 30: In tests, please do not use '
            'browser.waitForAngular().'], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_fdescribe_ddescribe(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_FDESCRIBE_DDESCRIBE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 24: In tests, please use \'describe\' instead of '
            '\'ddescribe\'or \'fdescribe\''], lint_task_report.trimmed_messages)
        self.assert_same_list_elements([
            'Line 28: In tests, please use \'describe\' instead of '
            '\'ddescribe\'or \'fdescribe\''], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_iit_fit(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_IIT_FIT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 40: In tests, please use \'it\' instead of \'iit\' or '
            '\'fit\''], lint_task_report.trimmed_messages)
        self.assert_same_list_elements([
            'Line 64: In tests, please use \'it\' instead of \'iit\' or '
            '\'fit\''], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_inject(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_INJECT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 26: In tests, please use \'angular.mock.inject\' '
            'instead of \'inject\''], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_template_url(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_TEMPLATE_URL_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 24: The directives must be directly referenced.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_parent(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_PARENT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 25: Please do not access parent properties using '
            '$parent. Use the scope objectfor this purpose.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_relative_import(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_RELATIVE_IMPORT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 20: Please, don\'t use relative imports in require().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_inner_html(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_INNER_HTML_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 27: Please do not use innerHTML property.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_to_throw(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_TO_THROW_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 25: Please use \'toThrowError\' instead of \'toThrow\''],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_throw(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_THROW_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 27: Please use \'throw new\' instead of \'throw\''],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_throw_with_string(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_THROW_WITH_STRING_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 27: Please use \'throw new Error\' instead of '
            '\'throw\''], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_eslint_camelcase_comment(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_ESLINT_CAMELCASE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 24: Please do not use eslint disable for camelcase. If '
            'you are using this statement to define properties in an '
            'interface for a backend dict. Wrap the property name in '
            'single quotes instead.'], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_eslint_no_explicit_any_comment(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_ESLINT_ANY_TYPE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 21: Please do not define "any" types. You can refer '
             'https://github.com/oppia/oppia/wiki/Guide-on-defining-types '
             'if you\'re having trouble declaring types.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_broadcast(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_BROADCAST_USE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 26: Please do not use $broadcast/$on for propagating events. '
            'Use @Input/@Output instead.'], lint_task_report.trimmed_messages)
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

    def test_invalid_use_of_datetime_now(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_DATETIME_NOW_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 42: Please use datetime.datetime.utcnow() instead '
            'of datetime.datetime.now().'], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_print(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_PRINT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 42: Please use python_utils.PRINT().'
            ], lint_task_report.trimmed_messages)
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

    def test_invalid_use_of_assert_equals(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_ASSERT_EQUALS_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 43: Please do not use self.assertEquals method. This '
            'method has been deprecated. Instead use self.assertEqual '
            'method.'], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_open(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_OPEN_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 42: Please use python_utils.open_file() instead '
            'of open().'], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_stringio(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_STRINGIO_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 44: Please use python_utils.string_io() instead of '
            'import StringIO.'], lint_task_report.trimmed_messages)
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

    def test_invalid_use_of_urlsplit(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_URLSPLIT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 46: Please use python_utils.url_split().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_urlparse(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_URLPARSE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 46: Please use python_utils.url_parse().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_url_unsplit(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_URL_UNSPLIT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 46: Please use python_utils.url_unsplit().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_parse_qs(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_PARSE_QS_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 45: Please use python_utils.parse_query_string().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_unquote(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_UNQUOTE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 44: Please use python_utils.urllib_unquote().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_urljoin(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_URLJOIN_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 46: Please use python_utils.url_join().'],
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

    def test_invalid_use_of_input(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_INPUT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 42: Please use python_utils.INPUT.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_map(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_MAP_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 42: Please use python_utils.MAP.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_next(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_NEXT_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 43: Please use python_utils.NEXT.'],
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

    def test_invalid_use_of_range(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_RANGE_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 42: Please use python_utils.RANGE.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_round(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_ROUND_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 42: Please use python_utils.ROUND.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_str(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_STR_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Line 42: Please try to use python_utils.convert_to_bytes() '
            'for the strings used in webapp2\'s built-in methods or for '
            'strings used directly in NDB datastore models. If you need to'
            ' cast ints/floats to strings, please use '
            'python_utils.UNICODE() instead.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_zip(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_ZIP_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 44: Please use python_utils.ZIP.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_basestring(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_BASESTRING_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 42: Please use python_utils.BASESTRING.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_metaclass(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_METACLASS_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 46: Please use python_utils.with_metaclass().'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_iteritems(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_ITERITEMS_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 43: Please use items() instead.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_itervalues(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_ITERVALUES_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 43: Please use values() instead.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Bad pattern', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_invalid_use_of_iterkeys(self):
        linter = general_purpose_linter.GeneralPurposeLinter(
            [INVALID_ITERKEY_FILEPATH], FILE_CACHE)
        lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements(
            ['Line 43: Please use keys() instead.'],
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

    def test_invalid_dev_mode_in_constant_ts(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                'Copyright 2020 The Oppia Authors. All Rights Reserved.',
                ' * @fileoverview Initializes constants for '
                'the Oppia codebase.',
                '"DEV_MODE": false\n',)

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)

        with readlines_swap:
            linter = general_purpose_linter.GeneralPurposeLinter(
                [INVALID_DEV_MODE_IN_CONSTANT_FILEPATH], FILE_CACHE)
            lint_task_report = linter.check_bad_patterns()
        self.assert_same_list_elements([
            'Please set the DEV_MODE variable in constants.ts'
            'to true before committing.'], lint_task_report.trimmed_messages)
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
