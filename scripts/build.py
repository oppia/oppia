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
THIRD_PARTY_GENERATED_STAGING_DIR = os.path.join(
    'backend_prod_files', 'third_party', 'generated', '')
THIRD_PARTY_GENERATED_OUT_DIR = os.path.join(
    'build', 'third_party', 'generated', '')

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
HASHES_JSON = os.path.join(ASSETS_DEV_DIR, HASHES_JS_FILENAME)
MANIFEST_FILE_PATH = os.path.join('manifest.json')

REMOVE_WS = re.compile(r'\s{2,}').sub
YUICOMPRESSOR_DIR = os.path.join(
    '..', 'oppia_tools', 'yuicompressor-2.4.8', 'yuicompressor-2.4.8.jar')
PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
NODE_FILE = os.path.join(
    PARENT_DIR, 'oppia_tools', 'node-6.9.1', 'bin', 'node')
UGLIFY_FILE = os.path.join(
    PARENT_DIR, 'node_modules', 'uglify-js', 'bin', 'uglifyjs')

# Files with this extension shouldn't be moved to build directory.
FILE_EXTENSIONS_TO_IGNORE = ('.py', '.pyc',)

# Files with this paths should be moved to build directory but shouldn't be
# renamed (i.e. the filepath shouldn't contain hash)
# This is because these files are referenced from third party files or don't
# need cache invalidation.
FILEPATHS_NOT_TO_RENAME = (
    'backend_prod_files/third_party/generated/fonts/*',
    'backend_prod_files/third_party/generated/js/third_party.min.js.map',
    'backend_prod_files/third_party/generated/css/third_party.min.css.map')

# Hashes for files with these paths should be provided to the frontend in
# JS hashes object.
FILEPATHS_PROVIDED_TO_FRONTEND = (
    'images/*', 'i18n/*', '*_directive.html', '*.png', '*.json')

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
    """Minifies and generates source map for a JS file.

    Args:
        source_path: str. Path to JS file to minify.
        target_file_path: str. Path to location of the minified file.
    """
    print 'Minifying and creating sourcemap for %s' % source_path
    ensure_directory_exists(target_file_path)
    source_map_properties = 'includeSources,url=\'third_party.min.js.map\''
    cmd = '%s %s %s -c -m --source-map %s -o %s ' % (
        NODE_FILE, UGLIFY_FILE, source_path,
        source_map_properties, target_file_path)
    subprocess.check_call(cmd, shell=True)


def _generate_copy_tasks_for_fonts(source_paths, target_path, copy_tasks):
    """Queue up a copy task for each font file.

    Args:
        source_paths: list(str). Paths to fonts.
        target_path: str. Path where the fonts should be copied.
        copy_tasks: deque(Thread). A deque that contains all copy tasks queued
            to be processed.
    """
    for font_path in source_paths:
        copy_task = threading.Thread(
            target=shutil.copy,
            args=(font_path, target_path))
        copy_tasks.append(copy_task)


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


