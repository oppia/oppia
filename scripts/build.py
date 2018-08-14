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
import glob
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

EXTENSIONS_DEV_DIR = os.path.join('extensions', '')
EXTENSIONS_STAGING_DIR = (
    os.path.join('backend_prod_files', 'extensions', ''))
EXTENSIONS_OUT_DIR = os.path.join('build', 'extensions', '')

TEMPLATES_DEV_DIR = os.path.join('templates', 'dev', 'head', '')
TEMPLATES_DEV_DIR_CORE = os.path.join('core', 'templates', 'dev', 'head', '')
TEMPLATES_STAGING_DIR = (
    os.path.join('backend_prod_files', 'templates', 'head', ''))
TEMPLATES_OUT_DIR = os.path.join('build', 'templates', 'head', '')

HASHES_JSON = os.path.join('build', 'assets', 'hashes.js')
MANIFEST_FILE_PATH = os.path.join('manifest.json')

REMOVE_WS = re.compile(r'\s{2,}').sub
YUICOMPRESSOR_DIR = os.path.join(
    '..', 'oppia_tools', 'yuicompressor-2.4.8', 'yuicompressor-2.4.8.jar')
PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
NODE_FILE = os.path.join(
    PARENT_DIR, 'oppia_tools', 'node-6.9.1', 'bin', 'node')
UGLIFY_FILE = os.path.join(
    PARENT_DIR, 'node_modules', 'uglify-js', 'bin', 'uglifyjs')

FONT_EXTENSIONS = ('*.eot', '*.woff2', '*.ttf', '*.woff', '*.eof', '*.svg')

# Files with this extension shouldn't be moved to build directory.
FILE_EXTENSIONS_TO_IGNORE = ('.py',)

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


def _join_files(source_paths, target_file_path):
    """Writes multiple files into one file.

    Args:
        source_paths: list(str). Paths to files to join together.
        target_file_path: str. Path to location of the joined file.
    """
    ensure_directory_exists(target_file_path)
    with open(target_file_path, 'w+') as target_file:
        for source_path in source_paths:
            with open(source_path, 'r') as source_file:
                target_file.write(source_file.read())


def _minify_and_create_sourcemap(source_paths, target_file_path):
    """Minifies multiple files into one file and generates source map
    for that file.

    Args:
        source_paths: list(str). Paths to files to join and minify.
        target_file_path: str. Path to location of the joined file.
    """
    print 'Joining multiple third party JS files into third_party.js'
    ensure_directory_exists(target_file_path)

    source_map_properties = 'includeSources,url=\'third_party.min.js.map\''
    cmd = '%s %s %s -c -m --source-map %s -o %s ' % (
        NODE_FILE, UGLIFY_FILE, ' '.join(source_paths),
        source_map_properties, target_file_path)
    subprocess.check_call(cmd, shell=True)


