# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/check_if_pr_is_low_risk.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.tests import test_utils
import python_utils

from scripts import check_if_pr_is_low_risk

# We import StringIO directly instead of using python_utils.string_io
# because we need to inherit from StringIO, so we need the StringIO
# class. python_utils.string_io returns a StringIO object.
try:
    from StringIO import StringIO  # pylint: disable=import-only-modules
except ImportError:
    from io import StringIO  # pylint: disable=import-only-modules


class MockResponse(StringIO):
    """Mock for the objects returned by urllib2.url_open."""

    def __init__(self, data='', code=200):
        """Create a new mock object for the objects returned by
        url_open.

        Args:
            data: str. Response data.
            code: int. HTTP response code.
        """
        StringIO.__init__(self, data)
        self.code = code

    def getcode(self):
        """Get the HTTP response code."""
        return self.code


class ParsePrUrlTests(test_utils.GenericTestBase):

    def test_valid_url(self):
        parsed = check_if_pr_is_low_risk.parse_pr_url(
            'https://github.com/foobar/oppia/pull/23')
        self.assertEqual(parsed, ('foobar', 'oppia', '23'))

    def test_valid_url_ending_slash(self):
        parsed = check_if_pr_is_low_risk.parse_pr_url(
            'https://github.com/foobar/oppia/pull/23/')
        self.assertEqual(parsed, ('foobar', 'oppia', '23'))

    def test_invalid_url_empty(self):
        parsed = check_if_pr_is_low_risk.parse_pr_url('')
        self.assertIsNone(parsed)

    def test_invalid_url_malformed(self):
        parsed = check_if_pr_is_low_risk.parse_pr_url(
            'https://github.com/foobar/oppia/issues/23')
        self.assertIsNone(parsed)


class LoadDiffTests(test_utils.GenericTestBase):

    def setUp(self):
        super(LoadDiffTests, self).setUp()
        self.url = (
            'https://patch-diff.githubusercontent.com'
            '/raw/oppia/oppia/pull/1'
        )

    def test_rstrips_diff(self):

        def mock_url_request(unused_url, unused_body, unused_headers):
            data = (
                'diff --git a/foo.py b/bar.py\n'
                'index 11af605ef2b7..89d00105ca66 100644\n'
                '--- a/foo.py\n'
                '+++ b/bar.py\n'
                '@@ -32,6 +32,7 @@ def hello():\n'
                '     s = "Hello, "\n'
                '     s += "World!"\n'
                '-    print(s)\n'
                '+    python_utils.PRINT(s)\n'
                '     return s\n'
            )
            return MockResponse(data=data)

        url_request_swap = self.swap_with_checks(
            python_utils, 'url_request', mock_url_request,
            expected_args=[
                (self.url, None, None),
            ])

        with url_request_swap:
            diff = check_if_pr_is_low_risk.load_diff(self.url)

        expected_diff = [
            'diff --git a/foo.py b/bar.py',
            'index 11af605ef2b7..89d00105ca66 100644',
            '--- a/foo.py',
            '+++ b/bar.py',
            '@@ -32,6 +32,7 @@ def hello():',
            '     s = "Hello, "',
            '     s += "World!"',
            '-    print(s)',
            '+    python_utils.PRINT(s)',
            '     return s',
        ]
        self.assertListEqual(diff, expected_diff)

    def test_empty_diff(self):

        def mock_url_request(unused_url, unused_body, unused_headers):
            return MockResponse()

        url_request_swap = self.swap_with_checks(
            python_utils, 'url_request', mock_url_request,
            expected_args=[
                (self.url, None, None),
            ])

        with url_request_swap:
            diff = check_if_pr_is_low_risk.load_diff(self.url)

        self.assertListEqual(diff, [])

    def test_api_failure(self):

        def mock_url_request(unused_url, unused_body, unused_headers):
            return MockResponse(code=404)

        url_request_swap = self.swap_with_checks(
            python_utils, 'url_request', mock_url_request,
            expected_args=[
                (self.url, None, None),
            ])

        with url_request_swap:
            diff = check_if_pr_is_low_risk.load_diff(self.url)

        self.assertListEqual(diff, [])


