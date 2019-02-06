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

"""Build file for production version of Oppia. Minifies JS and CSS."""

# pylint: disable=invalid-name
import collections
import fnmatch
import hashlib
import json
import optparse
import os
import re
import shutil
import subprocess
import threading

ASSETS_DEV_DIR = os.path.join('assets', '')
ASSETS_OUT_DIR = os.path.join('build', 'assets', '')

THIRD_PARTY_STATIC_DIR = os.path.join('third_party', 'static')
THIRD_PARTY_GENERATED_DEV_DIR = os.path.join('third_party', 'generated', '')
THIRD_PARTY_GENERATED_OUT_DIR = os.path.join(
    'build', 'third_party', 'generated', '')

THIRD_PARTY_JS_RELATIVE_FILEPATH = os.path.join('js', 'third_party.js')
MINIFIED_THIRD_PARTY_JS_RELATIVE_FILEPATH = os.path.join(
    'js', 'third_party.min.js')

THIRD_PARTY_CSS_RELATIVE_FILEPATH = os.path.join('css', 'third_party.css')
MINIFIED_THIRD_PARTY_CSS_RELATIVE_FILEPATH = os.path.join(
    'css', 'third_party.min.css')

FONTS_RELATIVE_DIRECTORY_PATH = os.path.join('fonts', '')

EXTENSIONS_DIRNAMES_TO_DIRPATHS = {
    'dev_dir': os.path.join('extensions', ''),
    'staging_dir': os.path.join('backend_prod_files', 'extensions', ''),
    'out_dir': os.path.join('build', 'extensions', '')
}
TEMPLATES_DEV_DIR = os.path.join('templates', 'dev', 'head', '')
TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS = {
    'dev_dir': os.path.join('core', 'templates', 'dev', 'head', ''),
    'staging_dir': os.path.join('backend_prod_files', 'templates', 'head', ''),
    'out_dir': os.path.join('build', 'templates', 'head', '')
}

HASHES_JS_FILENAME = 'hashes.js'
HASHES_JS_FILEPATH = os.path.join(ASSETS_DEV_DIR, HASHES_JS_FILENAME)
MANIFEST_FILE_PATH = os.path.join('manifest.json')

REMOVE_WS = re.compile(r'\s{2,}').sub
YUICOMPRESSOR_DIR = os.path.join(
    '..', 'oppia_tools', 'yuicompressor-2.4.8', 'yuicompressor-2.4.8.jar')
PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
NODE_FILE = os.path.join(
    PARENT_DIR, 'oppia_tools', 'node-6.9.1', 'bin', 'node')
UGLIFY_FILE = os.path.join(
    PARENT_DIR, 'node_modules', 'uglify-js', 'bin', 'uglifyjs')

# Files with these extensions shouldn't be moved to build directory.
FILE_EXTENSIONS_TO_IGNORE = ('.py', '.pyc', '.stylelintrc')
# Files with these name patterns shouldn't be moved to build directory, and will
# not be served in production. (This includes protractor.js files in
# /extensions.)
JS_FILENAME_SUFFIXES_TO_IGNORE = ('Spec.js', 'protractor.js')
GENERAL_FILENAMES_TO_IGNORE = ('.pyc', '.stylelintrc')
# These filepaths shouldn't be renamed (i.e. the filepath shouldn't contain
# hash).
# This is because these files don't need cache invalidation, are referenced
# from third party files or should not be moved to the build directory.
FILEPATHS_NOT_TO_RENAME = (
    '*.py',
    'third_party/generated/fonts/*',
    'third_party/generated/js/third_party.min.js.map')

# Hashes for files with these paths should be provided to the frontend in
# JS hashes object.
FILEPATHS_PROVIDED_TO_FRONTEND = (
    'images/*', 'videos/*', 'i18n/*', '*_directive.html', '*.png', '*.json')

HASH_BLOCK_SIZE = 2**20


def _minify(source_path, target_path):
    """Runs the given file through a minifier and outputs it to target_path.

    Args:
        source_path: str. Absolute path to file to be minified.
        target_path: str. Absolute path to location where to copy
            the minified file.
    """
    cmd = 'java -jar %s %s -o %s' % (
        YUICOMPRESSOR_DIR, source_path, target_path)
    subprocess.check_call(cmd, shell=True)


def write_to_file_stream(file_stream, content):
    """Write to a file object using provided content.

    Args:
        file_stream: file. A stream handling object to do write operation on.
        content: str. String content to write to file object.
    """
    file_stream.write(content)


def _join_files(source_paths, target_file_stream):
    """Writes multiple files into one file.

    Args:
        source_paths: list(str). Paths to files to join together.
        target_file_stream: file. A stream object of target file.
    """
    for source_path in source_paths:
        with open(source_path, 'r') as source_file:
            write_to_file_stream(target_file_stream, source_file.read())


