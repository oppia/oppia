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

import StringIO
import collections
import os
import random
import re
import subprocess
import threading

# pylint: disable=relative-import
import build
from core.tests import test_utils

# pylint: enable=relative-import


class BuildTests(test_utils.GenericTestBase):
    """Test the build methods."""

    def test_minify(self):
        """Tests _minify with an invalid filepath."""
        # pylint: disable=protected-access
        with self.assertRaises(subprocess.CalledProcessError) as calledProcess:
            build._minify(
                'invalid/path/to/input.js', 'invalid/path/to/output.js')
        # pylint: enable=protected-access
        calledProcessException = calledProcess.exception
        # returncode is the exit status of the child process.
        self.assertEqual(calledProcessException.returncode, 1)

    def test_join_files(self):
        """Determine third_party.js contains the content of the first 10 JS
        files in /third_party/static.
        """
        # Prepare a file_stream object from StringIO.
        third_party_js_stream = StringIO.StringIO()
        # Get all filepaths from manifest.json.
        dependency_filepaths = build.get_dependencies_filepaths()
        # Join and write all JS files in /third_party/static to file_stream.
        # pylint: disable=protected-access
        build._join_files(dependency_filepaths['js'], third_party_js_stream)
        # pylint: enable=protected-access
        counter = 0
        # Only checking first 10 files.
        JS_FILE_COUNT = 10
        for js_filepath in dependency_filepaths['js']:
            if counter == JS_FILE_COUNT:
                break
            with open(js_filepath, 'r') as js_file:
                # Assert that each line is copied over to file_stream object.
                for line in js_file:
                    self.assertIn(line, third_party_js_stream.getvalue())
            counter += 1

    def test_minify_and_create_sourcemap(self):
        """Tests _minify_and_create_sourcemap with an invalid filepath."""
        # pylint: disable=protected-access
        with self.assertRaises(subprocess.CalledProcessError) as calledProcess:
            build._minify_and_create_sourcemap(
                'invalid/path/to/input.js', 'invalid/path/to/output.js')
        # pylint: enable=protected-access
        calledProcessException = calledProcess.exception
        # returncode is the exit status of the child process.
        self.assertEqual(calledProcessException.returncode, 1)

    def test_generate_copy_tasks_for_fonts(self):
        """Test _generate_copy_tasks_for_fonts to ensure that a correct number
        of copy tasks for fonts are queued.
        """
        copy_tasks = collections.deque()
        # Get all filepaths from manifest.json.
        dependency_filepaths = build.get_dependencies_filepaths()
        # Setup a sandbox folder for copying fonts.
        target_fonts_dir = os.path.join('target', 'fonts', '')
        # pylint: disable=protected-access

        self.assertEqual(len(copy_tasks), 0)
        build._generate_copy_tasks_for_fonts(
            dependency_filepaths['fonts'], target_fonts_dir, copy_tasks)
        # pylint: enable=protected-access
        # Asserting the same number of copy tasks and number of font files.
        self.assertEqual(len(copy_tasks), len(dependency_filepaths['fonts']))

    def test_insert_hash(self):
        """Test _insert_hash to return correct filenames with provided hashes.
        """
        # pylint: disable=protected-access
        self.assertEqual(
            build._insert_hash('file.js', '123456'), 'file.123456.js')
        self.assertEqual(
            build._insert_hash(
                'path/to/file.js', '654321'), 'path/to/file.654321.js')
        self.assertEqual(
            build._insert_hash('file.min.js', 'abcdef'), 'file.min.abcdef.js')
        self.assertEqual(
            build._insert_hash(
                'path/to/file.min.js', 'fedcba'), 'path/to/file.min.fedcba.js')
        # pylint: enable=protected-access

    def test_ensure_files_exist(self):
        """Test _ensure_files_exist raises exception with a non-existent
        filepath.
        """
        random_filepaths = [
            os.path.join(build.THIRD_PARTY_GENERATED_DEV_DIR, 'random1.js')]
        # pylint: disable=protected-access
        with self.assertRaises(OSError) as fileNotExist:
            build._ensure_files_exist(random_filepaths)
        # pylint: enable=protected-access
        # Exception will be raised at first file determined to be non-existent.
        self.assertTrue(
            ('File %s does not exist.') % random_filepaths[0] in
            fileNotExist.exception)

    def test_get_file_count(self):
        """Test get_file_count to return the correct number of files, minus
        ignored files.
        """
        all_inclusive_file_count = 0
        for _, _, files in os.walk(
                build.EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir']):
            all_inclusive_file_count += len(files)
        ignored_file_count = 0
        for _, _, files in os.walk(
                build.EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir']):
            for filename in files:
                if any(filename.endswith(p)
                       for p in build.FILE_EXTENSIONS_TO_IGNORE):
                    ignored_file_count += 1
        self.assertEqual(
            all_inclusive_file_count - ignored_file_count,
            build.get_file_count(
                build.EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir']))

    def test_compare_file_count(self):
        """Test _compare_file_count to raise exception when there is a
        mismatched file count between 2 dirs.
        """
        with self.assertRaises(ValueError) as incorrectFileCount:
            # pylint: disable=protected-access
            build._compare_file_count(
                build.EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir'],
                build.TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['dev_dir'])
        # pylint: enable=protected-access
        source_dir_file_count = build.get_file_count(
            build.EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir'])
        target_dir_file_count = build.get_file_count(
            build.TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['dev_dir'])
        self.assertTrue(
            ('%s files in source dir != %s files in target dir.') % (
                source_dir_file_count, target_dir_file_count) in
            incorrectFileCount.exception)

    def test_match_filename_with_hashes(self):
        """Test _match_filename_with_hashes to raise exception:
            1) When there is an empty hash dict.
            2) When a filename is expected to contain hash but does not.
            3) When there is a hash in filename that cannot be found in
                hash dict.
        """
        # Final filepath example: base.240933e7564bd72a4dde42ee23260c5f.html.
        file_hashes = dict()
        base_filename = 'base.html'
        with self.assertRaises(ValueError) as emptyHashDict:
            # pylint: disable=protected-access
            build._match_filename_with_hashes(base_filename, file_hashes)
            # pylint: enable=protected-access
        self.assertTrue('Hash dict is empty' in emptyHashDict.exception)

        file_hashes = {base_filename: random.getrandbits(128)}
        with self.assertRaises(ValueError) as noHashInFilename:
            # pylint: disable=protected-access
            build._match_filename_with_hashes(base_filename, file_hashes)
            # pylint: enable=protected-access
        # Generate a random hash dict for base.html.
        self.assertTrue(
            '%s is expected to contain hash' % base_filename
            in noHashInFilename.exception)

        # pylint: disable=protected-access
        hashed_base_filename = build._insert_hash(
            base_filename, random.getrandbits(128))
        # pylint: enable=protected-access
        with self.assertRaises(KeyError) as incorrectHashInFilename:
            # pylint: disable=protected-access
            build._match_filename_with_hashes(hashed_base_filename, file_hashes)
            # pylint: enable=protected-access
        self.assertTrue(
            'Hashed file %s does not match hash dict keys'
            % hashed_base_filename in incorrectHashInFilename.exception)

    def test_process_html(self):
        """Test process_html to remove whitespaces and hash filepaths."""
        base_source_path = os.path.join(
            build.TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['dev_dir'], 'pages',
            'base.html')
        # Prepare a file_stream object from StringIO.
        minified_html_file_stream = StringIO.StringIO()
        # Obtain actual file hashes of /templates to add hash to all filepaths
        # within the HTML file. The end result will look like:
        # E.g <script ... app.js></script>
        # --> <script ... app.[hash].js></script>.
        file_hashes = build.get_file_hashes(
            build.TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['dev_dir'])
        # pylint: disable=protected-access
        # Reading from actual base.html file and not simply a dummy file.
        build._ensure_files_exist([base_source_path])
        # pylint: enable=protected-access
        # Assert that /DEV's base.html has white spaces.

        with open(base_source_path, 'r') as source_base_file:
            source_base_file_content = source_base_file.read()
            self.assertRegexpMatches(
                source_base_file_content, r'\s{2,}',
                msg="No white spaces detected in %s unexpectedly"
                % base_source_path)
            # Create a list of un-hashed filenames in base.html.
            base_file_unhashed_filenames = []
            for filepath, _ in file_hashes.iteritems():
                # Not hashing HTML files.
                if filepath.endswith('.html'):
                    continue
                result = re.findall(filepath, source_base_file_content)
                if result:
                    base_file_unhashed_filenames.append(result[0])
            self.assertGreater(len(base_file_unhashed_filenames), 0)

            build.process_html(
                source_base_file, minified_html_file_stream, file_hashes)

        minified_html_file_content = minified_html_file_stream.getvalue()
        self.assertNotRegexpMatches(
            minified_html_file_content, r'\s{2,}',
            msg='All white spaces must be removed from %s' %
            base_source_path)
        # Assert that all filenames must be hashed.
        for unhashed_filename in base_file_unhashed_filenames:
            result = re.findall(
                unhashed_filename, minified_html_file_content)
            self.assertEqual(len(result), 0)

    def test_hash_should_be_inserted(self):
        """Test hash_should_be_inserted to return the correct boolean value
        for filepath that should be hashed.
        """
        with self.swap(
            build, 'FILEPATHS_NOT_TO_RENAME', (
                'path/to/fonts/*', 'path/to/third_party.min.js.map',
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

    def test_generate_copy_tasks_to_copy_from_source_to_target(self):
        """Test generate_copy_tasks_to_copy_from_source_to_target to queue up
        correct number of copy tasks.
        """
        assets_hashes = build.get_file_hashes(build.ASSETS_DEV_DIR)
        total_file_count = build.get_file_count(build.ASSETS_DEV_DIR) - 1
        copy_tasks = collections.deque()

        self.assertEqual(len(copy_tasks), 0)
        build.generate_copy_tasks_to_copy_from_source_to_target(
            build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR, assets_hashes,
            copy_tasks)
        # Minus 1 to account for added hashes.js.
        self.assertEqual(len(copy_tasks), total_file_count)

    def test_is_file_hash_provided_to_frontend(self):
        """Test is_file_hash_provided_to_frontend to return the correct boolean
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

    def test_filter_hashes(self):
        """Test filter_hashes to filter the provided hash correctly."""
        # set constant to provide everything to frontend.
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
            self.assertTrue(filtered_hashes.has_key('/path/to/file.js'))
            self.assertTrue(filtered_hashes.has_key('/test_path/to/file.html'))
            self.assertTrue(filtered_hashes.has_key('/test_path/to/file.js'))
            self.assertFalse(filtered_hashes.has_key('/path/path/file.js'))
            self.assertFalse(filtered_hashes.has_key('/file.html'))

    def test_get_hashes_json_file_contents(self):
        """Test get_hashes_json_file_contents to parse provided hash dict
        correctly to JSON format.
        """
        # set constant to provide everything to frontend.
        with self.swap(build, 'FILEPATHS_PROVIDED_TO_FRONTEND', ('*',)):
            hashes = {'path/file.js': '123456'}
            self.assertEqual(
                build.get_hashes_json_file_contents(hashes),
                'var hashes = JSON.parse(\'{"/path/file.js": "123456"}\');')

            hashes = {'file.js': '123456', 'file.min.js': '654321'}
            self.assertEqual(
                build.get_hashes_json_file_contents(hashes),
                ('var hashes = JSON.parse(\'{"/file.min.js": "654321", '
                 '"/file.js": "123456"}\');'))

    def test_execute_tasks(self):
        """Test _execute_tasks to join all threads after executing all tasks."""
        build_tasks = collections.deque()
        TASK_COUNT = 2
        count = TASK_COUNT
        while count:
            task = threading.Thread(
                # pylint: disable=protected-access
                target=build._minify,
                args=('path/to/input.js', 'path/to/output.js'))
            # pylint: enable=protected-access
            build_tasks.append(task)
            count -= 1

        self.assertEqual(threading.active_count(), 1)
        # pylint: disable=protected-access
        build._execute_tasks(build_tasks)
        with self.assertRaises(OSError) as threadAlreadyStarted:
            build._execute_tasks(build_tasks)
        # pylint: enable=protected-access
        self.assertTrue(
            'threads can only be started once' in
            threadAlreadyStarted.exception)
        # Assert that all threads are joined.
        self.assertEqual(threading.active_count(), 1)

    def test_build_files(self):
        """Test build_files to queue up correct number of build tasks."""
        asset_hashes = build.get_file_hashes(build.ASSETS_DEV_DIR)
        build_tasks = collections.deque()

        self.assertEqual(len(build_tasks), 0)
        # Build all files.
        build.build_files(
            build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR, asset_hashes,
            build_tasks)
        total_file_count = build.get_file_count(build.ASSETS_DEV_DIR) - 1
        # Minus 1 to adjust for hashes.js.
        self.assertEqual(len(build_tasks), total_file_count)

        # Only build HTML files.
        build_tasks.clear()
        total_html_file_count = 0
        for _, _, files in os.walk(build.ASSETS_DEV_DIR):
            for filename in files:
                if filename.endswith('.html'):
                    total_html_file_count += 1

        self.assertEqual(len(build_tasks), 0)
        build.build_files(
            build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR, asset_hashes,
            build_tasks, file_formats=('.html',))
        self.assertEqual(len(build_tasks), total_html_file_count)

    def test_rebuild_new_files(self):
        """Test rebuid_new_files queue up a corresponding number of build tasks
        to the number of file changes.
        """
        new_file_name = 'manifest.json'
        recently_changed_filenames = [
            os.path.join(build.ASSETS_DEV_DIR, 'i18n', new_file_name)]
        asset_hashes = build.get_file_hashes(build.ASSETS_DEV_DIR)
        build_tasks = collections.deque()

        self.assertEqual(len(build_tasks), 0)
        build.rebuild_new_files(
            build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR,
            recently_changed_filenames, asset_hashes, build_tasks)
        self.assertEqual(len(build_tasks), len(recently_changed_filenames))

    def test_get_recently_changed_filenames(self):
        """Test get_recently_changed_filenames to detect file recently added."""
        assets_hashes = build.get_file_hashes(build.ASSETS_DEV_DIR)
        # Create an empty sandbox folder, to simulate an empty /build folder.
        SANDBOX_DIR = os.path.join(build.PARENT_DIR, 'sandbox')
        recently_changed_filenames = []

        self.assertEqual(len(recently_changed_filenames), 0)
        recently_changed_filenames = build.get_recently_changed_filenames(
            assets_hashes, SANDBOX_DIR)
        # Since all HTML and Python files are already built, they are ignored.
        with self.swap(build, 'FILE_EXTENSIONS_TO_IGNORE', ('.html', '.py',)):
            self.assertEqual(
                len(recently_changed_filenames), build.get_file_count(
                    build.ASSETS_DEV_DIR) - 1)
        # Minus 1 from ASSETS_DEV_DIR to account for added hashes.js.

    def test_remove_deleted_files(self):
        """Test remove_deleted_files to queue up the correct number of deletion
        task.
        """
        delete_tasks = collections.deque()
        # The empty dict means that all files should be removed.
        file_hashes = dict()

        self.assertEqual(len(delete_tasks), 0)
        build.remove_deleted_files(
            file_hashes, build.THIRD_PARTY_GENERATED_DEV_DIR, delete_tasks)
        self.assertEqual(
            len(delete_tasks), build.get_file_count(
                build.THIRD_PARTY_GENERATED_DEV_DIR))