class LookupPrTests(test_utils.GenericTestBase):

    def setUp(self):
        super(LookupPrTests, self).setUp()
        self.url = (
            'https://api.github.com/repos/oppia/oppia/pulls/1')
        self.headers = {
            'Accept': 'application/vnd.github.v3+json'
        }

    def test_pr_found(self):

        def mock_url_open(unused_request):
            data = '{"a": "foo", "b": 10}'
            return MockResponse(data=data)

        url_open_swap = self.swap(
            python_utils, 'url_open', mock_url_open)

        with url_open_swap:
            pr = check_if_pr_is_low_risk.lookup_pr(
                'oppia', 'oppia', '1')

        expected_pr = {
            'a': 'foo',
            'b': 10,
        }
        self.assertDictEqual(pr, expected_pr)

    def test_pr_not_found(self):

        def mock_url_open(unused_request):
            return MockResponse(code=404)

        url_open_swap = self.swap(
            python_utils, 'url_open', mock_url_open)

        with url_open_swap:
            pr = check_if_pr_is_low_risk.lookup_pr(
                'oppia', 'oppia', '1')

        self.assertDictEqual(pr, {})


class ParseDiffTests(test_utils.GenericTestBase):

    def test_strip_contxet(self):
        diff = [
            'diff --git a/foo.py b/bar.py',
            'index 11af605ef2b7..89d00105ca66 100644',
            '--- a/foo.py',
            '+++ b/bar.py',
            '@@ -32,6 +32,7 @@ def hello():',
            '     s = "Hello, "',
            '     s += "World!"',
            '-    print(s)',
            '+    python_utils.PRINT(s)',
            '     return s',
        ]
        parsed = check_if_pr_is_low_risk.parse_diff(diff)
        expected_parsed = {
            ('foo.py', 'bar.py'): [
                '-    print(s)',
                '+    python_utils.PRINT(s)',
            ],
        }
        self.assertDictEqual(parsed, expected_parsed)

    def test_multiple_files(self):
        diff = [
            'diff --git a/foo.py b/foo.py',
            'index 11af605ef2b7..89d00105ca66 100644',
            '--- a/foo.py',
            '+++ b/foo.py',
            '@@ -32,6 +32,7 @@ def hello():',
            '     s = "Hello, "',
            '     s += "World!"',
            '-    print(s)',
            '+    python_utils.PRINT(s)',
            '     return s',
            'diff --git a/bar.py b/bar2.py',
            'index 11af605ef2b7..89d00105ca66 100644',
            '--- a/bar.py',
            '+++ b/bar2.py',
            '@@ -32,6 +32,7 @@ def hello():',
            '     s = "Hello, "',
            '     s += "World!"',
            '-    print(s)',
            '+    print(s.lower())',
            '     return s',
        ]
        parsed = check_if_pr_is_low_risk.parse_diff(diff)
        expected_parsed = {
            ('foo.py', 'foo.py'): [
                '-    print(s)',
                '+    python_utils.PRINT(s)',
            ],
            ('bar.py', 'bar2.py'): [
                '-    print(s)',
                '+    print(s.lower())',
            ],
        }
        self.assertEqual(parsed, expected_parsed)


def _make_pr(source_repo, source_branch, diff_url):
    """Create a PR JSON object."""
    return {
        'head': {
            'repo': {
                'full_name': source_repo,
            },
            'ref': source_branch,
        },
        'diff_url': diff_url,
    }


class CheckIfPrIsTranslationPrTests(test_utils.GenericTestBase):

    def test_valid_pr_is_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'
        diff_raw = 'Mock Diff'

        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            diff_url)

        def mock_load_diff(unused_url):
            return diff_raw

        def mock_parse_diff(unused_diff):
            return {
                ('assets/i18n/foo.json', 'assets/i18n/foo.json'): [
                    '-    foo',
                    '+    bar',
                ],
            }

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])
        parse_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_diff', mock_parse_diff,
            expected_args=[
                (diff_raw,),
            ])

        with load_diff_swap, parse_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
                pr)
            self.assertEqual(msg, '')

    def test_fork_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'

        pr = _make_pr(
            'foo/oppia',
            'translatewiki-prs',
            diff_url)

        msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
            pr)
        self.assertEqual(msg, 'Source repo is not oppia/oppia')

    def test_other_branch_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'

        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs ',
            diff_url)

        msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
            pr)
        self.assertEqual(
            msg,
            'Source branch is not translatewiki-prs')

    def test_no_diff_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'

        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            diff_url)

        def mock_load_diff(unused_url):
            return ''

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])

        with load_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
                pr)
            self.assertEqual(
                msg,
                'Failed to load PR diff from GitHub API')

    def test_filename_change_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'
        diff_raw = 'Mock Diff'

        filename_a = 'assets/i18n/foo.json'
        filename_b = 'assets/i18n/bar.json'

        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            diff_url)

        def mock_load_diff(unused_url):
            return diff_raw

        def mock_parse_diff(unused_diff):
            return {
                (filename_a, filename_b): [
                    '-    foo',
                    '+    bar',
                ],
            }

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])
        parse_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_diff', mock_parse_diff,
            expected_args=[
                (diff_raw,),
            ])

        with load_diff_swap, parse_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
                pr)
            self.assertEqual(
                msg,
                'File name change: {} -> {}'.format(
                    filename_a, filename_b))

    def test_py_file_change_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'
        diff_raw = 'Mock Diff'

        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            diff_url)

        def mock_load_diff(unused_url):
            return diff_raw

        def mock_parse_diff(unused_diff):
            return {
                ('assets/i18n/foo.py', 'assets/i18n/foo.py'): [
                    '-    foo',
                    '+    bar',
                ],
            }

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])
        parse_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_diff', mock_parse_diff,
            expected_args=[
                (diff_raw,),
            ])

        with load_diff_swap, parse_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
                pr)
            self.assertEqual(
                msg, 'File assets/i18n/foo.py changed and not low-risk')


