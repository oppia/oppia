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

from __future__ import annotations

import builtins
import io
import urllib

from core import utils
from core.tests import test_utils
from scripts import check_if_pr_is_low_risk
from scripts import common

from typing import Dict, List, Optional, Tuple


class MockResponse(io.StringIO):
    """Mock for the objects returned by urllib2.url_open."""

    def __init__(self, data: str = '', code: int = 200) -> None:
        """Create a new mock object for the objects returned by
        url_open.

        Args:
            data: str. Response data.
            code: int. HTTP response code.
        """
        super().__init__(data)
        self.code = code

    def getcode(self) -> int:
        """Get the HTTP response code."""
        return self.code


class ParsePrUrlTests(test_utils.GenericTestBase):

    def test_valid_url(self) -> None:
        parsed = check_if_pr_is_low_risk.parse_pr_url(
            'https://github.com/foobar/oppia/pull/23')
        self.assertEqual(parsed, ('foobar', 'oppia', '23'))

    def test_valid_url_ending_slash(self) -> None:
        parsed = check_if_pr_is_low_risk.parse_pr_url(
            'https://github.com/foobar/oppia/pull/23/')
        self.assertEqual(parsed, ('foobar', 'oppia', '23'))

    def test_invalid_url_empty(self) -> None:
        parsed = check_if_pr_is_low_risk.parse_pr_url('')
        self.assertIsNone(parsed)

    def test_invalid_url_malformed(self) -> None:
        parsed = check_if_pr_is_low_risk.parse_pr_url(
            'https://github.com/foobar/oppia/issues/23')
        self.assertIsNone(parsed)


class LoadDiffTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.url = (
            'https://patch-diff.githubusercontent.com'
            '/raw/oppia/oppia/pull/1'
        )

    def test_parse_multifile_diff(self) -> None:

        def mock_run_cmd(tokens: List[str]) -> str:
            if '--name-status' in tokens:
                return (
                    'M       modified\n'
                    'R099    old      new\n'
                    'A       added\n'
                    'M       diff-unnecessary\n'
                )
            if tokens[-1] == 'modified':
                return (
                    'diff --git a/modififed b/modified\n'
                    'index 11af605ef2b7..89d00105ca66 100644\n'
                    '--- a/modified\n'
                    '+++ b/modified\n'
                    '@@ -32,6 +32,7 @@ def hello():\n'
                    '-    print(s)\n'
                    '+    print(s)\n'
                )
            if tokens[-1] == 'old':
                return (
                    'diff --git a/old b/old\n'
                    'index 11af605ef2b7..89d00105ca66 100644\n'
                    '--- a/old\n'
                    '+++ /dev/null\n'
                    '@@ -32,6 +32,7 @@ def hello():\n'
                    '-    print(s)\n'
                    '-    print(s)\n'
                )
            if tokens[-1] == 'new':
                return (
                    'diff --git a/new b/new\n'
                    'index 11af605ef2b7..89d00105ca66 100644\n'
                    '--- /dev/null\n'
                    '+++ b/new\n'
                    '@@ -32,6 +32,7 @@ def hello():\n'
                    '+    print(s)\n'
                    '+    print(s)\n'
                )
            if tokens[-1] == 'added':
                return (
                    'diff --git a/added b/added\n'
                    'index 11af605ef2b7..89d00105ca66 100644\n'
                    '--- /dev/null\n'
                    '+++ b/added\n'
                    '@@ -32,6 +32,7 @@ def hello():\n'
                    '+    print(s)\n'
                    '+    print(s)\n'
                )
            raise AssertionError(
                'Unknown args to mock_run_cmd: %s' % tokens)

        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                ([
                    'git', 'diff', '--name-status',
                    'upstream/develop'],),
                ([
                    'git', 'diff', '-U0', 'upstream/develop', '--',
                    'modified'],),
                ([
                    'git', 'diff', '-U0', 'upstream/develop', '--',
                    'old'],),
                ([
                    'git', 'diff', '-U0', 'upstream/develop', '--',
                    'new'],),
                ([
                    'git', 'diff', '-U0', 'upstream/develop', '--',
                    'added'],),
            ])
        files_that_need_diffs_swap = self.swap(
            check_if_pr_is_low_risk, 'FILES_THAT_NEED_DIFFS',
            ('modified', 'old', 'new', 'added'),
        )

        with run_cmd_swap, files_that_need_diffs_swap:
            diff_files, file_diffs = check_if_pr_is_low_risk.load_diff(
                'develop')

        expected_diff_files = [
            ('modified', 'modified'),
            ('old', 'new'),
            ('added', 'added'),
            ('diff-unnecessary', 'diff-unnecessary'),
        ]
        expected_file_diffs = {
            'modified': [
                '-    print(s)',
                '+    print(s)',
            ],
            'old': [
                '-    print(s)',
                '-    print(s)',
            ],
            'new': [
                '+    print(s)',
                '+    print(s)',
            ],
            'added': [
                '+    print(s)',
                '+    print(s)',
            ],
        }
        self.assertListEqual(diff_files, expected_diff_files)
        self.assertDictEqual(file_diffs, expected_file_diffs)

    def test_name_status_failure(self) -> None:

        def mock_run_cmd(unused_tokens: List[str]) -> str:
            return (
                'A B C D\n'
            )

        def mock_print(unused_str: str) -> None:
            pass

        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                ([
                    'git', 'diff', '--name-status',
                    'upstream/develop'],),
            ])
        print_swap = self.swap_with_checks(
            builtins, 'print', mock_print,
            expected_args=[
                ('Failed to parse diff --name-status line "A B C D"',),
            ])

        with run_cmd_swap, print_swap:
            diff_files, file_diffs = check_if_pr_is_low_risk.load_diff(
                'develop')

        self.assertListEqual(diff_files, [])
        self.assertDictEqual(file_diffs, {})

    def test_parse_diff_failure_no_diff(self) -> None:

        def mock_run_cmd(tokens: List[str]) -> Optional[str]:
            if '--name-status' in tokens:
                return (
                    'M       modified\n'
                )
            if tokens[-1] == 'modified':
                return (
                    'diff --git a/modififed b/modified\n'
                    'index 11af605ef2b7..89d00105ca66 100644\n'
                    '--- a/modified\n'
                    '+++ b/modified\n'
                )
            return None

        def mock_print(unused_str: str) -> None:
            pass

        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                ([
                    'git', 'diff', '--name-status',
                    'upstream/develop'],),
                ([
                    'git', 'diff', '-U0', 'upstream/develop', '--',
                    'modified'],),
            ])
        print_swap = self.swap_with_checks(
            builtins, 'print', mock_print,
            expected_args=[
                ('Failed to find end of header in "modified" diff',),
            ])
        files_that_need_diffs_swap = self.swap(
            check_if_pr_is_low_risk, 'FILES_THAT_NEED_DIFFS',
            ('modified',),
        )

        with run_cmd_swap, print_swap, files_that_need_diffs_swap:
            diff_files, file_diffs = check_if_pr_is_low_risk.load_diff(
                'develop')

        self.assertListEqual(diff_files, [])
        self.assertDictEqual(file_diffs, {})


class LookupPrTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.url = (
            'https://api.github.com/repos/oppia/oppia/pulls/1')
        self.headers = {
            'Accept': 'application/vnd.github.v3+json'
        }

    def test_pr_found(self) -> None:

        def mock_url_open(
            unused_request: urllib.request.Request
        ) -> MockResponse:
            data = '{"a": "foo", "b": 10}'
            return MockResponse(data=data)

        url_open_swap = self.swap(
            utils, 'url_open', mock_url_open)

        with url_open_swap:
            pr = check_if_pr_is_low_risk.lookup_pr(
                'oppia', 'oppia', '1')

        expected_pr = {
            'a': 'foo',
            'b': 10,
        }
        assert pr is not None
        self.assertDictEqual(pr, expected_pr)

    def test_pr_not_found(self) -> None:

        def mock_url_open(
            unused_request: urllib.request.Request
        ) -> MockResponse:
            return MockResponse(code=404)

        url_open_swap = self.swap(
            utils, 'url_open', mock_url_open)

        with url_open_swap:
            pr = check_if_pr_is_low_risk.lookup_pr(
                'oppia', 'oppia', '1')

        self.assertEqual(pr, None)


def _make_pr(
    source_repo: str,
    source_branch: str,
    base_ref: str,
    base_url: str = ''
) -> check_if_pr_is_low_risk.PRDict:
    """Create a PR JSON object."""
    return {
        'head': {
            'repo': {
                'full_name': source_repo,
            },
            'ref': source_branch,
        },
        'base': {
            'ref': base_ref,
            'repo': {
                'clone_url': base_url,
            },
        },
    }


