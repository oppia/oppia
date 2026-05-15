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

"""Unit tests for scripts/build.py."""

from __future__ import annotations

import ast
import contextlib
import io
import json
import os
import pathlib
import re
import tempfile

from core.tests import test_utils

from typing import ContextManager, Dict, Iterator, List, Tuple

from . import (
    build,
    common,
    install_python_dev_dependencies,
    install_third_party_libs,
    scripts_test_utils,
    servers,
)

TEST_DIR = os.path.join('core', 'tests', 'build', '')
TEST_SOURCE_DIR = os.path.join('core', 'tests', 'build_sources')

MOCK_ASSETS_DEV_DIR = os.path.join(TEST_SOURCE_DIR, 'assets', '')
MOCK_ASSETS_OUT_DIR = os.path.join(TEST_DIR, 'static', 'assets', '')
MOCK_EXTENSIONS_DEV_DIR = os.path.join(TEST_SOURCE_DIR, 'extensions', '')
MOCK_TEMPLATES_DEV_DIR = os.path.join(TEST_SOURCE_DIR, 'templates', '')

INVALID_FILENAME = 'invalid_filename.css'
INVALID_INPUT_FILEPATH = os.path.join(TEST_DIR, INVALID_FILENAME)
INVALID_OUTPUT_FILEPATH = os.path.join(TEST_DIR, INVALID_FILENAME)

EMPTY_DIR = os.path.join(TEST_DIR, 'empty', '')


def mock_managed_process(
    *unused_args: str, **unused_kwargs: str
) -> ContextManager[scripts_test_utils.PopenStub]:
    """Mock method for replacing the managed_process() functions.

    Returns:
        Context manager. A context manager that always yields a mock
        process.
    """
    return contextlib.nullcontext(
        enter_result=scripts_test_utils.PopenStub(alive=False)
    )


