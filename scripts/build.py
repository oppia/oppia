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

    return filepaths


def build_minified_third_party_libs():
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


def build_third_party_libs():
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


def copy_files_source_to_target(source, target, file_hashes):
    """Copies all files in source directory to target directory and renames
    them to include hash in their name.

    Args:
        source: str. Path relative to /oppia directory of directory
            containing files and directories to be copied.
        target: str. Path relative to /oppia directory of directory where
            to copy the files and directories.
        file_hashes: dict(str, str). Dictionary of file hashes.
    """
    print 'Processing %s' % os.path.join(os.getcwd(), source)
    print 'Copying into %s' % os.path.join(os.getcwd(), target)

    ensure_directory_exists(target)
    shutil.rmtree(target)
    for root, dirs, files in os.walk(os.path.join(os.getcwd(), source)):
        for directory in dirs:
            print 'Processing %s' % os.path.join(root, directory)

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
            shutil.copyfile(source_path, target_path)


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

    with open(target_filepath, 'w') as f:
        f.write(get_hashes_json_file_contents(file_hashes))

    file_hash = generate_md5_hash(target_filepath)
    relative_filepath = os.path.relpath(
        target_filepath, os.path.join(os.path.curdir, 'build', 'assets'))
    filepath_with_hash = _insert_hash(target_filepath, file_hash)
    os.rename(target_filepath, filepath_with_hash)
    file_hashes[relative_filepath] = file_hash


def minify_func(source_path, target_path, file_hashes, filename):
    if filename.endswith('.html'):
        process_html(source_path, target_path, file_hashes)
    elif filename.endswith('.css'):
        _minify(source_path, target_path)
    elif filename.endswith('.js'):
        _minify(source_path, target_path)
    else:
        shutil.copyfile(source_path, target_path)


def _execute_tasks(tasks, batch_size=24):
    """Starts all tasks and checks the results.

    Runs no more than 'batch_size' tasks at a time.
    """
    remaining_tasks = list(tasks)
    currently_running_tasks = []

    while remaining_tasks or currently_running_tasks:
        if currently_running_tasks:
            for task in list(currently_running_tasks):
                if not task.is_alive():
                    currently_running_tasks.remove(task)

        while remaining_tasks and len(currently_running_tasks) < batch_size:
            task = remaining_tasks.pop()
            currently_running_tasks.append(task)
            task.start()


def build_files(source, target, file_hashes):
    """Minifies all CSS and JS files, removes whitespace from HTML and
    interpolates paths in HTML to include hashes in source
    directory and copies it to target.

    Args:
        source: str. Path relative to /oppia directory of directory
            containing files and directories to be copied.
        target: str. Path relative to /oppia directory of directory where
            to copy the files and directories.
        file_hashes: dict(str, str). Dictionary of file hashes.
    """
    print 'Processing %s' % os.path.join(os.getcwd(), source)
    print 'Generating into %s' % os.path.join(os.getcwd(), target)
    ensure_directory_exists(target)
    shutil.rmtree(target)

    for root, dirs, files in os.walk(os.path.join(os.getcwd(), source)):
        tasks = []
        for directory in dirs:
            print 'Processing %s' % os.path.join(root, directory)
        for filename in files:
            source_path = os.path.join(root, filename)
            if target in source_path:
                continue
            if source not in source_path:
                continue
            target_path = source_path.replace(source, target)
            ensure_directory_exists(target_path)

            task = threading.Thread(
                target=minify_func,
                args=(source_path, target_path, file_hashes, filename))
            tasks.append(task)
        try:
            _execute_tasks(tasks)
        except Exception as e:
            print e


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

    # Create hashes for assets, copy directories and files to build/assets.
    hashes.update(get_file_hashes(ASSETS_DEV_DIR))
    copy_files_source_to_target(ASSETS_DEV_DIR, ASSETS_OUT_DIR, hashes)

    # Process third_party resources, create hashes for them and copy them into
    # build/third_party/generated.
    build_minified_third_party_libs()
    hashes.update(get_file_hashes(THIRD_PARTY_GENERATED_STAGING_DIR))
    copy_files_source_to_target(
        THIRD_PARTY_GENERATED_STAGING_DIR,
        THIRD_PARTY_GENERATED_OUT_DIR, hashes)

    # Minify extension static resources, create hashes for them and copy them
    # into build/extensions.
    hashes.update(get_file_hashes(EXTENSIONS_DEV_DIR))
    build_files(EXTENSIONS_DEV_DIR, EXTENSIONS_STAGING_DIR, hashes)
    copy_files_source_to_target(
        EXTENSIONS_STAGING_DIR, EXTENSIONS_OUT_DIR, hashes)

    # Create hashes for all template files.
    hashes.update(get_file_hashes(TEMPLATES_DEV_DIR_CORE))

    # Save hashes as JSON and write the JSON into JS file
    # to make the hashes available to the frontend.
    save_hashes_as_json(HASHES_JSON, hashes)

    # Minify all template files copy them into build/templates/head.
    build_files(TEMPLATES_DEV_DIR_CORE, TEMPLATES_STAGING_DIR, hashes)
    copy_files_source_to_target(
        TEMPLATES_STAGING_DIR, TEMPLATES_OUT_DIR, hashes)

    print 'Build completed.'


def build():
    parser = optparse.OptionParser()
    parser.add_option(
        '--prod_env', action='store_true', default=False, dest='prod_mode')
    options = parser.parse_args()[0]

    if options.prod_mode:
        generate_build_directory()
    else:
        build_third_party_libs()


if __name__ == '__main__':
    build()
