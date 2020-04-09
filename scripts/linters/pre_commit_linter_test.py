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

"""Unit tests for scripts/pre_commit_linter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from core.tests import test_utils
import python_utils

from . import codeowner_linter
from . import pre_commit_linter

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'core', 'tests', 'linter_tests')

VALID_HTML_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.html')
INVALID_INDENTATION_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_indentation.html')
INVALID_NG_TEMPLATE_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_ng_template.html')
INVALID_TRAILING_WHITESPACE_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_trailing_whitespace.html')
INVALID_PARENT_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_parent.html')

VALID_CSS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.css')
INVALID_CSS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid.css')

VALID_JS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.js')
VALID_TS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.ts')

VALID_PY_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.py')
INVALID_IMPORT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_import_order.py')
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


def mock_exit(unused_status):
    """Mock for sys.exit."""
    pass


def mock_check_codeowner_file(unused_file_cache, unused_verbose_mode_enabled):
    """Mock for check_codeowner_file."""
    return []


def mock_perform_all_lint_checks(unused_self):
    """Mock for perform_all_lint_checks."""
    return []


def all_checks_passed(linter_stdout):
    """Helper function to check if all checks have passed.

    Args:
        linter_stdout: list(str). List of output messages from
            pre_commit_linter.

    Returns:
        bool. Whether all checks have passed or not.
    """
    return 'All Checks Passed.' in linter_stdout


def appears_in_linter_stdout(phrases, linter_stdout):
    """Checks to see if all of the phrases appear in at least one of the
    linter_stdout outputs.

    Args:
        phrases: list(str). A list of phrases we are trying to find in
        one of the linter_stdout outputs. For example, python linting
        outputs a success string that includes data we don't have easy
        access to, like how long the test took, so we may want to search
        for a substring of that success string in linter_stdout.

        linter_stdout: list(str). A list of the output results from the
        linter's execution. Note that anything placed into the "result"
        queue in pre_commit_linter will be in the same index.

    Returns:
        bool. True if and only if all of the phrases appear in at least
        one of the results stored in linter_stdout.
    """
    for output in linter_stdout:
        if all(phrase in output for phrase in phrases):
            return True
    return False


class LintTests(test_utils.GenericTestBase):
    """General class for all linter function tests."""
    def setUp(self):
        super(LintTests, self).setUp()
        self.linter_stdout = []
        def mock_print(*args):
            """Mock for python_utils.PRINT. Append the values to print to
            linter_stdout list.

            Args:
                *args: Variable length argument list of values to print in
                the same line of output.
            """
            self.linter_stdout.append(
                ' '.join(python_utils.UNICODE(arg) for arg in args))
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)
        self.sys_swap = self.swap(sys, 'exit', mock_exit)


# class HTMLLintTests(LintTests):
#     """Test the HTML lint functions."""
#     def setUp(self):
#         super(HTMLLintTests, self).setUp()
#         self.check_codeowner_swap = self.swap(
#             codeowner_linter, 'check_codeowner_file', mock_check_codeowner_file)
#
#     def test_valid_html_file(self):
#         with self.print_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % VALID_HTML_FILEPATH])
#         self.assertTrue(all_checks_passed(self.linter_stdout))
#         self.assertTrue('SUCCESS   HTML linting passed' in self.linter_stdout)
#
#     def test_invalid_indentation(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_INDENTATION_HTML_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Indentation for end tag content on line 13 does not match the'
#                  ' indentation of the start tag content on line 11'],
#                 self.linter_stdout))
#
#     def test_invalid_ng_template(self):
#         with self.print_swap, self.sys_swap:
#             with self.check_codeowner_swap:
#                 pre_commit_linter.main(
#                     args=['--path=%s' % INVALID_NG_TEMPLATE_HTML_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 8: The directives must be directly referenced.'],
#                 self.linter_stdout))
#
#     def test_invalid_trailing_whitespace(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_TRAILING_WHITESPACE_HTML_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 7: There should not be any trailing whitespaces.'],
#                 self.linter_stdout))
#
#     def test_invalid_parent(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_PARENT_HTML_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 12: Please do not access parent properties using '
#                  '$parent. Use the scope object for this purpose.'],
#                 self.linter_stdout))
#
#
# class CSSLintTests(LintTests):
#     """Test the CSS lint functions."""
#     def setUp(self):
#         super(CSSLintTests, self).setUp()
#         self.check_codeowner_swap = self.swap(
#             codeowner_linter, 'check_codeowner_file', mock_check_codeowner_file)
#
#     def test_valid_css_file(self):
#         with self.print_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % VALID_CSS_FILEPATH])
#         self.assertTrue(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['SUCCESS   1 CSS file linted'], self.linter_stdout))
#
#     def test_invalid_css_file(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_CSS_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['18:16',
#                  'Unexpected whitespace before \":\"   declaration-colon-space-'
#                  'before'], self.linter_stdout))
#
#
# class JsTsLintTests(LintTests):
#     """Test the JsTs lint functions."""
#     def setUp(self):
#         super(JsTsLintTests, self).setUp()
#         self.check_codeowner_swap = self.swap(
#             codeowner_linter, 'check_codeowner_file', mock_check_codeowner_file)
#
#     def test_valid_js_file(self):
#         with self.print_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % VALID_JS_FILEPATH])
#         self.assertTrue(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['SUCCESS   1 JavaScript and Typescript files linted'],
#                 self.linter_stdout)
#             )
#
#     def test_valid_ts_file(self):
#         with self.print_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % VALID_TS_FILEPATH])
#         self.assertTrue(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['SUCCESS   1 JavaScript and Typescript files linted'],
#                 self.linter_stdout))
#
#
# class PythonLintTests(LintTests):
#     """Test the Python lint functions."""
#     def setUp(self):
#         super(PythonLintTests, self).setUp()
#         self.check_codeowner_swap = self.swap(
#             codeowner_linter, 'check_codeowner_file', mock_check_codeowner_file)
#
#     def test_valid_py_file(self):
#         with self.print_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % VALID_PY_FILEPATH])
#         self.assertTrue(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['SUCCESS   1 Python files linted'],
#                 self.linter_stdout)
#             )
#
#     def test_invalid_import_order(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_IMPORT_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['FAILED   Import order checks failed, file imports should be '
#                  'alphabetized, see affect files above.'],
#                 self.linter_stdout))
#
#     def test_invalid_author(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_AUTHOR_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 24: Please remove author tags from this file.'],
#                 self.linter_stdout))
#
#     def test_invalid_datetime_now(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_DATETIME_NOW_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use datetime.datetime.utcnow() instead '
#                  'of datetime.datetime.now().'],
#                 self.linter_stdout))
#
#     def test_invalid_print(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_PRINT_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use python_utils.PRINT().'],
#                 self.linter_stdout))
#
#     def test_invalid_pylint_id(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_PYLINT_ID_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please remove pylint exclusion if it is unnecessary,'
#                  ' or make it human readable with a sentence instead of an id. '
#                  'The id-to-message list can be seen '
#                  'here->http://pylint-messages.wikidot.com/all-codes'],
#                 self.linter_stdout))
#
#     def test_invalid_assert_equals(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_ASSERT_EQUALS_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please do not use self.assertEquals method. This '
#                  'method has been deprecated. Instead use self.assertEqual '
#                  'method.'],
#                 self.linter_stdout))
#
#     def test_invalid_open(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_OPEN_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use python_utils.open_file() instead '
#                  'of open().'],
#                 self.linter_stdout))
#
#     def test_invalid_stringio(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_STRINGIO_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 40: Please use python_utils.string_io() instead of '
#                  'import StringIO.'],
#                 self.linter_stdout))
#
#     def test_invalid_quote(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_QUOTE_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 40: Please use python_utils.url_quote().'],
#                 self.linter_stdout))
#
#     def test_invalid_unquote_plus(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_UNQUOTE_PLUS_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 40: Please use python_utils.url_unquote_plus().'],
#                 self.linter_stdout))
#
#     def test_invalid_urlencode(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_URLENCODE_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 41: Please use python_utils.url_encode().'],
#                 self.linter_stdout))
#
#     def test_invalid_urlretrieve(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_URLRETRIEVE_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 41: Please use python_utils.url_retrieve().'],
#                 self.linter_stdout))
#
#     def test_invalid_urlopen(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_URLOPEN_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 40: Please use python_utils.url_open().'],
#                 self.linter_stdout))
#
#     def test_invalid_urlsplit(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_URLSPLIT_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 40: Please use python_utils.url_split().'],
#                 self.linter_stdout))
#
#     def test_invalid_urlparse(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_URLPARSE_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 40: Please use python_utils.url_parse().'],
#                 self.linter_stdout))
#
#     def test_invalid_url_unsplit(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_URL_UNSPLIT_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 40: Please use python_utils.url_unsplit().'],
#                 self.linter_stdout))
#
#     def test_invalid_parse_qs(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_PARSE_QS_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 40: Please use python_utils.parse_query_string().'],
#                 self.linter_stdout))
#
#     def test_invalid_unquote(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_UNQUOTE_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 41: Please use python_utils.urllib_unquote().'],
#                 self.linter_stdout))
#
#     def test_invalid_urljoin(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_URLJOIN_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 42: Please use python_utils.url_join().'],
#                 self.linter_stdout))
#
#     def test_invalid_request(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_REQUEST_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 42: Please use python_utils.url_request().'],
#                 self.linter_stdout))
#
#     def test_invalid_input(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_INPUT_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use python_utils.INPUT.'],
#                 self.linter_stdout))
#
#     def test_invalid_map(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_MAP_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use python_utils.MAP.'],
#                 self.linter_stdout))
#
#     def test_invalid_next(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_NEXT_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 39: Please use python_utils.NEXT.'],
#                 self.linter_stdout))
#
#     def test_invalid_object(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_OBJECT_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 23: Please use python_utils.OBJECT.'],
#                 self.linter_stdout))
#
#     def test_invalid_range(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_RANGE_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use python_utils.RANGE.'],
#                 self.linter_stdout))
#
#     def test_invalid_round(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_ROUND_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use python_utils.ROUND.'],
#                 self.linter_stdout))
#
#     def test_invalid_str(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_STR_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please try to use python_utils.convert_to_bytes() '
#                  'for the strings used in webapp2\'s built-in methods or for '
#                  'strings used directly in NDB datastore models. If you need to'
#                  ' cast ints/floats to strings, please use '
#                  'python_utils.UNICODE() instead.'],
#                 self.linter_stdout))
#
#     def test_invalid_zip(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(args=['--path=%s' % INVALID_ZIP_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 40: Please use python_utils.ZIP.'],
#                 self.linter_stdout))
#
#     def test_invalid_basestring(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_BASESTRING_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use python_utils.BASESTRING.'],
#                 self.linter_stdout))
#
#     def test_invalid_metaclass(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_METACLASS_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 42: Please use python_utils.with_metaclass().'],
#                 self.linter_stdout))
#
#     def test_invalid_iteritems(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_ITERITEMS_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use items() instead.'],
#                 self.linter_stdout))
#
#     def test_invalid_itervalues(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_ITERVALUES_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use values() instead.'],
#                 self.linter_stdout))
#
#     def test_invalid_iterkeys(self):
#         with self.print_swap, self.sys_swap, self.check_codeowner_swap:
#             pre_commit_linter.main(
#                 args=['--path=%s' % INVALID_ITERKEY_FILEPATH])
#         self.assertFalse(all_checks_passed(self.linter_stdout))
#         self.assertTrue(
#             appears_in_linter_stdout(
#                 ['Line 38: Please use keys() instead.'],
#                 self.linter_stdout))


class GeneralLintTests(LintTests):
    """Test all other general lint functions."""
    def setUp(self):
        super(GeneralLintTests, self).setUp()
        self.check_codeowner_swap = self.swap(
            codeowner_linter, 'check_codeowner_file', mock_check_codeowner_file)

    def test_invalid_tabs(self):
        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            pre_commit_linter.main(args=['--path=%s' % INVALID_TABS_FILEPATH])
        self.assertFalse(all_checks_passed(self.linter_stdout))
        self.assertTrue(
            appears_in_linter_stdout(
                ['Please use spaces instead of tabs.'],
                self.linter_stdout))

    def test_invalid_tabs(self):
        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            pre_commit_linter.main(args=['--path=%s' % INVALID_TABS_FILEPATH])
        self.assertFalse(all_checks_passed(self.linter_stdout))
        self.assertTrue(
            appears_in_linter_stdout(
                ['Please use spaces instead of tabs.'],
                self.linter_stdout))