class BuildTests(test_utils.GenericTestBase):
    """Test the build methods."""

    def tearDown(self) -> None:
        build.safe_delete_directory_tree(TEST_DIR)
        build.safe_delete_directory_tree(EMPTY_DIR)
        pathlib.Path.unlink(pathlib.Path('mock_app.yaml'), missing_ok=True)
        pathlib.Path.unlink(pathlib.Path('mock_app_dev.yaml'), missing_ok=True)
        super().tearDown()

    def test_insert_hash(self) -> None:
        """Test _insert_hash returns correct filenames with provided hashes."""
        self.assertEqual(
            build._insert_hash(  # pylint: disable=protected-access
                'file.js', '123456'
            ),
            'file.123456.js',
        )
        self.assertEqual(
            build._insert_hash(  # pylint: disable=protected-access
                'path/to/file.js', '654321'
            ),
            'path/to/file.654321.js',
        )
        self.assertEqual(
            build._insert_hash(  # pylint: disable=protected-access
                'file.min.js', 'abcdef'
            ),
            'file.min.abcdef.js',
        )
        self.assertEqual(
            build._insert_hash(  # pylint: disable=protected-access
                'path/to/file.min.js', 'fedcba'
            ),
            'path/to/file.min.fedcba.js',
        )

    def test_get_file_count(self) -> None:
        """Test get_file_count returns the correct number of files, excluding
        file with extensions in FILE_EXTENSIONS_TO_IGNORE and files that should
        not be built.
        """
        all_inclusive_file_count = 0
        for _, _, files in os.walk(MOCK_EXTENSIONS_DEV_DIR):
            all_inclusive_file_count += len(files)
        ignored_file_count = 0
        for _, _, files in os.walk(MOCK_EXTENSIONS_DEV_DIR):
            for filename in files:
                if not build.should_file_be_built(filename) or any(
                    filename.endswith(p)
                    for p in build.FILE_EXTENSIONS_TO_IGNORE
                ):
                    ignored_file_count += 1
        self.assertEqual(
            all_inclusive_file_count - ignored_file_count,
            build.get_file_count(MOCK_EXTENSIONS_DEV_DIR),
        )

    def test_process_html(self) -> None:
        """Test process_html removes whitespaces."""
        base_html_source_path = os.path.join(
            MOCK_TEMPLATES_DEV_DIR, 'base.html'
        )

        build._ensure_files_exist(  # pylint: disable=protected-access
            [base_html_source_path]
        )
        minified_html_file_stream = io.StringIO()

        # Assert that base.html has white spaces and has original filepaths.
        with open(
            base_html_source_path, 'r', encoding='utf-8'
        ) as source_base_file:
            source_base_file_content = source_base_file.read()
            self.assertRegex(
                source_base_file_content,
                r'\s{2,}',
                msg='No white spaces detected in %s unexpectedly'
                % base_html_source_path,
            )

        # Build base.html file.
        with open(
            base_html_source_path, 'r', encoding='utf-8'
        ) as source_base_file:
            build.process_html(source_base_file, minified_html_file_stream)

        minified_html_file_content = minified_html_file_stream.getvalue()
        self.assertNotRegex(
            minified_html_file_content,
            r'\s{2,}',
            msg='All white spaces must be removed from %s'
            % base_html_source_path,
        )

    def test_should_file_be_built(self) -> None:
        """Test should_file_be_built returns the correct boolean value for
        filepath that should be built.
        """
        service_ts_filepath = os.path.join('core', 'pages', 'AudioService.ts')
        spec_js_filepath = os.path.join('core', 'pages', 'AudioServiceSpec.js')
        webdriverio_filepath = os.path.join('extensions', 'webdriverio.js')

        python_controller_filepath = os.path.join('base.py')
        pyc_test_filepath = os.path.join('core', 'controllers', 'base.pyc')
        python_test_filepath = os.path.join('core', 'tests', 'base_test.py')

        self.assertFalse(build.should_file_be_built(spec_js_filepath))
        self.assertFalse(build.should_file_be_built(webdriverio_filepath))

        self.assertFalse(build.should_file_be_built(service_ts_filepath))

        self.assertFalse(build.should_file_be_built(python_test_filepath))
        self.assertFalse(build.should_file_be_built(pyc_test_filepath))
        self.assertTrue(build.should_file_be_built(python_controller_filepath))

        # Swapping out constants to check if the reverse is true.
        # ALL JS files that ends with ...Service.js should not be built.
        with self.swap(
            build, 'JS_FILENAME_SUFFIXES_TO_IGNORE', ('Service.js',)
        ):
            self.assertTrue(build.should_file_be_built(spec_js_filepath))

    def test_hash_should_be_inserted(self) -> None:
        """Test hash_should_be_inserted returns the correct boolean value
        for filepath that should be hashed.
        """
        with self.swap(
            build,
            'FILEPATHS_NOT_TO_RENAME',
            ('*.py', 'path/to/fonts/*', 'path/to/third_party.min.css.map'),
        ):
            self.assertFalse(
                build.hash_should_be_inserted(
                    'path/to/fonts/fontawesome-webfont.svg'
                )
            )
            self.assertFalse(
                build.hash_should_be_inserted('path/to/third_party.min.css.map')
            )
            self.assertTrue(
                build.hash_should_be_inserted('path/to/wrongFonts/fonta.eot')
            )
            self.assertTrue(
                build.hash_should_be_inserted(
                    'rich_text_components/Video/protractor.js'
                )
            )
            self.assertFalse(build.hash_should_be_inserted('main.py'))
            self.assertFalse(
                build.hash_should_be_inserted('extensions/domain.py')
            )

    def test_is_file_hash_provided_to_frontend(self) -> None:
        """Test is_file_hash_provided_to_frontend returns the correct boolean
        value for filepath that should be provided to frontend.
        """
        with self.swap(
            build,
            'FILEPATHS_PROVIDED_TO_FRONTEND',
            ('path/to/file.js', 'path/to/file.html', 'file.js'),
        ):
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('path/to/file.js')
            )
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('path/to/file.html')
            )
            self.assertTrue(build.is_file_hash_provided_to_frontend('file.js'))
        with self.swap(
            build,
            'FILEPATHS_PROVIDED_TO_FRONTEND',
            ('path/to/*', '*.js', '*_end.html'),
        ):
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('path/to/file.js')
            )
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('path/to/file.html')
            )
            self.assertTrue(build.is_file_hash_provided_to_frontend('file.js'))
            self.assertFalse(
                build.is_file_hash_provided_to_frontend('path/file.css')
            )
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('good_end.html')
            )
            self.assertFalse(
                build.is_file_hash_provided_to_frontend('bad_end.css')
            )

    def test_get_filepaths_by_extensions(self) -> None:
        """Test get_filepaths_by_extensions only returns filepaths in
        directory with given extensions.
        """
        filepaths: List[str] = []
        common.ensure_directory_exists(MOCK_ASSETS_DEV_DIR)
        extensions: Tuple[str, ...] = (
            '.json',
            '.svg',
        )

        self.assertEqual(len(filepaths), 0)
        filepaths = build.get_filepaths_by_extensions(
            MOCK_ASSETS_DEV_DIR, extensions
        )
        for filepath in filepaths:
            self.assertTrue(any(filepath.endswith(p) for p in extensions))
        file_count = 0
        for _, _, filenames in os.walk(MOCK_ASSETS_DEV_DIR):
            for filename in filenames:
                if any(filename.endswith(p) for p in extensions):
                    file_count += 1
        self.assertEqual(len(filepaths), file_count)

        filepaths = []
        extensions = (
            '.pdf',
            '.viminfo',
            '.idea',
        )

        self.assertEqual(len(filepaths), 0)
        filepaths = build.get_filepaths_by_extensions(
            MOCK_ASSETS_DEV_DIR, extensions
        )
        self.assertEqual(len(filepaths), 0)

    def test_get_file_hashes(self) -> None:
        """Test get_file_hashes gets hashes of all files in directory,
        excluding file with extensions in FILE_EXTENSIONS_TO_IGNORE.
        """
        # Prevent getting hashes of HTML files.
        with self.swap(build, 'FILE_EXTENSIONS_TO_IGNORE', ('.html',)):
            file_hashes: Dict[str, str] = {}
            self.assertEqual(len(file_hashes), 0)
            file_hashes = build.get_file_hashes(MOCK_EXTENSIONS_DEV_DIR)
            self.assertGreater(len(file_hashes), 0)
            # Assert that each hash's filepath exists and does not include files
            # with extensions in FILE_EXTENSIONS_TO_IGNORE.
            for filepath in file_hashes:
                abs_filepath = os.path.join(MOCK_EXTENSIONS_DEV_DIR, filepath)
                self.assertTrue(os.path.isfile(abs_filepath))
                self.assertFalse(filepath.endswith('.html'))

    def test_filter_hashes(self) -> None:
        """Test filter_hashes filters the provided hash correctly."""
        # Set constant to provide everything to frontend.
        with self.swap(build, 'FILEPATHS_PROVIDED_TO_FRONTEND', ('*',)):
            hashes = {'path/to/file.js': '123456', 'path/file.min.js': '123456'}
            filtered_hashes = build.filter_hashes(hashes)
            self.assertEqual(
                filtered_hashes['/path/to/file.js'], hashes['path/to/file.js']
            )
            self.assertEqual(
                filtered_hashes['/path/file.min.js'], hashes['path/file.min.js']
            )

        with self.swap(
            build,
            'FILEPATHS_PROVIDED_TO_FRONTEND',
            ('test_path/*', 'path/to/file.js'),
        ):
            hashes = {
                'path/to/file.js': '123456',
                'test_path/to/file.html': '123456',
                'test_path/to/file.js': 'abcdef',
                'path/path/file.js': 'zyx123',
                'file.html': '321xyz',
            }
            filtered_hashes = build.filter_hashes(hashes)
            self.assertIn('/path/to/file.js', filtered_hashes)
            self.assertIn('/test_path/to/file.html', filtered_hashes)
            self.assertIn('/test_path/to/file.js', filtered_hashes)
            self.assertNotIn('/path/path/file.js', filtered_hashes)
            self.assertNotIn('/file.html', filtered_hashes)

    def test_save_hashes_to_file(self) -> None:
        """Test save_hashes_to_file saves provided hash dict correctly to
        JSON file.
        """
        hashes_path = os.path.join(MOCK_ASSETS_OUT_DIR, 'hashes.json')

        # Set constant to provide everything to frontend.
        with self.swap(build, 'FILEPATHS_PROVIDED_TO_FRONTEND', ('*',)):
            with self.swap(common, 'HASHES_JSON_FILEPATH', hashes_path):
                hashes = {'path/file.js': '123456'}
                build.save_hashes_to_file(hashes)
                with open(hashes_path, 'r', encoding='utf-8') as hashes_file:
                    self.assertEqual(
                        hashes_file.read(), '{"/path/file.js": "123456"}\n'
                    )

                hashes = {'file.js': '123456', 'file.min.js': '654321'}
                build.save_hashes_to_file(hashes)
                with open(hashes_path, 'r', encoding='utf-8') as hashes_file:
                    self.assertEqual(
                        ast.literal_eval(hashes_file.read()),
                        {'/file.min.js': '654321', '/file.js': '123456'},
                    )
                os.remove(hashes_path)

    def test_generate_app_yaml_with_deploy_mode(self) -> None:
        mock_dev_yaml_filepath = 'mock_app_dev.yaml'
        mock_yaml_filepath = 'mock_app.yaml'
        app_dev_yaml_filepath_swap = self.swap(
            build, 'APP_DEV_YAML_FILEPATH', mock_dev_yaml_filepath
        )
        app_yaml_filepath_swap = self.swap(
            build, 'APP_YAML_FILEPATH', mock_yaml_filepath
        )
        env_vars_to_remove_from_deployed_app_yaml_swap = self.swap(
            build,
            'ENV_VARS_TO_REMOVE_FROM_DEPLOYED_APP_YAML',
            ['FIREBASE_AUTH_EMULATOR_HOST'],
        )

        app_dev_yaml_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(app_dev_yaml_temp_file, 'name', mock_dev_yaml_filepath)
        with open(mock_dev_yaml_filepath, 'w', encoding='utf-8') as tmp:
            tmp.write('Some content in mock_app_dev.yaml\n')
            tmp.write('  FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099"\n')
            tmp.write('version: default')

        app_yaml_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(app_yaml_temp_file, 'name', mock_yaml_filepath)
        with open(mock_yaml_filepath, 'w', encoding='utf-8') as tmp:
            tmp.write('Initial content in mock_app.yaml')

        with app_dev_yaml_filepath_swap, app_yaml_filepath_swap:
            with env_vars_to_remove_from_deployed_app_yaml_swap:
                build.generate_app_yaml(deploy_mode=True)

        with open(mock_yaml_filepath, 'r', encoding='utf-8') as yaml_file:
            content = yaml_file.read()

        self.assertEqual(
            content,
            '# THIS FILE IS AUTOGENERATED, DO NOT MODIFY\n'
            'Some content in mock_app_dev.yaml\n',
        )

        app_yaml_temp_file.close()
        app_dev_yaml_temp_file.close()

    def test_generate_app_yaml_rewrites_ckeditor_asset_paths(self) -> None:
        mock_dev_yaml_filepath = 'mock_app_dev.yaml'
        mock_yaml_filepath = 'mock_app.yaml'
        app_dev_yaml_filepath_swap = self.swap(
            build, 'APP_DEV_YAML_FILEPATH', mock_dev_yaml_filepath
        )
        app_yaml_filepath_swap = self.swap(
            build, 'APP_YAML_FILEPATH', mock_yaml_filepath
        )

        app_dev_yaml_temp_file = tempfile.NamedTemporaryFile()
        setattr(app_dev_yaml_temp_file, 'name', mock_dev_yaml_filepath)
        with open(mock_dev_yaml_filepath, 'w', encoding='utf-8') as tmp:
            tmp.write('handlers:\r\n')
            tmp.write('- url: /third_party/ckeditor\r\n')
            tmp.write(
                '  static_dir: dist/oppia-angular/third_party/ckeditor   \r\n'
            )
            tmp.write('- url: /third_party/ckeditor-bootstrapck\r\n')
            tmp.write(
                '  static_dir: dist/oppia-angular/third_party/ckeditor-bootstrapck\r\n'
            )

        app_yaml_temp_file = tempfile.NamedTemporaryFile()
        setattr(app_yaml_temp_file, 'name', mock_yaml_filepath)
        with open(mock_yaml_filepath, 'w', encoding='utf-8') as tmp:
            tmp.write('Initial content in mock_app.yaml')

        with app_dev_yaml_filepath_swap, app_yaml_filepath_swap:
            build.generate_app_yaml(deploy_mode=False)

        with open(mock_yaml_filepath, 'r', encoding='utf-8') as yaml_file:
            content = yaml_file.read()

        self.assertIn(
            'static_dir: build/third_party/ckeditor\n',
            content,
        )
        self.assertIn(
            ('static_dir: ' 'build/third_party/ckeditor-bootstrapck\n'),
            content,
        )
        self.assertNotIn(
            'static_dir: dist/oppia-angular/third_party/ckeditor\n', content
        )
        self.assertNotIn(
            'static_dir: dist/oppia-angular/third_party/ckeditor-bootstrapck\n',
            content,
        )

        app_yaml_temp_file.close()
        app_dev_yaml_temp_file.close()

    def test_generate_app_yaml_with_deploy_mode_with_nonexistent_var_raises(
        self,
    ) -> None:
        mock_dev_yaml_filepath = 'mock_app_dev.yaml'
        mock_yaml_filepath = 'mock_app.yaml'
        app_dev_yaml_filepath_swap = self.swap(
            build, 'APP_DEV_YAML_FILEPATH', mock_dev_yaml_filepath
        )
        app_yaml_filepath_swap = self.swap(
            build, 'APP_YAML_FILEPATH', mock_yaml_filepath
        )
        env_vars_to_remove_from_deployed_app_yaml_swap = self.swap(
            build,
            'ENV_VARS_TO_REMOVE_FROM_DEPLOYED_APP_YAML',
            ['DATASTORE_HOST'],
        )

        app_dev_yaml_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(app_dev_yaml_temp_file, 'name', mock_dev_yaml_filepath)
        with open(mock_dev_yaml_filepath, 'w', encoding='utf-8') as tmp:
            tmp.write('Some content in mock_app_dev.yaml\n')
            tmp.write('  FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099"\n')
            tmp.write('version: default')

        app_yaml_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(app_yaml_temp_file, 'name', mock_yaml_filepath)
        with open(mock_yaml_filepath, 'w', encoding='utf-8') as tmp:
            tmp.write('Initial content in mock_app.yaml')

        with app_dev_yaml_filepath_swap, app_yaml_filepath_swap:
            with env_vars_to_remove_from_deployed_app_yaml_swap:
                with self.assertRaisesRegex(
                    Exception,
                    'Environment variable \'DATASTORE_HOST\' to be '
                    'removed does not exist.',
                ):
                    build.generate_app_yaml(deploy_mode=True)

        with open(mock_yaml_filepath, 'r', encoding='utf-8') as yaml_file:
            content = yaml_file.read()

        self.assertEqual(content, 'Initial content in mock_app.yaml')

        app_yaml_temp_file.close()
        app_dev_yaml_temp_file.close()

    def test_safe_delete_file(self) -> None:
        """Test safe_delete_file with both existent and non-existent
        filepath.
        """
        temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(temp_file, 'name', 'some_file.txt')
        with open('some_file.txt', 'w', encoding='utf-8') as tmp:
            tmp.write('Some content.')
        self.assertTrue(os.path.isfile('some_file.txt'))

        build.safe_delete_file('some_file.txt')
        self.assertFalse(os.path.isfile('some_file.txt'))

        non_existent_filepaths = [INVALID_INPUT_FILEPATH]
        # Escape the special characters, like '\', in the file paths.
        # The '\' character is usually seem in Windows style path.
        # https://docs.python.org/2/library/os.html#os.sep
        # https://docs.python.org/2/library/re.html#regular-expression-syntax
        error_message = ('File %s does not exist.') % re.escape(
            non_existent_filepaths[0]
        )
        # Exception will be raised at first file determined to be non-existent.
        with self.assertRaisesRegex(OSError, error_message):
            build.safe_delete_file(non_existent_filepaths[0])

    def test_clean(self) -> None:
        check_function_calls = {
            'safe_delete_directory_tree_gets_called': 0,
        }
        expected_check_function_calls = {
            'safe_delete_directory_tree_gets_called': 1,
        }

        def mock_safe_delete_directory_tree(unused_path: str) -> None:
            check_function_calls['safe_delete_directory_tree_gets_called'] += 1

        with self.swap(
            build, 'safe_delete_directory_tree', mock_safe_delete_directory_tree
        ):
            build.clean()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_build_with_prod_env(self) -> None:
        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', lambda _: None
        )
        build_using_ng_swap = self.swap_with_checks(
            build, 'build_using_ng', lambda: None, expected_args=[()]
        )
        modify_constants_swap = self.swap_with_checks(
            common,
            'modify_constants',
            lambda **_: None,
            expected_kwargs=[
                {
                    'prod_env': True,
                    'emulator_mode': True,
                    'maintenance_mode': False,
                }
            ],
        )
        generate_python_package_swap = self.swap_with_checks(
            build, 'generate_python_package', lambda: None, expected_args=[()]
        )
        clean_swap = self.swap_with_checks(
            build, 'clean', lambda: None, expected_args=[()]
        )
        sync_angular_css_hashes_swap = self.swap_with_checks(
            build, 'sync_angular_css_hashes', lambda: None, expected_args=[()]
        )

        with ensure_files_exist_swap, clean_swap:
            with modify_constants_swap, build_using_ng_swap:
                with generate_python_package_swap, sync_angular_css_hashes_swap:
                    build.main(args=['--prod_env'])

    def test_build_with_prod_source_maps(self) -> None:
        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', lambda _: None
        )
        build_using_ng_swap = self.swap_with_checks(
            build, 'build_using_ng', lambda: None, expected_args=[()]
        )
        modify_constants_swap = self.swap_with_checks(
            common,
            'modify_constants',
            lambda **_: None,
            expected_kwargs=[
                {
                    'prod_env': True,
                    'emulator_mode': True,
                    'maintenance_mode': False,
                }
            ],
        )
        clean_swap = self.swap_with_checks(
            build, 'clean', lambda: None, expected_args=[()]
        )
        install_python_dev_dependencies_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'main',
            lambda _: None,
            expected_args=[(['--uninstall'],)],
        )
        install_third_party_libs_swap = self.swap_with_checks(
            install_third_party_libs, 'main', lambda: None, expected_args=[()]
        )
        sync_angular_css_hashes_swap = self.swap_with_checks(
            build, 'sync_angular_css_hashes', lambda: None, expected_args=[()]
        )

        with ensure_files_exist_swap:
            with modify_constants_swap:
                with clean_swap, install_python_dev_dependencies_swap:
                    with build_using_ng_swap, install_third_party_libs_swap:
                        with sync_angular_css_hashes_swap:
                            build.main(args=['--prod_env', '--source_maps'])

    def test_build_with_watcher(self) -> None:
        check_function_calls = {
            'ensure_files_exist_gets_called': False,
            'modify_constants_gets_called': False,
            'clean_gets_called': False,
        }
        expected_check_function_calls = {
            'ensure_files_exist_gets_called': False,
            'modify_constants_gets_called': True,
            'clean_gets_called': True,
        }

        def mock_ensure_files_exist(unused_filepaths: List[str]) -> None:
            check_function_calls['ensure_files_exist_gets_called'] = True

        def mock_modify_constants(
            prod_env: bool,  # pylint: disable=unused-argument
            emulator_mode: bool,  # pylint: disable=unused-argument
            maintenance_mode: bool,  # pylint: disable=unused-argument
        ) -> None:
            check_function_calls['modify_constants_gets_called'] = True

        def mock_clean() -> None:
            check_function_calls['clean_gets_called'] = True

        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', mock_ensure_files_exist
        )
        modify_constants_swap = self.swap(
            common, 'modify_constants', mock_modify_constants
        )
        clean_swap = self.swap(build, 'clean', mock_clean)

        with ensure_files_exist_swap, modify_constants_swap, clean_swap:
            build.main(args=[])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_cannot_maintenance_mode_in_dev_mode(self) -> None:
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'maintenance_mode should only be enabled in prod build.'
        )
        with assert_raises_regexp_context_manager:
            build.main(args=['--maintenance_mode'])

    def test_build_using_ng_command(self) -> None:

        @contextlib.contextmanager
        def mock_managed_ng_build(  # pylint: disable=unused-argument
            use_prod_env: bool, watch_mode: bool
        ) -> Iterator[scripts_test_utils.PopenStub]:
            yield scripts_test_utils.PopenStub()

        def mock_get_file_count(unused_path: str) -> int:
            return 1

        ng_build_swap = self.swap_with_checks(
            servers,
            'managed_ng_build',
            mock_managed_ng_build,
            expected_kwargs=[{'use_prod_env': True, 'watch_mode': False}],
        )
        get_file_count_swap = self.swap_with_checks(
            build,
            'get_file_count',
            mock_get_file_count,
            expected_args=[('build',)],
        )

        with ng_build_swap, get_file_count_swap:
            build.build_using_ng()

    def test_build_using_ng_command_with_incorrect_filecount_fails(
        self,
    ) -> None:

        @contextlib.contextmanager
        def mock_managed_ng_build(  # pylint: disable=unused-argument
            use_prod_env: bool, watch_mode: bool
        ) -> Iterator[scripts_test_utils.PopenStub]:
            yield scripts_test_utils.PopenStub()

        def mock_get_file_count(unused_path: str) -> int:
            return 0

        ng_build_swap = self.swap_with_checks(
            servers,
            'managed_ng_build',
            mock_managed_ng_build,
            expected_kwargs=[{'use_prod_env': True, 'watch_mode': False}],
        )
        get_file_count_swap = self.swap_with_checks(
            build,
            'get_file_count',
            mock_get_file_count,
            expected_args=[('build',)],
        )

        with ng_build_swap, get_file_count_swap:
            with self.assertRaisesRegex(
                AssertionError, 'angular generated bundle should be non-empty'
            ):
                build.build_using_ng()

    def test_sync_angular_css_hashes_with_missing_dist_dir_fails(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            old_working_dir = os.getcwd()
            os.chdir(temp_dir)
            try:
                with self.assertRaisesRegex(
                    RuntimeError,
                    'build does not exist. '
                    'Angular CLI build may have failed.',
                ):
                    build.sync_angular_css_hashes()
            finally:
                os.chdir(old_working_dir)

    def test_sync_angular_css_hashes_updates_both_hashes_together(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            old_working_dir = os.getcwd()
            os.chdir(temp_dir)
            try:
                os.makedirs('build', exist_ok=True)
                pathlib.Path('build/styles.abc123.css').touch()
                pathlib.Path('build/vendor-styles.def456.css').touch()

                os.makedirs('assets', exist_ok=True)
                with open(
                    build.HASHES_JSON_FILEPATH, 'w', encoding='utf-8'
                ) as f:
                    f.write(json.dumps({'existing_hash': '123'}))

                updated_hashes: List[Dict[str, str]] = []

                def mock_write_hashes_json_file(hashes: Dict[str, str]) -> None:
                    updated_hashes.append(dict(hashes))

                write_hashes_swap = self.swap(
                    common,
                    'write_hashes_json_file',
                    mock_write_hashes_json_file,
                )

                with write_hashes_swap:
                    build.sync_angular_css_hashes()

                self.assertEqual(len(updated_hashes), 1)
                self.assertEqual(updated_hashes[0]['existing_hash'], '123')
                self.assertEqual(updated_hashes[0]['angular_styles'], 'abc123')
                self.assertEqual(
                    updated_hashes[0]['angular_vendor_styles'], 'def456'
                )
            finally:
                os.chdir(old_working_dir)


class E2EAndAcceptanceBuildTests(test_utils.GenericTestBase):
    """Test the end to end build methods."""

    def setUp(self) -> None:
        super().setUp()
        self.exit_stack = contextlib.ExitStack()

    def tearDown(self) -> None:
        try:
            self.exit_stack.close()
        finally:
            super().tearDown()

    def test_build_js_files_in_prod_mode(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'run_cmd', lambda *_: None, called=False
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                build,
                'main',
                lambda *_, **__: None,
                expected_kwargs=[{'args': ['--prod_env']}],
            )
        )

        build.build_js_files(False)

    def test_build_js_files_in_prod_mode_with_source_maps(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'run_cmd', lambda *_: None, called=False
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                build,
                'main',
                lambda *_, **__: None,
                expected_kwargs=[{'args': ['--prod_env', '--source_maps']}],
            )
        )

        build.build_js_files(False, source_maps=True)
