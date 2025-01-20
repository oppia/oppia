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
import io
import os
import re
import ssl
import tempfile
from urllib import request as urlrequest
import zipfile

from core.tests import test_utils
from typing import BinaryIO, Final, NoReturn, Tuple

from . import common
from . import install_dependencies_json_packages

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
            'extractall_is_called': False
        }
        self.expected_check_function_calls = {
            'remove_is_called': True,
            'rename_is_called': True,
            'extractall_is_called': True
        }
        def mock_ensure_directory_exists(_path: str) -> None:
            pass
        def mock_exists(_path: str) -> bool:
            return True
        def mock_remove(_path: str) -> None:
            self.check_function_calls['remove_is_called'] = True
        def mock_rename(_path1: str, _path2: str) -> None:
            self.check_function_calls['rename_is_called'] = True
        def mock_url_retrieve(_url: str, filename: str) -> None:  # pylint: disable=unused-argument
            pass
        def mock_extractall(_self: zipfile.ZipFile, path: str) -> None:  # pylint: disable=unused-argument
            self.check_function_calls['extractall_is_called'] = True

        self.unzip_swap = self.swap(
            install_dependencies_json_packages, 'TMP_UNZIP_PATH',
            MOCK_TMP_UNZIP_PATH)
        self. dir_exists_swap = self.swap(
            common,
            'ensure_directory_exists', mock_ensure_directory_exists)
        self.exists_swap = self.swap(os.path, 'exists', mock_exists)
        self.remove_swap = self.swap(os, 'remove', mock_remove)
        self.rename_swap = self.swap(os, 'rename', mock_rename)
        self.url_retrieve_swap = self.swap(
            install_dependencies_json_packages, 'url_retrieve',
            mock_url_retrieve)
        self.extract_swap = self.swap(
            zipfile.ZipFile, 'extractall', mock_extractall)

    def test_download_files_with_invalid_source_filenames(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            AssertionError,
            'Expected list of filenames, got \'invalid source filename\''):
            install_dependencies_json_packages.download_files(
                'source_url', 'target_dir', 'invalid source filename')  # type: ignore[arg-type]

    def test_download_files_with_valid_source_filenames(self) -> None:
        check_file_downloads = {
            'target_dir/file1': False,
            'target_dir/file2': False
        }
        expected_check_file_downloads = {
            'target_dir/file1': False,
            'target_dir/file2': True
        }

        def mock_exists(path: str) -> bool:
            if path == 'target_dir/file1':
                return True
            return False
        def mock_url_retrieve(_url: str, filename: str) -> None:
            check_file_downloads[filename] = True

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        url_retrieve_swap = self.swap(
            install_dependencies_json_packages, 'url_retrieve',
            mock_url_retrieve)
        with self.dir_exists_swap, exists_swap, url_retrieve_swap:
            install_dependencies_json_packages.download_files(
                'source_url', 'target_dir', ['file1', 'file2'])
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
                        'source url', 'target dir', 'zip root', 'target root')
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
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
            # The function is used as follows: utils.url_open(req).read()
            # So, the mock returns a file object as a mock so that the read
            # function can work correctly.
            file_obj = install_dependencies_json_packages.open_file(
                MOCK_TMP_UNZIP_PATH, 'rb', None)
            return file_obj

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        url_open_swap = self.swap(
            install_dependencies_json_packages, 'url_open',
            mock_url_open)
        with exists_swap, self.dir_exists_swap, self.url_retrieve_swap:
            with self.remove_swap, self.rename_swap, self.extract_swap:
                with url_open_swap:
                    install_dependencies_json_packages.download_and_unzip_files(
                        'http://src', 'target dir', 'zip root', 'target root')
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        self.assertEqual(exists_arr, [False, True])

    def test_get_file_contents(self) -> None:
        temp_file = tempfile.NamedTemporaryFile().name
        actual_text = 'Testing install third party file.'
        with install_dependencies_json_packages.open_file(
            temp_file, 'w') as f:
            f.write(actual_text)
        self.assertEqual(
            install_dependencies_json_packages.get_file_contents(temp_file),
            actual_text)

    def test_return_json(self) -> None:
        temp_file = tempfile.NamedTemporaryFile().name
        actual_text = '{"Testing": "install_dependencies_json_packages"}'
        with install_dependencies_json_packages.open_file(
            temp_file, 'w') as f:
            f.write(actual_text)
        self.assertEqual(
            install_dependencies_json_packages.return_json(temp_file),
            {'Testing': 'install_dependencies_json_packages'})

    def test_dependencies_syntax_testing_with_valid_syntax(self) -> None:
        install_dependencies_json_packages.test_dependencies_syntax(
            'zip', {
                'version': 'c26ebb9baaf0abc060c8a13254dad283c6ee7304',
                'downloadFormat': 'zip',
                'url': 'https://github.com/oppia/MIDI.js/archive/c26e.zip',
                'rootDirPrefix': 'MIDI.js-',
                'targetDir': 'midi-js-c26ebb'
            }
        )

    def test_dependencies_syntax_with_missing_mandatory_key(self) -> None:
        print_arr = []
        def mock_print(msg: str) -> None:
            print_arr.append(msg)
        print_swap = self.swap(builtins, 'print', mock_print)
        with print_swap, self.assertRaisesRegex(SystemExit, '1'):
            install_dependencies_json_packages.test_dependencies_syntax(
                'files', {
                    'files': ['MathJax-2.7.5.jar'],
                    'version': '2.7.5',
                    'targetDirPrefix': 'MathJax-',
                    'downloadFormat': 'files'
                }
            )
        self.assertTrue(
            'This key is missing or misspelled: "url".' in print_arr)

    def test_dependencies_syntax_with_extra_optional_key(self) -> None:
        print_arr = []
        def mock_print(msg: str) -> None:
            print_arr.append(msg)
        print_swap = self.swap(builtins, 'print', mock_print)
        with print_swap, self.assertRaisesRegex(SystemExit, '1'):
            install_dependencies_json_packages.test_dependencies_syntax(
                'zip', {
                    'url': 'https://github.com/jsocol/bleach/v3.1.0.zip',
                    'version': '3.1.0',
                    'targetDirPrefix': 'bleach-',
                    'downloadFormat': 'files',
                    'rootDir': 'rootDir',
                    'rootDirPrefix': 'rootDirPrefix'})
        self.assertTrue(
            'Only one of these keys pair must be used: '
            '"rootDir, rootDirPrefix".' in print_arr)

    def test_dependencies_syntax_with_invalid_url(self) -> None:
        print_arr = []
        def mock_print(msg: str) -> None:
            print_arr.append(msg)
        print_swap = self.swap(builtins, 'print', mock_print)
        with print_swap, self.assertRaisesRegex(SystemExit, '1'):
            install_dependencies_json_packages.test_dependencies_syntax(
                'zip', {
                    'version': '4.7.1',
                    'downloadFormat': 'zip',
                    'url': (
                        'https://python.org/packages/beautifulsoup4-4.7.1.tar'
                        '#md5=321d'),
                    'rootDirPrefix': 'beautifulsoup4-',
                    'targetDirPrefix': 'beautifulsoup4-'})
        self.assertTrue(
            'This url https://python.org/packages/beautifulsoup4-4.7.1.tar is '
            'invalid for zip file format.' in print_arr)

    def test_validate_dependencies_with_correct_syntax(self) -> None:
        def mock_return_json(
            _path: str
        ) -> install_dependencies_json_packages.DependenciesDict:
            return {
                'frontendDependencies': {
                    'mathJax': {
                        'url': 'https://github.com/mathjax/2.7.5',
                        'files': ['MathJax-2.7.5.jar'],
                        'version': '2.7.5',
                        'targetDirPrefix': 'MathJax-',
                        'downloadFormat': 'files'
                    }
                }
            }

        return_json_swap = self.swap(
            install_dependencies_json_packages, 'return_json', mock_return_json)
        with return_json_swap:
            install_dependencies_json_packages.validate_dependencies('filepath')

    def test_validate_dependencies_with_missing_download_format(self) -> None:
        def mock_return_json(
            _path: str
        ) -> install_dependencies_json_packages.DependenciesDict:
            return {
                'frontendDependencies': {
                    'mathJax': {
                        'version': '2.7.5',
                        'url': 'https://github.com/mathjax/2.7.5.zip',
                        'targetDirPrefix': 'MathJax-'
                    }
                }
            }
        return_json_swap = self.swap(
            install_dependencies_json_packages, 'return_json', mock_return_json)
        with return_json_swap, self.assertRaisesRegex(
            Exception,
            re.escape(
                'downloadFormat not specified in {\'version\': \'2.7.5\', '
                '\'url\': \'https://github.com/mathjax/2.7.5.zip\', '
                '\'targetDirPrefix\': \'MathJax-\'}'
            )
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
            _path: str
        ) -> install_dependencies_json_packages.DependenciesDict:
            return {
                'frontendDependencies': {
                    'bleach': {
                        'version': '3.1.0',
                        'downloadFormat': 'zip',
                        'url': 'https://github.com/bleach/v3.1.0.zip',
                        'rootDirPrefix': 'bleach-',
                        'targetDirPrefix': 'bleach-'
                    },
                    'bootstrap': {
                        'version': '4.3.1',
                        'downloadFormat': 'zip',
                        'url': 'https://bootstrap/bootstrap-4.3.1-dist.zip',
                        'rootDir': 'bootstrap-4.3.1-dist',
                        'targetDir': 'bootstrap'
                    },
                    'angularTest': {
                        'version': '1.8.2',
                        'downloadFormat': 'files',
                        'url': 'https://code.angularjs.org/1.8.2',
                        'targetDirPrefix': 'angularjs-',
                        'files': ['angular-mocks.js']
                    },
                }
            }

        def mock_validate_dependencies(_path: str) -> None:
            check_function_calls['validate_dependencies_is_called'] = True
        def mock_download_files(
            unused_source_url_root: str,
            unused_target_dir: str,
            unused_source_filenames: str
        ) -> None:
            check_function_calls['download_files_is_called'] = True
        def mock_download_and_unzip_files(
            unused_source_url: str,
            unused_target_parent_dir: str,
            unused_zip_root_name: str,
            unused_target_root_name: str
        ) -> None:
            check_function_calls['download_and_unzip_files_is_called'] = True
        return_json_swap = self.swap(
            install_dependencies_json_packages, 'return_json', mock_return_json)
        validate_swap = self.swap(
            install_dependencies_json_packages,
            'validate_dependencies',
            mock_validate_dependencies
        )
        download_files_swap = self.swap(
            install_dependencies_json_packages, 'download_files',
            mock_download_files)
        unzip_files_swap = self.swap(
            install_dependencies_json_packages, 'download_and_unzip_files',
            mock_download_and_unzip_files)

        with validate_swap, return_json_swap, download_files_swap:
            with unzip_files_swap:
                install_dependencies_json_packages.main()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_url_open(self) -> None:
        response = install_dependencies_json_packages.url_open(
            'http://www.google.com')
        self.assertEqual(response.getcode(), 200)
        self.assertEqual(
            response.url, 'http://www.google.com')

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
            'verify_flags', 'verify_mode', 'protocol',
            'hostname_checks_common_name', 'options', 'minimum_version',
            'maximum_version', 'check_hostname'
        ):
            self.assertEqual(
                getattr(context, attribute),
                getattr(default_context, attribute)
            )
        for method in ('get_ca_certs', 'get_ciphers'):
            self.assertEqual(
                getattr(context, method)(),
                getattr(default_context, method)()
            )

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
                    'https://example.com', output_path)
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
                    'https://example.com', output_path)
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
                    'https://example.com', 'test_path')

    def test_url_retrieve_https_check_fails(self) -> None:
        def mock_open(_path: str, _options: str) -> NoReturn:
            raise AssertionError('open() should not be called')
        def mock_urlopen(url: str, context: ssl.SSLContext) -> NoReturn:  # pylint: disable=unused-argument
            raise AssertionError('urlopen() should not be called')

        open_swap = self.swap(builtins, 'open', mock_open)
        urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

        with open_swap, urlopen_swap:
            with self.assertRaisesRegex(
                Exception, 'The URL http://example.com should use HTTPS.'
            ):
                install_dependencies_json_packages.url_retrieve(
                    'http://example.com', 'test_path')

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
                    'https://example.com', output_path, enforce_https=False)
            with open(output_path, 'rb') as buffer:
                self.assertEqual(buffer.read(), b'content')