def get_file_count(directory_path):
    """Count total number of file directory, ignoring any files with extensions
    in FILE_EXTENSIONS_TO_IGNORE.

    Args:
        directory_path: str. Directory to be walked.

    Returns:
        int. Total number of files minus ignored files.
    """
    total_file_count = 0
    for _, _, files in os.walk(directory_path):
        for filename in files:
            # Ignore files with certain extensions.
            if not any(
                    filename.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                total_file_count += 1
    return total_file_count


def _compare_file_count(source_path, target_path):
    """Ensure that two dir's file counts match.

    Args:
       source_path: str. Source of staging files.
       target_path: str. Final filepath or built file's directory.

    Raises:
        ValueError: The source directory does not have the same file count as
            the target directory.
    """
    source_dir_file_count = get_file_count(source_path)
    target_dir_file_count = get_file_count(target_path)
    if source_dir_file_count != target_dir_file_count:
        print 'Comparing %s vs %s' % (source_path, target_path)
        raise ValueError(
            '%s files in source dir != %s files in target dir.' % (
                source_dir_file_count, target_dir_file_count))


def _match_filename_with_hashes(filename, file_hashes):
    """Ensure that hashes in filenames match with the hash entries in hash
    dict.

    Args:
        filename: str. Filepath to be matched.
        file_hashes: dict(str, str). Dictionary of file hashes.

    Raises:
        ValueError: The hash dict is empty.
        ValueError: The filename does not contain hash.
        KeyError: The filename's hash cannot be found in the hash dict.
    """
    # Final filepath example: base.240933e7564bd72a4dde42ee23260c5f.html.
    if not file_hashes:
        raise ValueError('Hash dict is empty')
    file_hash = re.findall(r'([a-fA-F\d]{32})', filename)
    # Convert current /build path to /backend_prod_files path.
    if not file_hash:
        raise ValueError('%s is expected to contain hash' % filename)
    if file_hash[0] not in file_hashes.values():
        raise KeyError(
            'Hashed file %s does not match hash dict keys' % filename)


def process_html(source_file_stream, target_file_stream, file_hashes):
    """Remove whitespaces and replace filepath with paths with hashes in the
    HTML file stream object.

    Args:
        source_file_stream: file. A stream object of the HTML file to be
            processed.
        target_file_stream: file. A stream object of the minified HTML
            file.
        file_hashes: dict(str, str). Dictionary of file hashes.
    """
    content = source_file_stream.read()
    for filepath, file_hash in file_hashes.iteritems():
        # We are adding hash in all file paths except for html paths.
        # This is because html paths are used by backend and we work with
        # paths without hash part in backend.
        if filepath.endswith('.html'):
            continue
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
            'js': List of paths to js files that need to be copied.
            'css': List of paths to css files that need to be copied.
            'fontsPath': Path to folder containing fonts that need to be copied.
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
            'js': List of paths to js files that need to be copied.
            'css': List of paths to css files that need to be copied.
            'fontsPath': Path to folder containing fonts that need to be copied.
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
            'js': List of paths to js files that need to be copied.
            'css': List of paths to css files that need to be copied.
            'fontsPath': Path to folder containing fonts that need to be copied.
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
    for root, _, files in os.walk(font_dir):
        for font_file in files:
            font_filepaths.append(os.path.join(root, font_file))
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
    """Minify third_party.js and third_party.css.
    """
    THIRD_PARTY_JS_FILEPATH = os.path.join(
        third_party_directory_path, 'js', 'third_party.js')
    MINIFIED_THIRD_PARTY_JS_FILEPATH = os.path.join(
        third_party_directory_path, 'js', 'third_party.min.js')
    THIRD_PARTY_CSS_FILEPATH = os.path.join(
        third_party_directory_path, 'css', 'third_party.css')
    MINIFIED_THIRD_PARTY_CSS_FILEPATH = os.path.join(
        third_party_directory_path, 'css', 'third_party.min.css')

    _minify_and_create_sourcemap(
        THIRD_PARTY_JS_FILEPATH, MINIFIED_THIRD_PARTY_JS_FILEPATH)
    _minify(THIRD_PARTY_CSS_FILEPATH, MINIFIED_THIRD_PARTY_CSS_FILEPATH)
    # Clean up un-minified third_party.js and third_party.css.
    os.remove(THIRD_PARTY_JS_FILEPATH)
    os.remove(THIRD_PARTY_CSS_FILEPATH)


def build_third_party_libs(third_party_directory_path):
    """Joins all third party css files into single css file and js files into
    single js file. Copies both files and all fonts into third party folder.
    """

    print 'Building third party libs at %s' % third_party_directory_path

    THIRD_PARTY_JS_FILEPATH = os.path.join(
        third_party_directory_path, 'js', 'third_party.js')
    THIRD_PARTY_CSS_FILEPATH = os.path.join(
        third_party_directory_path, 'css', 'third_party.css')
    FONTS_DIR = os.path.join(third_party_directory_path, 'fonts', '')

    dependency_filepaths = get_dependencies_filepaths()
    ensure_directory_exists(THIRD_PARTY_JS_FILEPATH)
    with open(THIRD_PARTY_JS_FILEPATH, 'w+') as third_party_js_file:
        _join_files(dependency_filepaths['js'], third_party_js_file)

    ensure_directory_exists(THIRD_PARTY_CSS_FILEPATH)
    with open(THIRD_PARTY_CSS_FILEPATH, 'w+') as third_party_css_file:
        _join_files(dependency_filepaths['css'], third_party_css_file)

    ensure_directory_exists(FONTS_DIR)
    copy_tasks = collections.deque()
    _generate_copy_tasks_for_fonts(
        dependency_filepaths['fonts'], FONTS_DIR, copy_tasks)
    _execute_tasks(copy_tasks)


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


def generate_copy_tasks_to_copy_from_source_to_target(
        source, target, file_hashes, copy_tasks):
    """Generate copy task for each file in source directory, excluding files
    with extensions in FILE_EXTENSIONS_TO_IGNORE. Insert hash from hash dict
    into the destination filename.

    Args:
        source: str. Path relative to /oppia directory of directory
            containing files and directories to be copied.
        target: str. Path relative to /oppia directory of directory where
            to copy the files and directories.
        file_hashes: dict(str, str). Dictionary of file hashes.
        copy_tasks: deque(Thread). A deque that contains all copy tasks queued
            to be processed.
    """
    print 'Processing %s' % os.path.join(os.getcwd(), source)
    print 'Copying into %s' % os.path.join(os.getcwd(), target)

    ensure_directory_exists(target)
    shutil.rmtree(target)
    for root, dirs, files in os.walk(os.path.join(os.getcwd(), source)):
        for directory in dirs:
            print 'Copying %s' % os.path.join(root, directory)

        for filename in files:
            source_path = os.path.join(root, filename)
            if target in source_path:
                continue
            if source not in source_path:
                continue

            # Ignore files with certain extensions.
            if any(source_path.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                continue

            target_path = source_path
            relative_path = os.path.relpath(source_path, source)
            if hash_should_be_inserted(source + relative_path):
                relative_path = (
                    _insert_hash(relative_path, file_hashes[relative_path]))

            target_path = os.path.join(os.getcwd(), target, relative_path)
            ensure_directory_exists(target_path)
            copy_task = threading.Thread(
                target=shutil.copyfile,
                args=(source_path, target_path))
            copy_tasks.append(copy_task)


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


def get_file_hashes(directory_path):
    """Returns hashes of all files in directory tree.

    Args:
        directory_path: str. Root directory of the tree.

    Returns:
        dict(str, str). Dictionary with keys specifying file paths and values
        specifying file hashes.
    """
    file_hashes = dict()

    print('Computing hashes for files in %s'
          % os.path.join(os.getcwd(), directory_path))

    for root, dirs, files in os.walk(os.path.join(os.getcwd(), directory_path)):
        for directory in dirs:
            print('Computing hashes for files in %s'
                  % os.path.join(root, directory))
        for filename in files:
            filepath = os.path.join(root, filename)
            relative_filepath = os.path.relpath(filepath, directory_path)
            file_hashes[relative_filepath] = generate_md5_hash(filepath)

    return file_hashes


def filter_hashes(file_hashes):
    """Filters hashes that should be provided to the frontend
    and prefixes / in front of the keys.

    Args:
        file_hashes: dict(str, str). Dictionary of file hashes.

    Returns:
        dict(str, str). Filtered dictionary of file hashes.
    """
    filtered_hashes = dict()
    for filepath, file_hash in file_hashes.iteritems():
        if is_file_hash_provided_to_frontend(filepath):
            filtered_hashes['/' + filepath] = file_hash
    return filtered_hashes


def get_hashes_json_file_contents(file_hashes):
    """Return JS code that loads hashes needed for frontend into variable.

    Args:
        file_hashes: dict(str, str). Dictionary of file hashes.

    Returns:
        str. JS code loading hashes as JSON into variable.
    """
    # Only some of the hashes are needed in the frontend.
    filtered_hashes = filter_hashes(file_hashes)

    hashes_json = json.dumps(filtered_hashes)
    return 'var hashes = JSON.parse(\'%s\');' % (hashes_json)


def minify_func(source_path, target_path, file_hashes, filename):
    """Call the appropriate functions to handle different types of file
    formats.
    """
    if filename.endswith('.html'):
        print 'Building %s' % source_path
        with open(source_path, 'r+') as source_html_file:
            with open(target_path, 'w+') as minified_html_file:
                process_html(source_html_file, minified_html_file, file_hashes)
    elif filename.endswith('.css'):
        print 'Minifying %s' % source_path
        _minify(source_path, target_path)
    elif filename.endswith('.js'):
        print 'Minifying %s' % source_path
        _minify(source_path, target_path)
    else:
        print 'Copying %s' % source_path
        shutil.copyfile(source_path, target_path)


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


def build_files(source, target, file_hashes, build_tasks, file_formats=None):
    """If no specific file formats is provided, minifies all CSS and JS files,
    removes whitespace from HTML and interpolates paths in HTML to include
    hashes in source directory and copies it to target.
    If specific file formats is provided, only files pertaining to the provided
    formats will be minified.

    Args:
        source: str. Path relative to /oppia directory of directory
            containing files and directories to be copied.
        target: str. Path relative to /oppia directory of directory where
            to copy the files and directories.
        file_hashes: dict(str, str). Dictionary of file hashes.
        build_tasks: deque(Thread). A deque that contains all build tasks queued
            to be processed.
        file_formats: tuple(str) or None. Tuple of specific file formats to be
            built. If None then all files within the source directory will be
            built.
    """
    print 'Processing %s' % os.path.join(os.getcwd(), source)
    print 'Generating into %s' % os.path.join(os.getcwd(), target)
    ensure_directory_exists(target)
    if file_formats is None:
        print 'Deleting dir %s' % target
        # Only delete BUILD directory when building all files.
        shutil.rmtree(target)

    for root, dirs, files in os.walk(os.path.join(os.getcwd(), source)):
        for directory in dirs:
            print 'Building directory %s' % os.path.join(root, directory)
        for filename in files:
            source_path = os.path.join(root, filename)
            if target in source_path:
                continue
            if source not in source_path:
                continue
            target_path = source_path.replace(source, target)
            ensure_directory_exists(target_path)
            if file_formats is None or any(
                    filename.endswith(p) for p in file_formats):
                task = threading.Thread(
                    target=minify_func,
                    args=(source_path, target_path, file_hashes, filename))
            else:
                # Skip files that are not the specified format.
                continue
            build_tasks.append(task)


def rebuild_new_files(
        source_path, target_path, recently_changed_filenames, file_hashes,
        build_tasks):
    """Minify recently changed files.

    Args:
        source_path: str. Path relative to /oppia directory of directory
            containing files and directories to be copied.
        target_path: str. Path relative to /oppia directory of directory where
            to copy the files and directories.
        recently_changed_filenames: list(str). List of filenames that were
            recently changed.
        file_hashes: dict(str, str). Dictionary of file hashes.
        build_tasks: deque(Thread). A deque that contains all build tasks queued
            to be processed.
    """
    for file_name in recently_changed_filenames:
        source_file_path = os.path.join(source_path, file_name)
        target_file_path = os.path.join(target_path, file_name)
        ensure_directory_exists(target_file_path)
        task = threading.Thread(target=minify_func, args=(
            source_file_path, target_file_path, file_hashes, file_name))
        build_tasks.append(task)


def build_directory(dirnames_dict, file_hashes, build_tasks):
    """Build all files in provided directory if there is no existing staging
    directory. Otherwise, selectively build recently changed files and copy
    newly built files to staging directory.

    Args:
        dirnames_dict: dict(str, str, str). A dict containing directory paths to
            the directory containing source files to be built, the staging
            directory and the final directory containing built files.
        file_hashes: dict(str, str). Dictionary of file hashes.
        build_tasks: deque(Thread). A deque that contains all build tasks queued
            to be processed.
    """
    source_dir = dirnames_dict['dev_dir']
    staging_dir = dirnames_dict['staging_dir']
    out_dir = dirnames_dict['out_dir']
    delete_tasks = collections.deque()
    if not os.path.isdir(staging_dir):
        # If there is no staging dir, perform build process on all files.
        print 'Creating new %s folder' % staging_dir
        build_files(source_dir, staging_dir, file_hashes, build_tasks)
    else:
        # If staging dir exists, rebuild all HTML and Python files.
        mandatory_file_formats = ('.html', '.py')
        print (
            'Staging dir exists, re-building all %s files'
            % str(mandatory_file_formats))
        build_files(
            source_dir, staging_dir, file_hashes, build_tasks,
            file_formats=mandatory_file_formats)
        # Compare source files with already built files using file hashes.
        dev_dir_hashes = get_file_hashes(source_dir)
        print 'Comparing file hashes of %s and %s' % (source_dir, out_dir)
        recently_changed_filenames = get_recently_changed_filenames(
            dev_dir_hashes, out_dir)
        if recently_changed_filenames:
            # Only re-build files that have changed since last build.
            print 'Re-building recently changed files at %s' % source_dir
            rebuild_new_files(
                source_dir, staging_dir, recently_changed_filenames,
                file_hashes, build_tasks)
            # Clean up files in staging directory that have been removed from
            # source directory.
            print 'Scanning directory %s to remove deleted file' % staging_dir
            remove_deleted_files(dev_dir_hashes, staging_dir, delete_tasks)
            _execute_tasks(delete_tasks)
        else:
            print 'No changes detected. Using previously built files.'


def remove_deleted_files(source_dir_hashes, staging_directory, delete_tasks):
    """Walk the staging directory and remove files that are not in the hash dict
    i.e. remaining files in staging directory that have since been deleted from
    source directory.

    Args:
        source_dir_hashes: dict(str, str). Dictionary of file hashes.
        staging_directory: str. Path relative to /oppia directory of directory
            containing files and directories to be walked.
        delete_tasks: deque(Thread). A deque that contains all delete tasks
            queued to be processed.
    """
    print 'Scanning directory %s to remove deleted file' % staging_directory
    for root, dirs, files in os.walk(
            os.path.join(os.getcwd(), staging_directory)):
        for directory in dirs:
            print 'Scanning %s' % os.path.join(root, directory)
        for filename in files:
            target_path = os.path.join(root, filename)
            # Ignore files with certain extensions.
            if any(target_path.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                continue
            relative_path = os.path.relpath(target_path, staging_directory)
            # Remove file found in staging directory but not in source directory
            # , i.e. file not listed in hash dict.
            if relative_path not in source_dir_hashes:
                print ('Unable to find %s in file hashes, deleting file'
                       % relative_path)
                _ensure_files_exist([target_path])
                task = threading.Thread(target=os.remove, args=(target_path))
                delete_tasks.append(task)


def get_recently_changed_filenames(source_dir_hashes, out_dir):
    """Compare hashes of source files and built files. Return a list of
    filenames that were recently changed.

    Args:
        source_dir_hashes: str. dict(str, str). Dictionary of hashes of files
            to be built.
        out_dir: str. Path relative to /oppia where BUILD files are located.

    Returns:
        list(str). List of filenames expected to be re-hashed.
    """
    # Hashes are created based on files' contents and are inserted between
    # the filenames and their extensions,
    # e.g base.240933e7564bd72a4dde42ee23260c5f.html
    # If a file gets edited, a different MD5 hash is generated.
    recently_changed_filenames = []
    # Currently, we do not hash Python files and HTML files are always re-built.
    FILE_EXTENSIONS_NOT_TO_TRACK = ('.html', '.py',)
    for file_name, md5_hash in source_dir_hashes.iteritems():
        # Ignore files with certain extensions.
        if any(file_name.endswith(p) for p in FILE_EXTENSIONS_NOT_TO_TRACK):
            continue
        final_filepath = _insert_hash(
            os.path.join(out_dir, file_name), md5_hash)
        if not os.path.isfile(final_filepath):
            # Filename with provided hash cannot be found, this file has been
            # recently changed or created since last build.
            recently_changed_filenames.append(file_name)
    if recently_changed_filenames:
        print ('The following files will be rebuilt due to recent changes: %s' %
               recently_changed_filenames)
    return recently_changed_filenames


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
    # Process third_party resources, and copy them into staging directory.
    build_third_party_libs(THIRD_PARTY_GENERATED_STAGING_DIR)
    minify_third_party_libs(THIRD_PARTY_GENERATED_STAGING_DIR)

    # Create hashes for all directories and files.
    HASH_DIRS = [
        ASSETS_DEV_DIR, EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir'],
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['dev_dir'],
        THIRD_PARTY_GENERATED_STAGING_DIR]
    for HASH_DIR in HASH_DIRS:
        hashes.update(get_file_hashes(HASH_DIR))
    # Save hashes as JSON and write the JSON into JS file
    # to make the hashes available to the frontend.
    ensure_directory_exists(HASHES_JSON)
    with open(HASHES_JSON, 'w+') as hashes_js_file:
        write_to_file_stream(
            hashes_js_file, get_hashes_json_file_contents(hashes))
    # Update hash dict with newly created hashes.js.
    hashes.update({HASHES_JS_FILENAME: generate_md5_hash(HASHES_JSON)})
    # Make sure /assets/hashes.js is available to the frontend.
    _ensure_files_exist([HASHES_JSON])

    # Build files in /extensions and copy them into staging directory.
    build_directory(EXTENSIONS_DIRNAMES_TO_DIRPATHS, hashes, build_tasks)
    # Minify all template files copy them into build/templates/head.
    build_directory(TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS, hashes, build_tasks)
    _execute_tasks(build_tasks)

    # Copy all files from staging directory to production directory (/build).
    COPY_INPUT_DIRS = [
        ASSETS_DEV_DIR, EXTENSIONS_DIRNAMES_TO_DIRPATHS['staging_dir'],
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['staging_dir'],
        THIRD_PARTY_GENERATED_STAGING_DIR]
    COPY_OUTPUT_DIRS = [
        ASSETS_OUT_DIR, EXTENSIONS_DIRNAMES_TO_DIRPATHS['out_dir'],
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['out_dir'],
        THIRD_PARTY_GENERATED_OUT_DIR]
    assert len(COPY_INPUT_DIRS) == len(COPY_OUTPUT_DIRS)
    for i in xrange(len(COPY_INPUT_DIRS)):
        generate_copy_tasks_to_copy_from_source_to_target(
            COPY_INPUT_DIRS[i], COPY_OUTPUT_DIRS[i], hashes, copy_tasks)
    _execute_tasks(copy_tasks)

    for i in xrange(len(COPY_INPUT_DIRS)):
        # Make sure that all files in source directory and staging directory are
        # accounted for.
        _compare_file_count(COPY_INPUT_DIRS[i], COPY_OUTPUT_DIRS[i])
    # Make sure that hashed file name matches with current hash dict.
    for built_dir in COPY_OUTPUT_DIRS:
        for root, _, files in os.walk(built_dir):
            for filename in files:
                parent_dir = os.path.basename(root)
                converted_filepath = os.path.join(
                    THIRD_PARTY_GENERATED_STAGING_DIR, parent_dir, filename)
                if not hash_should_be_inserted(converted_filepath):
                    # These filenames do not contain hashes.
                    continue
                _match_filename_with_hashes(filename, hashes)
    # Make sure /build/assets/hashes.[HASH].js is available.
    hash_final_filename = _insert_hash(
        HASHES_JS_FILENAME, hashes[HASHES_JS_FILENAME])
    _ensure_files_exist([os.path.join(ASSETS_OUT_DIR, hash_final_filename)])
    # Clean up un-hashed hashes.js.
    os.remove(HASHES_JSON)
    print 'Build completed.'


def build():
    parser = optparse.OptionParser()
    parser.add_option(
        '--prod_env', action='store_true', default=False, dest='prod_mode')
    options = parser.parse_args()[0]

    if options.prod_mode:
        generate_build_directory()
    else:
        build_third_party_libs(THIRD_PARTY_GENERATED_DEV_DIR)


if __name__ == '__main__':
    build()