class CheckIfPrIsTranslationPrTests(test_utils.GenericTestBase):

    def test_valid_pr_is_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            'develop')

        diff_files = [
            ('assets/i18n/foo.json', 'assets/i18n/foo.json')]
        file_diffs: Dict[str, List[str]] = {}

        msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
            pr, diff_files, file_diffs)
        self.assertEqual(msg, '')

    def test_fork_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'foo/oppia',
            'translatewiki-prs',
            'develop')

        msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
            pr, [], {})
        self.assertEqual(msg, 'Source repo is not oppia/oppia')

    def test_other_branch_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs ',
            'develop')

        msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
            pr, [], {})
        self.assertEqual(
            msg,
            'Source branch is not translatewiki-prs')

    def test_non_develop_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            'foo')

        msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
            pr, [], {})
        self.assertEqual(
            msg, 'Base branch is not develop')

    def test_filename_change_pr_is_not_low_risk(self) -> None:
        filename_a = 'assets/i18n/foo.json'
        filename_b = 'assets/i18n/bar.json'

        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            'develop')

        diff_files = [(filename_a, filename_b)]
        file_diffs: Dict[str, List[str]] = {}

        msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
            pr, diff_files, file_diffs)
        self.assertEqual(
            msg,
            'File name change: {} -> {}'.format(
                filename_a, filename_b))

    def test_py_file_change_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            'develop')

        diff_files = [
            ('assets/i18n/foo.py', 'assets/i18n/foo.py')]
        file_diffs: Dict[str, List[str]] = {}

        msg = check_if_pr_is_low_risk.check_if_pr_is_translation_pr(
            pr, diff_files, file_diffs)
        self.assertEqual(
            msg, 'File assets/i18n/foo.py changed and not low-risk')


class CheckIfPrIsChangelogPrTests(test_utils.GenericTestBase):

    def test_valid_pr_is_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            'develop')

        diff_files = [
            ('AUTHORS', 'AUTHORS'),
            ('CONTRIBUTORS', 'CONTRIBUTORS'),
            ('CHANGELOG', 'CHANGELOG'),
            ('package.json', 'package.json'),
            (
                'core/templates/pages/about-page/about-page.constants.ts',
                'core/templates/pages/about-page/about-page.constants.ts',
            ),
        ]
        file_diffs = {
            'package.json': [
                '-  "version": "0.3.0",',
                '+  "version": "0.3.1",',
            ],
            'core/templates/pages/about-page/about-page.constants.ts': [
                '+    \'Foo Bar\',',
            ],
        }

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr, diff_files, file_diffs)
        self.assertEqual(msg, '')

    def test_fork_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'foo/oppia',
            'update-changelog-for-release-v0.3.1',
            'develop')

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr, [], {})
        self.assertEqual(msg, 'Source repo is not oppia/oppia')

    def test_other_branch_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1 ',
            'develop')

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr, [], {})
        self.assertEqual(
            msg, 'Source branch does not indicate a changelog PR')

    def test_non_develop_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            'foo')

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr, [], {})
        self.assertEqual(
            msg, 'Base branch is not develop')

    def test_risky_file_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            'develop')

        diff_files = [
            ('scripts/start.py', 'scripts/start.py')]
        file_diffs: Dict[str, List[str]] = {}

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr, diff_files, file_diffs)
        self.assertEqual(
            msg, 'File scripts/start.py changed and not low-risk')

    def test_rename_file_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            'develop')

        diff_files = [
            ('AUTHORS', 'scripts/start.py'),
        ]
        file_diffs: Dict[str, List[str]] = {}

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr, diff_files, file_diffs)
        self.assertEqual(
            msg, 'File name change: AUTHORS -> scripts/start.py')

    def test_package_json_addition_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            'develop')

        diff_files = [
            ('package.json', 'package.json')]
        file_diffs = {
            'package.json': [
                '-  "version": "0.3.0",',
                '+  "version": "0.3.1",',
                '+  "foo": "bar",',
            ],
        }

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr, diff_files, file_diffs)
        self.assertEqual(
            msg, 'Only 1 line should change in package.json')

    def test_risky_package_json_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            'develop')

        diff_files = [('package.json', 'package.json')]
        file_diffs = {
            'package.json': [
                '-    foo: 1,',
                '+    foo: 2,',
            ],
        }

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr, diff_files, file_diffs)
        self.assertEqual(
            msg, 'package.json changes not low-risk')

    def test_risky_constants_pr_is_not_low_risk(self) -> None:
        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            'develop')

        diff_files = [(
            'core/templates/pages/about-page/about-page.constants.ts',
            'core/templates/pages/about-page/about-page.constants.ts',
        )]
        file_diffs = {
            'core/templates/pages/about-page/about-page.constants.ts': [
                '+    \'Foo Bar\': {',
            ],
        }

        msg = check_if_pr_is_low_risk.check_if_pr_is_changelog_pr(
            pr, diff_files, file_diffs)
        self.assertEqual(
            msg, 'about-page.constants.ts changes not low-risk')


