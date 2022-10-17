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
import collections
import contextlib
import io
import os
import re
import subprocess
import tempfile
import threading

from core import utils
from core.tests import test_utils

from typing import Deque, Dict, Iterator, List, Tuple, Union

from . import build
from . import common
from . import scripts_test_utils
from . import servers

TEST_DIR = os.path.join('core', 'tests', 'build', '')
TEST_SOURCE_DIR = os.path.join('core', 'tests', 'build_sources')

MOCK_ASSETS_DEV_DIR = os.path.join(TEST_SOURCE_DIR, 'assets', '')
MOCK_ASSETS_OUT_DIR = os.path.join(TEST_DIR, 'static', 'assets', '')
MOCK_EXTENSIONS_DEV_DIR = os.path.join(TEST_SOURCE_DIR, 'extensions', '')
MOCK_TEMPLATES_DEV_DIR = os.path.join(TEST_SOURCE_DIR, 'templates', '')

MOCK_TSC_OUTPUT_LOG_FILEPATH = os.path.join(
    TEST_SOURCE_DIR, 'mock_tsc_output_log.txt')
INVALID_FILENAME = 'invalid_filename.js'
INVALID_INPUT_FILEPATH = os.path.join(
    TEST_DIR, INVALID_FILENAME)
INVALID_OUTPUT_FILEPATH = os.path.join(
    TEST_DIR, INVALID_FILENAME)

EMPTY_DIR = os.path.join(TEST_DIR, 'empty', '')


