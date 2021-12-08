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
import random
import re
import subprocess
import tempfile
import threading

from core import python_utils
from core.tests import test_utils

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

INVALID_INPUT_FILEPATH = os.path.join(
    TEST_DIR, 'invalid', 'path', 'to', 'input.js')
INVALID_OUTPUT_FILEPATH = os.path.join(
    TEST_DIR, 'invalid', 'path', 'to', 'output.js')

EMPTY_DIR = os.path.join(TEST_DIR, 'empty', '')


class BuildTests(test_utils.GenericTestBase):
    """Test the build methods."""

    def tearDown(self):
        super(BuildTests, self).tearDown()
        build.safe_delete_directory_tree(TEST_DIR)
        build.safe_delete_directory_tree(EMPTY_DIR)

    def test_minify(self):
        """Tests _minify with an invalid filepath."""
        with self.assertRaisesRegexp(
            subprocess.CalledProcessError,
            'returned non-zero exit status 1') as called_process:
            build._minify(INVALID_INPUT_FILEPATH, INVALID_OUTPUT_FILEPATH)  # pylint: disable=protected-access
        # `returncode` is the exit status of the child process.
        self.assertEqual(called_process.exception.returncode, 1)

    def test_minify_and_create_sourcemap(self):
        """Tests _minify_and_create_sourcemap with an invalid filepath."""
        with self.assertRaisesRegexp(
            subprocess.CalledProcessError,
            'returned non-zero exit status 1') as called_process:
            build._minify_and_create_sourcemap(  # pylint: disable=protected-access
                INVALID_INPUT_FILEPATH, INVALID_OUTPUT_FILEPATH)
        # `returncode` is the exit status of the child process.
        self.assertEqual(called_process.exception.returncode, 1)

    def test_ensure_files_exist(self):
        """Test _ensure_files_exist raises exception with a non-existent
        filepath.
        """
        non_existent_filepaths = [INVALID_INPUT_FILEPATH]
        # Escape the special characters, like '\', in the file paths.
        # The '\' character is usually seem in Windows style path.
        # https://docs.python.org/2/library/os.html#os.sep
        # https://docs.python.org/2/library/re.html#regular-expression-syntax
        error_message = ('File %s does not exist.') % re.escape(
            non_existent_filepaths[0])
        # Exception will be raised at first file determined to be non-existent.
        with self.assertRaisesRegexp(
            OSError, error_message):
            build._ensure_files_exist(non_existent_filepaths)  # pylint: disable=protected-access

    def test_join_files(self):
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
            with python_utils.open_file(js_filepath, 'r') as js_file:
                # Assert that each line is copied over to file_stream object.
                for line in js_file:
                    self.assertIn(line, third_party_js_stream.getvalue())
            counter += 1

    def test_generate_copy_tasks_for_fonts(self):
        """Test _generate_copy_tasks_for_fonts ensures that the number of copy
        tasks matches the number of font files.
        """
        copy_tasks = collections.deque()
        # Get all filepaths from dependencies.json.
        dependency_filepaths = build.get_dependencies_filepaths()
        # Setup a sandbox folder for copying fonts.
        test_target = os.path.join('target', 'fonts', '')

        self.assertEqual(len(copy_tasks), 0)
        copy_tasks += build._generate_copy_tasks_for_fonts(  # pylint: disable=protected-access
            dependency_filepaths['fonts'], test_target)
        # Asserting the same number of copy tasks and number of font files.
        self.assertEqual(len(copy_tasks), len(dependency_filepaths['fonts']))

    def test_insert_hash(self):
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

    def test_get_file_count(self):
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

    def test_compare_file_count(self):
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
        with self.assertRaisesRegexp(
            ValueError, (
                '%s files in first dir list != %s files in second dir list') %
            (source_dir_file_count, target_dir_file_count)):
            build._compare_file_count([EMPTY_DIR], [MOCK_ASSETS_DEV_DIR])  # pylint: disable=protected-access

        # Test when one of the lists contain multiple directories.
        mock_extensions_dir_list = [MOCK_EXTENSIONS_DEV_DIR]
        target_dir_file_count = build.get_file_count(MOCK_EXTENSIONS_DEV_DIR)

        # Ensure that MOCK_EXTENSIONS_DIR has at least 1 file.
        assert target_dir_file_count > 0
        with self.assertRaisesRegexp(
            ValueError, (
                '%s files in first dir list != %s files in second dir list') %
            (source_dir_file_count, target_dir_file_count)):
            build._compare_file_count([EMPTY_DIR], mock_extensions_dir_list)  # pylint: disable=protected-access

        # Reset EMPTY_DIRECTORY to clean state.
        build.safe_delete_directory_tree(EMPTY_DIR)

    def test_verify_filepath_hash(self):
        """Test _verify_filepath_hash raises exception:
            1) When there is an empty hash dict.
            2) When a filename is expected to contain hash but does not.
            3) When there is a hash in filename that cannot be found in
                hash dict.
        """
        # Final filepath example: base.240933e7564bd72a4dde42ee23260c5f.html.
        file_hashes = {}
        base_filename = 'base.html'
        with self.assertRaisesRegexp(ValueError, 'Hash dict is empty'):
            build._verify_filepath_hash(base_filename, file_hashes)  # pylint: disable=protected-access

        # Generate a random hash dict for base.html.
        file_hashes = {base_filename: random.getrandbits(128)}
        with self.assertRaisesRegexp(
            ValueError, '%s is expected to contain MD5 hash' % base_filename):
            build._verify_filepath_hash(base_filename, file_hashes)  # pylint: disable=protected-access

        base_without_hash_filename = 'base_without_hash.html'
        self.assertIsNone(build._verify_filepath_hash(  # pylint: disable=protected-access
            base_without_hash_filename, file_hashes))

        bad_filepath = 'README'
        with self.assertRaisesRegexp(
            ValueError, 'Filepath has less than 2 partitions after splitting'):
            build._verify_filepath_hash(bad_filepath, file_hashes)  # pylint: disable=protected-access

        hashed_base_filename = build._insert_hash(  # pylint: disable=protected-access
            base_filename, random.getrandbits(128))
        with self.assertRaisesRegexp(
            KeyError,
            'Hash from file named %s does not match hash dict values' %
            hashed_base_filename):
            build._verify_filepath_hash(hashed_base_filename, file_hashes)  # pylint: disable=protected-access

    def test_process_html(self):
        """Test process_html removes whitespaces."""
        base_html_source_path = (
            os.path.join(MOCK_TEMPLATES_DEV_DIR, 'base.html'))

        build._ensure_files_exist([base_html_source_path])  # pylint: disable=protected-access
        minified_html_file_stream = io.StringIO()

        # Assert that base.html has white spaces and has original filepaths.
        with python_utils.open_file(
            base_html_source_path, 'r') as source_base_file:
            source_base_file_content = source_base_file.read()
            self.assertRegexpMatches(
                source_base_file_content, r'\s{2,}',
                msg='No white spaces detected in %s unexpectedly'
                % base_html_source_path)

        # Build base.html file.
        with python_utils.open_file(
            base_html_source_path, 'r') as source_base_file:
            build.process_html(source_base_file, minified_html_file_stream)

        minified_html_file_content = minified_html_file_stream.getvalue()
        self.assertNotRegexpMatches(
            minified_html_file_content, r'\s{2,}',
            msg='All white spaces must be removed from %s' %
            base_html_source_path)

    def test_should_file_be_built(self):
        """Test should_file_be_built returns the correct boolean value for
        filepath that should be built.
        """
        service_ts_filepath = os.path.join('core', 'pages', 'AudioService.ts')
        spec_js_filepath = os.path.join('core', 'pages', 'AudioServiceSpec.js')
        protractor_filepath = os.path.join('extensions', 'protractor.js')

        python_controller_filepath = os.path.join('base.py')
        pyc_test_filepath = os.path.join(
            'core', 'controllers', 'base.pyc')
        python_test_filepath = os.path.join(
            'core', 'tests', 'base_test.py')

        self.assertFalse(build.should_file_be_built(spec_js_filepath))
        self.assertFalse(build.should_file_be_built(protractor_filepath))

        self.assertFalse(build.should_file_be_built(service_ts_filepath))

        self.assertFalse(build.should_file_be_built(python_test_filepath))
        self.assertFalse(build.should_file_be_built(pyc_test_filepath))
        self.assertTrue(build.should_file_be_built(python_controller_filepath))

        # Swapping out constants to check if the reverse is true.
        # ALL JS files that ends with ...Service.js should not be built.
        with self.swap(
            build, 'JS_FILENAME_SUFFIXES_TO_IGNORE', ('Service.js',)):
            self.assertTrue(build.should_file_be_built(spec_js_filepath))

    def test_hash_should_be_inserted(self):
        """Test hash_should_be_inserted returns the correct boolean value
        for filepath that should be hashed.
        """
        with self.swap(
            build, 'FILEPATHS_NOT_TO_RENAME', (
                '*.py', 'path/to/fonts/*', 'path/to/third_party.min.js.map',
                'path/to/third_party.min.css.map')):
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

    def test_generate_copy_tasks_to_copy_from_source_to_target(self):
        """Test generate_copy_tasks_to_copy_from_source_to_target queues up
        the same number of copy tasks as the number of files in the directory.
        """
        assets_hashes = build.get_file_hashes(MOCK_ASSETS_DEV_DIR)
        total_file_count = build.get_file_count(MOCK_ASSETS_DEV_DIR)
        copy_tasks = collections.deque()

        self.assertEqual(len(copy_tasks), 0)
        copy_tasks += build.generate_copy_tasks_to_copy_from_source_to_target(
            MOCK_ASSETS_DEV_DIR, MOCK_ASSETS_OUT_DIR, assets_hashes)
        self.assertEqual(len(copy_tasks), total_file_count)

    def test_is_file_hash_provided_to_frontend(self):
        """Test is_file_hash_provided_to_frontend returns the correct boolean
        value for filepath that should be provided to frontend.
        """
        with self.swap(
            build, 'FILEPATHS_PROVIDED_TO_FRONTEND',
            ('path/to/file.js', 'path/to/file.html', 'file.js')):
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('path/to/file.js'))
            self.assertTrue(
                build.is_file_hash_provided_to_frontend('path/to/file.html'))
            self.assertTrue(build.is_file_hash_provided_to_frontend('file.js'))
        with self.swap(
            build, 'FILEPATHS_PROVIDED_TO_FRONTEND',
            ('path/to/*', '*.js', '*_end.html')):
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

    def test_get_filepaths_by_extensions(self):
        """Test get_filepaths_by_extensions only returns filepaths in
        directory with given extensions.
        """
        filepaths = []
        build.ensure_directory_exists(MOCK_ASSETS_DEV_DIR)
        extensions = ('.json', '.svg',)

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

    def test_get_file_hashes(self):
        """Test get_file_hashes gets hashes of all files in directory,
        excluding file with extensions in FILE_EXTENSIONS_TO_IGNORE.
        """
        # Prevent getting hashes of HTML files.
        with self.swap(build, 'FILE_EXTENSIONS_TO_IGNORE', ('.html',)):
            file_hashes = {}
            self.assertEqual(len(file_hashes), 0)
            file_hashes = build.get_file_hashes(MOCK_EXTENSIONS_DEV_DIR)
            self.assertGreater(len(file_hashes), 0)
            # Assert that each hash's filepath exists and does not include files
            # with extensions in FILE_EXTENSIONS_TO_IGNORE.
            for filepath in file_hashes:
                abs_filepath = os.path.join(MOCK_EXTENSIONS_DEV_DIR, filepath)
                self.assertTrue(os.path.isfile(abs_filepath))
                self.assertFalse(filepath.endswith('.html'))

    def test_filter_hashes(self):
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
            ('test_path/*', 'path/to/file.js')):
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

    def test_save_hashes_to_file(self):
        """Test save_hashes_to_file saves provided hash dict correctly to
        JSON file.
        """
        hashes_path = os.path.join(MOCK_ASSETS_OUT_DIR, 'hashes.json')

        # Set constant to provide everything to frontend.
        with self.swap(build, 'FILEPATHS_PROVIDED_TO_FRONTEND', ('*',)):
            with self.swap(build, 'HASHES_JSON_FILEPATH', hashes_path):
                hashes = {'path/file.js': '123456'}
                build.save_hashes_to_file(hashes)
                with python_utils.open_file(hashes_path, 'r') as hashes_file:
                    self.assertEqual(
                        hashes_file.read(), '{"/path/file.js": "123456"}\n')

                hashes = {'file.js': '123456', 'file.min.js': '654321'}
                build.save_hashes_to_file(hashes)
                with python_utils.open_file(hashes_path, 'r') as hashes_file:
                    self.assertEqual(
                        ast.literal_eval(hashes_file.read()),
                        {'/file.min.js': '654321', '/file.js': '123456'})
                os.remove(hashes_path)

    def test_execute_tasks(self):
        """Test _execute_tasks joins all threads after executing all tasks."""
        build_tasks = collections.deque()
        task_count = 2
        count = task_count
        while count:
            task = threading.Thread(
                target=build._minify,  # pylint: disable=protected-access
                args=(INVALID_INPUT_FILEPATH, INVALID_OUTPUT_FILEPATH))
            build_tasks.append(task)
            count -= 1

        self.assertEqual(threading.active_count(), 1)
        build._execute_tasks(build_tasks)  # pylint: disable=protected-access
        with self.assertRaisesRegexp(
            OSError, 'threads can only be started once'):
            build._execute_tasks(build_tasks)  # pylint: disable=protected-access
        # Assert that all threads are joined.
        self.assertEqual(threading.active_count(), 1)

    def test_generate_build_tasks_to_build_all_files_in_directory(self):
        """Test generate_build_tasks_to_build_all_files_in_directory queues up
        the same number of build tasks as the number of files in the source
        directory.
        """
        tasks = collections.deque()

        self.assertEqual(len(tasks), 0)
        # Build all files.
        tasks = build.generate_build_tasks_to_build_all_files_in_directory(
            MOCK_ASSETS_DEV_DIR, MOCK_ASSETS_OUT_DIR)
        total_file_count = build.get_file_count(MOCK_ASSETS_DEV_DIR)
        self.assertEqual(len(tasks), total_file_count)

    def test_generate_build_tasks_to_build_files_from_filepaths(self):
        """Test generate_build_tasks_to_build_files_from_filepaths queues up a
        corresponding number of build tasks to the number of file changes.
        """
        new_filename = 'dependencies.json'
        recently_changed_filenames = [
            os.path.join(MOCK_ASSETS_DEV_DIR, new_filename)]
        build_tasks = collections.deque()

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

    def test_generate_build_tasks_to_build_directory(self):
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
        build_dir_tasks = collections.deque()
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

    def test_re_build_recently_changed_files_at_dev_dir(self):
        temp_file = tempfile.NamedTemporaryFile()
        temp_file_name = '%ssome_file.js' % MOCK_EXTENSIONS_DEV_DIR
        temp_file.name = temp_file_name
        with python_utils.open_file(
            '%ssome_file.js' % MOCK_EXTENSIONS_DEV_DIR, 'w') as tmp:
            tmp.write(u'Some content.')

        extensions_dirnames_to_dirpaths = {
            'dev_dir': MOCK_EXTENSIONS_DEV_DIR,
            'staging_dir': os.path.join(
                TEST_DIR, 'backend_prod_files', 'extensions', ''),
            'out_dir': os.path.join(TEST_DIR, 'build', 'extensions', '')
        }

        build_dir_tasks = collections.deque()
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

    def test_get_recently_changed_filenames(self):
        """Test get_recently_changed_filenames detects file recently added."""
        # Create an empty folder.
        build.ensure_directory_exists(EMPTY_DIR)
        # Get hashes from ASSETS_DEV_DIR to simulate a folder with built files.
        assets_hashes = build.get_file_hashes(MOCK_ASSETS_DEV_DIR)
        recently_changed_filenames = []

        self.assertEqual(len(recently_changed_filenames), 0)
        recently_changed_filenames = build.get_recently_changed_filenames(
            assets_hashes, EMPTY_DIR)
        # Since all HTML and Python files are already built, they are ignored.
        with self.swap(build, 'FILE_EXTENSIONS_TO_IGNORE', ('.html', '.py',)):
            self.assertEqual(
                len(recently_changed_filenames), build.get_file_count(
                    MOCK_ASSETS_DEV_DIR))

        build.safe_delete_directory_tree(EMPTY_DIR)

    def test_generate_delete_tasks_to_remove_deleted_files(self):
        """Test generate_delete_tasks_to_remove_deleted_files queues up the
        same number of deletion task as the number of deleted files.
        """
        delete_tasks = collections.deque()
        # The empty dict means that all files should be removed.
        file_hashes = {}

        self.assertEqual(len(delete_tasks), 0)
        delete_tasks += build.generate_delete_tasks_to_remove_deleted_files(
            file_hashes, MOCK_TEMPLATES_DEV_DIR)
        self.assertEqual(
            len(delete_tasks), build.get_file_count(MOCK_TEMPLATES_DEV_DIR))

    def test_generate_app_yaml_with_deploy_mode(self):
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
        app_dev_yaml_temp_file.name = mock_dev_yaml_filepath
        with python_utils.open_file(mock_dev_yaml_filepath, 'w') as tmp:
            tmp.write('Some content in mock_app_dev.yaml\n')
            tmp.write('  FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099"\n')
            tmp.write('version: default')

        app_yaml_temp_file = tempfile.NamedTemporaryFile()
        app_yaml_temp_file.name = mock_yaml_filepath
        with python_utils.open_file(mock_yaml_filepath, 'w') as tmp:
            tmp.write(u'Initial content in mock_app.yaml')

        with app_dev_yaml_filepath_swap, app_yaml_filepath_swap:
            with env_vars_to_remove_from_deployed_app_yaml_swap:
                build.generate_app_yaml(deploy_mode=True)

        with python_utils.open_file(mock_yaml_filepath, 'r') as yaml_file:
            content = yaml_file.read()

        self.assertEqual(
            content,
            '# THIS FILE IS AUTOGENERATED, DO NOT MODIFY\n'
            'Some content in mock_app_dev.yaml\n')

        app_yaml_temp_file.close()
        app_dev_yaml_temp_file.close()

    def test_generate_app_yaml_with_deploy_mode_with_nonexistent_var_raises(
            self):
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
        app_dev_yaml_temp_file.name = mock_dev_yaml_filepath
        with python_utils.open_file(mock_dev_yaml_filepath, 'w') as tmp:
            tmp.write('Some content in mock_app_dev.yaml\n')
            tmp.write('  FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099"\n')
            tmp.write('version: default')

        app_yaml_temp_file = tempfile.NamedTemporaryFile()
        app_yaml_temp_file.name = mock_yaml_filepath
        with python_utils.open_file(mock_yaml_filepath, 'w') as tmp:
            tmp.write('Initial content in mock_app.yaml')

        with app_dev_yaml_filepath_swap, app_yaml_filepath_swap:
            with env_vars_to_remove_from_deployed_app_yaml_swap:
                with self.assertRaisesRegexp(
                        Exception,
                        'Environment variable \'DATASTORE_HOST\' to be '
                        'removed does not exist.'
                ):
                    build.generate_app_yaml(deploy_mode=True)

        with python_utils.open_file(mock_yaml_filepath, 'r') as yaml_file:
            content = yaml_file.read()

        self.assertEqual(content, 'Initial content in mock_app.yaml')

        app_yaml_temp_file.close()
        app_dev_yaml_temp_file.close()

    def test_modify_constants(self):
        mock_constants_path = 'mock_app_dev.yaml'
        mock_feconf_path = 'mock_app.yaml'
        constants_path_swap = self.swap(
            common, 'CONSTANTS_FILE_PATH', mock_constants_path)
        feconf_path_swap = self.swap(common, 'FECONF_PATH', mock_feconf_path)

        constants_temp_file = tempfile.NamedTemporaryFile()
        constants_temp_file.name = mock_constants_path
        with python_utils.open_file(mock_constants_path, 'w') as tmp:
            tmp.write('export = {\n')
            tmp.write('  "DEV_MODE": true,\n')
            tmp.write('  "EMULATOR_MODE": false,\n')
            tmp.write('};')

        feconf_temp_file = tempfile.NamedTemporaryFile()
        feconf_temp_file.name = mock_feconf_path
        with python_utils.open_file(mock_feconf_path, 'w') as tmp:
            tmp.write(u'ENABLE_MAINTENANCE_MODE = False')

        with constants_path_swap, feconf_path_swap:
            build.modify_constants(prod_env=True, maintenance_mode=False)
            with python_utils.open_file(
                mock_constants_path, 'r') as constants_file:
                self.assertEqual(
                    constants_file.read(),
                    'export = {\n'
                    '  "DEV_MODE": false,\n'
                    '  "EMULATOR_MODE": true,\n'
                    '};')
            with python_utils.open_file(mock_feconf_path, 'r') as feconf_file:
                self.assertEqual(
                    feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = False')

            build.modify_constants(prod_env=False, maintenance_mode=True)
            with python_utils.open_file(
                mock_constants_path, 'r') as constants_file:
                self.assertEqual(
                    constants_file.read(),
                    'export = {\n'
                    '  "DEV_MODE": true,\n'
                    '  "EMULATOR_MODE": true,\n'
                    '};')
            with python_utils.open_file(mock_feconf_path, 'r') as feconf_file:
                self.assertEqual(
                    feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = True')

        constants_temp_file.close()
        feconf_temp_file.close()

    def test_set_constants_to_default(self):
        mock_constants_path = 'mock_app_dev.yaml'
        mock_feconf_path = 'mock_app.yaml'
        constants_path_swap = self.swap(
            common, 'CONSTANTS_FILE_PATH', mock_constants_path)
        feconf_path_swap = self.swap(common, 'FECONF_PATH', mock_feconf_path)

        constants_temp_file = tempfile.NamedTemporaryFile()
        constants_temp_file.name = mock_constants_path
        with python_utils.open_file(mock_constants_path, 'w') as tmp:
            tmp.write('export = {\n')
            tmp.write('  "DEV_MODE": false,\n')
            tmp.write('  "EMULATOR_MODE": false,\n')
            tmp.write('};')

        feconf_temp_file = tempfile.NamedTemporaryFile()
        feconf_temp_file.name = mock_feconf_path
        with python_utils.open_file(mock_feconf_path, 'w') as tmp:
            tmp.write(u'ENABLE_MAINTENANCE_MODE = True')

        with constants_path_swap, feconf_path_swap:
            build.set_constants_to_default()
            with python_utils.open_file(
                mock_constants_path, 'r') as constants_file:
                self.assertEqual(
                    constants_file.read(),
                    'export = {\n'
                    '  "DEV_MODE": true,\n'
                    '  "EMULATOR_MODE": true,\n'
                    '};')
            with python_utils.open_file(mock_feconf_path, 'r') as feconf_file:
                self.assertEqual(
                    feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = False')

        constants_temp_file.close()
        feconf_temp_file.close()

    def test_safe_delete_file(self):
        temp_file = tempfile.NamedTemporaryFile()
        temp_file.name = 'some_file.txt'
        with python_utils.open_file('some_file.txt', 'w') as tmp:
            tmp.write(u'Some content.')
        self.assertTrue(os.path.isfile('some_file.txt'))

        build.safe_delete_file('some_file.txt')
        self.assertFalse(os.path.isfile('some_file.txt'))

    def test_minify_third_party_libs(self):

        def _mock_safe_delete_file(unused_filepath):
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

    def test_build_with_prod_env(self):
        check_function_calls = {
            'build_using_webpack_gets_called': False,
            'ensure_files_exist_gets_called': False,
            'modify_constants_gets_called': False,
            'compare_file_count_gets_called': False,
            'generate_python_package_called': False,
        }
        expected_check_function_calls = {
            'build_using_webpack_gets_called': True,
            'ensure_files_exist_gets_called': True,
            'modify_constants_gets_called': True,
            'compare_file_count_gets_called': True,
            'generate_python_package_called': True,
        }

        expected_config_path = build.WEBPACK_PROD_CONFIG

        def mock_build_using_webpack(config_path):
            self.assertEqual(config_path, expected_config_path)
            check_function_calls['build_using_webpack_gets_called'] = True

        def mock_ensure_files_exist(unused_filepaths):
            check_function_calls['ensure_files_exist_gets_called'] = True

        def mock_modify_constants(prod_env, emulator_mode, maintenance_mode):  # pylint: disable=unused-argument
            check_function_calls['modify_constants_gets_called'] = True

        def mock_compare_file_count(unused_first_dir, unused_second_dir):
            check_function_calls['compare_file_count_gets_called'] = True

        def mock_generate_python_package():
            check_function_calls['generate_python_package_called'] = True

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

        with ensure_files_exist_swap, build_using_webpack_swap:
            with modify_constants_swap, compare_file_count_swap:
                with generate_python_package_swap:
                    build.main(args=['--prod_env'])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_build_with_prod_source_maps(self):
        check_function_calls = {
            'build_using_webpack_gets_called': False,
            'ensure_files_exist_gets_called': False,
            'modify_constants_gets_called': False,
            'compare_file_count_gets_called': False
        }
        expected_check_function_calls = {
            'build_using_webpack_gets_called': True,
            'ensure_files_exist_gets_called': True,
            'modify_constants_gets_called': True,
            'compare_file_count_gets_called': True,
        }

        expected_config_path = build.WEBPACK_PROD_SOURCE_MAPS_CONFIG

        def mock_build_using_webpack(config_path):
            self.assertEqual(config_path, expected_config_path)
            check_function_calls['build_using_webpack_gets_called'] = True

        def mock_ensure_files_exist(unused_filepaths):
            check_function_calls['ensure_files_exist_gets_called'] = True

        def mock_modify_constants(prod_env, emulator_mode, maintenance_mode):  # pylint: disable=unused-argument
            check_function_calls['modify_constants_gets_called'] = True

        def mock_compare_file_count(unused_first_dir, unused_second_dir):
            check_function_calls['compare_file_count_gets_called'] = True

        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', mock_ensure_files_exist)
        build_using_webpack_swap = self.swap(
            build, 'build_using_webpack', mock_build_using_webpack)
        modify_constants_swap = self.swap(
            build, 'modify_constants', mock_modify_constants)
        compare_file_count_swap = self.swap(
            build, '_compare_file_count', mock_compare_file_count)

        with ensure_files_exist_swap, build_using_webpack_swap:
            with modify_constants_swap, compare_file_count_swap:
                build.main(args=['--prod_env', '--source_maps'])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_build_with_watcher(self):
        check_function_calls = {
            'ensure_files_exist_gets_called': False,
            'modify_constants_gets_called': False,
        }
        expected_check_function_calls = {
            'ensure_files_exist_gets_called': True,
            'modify_constants_gets_called': True,
        }

        def mock_ensure_files_exist(unused_filepaths):
            check_function_calls['ensure_files_exist_gets_called'] = True

        def mock_modify_constants(prod_env, emulator_mode, maintenance_mode):  # pylint: disable=unused-argument
            check_function_calls['modify_constants_gets_called'] = True

        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', mock_ensure_files_exist)
        modify_constants_swap = self.swap(
            build, 'modify_constants', mock_modify_constants)
        with ensure_files_exist_swap, modify_constants_swap:
            build.main(args=[])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_cannot_maintenance_mode_in_dev_mode(self):
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception,
            'maintenance_mode should only be enabled in prod build.')
        with assert_raises_regexp_context_manager:
            build.main(args=['--maintenance_mode'])

    def test_cannot_minify_third_party_libs_in_dev_mode(self):
        check_function_calls = {
            'ensure_files_exist_gets_called': False,
        }
        expected_check_function_calls = {
            'ensure_files_exist_gets_called': True,
        }

        def mock_ensure_files_exist(unused_filepaths):
            check_function_calls['ensure_files_exist_gets_called'] = True

        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', mock_ensure_files_exist)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception,
            'minify_third_party_libs_only should not be set in non-prod env.')
        with ensure_files_exist_swap, assert_raises_regexp_context_manager:
            build.main(args=['--minify_third_party_libs_only'])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_only_minify_third_party_libs_in_dev_mode(self):
        check_function_calls = {
            'ensure_files_exist_gets_called': False,
            'ensure_modify_constants_gets_called': False,
        }
        expected_check_function_calls = {
            'ensure_files_exist_gets_called': True,
            'ensure_modify_constants_gets_called': False,
        }

        def mock_ensure_files_exist(unused_filepaths):
            check_function_calls['ensure_files_exist_gets_called'] = True

        def mock_modify_constants(unused_prod_env, maintenance_mode):  # pylint: disable=unused-argument
            check_function_calls['ensure_modify_constants_gets_called'] = True

        ensure_files_exist_swap = self.swap(
            build, '_ensure_files_exist', mock_ensure_files_exist)
        modify_constants_swap = self.swap(
            build, 'modify_constants', mock_modify_constants)
        with ensure_files_exist_swap, modify_constants_swap:
            build.main(args=['--prod_env', '--minify_third_party_libs_only'])

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_build_using_webpack_command(self):

        @contextlib.contextmanager
        def mock_managed_webpack_compiler(config_path, max_old_space_size):
            self.assertEqual(config_path, build.WEBPACK_PROD_CONFIG)
            self.assertEqual(max_old_space_size, 4096)
            yield scripts_test_utils.PopenStub()

        with self.swap(
                servers,
                'managed_webpack_compiler',
                mock_managed_webpack_compiler
        ):
            build.build_using_webpack(build.WEBPACK_PROD_CONFIG)