class CheckIfPrIsChangelogPrTests(test_utils.GenericTestBase):

    def test_valid_pr_is_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'
        diff_raw = 'Mock Diff'

        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            diff_url)

        def mock_load_diff(unused_url):
            return diff_raw

        def mock_parse_diff(unused_diff):
            return {
                ('AUTHORS', 'AUTHORS'): [
                    '-    foo',
                    '+    bar',
                ],
                ('CONTRIBUTORS', 'CONTRIBUTORS'): [
                    '-    foo',
                    '+    bar',
                ],
                ('CHANGELOG', 'CHANGELOG'): [
                    '-    foo',
                    '+    bar',
                ],
                ('package.json', 'package.json'): [
                    '-  "version": "0.3.0",',
                    '+  "version": "0.3.1",',
                ],
                (
                    'core/templates/pages/about-page/about-page.constants.ts',
                    'core/templates/pages/about-page/about-page.constants.ts',
                ): [
                    '+    \'Foo Bar\',',
                ],
            }

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])
        parse_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_diff', mock_parse_diff,
            expected_args=[
                (diff_raw,),
            ])

        with load_diff_swap, parse_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
                pr)
            self.assertEqual(msg, '')

    def test_fork_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'

        pr = _make_pr(
            'foo/oppia',
            'update-changelog-for-release-v0.3.1',
            diff_url)

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr)
        self.assertEqual(msg, 'Source repo is not oppia/oppia')

    def test_other_branch_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'

        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1 ',
            diff_url)

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr)
        self.assertEqual(
            msg, 'Source branch does not indicate a changelog PR')

    def test_no_diff_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'

        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            diff_url)

        def mock_load_diff(unused_url):
            return ''

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])

        with load_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
                pr)
            self.assertEqual(
                msg,
                'Failed to load PR diff from GitHub API')

    def test_risky_file_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'
        diff_raw = 'Mock Diff'

        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            diff_url)

        def mock_load_diff(unused_url):
            return diff_raw

        def mock_parse_diff(unused_diff):
            return {
                ('scripts/start.py', 'scripts/start.py'): [
                    '-    foo',
                    '+    bar',
                ],
            }

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])
        parse_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_diff', mock_parse_diff,
            expected_args=[
                (diff_raw,),
            ])

        with load_diff_swap, parse_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
                pr)
            self.assertEqual(
                msg, 'File scripts/start.py changed and not low-risk')

    def test_rename_file_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'
        diff_raw = 'Mock Diff'

        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            diff_url)

        def mock_load_diff(unused_url):
            return diff_raw

        def mock_parse_diff(unused_diff):
            return {
                ('AUTHORS', 'scripts/start.py'): [
                    '-    foo',
                    '+    bar',
                ],
            }

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])
        parse_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_diff', mock_parse_diff,
            expected_args=[
                (diff_raw,),
            ])

        with load_diff_swap, parse_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
                pr)
            self.assertEqual(
                msg, 'File name change: AUTHORS -> scripts/start.py')

    def test_package_json_addition_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'
        diff_raw = 'Mock Diff'

        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            diff_url)

        def mock_load_diff(unused_url):
            return diff_raw

        def mock_parse_diff(unused_diff):
            return {
                ('package.json', 'package.json'): [
                    '-  "version": "0.3.0",',
                    '+  "version": "0.3.1",',
                    '+  "foo": "bar",',
                ],
            }

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])
        parse_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_diff', mock_parse_diff,
            expected_args=[
                (diff_raw,),
            ])

        with load_diff_swap, parse_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
                pr)
            self.assertEqual(
                msg, 'Only 1 line should change in package.json')

    def test_risky_package_json_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'
        diff_raw = 'Mock Diff'

        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            diff_url)

        def mock_load_diff(unused_url):
            return diff_raw

        def mock_parse_diff(unused_diff):
            return {
                ('package.json', 'package.json'): [
                    '-    foo: 1,',
                    '+    foo: 2,',
                ],
            }

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])
        parse_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_diff', mock_parse_diff,
            expected_args=[
                (diff_raw,),
            ])

        with load_diff_swap, parse_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
                pr)
            self.assertEqual(
                msg, 'package.json changes not low-risk')

    def test_risky_constants_pr_is_not_low_risk(self):
        diff_url = 'https://github.com/oppia/oppia/pull/1.diff'
        diff_raw = 'Mock Diff'

        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            diff_url)

        def mock_load_diff(unused_url):
            return diff_raw

        def mock_parse_diff(unused_diff):
            return {
                (
                    'core/templates/pages/about-page/about-page.constants.ts',
                    'core/templates/pages/about-page/about-page.constants.ts',
                ): [
                    '+    \'Foo Bar\': {',
                ],
            }

        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                (diff_url,),
            ])
        parse_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_diff', mock_parse_diff,
            expected_args=[
                (diff_raw,),
            ])

        with load_diff_swap, parse_diff_swap:
            msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
                pr)
            self.assertEqual(
                msg, 'about-page.constants.ts changes not low-risk')