def _minify_and_create_sourcemap(source_path, target_file_path):
    """Minifies and generates source map for a JS file. This function is only
    meant to be used with third_party.min.js.

    Args:
        source_path: str. Path to JS file to minify.
        target_file_path: str. Path to location of the minified file.
    """
    print 'Minifying and creating sourcemap for %s' % source_path
    source_map_properties = 'includeSources,url=\'third_party.min.js.map\''
    cmd = '%s %s %s -c -m --source-map %s -o %s ' % (
        NODE_FILE, UGLIFY_FILE, source_path,
        source_map_properties, target_file_path)
    subprocess.check_call(cmd, shell=True)


def _generate_copy_tasks_for_fonts(source_paths, target_path):
    """Queue up a copy task for each font file.

    Args:
        source_paths: list(str). Paths to fonts.
        target_path: str. Path where the fonts should be copied.

    Returns:
        deque(Thread). A deque that contains all copy tasks queued
            to be processed.
    """
    copy_tasks = collections.deque()
    for font_path in source_paths:
        copy_task = threading.Thread(
            target=shutil.copy,
            args=(font_path, target_path,))
        copy_tasks.append(copy_task)
    return copy_tasks


def _insert_hash(filepath, file_hash):
    """Inserts hash into filepath before the file extension.

    Args:
        filepath: str. Path where the hash should be inserted.
        file_hash: str. Hash to be inserted into the path.

    Returns:
        str. Filepath with hash inserted.
    """
    filepath, file_extension = os.path.splitext(filepath)
    return '%s.%s%s' % (filepath, file_hash, file_extension)


def ensure_directory_exists(filepath):
    """Ensures if directory tree exists, if not creates the directories.

    Args:
        filepath: str. Path to file located in directory that we want to
            ensure exists.
    """
    directory = os.path.dirname(filepath)
    if not os.path.exists(directory):
        os.makedirs(directory)


def safe_delete_directory_tree(directory_path):
    """Recursively delete a directory tree. If directory tree does not exist,
    create the directories first then delete the directory tree.

    Args:
        directory_path: str. Directory path to be deleted.
    """
    ensure_directory_exists(directory_path)
    shutil.rmtree(directory_path)


def _ensure_files_exist(filepaths):
    """Ensures that files exist at the given filepaths.

    Args:
        filepaths: list(str). Paths to files that we want to ensure exist.

    Raises:
        OSError: One or more of the files does not exist.
    """
    for filepath in filepaths:
        if not os.path.isfile(filepath):
            raise OSError('File %s does not exist.' % filepath)


def safe_copy_file(source_filepath, target_filepath):
    """Copy a file (no metadata) after ensuring the file exists at the given
    source filepath.
    NOTE: shutil.copyfile does not accept directory path as arguments.

    Args:
        source_filepath: str. Path to source file that we want to copy from.
        target_filepath: str. Path to target file that we want to copy to.
    """
    _ensure_files_exist([source_filepath])
    shutil.copyfile(source_filepath, target_filepath)


def safe_delete_file(filepath):
    """Delete a file after ensuring the provided file actually exists.

    Args:
        filepath: str. Filepath to be deleted.
    """
    _ensure_files_exist([filepath])
    os.remove(filepath)


