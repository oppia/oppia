# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/install_dependencies_json_packages.py."""

from __future__ import annotations

import builtins
import email.message
import io
import os
import re
import ssl
import tempfile
import time
import urllib.error
import zipfile
from urllib import request as urlrequest

from core.tests import test_utils

from typing import Any, BinaryIO, Final, NoReturn, Tuple

from . import common, install_dependencies_json_packages

RELEASE_TEST_DIR: Final = os.path.join('core', 'tests', 'release_sources', '')
MOCK_TMP_UNZIP_PATH: Final = os.path.join(RELEASE_TEST_DIR, 'tmp_unzip.zip')


class Ret:
    """Return object with required attributes."""

    def __init__(self) -> None:
        self.returncode = 0

    def communicate(self) -> Tuple[str, str]:
        """Return required method."""
        return '', ''


class InstallThirdPartyTests(test_utils.GenericTestBase):
    """Test the methods for installing third party."""

    def setUp(self) -> None:
        super().setUp()
        self.check_function_calls = {
            'remove_is_called': False,
            'rename_is_called': False,
            'extractall_is_called': False,
        }
        self.expected_check_function_calls = {
            'remove_is_called': True,
            'rename_is_called': True,
            'extractall_is_called': True,
        }

        def mock_ensure_directory_exists(_path: str) -> None:
            pass

        def mock_exists(_path: str) -> bool:
            return True

        def mock_remove(_path: str) -> None:
            self.check_function_calls['remove_is_called'] = True

        def mock_rename(_path1: str, _path2: str) -> None:
            self.check_function_calls['rename_is_called'] = True

        def mock_url_retrieve(  # pylint: disable=unused-argument
            _url: str, filename: str
        ) -> None:
            pass

        def mock_extractall(  # pylint: disable=unused-argument
            _self: zipfile.ZipFile, path: str
        ) -> None:
            self.check_function_calls['extractall_is_called'] = True

        self.unzip_swap = self.swap(
            install_dependencies_json_packages,
            'TMP_UNZIP_PATH',
            MOCK_TMP_UNZIP_PATH,
        )
        self.dir_exists_swap = self.swap(
            common, 'ensure_directory_exists', mock_ensure_directory_exists
        )
        self.exists_swap = self.swap(os.path, 'exists', mock_exists)
        self.remove_swap = self.swap(os, 'remove', mock_remove)
        self.rename_swap = self.swap(os, 'rename', mock_rename)
        self.url_retrieve_swap = self.swap(
            install_dependencies_json_packages,
            'url_retrieve',
            mock_url_retrieve,
        )
        self.extract_swap = self.swap(
            zipfile.ZipFile, 'extractall', mock_extractall
        )

    def test_download_files_with_invalid_source_filenames(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            AssertionError,
            'Expected list of filenames, got \'invalid source filename\'',
        ):
            install_dependencies_json_packages.download_files(
                'source_url', 'target_dir', 'invalid source filename'  # type: ignore[arg-type]
            )

    def test_download_files_with_valid_source_filenames(self) -> None:
        check_file_downloads = {
            'target_dir/file1': False,
            'target_dir/file2': False,
        }
        expected_check_file_downloads = {
            'target_dir/file1': False,
            'target_dir/file2': True,
        }

        def mock_exists(path: str) -> bool:
            if path == 'target_dir/file1':
                return True
            return False

        def mock_url_retrieve(_url: str, filename: str) -> None:
            check_file_downloads[filename] = True

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        url_retrieve_swap = self.swap(
            install_dependencies_json_packages,
            'url_retrieve',
            mock_url_retrieve,
        )
        with self.dir_exists_swap, exists_swap, url_retrieve_swap:
            install_dependencies_json_packages.download_files(
                'source_url', 'target_dir', ['file1', 'file2']
            )
        self.assertEqual(check_file_downloads, expected_check_file_downloads)

    def test_download_and_unzip_files_without_exception(self) -> None:
        exists_arr = []
        self.check_function_calls['url_open_is_called'] = False
        self.expected_check_function_calls['url_open_is_called'] = False

        def mock_exists(_path: str) -> bool:
            exists_arr.append(False)
            return False

        exists_swap = self.swap(os.path, 'exists', mock_exists)

        with exists_swap, self.dir_exists_swap, self.url_retrieve_swap:
            with self.remove_swap, self.rename_swap, self.unzip_swap:
                with self.extract_swap:
                    install_dependencies_json_packages.download_and_unzip_files(
                        'source url', 'target dir', 'zip root', 'target root'
                    )
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls
        )
        self.assertEqual(exists_arr, [False])

    def test_download_and_unzip_files_with_exception(self) -> None:
        exists_arr = []
        self.check_function_calls['url_open_is_called'] = False
        self.expected_check_function_calls['url_open_is_called'] = True

        def mock_exists(path: str) -> bool:
            if path == install_dependencies_json_packages.TMP_UNZIP_PATH:
                exists_arr.append(True)
                return True
            exists_arr.append(False)
            return False

        def mock_url_open(_url: str) -> BinaryIO:
            self.check_function_calls['url_open_is_called'] = True
            # The function is used as follows: url_open(req).read()
            # So, the mock returns a file object as a mock so that the read
            # function can work correctly.
            file_obj = install_dependencies_json_packages.open_file(
                MOCK_TMP_UNZIP_PATH, 'rb', None
            )
            return file_obj

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        url_open_swap = self.swap(
            install_dependencies_json_packages, 'url_open', mock_url_open
        )
        with exists_swap, self.dir_exists_swap, self.url_retrieve_swap:
            with self.remove_swap, self.rename_swap, self.extract_swap:
                with url_open_swap:
                    install_dependencies_json_packages.download_and_unzip_files(
                        'http://src', 'target dir', 'zip root', 'target root'
                    )
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls
        )
        self.assertEqual(exists_arr, [False, True])

    def test_download_and_unzip_files_with_existing_target_dir(self) -> None:
        """Verify that download_and_unzip_files returns early when the target exists.

        This test exercises the early-return path: when the target directory already
        exists, the function should perform no work and must not call helper
        functions that would download, extract, remove, or rename files. Other
        execution paths (e.g. network errors, corrupted zip files, or filesystem
        errors) can raise exceptions, but those scenarios are intentionally not
        covered here.

        Raises:
            AssertionError. Raised if any of the helper functions (download,
                extract, remove, rename) are called, or if the function does not
                short-circuit when the target directory exists.
        """

        def mock_exists(path: str) -> bool:
            if path == os.path.join('target dir', 'target root'):
                return True
            return False

        exists_swap = self.swap(os.path, 'exists', mock_exists)

        self.check_function_calls['url_retrieve_is_called'] = False
        self.check_function_calls['extractall_is_called'] = False
        self.check_function_calls['remove_is_called'] = False
        self.check_function_calls['rename_is_called'] = False

        self.expected_check_function_calls = dict(self.check_function_calls)

        with (
            exists_swap
        ), self.url_retrieve_swap, self.remove_swap, self.rename_swap, self.extract_swap:
            install_dependencies_json_packages.download_and_unzip_files(
                'source url', 'target dir', 'zip root', 'target root'
            )

        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls
        )

    def test_download_and_unzip_files_with_exception_and_tmp_unzip_missing(
        self,
    ) -> None:
        """Verify retry behavior when the first unzip attempt fails and TMP_UNZIP_PATH is absent.

        This test covers the retry path: the first call to open the zip raises an
        exception, and the temporary unzip directory does not exist before the
        retry. The function should retry once, call the URL-open helper to fetch a
        local copy, and must not call remove() because there is no temporary file
        to delete. Other paths (such as repeated failures, BadZipFile, or OS-level
        errors) are outside the scope of this test.

        Raises:
            AssertionError. Raised if the retry logic is not executed as expected
                (for example, if url_open is not called, remove() is called when it
                should not be, or the zipfile initialization count is not equal to
                the expected number of attempts).
        """
        exists_arr = []
        self.check_function_calls['url_open_is_called'] = False
        self.expected_check_function_calls['url_open_is_called'] = True
        self.expected_check_function_calls['remove_is_called'] = False

        def mock_exists(path: str) -> bool:
            if path == install_dependencies_json_packages.TMP_UNZIP_PATH:
                exists_arr.append(True)
            else:
                exists_arr.append(False)
            return False

        zipfile_call_count = {'count': 0}

        # Here we use type Any because this is a mock of zipfile.ZipFile.__init__,
        # and the actual type of _self is not relevant for the test.
        def mock_zipfile_init(_self: Any, _path: str, _mode: str) -> None:
            zipfile_call_count['count'] += 1
            if zipfile_call_count['count'] == 1:
                raise Exception('Test unzip failure')

        # Here we use object because this mock function may receive various request-like
        # objects during testing, and we only need to check that urlopen is called, not
        # to inspect specific attributes or methods of the request.
        def mock_url_open(_req: object) -> BinaryIO:
            self.check_function_calls['url_open_is_called'] = True
            file_obj = install_dependencies_json_packages.open_file(
                install_dependencies_json_packages.TMP_UNZIP_PATH, 'rb', None
            )
            return file_obj

        def mock_remove(_path: str) -> None:
            self.check_function_calls['remove_is_called'] = True

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        zipfile_swap = self.swap(zipfile.ZipFile, '__init__', mock_zipfile_init)
        url_open_swap = self.swap(
            install_dependencies_json_packages, 'url_open', mock_url_open
        )
        remove_swap = self.swap(os, 'remove', mock_remove)

        with exists_swap, zipfile_swap, url_open_swap, remove_swap:
            with self.dir_exists_swap, self.url_retrieve_swap, self.rename_swap, self.unzip_swap:
                with self.extract_swap:
                    install_dependencies_json_packages.download_and_unzip_files(
                        'http://src', 'target dir', 'zip root', 'target root'
                    )

        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls
        )
        self.assertEqual(zipfile_call_count['count'], 2)
        self.assertEqual(exists_arr, [False, True])

    def test_get_file_contents(self) -> None:
        temp_file = tempfile.NamedTemporaryFile().name
        actual_text = 'Testing install third party file.'
        with install_dependencies_json_packages.open_file(temp_file, 'w') as f:
            f.write(actual_text)
        self.assertEqual(
            install_dependencies_json_packages.get_file_contents(temp_file),
            actual_text,
        )

    def test_return_json(self) -> None:
        temp_file = tempfile.NamedTemporaryFile().name
        actual_text = '{"Testing": "install_dependencies_json_packages"}'
        with install_dependencies_json_packages.open_file(temp_file, 'w') as f:
            f.write(actual_text)
        self.assertEqual(
            install_dependencies_json_packages.return_json(temp_file),
            {'Testing': 'install_dependencies_json_packages'},
        )

    def test_dependencies_syntax_testing_with_valid_syntax(self) -> None:
        install_dependencies_json_packages.test_dependencies_syntax(
            'zip',
            {
                'version': 'c26ebb9baaf0abc060c8a13254dad283c6ee7304',
                'downloadFormat': 'zip',
                'url': 'https://github.com/oppia/MIDI.js/archive/c26e.zip',
                'rootDirPrefix': 'MIDI.js-',
                'targetDir': 'midi-js-c26ebb',
            },
        )

    def test_dependencies_syntax_with_missing_mandatory_key(self) -> None:
        print_arr = []

        def mock_print(msg: str) -> None:
            print_arr.append(msg)

        print_swap = self.swap(builtins, 'print', mock_print)
        with print_swap, self.assertRaisesRegex(SystemExit, '1'):
            install_dependencies_json_packages.test_dependencies_syntax(
                'files',
                {
                    'files': ['MathJax-2.7.5.jar'],
                    'version': '2.7.5',
                    'targetDirPrefix': 'MathJax-',
                    'downloadFormat': 'files',
                },
            )
        self.assertTrue(
            'This key is missing or misspelled: "url".' in print_arr
        )

    def test_dependencies_syntax_with_extra_optional_key(self) -> None:
        print_arr = []

        def mock_print(msg: str) -> None:
            print_arr.append(msg)

        print_swap = self.swap(builtins, 'print', mock_print)
        with print_swap, self.assertRaisesRegex(SystemExit, '1'):
            install_dependencies_json_packages.test_dependencies_syntax(
                'zip',
                {
                    'url': 'https://github.com/jsocol/bleach/v3.1.0.zip',
                    'version': '3.1.0',
                    'targetDirPrefix': 'bleach-',
                    'downloadFormat': 'files',
                    'rootDir': 'rootDir',
                    'rootDirPrefix': 'rootDirPrefix',
                },
            )
        self.assertTrue(
            'Only one of these keys pair must be used: '
            '"rootDir, rootDirPrefix".' in print_arr
        )

    def test_dependencies_syntax_with_invalid_url(self) -> None:
        print_arr = []

        def mock_print(msg: str) -> None:
            print_arr.append(msg)

        print_swap = self.swap(builtins, 'print', mock_print)
        with print_swap, self.assertRaisesRegex(SystemExit, '1'):
            install_dependencies_json_packages.test_dependencies_syntax(
                'zip',
                {
                    'version': '4.7.1',
                    'downloadFormat': 'zip',
                    'url': (
                        'https://python.org/packages/beautifulsoup4-4.7.1.tar'
                        '#md5=321d'
                    ),
                    'rootDirPrefix': 'beautifulsoup4-',
                    'targetDirPrefix': 'beautifulsoup4-',
                },
            )
        self.assertTrue(
            'This url https://python.org/packages/beautifulsoup4-4.7.1.tar is '
            'invalid for zip file format.' in print_arr
        )

    def test_validate_dependencies_with_correct_syntax(self) -> None:
        def mock_return_json(
            _path: str,
        ) -> install_dependencies_json_packages.DependenciesDict:
            return {
                'frontendDependencies': {
                    'mathJax': {
                        'url': 'https://github.com/mathjax/2.7.5',
                        'files': ['MathJax-2.7.5.jar'],
                        'version': '2.7.5',
                        'targetDirPrefix': 'MathJax-',
                        'downloadFormat': 'files',
                    }
                }
            }

        return_json_swap = self.swap(
            install_dependencies_json_packages, 'return_json', mock_return_json
        )
        with return_json_swap:
            install_dependencies_json_packages.validate_dependencies('filepath')

    def test_validate_dependencies_with_missing_download_format(self) -> None:
        def mock_return_json(
            _path: str,
        ) -> install_dependencies_json_packages.DependenciesDict:
            return {
                'frontendDependencies': {
                    'mathJax': {
                        'version': '2.7.5',
                        'url': 'https://github.com/mathjax/2.7.5.zip',
                        'targetDirPrefix': 'MathJax-',
                    }
                }
            }

        return_json_swap = self.swap(
            install_dependencies_json_packages, 'return_json', mock_return_json
        )
        with return_json_swap, self.assertRaisesRegex(
            Exception,
            re.escape(
                'downloadFormat not specified in {\'version\': \'2.7.5\', '
                '\'url\': \'https://github.com/mathjax/2.7.5.zip\', '
                '\'targetDirPrefix\': \'MathJax-\'}'
            ),
        ):
            install_dependencies_json_packages.validate_dependencies('filepath')

    def test_function_calls(self) -> None:
        check_function_calls = {
            'validate_dependencies_is_called': False,
            'download_files_is_called': False,
            'download_and_unzip_files_is_called': False,
        }
        expected_check_function_calls = {
            'validate_dependencies_is_called': True,
            'download_files_is_called': True,
            'download_and_unzip_files_is_called': True,
        }

        def mock_return_json(
            _path: str,
        ) -> install_dependencies_json_packages.DependenciesDict:
            return {
                'frontendDependencies': {
                    'bleach': {
                        'version': '3.1.0',
                        'downloadFormat': 'zip',
                        'url': 'https://github.com/bleach/v3.1.0.zip',
                        'rootDirPrefix': 'bleach-',
                        'targetDirPrefix': 'bleach-',
                    },
                    'bootstrap': {
                        'version': '5.3.3',
                        'downloadFormat': 'zip',
                        'url': 'https://bootstrap/bootstrap-5.3.3-dist.zip',
                        'rootDir': 'bootstrap-5.3.3-dist',
                        'targetDir': 'bootstrap',
                    },
                    'jqueryUI': {
                        'version': '1.12.1',
                        'downloadFormat': 'files',
                        'url': 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1',
                        'rootDirPrefix': 'jqueryui-',
                        'targetDirPrefix': 'jqueryui-',
                        'files': ['jquery-ui.min.js'],
                    },
                }
            }

        def mock_validate_dependencies(_path: str) -> None:
            check_function_calls['validate_dependencies_is_called'] = True

        def mock_download_files(
            unused_source_url_root: str,
            unused_target_dir: str,
            unused_source_filenames: str,
        ) -> None:
            check_function_calls['download_files_is_called'] = True

        def mock_download_and_unzip_files(
            unused_source_url: str,
            unused_target_parent_dir: str,
            unused_zip_root_name: str,
            unused_target_root_name: str,
        ) -> None:
            check_function_calls['download_and_unzip_files_is_called'] = True

        return_json_swap = self.swap(
            install_dependencies_json_packages, 'return_json', mock_return_json
        )
        validate_swap = self.swap(
            install_dependencies_json_packages,
            'validate_dependencies',
            mock_validate_dependencies,
        )
        download_files_swap = self.swap(
            install_dependencies_json_packages,
            'download_files',
            mock_download_files,
        )
        unzip_files_swap = self.swap(
            install_dependencies_json_packages,
            'download_and_unzip_files',
            mock_download_and_unzip_files,
        )

        with validate_swap, return_json_swap, download_files_swap:
            with unzip_files_swap:
                install_dependencies_json_packages.main()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_download_dependencies_with_unsupported_download_format(
        self,
    ) -> None:
        """Tests that no functions are called when downloadFormat is unsupported."""
        check_function_calls = {
            'validate_dependencies_is_called': False,
            'download_files_is_called': False,
            'download_and_unzip_files_is_called': False,
        }

        def mock_return_json(
            _path: str,
        ) -> install_dependencies_json_packages.DependenciesDict:
            # Here we use MyPy ignore because we are intentionally testing an unsupported downloadFormat; this is a mock for testing only.
            return {
                'frontendDependencies': {
                    'unsupportedDep': {
                        'version': '1.0.0',
                        'downloadFormat': 'tar',  # type: ignore[typeddict-item]
                        'url': 'https://example.com/dep.tar',
                        'rootDirPrefix': 'unsupported-',
                        'targetDirPrefix': 'unsupported-',
                    },
                }
            }

        def mock_validate_dependencies(_path: str) -> None:
            check_function_calls['validate_dependencies_is_called'] = True

        # Here we use type Any because these are mocks; we do not care about the actual
        # types of arguments, only that the functions are called.
        def mock_download_files(*_args: Any, **_kwargs: Any) -> None:
            check_function_calls['download_files_is_called'] = True

        # Here we use type Any because these are mocks; we do not care about the actual
        # types of arguments, only that the functions are called.
        def mock_download_and_unzip_files(*_args: Any, **_kwargs: Any) -> None:
            check_function_calls['download_and_unzip_files_is_called'] = True

        return_json_swap = self.swap(
            install_dependencies_json_packages, 'return_json', mock_return_json
        )
        validate_swap = self.swap(
            install_dependencies_json_packages,
            'validate_dependencies',
            mock_validate_dependencies,
        )
        download_files_swap = self.swap(
            install_dependencies_json_packages,
            'download_files',
            mock_download_files,
        )
        unzip_files_swap = self.swap(
            install_dependencies_json_packages,
            'download_and_unzip_files',
            mock_download_and_unzip_files,
        )

        with (
            validate_swap
        ), return_json_swap, download_files_swap, unzip_files_swap:
            install_dependencies_json_packages.main()

        expected_check_function_calls = {
            'validate_dependencies_is_called': True,
            'download_files_is_called': False,
            'download_and_unzip_files_is_called': False,
        }

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_url_open(self) -> None:
        test_url = 'https://example.com/test'

        class MockResponse:
            """Mock response object for urlopen."""

            def __init__(self) -> None:
                self.url = test_url

            def getcode(self) -> int:
                """Return HTTP status code."""
                return 200

        def mock_urlopen(url: str, context: ssl.SSLContext) -> MockResponse:
            self.assertEqual(url, test_url)
            self._assert_ssl_context_matches_default(context)
            return MockResponse()

        urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

        with urlopen_swap:
            response = install_dependencies_json_packages.url_open(test_url)
        self.assertEqual(response.getcode(), 200)
        self.assertEqual(response.url, test_url)

    def test_url_open_rate_limit_retry(self) -> None:
        """Tests retry logic when GitHub rate limit (HTTP 403) occurs."""
        test_url = 'https://example.com/test'

        headers = email.message.Message()
        headers.add_header('x-ratelimit-remaining', '0')
        headers.add_header('x-ratelimit-reset', str(int(time.time()) + 1))

        error = urllib.error.HTTPError(
            url=test_url, code=403, msg='rate limit', hdrs=headers, fp=None
        )

        class MockResponse:
            def __init__(self) -> None:
                """Initialize the mock response."""
                self.url = test_url

            def getcode(self) -> int:
                """Return HTTP status code."""
                return 200

        call_count = {'count': 0}

        def mock_urlopen(_url: str, context: ssl.SSLContext) -> MockResponse:
            """Mock urlopen to simulate a rate-limit error followed by success."""
            self._assert_ssl_context_matches_default(context)
            call_count['count'] += 1
            if call_count['count'] == 1:
                raise error
            return MockResponse()

        urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)
        sleep_swap = self.swap(time, 'sleep', lambda x: None)

        with urlopen_swap, sleep_swap:
            response = install_dependencies_json_packages.url_open(test_url)

        self.assertEqual(response.getcode(), 200)
        self.assertEqual(call_count['count'], 2)

    def test_url_open_rate_limit_failure_cases(self) -> None:
        """Tests failure cases for rate limit handling."""
        test_url = 'https://example.com/test'
        headers0 = email.message.Message()
        error0 = urllib.error.HTTPError(
            url=test_url, code=500, msg='server error', hdrs=headers0, fp=None
        )

        headers1 = email.message.Message()
        headers1.add_header('x-ratelimit-remaining', '5')

        error1 = urllib.error.HTTPError(
            url=test_url, code=403, msg='forbidden', hdrs=headers1, fp=None
        )

        headers2 = email.message.Message()
        headers2.add_header('x-ratelimit-remaining', '0')

        error2 = urllib.error.HTTPError(
            url=test_url, code=403, msg='rate limit', hdrs=headers2, fp=None
        )

        headers3 = email.message.Message()
        headers3.add_header('x-ratelimit-remaining', '0')
        headers3.add_header('x-ratelimit-reset', str(int(time.time()) + 1000))

        error3 = urllib.error.HTTPError(
            url=test_url, code=403, msg='rate limit', hdrs=headers3, fp=None
        )

        errors = [error0, error1, error2, error3]

        # Here we use type Any because the function may raise an HTTPError or return a mock response object.
        def mock_urlopen(_url: str, context: ssl.SSLContext) -> Any:
            raise errors.pop(0)

        urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

        with urlopen_swap:
            with self.assertRaisesRegex(urllib.error.HTTPError, '.*'):
                install_dependencies_json_packages.url_open(test_url)
            with self.assertRaisesRegex(urllib.error.HTTPError, '.*'):
                install_dependencies_json_packages.url_open(test_url)
            with self.assertRaisesRegex(urllib.error.HTTPError, '.*'):
                install_dependencies_json_packages.url_open(test_url)
            with self.assertRaisesRegex(urllib.error.HTTPError, '.*'):
                install_dependencies_json_packages.url_open(test_url)

    def _assert_ssl_context_matches_default(
        self, context: ssl.SSLContext
    ) -> None:
        """Assert that an SSL context matches the default one.

        If we create two default SSL contexts, they will evaluate as unequal
        even though they are the same for our purposes. Therefore, this function
        checks that the provided context has the same important security
        properties as the default.

        Args:
            context: SSLContext. The context to compare.

        Raises:
            AssertionError. Raised if the contexts differ in any of their
                important attributes or behaviors.
        """
        default_context = ssl.create_default_context()
        for attribute in (
            'verify_flags',
            'verify_mode',
            'protocol',
            'hostname_checks_common_name',
            'options',
            'minimum_version',
            'maximum_version',
            'check_hostname',
        ):
            self.assertEqual(
                getattr(context, attribute), getattr(default_context, attribute)
            )
        # Note: We intentionally don't compare get_ca_certs() because url_open
        # uses certifi's certificate bundle which differs from system certs.
        # We only compare get_ciphers() to verify cipher configuration matches.
        self.assertEqual(context.get_ciphers(), default_context.get_ciphers())

    def test_url_retrieve_with_successful_https_works(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            output_path = os.path.join(tempdir, 'buffer')
            attempts = []

            def mock_urlopen(
                url: str, context: ssl.SSLContext
            ) -> io.BufferedIOBase:
                attempts.append(url)
                self.assertLessEqual(len(attempts), 1)
                self.assertEqual(url, 'https://example.com')
                self._assert_ssl_context_matches_default(context)
                return io.BytesIO(b'content')

            urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

            with urlopen_swap:
                install_dependencies_json_packages.url_retrieve(
                    'https://example.com', output_path
                )
            with open(output_path, 'rb') as buffer:
                self.assertEqual(buffer.read(), b'content')

    def test_url_retrieve_with_successful_https_works_on_retry(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            output_path = os.path.join(tempdir, 'output')
            attempts = []

            def mock_urlopen(
                url: str, context: ssl.SSLContext
            ) -> io.BufferedIOBase:
                attempts.append(url)
                self.assertLessEqual(len(attempts), 2)
                self.assertEqual(url, 'https://example.com')
                self._assert_ssl_context_matches_default(context)
                if len(attempts) == 1:
                    raise ssl.SSLError()
                return io.BytesIO(b'content')

            urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

            with urlopen_swap:
                install_dependencies_json_packages.url_retrieve(
                    'https://example.com', output_path
                )
            with open(output_path, 'rb') as buffer:
                self.assertEqual(buffer.read(), b'content')

    def test_url_retrieve_runs_out_of_attempts(self) -> None:
        attempts = []

        def mock_open(_path: str, _options: str) -> NoReturn:
            raise AssertionError('open() should not be called')

        def mock_urlopen(
            url: str, context: ssl.SSLContext
        ) -> io.BufferedIOBase:
            attempts.append(url)
            self.assertLessEqual(len(attempts), 2)
            self.assertEqual(url, 'https://example.com')
            self._assert_ssl_context_matches_default(context)
            raise ssl.SSLError('test_error')

        open_swap = self.swap(builtins, 'open', mock_open)
        urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

        with open_swap, urlopen_swap:
            with self.assertRaisesRegex(ssl.SSLError, 'test_error'):
                install_dependencies_json_packages.url_retrieve(
                    'https://example.com', 'test_path'
                )

    def test_url_retrieve_https_check_fails(self) -> None:
        def mock_open(_path: str, _options: str) -> NoReturn:
            raise AssertionError('open() should not be called')

        def mock_urlopen(
            url: str, context: ssl.SSLContext
        ) -> NoReturn:  # pylint: disable=unused-argument
            raise AssertionError('urlopen() should not be called')

        open_swap = self.swap(builtins, 'open', mock_open)
        urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

        with open_swap, urlopen_swap:
            with self.assertRaisesRegex(
                Exception, 'The URL http://example.com should use HTTPS.'
            ):
                install_dependencies_json_packages.url_retrieve(
                    'http://example.com', 'test_path'
                )

    def test_url_retrieve_with_successful_http_works(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            output_path = os.path.join(tempdir, 'output')
            attempts = []

            def mock_urlopen(
                url: str, context: ssl.SSLContext
            ) -> io.BufferedIOBase:
                attempts.append(url)
                self.assertLessEqual(len(attempts), 1)
                self.assertEqual(url, 'https://example.com')
                self._assert_ssl_context_matches_default(context)
                return io.BytesIO(b'content')

            urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

            with urlopen_swap:
                install_dependencies_json_packages.url_retrieve(
                    'https://example.com', output_path, enforce_https=False
                )
            with open(output_path, 'rb') as buffer:
                self.assertEqual(buffer.read(), b'content')