class MainTests(test_utils.GenericTestBase):

    def test_low_risk_translation(self):
        url = 'https://github.com/oppia/oppia/pull/1'
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            url)

        def mock_parse_url(unused_url):
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(unused_owner, unused_repo, unused_number):
            return pr

        def mock_check_if_pr_is_translation_pr(pr_to_check):
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            return ''

        def mock_check_if_pr_is_changelog_pr(pr_to_check):
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            return 'Source branch does not indicate a changelog PR'

        mock_low_risk_checkers = (
            ('changelog', mock_check_if_pr_is_changelog_pr),
            ('translatewiki', mock_check_if_pr_is_translation_pr),
        )

        parse_url_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_pr_url', mock_parse_url,
            expected_args=[
                (url,),
            ])
        lookup_pr_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'lookup_pr', mock_lookup_pr,
            expected_args=[
                ('oppia', 'oppia', '1'),
            ])
        low_risk_checkers_swap = self.swap(
            check_if_pr_is_low_risk, 'LOW_RISK_CHECKERS',
            mock_low_risk_checkers)
        print_swap = self.swap_with_checks(
            python_utils, 'PRINT', python_utils.PRINT, expected_args=[
                (
                    'PR is not a low-risk PR of type changelog '
                    'because: Source branch does not indicate a '
                    'changelog PR',
                ),
                ('PR is low-risk. Skipping some CI checks.',),
            ])

        with parse_url_swap, lookup_pr_swap, print_swap:
            with low_risk_checkers_swap:
                code = check_if_pr_is_low_risk.main(tokens=[url])
                self.assertEqual(code, 0)

    def test_low_risk_changelog(self):
        url = 'https://github.com/oppia/oppia/pull/1'
        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            url)

        def mock_parse_url(unused_url):
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(unused_owner, unused_repo, unused_number):
            return pr

        def mock_check_if_pr_is_translation_pr(pr_to_check):
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            return 'Source branch does not indicate a translatewiki PR'

        def mock_check_if_pr_is_changelog_pr(pr_to_check):
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            return ''

        mock_low_risk_checkers = (
            ('translatewiki', mock_check_if_pr_is_translation_pr),
            ('changelog', mock_check_if_pr_is_changelog_pr),
        )

        parse_url_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_pr_url', mock_parse_url,
            expected_args=[
                (url,),
            ])
        lookup_pr_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'lookup_pr', mock_lookup_pr,
            expected_args=[
                ('oppia', 'oppia', '1'),
            ])
        low_risk_checkers_swap = self.swap(
            check_if_pr_is_low_risk, 'LOW_RISK_CHECKERS',
            mock_low_risk_checkers)
        print_swap = self.swap_with_checks(
            python_utils, 'PRINT', python_utils.PRINT, expected_args=[
                (
                    'PR is not a low-risk PR of type translatewiki '
                    'because: Source branch does not indicate a '
                    'translatewiki PR',
                ),
                ('PR is low-risk. Skipping some CI checks.',),
            ])

        with parse_url_swap, lookup_pr_swap, print_swap:
            with low_risk_checkers_swap:
                code = check_if_pr_is_low_risk.main(tokens=[url])
                self.assertEqual(code, 0)

    def test_risky_translation(self):
        url = 'https://github.com/oppia/oppia/pull/1'
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            url)

        def mock_parse_url(unused_url):
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(unused_owner, unused_repo, unused_number):
            return pr

        def mock_check_if_pr_is_translation_pr(pr_to_check):
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            return 'Invalid change foo'

        def mock_check_if_pr_is_changelog_pr(pr_to_check):
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            return 'Source branch does not indicate a changelog PR'

        mock_low_risk_checkers = (
            ('translatewiki', mock_check_if_pr_is_translation_pr),
            ('changelog', mock_check_if_pr_is_changelog_pr),
        )

        parse_url_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_pr_url', mock_parse_url,
            expected_args=[
                (url,),
            ])
        lookup_pr_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'lookup_pr', mock_lookup_pr,
            expected_args=[
                ('oppia', 'oppia', '1'),
            ])
        low_risk_checkers_swap = self.swap(
            check_if_pr_is_low_risk, 'LOW_RISK_CHECKERS',
            mock_low_risk_checkers)
        print_swap = self.swap_with_checks(
            python_utils, 'PRINT', python_utils.PRINT, expected_args=[
                (
                    'PR is not a low-risk PR of type translatewiki '
                    'because: Invalid change foo',
                ),
                (
                    'PR is not a low-risk PR of type changelog '
                    'because: Source branch does not indicate a '
                    'changelog PR',
                ),
                ('PR is not low-risk. Running all CI checks.',),
            ])

        with parse_url_swap, lookup_pr_swap, print_swap:
            with low_risk_checkers_swap:
                code = check_if_pr_is_low_risk.main(tokens=[url])
                self.assertEqual(code, 1)

    def test_risky_changelog(self):
        url = 'https://github.com/oppia/oppia/pull/1'
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            url)

        def mock_parse_url(unused_url):
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(unused_owner, unused_repo, unused_number):
            return pr

        def mock_check_if_pr_is_translation_pr(pr_to_check):
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            return 'Source branch does not indicate a translatewiki PR'

        def mock_check_if_pr_is_changelog_pr(pr_to_check):
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            return 'Invalid change foo'

        mock_low_risk_checkers = (
            ('translatewiki', mock_check_if_pr_is_translation_pr),
            ('changelog', mock_check_if_pr_is_changelog_pr),
        )

        parse_url_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_pr_url', mock_parse_url,
            expected_args=[
                (url,),
            ])
        lookup_pr_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'lookup_pr', mock_lookup_pr,
            expected_args=[
                ('oppia', 'oppia', '1'),
            ])
        low_risk_checkers_swap = self.swap(
            check_if_pr_is_low_risk, 'LOW_RISK_CHECKERS',
            mock_low_risk_checkers)
        print_swap = self.swap_with_checks(
            python_utils, 'PRINT', python_utils.PRINT, expected_args=[
                (
                    'PR is not a low-risk PR of type translatewiki '
                    'because: Source branch does not indicate a '
                    'translatewiki PR',
                ),
                (
                    'PR is not a low-risk PR of type changelog '
                    'because: Invalid change foo',
                ),
                ('PR is not low-risk. Running all CI checks.',),
            ])

        with parse_url_swap, lookup_pr_swap, print_swap:
            with low_risk_checkers_swap:
                code = check_if_pr_is_low_risk.main(tokens=[url])
                self.assertEqual(code, 1)

    def test_url_parsing_failure(self):
        url = 'https://github.com/oppia/oppia/pull/1'

        def mock_parse_url(unused_url):
            return None

        parse_url_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_pr_url', mock_parse_url,
            expected_args=[
                (url,),
            ])

        with parse_url_swap:
            with self.assertRaisesRegexp(
                RuntimeError,
                'Failed to parse PR URL %s' % url,
            ):
                check_if_pr_is_low_risk.main(tokens=[url])

    def test_pr_loading_failure(self):
        url = 'https://github.com/oppia/oppia/pull/1'

        def mock_parse_url(unused_url):
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(unused_owner, unused_repo, unused_number):
            return {}

        parse_url_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_pr_url', mock_parse_url,
            expected_args=[
                (url,),
            ])
        lookup_pr_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'lookup_pr', mock_lookup_pr,
            expected_args=[
                ('oppia', 'oppia', '1'),
            ])

        with parse_url_swap, lookup_pr_swap:
            with self.assertRaisesRegexp(
                RuntimeError,
                'Failed to load PR from GitHub API',
            ):
                check_if_pr_is_low_risk.main(tokens=[url])
