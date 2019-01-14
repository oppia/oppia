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

# pylint: disable=invalid-name
import StringIO
import collections
import os
import random
import subprocess
import threading

# pylint: disable=relative-import
import build
from core.tests import test_utils

# pylint: enable=relative-import

TEST_DIR = os.path.join('core', 'tests', 'build', '')
TEST_SOURCE_DIR = os.path.join('core', 'tests', 'build_sources')

MOCK_ASSETS_DEV_DIR = os.path.join(TEST_SOURCE_DIR, 'assets', '')
MOCK_ASSETS_OUT_DIR = os.path.join(TEST_DIR, 'static', 'assets', '')

MOCK_EXTENSIONS_DEV_DIR = os.path.join(TEST_SOURCE_DIR, 'extensions', '')

MOCK_TEMPLATES_DEV_DIR = os.path.join(TEST_SOURCE_DIR, 'templates', '')

INVALID_INPUT_FILEPATH = os.path.join(
    TEST_DIR, 'invalid', 'path', 'to', 'input.js')
INVALID_OUTPUT_FILEPATH = os.path.join(
    TEST_DIR, 'invalid', 'path', 'to', 'output.js')

EMPTY_DIR = os.path.join(TEST_DIR, 'empty', '')

# Override Pylint's protected access rule due to multiple private functions in
# the file.
# pylint: disable=protected-access