class BuildTests(test_utils.GenericTestBase):
    """Test the build methods."""

    def tearDown(self) -> None:
        super().tearDown()
        build.safe_delete_directory_tree(TEST_DIR)
        build.safe_delete_directory_tree(EMPTY_DIR)

    def test_minify_func_with_invalid_filepath(self) -> None:
        """Tests minify_func with an invalid filepath."""
        with self.assertRaisesRegex(
            subprocess.CalledProcessError,
            'returned non-zero exit status 1') as called_process:
            build.minify_func(
                INVALID_INPUT_FILEPATH,
                INVALID_OUTPUT_FILEPATH,
                INVALID_FILENAME)
        # Here we use MyPy ignore because the stubs of 'assertRaisesRegex' do
        # not contain any returncode attribute, so because of this MyPy throws
        # an '"Exception" has no attribute "returncode"' error. Thus to avoid
        # the error, we used ignore here.
        # `returncode` is the exit status of the child process.
        self.assertEqual(called_process.exception.returncode, 1)  # type: ignore[attr-defined]

    def test_minify_and_create_sourcemap(self) -> None:
        """Tests _minify_and_create_sourcemap with an invalid filepath."""
        with self.assertRaisesRegex(
            subprocess.CalledProcessError,
            'returned non-zero exit status 1') as called_process:
            build._minify_and_create_sourcemap(  # pylint: disable=protected-access
                INVALID_INPUT_FILEPATH, INVALID_OUTPUT_FILEPATH)
        # Here we use MyPy ignore because the stubs of 'assertRaisesRegex' do
        # not contain any returncode attribute, so because of this MyPy throws
        # an '"Exception" has no attribute "returncode"' error. Thus to avoid
        # the error, we used ignore here.
        # `returncode` is the exit status of the child process.
        self.assertEqual(called_process.exception.returncode, 1)  # type: ignore[attr-defined]

    def test_join_files(self) -> None:
        """Determine third_party.js contains the content of the first 10 JS
        files in /third_party/static.
        """
        third_party_js_stream = io.StringIO()
        # Get all filepaths from dependencies.json.
        dependency_filepaths = build.get_dependencies_filepaths()
        # Join and write all JS files in /third_party/static to file_stream.
        build._join_files(dependency_filepaths['js'], third_party_js_stream)  # pylint: disable=protected-access
        counter = 0
        # Only checking first 10 files.
        js_file_count = 10
        for js_filepath in dependency_filepaths['js']:
            if counter == js_file_count:
                break
            with utils.open_file(js_filepath, 'r') as js_file:
                # Assert that each line is copied over to file_stream object.
                for line in js_file:
                    self.assertIn(line, third_party_js_stream.getvalue())
            counter += 1

    def test_generate_copy_tasks_for_fonts(self) -> None:
        """Test _generate_copy_tasks_for_fonts ensures that the number of copy
        tasks matches the number of font files.
        """
        copy_tasks: Deque[threading.Thread] = collections.deque()
        # Get all filepaths from dependencies.json.
        dependency_filepaths = build.get_dependencies_filepaths()
        # Setup a sandbox folder for copying fonts.
        test_target = os.path.join('target', 'fonts', '')

        self.assertEqual(len(copy_tasks), 0)
        copy_tasks += build._generate_copy_tasks_for_fonts(  # pylint: disable=protected-access
            dependency_filepaths['fonts'], test_target)
        # Asserting the same number of copy tasks and number of font files.
        self.assertEqual(len(copy_tasks), len(dependency_filepaths['fonts']))

    def test_insert_hash(self) -> None:
        """Test _insert_hash returns correct filenames with provided hashes."""
        self.assertEqual(
            build._insert_hash('file.js', '123456'), 'file.123456.js')  # pylint: disable=protected-access
        self.assertEqual(
            build._insert_hash(  # pylint: disable=protected-access
                'path/to/file.js', '654321'), 'path/to/file.654321.js')
        self.assertEqual(
            build._insert_hash('file.min.js', 'abcdef'), 'file.min.abcdef.js')  # pylint: disable=protected-access
        self.assertEqual(
            build._insert_hash(  # pylint: disable=protected-access
                'path/to/file.min.js', 'fedcba'), 'path/to/file.min.fedcba.js')

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
                        for p in build.FILE_EXTENSIONS_TO_IGNORE):
                    ignored_file_count += 1
        self.assertEqual(
            all_inclusive_file_count - ignored_file_count,
            build.get_file_count(MOCK_EXTENSIONS_DEV_DIR))

    def test_compare_file_count(self) -> None:
        """Test _compare_file_count raises exception when there is a
        mismatched file count between 2 dirs list.
        """

        # Test when both lists contain single directory.
        build.ensure_directory_exists(EMPTY_DIR)
        source_dir_file_count = build.get_file_count(EMPTY_DIR)
        assert source_dir_file_count == 0
        target_dir_file_count = build.get_file_count(MOCK_ASSETS_DEV_DIR)
        # Ensure that ASSETS_DEV_DIR has at least 1 file.
        assert target_dir_file_count > 0
        with self.assertRaisesRegex(
            ValueError, (
                '%s files in first dir list != %s files in second dir list') %
            (source_dir_file_count, target_dir_file_count)):
            build._compare_file_count([EMPTY_DIR], [MOCK_ASSETS_DEV_DIR])  # pylint: disable=protected-access

        # Test when one of the lists contain multiple directories.
        mock_extensions_dir_list = [MOCK_EXTENSIONS_DEV_DIR]
        target_dir_file_count = build.get_file_count(MOCK_EXTENSIONS_DEV_DIR)

        # Ensure that MOCK_EXTENSIONS_DIR has at least 1 file.
        assert target_dir_file_count > 0
        with self.assertRaisesRegex(
            ValueError, (
                '%s files in first dir list != %s files in second dir list') %
            (source_dir_file_count, target_dir_file_count)):
            build._compare_file_count([EMPTY_DIR], mock_extensions_dir_list)  # pylint: disable=protected-access

        # Reset EMPTY_DIRECTORY to clean state.
        build.safe_delete_directory_tree(EMPTY_DIR)

    def test_verify_filepath_hash(self) -> None:
        """Test _verify_filepath_hash raises exception:
            1) When there is an empty hash dict.
            2) When a filename is expected to contain hash but does not.
            3) When there is a hash in filename that cannot be found in
                hash dict.
        """
        # Final filepath example: base.240933e7564bd72a4dde42ee23260c5f.html.
        file_hashes: Dict[str, str] = {}
        base_filename = 'base.html'
        with self.assertRaisesRegex(ValueError, 'Hash dict is empty'):
            build._verify_filepath_hash(base_filename, file_hashes)  # pylint: disable=protected-access

        # Generate a random hash dict for base.html.
        file_hashes = {base_filename: (
            test_utils.generate_random_hexa_str())}
        with self.assertRaisesRegex(
            ValueError, '%s is expected to contain MD5 hash' % base_filename):
            build._verify_filepath_hash(base_filename, file_hashes)  # pylint: disable=protected-access

        base_without_hash_filename = 'base_without_hash.html'
        build._verify_filepath_hash(  # pylint: disable=protected-access
            base_without_hash_filename, file_hashes)

        bad_filepath = 'README'
        with self.assertRaisesRegex(
            ValueError, 'Filepath has less than 2 partitions after splitting'):
            build._verify_filepath_hash(bad_filepath, file_hashes)  # pylint: disable=protected-access

        hashed_base_filename = build._insert_hash(  # pylint: disable=protected-access
            base_filename, test_utils.generate_random_hexa_str())
        with self.assertRaisesRegex(
            KeyError,
            'Hash from file named %s does not match hash dict values' %
            hashed_base_filename):
            build._verify_filepath_hash(hashed_base_filename, file_hashes)  # pylint: disable=protected-access

    def test_process_html(self) -> None:
        """Test process_html removes whitespaces."""
        base_html_source_path = (
            os.path.join(MOCK_TEMPLATES_DEV_DIR, 'base.html'))

        build._ensure_files_exist([base_html_source_path])  # pylint: disable=protected-access
        minified_html_file_stream = io.StringIO()

        # Assert that base.html has white spaces and has original filepaths.
        with utils.open_file(
            base_html_source_path, 'r') as source_base_file:
            source_base_file_content = source_base_file.read()
            self.assertRegex(
                source_base_file_content, r'\s{2,}',
                msg='No white spaces detected in %s unexpectedly'
                % base_html_source_path)

        # Build base.html file.
        with utils.open_file(
            base_html_source_path, 'r') as source_base_file:
            build.process_html(source_base_file, minified_html_file_stream)

        minified_html_file_content = minified_html_file_stream.getvalue()
        self.assertNotRegex(
            minified_html_file_content, r'\s{2,}',
            msg='All white spaces must be removed from %s' %
            base_html_source_path)

    def test_should_file_be_built(self) -> None:
        """Test should_file_be_built returns the correct boolean value for
        filepath that should be built.
        """
        service_ts_filepath = os.path.join('core', 'pages', 'AudioService.ts')
        spec_js_filepath = os.path.join('core', 'pages', 'AudioServiceSpec.js')
        webdriverio_filepath = os.path.join('extensions', 'webdriverio.js')

        python_controller_filepath = os.path.join('base.py')
        pyc_test_filepath = os.path.join(
            'core', 'controllers', 'base.pyc')
        python_test_filepath = os.path.join(
            'core', 'tests', 'base_test.py')

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
            build, 'FILEPATHS_NOT_TO_RENAME', (
                '*.py', 'path/to/fonts/*', 'path/to/third_party.min.js.map',
                'path/to/third_party.min.css.map')
        ):
            self.assertFalse(build.hash_should_be_inserted(
                'path/to/fonts/fontawesome-webfont.svg'))
            self.assertFalse(build.hash_should_be_inserted(
                'path/to/third_party.min.css.map'))
            self.assertFalse(build.hash_should_be_inserted(
                'path/to/third_party.min.js.map'))
            self.assertTrue(build.hash_should_be_inserted(
                'path/to/wrongFonts/fonta.eot'))
            self.assertTrue(build.hash_should_be_inserted(
                'rich_text_components/Video/protractor.js'))
            self.assertFalse(build.hash_should_be_inserted(
                'main.py'))
            self.assertFalse(build.hash_should_be_inserted(
                'extensions/domain.py'))

    def test_generate_copy_tasks_to_copy_from_source_to_target(self) -> None:
        """Test generate_copy_tasks_to_copy_from_source_to_target queues up
        the same number of copy tasks as the number of files in the directory.
        """
        assets_hashes = build.get_file_hashes(MOCK_ASSETS_DEV_DIR)
        total_file_count = build.get_file_count(MOCK_ASSETS_DEV_DIR)
        copy_tasks: Deque[threading.Thread] = collections.deque()

        self.assertEqual(len(copy_tasks), 0)
        copy_tasks += build.generate_copy_tasks_to_copy_from_source_to_target(
            MOCK_ASSETS_DEV_DIR, MOCK_ASSETS_OUT_DIR, assets_hashes)
        self.assertEqual(len(copy_tasks), total_file_count)

    def test_is_file_hash_provided_to_frontend(self) -> None:
        """Test is_file_hash_provided_to_frontend returns the correct boolean
        value for filepath that should be provided to frontend.
        """
        with self.swap(
            build, 'FILEPATHS_PROVIDED_TO_FRONTEND',
            ('path/to/file.js', 'path/to/file.html', 'file.js')
        ):
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('path/to/file.js'))
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('path/to/file.html'))
            self.assertTrue(build.is_file_hash_provided_to_frontend('file.js'))
        with self.swap(
            build, 'FILEPATHS_PROVIDED_TO_FRONTEND',
            ('path/to/*', '*.js', '*_end.html')
        ):
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('path/to/file.js'))
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('path/to/file.html'))
            self.assertTrue(build.is_file_hash_provided_to_frontend('file.js'))
            self.assertFalse(
                build.is_file_hash_provided_to_frontend('path/file.css'))
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('good_end.html'))
            self.assertFalse(
                build.is_file_hash_provided_to_frontend('bad_end.css'))

    def test_get_filepaths_by_extensions(self) -> None:
        """Test get_filepaths_by_extensions only returns filepaths in
        directory with given extensions.
        """
        filepaths: List[str] = []
        build.ensure_directory_exists(MOCK_ASSETS_DEV_DIR)
        extensions: Tuple[str, ...] = ('.json', '.svg',)

        self.assertEqual(len(filepaths), 0)
        filepaths = build.get_filepaths_by_extensions(
            MOCK_ASSETS_DEV_DIR, extensions)
        for filepath in filepaths:
            self.assertTrue(any(filepath.endswith(p) for p in extensions))
        file_count = 0
        for _, _, filenames in os.walk(MOCK_ASSETS_DEV_DIR):
            for filename in filenames:
                if any(filename.endswith(p) for p in extensions):
                    file_count += 1
        self.assertEqual(len(filepaths), file_count)

        filepaths = []
        extensions = ('.pdf', '.viminfo', '.idea',)

        self.assertEqual(len(filepaths), 0)
        filepaths = build.get_filepaths_by_extensions(
            MOCK_ASSETS_DEV_DIR, extensions)
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
            hashes = {'path/to/file.js': '123456',
                      'path/file.min.js': '123456'}
            filtered_hashes = build.filter_hashes(hashes)
            self.assertEqual(
                filtered_hashes['/path/to/file.js'],
                hashes['path/to/file.js'])
            self.assertEqual(
                filtered_hashes['/path/file.min.js'],
                hashes['path/file.min.js'])

        with self.swap(
            build, 'FILEPATHS_PROVIDED_TO_FRONTEND',
            ('test_path/*', 'path/to/file.js')
        ):
            hashes = {'path/to/file.js': '123456',
                      'test_path/to/file.html': '123456',
                      'test_path/to/file.js': 'abcdef',
                      'path/path/file.js': 'zyx123',
                      'file.html': '321xyz'}
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
            with self.swap(build, 'HASHES_JSON_FILEPATH', hashes_path):
                hashes = {'path/file.js': '123456'}
                build.save_hashes_to_file(hashes)
                with utils.open_file(hashes_path, 'r') as hashes_file:
                    self.assertEqual(
                        hashes_file.read(), '{"/path/file.js": "123456"}\n')

                hashes = {'file.js': '123456', 'file.min.js': '654321'}
                build.save_hashes_to_file(hashes)
                with utils.open_file(hashes_path, 'r') as hashes_file:
                    self.assertEqual(
                        ast.literal_eval(hashes_file.read()),
                        {'/file.min.js': '654321', '/file.js': '123456'})
                os.remove(hashes_path)

    def test_execute_tasks(self) -> None:
        """Test _execute_tasks joins all threads after executing all tasks."""
        build_tasks: Deque[threading.Thread] = collections.deque()
        build_thread_names: List[Union[threading.Thread, str]] = []
        task_count = 2
        count = task_count
        while count:
            thread_name = 'Build-test-thread-%s' % count
            build_thread_names.append(thread_name)
            task = threading.Thread(
                name=thread_name,
                target=build.minify_func,
                args=(
                    INVALID_INPUT_FILEPATH,
                    INVALID_OUTPUT_FILEPATH,
                    INVALID_FILENAME))
            build_tasks.append(task)
            count -= 1

        extra_build_threads = [
            thread.name for thread in threading.enumerate()
            if thread in build_thread_names]
        self.assertEqual(len(extra_build_threads), 0)
        build._execute_tasks(build_tasks)  # pylint: disable=protected-access
        with self.assertRaisesRegex(
            OSError, 'threads can only be started once'):
            build._execute_tasks(build_tasks)  # pylint: disable=protected-access
        # Assert that all threads are joined.
        extra_build_threads = [
            thread.name for thread in threading.enumerate()
            if thread in build_thread_names]
        self.assertEqual(len(extra_build_threads), 0)

    def test_generate_build_tasks_to_build_all_files_in_directory(self) -> None:
        """Test generate_build_tasks_to_build_all_files_in_directory queues up
        the same number of build tasks as the number of files in the source
        directory.
        """
        tasks: Deque[threading.Thread] = collections.deque()

        self.assertEqual(len(tasks), 0)
        # Build all files.
        tasks = build.generate_build_tasks_to_build_all_files_in_directory(
            MOCK_ASSETS_DEV_DIR, MOCK_ASSETS_OUT_DIR)
        total_file_count = build.get_file_count(MOCK_ASSETS_DEV_DIR)
        self.assertEqual(len(tasks), total_file_count)

    def test_generate_build_tasks_to_build_files_from_filepaths(self) -> None:
        """Test generate_build_tasks_to_build_files_from_filepaths queues up a
        corresponding number of build tasks to the number of file changes.
        """
        new_filename = 'dependencies.json'
        recently_changed_filenames = [
            os.path.join(MOCK_ASSETS_DEV_DIR, new_filename)]
        build_tasks: Deque[threading.Thread] = collections.deque()

        self.assertEqual(len(build_tasks), 0)
        build_tasks += build.generate_build_tasks_to_build_files_from_filepaths(
            MOCK_ASSETS_DEV_DIR, MOCK_ASSETS_OUT_DIR,
            recently_changed_filenames)
        self.assertEqual(len(build_tasks), len(recently_changed_filenames))

        build_tasks.clear()
        svg_filepaths = build.get_filepaths_by_extensions(
            MOCK_ASSETS_DEV_DIR, ('.svg',))
        # Make sure there is at least 1 SVG file.
        self.assertGreater(len(svg_filepaths), 0)

        self.assertEqual(len(build_tasks), 0)
        build_tasks += build.generate_build_tasks_to_build_files_from_filepaths(
            MOCK_ASSETS_DEV_DIR, MOCK_ASSETS_OUT_DIR, svg_filepaths)
        self.assertEqual(len(build_tasks), len(svg_filepaths))

    def test_generate_build_tasks_to_build_directory(self) -> None:
        """Test generate_build_tasks_to_build_directory queues up a
        corresponding number of build tasks according to the given scenario.
        """
        extensions_dirnames_to_dirpaths = {
            'dev_dir': MOCK_EXTENSIONS_DEV_DIR,
            'staging_dir': os.path.join(
                TEST_DIR, 'backend_prod_files', 'extensions', ''),
            'out_dir': os.path.join(TEST_DIR, 'build', 'extensions', '')
        }
        file_hashes = build.get_file_hashes(MOCK_EXTENSIONS_DEV_DIR)
        build_dir_tasks: Deque[threading.Thread] = collections.deque()
        build_all_files_tasks = (
            build.generate_build_tasks_to_build_all_files_in_directory(
                MOCK_EXTENSIONS_DEV_DIR,
                extensions_dirnames_to_dirpaths['out_dir']))
        self.assertGreater(len(build_all_files_tasks), 0)

        # Test for building all files when staging dir does not exist.
        self.assertEqual(len(build_dir_tasks), 0)
        build_dir_tasks += build.generate_build_tasks_to_build_directory(
            extensions_dirnames_to_dirpaths)
        self.assertEqual(len(build_dir_tasks), len(build_all_files_tasks))

        build.safe_delete_directory_tree(TEST_DIR)
        build_dir_tasks.clear()

        # Test for building only new files when staging dir exists.
        build.ensure_directory_exists(
            extensions_dirnames_to_dirpaths['staging_dir'])
        self.assertEqual(len(build_dir_tasks), 0)

        build_dir_tasks += build.generate_build_tasks_to_build_directory(
            extensions_dirnames_to_dirpaths)
        self.assertEqual(len(build_dir_tasks), len(build_all_files_tasks))

        build.safe_delete_directory_tree(TEST_DIR)

        # Build all files and save to final directory.
        build.ensure_directory_exists(
            extensions_dirnames_to_dirpaths['staging_dir'])
        build._execute_tasks(build_dir_tasks)  # pylint: disable=protected-access
        self.assertEqual(threading.active_count(), 1)
        build._execute_tasks(  # pylint: disable=protected-access
            build.generate_copy_tasks_to_copy_from_source_to_target(
                extensions_dirnames_to_dirpaths['staging_dir'],
                extensions_dirnames_to_dirpaths['out_dir'], file_hashes))

        build_dir_tasks.clear()

        # Test for only building files that need to be rebuilt.
        self.assertEqual(len(build_dir_tasks), 0)
        build_dir_tasks += build.generate_build_tasks_to_build_directory(
            extensions_dirnames_to_dirpaths)
        file_extensions_to_always_rebuild = ('.html', '.py',)
        always_rebuilt_filepaths = build.get_filepaths_by_extensions(
            MOCK_EXTENSIONS_DEV_DIR, file_extensions_to_always_rebuild)
        self.assertGreater(len(always_rebuilt_filepaths), 0)
        self.assertEqual(len(build_dir_tasks), len(always_rebuilt_filepaths))

        build.safe_delete_directory_tree(TEST_DIR)

    def test_re_build_recently_changed_files_at_dev_dir(self) -> None:
        temp_file = tempfile.NamedTemporaryFile()
        temp_file_name = '%ssome_file.js' % MOCK_EXTENSIONS_DEV_DIR
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(temp_file, 'name', temp_file_name)
        with utils.open_file(
            '%ssome_file.js' % MOCK_EXTENSIONS_DEV_DIR, 'w') as tmp:
            tmp.write(u'Some content.')

        extensions_dirnames_to_dirpaths = {
            'dev_dir': MOCK_EXTENSIONS_DEV_DIR,
            'staging_dir': os.path.join(
                TEST_DIR, 'backend_prod_files', 'extensions', ''),
            'out_dir': os.path.join(TEST_DIR, 'build', 'extensions', '')
        }

        build_dir_tasks: Deque[threading.Thread] = collections.deque()
        build_all_files_tasks = (
            build.generate_build_tasks_to_build_all_files_in_directory(
                MOCK_EXTENSIONS_DEV_DIR,
                extensions_dirnames_to_dirpaths['out_dir']))
        self.assertGreater(len(build_all_files_tasks), 0)

        # Test for building all files when staging dir does not exist.
        self.assertEqual(len(build_dir_tasks), 0)
        build_dir_tasks += build.generate_build_tasks_to_build_directory(
            extensions_dirnames_to_dirpaths)
        self.assertEqual(len(build_dir_tasks), len(build_all_files_tasks))

        build.safe_delete_directory_tree(TEST_DIR)
        build_dir_tasks.clear()

        # Test for building only new files when staging dir exists.
        build.ensure_directory_exists(
            extensions_dirnames_to_dirpaths['staging_dir'])
        self.assertEqual(len(build_dir_tasks), 0)

        build_dir_tasks = build.generate_build_tasks_to_build_directory(
            extensions_dirnames_to_dirpaths)
        file_extensions_to_always_rebuild = ('.py', '.js', '.html')
        always_rebuilt_filepaths = build.get_filepaths_by_extensions(
            MOCK_EXTENSIONS_DEV_DIR, file_extensions_to_always_rebuild)
        self.assertEqual(
            sorted(always_rebuilt_filepaths), sorted(
                ['base.py', 'CodeRepl.py', '__init__.py', 'some_file.js',
                 'DragAndDropSortInput.py', 'code_repl_prediction.html']))
        self.assertGreater(len(always_rebuilt_filepaths), 0)

        # Test that 'some_file.js' is not rebuilt, i.e it is built for the first
        # time.
        self.assertEqual(len(build_dir_tasks), len(always_rebuilt_filepaths))
        self.assertIn('some_file.js', always_rebuilt_filepaths)
        self.assertNotIn('some_file.js', build_dir_tasks)

        build.safe_delete_directory_tree(TEST_DIR)
        temp_file.close()

        if os.path.isfile(temp_file_name):
            # On Windows system, occasionally this temp file is not deleted.
            os.remove(temp_file_name)

    def test_get_recently_changed_filenames(self) -> None:
        """Test get_recently_changed_filenames detects file recently added."""
        # Create an empty folder.
        build.ensure_directory_exists(EMPTY_DIR)
        # Get hashes from ASSETS_DEV_DIR to simulate a folder with built files.
        assets_hashes = build.get_file_hashes(MOCK_ASSETS_DEV_DIR)
        recently_changed_filenames: List[str] = []

        self.assertEqual(len(recently_changed_filenames), 0)
        recently_changed_filenames = build.get_recently_changed_filenames(
            assets_hashes, EMPTY_DIR)
        # Since all HTML and Python files are already built, they are ignored.
        with self.swap(build, 'FILE_EXTENSIONS_TO_IGNORE', ('.html', '.py',)):
            self.assertEqual(
                len(recently_changed_filenames), build.get_file_count(
                    MOCK_ASSETS_DEV_DIR))

        build.safe_delete_directory_tree(EMPTY_DIR)

    def test_generate_delete_tasks_to_remove_deleted_files(self) -> None:
        """Test generate_delete_tasks_to_remove_deleted_files queues up the
        same number of deletion task as the number of deleted files.
        """
        delete_tasks: Deque[threading.Thread] = collections.deque()
        # The empty dict means that all files should be removed.
        file_hashes: Dict[str, str] = {}

        self.assertEqual(len(delete_tasks), 0)
        delete_tasks += build.generate_delete_tasks_to_remove_deleted_files(
            file_hashes, MOCK_TEMPLATES_DEV_DIR)
        self.assertEqual(
            len(delete_tasks), build.get_file_count(MOCK_TEMPLATES_DEV_DIR))

    def test_generate_app_yaml_with_deploy_mode(self) -> None:
        mock_dev_yaml_filepath = 'mock_app_dev.yaml'
        mock_yaml_filepath = 'mock_app.yaml'
        app_dev_yaml_filepath_swap = self.swap(
            build, 'APP_DEV_YAML_FILEPATH', mock_dev_yaml_filepath)
        app_yaml_filepath_swap = self.swap(
            build, 'APP_YAML_FILEPATH', mock_yaml_filepath)
        env_vars_to_remove_from_deployed_app_yaml_swap = self.swap(
            build,
            'ENV_VARS_TO_REMOVE_FROM_DEPLOYED_APP_YAML',
            ['FIREBASE_AUTH_EMULATOR_HOST']
        )

        app_dev_yaml_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(
            app_dev_yaml_temp_file, 'name', mock_dev_yaml_filepath)
        with utils.open_file(mock_dev_yaml_filepath, 'w') as tmp:
            tmp.write('Some content in mock_app_dev.yaml\n')
            tmp.write('  FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099"\n')
            tmp.write('version: default')

        app_yaml_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(app_yaml_temp_file, 'name', mock_yaml_filepath)
        with utils.open_file(mock_yaml_filepath, 'w') as tmp:
            tmp.write(u'Initial content in mock_app.yaml')

        with app_dev_yaml_filepath_swap, app_yaml_filepath_swap:
            with env_vars_to_remove_from_deployed_app_yaml_swap:
                build.generate_app_yaml(deploy_mode=True)

        with utils.open_file(mock_yaml_filepath, 'r') as yaml_file:
            content = yaml_file.read()

        self.assertEqual(
            content,
            '# THIS FILE IS AUTOGENERATED, DO NOT MODIFY\n'
            'Some content in mock_app_dev.yaml\n')

        app_yaml_temp_file.close()
        app_dev_yaml_temp_file.close()

    def test_generate_app_yaml_with_deploy_mode_with_nonexistent_var_raises(
        self
    ) -> None:
        mock_dev_yaml_filepath = 'mock_app_dev.yaml'
        mock_yaml_filepath = 'mock_app.yaml'
        app_dev_yaml_filepath_swap = self.swap(
            build, 'APP_DEV_YAML_FILEPATH', mock_dev_yaml_filepath)
        app_yaml_filepath_swap = self.swap(
            build, 'APP_YAML_FILEPATH', mock_yaml_filepath)
        env_vars_to_remove_from_deployed_app_yaml_swap = self.swap(
            build,
            'ENV_VARS_TO_REMOVE_FROM_DEPLOYED_APP_YAML',
            ['DATASTORE_HOST']
        )

        app_dev_yaml_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(
            app_dev_yaml_temp_file, 'name', mock_dev_yaml_filepath)
        with utils.open_file(mock_dev_yaml_filepath, 'w') as tmp:
            tmp.write('Some content in mock_app_dev.yaml\n')
            tmp.write('  FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099"\n')
            tmp.write('version: default')

        app_yaml_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(app_yaml_temp_file, 'name', mock_yaml_filepath)
        with utils.open_file(mock_yaml_filepath, 'w') as tmp:
            tmp.write('Initial content in mock_app.yaml')

        with app_dev_yaml_filepath_swap, app_yaml_filepath_swap:
            with env_vars_to_remove_from_deployed_app_yaml_swap:
                with self.assertRaisesRegex(
                        Exception,
                        'Environment variable \'DATASTORE_HOST\' to be '
                        'removed does not exist.'
                ):
                    build.generate_app_yaml(deploy_mode=True)

        with utils.open_file(mock_yaml_filepath, 'r') as yaml_file:
            content = yaml_file.read()

        self.assertEqual(content, 'Initial content in mock_app.yaml')

        app_yaml_temp_file.close()
        app_dev_yaml_temp_file.close()

    def test_modify_constants(self) -> None:
        mock_constants_path = 'mock_app_dev.yaml'
        mock_feconf_path = 'mock_app.yaml'
        constants_path_swap = self.swap(
            common, 'CONSTANTS_FILE_PATH', mock_constants_path)
        feconf_path_swap = self.swap(common, 'FECONF_PATH', mock_feconf_path)

        constants_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(
            constants_temp_file, 'name', mock_constants_path)
        with utils.open_file(mock_constants_path, 'w') as tmp:
            tmp.write('export = {\n')
            tmp.write('  "DEV_MODE": true,\n')
            tmp.write('  "EMULATOR_MODE": false,\n')
            tmp.write('};')

        feconf_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(feconf_temp_file, 'name', mock_feconf_path)
        with utils.open_file(mock_feconf_path, 'w') as tmp:
            tmp.write(u'ENABLE_MAINTENANCE_MODE = False')

        with constants_path_swap, feconf_path_swap:
            build.modify_constants(prod_env=True, maintenance_mode=False)
            with utils.open_file(
                mock_constants_path, 'r') as constants_file:
                self.assertEqual(
                    constants_file.read(),
                    'export = {\n'
                    '  "DEV_MODE": false,\n'
                    '  "EMULATOR_MODE": true,\n'
                    '};')
            with utils.open_file(mock_feconf_path, 'r') as feconf_file:
                self.assertEqual(
                    feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = False')

            build.modify_constants(prod_env=False, maintenance_mode=True)
            with utils.open_file(
                mock_constants_path, 'r') as constants_file:
                self.assertEqual(
                    constants_file.read(),
                    'export = {\n'
                    '  "DEV_MODE": true,\n'
                    '  "EMULATOR_MODE": true,\n'
                    '};')
            with utils.open_file(mock_feconf_path, 'r') as feconf_file:
                self.assertEqual(
                    feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = True')

        constants_temp_file.close()
        feconf_temp_file.close()

    def test_set_constants_to_default(self) -> None:
        mock_constants_path = 'mock_app_dev.yaml'
        mock_feconf_path = 'mock_app.yaml'
        constants_path_swap = self.swap(
            common, 'CONSTANTS_FILE_PATH', mock_constants_path)
        feconf_path_swap = self.swap(common, 'FECONF_PATH', mock_feconf_path)

        constants_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(
            constants_temp_file, 'name', mock_constants_path)
        with utils.open_file(mock_constants_path, 'w') as tmp:
            tmp.write('export = {\n')
            tmp.write('  "DEV_MODE": false,\n')
            tmp.write('  "EMULATOR_MODE": false,\n')
            tmp.write('};')

        feconf_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(feconf_temp_file, 'name', mock_feconf_path)
        with utils.open_file(mock_feconf_path, 'w') as tmp:
            tmp.write(u'ENABLE_MAINTENANCE_MODE = True')

        with constants_path_swap, feconf_path_swap:
            build.set_constants_to_default()
            with utils.open_file(
                mock_constants_path, 'r') as constants_file:
                self.assertEqual(
                    constants_file.read(),
                    'export = {\n'
                    '  "DEV_MODE": true,\n'
                    '  "EMULATOR_MODE": true,\n'
                    '};')
            with utils.open_file(mock_feconf_path, 'r') as feconf_file:
                self.assertEqual(
                    feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = False')

        constants_temp_file.close()
        feconf_temp_file.close()

    def test_safe_delete_file(self) -> None:
        """Test safe_delete_file with both existent and non-existent
        filepath.
        """
        temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(temp_file, 'name', 'some_file.txt')
        with utils.open_file('some_file.txt', 'w') as tmp:
            tmp.write(u'Some content.')
        self.assertTrue(os.path.isfile('some_file.txt'))

        build.safe_delete_file('some_file.txt')
        self.assertFalse(os.path.isfile('some_file.txt'))

        non_existent_filepaths = [INVALID_INPUT_FILEPATH]
        # Escape the special characters, like '\', in the file paths.
        # The '\' character is usually seem in Windows style path.
        # https://docs.python.org/2/library/os.html#os.sep
        # https://docs.python.org/2/library/re.html#regular-expression-syntax
        error_message = ('File %s does not exist.') % re.escape(
            non_existent_filepaths[0])
        # Exception will be raised at first file determined to be non-existent.
        with self.assertRaisesRegex(
            OSError, error_message):
            build.safe_delete_file(non_existent_filepaths[0])

    def test_minify_third_party_libs(self) -> None:

        def _mock_safe_delete_file(unused_filepath: str) -> None:
            """Mocks build.safe_delete_file()."""
            pass

        self.assertFalse(os.path.isfile(
            'core/tests/data/third_party/css/third_party.min.css'))
        self.assertFalse(os.path.isfile(
            'core/tests/data/third_party/js/third_party.min.js'))
        self.assertFalse(os.path.isfile(
            'core/tests/data/third_party/js/third_party.min.js.map'))

        with self.swap(build, 'safe_delete_file', _mock_safe_delete_file):
            build.minify_third_party_libs('core/tests/data/third_party')

        self.assertTrue(os.path.isfile(
            'core/tests/data/third_party/css/third_party.min.css'))
        self.assertTrue(os.path.isfile(
            'core/tests/data/third_party/js/third_party.min.js'))
        self.assertTrue(os.path.isfile(
            'core/tests/data/third_party/js/third_party.min.js.map'))

        self.assertLess(
            os.path.getsize(
                'core/tests/data/third_party/css/third_party.min.css'),
            os.path.getsize('core/tests/data/third_party/css/third_party.css'))
        self.assertLess(
            os.path.getsize(
                'core/tests/data/third_party/js/third_party.min.js'),
            os.path.getsize('core/tests/data/third_party/js/third_party.js'))

        build.safe_delete_file(
            'core/tests/data/third_party/css/third_party.min.css')
        build.safe_delete_file(
            'core/tests/data/third_party/js/third_party.min.js')
        build.safe_delete_file(
            'core/tests/data/third_party/js/third_party.min.js.map')

    def test_clean(self) -> None:
        check_function_calls = {
            'safe_delete_directory_tree_gets_called': 0,
        }
        expected_check_function_calls = {
            'safe_delete_directory_tree_gets_called': 3,
        }

        def mock_safe_delete_directory_tree(unused_path: str) -> None:
            check_function_calls['safe_delete_directory_tree_gets_called'] += 1

        with self.swap(
            build, 'safe_delete_directory_tree',
            mock_safe_delete_directory_tree
        ):
            build.clean()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_build_with_prod_env(self) -> None:
        check_function_calls = {
            'build_using_webpack_gets_called': False,
            'ensure_files_exist_gets_called': False,
            'modify_constants_gets_called': False,
            'compare_file_count_gets_called': False,
            'generate_python_package_called': False,
            'clean_gets_called': False,
        }
        expected_check_function_calls = {
            'build_using_webpack_gets_called': True,
            'ensure_files_exist_gets_called': True,
            'modify_constants_gets_called': True,
            'compare_file_count_gets_called': True,
            'generate_python_package_called': True,
            'clean_gets_called': True,
        }

        expected_config_path = build.WEBPACK_PROD_CONFIG

        def mock_build_using_webpack(config_path: str) -> None:
            self.assertEqual(config_path, expected_config_path)
            check_function_calls['build_using_webpack_gets_called'] = True

        def mock_ensure_files_exist(unused_filepaths: List[str]) -> None:
            check_function_calls['ensure_files_exist_gets_called'] = True

        def mock_modify_constants(
            prod_env: bool,  # pylint: disable=unused-argument
            emulator_mode: bool,  # pylint: disable=unused-argument
            maintenance_mode: bool  # pylint: disable=unused-argument
        ) -> None:  # pylint: disable=unused-argument
            check_function_calls['modify_constants_gets_called'] = True

        def mock_compare_file_count(
            unused_first_dir: str,
            unused_second_dir: str
        ) -> None:
            check_function_calls['compare_file_count_gets_called'] = True

        def mock_generate_python_package() -> None:
            check_function_calls['generate_python_package_called'] = True

        def mock_clean() -> None:
            check_function_calls['clean_gets_called'] = True

        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', mock_ensure_files_exist)
        build_using_webpack_swap = self.swap(
            build, 'build_using_webpack', mock_build_using_webpack)
        modify_constants_swap = self.swap(
            build, 'modify_constants', mock_modify_constants)
        compare_file_count_swap = self.swap(
            build, '_compare_file_count', mock_compare_file_count)
        generate_python_package_swap = self.swap(
            build, 'generate_python_package', mock_generate_python_package)
        clean_swap = self.swap(build, 'clean', mock_clean)

        with ensure_files_exist_swap, build_using_webpack_swap, clean_swap:
            with modify_constants_swap, compare_file_count_swap:
                with generate_python_package_swap:
                    build.main(args=['--prod_env'])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_build_with_prod_source_maps(self) -> None:
        check_function_calls = {
            'build_using_webpack_gets_called': False,
            'ensure_files_exist_gets_called': False,
            'modify_constants_gets_called': False,
            'compare_file_count_gets_called': False,
            'clean_gets_called': False,
        }
        expected_check_function_calls = {
            'build_using_webpack_gets_called': True,
            'ensure_files_exist_gets_called': True,
            'modify_constants_gets_called': True,
            'compare_file_count_gets_called': True,
            'clean_gets_called': True,
        }

        expected_config_path = build.WEBPACK_PROD_SOURCE_MAPS_CONFIG

        def mock_build_using_webpack(config_path: str) -> None:
            self.assertEqual(config_path, expected_config_path)
            check_function_calls['build_using_webpack_gets_called'] = True

        def mock_ensure_files_exist(unused_filepaths: List[str]) -> None:
            check_function_calls['ensure_files_exist_gets_called'] = True

        def mock_modify_constants(
            prod_env: bool,  # pylint: disable=unused-argument
            emulator_mode: bool,  # pylint: disable=unused-argument
            maintenance_mode: bool  # pylint: disable=unused-argument
        ) -> None:
            check_function_calls['modify_constants_gets_called'] = True

        def mock_compare_file_count(
            unused_first_dir: str,
            unused_second_dir: str
        ) -> None:
            check_function_calls['compare_file_count_gets_called'] = True

        def mock_clean() -> None:
            check_function_calls['clean_gets_called'] = True

        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', mock_ensure_files_exist)
        build_using_webpack_swap = self.swap(
            build, 'build_using_webpack', mock_build_using_webpack)
        modify_constants_swap = self.swap(
            build, 'modify_constants', mock_modify_constants)
        compare_file_count_swap = self.swap(
            build, '_compare_file_count', mock_compare_file_count)
        clean_swap = self.swap(build, 'clean', mock_clean)

        with ensure_files_exist_swap, build_using_webpack_swap:
            with modify_constants_swap, compare_file_count_swap:
                with clean_swap:
                    build.main(args=['--prod_env', '--source_maps'])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_build_with_watcher(self) -> None:
        check_function_calls = {
            'ensure_files_exist_gets_called': False,
            'modify_constants_gets_called': False,
            'clean_gets_called': False,
        }
        expected_check_function_calls = {
            'ensure_files_exist_gets_called': True,
            'modify_constants_gets_called': True,
            'clean_gets_called': True,
        }

        def mock_ensure_files_exist(unused_filepaths: List[str]) -> None:
            check_function_calls['ensure_files_exist_gets_called'] = True

        def mock_modify_constants(
            prod_env: bool,  # pylint: disable=unused-argument
            emulator_mode: bool,  # pylint: disable=unused-argument
            maintenance_mode: bool   # pylint: disable=unused-argument
        ) -> None:
            check_function_calls['modify_constants_gets_called'] = True

        def mock_clean() -> None:
            check_function_calls['clean_gets_called'] = True

        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', mock_ensure_files_exist)
        modify_constants_swap = self.swap(
            build, 'modify_constants', mock_modify_constants)
        clean_swap = self.swap(build, 'clean', mock_clean)

        with ensure_files_exist_swap, modify_constants_swap, clean_swap:
            build.main(args=[])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_cannot_maintenance_mode_in_dev_mode(self) -> None:
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'maintenance_mode should only be enabled in prod build.')
        with assert_raises_regexp_context_manager:
            build.main(args=['--maintenance_mode'])

    def test_cannot_minify_third_party_libs_in_dev_mode(self) -> None:
        check_function_calls = {
            'ensure_files_exist_gets_called': False,
            'clean_gets_called': False,
        }
        expected_check_function_calls = {
            'ensure_files_exist_gets_called': True,
            'clean_gets_called': True,
        }

        def mock_ensure_files_exist(unused_filepaths: List[str]) -> None:
            check_function_calls['ensure_files_exist_gets_called'] = True

        def mock_clean() -> None:
            check_function_calls['clean_gets_called'] = True

        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', mock_ensure_files_exist)
        clean_swap = self.swap(build, 'clean', mock_clean)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'minify_third_party_libs_only should not be set in non-prod env.')
        with ensure_files_exist_swap, assert_raises_regexp_context_manager:
            with clean_swap:
                build.main(args=['--minify_third_party_libs_only'])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_only_minify_third_party_libs_in_dev_mode(self) -> None:
        check_function_calls = {
            'ensure_files_exist_gets_called': False,
            'ensure_modify_constants_gets_called': False,
            'clean_gets_called': False,
        }
        expected_check_function_calls = {
            'ensure_files_exist_gets_called': True,
            'ensure_modify_constants_gets_called': False,
            'clean_gets_called': True,
        }

        def mock_ensure_files_exist(unused_filepaths: List[str]) -> None:
            check_function_calls['ensure_files_exist_gets_called'] = True

        def mock_modify_constants(
            unused_prod_env: bool,
            maintenance_mode: bool   # pylint: disable=unused-argument
        ) -> None:  # pylint: disable=unused-argument
            check_function_calls['ensure_modify_constants_gets_called'] = True

        def mock_clean() -> None:
            check_function_calls['clean_gets_called'] = True

        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', mock_ensure_files_exist)
        modify_constants_swap = self.swap(
            build, 'modify_constants', mock_modify_constants)
        clean_swap = self.swap(build, 'clean', mock_clean)
        with ensure_files_exist_swap, modify_constants_swap, clean_swap:
            build.main(args=['--prod_env', '--minify_third_party_libs_only'])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_build_using_webpack_command(self) -> None:

        @contextlib.contextmanager
        def mock_managed_webpack_compiler(
            config_path: str,
            max_old_space_size: int
        ) -> Iterator[scripts_test_utils.PopenStub]:
            self.assertEqual(config_path, build.WEBPACK_PROD_CONFIG)
            self.assertEqual(max_old_space_size, 8192)
            yield scripts_test_utils.PopenStub()

        def mock_get_file_count(unused_path: str) -> int:
            return 1

        webpack_compiler_swap = self.swap(
            servers, 'managed_webpack_compiler',
            mock_managed_webpack_compiler)
        get_file_count_swap = self.swap(
            build, 'get_file_count', mock_get_file_count)

        with webpack_compiler_swap, get_file_count_swap:
            build.build_using_webpack(build.WEBPACK_PROD_CONFIG)

    def test_build_using_webpack_command_with_incorrect_filecount_fails(
        self
    ) -> None:

        @contextlib.contextmanager
        def mock_managed_webpack_compiler(
            config_path: str, max_old_space_size: int
        ) -> Iterator[scripts_test_utils.PopenStub]:
            self.assertEqual(config_path, build.WEBPACK_PROD_CONFIG)
            self.assertEqual(max_old_space_size, 8192)
            yield scripts_test_utils.PopenStub()

        def mock_get_file_count(unused_path: str) -> int:
            return 0

        webpack_compiler_swap = self.swap(
            servers, 'managed_webpack_compiler',
            mock_managed_webpack_compiler)
        get_file_count_swap = self.swap(
            build, 'get_file_count', mock_get_file_count)

        with webpack_compiler_swap, get_file_count_swap:
            with self.assertRaisesRegex(
                AssertionError, 'webpack_bundles should be non-empty.'
            ):
                build.build_using_webpack(build.WEBPACK_PROD_CONFIG)