def _copy_fonts(source_paths, target_path):
    """Copies fonts at source paths to target path.

    Args:
        source_paths: list(str). Paths to fonts.
        target_path: str. Path where the fonts should be copied.
    """
    ensure_directory_exists(target_path)

    for font_wildcard in source_paths:
        font_paths = glob.glob(font_wildcard)
        for font_path in font_paths:
            shutil.copy(font_path, target_path)


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
        Exception: Raised if one or more of the files does not exist.
    """
    for filepath in filepaths:
        if not os.path.isfile(filepath):
            raise Exception('File %s does not exist.' % filepath)


def _ensure_fonts_exist(filepaths):
    """Ensures that fonts exists at the given filepaths.

    Args:
        filepaths: list(str). Wildcard paths to fonts.

    Raises:
        Exception: Raised if one or more of the files does not exist.
    """
    for font_wildcard in filepaths:
        font_paths = glob.glob(font_wildcard)
        _ensure_files_exist(font_paths)


def get_file_count(directory_path):
    """Count total number of file directory, subtracting ignored files.

    Args:
        directory_path: str. Directory to be walked.

    Returns:
        total_file_count: int. Total number of files minus ignored files.
    """
    total_file_count = 0
    #pylint: disable=unused-variable
    for root, dirs, files in os.walk(directory_path):
        #pylint: enable=unused-variable
        total_file_count += len(files)
        for filename in files:
            # Ignore files with certain extensions.
            if any(filename.endswith(p)
                   for p in FILE_EXTENSIONS_TO_IGNORE):
                total_file_count -= 1
    if directory_path == ASSETS_DEV_DIR:
        # Add 1 to account for the added hashes.js.
        total_file_count += 1
    return total_file_count


def _compare_file_count(source_path, target_path):
    """Ensure that two dir's file counts matches.

    Args:
       source_path: str. Source of staging files.
       target_path: str. Final filepath of built files.
           the processed file.

    Raises:
        Exception: Raised if both dir do not have the same file count.
    """
    source_dir_file_count = get_file_count(source_path)
    target_dir_file_count = get_file_count(target_path)
    if source_dir_file_count != target_dir_file_count:
        raise Exception(
            '%s files in source dir != %s files in target dir.' % (
                source_dir_file_count, target_dir_file_count))


def _match_directory_with_hashes(directory_path, file_hashes):
    """Ensure that filepaths are hashed correctly.

    Args:
       directory_path: str. Directory to be walked.
       file_hashes: dict(str, str). Dictionary of file hashes.

    Raises:
        Exception: Raised if hash dict is empty.
        Exception: Raised if filename's hash does not match hash dict entries.
    """
    # Final filepath example: base.240933e7564bd72a4dde42ee23260c5f.html
    if not file_hashes:
        raise Exception('Hash dict is empty')
    #pylint: disable=unused-variable
    for root, dirs, files in os.walk(directory_path):
        #pylint: enable=unused-variable
        for filename in files:
            file_hash = re.findall(r"([a-fA-F\d]{32})", filename)
            if len(file_hash) == 0:
                # There are filename that do not contain hashes.
                continue # pragma: no cover
            if file_hash[0] not in file_hashes.values():
                raise Exception(
                    'Hashed file %s does not match hash dict keys' % filename)


def process_html(source_path, target_path, file_hashes):
    """Copies contents of HTML file, while removing whitespace and
    replacing paths inside the file with paths with hashes.

    Args:
        source_path: str. Absolute path to file to be processed.
        target_path: str. Absolute path to location where to copy
            the processed file.
        file_hashes: dict(str, str). Dictionary of file hashes.
    """
    f = open(source_path, 'r')
    content = f.read()
    for filepath, file_hash in file_hashes.iteritems():
        # We are adding hash in all file paths except for html paths.
        # This is because html paths are used by backend and we work with paths
        # without hash part in backend.
        if filepath.endswith('.html'):
            continue
        filepath_with_hash = _insert_hash(filepath, file_hash)
        content = content.replace(
            '%s%s' % (TEMPLATES_DEV_DIR, filepath),
            '%s%s' % (TEMPLATES_OUT_DIR, filepath_with_hash))
        content = content.replace(
            '%s%s' % (ASSETS_DEV_DIR, filepath),
            '%s%s' % (ASSETS_OUT_DIR, filepath_with_hash))
        content = content.replace(
            '%s%s' % (EXTENSIONS_DEV_DIR, filepath),
            '%s%s' % (EXTENSIONS_OUT_DIR, filepath_with_hash))
        content = content.replace(
            '%s%s' % (THIRD_PARTY_GENERATED_DEV_DIR, filepath),
            '%s%s' % (THIRD_PARTY_GENERATED_OUT_DIR, filepath_with_hash))
    content = REMOVE_WS(' ', content)
    d = open(target_path, 'w+')
    d.write(content)


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
        return []
    fonts_path = dependency_bundle['fontsPath']
    return [os.path.join(dependency_dir, fonts_path, extension)
            for extension in FONT_EXTENSIONS]


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
    _ensure_fonts_exist(filepaths['fonts'])
    return filepaths


def build_minified_third_party_libs(): # pragma: no cover
    """Joins all third party css files into single css file and js files into
    single js file. Minifies both files. Copies both files and all fonts into
    third party folder.
    """

    print 'Building minified third party libs...'

    third_party_js = os.path.join(
        THIRD_PARTY_GENERATED_STAGING_DIR, 'js', 'third_party.min.js')
    third_party_css = os.path.join(
        THIRD_PARTY_GENERATED_STAGING_DIR, 'css', 'third_party.min.css')
    fonts_dir = os.path.join(THIRD_PARTY_GENERATED_STAGING_DIR, 'fonts', '')

    dependency_filepaths = get_dependencies_filepaths()
    _minify_and_create_sourcemap(dependency_filepaths['js'], third_party_js)
    _join_files(dependency_filepaths['css'], third_party_css)
    _minify(third_party_css, third_party_css)
    _copy_fonts(dependency_filepaths['fonts'], fonts_dir)


def build_third_party_libs(): # pragma: no cover
    """Joins all third party css files into single css file and js files into
    single js file. Copies both files and all fonts into third party folder.
    """

    print 'Building third party libs...'

    third_party_js = os.path.join(
        THIRD_PARTY_GENERATED_DEV_DIR, 'js', 'third_party.js')
    third_party_css = os.path.join(
        THIRD_PARTY_GENERATED_DEV_DIR, 'css', 'third_party.css')
    fonts_dir = os.path.join(THIRD_PARTY_GENERATED_DEV_DIR, 'fonts', '')

    dependency_filepaths = get_dependencies_filepaths()
    _join_files(dependency_filepaths['js'], third_party_js)
    _join_files(dependency_filepaths['css'], third_party_css)
    _copy_fonts(dependency_filepaths['fonts'], fonts_dir)


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


def copy_files_source_to_target(source, target, file_hashes, copy_tasks):
    """Copies all files in source directory to target directory, renames
    them to include hash in their name.

    Args:
        source: str. Path relative to /oppia directory of directory
            containing files and directories to be copied.
        target: str. Path relative to /oppia directory of directory where
            to copy the files and directories.
        file_hashes: dict(str, str). Dictionary of file hashes.
        copy_tasks: deque(obj). A deque that contains all copy tasks queued to
            be processed.
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
                continue # pragma: no cover
            if source not in source_path:
                continue # pragma: no cover

            # Ignore files with certain extensions.
            if any(source_path.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                continue # pragma: no cover

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


def save_hashes_as_json(target_filepath, file_hashes):
    """Save hashes in JS file containing JSON for files that
    are to be interpolated in the frontend.

    Args:
        target_filepath: str. Path relative to /oppia directory defining
            location where to save the JS file with hashes. The final location
            path would also contain hash.
        file_hashes: dict(str, str). Dictionary of file hashes.
    """
    ensure_directory_exists(HASHES_JSON)
    with open(target_filepath, 'w') as f:
        f.write(get_hashes_json_file_contents(file_hashes))

    file_hash = generate_md5_hash(target_filepath)
    relative_filepath = os.path.relpath(
        target_filepath, os.path.join(os.path.curdir, 'build', 'assets'))
    filepath_with_hash = _insert_hash(target_filepath, file_hash)
    os.rename(target_filepath, filepath_with_hash)
    print 'Saving %s as %s' % (relative_filepath, filepath_with_hash)
    file_hashes[relative_filepath] = file_hash


def minify_func(source_path, target_path, file_hashes, filename):
    if filename.endswith('.html'):
        print 'Building %s' % source_path
        process_html(source_path, target_path, file_hashes)
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
            task.start()


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
        build_tasks: Deque(obj). A deque that contains all build tasks queued
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
                continue # pragma: no cover
            if source not in source_path:
                continue # pragma: no cover
            target_path = source_path.replace(source, target)
            ensure_directory_exists(target_path)
            if file_formats is None or any(
                    filename.endswith(p) for p in file_formats):
                task = threading.Thread(
                    target=minify_func,
                    args=(source_path, target_path, file_hashes, filename))
            else:
                # Skip files that are not the specified format.
                continue # pragma: no cover
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
        build_tasks: Deque(obj). A deque that contains all build tasks queued
            to be processed.
    """
    for file_name in recently_changed_filenames:
        source_file_path = os.path.join(source_path, file_name)
        target_file_path = os.path.join(target_path, file_name)
        ensure_directory_exists(target_file_path)
        task = threading.Thread(target=minify_func, args=(
            source_file_path, target_file_path, file_hashes, file_name))
        build_tasks.append(task)


def build_template_directory(file_hashes, build_tasks): # pragma: no cover
    """Build all files in TEMPLATES_DEV_DIR_CORE if there is no existing staging
    dir. Otherwise, selectively build recently changed files in
    TEMPLATES_DEV_DIR_CORE and copy to staging dir.

    Args:
        file_hashes: dict(str, str). Dictionary of file hashes.
        build_tasks: Deque(obj). A deque that contains all build tasks queued
            to be processed.
    """
    if not os.path.isdir(TEMPLATES_STAGING_DIR):
        # If there is no staging dir, perform build process on all files.
        print 'Creating new %s folder' % TEMPLATES_STAGING_DIR
        build_files(
            TEMPLATES_DEV_DIR_CORE, TEMPLATES_STAGING_DIR,
            file_hashes, build_tasks)
    else:
        # If there is an existing staging dir, rebuild all HTML files.
        print 'Staging directory exists, re-building all HTML files'
        build_files(
            TEMPLATES_DEV_DIR_CORE, TEMPLATES_STAGING_DIR, file_hashes,
            build_tasks,
            file_formats=('.html',))
        recently_changed_filenames = get_recently_changed_filenames(
            TEMPLATES_DEV_DIR_CORE, TEMPLATES_OUT_DIR)
        if recently_changed_filenames:
            # Only re-build files that have changed since last build.
            print ("Re-building recently changed files at %s"
                   % TEMPLATES_DEV_DIR_CORE)
            rebuild_new_files(
                TEMPLATES_DEV_DIR_CORE, TEMPLATES_STAGING_DIR,
                recently_changed_filenames, file_hashes, build_tasks)
            # Clean up files in staging dir that have been removed in DEV dir.
            remove_deleted_files(TEMPLATES_DEV_DIR_CORE, TEMPLATES_STAGING_DIR)
        else:
            print 'No changes detected. Using previously built files.'


def remove_deleted_files(dev_directory, staging_directory):
    """Walk the staging directory and remove files that have since been removed
    from the DEV directory.

    Args:
        dev_directory: str. Path relative to /oppia where DEV files are located.
        staging_directory: str. Path relative to /oppia directory of directory
            containing files and directories to be walked.
    """
    file_hashes = get_file_hashes(dev_directory)
    print 'Scanning directory %s to remove deleted file' % staging_directory
    for root, dirs, files in os.walk(
            os.path.join(os.getcwd(), staging_directory)):
        for directory in dirs:
            print 'Scanning %s' % os.path.join(root, directory)
        for filename in files:
            target_path = os.path.join(root, filename)
            # Ignore files with certain extensions.
            if any(target_path.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                continue # pragma: no cover
            relative_path = os.path.relpath(target_path, staging_directory)
            # Remove file found in staging dir but not in /DEV, i.e.
            # file not listed in hash dict.
            if relative_path not in file_hashes:
                print ('Unable to find %s in file hashes, deleting file'
                       % relative_path)
                os.remove(target_path)


def get_recently_changed_filenames(dev_dir, out_dir):
    """Compare hashes of DEV files and BUILD files. Return a list of filenames
    that were recently changed.

    Args:
        dev_dir: str. Path relative to /oppia where DEV files are located.
        out_dir: str. Path relative to /oppia where BUILD files are located.

    Returns:
        list(str). List of filenames expected to be re-hashed.
    """
    # Hashes are created based on files' contents and are inserted between
    # the filenames and their extensions,
    # e.g base.240933e7564bd72a4dde42ee23260c5f.html
    # Should a file gets edited, a different MD5 hash is generated.
    file_hashes = get_file_hashes(dev_dir)
    recently_changed_filenames = []
    # Currently, we do not hash Python files and HTML files are always re-built.
    FILE_EXTENSIONS_NOT_TO_TRACK = ('.html', '.py',)
    print "Comparing file hashes of %s and %s" % (dev_dir, out_dir)
    for file_name, md5_hash in file_hashes.iteritems():
        # Ignore files with certain extensions.
        if any(file_name.endswith(p) for p in FILE_EXTENSIONS_NOT_TO_TRACK):
            continue # pragma: no cover
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


def generate_build_directory(): # pragma: no cover
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
    build_minified_third_party_libs()

    # Create hashes for all directories and files.
    HASH_DIRS = [
        ASSETS_DEV_DIR, EXTENSIONS_DEV_DIR, TEMPLATES_DEV_DIR_CORE,
        THIRD_PARTY_GENERATED_STAGING_DIR]
    for HASH_DIR in HASH_DIRS:
        hashes.update(get_file_hashes(HASH_DIR))
    # Save hashes as JSON and write the JSON into JS file
    # to make the hashes available to the frontend.
    save_hashes_as_json(HASHES_JSON, hashes)

    # Build files in /extensions and copy them into staging directory.
    build_files(
        EXTENSIONS_DEV_DIR, EXTENSIONS_STAGING_DIR, hashes, build_tasks)
    # Minify all template files copy them into build/templates/head.
    build_template_directory(hashes, build_tasks)
    # Execute all build tasks.
    try:
        _execute_tasks(build_tasks)
    except Exception as e:
        print e

    # Copy alls files from staging directory to production directory (/build).
    COPY_INPUT_DIRS = [
        ASSETS_DEV_DIR, EXTENSIONS_STAGING_DIR, TEMPLATES_STAGING_DIR,
        THIRD_PARTY_GENERATED_STAGING_DIR]
    COPY_OUTPUT_DIRS = [
        ASSETS_OUT_DIR, EXTENSIONS_OUT_DIR, TEMPLATES_OUT_DIR,
        THIRD_PARTY_GENERATED_OUT_DIR]
    assert len(COPY_INPUT_DIRS) == len(COPY_OUTPUT_DIRS)
    for i in xrange(len(COPY_INPUT_DIRS)):
        copy_files_source_to_target(
            COPY_INPUT_DIRS[i], COPY_OUTPUT_DIRS[i], hashes, copy_tasks)
    # Execute all copy tasks.
    try:
        _execute_tasks(copy_tasks)
    except Exception as e:
        print e

    # Save hashes as JSON again due to deletion by copy functions.
    save_hashes_as_json(HASHES_JSON, hashes)

    for i in xrange(len(COPY_INPUT_DIRS)):
        # Make sure that all files in /DEV and staging dir are accounted for.
        _compare_file_count(COPY_INPUT_DIRS[i], COPY_OUTPUT_DIRS[i])
        # Make sure that hashed file name matches with current hash dict.
        _match_directory_with_hashes(COPY_OUTPUT_DIRS[i], hashes)

    # Make sure hashes.js is available.
    hash_final_file_path = _insert_hash(HASHES_JSON, hashes['hashes.js'])
    _ensure_files_exist([hash_final_file_path])

    print 'Build completed.'


def build(): # pragma: no cover
    parser = optparse.OptionParser()
    parser.add_option(
        '--prod_env', action='store_true', default=False, dest='prod_mode')
    options = parser.parse_args()[0]

    if options.prod_mode:
        generate_build_directory()
    else:
        build_third_party_libs()


if __name__ == '__main__':
    build() # pragma: no cover