class BuildTests(test_utils.GenericTestBase):
    """Test the build methods."""

    def tearDown(self):
        super(BuildTests, self).tearDown()
        build.safe_delete_directory_tree(TEST_DIR)
        build.safe_delete_directory_tree(EMPTY_DIR)

    def test_minify(self):
        """Tests _minify with an invalid filepath."""
        with self.assertRaises(subprocess.CalledProcessError) as called_process:
            build._minify(INVALID_INPUT_FILEPATH, INVALID_OUTPUT_FILEPATH)
        # `returncode` is the exit status of the child process.
        self.assertEqual(called_process.exception.returncode, 1)

    def test_minify_and_create_sourcemap(self):
        """Tests _minify_and_create_sourcemap with an invalid filepath."""
        with self.assertRaises(subprocess.CalledProcessError) as called_process:
            build._minify_and_create_sourcemap(
                INVALID_INPUT_FILEPATH, INVALID_OUTPUT_FILEPATH)
        # `returncode` is the exit status of the child process.
        self.assertEqual(called_process.exception.returncode, 1)

    def test_ensure_files_exist(self):
        """Test _ensure_files_exist raises exception with a non-existent
        filepath.
        """
        non_existent_filepaths = [INVALID_INPUT_FILEPATH]
        # Exception will be raised at first file determined to be non-existent.
        with self.assertRaisesRegexp(
            OSError, ('File %s does not exist.') % non_existent_filepaths[0]):
            build._ensure_files_exist(non_existent_filepaths)

    def test_join_files(self):
        """Determine third_party.js contains the content of the first 10 JS
        files in /third_party/static.
        """
        # Prepare a file_stream object from StringIO.
        third_party_js_stream = StringIO.StringIO()
        # Get all filepaths from manifest.json.
        dependency_filepaths = build.get_dependencies_filepaths()
        # Join and write all JS files in /third_party/static to file_stream.
        build._join_files(dependency_filepaths['js'], third_party_js_stream)
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

    def test_generate_copy_tasks_for_fonts(self):
        """Test _generate_copy_tasks_for_fonts ensures that the number of copy
        tasks matches the number of font files.
        """
        copy_tasks = collections.deque()
        # Get all filepaths from manifest.json.
        dependency_filepaths = build.get_dependencies_filepaths()
        # Setup a sandbox folder for copying fonts.
        test_target = os.path.join('target', 'fonts', '')

        self.assertEqual(len(copy_tasks), 0)
        copy_tasks += build._generate_copy_tasks_for_fonts(
            dependency_filepaths['fonts'], test_target)
        # Asserting the same number of copy tasks and number of font files.
        self.assertEqual(len(copy_tasks), len(dependency_filepaths['fonts']))

    def test_insert_hash(self):
        """Test _insert_hash returns correct filenames with provided hashes."""
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
        mismatched file count between 2 dirs.
        """
        build.ensure_directory_exists(EMPTY_DIR)
        source_dir_file_count = build.get_file_count(EMPTY_DIR)
        assert source_dir_file_count == 0
        target_dir_file_count = build.get_file_count(MOCK_ASSETS_DEV_DIR)
        # Ensure that ASSETS_DEV_DIR has at least 1 file.
        assert target_dir_file_count > 0
        with self.assertRaisesRegexp(
            ValueError, ('%s files in first dir != %s files in second dir') %
            (source_dir_file_count, target_dir_file_count)):
            build._compare_file_count(EMPTY_DIR, MOCK_ASSETS_DEV_DIR)

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
        file_hashes = dict()
        base_filename = 'base.html'
        with self.assertRaisesRegexp(ValueError, 'Hash dict is empty'):
            build._verify_filepath_hash(base_filename, file_hashes)

        # Generate a random hash dict for base.html.
        file_hashes = {base_filename: random.getrandbits(128)}
        with self.assertRaisesRegexp(
            ValueError, '%s is expected to contain MD5 hash' % base_filename):
            build._verify_filepath_hash(base_filename, file_hashes)

        bad_filepath = 'README'
        with self.assertRaisesRegexp(
            ValueError, 'Filepath has less than 2 partitions after splitting'):
            build._verify_filepath_hash(bad_filepath, file_hashes)

        hashed_base_filename = build._insert_hash(
            base_filename, random.getrandbits(128))
        with self.assertRaisesRegexp(
            KeyError,
            'Hash from file named %s does not match hash dict values' %
            hashed_base_filename):
            build._verify_filepath_hash(hashed_base_filename, file_hashes)

    def test_process_html(self):
        """Test process_html removes whitespaces and adds hash to filepaths."""
        BASE_HTML_SOURCE_PATH = os.path.join(
            MOCK_TEMPLATES_DEV_DIR, 'base.html')
        BASE_JS_RELATIVE_PATH = os.path.join('pages', 'Base.js')
        BASE_JS_SOURCE_PATH = os.path.join(
            MOCK_TEMPLATES_DEV_DIR, BASE_JS_RELATIVE_PATH)

        build._ensure_files_exist([BASE_HTML_SOURCE_PATH, BASE_JS_SOURCE_PATH])
        # Prepare a file_stream object from StringIO.
        minified_html_file_stream = StringIO.StringIO()
        # Obtain actual file hashes of /templates to add hash to all filepaths
        # within the HTML file. The end result will look like:
        # E.g <script ... app.js></script>
        # --> <script ... app.[hash].js></script>.
        # Only need to hash Base.js.
        with self.swap(build, 'FILE_EXTENSIONS_TO_IGNORE', ('.html',)):
            file_hashes = build.get_file_hashes(MOCK_TEMPLATES_DEV_DIR)

        # Assert that base.html has white spaces and has original filepaths.
        with open(BASE_HTML_SOURCE_PATH, 'r') as source_base_file:
            source_base_file_content = source_base_file.read()
            self.assertRegexpMatches(
                source_base_file_content, r'\s{2,}',
                msg='No white spaces detected in %s unexpectedly'
                % BASE_HTML_SOURCE_PATH)
            # Look for templates/pages/Base.js in source_base_file_content.
            self.assertIn(BASE_JS_RELATIVE_PATH, source_base_file_content)

        # Build base.html file.
        with open(BASE_HTML_SOURCE_PATH, 'r') as source_base_file:
            build.process_html(
                source_base_file, minified_html_file_stream, file_hashes)

        minified_html_file_content = minified_html_file_stream.getvalue()
        self.assertNotRegexpMatches(
            minified_html_file_content, r'\s{2,}',
            msg='All white spaces must be removed from %s' %
            BASE_HTML_SOURCE_PATH)
        # Assert that hashes are inserted into filenames in base.html.
        # Final filepath in base.html example:
        # /build/templates/head/pages/Base.081ce90f17ecdf07701d83cb860985c2.js.
        final_filename = build._insert_hash(
            BASE_JS_RELATIVE_PATH, file_hashes[BASE_JS_RELATIVE_PATH])
        # Look for templates/pages/Base.081ce90f17ecdf07701d83cb860985c2.js in
        # minified_html_file_content.
        self.assertIn(final_filename, minified_html_file_content)

    def test_should_file_be_built(self):
        """Test should_file_be_built returns the correct boolean value for
        filepath that should be built.
        """
        service_js_filepath = os.path.join('core', 'pages', 'AudioService.js')
        spec_js_filepath = os.path.join('core', 'pages', 'AudioServiceSpec.js')
        protractor_filepath = os.path.join('extensions', 'protractor.js')

        python_controller_filepath = os.path.join('base.py')
        pyc_test_filepath = os.path.join(
            'core', 'controllers', 'base.pyc')
        python_test_filepath = os.path.join(
            'core', 'tests', 'base_test.py')

        self.assertFalse(build.should_file_be_built(spec_js_filepath))
        self.assertFalse(build.should_file_be_built(protractor_filepath))
        self.assertTrue(build.should_file_be_built(service_js_filepath))

        self.assertFalse(build.should_file_be_built(python_test_filepath))
        self.assertFalse(build.should_file_be_built(pyc_test_filepath))
        self.assertTrue(build.should_file_be_built(python_controller_filepath))

        # Swapping out constants to check if the reverse is true.
        # ALL JS files that ends with ...Service.js should not be built.
        with self.swap(
            build, 'JS_FILENAME_SUFFIXES_TO_IGNORE', ('Service.js',)):
            self.assertFalse(build.should_file_be_built(service_js_filepath))
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
            file_hashes = dict()
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
            self.assertTrue(filtered_hashes.has_key('/path/to/file.js'))
            self.assertTrue(filtered_hashes.has_key('/test_path/to/file.html'))
            self.assertTrue(filtered_hashes.has_key('/test_path/to/file.js'))
            self.assertFalse(filtered_hashes.has_key('/path/path/file.js'))
            self.assertFalse(filtered_hashes.has_key('/file.html'))

    def test_get_hashes_json_file_contents(self):
        """Test get_hashes_json_file_contents parses provided hash dict
        correctly to JSON format.
        """
        # Set constant to provide everything to frontend.
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
        """Test _execute_tasks joins all threads after executing all tasks."""
        build_tasks = collections.deque()
        TASK_COUNT = 2
        count = TASK_COUNT
        while count:
            task = threading.Thread(
                target=build._minify,
                args=(INVALID_INPUT_FILEPATH, INVALID_OUTPUT_FILEPATH))
            build_tasks.append(task)
            count -= 1

        self.assertEqual(threading.active_count(), 1)
        build._execute_tasks(build_tasks)
        with self.assertRaisesRegexp(
            OSError, 'threads can only be started once'):
            build._execute_tasks(build_tasks)
        # Assert that all threads are joined.
        self.assertEqual(threading.active_count(), 1)

    def test_generate_build_tasks_to_build_all_files_in_directory(self):
        """Test generate_build_tasks_to_build_all_files_in_directory queues up
        the same number of build tasks as the number of files in the source
        directory.
        """
        asset_hashes = build.get_file_hashes(MOCK_ASSETS_DEV_DIR)
        tasks = collections.deque()

        self.assertEqual(len(tasks), 0)
        # Build all files.
        tasks = build.generate_build_tasks_to_build_all_files_in_directory(
            MOCK_ASSETS_DEV_DIR, MOCK_ASSETS_OUT_DIR, asset_hashes)
        total_file_count = build.get_file_count(MOCK_ASSETS_DEV_DIR)
        self.assertEqual(len(tasks), total_file_count)

    def test_generate_build_tasks_to_build_files_from_filepaths(self):
        """Test generate_build_tasks_to_build_files_from_filepaths queues up a
        corresponding number of build tasks to the number of file changes.
        """
        new_filename = 'manifest.json'
        recently_changed_filenames = [
            os.path.join(MOCK_ASSETS_DEV_DIR, new_filename)]
        asset_hashes = build.get_file_hashes(MOCK_ASSETS_DEV_DIR)
        build_tasks = collections.deque()

        self.assertEqual(len(build_tasks), 0)
        build_tasks += build.generate_build_tasks_to_build_files_from_filepaths(
            MOCK_ASSETS_DEV_DIR, MOCK_ASSETS_OUT_DIR,
            recently_changed_filenames, asset_hashes)
        self.assertEqual(len(build_tasks), len(recently_changed_filenames))

        build_tasks.clear()
        svg_filepaths = build.get_filepaths_by_extensions(
            MOCK_ASSETS_DEV_DIR, ('.svg',))
        # Make sure there is at least 1 SVG file.
        self.assertGreater(len(svg_filepaths), 0)

        self.assertEqual(len(build_tasks), 0)
        build_tasks += build.generate_build_tasks_to_build_files_from_filepaths(
            MOCK_ASSETS_DEV_DIR, MOCK_ASSETS_OUT_DIR, svg_filepaths,
            asset_hashes)
        self.assertEqual(len(build_tasks), len(svg_filepaths))

    def test_generate_build_tasks_to_build_directory(self):
        """Test generate_build_tasks_to_build_directory queues up a
        corresponding number of build tasks according to the given scenario.
        """
        EXTENSIONS_DIRNAMES_TO_DIRPATHS = {
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
                EXTENSIONS_DIRNAMES_TO_DIRPATHS['out_dir'],
                file_hashes))
        self.assertGreater(len(build_all_files_tasks), 0)

        # Test for building all files when staging dir does not exist.
        self.assertEqual(len(build_dir_tasks), 0)
        build_dir_tasks += build.generate_build_tasks_to_build_directory(
            EXTENSIONS_DIRNAMES_TO_DIRPATHS, file_hashes)
        self.assertEqual(len(build_dir_tasks), len(build_all_files_tasks))

        build.safe_delete_directory_tree(TEST_DIR)
        build_dir_tasks.clear()

        # Test for building only new files when staging dir exists.
        build.ensure_directory_exists(
            EXTENSIONS_DIRNAMES_TO_DIRPATHS['staging_dir'])
        self.assertEqual(len(build_dir_tasks), 0)
        build_dir_tasks += build.generate_build_tasks_to_build_directory(
            EXTENSIONS_DIRNAMES_TO_DIRPATHS, file_hashes)
        self.assertEqual(len(build_dir_tasks), len(build_all_files_tasks))

        build.safe_delete_directory_tree(TEST_DIR)

        # Build all files and save to final directory.
        build.ensure_directory_exists(
            EXTENSIONS_DIRNAMES_TO_DIRPATHS['staging_dir'])
        build._execute_tasks(build_dir_tasks)
        self.assertEqual(threading.active_count(), 1)
        build._execute_tasks(
            build.generate_copy_tasks_to_copy_from_source_to_target(
                EXTENSIONS_DIRNAMES_TO_DIRPATHS['staging_dir'],
                EXTENSIONS_DIRNAMES_TO_DIRPATHS['out_dir'], file_hashes))

        build_dir_tasks.clear()

        # Test for only building files that need to be rebuilt.
        self.assertEqual(len(build_dir_tasks), 0)
        build_dir_tasks += build.generate_build_tasks_to_build_directory(
            EXTENSIONS_DIRNAMES_TO_DIRPATHS, build_dir_tasks)
        file_extensions_to_always_rebuild = ('.html', '.py',)
        always_rebuilt_filepaths = build.get_filepaths_by_extensions(
            MOCK_EXTENSIONS_DEV_DIR, file_extensions_to_always_rebuild)
        self.assertGreater(len(always_rebuilt_filepaths), 0)
        self.assertEqual(len(build_dir_tasks), len(always_rebuilt_filepaths))

        build.safe_delete_directory_tree(TEST_DIR)

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
        file_hashes = dict()

        self.assertEqual(len(delete_tasks), 0)
        delete_tasks += build.generate_delete_tasks_to_remove_deleted_files(
            file_hashes, MOCK_TEMPLATES_DEV_DIR)
        self.assertEqual(
            len(delete_tasks), build.get_file_count(MOCK_TEMPLATES_DEV_DIR))

# pylint: enable=protected-access