class MainTests(test_utils.GenericTestBase):

    def test_low_risk_translation(self) -> None:
        url = 'https://github.com/oppia/oppia/pull/1'
        repo_url = 'https://github.com/oppia/oppia.git'
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            'develop',
            base_url=repo_url)
        diff_files = [('a', 'b')]
        file_diffs = {'a': ['- b']}

        def mock_parse_url(unused_url: str) -> Tuple[str, str, str]:
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(
            unused_owner: str, unused_repo: str, unused_number: int
        ) -> check_if_pr_is_low_risk.PRDict:
            return pr

        def mock_check_if_pr_is_translation_pr(
            pr_to_check: check_if_pr_is_low_risk.PRDict,
            diff_files_to_check: List[Tuple[str, str]],
            file_diffs_to_check: Dict[str, List[str]]
        ) -> str:
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            if diff_files_to_check != diff_files:
                raise AssertionError(
                    'Incorrect diff_files passed to checker.')
            if file_diffs_to_check != file_diffs:
                raise AssertionError(
                    'Incorrect file_diffs passed to checker.')
            return ''

        def mock_check_if_pr_is_changelog_pr(
            pr_to_check: check_if_pr_is_low_risk.PRDict,
            diff_files_to_check: List[Tuple[str, str]],
            file_diffs_to_check: Dict[str, List[str]]
        ) -> str:
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            if diff_files_to_check != diff_files:
                raise AssertionError(
                    'Incorrect diff_files passed to checker.')
            if file_diffs_to_check != file_diffs:
                raise AssertionError(
                    'Incorrect file_diffs passed to checker.')
            return 'Source branch does not indicate a changelog PR'

        def mock_run_cmd(unused_tokens: List[str]) -> None:
            pass

        def mock_load_diff(
            unused_base_branch: str
        ) -> Tuple[List[Tuple[str, str]], Dict[str, List[str]]]:
            return diff_files, file_diffs

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
            builtins, 'print', print, expected_args=[
                (
                    'PR is not a low-risk PR of type changelog '
                    'because: Source branch does not indicate a '
                    'changelog PR',
                ),
                ('PR is low-risk. Skipping some CI checks.',),
            ])
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                (['git', 'remote', 'add', 'upstream', repo_url],),
                (['git', 'fetch', 'upstream', 'develop'],),
            ])
        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                ('develop',),
            ])

        with parse_url_swap, lookup_pr_swap, print_swap, load_diff_swap:
            with low_risk_checkers_swap, run_cmd_swap:
                code = check_if_pr_is_low_risk.main(tokens=[url])
                self.assertEqual(code, 0)

    def test_low_risk_changelog(self) -> None:
        url = 'https://github.com/oppia/oppia/pull/1'
        repo_url = 'https://github.com/oppia/oppia.git'
        pr = _make_pr(
            'oppia/oppia',
            'update-changelog-for-release-v0.3.1',
            'develop',
            base_url=repo_url)
        diff_files = [('a', 'b')]
        file_diffs = {'a': ['- b']}

        def mock_parse_url(unused_url: str) -> Tuple[str, str, str]:
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(
            unused_owner: str, unused_repo: str, unused_number: int
        ) -> check_if_pr_is_low_risk.PRDict:
            return pr

        def mock_check_if_pr_is_translation_pr(
            pr_to_check: check_if_pr_is_low_risk.PRDict,
            diff_files_to_check: List[Tuple[str, str]],
            file_diffs_to_check: Dict[str, List[str]]
        ) -> str:
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            if diff_files_to_check != diff_files:
                raise AssertionError(
                    'Incorrect diff_files passed to checker.')
            if file_diffs_to_check != file_diffs:
                raise AssertionError(
                    'Incorrect file_diffs passed to checker.')
            return 'Source branch does not indicate a translatewiki PR'

        def mock_check_if_pr_is_changelog_pr(
            pr_to_check: check_if_pr_is_low_risk.PRDict,
            diff_files_to_check: List[Tuple[str, str]],
            file_diffs_to_check: Dict[str, List[str]]
        ) -> str:
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            if diff_files_to_check != diff_files:
                raise AssertionError(
                    'Incorrect diff_files passed to checker.')
            if file_diffs_to_check != file_diffs:
                raise AssertionError(
                    'Incorrect file_diffs passed to checker.')
            return ''

        def mock_run_cmd(unused_tokens: List[str]) -> None:
            pass

        def mock_load_diff(
            unused_base_branch: str
        ) -> Tuple[List[Tuple[str, str]], Dict[str, List[str]]]:
            return diff_files, file_diffs

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
            builtins, 'print', print, expected_args=[
                (
                    'PR is not a low-risk PR of type translatewiki '
                    'because: Source branch does not indicate a '
                    'translatewiki PR',
                ),
                ('PR is low-risk. Skipping some CI checks.',),
            ])
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                (['git', 'remote', 'add', 'upstream', repo_url],),
                (['git', 'fetch', 'upstream', 'develop'],),
            ])
        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                ('develop',),
            ])

        with parse_url_swap, lookup_pr_swap, print_swap, load_diff_swap:
            with low_risk_checkers_swap, run_cmd_swap:
                code = check_if_pr_is_low_risk.main(tokens=[url])
                self.assertEqual(code, 0)

    def test_risky_translation(self) -> None:
        url = 'https://github.com/oppia/oppia/pull/1'
        repo_url = 'https://github.com/oppia/oppia.git'
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            'develop',
            base_url=repo_url)
        diff_files = [('a', 'b')]
        file_diffs = {'a': ['- b']}

        def mock_parse_url(unused_url: str) -> Tuple[str, str, str]:
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(
            unused_owner: str, unused_repo: str, unused_number: int
        ) -> check_if_pr_is_low_risk.PRDict:
            return pr

        def mock_check_if_pr_is_translation_pr(
            pr_to_check: check_if_pr_is_low_risk.PRDict,
            diff_files_to_check: List[Tuple[str, str]],
            file_diffs_to_check: Dict[str, List[str]]
        ) -> str:
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            if diff_files_to_check != diff_files:
                raise AssertionError(
                    'Incorrect diff_files passed to checker.')
            if file_diffs_to_check != file_diffs:
                raise AssertionError(
                    'Incorrect file_diffs passed to checker.')
            return 'Invalid change foo'

        def mock_check_if_pr_is_changelog_pr(
            pr_to_check: check_if_pr_is_low_risk.PRDict,
            diff_files_to_check: List[Tuple[str, str]],
            file_diffs_to_check: Dict[str, List[str]]
        ) -> str:
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            if diff_files_to_check != diff_files:
                raise AssertionError(
                    'Incorrect diff_files passed to checker.')
            if file_diffs_to_check != file_diffs:
                raise AssertionError(
                    'Incorrect file_diffs passed to checker.')
            return 'Source branch does not indicate a changelog PR'

        def mock_run_cmd(unused_tokens: List[str]) -> None:
            pass

        def mock_load_diff(
            unused_base_branch: str
        ) -> Tuple[List[Tuple[str, str]], Dict[str, List[str]]]:
            return diff_files, file_diffs

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
            builtins, 'print', print, expected_args=[
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
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                (['git', 'remote', 'add', 'upstream', repo_url],),
                (['git', 'fetch', 'upstream', 'develop'],),
            ])
        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                ('develop',),
            ])

        with parse_url_swap, lookup_pr_swap, print_swap, load_diff_swap:
            with low_risk_checkers_swap, run_cmd_swap:
                code = check_if_pr_is_low_risk.main(tokens=[url])
                self.assertEqual(code, 1)

    def test_risky_changelog(self) -> None:
        url = 'https://github.com/oppia/oppia/pull/1'
        repo_url = 'https://github.com/oppia/oppia.git'
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            'develop',
            base_url=repo_url)
        diff_files = [('a', 'b')]
        file_diffs = {'a': ['- b']}

        def mock_parse_url(unused_url: str) -> Tuple[str, str, str]:
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(
            unused_owner: str, unused_repo: str, unused_number: int
        ) -> check_if_pr_is_low_risk.PRDict:
            return pr

        def mock_check_if_pr_is_translation_pr(
            pr_to_check: check_if_pr_is_low_risk.PRDict,
            diff_files_to_check: List[Tuple[str, str]],
            file_diffs_to_check: Dict[str, List[str]]
        ) -> str:
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            if diff_files_to_check != diff_files:
                raise AssertionError(
                    'Incorrect diff_files passed to checker.')
            if file_diffs_to_check != file_diffs:
                raise AssertionError(
                    'Incorrect file_diffs passed to checker.')
            return 'Source branch does not indicate a translatewiki PR'

        def mock_check_if_pr_is_changelog_pr(
            pr_to_check: check_if_pr_is_low_risk.PRDict,
            diff_files_to_check: List[Tuple[str, str]],
            file_diffs_to_check: Dict[str, List[str]]
        ) -> str:
            if pr_to_check != pr:
                raise AssertionError(
                    'Provided PR to checker does not match expected PR.')
            if diff_files_to_check != diff_files:
                raise AssertionError(
                    'Incorrect diff_files passed to checker.')
            if file_diffs_to_check != file_diffs:
                raise AssertionError(
                    'Incorrect file_diffs passed to checker.')
            return 'Invalid change foo'

        def mock_run_cmd(unused_tokens: List[str]) -> None:
            pass

        def mock_load_diff(
            unused_base_branch: str
        ) -> Tuple[List[Tuple[str, str]], Dict[str, List[str]]]:
            return diff_files, file_diffs

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
            builtins, 'print', print, expected_args=[
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
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                (['git', 'remote', 'add', 'upstream', repo_url],),
                (['git', 'fetch', 'upstream', 'develop'],),
            ])
        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                ('develop',),
            ])

        with parse_url_swap, lookup_pr_swap, print_swap, load_diff_swap:
            with low_risk_checkers_swap, run_cmd_swap:
                code = check_if_pr_is_low_risk.main(tokens=[url])
                self.assertEqual(code, 1)

    def test_url_parsing_failure(self) -> None:
        url = 'https://github.com/oppia/oppia/pull/1'

        def mock_parse_url(unused_url: str) -> None:
            return None

        parse_url_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'parse_pr_url', mock_parse_url,
            expected_args=[
                (url,),
            ])

        with parse_url_swap:
            with self.assertRaisesRegex(
                RuntimeError,
                'Failed to parse PR URL %s' % url,
            ):
                check_if_pr_is_low_risk.main(tokens=[url])

    def test_pr_loading_failure(self) -> None:
        url = 'https://github.com/oppia/oppia/pull/1'

        def mock_parse_url(unused_url: str) -> Tuple[str, str, str]:
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(
            unused_owner: str, unused_repo: str, unused_number: int
        ) -> Dict[str, str]:
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
            with self.assertRaisesRegex(
                RuntimeError,
                'Failed to load PR',
            ):
                check_if_pr_is_low_risk.main(tokens=[url])

    def test_diff_loading_failure(self) -> None:
        url = 'https://github.com/oppia/oppia/pull/1'
        repo_url = 'https://github.com/oppia/oppia.git'
        pr = _make_pr(
            'oppia/oppia',
            'translatewiki-prs',
            'develop',
            base_url=repo_url)

        def mock_parse_url(unused_url: str) -> Tuple[str, str, str]:
            return 'oppia', 'oppia', '1'

        def mock_lookup_pr(
            unused_owner: str, unused_repo: str, unused_number: int
        ) -> check_if_pr_is_low_risk.PRDict:
            return pr

        def mock_run_cmd(unused_tokens: List[str]) -> None:
            pass

        def mock_load_diff(
            unused_branch: str
        ) -> Tuple[List[Tuple[str, str]], Dict[str, List[str]]]:
            return [], {}

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
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                (['git', 'remote', 'add', 'upstream', repo_url],),
                (['git', 'fetch', 'upstream', 'develop'],),
            ])
        load_diff_swap = self.swap_with_checks(
            check_if_pr_is_low_risk, 'load_diff', mock_load_diff,
            expected_args=[
                ('develop',),
            ])

        with parse_url_swap, lookup_pr_swap, load_diff_swap:
            with run_cmd_swap:
                with self.assertRaisesRegex(
                    RuntimeError,
                    'Failed to load PR diff',
                ):
                    check_if_pr_is_low_risk.main(tokens=[url])
