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
import shutil
import subprocess
import sys
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

    def test_copy_fonts(self):
        """Test _copy_fonts to ensure that all fonts files are copied over."""
        copy_tasks = collections.deque()
        # Get all filepaths from manifest.json.
        dependency_filepaths = build.get_dependencies_filepaths()
        # Setup a sandbox folder for copying fonts.
        target_fonts_dir = os.path.join('target', 'fonts', '')
        # pylint: disable=protected-access
        build._copy_fonts(
            dependency_filepaths['fonts'], target_fonts_dir, copy_tasks)
        # pylint: enable=protected-access
        # Asserting the same number of copy tasks and number of font files.
        self.assertEquals(len(dependency_filepaths['fonts']), len(copy_tasks))

    def test_insert_hash(self):
        """Test _insert_hash to return correct filenames with provided hashes.
        """
        # pylint: disable=protected-access
        self.assertEquals(build._insert_hash('file.js', '123456'),
                          'file.123456.js')
        self.assertEquals(build._insert_hash('path/to/file.js', '654321'),
                          'path/to/file.654321.js')
        self.assertEquals(build._insert_hash('file.min.js', 'abcdef'),
                          'file.min.abcdef.js')
        self.assertEquals(build._insert_hash('path/to/file.min.js', 'fedcba'),
                          'path/to/file.min.fedcba.js')
        # pylint: enable=protected-access

    def test_ensure_directory_exists(self):
        """Test ensure_directory_exists to make sure non-existent parent
        directory of random.js must be created after calling function.
        """
        # Setup a sandbox folder to assert for non-existence.
        SANDBOX_DIR = os.path.join(build.PARENT_DIR, 'sandbox')
        random_filepath = os.path.join(SANDBOX_DIR, 'random.js')
        # Asserting ../oppia/random does not exist.
        self.assertFalse(os.path.isdir(SANDBOX_DIR))
        build.ensure_directory_exists(random_filepath)
        # Asserting ../oppia/random exists.
        self.assertTrue(os.path.isdir(SANDBOX_DIR))
        # Clean up sandbox directory that has just been created.
        shutil.rmtree(SANDBOX_DIR)

    def test_ensure_files_exist(self):
        """Test _ensure_files_exist raises exception with a non-existent
        filepath.
        """
        random_filepaths = [
            os.path.join(build.THIRD_PARTY_GENERATED_DEV_DIR, 'random1.js')]
        # pylint: disable=protected-access
        with self.assertRaises(ValueError) as fileNotExist:
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
        for _, _, files in os.walk(build.EXTENSIONS_DIR.get('dev_dir')):
            all_inclusive_file_count += len(files)
        ignored_file_count = 0
        for _, _, files in os.walk(build.EXTENSIONS_DIR.get('dev_dir')):
            for filename in files:
                if any(filename.endswith(p)
                       for p in build.FILE_EXTENSIONS_TO_IGNORE):
                    ignored_file_count += 1
        self.assertEqual(
            all_inclusive_file_count - ignored_file_count,
            build.get_file_count(build.EXTENSIONS_DIR.get('dev_dir')))

    def test_compare_file_count(self):
        """Test _compare_file_count to raise exception when there is a
        mismatched file count between 2 dirs.
        """
        with self.assertRaises(ValueError) as incorrectFileCount:
            # pylint: disable=protected-access
            build._compare_file_count(
                build.EXTENSIONS_DIR.get('dev_dir'),
                build.TEMPLATES_CORE_DIR.get('dev_dir'))
        # pylint: enable=protected-access
        source_dir_file_count = build.get_file_count(
            build.EXTENSIONS_DIR.get('dev_dir'))
        target_dir_file_count = build.get_file_count(
            build.TEMPLATES_CORE_DIR.get('dev_dir'))
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
        print emptyHashDict.exception
        self.assertTrue('Hash dict is empty' in emptyHashDict.exception)

        file_hashes = {base_filename: random.getrandbits(128)}
        with self.assertRaises(ValueError) as noHashInFilename:
            # pylint: disable=protected-access
            build._match_filename_with_hashes(base_filename, file_hashes)
            # pylint: enable=protected-access
        # Generate a random hash dict for base.html.
        print noHashInFilename.exception
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
        print incorrectHashInFilename.exception
        self.assertTrue(
            'Hashed file %s does not match hash dict keys'
            % hashed_base_filename in incorrectHashInFilename.exception)

    def test_process_html(self):
        """Test process_html to remove all whitespaces."""
        base_source_path = os.path.join(
            build.TEMPLATES_CORE_DIR.get('dev_dir'), 'pages', 'base.html')
        base_staging_path = os.path.join(
            build.TEMPLATES_CORE_DIR.get('staging_dir'), 'pages', 'base.html')
        build.ensure_directory_exists(base_staging_path)
        file_hashes = build.get_file_hashes(
            build.TEMPLATES_CORE_DIR.get('dev_dir'))
        # pylint: disable=protected-access
        build._ensure_files_exist([base_source_path])
        # pylint: enable=protected-access
        # Assert that /DEV's base.html has white spaces.
        with open(base_source_path, 'r') as source_base_file:
            source_base_file_content = source_base_file.read()
            self.assertRegexpMatches(
                source_base_file_content, r'\s{2,}',
                msg="No white spaces detected in file unexpectedly")

        build.process_html(base_source_path, base_staging_path, file_hashes)

        # Assert that all empty lines are removed.
        with open(base_staging_path, 'r') as minified_base_file:
            minified_base_file_content = minified_base_file.read()
            self.assertNotRegexpMatches(
                minified_base_file_content, r'\s{2,}',
                msg="Detected white spaces in file")
        # Clean up staging dir.
        # shutil.rmtree(build.TEMPLATES_CORE_DIR.get('staging_dir'))

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

    def test_copy_files_source_to_target(self):
        """Test copy_files_source_to_target to queue up correct number of copy
        tasks.
        """
        copy_tasks = collections.deque()
        extensions_hashes = build.get_file_hashes(
            build.EXTENSIONS_DIR.get('dev_dir'))
        build.copy_files_source_to_target(
            build.EXTENSIONS_DIR.get('dev_dir'),
            build.EXTENSIONS_DIR.get('out_dir'), extensions_hashes, copy_tasks)
        total_file_count = build.get_file_count(
            build.EXTENSIONS_DIR.get('dev_dir'))
        # Asserting that total file counts in the provided directory matches
        # with the total number of copy tasks queued.
        self.assertEquals(len(copy_tasks), total_file_count)

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
            self.assertEquals(
                filtered_hashes['/path/to/file.js'],
                hashes['path/to/file.js'])
            self.assertEquals(
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

    def test_save_hashes_as_json(self):
        """Test save_hashes_as_json to save hashes.js with the correct path."""
        asset_hashes = build.get_file_hashes(build.ASSETS_DEV_DIR)
        build.save_hashes_as_json(build.HASHES_JSON, asset_hashes)
        hash_filename = os.path.basename(build.HASHES_JSON)
        for filepath, file_hash in asset_hashes.iteritems():
            if filepath == hash_filename:
                # pylint: disable=protected-access
                hashed_filename = build._insert_hash(filepath, file_hash)
                # pylint: enable=protected-access
        final_filepath = os.path.join(build.ASSETS_OUT_DIR, hashed_filename)
        self.assertTrue(os.path.isfile(final_filepath))
        # shutil.rmtree(build.ASSETS_OUT_DIR)

    def test_minify_func(self):
        """Test minify_func to branch into the correct function call with the
        given file format from hash dict.
        """
        file_hashes = build.get_file_hashes(
            build.TEMPLATES_CORE_DIR.get('dev_dir'))
        html_file_processed = False
        js_file_minified = False
        css_file_minified = False
        for filepath, _ in file_hashes.iteritems():
            if (html_file_processed and js_file_minified and css_file_minified):
                # Only test for these 3 file types using hash dict.
                break
            filename = os.path.basename(filepath)
            source_path = os.path.join(
                build.TEMPLATES_CORE_DIR.get('dev_dir'), filepath)
            staging_path = os.path.join(
                build.TEMPLATES_CORE_DIR.get('staging_dir'), filepath)
            build.ensure_directory_exists(staging_path)
            capturedOutput = StringIO.StringIO()
            sys.stdout = capturedOutput
            if filename.endswith('.html') and not html_file_processed:
                build.minify_func(
                    source_path, staging_path, file_hashes, filename)
                html_file_processed = True
                self.assertEquals(
                    capturedOutput.getvalue(), 'Building %s\n' % source_path)
            elif (filename.endswith('.js') and not js_file_minified):
                build.minify_func(
                    source_path, staging_path, file_hashes, filename)
                js_file_minified = True
                self.assertEquals(
                    capturedOutput.getvalue(), 'Minifying %s\n' % source_path)
            elif filename.endswith('.css') and not css_file_minified:
                build.minify_func(
                    source_path, staging_path, file_hashes, filename)
                css_file_minified = True
                self.assertEquals(
                    capturedOutput.getvalue(), 'Minifying %s\n' % source_path)
            else:
                continue # pragma: no cover
            sys.stdout = sys.__stdout__
        # Asserting other file formats.
        build_source_path = os.path.join('scripts', 'build.py')
        build_staging_path = os.path.join('backend_prod_files', 'build.py')
        build_file_hash = build.get_file_hashes(build_source_path)
        capturedOutput = StringIO.StringIO()
        sys.stdout = capturedOutput
        build.minify_func(
            build_source_path, build_staging_path, build_file_hash, 'build.py')
        sys.stdout = sys.__stdout__
        os.remove(build_staging_path)
        self.assertEquals(
            capturedOutput.getvalue(), 'Copying %s\n' % build_source_path)

    def test_execute_tasks(self, thread_count=1):
        """Test _execute_tasks to fire corresponding number of threads."""
        build_tasks = collections.deque()
        count = thread_count
        while count:
            task = threading.Thread(
                # pylint: disable=protected-access
                target=build._minify,
                args=('path/to/input.js', 'path/to/output.js'))
            # pylint: enable=protected-access
            build_tasks.append(task)
            count -= 1
        # pylint: disable=protected-access
        build._execute_tasks(build_tasks)
        # pylint: enable=protected-access
        self.assertEqual(threading.active_count(), thread_count)

    def test_build_files(self):
        """Test build_files to queue up correct number of build tasks."""
        build_tasks = collections.deque()
        asset_hashes = build.get_file_hashes(build.ASSETS_DEV_DIR)
        # Build all files.
        build.build_files(
            build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR, asset_hashes,
            build_tasks)
        total_file_count = build.get_file_count(build.ASSETS_DEV_DIR)
        # Minus 1 to adjust for hashes.js.
        self.assertEqual(total_file_count - 1, len(build_tasks))
        build_tasks.clear()

        # Only build HTML files.
        build.build_files(
            build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR, asset_hashes,
            build_tasks, file_formats=('.html',))
        total_html_file_count = 0
        for _, _, files in os.walk(build.ASSETS_DEV_DIR):
            for filename in files:
                if filename.endswith('.html'):
                    total_html_file_count += 1
        self.assertEqual(total_html_file_count, len(build_tasks))

    def test_rebuild_new_files(self):
        """Test rebuid_new_files queue up a corresponding number of build tasks
        to the number of file changes.
        """
        build_tasks = collections.deque()
        new_file_name = 'manifest.json'
        recently_changed_filenames = [
            os.path.join(build.ASSETS_DEV_DIR, 'i18n', new_file_name)]
        asset_hashes = build.get_file_hashes(build.ASSETS_DEV_DIR)
        build.rebuild_new_files(
            build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR,
            recently_changed_filenames, asset_hashes, build_tasks)
        self.assertEqual(len(build_tasks), len(recently_changed_filenames))

    def test_get_recently_changed_filenames(self):
        """Test get_recently_changed_filenames to detect file recently added."""
        # Prepare /build/assets for production build.
        copy_tasks = collections.deque()
        asset_hashes = build.get_file_hashes(build.ASSETS_DEV_DIR)
        build.copy_files_source_to_target(
            build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR, asset_hashes,
            copy_tasks)
        # pylint: disable=protected-access
        build._execute_tasks(copy_tasks)
        # pylint: enable=protected-access
        # Copy manifest.json into /assets/i18n.
        new_file_name = os.path.join('manifest.json')
        new_file_dev_filepath = os.path.join(
            build.ASSETS_DEV_DIR, 'i18n', new_file_name)
        shutil.copyfile(new_file_name, new_file_dev_filepath)
        recently_changed_filenames = build.get_recently_changed_filenames(
            build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR)
        # Clean up new file.
        os.remove(new_file_dev_filepath)
        # Assert that manifest.json was recently added into /assets.
        self.assertEqual(
            recently_changed_filenames, [os.path.join('i18n', new_file_name)])

    def test_remove_deleted_files(self):
        """Test remove_deleted_files to clean up file from BUILD directory that
        was removed from DEV directory.
        """
        # Copy manifest.json into /assets/i18n.
        new_file_name = os.path.join('manifest.json')
        new_file_dev_filepath = os.path.join(
            build.ASSETS_DEV_DIR, 'i18n', new_file_name)
        shutil.copyfile(new_file_name, new_file_dev_filepath)
        # Assert that manifest.json is copied into /build/assets.
        self.assertTrue(os.path.isfile(new_file_dev_filepath))
        # Prepare /build/assets for production build.
        copy_tasks = collections.deque()
        asset_hashes = build.get_file_hashes(build.ASSETS_DEV_DIR)
        build.copy_files_source_to_target(
            build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR, asset_hashes,
            copy_tasks)
        # pylint: disable=protected-access
        build._execute_tasks(copy_tasks)
        # pylint: enable=protected-access
        unhashed_filepath = os.path.join('i18n', new_file_name)
        # Get final filepath by getting hash from hash dict and add to filename.
        for filepath, file_hash in asset_hashes.iteritems():
            if filepath == unhashed_filepath:
                # pylint: disable=protected-access
                filepath_with_hash = build._insert_hash(filepath, file_hash)
                # pylint: enable=protected-access
                new_file_final_filepath = os.path.join(
                    build.ASSETS_OUT_DIR, filepath_with_hash)
        # Assert that /build/manifest.json is copied over.
        self.assertIsNotNone(new_file_final_filepath)
        self.assertTrue(os.path.isfile(new_file_final_filepath))
        # Delete /assets/manifest.json.
        os.remove(new_file_dev_filepath)
        self.assertFalse(os.path.isfile(new_file_dev_filepath))
        build.remove_deleted_files(build.ASSETS_DEV_DIR, build.ASSETS_OUT_DIR)
        # Assert that /assets/i18n/manifest.[hash].json is now removed too.
        self.assertFalse(os.path.isfile(new_file_final_filepath))