def get_file_count(directory_path):
    """Count total number of file in the given directory, ignoring any files
    with extensions in FILE_EXTENSIONS_TO_IGNORE or files that should not be
    built.

    Args:
        directory_path: str. Directory to be walked.

    Returns:
        int. Total number of files minus ignored files.
    """
    total_file_count = 0
    for _, _, filenames in os.walk(directory_path):
        for filename in filenames:
            # Ignore files with certain extensions.
            if should_file_be_built(filename) and not any(
                    filename.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                total_file_count += 1
    return total_file_count


def _compare_file_count(first_dir_path, second_dir_path):
    """Ensure that two dir's file counts match.

    Args:
       first_dir_path: str. First directory to compare.
       second_dir_path: str. Second directory to compare.

    Raises:
        ValueError: The source directory does not have the same file count as
            the target directory.
    """
    first_dir_file_count = get_file_count(first_dir_path)
    second_dir_file_count = get_file_count(second_dir_path)
    if first_dir_file_count != second_dir_file_count:
        print 'Comparing %s vs %s' % (first_dir_path, second_dir_path)
        raise ValueError(
            '%s files in first dir != %s files in second dir' % (
                first_dir_file_count, second_dir_file_count))


def process_html(source_file_stream, target_file_stream, file_hashes):
    """Remove whitespaces and add hashes to filepaths in the HTML file stream
    object.

    Args:
        source_file_stream: file. The stream object of the HTML file to be
            read from.
        target_file_stream: file. The stream object to write the minified HTML
            file to.
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.
    """
    content = source_file_stream.read()
    for filepath, file_hash in file_hashes.iteritems():
        # We are adding hash in all file paths except for html paths.
        # This is because html paths are used by backend and we work with
        # paths without hash part in backend.
        if not filepath.endswith('.html'):
            filepath_with_hash = _insert_hash(filepath, file_hash)
            content = content.replace(
                '%s%s' % (TEMPLATES_DEV_DIR, filepath),
                '%s%s' % (
                    TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['out_dir'],
                    filepath_with_hash))
            content = content.replace(
                '%s%s' % (ASSETS_DEV_DIR, filepath),
                '%s%s' % (ASSETS_OUT_DIR, filepath_with_hash))
            content = content.replace(
                '%s%s' % (EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir'], filepath),
                '%s%s' % (
                    EXTENSIONS_DIRNAMES_TO_DIRPATHS['out_dir'],
                    filepath_with_hash))
            content = content.replace(
                '%s%s' % (THIRD_PARTY_GENERATED_DEV_DIR, filepath),
                '%s%s' % (THIRD_PARTY_GENERATED_OUT_DIR, filepath_with_hash))
    content = REMOVE_WS(' ', content)
    write_to_file_stream(target_file_stream, content)


def get_dependency_directory(dependency):
    """Get dependency directory from dependecy dictionary.

    Args:
        dependency: dict(str, str). Dictionary representing single dependency
            from manifest.json.

    Returns:
        str. Dependency directory.
    """
    if 'targetDir' in dependency:
        dependency_dir = dependency['targetDir']
    else:
        dependency_dir = dependency['targetDirPrefix'] + dependency['version']
    return os.path.join(THIRD_PARTY_STATIC_DIR, dependency_dir)


def get_css_filepaths(dependency_bundle, dependency_dir):
    """Gets dependency css filepaths.

    Args:
        dependency_bundle: dict(str, list(str) | str). The dict has three keys:
            - 'js': List of paths to js files that need to be copied.
            - 'css': List of paths to css files that need to be copied.
            - 'fontsPath': Path to folder containing fonts that need to be
                copied.
        dependency_dir: str. Path to directory where the files that need to
            be copied are located.

    Returns:
        list(str). List of paths to css files that need to be copied.
    """
    css_files = dependency_bundle.get('css', [])
    return [os.path.join(dependency_dir, css_file) for css_file in css_files]


def get_js_filepaths(dependency_bundle, dependency_dir):
    """Gets dependency js filepaths.

    Args:
        dependency_bundle: dict(str, list(str) | str). The dict has three keys:
            - 'js': List of paths to js files that need to be copied.
            - 'css': List of paths to css files that need to be copied.
            - 'fontsPath': Path to folder containing fonts that need to be
                copied.
        dependency_dir: str. Path to directory where the files that need to
            be copied are located.

    Returns:
        list(str). List of paths to js files that need to be copied.
    """
    js_files = dependency_bundle.get('js', [])
    return [os.path.join(dependency_dir, js_file) for js_file in js_files]


def get_font_filepaths(dependency_bundle, dependency_dir):
    """Gets dependency font filepaths.

    Args:
        dependency_bundle: dict(str, list(str) | str). The dict has three keys:
            - 'js': List of paths to js files that need to be copied.
            - 'css': List of paths to css files that need to be copied.
            - 'fontsPath': Path to folder containing fonts that need to be
                copied.
        dependency_dir: str. Path to directory where the files that need to
            be copied are located.

    Returns:
        list(str). List of paths to font files that need to be copied.
    """
    if 'fontsPath' not in dependency_bundle:
        # Skip dependency bundles in manifest.json that do not have
        # fontsPath property.
        return []
    fonts_path = dependency_bundle['fontsPath']
    # Obtain directory path to /font inside dependency folder.
    # E.g. third_party/static/bootstrap-3.3.4/fonts/.
    font_dir = os.path.join(dependency_dir, fonts_path)
    font_filepaths = []
    # Walk the directory and add all font files to list.
    for root, _, filenames in os.walk(font_dir):
        for filename in filenames:
            font_filepaths.append(os.path.join(root, filename))
    return font_filepaths


def get_dependencies_filepaths():
    """Extracts dependencies filepaths from manifest.json file into
    a dictionary.

    Returns:
        dict(str, list(str)). A dict mapping file types to lists of filepaths.
            The dict has three keys: 'js', 'css' and 'fonts'. Each of the
            corresponding values is a full list of dependency file paths of the
            given type.
    """
    filepaths = {
        'js': [],
        'css': [],
        'fonts': []
    }
    with open(MANIFEST_FILE_PATH, 'r') as json_file:
        manifest = json.loads(
            json_file.read(), object_pairs_hook=collections.OrderedDict)
    frontend_dependencies = manifest['dependencies']['frontend']
    for dependency in frontend_dependencies.values():
        if 'bundle' in dependency:
            dependency_dir = get_dependency_directory(dependency)
            filepaths['css'].extend(
                get_css_filepaths(dependency['bundle'], dependency_dir))
            filepaths['js'].extend(
                get_js_filepaths(dependency['bundle'], dependency_dir))
            filepaths['fonts'].extend(
                get_font_filepaths(dependency['bundle'], dependency_dir))

    _ensure_files_exist(filepaths['js'])
    _ensure_files_exist(filepaths['css'])
    _ensure_files_exist(filepaths['fonts'])
    return filepaths


def minify_third_party_libs(third_party_directory_path):
    """Minify third_party.js and third_party.css and remove un-minified
    files.
    """
    THIRD_PARTY_JS_FILEPATH = os.path.join(
        third_party_directory_path, THIRD_PARTY_JS_RELATIVE_FILEPATH)
    THIRD_PARTY_CSS_FILEPATH = os.path.join(
        third_party_directory_path, THIRD_PARTY_CSS_RELATIVE_FILEPATH)

    MINIFIED_THIRD_PARTY_JS_FILEPATH = os.path.join(
        third_party_directory_path, MINIFIED_THIRD_PARTY_JS_RELATIVE_FILEPATH)
    MINIFIED_THIRD_PARTY_CSS_FILEPATH = os.path.join(
        third_party_directory_path, MINIFIED_THIRD_PARTY_CSS_RELATIVE_FILEPATH)

    _minify_and_create_sourcemap(
        THIRD_PARTY_JS_FILEPATH, MINIFIED_THIRD_PARTY_JS_FILEPATH)
    _minify(THIRD_PARTY_CSS_FILEPATH, MINIFIED_THIRD_PARTY_CSS_FILEPATH)
    # Clean up un-minified third_party.js and third_party.css.
    safe_delete_file(THIRD_PARTY_JS_FILEPATH)
    safe_delete_file(THIRD_PARTY_CSS_FILEPATH)


def build_third_party_libs(third_party_directory_path):
    """Joins all third party css files into single css file and js files into
    single js file. Copies both files and all fonts into third party folder.
    """

    print 'Building third party libs at %s' % third_party_directory_path

    THIRD_PARTY_JS_FILEPATH = os.path.join(
        third_party_directory_path, THIRD_PARTY_JS_RELATIVE_FILEPATH)
    THIRD_PARTY_CSS_FILEPATH = os.path.join(
        third_party_directory_path, THIRD_PARTY_CSS_RELATIVE_FILEPATH)
    FONTS_DIR = os.path.join(
        third_party_directory_path, FONTS_RELATIVE_DIRECTORY_PATH)

    dependency_filepaths = get_dependencies_filepaths()
    ensure_directory_exists(THIRD_PARTY_JS_FILEPATH)
    with open(THIRD_PARTY_JS_FILEPATH, 'w+') as third_party_js_file:
        _join_files(dependency_filepaths['js'], third_party_js_file)

    ensure_directory_exists(THIRD_PARTY_CSS_FILEPATH)
    with open(THIRD_PARTY_CSS_FILEPATH, 'w+') as third_party_css_file:
        _join_files(dependency_filepaths['css'], third_party_css_file)

    ensure_directory_exists(FONTS_DIR)
    _execute_tasks(
        _generate_copy_tasks_for_fonts(
            dependency_filepaths['fonts'], FONTS_DIR))


def hash_should_be_inserted(filepath):
    """Returns if the file should be renamed to include hash in
    the path.

    Args:
        filepath: str. Path relative to directory we are currently building.

    Returns:
        bool. True if filepath should contain hash else False.
    """
    return not any(fnmatch.fnmatch(filepath, pattern) for pattern
                   in FILEPATHS_NOT_TO_RENAME)


def should_file_be_built(filepath):
    """Determines if the file should be built.
        - JS files: Returns False if filepath matches with pattern in
        JS_FILENAME_SUFFIXES_TO_IGNORE, else returns True.
        - Python files: Returns False if filepath ends with _test.py, else
        returns True
        - Other files: Returns False if filepath matches with pattern in
        GENERAL_FILENAMES_TO_IGNORE, else returns True.

    Args:
        filepath: str. Path relative to file we are currently building.

    Returns:
        bool. True if filepath should be built, else False.
    """
    if filepath.endswith('.js'):
        return not any(
            filepath.endswith(p) for p in JS_FILENAME_SUFFIXES_TO_IGNORE)
    elif filepath.endswith('_test.py'):
        return False
    else:
        return not any(
            filepath.endswith(p) for p in GENERAL_FILENAMES_TO_IGNORE)


def generate_copy_tasks_to_copy_from_source_to_target(
        source, target, file_hashes):
    """Generate copy task for each file in source directory, excluding files
    with extensions in FILE_EXTENSIONS_TO_IGNORE. Insert hash from hash dict
    into the destination filename.

    Args:
        source: str. Path relative to /oppia directory of directory
            containing files and directories to be copied.
        target: str. Path relative to /oppia directory of directory where
            to copy the files and directories.
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.

    Returns:
        deque(Thread). A deque that contains all copy tasks queued
            to be processed.
    """
    print 'Processing %s' % os.path.join(os.getcwd(), source)
    print 'Copying into %s' % os.path.join(os.getcwd(), target)
    copy_tasks = collections.deque()
    for root, dirnames, filenames in os.walk(os.path.join(os.getcwd(), source)):
        for directory in dirnames:
            print 'Copying %s' % os.path.join(root, directory)
        for filename in filenames:
            source_path = os.path.join(root, filename)
            # Python files should not be copied to final build directory.
            if not any(
                    source_path.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                target_path = source_path
                relative_path = os.path.relpath(source_path, source)
                if hash_should_be_inserted(source + relative_path):
                    relative_path = (
                        _insert_hash(relative_path, file_hashes[relative_path]))

                target_path = os.path.join(os.getcwd(), target, relative_path)
                ensure_directory_exists(target_path)
                copy_task = threading.Thread(
                    target=safe_copy_file,
                    args=(source_path, target_path,))
                copy_tasks.append(copy_task)
    return copy_tasks


def is_file_hash_provided_to_frontend(filepath):
    """Returns if the hash for the filepath should be provided to the frontend.

    Args:
        filepath: str. Relative path to the file.

    Returns:
        bool. True if file hash should be provided to the frontend else False.
    """
    return any(fnmatch.fnmatch(filepath, pattern) for pattern
               in FILEPATHS_PROVIDED_TO_FRONTEND)


def generate_md5_hash(filepath):
    """Returns md5 hash of file.

    Args:
        filepath: str. Absolute path to the file.

    Returns:
        str. Hexadecimal hash of specified file.
    """
    m = hashlib.md5()
    with open(filepath, 'rb') as f:
        while True:
            buf = f.read(HASH_BLOCK_SIZE)
            if not buf:
                break
            m.update(buf)
    return m.hexdigest()


def get_filepaths_by_extensions(source_dir, file_extensions):
    """Return list of filepaths in a directory with certain extensions,
    excluding filepaths that should not be built.

    Args:
        source_dir: str. Root directory to be walked.
        file_extensions: tuple(str). Tuple of file extensions.

    Returns:
        list(str). List of filepaths with specified extensions.
    """
    filepaths = []
    for root, _, filenames in os.walk(source_dir):
        for filename in filenames:
            filepath = os.path.join(root, filename)
            relative_filepath = os.path.relpath(filepath, source_dir)
            if should_file_be_built(filename) and any(
                    filename.endswith(p) for p in file_extensions):
                filepaths.append(relative_filepath)
    return filepaths


def get_file_hashes(directory_path):
    """Returns hashes of all files in directory tree, excluding files with
    extensions in FILE_EXTENSIONS_TO_IGNORE or files that should not be built.

    Args:
        directory_path: str. Root directory of the tree.

    Returns:
        dict(str, str). Dictionary with keys specifying file paths and values
            specifying file hashes.
    """
    file_hashes = dict()

    print('Computing hashes for files in %s'
          % os.path.join(os.getcwd(), directory_path))

    for root, dirnames, filenames in os.walk(
            os.path.join(os.getcwd(), directory_path)):
        for directory in dirnames:
            print('Computing hashes for files in %s'
                  % os.path.join(root, directory))
        for filename in filenames:
            if should_file_be_built(filename) and not any(
                    filename.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                complete_filepath = os.path.join(root, filename)
                relative_filepath = os.path.relpath(
                    complete_filepath, directory_path)
                file_hashes[relative_filepath] = generate_md5_hash(
                    complete_filepath)

    return file_hashes


def filter_hashes(file_hashes):
    """Filters hashes that should be provided to the frontend
    and prefixes "/" in front of the keys.

    Args:
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.

    Returns:
        dict(str, str). Filtered dictionary of only filepaths that should be
            provided to the frontend.
    """
    filtered_hashes = dict()
    for filepath, file_hash in file_hashes.iteritems():
        if is_file_hash_provided_to_frontend(filepath):
            filtered_hashes['/' + filepath] = file_hash
    return filtered_hashes


def get_hashes_json_file_contents(file_hashes):
    """Return JS code that loads hashes needed for frontend into variable.

    Args:
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.

    Returns:
        str. JS code loading hashes as JSON into variable.
    """
    # Only some of the hashes are needed in the frontend.
    filtered_hashes = filter_hashes(file_hashes)

    hashes_json = json.dumps(filtered_hashes)
    return 'var hashes = JSON.parse(\'%s\');' % (hashes_json)


def minify_func(source_path, target_path, file_hashes, filename):
    """Call the appropriate functions to handle different types of file
    formats:
        - HTML files: Remove whitespaces, interpolates paths in HTML to include
        hashes in source directory and save edited file at target directory.
        - CSS or JS files: Minify and save at target directory.
        - Other files: Copy the file from source directory to target directory.
    """
    if filename.endswith('.html'):
        print 'Building %s' % source_path
        with open(source_path, 'r+') as source_html_file:
            with open(target_path, 'w+') as minified_html_file:
                process_html(source_html_file, minified_html_file, file_hashes)
    elif filename.endswith('.css') or filename.endswith('.js'):
        print 'Minifying %s' % source_path
        _minify(source_path, target_path)
    else:
        print 'Copying %s' % source_path
        safe_copy_file(source_path, target_path)


def _execute_tasks(tasks, batch_size=24):
    """Starts all tasks and checks the results.

    Runs no more than 'batch_size' tasks at a time.
    """
    remaining_tasks = collections.deque(tasks)
    currently_running_tasks = []

    while remaining_tasks or currently_running_tasks:
        if currently_running_tasks:
            for task in collections.deque(currently_running_tasks):
                if not task.is_alive():
                    currently_running_tasks.remove(task)
        while remaining_tasks and len(currently_running_tasks) < batch_size:
            task = remaining_tasks.popleft()
            currently_running_tasks.append(task)
            try:
                task.start()
            except RuntimeError as threadAlreadyStarted:
                raise OSError(threadAlreadyStarted.message)


def generate_build_tasks_to_build_all_files_in_directory(
        source, target, file_hashes):
    """This function queues up tasks to build all files in a directory,
    excluding files that should not be built.

    Args:
        source: str.  Path relative to /oppia of directory containing source
            files and directories to be built.
        target: str. Path relative to /oppia of directory where the built files
            and directories will be saved to.
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.

    Returns:
        deque(Thread). A deque that contains all build tasks queued
            to be processed.
    """
    print 'Processing %s' % os.path.join(os.getcwd(), source)
    print 'Generating into %s' % os.path.join(os.getcwd(), target)
    build_tasks = collections.deque()

    for root, dirnames, filenames in os.walk(os.path.join(os.getcwd(), source)):
        for directory in dirnames:
            print 'Building directory %s' % os.path.join(root, directory)
        for filename in filenames:
            source_path = os.path.join(root, filename)
            target_path = source_path.replace(source, target)
            ensure_directory_exists(target_path)
            if should_file_be_built(source_path):
                task = threading.Thread(
                    target=minify_func,
                    args=(source_path, target_path, file_hashes, filename,))
                build_tasks.append(task)
    return build_tasks


def generate_build_tasks_to_build_files_from_filepaths(
        source_path, target_path, filepaths, file_hashes):
    """This function queues up build tasks to build files from a list of
    filepaths, excluding files that should not be built.

    Args:
        source_path: str. Path relative to /oppia directory of directory
            containing files and directories to be copied.
        target_path: str. Path relative to /oppia directory of directory where
            to copy the files and directories.
        filepaths: list(str). List of filepaths to be built.
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.

    Returns:
        deque(Thread). A deque that contains all build tasks queued
            to be processed.
    """
    build_tasks = collections.deque()
    for filepath in filepaths:
        source_file_path = os.path.join(source_path, filepath)
        target_file_path = os.path.join(target_path, filepath)
        ensure_directory_exists(target_file_path)
        if should_file_be_built(source_path):
            task = threading.Thread(
                target=minify_func,
                args=(
                    source_file_path, target_file_path, file_hashes, filepath,))
            build_tasks.append(task)
    return build_tasks


def generate_delete_tasks_to_remove_deleted_files(
        source_dir_hashes, staging_directory):
    """This function walks the staging directory and queues up deletion tasks to
    remove files that are not in the hash dict i.e. remaining files in staging
    directory that have since been deleted from source directory. Files with
    extensions in FILE_EXTENSIONS_TO_IGNORE will be excluded.

    Args:
        source_dir_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.
        staging_directory: str. Path relative to /oppia directory of directory
            containing files and directories to be walked.

    Returns:
        deque(Thread). A deque that contains all delete tasks
            queued to be processed.
    """
    print 'Scanning directory %s to remove deleted file' % staging_directory
    delete_tasks = collections.deque()
    for root, dirnames, filenames in os.walk(
            os.path.join(os.getcwd(), staging_directory)):
        for directory in dirnames:
            print 'Scanning %s' % os.path.join(root, directory)
        for filename in filenames:
            target_path = os.path.join(root, filename)
            # Ignore files with certain extensions.
            if not any(
                    target_path.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                relative_path = os.path.relpath(target_path, staging_directory)
                # Remove file found in staging directory but not in source
                # directory, i.e. file not listed in hash dict.
                if relative_path not in source_dir_hashes:
                    print ('Unable to find %s in file hashes, deleting file'
                           % target_path)
                    task = threading.Thread(
                        target=safe_delete_file, args=(target_path,))
                    delete_tasks.append(task)
    return delete_tasks


def get_recently_changed_filenames(source_dir_hashes, out_dir):
    """Compare hashes of source files and built files. Return a list of
    filenames that were recently changed. Skips files that are not supposed to
    built or already built.

    Args:
        source_dir_hashes: dict(str, str). Dictionary of hashes of files
            to be built.
        out_dir: str. Path relative to /oppia where built files are located.

    Returns:
        list(str). List of filenames expected to be re-hashed.
    """
    # Hashes are created based on files' contents and are inserted between
    # the filenames and their extensions,
    # e.g base.240933e7564bd72a4dde42ee23260c5f.html
    # If a file gets edited, a different MD5 hash is generated.
    recently_changed_filenames = []
    # Currently, Python files and HTML files are always re-built.
    FILE_EXTENSIONS_NOT_TO_TRACK = ('.html', '.py',)
    for filename, md5_hash in source_dir_hashes.iteritems():
        # Skip files that are already built or should not be built.
        if should_file_be_built(filename) and not any(
                filename.endswith(p) for p in FILE_EXTENSIONS_NOT_TO_TRACK):
            final_filepath = _insert_hash(
                os.path.join(out_dir, filename), md5_hash)
            if not os.path.isfile(final_filepath):
                # Filename with provided hash cannot be found, this file has
                # been recently changed or created since last build.
                recently_changed_filenames.append(filename)
    if recently_changed_filenames:
        print ('The following files will be rebuilt due to recent changes: %s' %
               recently_changed_filenames)
    return recently_changed_filenames


def generate_build_tasks_to_build_directory(dirnames_dict, file_hashes):
    """This function queues up build tasks to build all files in source
    directory if there is no existing staging directory. Otherwise, selectively
    queue up build tasks to build recently changed files.

    Args:
        dirnames_dict: dict(str, str). This dict should contain three keys,
            with corresponding values as follows:
            - 'dev_dir': the directory that contains source files to be built.
            - 'staging_dir': the directory that contains minified files waiting
                for final copy process.
            - 'out_dir': the final directory that contains built files with hash
                inserted into filenames.
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.

    Returns:
        deque(Thread). A deque that contains all build tasks queued
            to be processed.
    """
    source_dir = dirnames_dict['dev_dir']
    staging_dir = dirnames_dict['staging_dir']
    out_dir = dirnames_dict['out_dir']
    build_tasks = collections.deque()
    if not os.path.isdir(staging_dir):
        # If there is no staging dir, perform build process on all files.
        print 'Creating new %s folder' % staging_dir
        ensure_directory_exists(staging_dir)
        build_tasks += generate_build_tasks_to_build_all_files_in_directory(
            source_dir, staging_dir, file_hashes)
    else:
        # If staging dir exists, rebuild all HTML and Python files.
        file_extensions_to_always_rebuild = ('.html', '.py',)
        print (
            'Staging dir exists, re-building all %s files'
            % str(file_extensions_to_always_rebuild))

        filenames_to_always_rebuild = get_filepaths_by_extensions(
            source_dir, file_extensions_to_always_rebuild)
        build_tasks += generate_build_tasks_to_build_files_from_filepaths(
            source_dir, staging_dir, filenames_to_always_rebuild, file_hashes)

        dev_dir_hashes = get_file_hashes(source_dir)
        # Clean up files in staging directory that cannot be found in file
        # hashes dictionary.
        _execute_tasks(generate_delete_tasks_to_remove_deleted_files(
            dev_dir_hashes, staging_dir))

        print 'Getting files that have changed between %s and %s' % (
            source_dir, out_dir)
        recently_changed_filenames = get_recently_changed_filenames(
            dev_dir_hashes, out_dir)
        if recently_changed_filenames:
            print 'Re-building recently changed files at %s' % source_dir
            build_tasks += generate_build_tasks_to_build_files_from_filepaths(
                source_dir, staging_dir, recently_changed_filenames,
                file_hashes)
        else:
            print 'No changes detected. Using previously built files.'

    return build_tasks


def _verify_filepath_hash(relative_filepath, file_hashes):
    """Ensure that hashes in filepaths match with the hash entries in hash
    dict.

    Args:
        relative_filepath: str. Filepath that is relative from /build.
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.

    Raises:
        ValueError: The hash dict is empty.
        ValueError: Filepath has less than 2 partitions after splitting by '.'
            delimiter.
        ValueError: The filename does not contain hash.
        KeyError: The filename's hash cannot be found in the hash dict.
    """
    # Final filepath example:
    # head/pages/base.240933e7564bd72a4dde42ee23260c5f.html.
    if not file_hashes:
        raise ValueError('Hash dict is empty')

    filename_partitions = relative_filepath.split('.')
    if len(filename_partitions) < 2:
        raise ValueError('Filepath has less than 2 partitions after splitting')

    hash_string_from_filename = filename_partitions[-2]
    # Ensure hash string obtained from filename follows MD5 hash format.
    if not re.search(r'([a-fA-F\d]{32})', relative_filepath):
        raise ValueError(
            '%s is expected to contain MD5 hash' % relative_filepath)
    if hash_string_from_filename not in file_hashes.values():
        raise KeyError(
            'Hash from file named %s does not match hash dict values' %
            relative_filepath)


def _verify_build(input_dirnames, output_dirnames, file_hashes):
    """Verify a few metrics after build process finishes:
        1) Number of files between source directory and final directory
        matches.
        2) The hashes in filenames belongs to the hash dict.
        3) hashes.js, third_party.min.css and third_party.min.js are built and
        hashes are inserted.

        Args:
            input_dirnames: list(str). List of directory paths that contain
                source files.
            output_dirnames: list(str). List of directory paths that contain
                built files.
            file_hashes: dict(str, str). Dictionary with filepaths as keys and
                hashes of file content as values.
    """
    for i in xrange(len(input_dirnames)):
        # Make sure that all files in source directory and staging directory are
        # accounted for.
        _compare_file_count(input_dirnames[i], output_dirnames[i])

    # Make sure that hashed file name matches with current hash dict.
    for built_dir in output_dirnames:
        for root, _, filenames in os.walk(built_dir):
            for filename in filenames:
                parent_dir = os.path.basename(root)
                converted_filepath = os.path.join(
                    THIRD_PARTY_GENERATED_DEV_DIR, parent_dir, filename)
                if hash_should_be_inserted(converted_filepath):
                    # Obtain the same filepath format as the hash dict's key.
                    relative_filepath = os.path.relpath(
                        os.path.join(root, filename), built_dir)
                    _verify_filepath_hash(relative_filepath, file_hashes)

    hash_final_filename = _insert_hash(
        HASHES_JS_FILENAME, file_hashes[HASHES_JS_FILENAME])

    third_party_js_final_filename = _insert_hash(
        MINIFIED_THIRD_PARTY_JS_RELATIVE_FILEPATH,
        file_hashes[MINIFIED_THIRD_PARTY_JS_RELATIVE_FILEPATH])

    third_party_css_final_filename = _insert_hash(
        MINIFIED_THIRD_PARTY_CSS_RELATIVE_FILEPATH,
        file_hashes[MINIFIED_THIRD_PARTY_CSS_RELATIVE_FILEPATH])

    _ensure_files_exist([
        os.path.join(ASSETS_OUT_DIR, hash_final_filename),
        os.path.join(
            THIRD_PARTY_GENERATED_OUT_DIR, third_party_js_final_filename),
        os.path.join(
            THIRD_PARTY_GENERATED_OUT_DIR, third_party_css_final_filename)])


def generate_build_directory():
    """Generates hashes for files. Minifies files and interpolates paths
    in HTMLs to include hashes. Renames the files to include hashes and copies
    them into build directory.
    """
    print 'Building Oppia in production mode...'

    # The keys for hashes are filepaths relative to the subfolders of the future
    # /build folder. This is so that the replacing inside the HTML files works
    # correctly.
    hashes = dict()
    build_tasks = collections.deque()
    copy_tasks = collections.deque()

    # Create hashes for all directories and files.
    HASH_DIRS = [
        ASSETS_DEV_DIR, EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir'],
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['dev_dir'],
        THIRD_PARTY_GENERATED_DEV_DIR]
    for HASH_DIR in HASH_DIRS:
        hashes.update(get_file_hashes(HASH_DIR))
    # Save hashes as JSON and write the JSON into JS file
    # to make the hashes available to the frontend.
    ensure_directory_exists(HASHES_JS_FILEPATH)
    with open(HASHES_JS_FILEPATH, 'w+') as hashes_js_file:
        write_to_file_stream(
            hashes_js_file, get_hashes_json_file_contents(hashes))
    # Update hash dict with newly created hashes.js.
    hashes.update({HASHES_JS_FILENAME: generate_md5_hash(HASHES_JS_FILEPATH)})
    # Make sure /assets/hashes.js is available to the frontend.
    _ensure_files_exist([HASHES_JS_FILEPATH])

    # Build files in /extensions and copy them into staging directory.
    build_tasks += generate_build_tasks_to_build_directory(
        EXTENSIONS_DIRNAMES_TO_DIRPATHS, hashes)
    # Minify all template files and copy them into staging directory.
    build_tasks += generate_build_tasks_to_build_directory(
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS, hashes)
    _execute_tasks(build_tasks)

    # Copy all files from staging directory to production directory.
    COPY_INPUT_DIRS = [
        ASSETS_DEV_DIR, EXTENSIONS_DIRNAMES_TO_DIRPATHS['staging_dir'],
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['staging_dir'],
        THIRD_PARTY_GENERATED_DEV_DIR]
    COPY_OUTPUT_DIRS = [
        ASSETS_OUT_DIR, EXTENSIONS_DIRNAMES_TO_DIRPATHS['out_dir'],
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['out_dir'],
        THIRD_PARTY_GENERATED_OUT_DIR]
    assert len(COPY_INPUT_DIRS) == len(COPY_OUTPUT_DIRS)
    for i in xrange(len(COPY_INPUT_DIRS)):
        safe_delete_directory_tree(COPY_OUTPUT_DIRS[i])
        copy_tasks += generate_copy_tasks_to_copy_from_source_to_target(
            COPY_INPUT_DIRS[i], COPY_OUTPUT_DIRS[i], hashes)
    _execute_tasks(copy_tasks)

    SOURCE_DIRS = [
        ASSETS_DEV_DIR, EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir'],
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['dev_dir'],
        THIRD_PARTY_GENERATED_DEV_DIR]
    _verify_build(SOURCE_DIRS, COPY_OUTPUT_DIRS, hashes)
    # Clean up un-hashed hashes.js.
    safe_delete_file(HASHES_JS_FILEPATH)
    print 'Build completed.'


def build():
    """The main method of this script.

    Creates a third-party directory where all the JS and CSS dependencies are
    built and stored. Depending on the options passed to the script, might also
    minify third-party libraries and/or generate a build directory.
    """
    parser = optparse.OptionParser()
    parser.add_option(
        '--prod_env', action='store_true', default=False, dest='prod_mode')
    parser.add_option(
        '--minify_third_party_libs_only', action='store_true', default=False,
        dest='minify_third_party_libs_only')
    options = parser.parse_args()[0]
    # Regenerate /third_party/generated from scratch.
    safe_delete_directory_tree(THIRD_PARTY_GENERATED_DEV_DIR)
    build_third_party_libs(THIRD_PARTY_GENERATED_DEV_DIR)

    # If minify_third_party_libs_only is set to True, skips the rest of the
    # build process once third party libs are minified.
    if options.minify_third_party_libs_only and not options.prod_mode:
        raise Exception(
            'minify_third_party_libs_only should not be set in non-prod mode.')
    if options.prod_mode:
        minify_third_party_libs(THIRD_PARTY_GENERATED_DEV_DIR)
        if not options.minify_third_party_libs_only:
            generate_build_directory()


if __name__ == '__main__':
    build()
