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

from __future__ import annotations

import argparse
import collections
import fnmatch
import hashlib
import json
import os
import re
import shutil
import subprocess
import threading

# TODO(#15567): The order can be fixed after Literal in utils.py is loaded
# from typing instead of typing_extensions, this will be possible after
# we migrate to Python 3.8.
from scripts import common # isort:skip pylint: disable=wrong-import-position
from core import utils # isort:skip pylint: disable=wrong-import-position
from scripts import servers # isort:skip pylint: disable=wrong-import-position

from typing import ( # isort:skip pylint: disable=wrong-import-position
    Deque, Dict, List, Optional, Sequence, TextIO, Tuple, TypedDict)

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

WEBFONTS_RELATIVE_DIRECTORY_PATH = os.path.join('webfonts', '')

EXTENSIONS_DIRNAMES_TO_DIRPATHS = {
    'dev_dir': os.path.join('extensions', ''),
    'staging_dir': os.path.join('backend_prod_files', 'extensions', ''),
    'out_dir': os.path.join('build', 'extensions', '')
}
TEMPLATES_DEV_DIR = os.path.join('templates', '')
TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS = {
    'dev_dir': os.path.join('core', 'templates', ''),
    'staging_dir': os.path.join('backend_prod_files', 'templates', ''),
    'out_dir': os.path.join('build', 'templates', '')
}
WEBPACK_DIRNAMES_TO_DIRPATHS = {
    'staging_dir': os.path.join('backend_prod_files', 'webpack_bundles', ''),
    'out_dir': os.path.join('build', 'webpack_bundles', '')
}

# This json file contains a json object. The object's keys are file paths and
# the values are corresponded hash value. The paths need to be in posix style,
# as it is interpreted by the `url-interpolation` service, which which
# interprets the paths in this file as URLs.
HASHES_JSON_FILENAME = 'hashes.json'
HASHES_JSON_FILEPATH = os.path.join('assets', HASHES_JSON_FILENAME)
DEPENDENCIES_FILE_PATH = os.path.join('dependencies.json')

REMOVE_WS = re.compile(r'\s{2,}').sub

YUICOMPRESSOR_DIR = os.path.join(
    os.pardir, 'oppia_tools', 'yuicompressor-2.4.8', 'yuicompressor-2.4.8.jar')
PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
UGLIFY_FILE = os.path.join('node_modules', 'uglify-js', 'bin', 'uglifyjs')
WEBPACK_FILE = os.path.join('node_modules', 'webpack', 'bin', 'webpack.js')
WEBPACK_DEV_CONFIG = 'webpack.dev.config.ts'
WEBPACK_DEV_SOURCE_MAPS_CONFIG = 'webpack.dev.sourcemap.config.ts'
WEBPACK_PROD_CONFIG = 'webpack.prod.config.ts'
WEBPACK_PROD_SOURCE_MAPS_CONFIG = 'webpack.prod.sourcemap.config.ts'

# Files with these extensions shouldn't be moved to build directory.
FILE_EXTENSIONS_TO_IGNORE = ('.py', '.pyc', '.stylelintrc', '.ts', '.gitkeep')
# Files with these name patterns shouldn't be moved to build directory, and will
# not be served in production. (This includes webdriverio.js
# files in /extensions.)
JS_FILENAME_SUFFIXES_TO_IGNORE = ('Spec.js', 'webdriverio.js')
JS_FILENAME_SUFFIXES_NOT_TO_MINIFY = ('.bundle.js',)
GENERAL_FILENAMES_TO_IGNORE = ('.pyc', '.stylelintrc', '.DS_Store')

JS_FILEPATHS_NOT_TO_BUILD = (
    os.path.join(
        'core', 'templates', 'expressions', 'parser.js'),
    os.path.join('extensions', 'ckeditor_plugins', 'pre', 'plugin.js')
)

# These filepaths shouldn't be renamed (i.e. the filepath shouldn't contain
# hash).
# This is because these files don't need cache invalidation, are referenced
# from third party files or should not be moved to the build directory.
# Statically served pages from app.yaml should be here to since they don't
# need cache invalidation.
FILEPATHS_NOT_TO_RENAME = (
    '*.py',
    'third_party/generated/js/third_party.min.js.map',
    'third_party/generated/webfonts/*',
    '*.bundle.js',
    '*.bundle.js.map',
    'webpack_bundles/*',
)

# These are the env vars that need to be removed from app.yaml when we are
# deploying to production.
ENV_VARS_TO_REMOVE_FROM_DEPLOYED_APP_YAML = (
    'FIREBASE_AUTH_EMULATOR_HOST',
    'DATASTORE_DATASET',
    'DATASTORE_EMULATOR_HOST',
    'DATASTORE_EMULATOR_HOST_PATH',
    'DATASTORE_HOST',
    'DATASTORE_PROJECT_ID',
    'DATASTORE_USE_PROJECT_ID_AS_APP_ID'
)

# Hashes for files with these paths should be provided to the frontend in
# JS hashes object.
FILEPATHS_PROVIDED_TO_FRONTEND = (
    'images/*', 'videos/*', 'i18n/*', '*.component.html',
    '*_directive.html', '*.directive.html', 'audio/*',
    '*.template.html', '*.png', '*.json', '*.webp')

HASH_BLOCK_SIZE = 2**20

APP_DEV_YAML_FILEPATH = 'app_dev.yaml'
APP_YAML_FILEPATH = 'app.yaml'

MAX_OLD_SPACE_SIZE_FOR_WEBPACK_BUILD = 8192

_PARSER = argparse.ArgumentParser(
    description="""
Creates a third-party directory where all the JS and CSS dependencies are
built and stored. Depending on the options passed to the script, might also
minify third-party libraries and/or generate a build directory.
""")

_PARSER.add_argument(
    '--prod_env', action='store_true', default=False, dest='prod_env')
_PARSER.add_argument(
    '--deploy_mode', action='store_true', default=False, dest='deploy_mode')
_PARSER.add_argument(
    '--minify_third_party_libs_only', action='store_true', default=False,
    dest='minify_third_party_libs_only')
_PARSER.add_argument(
    '--maintenance_mode',
    action='store_true',
    default=False,
    dest='maintenance_mode',
    help=(
        'Enable maintenance mode, '
        'meaning that only super admins can access the site.'
    )
)
_PARSER.add_argument(
    '--source_maps',
    action='store_true',
    default=False,
    dest='source_maps',
    help='Build webpack with source maps.')


class DependencyBundleDict(TypedDict):
    """Dictionary that represents dependency bundle."""

    js: List[str]
    css: List[str]
    fontsPath: str


def generate_app_yaml(deploy_mode: bool = False) -> None:
    """Generate app.yaml from app_dev.yaml.

    Args:
        deploy_mode: bool. Whether the script is being called from deploy
            script.

    Raises:
        Exception. Environment variable to be removed does not exist.
    """
    content = '# THIS FILE IS AUTOGENERATED, DO NOT MODIFY\n'
    with utils.open_file(APP_DEV_YAML_FILEPATH, 'r') as yaml_file:
        content += yaml_file.read()

    if deploy_mode:
        # The version: default line is required to run jobs on a local server (
        # both in prod & non-prod env). This line is not required when app.yaml
        # is generated during deployment. So, we remove this if the build
        # process is being run from the deploy script.
        content = content.replace('version: default', '')
        # The FIREBASE_AUTH_EMULATOR_HOST environment variable is only needed to
        # test locally, and MUST NOT be included in the deployed file.
        for env_variable in ENV_VARS_TO_REMOVE_FROM_DEPLOYED_APP_YAML:
            if env_variable not in content:
                raise Exception(
                    'Environment variable \'%s\' to be '
                    'removed does not exist.' % env_variable
                )
            content = re.sub('  %s: ".*"\n' % env_variable, '', content)
    if os.path.isfile(APP_YAML_FILEPATH):
        os.remove(APP_YAML_FILEPATH)
    with utils.open_file(APP_YAML_FILEPATH, 'w+') as prod_yaml_file:
        prod_yaml_file.write(content)


def modify_constants(
    prod_env: bool = False,
    emulator_mode: bool = True,
    maintenance_mode: bool = False
) -> None:
    """Modify constants.ts and feconf.py.

    Args:
        prod_env: bool. Whether the server is started in prod mode.
        emulator_mode: bool. Whether the server is started in emulator mode.
        maintenance_mode: bool. Whether the site should be put into
            the maintenance mode.
    """
    dev_mode_variable = (
        '"DEV_MODE": false' if prod_env else '"DEV_MODE": true')
    common.inplace_replace_file(
        common.CONSTANTS_FILE_PATH,
        r'"DEV_MODE": (true|false)',
        dev_mode_variable,
        expected_number_of_replacements=1
    )
    emulator_mode_variable = (
        '"EMULATOR_MODE": true' if emulator_mode else '"EMULATOR_MODE": false')
    common.inplace_replace_file(
        common.CONSTANTS_FILE_PATH,
        r'"EMULATOR_MODE": (true|false)',
        emulator_mode_variable,
        expected_number_of_replacements=1
    )

    enable_maintenance_mode_variable = (
        'ENABLE_MAINTENANCE_MODE = %s' % str(maintenance_mode))
    common.inplace_replace_file(
        common.FECONF_PATH,
        r'ENABLE_MAINTENANCE_MODE = (True|False)',
        enable_maintenance_mode_variable,
        expected_number_of_replacements=1
    )


def set_constants_to_default() -> None:
    """Set variables in constants.ts and feconf.py to default values."""
    modify_constants(prod_env=False, emulator_mode=True, maintenance_mode=False)


def _minify(source_path: str, target_path: str) -> None:
    """Runs the given file through a minifier and outputs it to target_path.

    Args:
        source_path: str. Absolute path to file to be minified.
        target_path: str. Absolute path to location where to copy
            the minified file.
    """
    # The -Xmxn argument is an attempt to limit the max memory used when the
    # minification process is running on CircleCI. Note that, from local
    # experiments, 18m seems to work, but 12m is too small and results in an
    # out-of-memory error.
    # https://circleci.com/blog/how-to-handle-java-oom-errors/
    # Use relative path to avoid java command line parameter parse error on
    # Windows. Convert to posix style path because the java program requires
    # the filepath arguments to be in posix path style.
    target_path = common.convert_to_posixpath(
        os.path.relpath(target_path))
    source_path = common.convert_to_posixpath(
        os.path.relpath(source_path))
    yuicompressor_dir = common.convert_to_posixpath(YUICOMPRESSOR_DIR)
    cmd = 'java -Xmx24m -jar %s -o %s %s' % (
        yuicompressor_dir, target_path, source_path)
    subprocess.check_call(cmd, shell=True)


def write_to_file_stream(file_stream: TextIO, content: str) -> None:
    """Write to a file object using provided content.

    Args:
        file_stream: file. A stream handling object to do write operation on.
        content: str. String content to write to file object.
    """
    file_stream.write(str(content))


def _join_files(
    source_paths: List[str], target_file_stream: TextIO
) -> None:
    """Writes multiple files into one file.

    Args:
        source_paths: list(str). Paths to files to join together.
        target_file_stream: file. A stream object of target file.
    """
    for source_path in source_paths:
        with utils.open_file(source_path, 'r') as source_file:
            write_to_file_stream(target_file_stream, source_file.read())


def _minify_and_create_sourcemap(
    source_path: str, target_file_path: str
) -> None:
    """Minifies and generates source map for a JS file. This function is only
    meant to be used with third_party.min.js.

    Args:
        source_path: str. Path to JS file to minify.
        target_file_path: str. Path to location of the minified file.
    """
    print('Minifying and creating sourcemap for %s' % source_path)
    source_map_properties = 'includeSources,url=\'third_party.min.js.map\''
    cmd = '%s %s %s -c -m --source-map %s -o %s ' % (
        common.NODE_BIN_PATH, UGLIFY_FILE, source_path,
        source_map_properties, target_file_path)
    subprocess.check_call(cmd, shell=True)


def _generate_copy_tasks_for_fonts(
    source_paths: List[str], target_path: str
) -> Deque[threading.Thread]:
    """Queue up a copy task for each font file.

    Args:
        source_paths: list(str). Paths to fonts.
        target_path: str. Path where the fonts should be copied.

    Returns:
        deque(Thread). A deque that contains all copy tasks queued to be
        processed.
    """
    copy_tasks: Deque[threading.Thread] = collections.deque()
    for font_path in source_paths:
        copy_task = threading.Thread(
            target=shutil.copy,
            args=(font_path, target_path,))
        copy_tasks.append(copy_task)
    return copy_tasks


def _insert_hash(filepath: str, file_hash: str) -> str:
    """Inserts hash into filepath before the file extension.

    Args:
        filepath: str. Path where the hash should be inserted.
        file_hash: str. Hash to be inserted into the path.

    Returns:
        str. Filepath with hash inserted.
    """
    filepath, file_extension = os.path.splitext(filepath)
    return '%s.%s%s' % (filepath, file_hash, file_extension)


def ensure_directory_exists(filepath: str) -> None:
    """Ensures if directory tree exists, if not creates the directories.

    Args:
        filepath: str. Path to file located in directory that we want to ensure
            exists.
    """
    directory = os.path.dirname(filepath)
    if not os.path.exists(directory):
        os.makedirs(directory)


def safe_delete_directory_tree(directory_path: str) -> None:
    """Recursively delete a directory tree. If directory tree does not exist,
    create the directories first then delete the directory tree.

    Args:
        directory_path: str. Directory path to be deleted.
    """
    ensure_directory_exists(directory_path)
    shutil.rmtree(directory_path)


def _ensure_files_exist(filepaths: List[str]) -> None:
    """Ensures that files exist at the given filepaths.

    Args:
        filepaths: list(str). Paths to files that we want to ensure exist.

    Raises:
        OSError. One or more of the files does not exist.
    """
    for filepath in filepaths:
        if not os.path.isfile(filepath):
            raise OSError('File %s does not exist.' % filepath)


def safe_copy_file(source_filepath: str, target_filepath: str) -> None:
    """Copy a file (no metadata) after ensuring the file exists at the given
    source filepath.
    NOTE: shutil.copyfile does not accept directory path as arguments.

    Args:
        source_filepath: str. Path to source file that we want to copy from.
        target_filepath: str. Path to target file that we want to copy to.
    """
    _ensure_files_exist([source_filepath])
    shutil.copyfile(source_filepath, target_filepath)


def safe_delete_file(filepath: str) -> None:
    """Delete a file after ensuring the provided file actually exists.

    Args:
        filepath: str. Filepath to be deleted.
    """
    _ensure_files_exist([filepath])
    os.remove(filepath)


def get_file_count(directory_path: str) -> int:
    """Count total number of file in the given directory, ignoring any files
    with extensions in FILE_EXTENSIONS_TO_IGNORE or files that should not be
    built.

    Args:
        directory_path: str. Directory to be walked.

    Returns:
        int. Total number of files minus ignored files.
    """
    total_file_count = 0
    for root, _, filenames in os.walk(directory_path):
        for filename in filenames:
            # Ignore files with certain extensions.
            filepath = os.path.join(root, filename)
            if should_file_be_built(filepath) and not any(
                    filename.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                total_file_count += 1
    return total_file_count


def _compare_file_count(
    first_dir_list: List[str], second_dir_list: List[str]
) -> None:
    """Ensure that the total count of files in all directories in the first
    list matches the count of files in all the directories in the second list.

    Args:
        first_dir_list: list(str). List of directories to compare.
        second_dir_list: list(str). List of directories to compare.

    Raises:
        ValueError. The source directory list does not have the same file
            count as the target directory list.
    """

    file_counts = [0, 0]
    for first_dir_path in first_dir_list:
        file_counts[0] += get_file_count(first_dir_path)
    for second_dir_path in second_dir_list:
        file_counts[1] += get_file_count(second_dir_path)
    if file_counts[0] != file_counts[1]:
        print('Comparing %s vs %s' % (first_dir_list, second_dir_list))
        raise ValueError(
            '%s files in first dir list != %s files in second dir list' % (
                file_counts[0], file_counts[1]))


def process_html(
    source_file_stream: TextIO, target_file_stream: TextIO
) -> None:
    """Remove whitespaces and add hashes to filepaths in the HTML file stream
    object.

    Args:
        source_file_stream: file. The stream object of the HTML file to be
            read from.
        target_file_stream: file. The stream object to write the minified HTML
            file to.
    """
    write_to_file_stream(
        target_file_stream, REMOVE_WS(' ', source_file_stream.read()))


def get_dependency_directory(dependency: Dict[str, str]) -> str:
    """Get dependency directory from dependency dictionary.

    Args:
        dependency: dict(str, str). Dictionary representing single dependency
            from dependencies.json.

    Returns:
        str. Dependency directory.
    """
    if 'targetDir' in dependency:
        dependency_dir = dependency['targetDir']
    else:
        dependency_dir = dependency['targetDirPrefix'] + dependency['version']
    return os.path.join(THIRD_PARTY_STATIC_DIR, dependency_dir)


def get_css_filepaths(
    dependency_bundle: DependencyBundleDict, dependency_dir: str
) -> List[str]:
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


def get_js_filepaths(
    dependency_bundle: DependencyBundleDict, dependency_dir: str
) -> List[str]:
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


def get_font_filepaths(
    dependency_bundle: DependencyBundleDict, dependency_dir: str
) -> List[str]:
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
        # Skip dependency bundles in dependencies.json that do not have
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


def get_dependencies_filepaths() -> Dict[str, List[str]]:
    """Extracts dependencies filepaths from dependencies.json file into
    a dictionary.

    Returns:
        dict(str, list(str)). A dict mapping file types to lists of filepaths.
        The dict has three keys: 'js', 'css' and 'fonts'. Each of the
        corresponding values is a full list of dependency file paths of the
        given type.
    """
    filepaths: Dict[str, List[str]] = {
        'js': [],
        'css': [],
        'fonts': []
    }
    with utils.open_file(DEPENDENCIES_FILE_PATH, 'r') as json_file:
        dependencies_json = json.loads(
            json_file.read(), object_pairs_hook=collections.OrderedDict)
    frontend_dependencies = dependencies_json['dependencies']['frontend']
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


def minify_third_party_libs(third_party_directory_path: str) -> None:
    """Minify third_party.js and third_party.css and remove un-minified
    files.
    """
    third_party_js_filepath = os.path.join(
        third_party_directory_path, THIRD_PARTY_JS_RELATIVE_FILEPATH)
    third_party_css_filepath = os.path.join(
        third_party_directory_path, THIRD_PARTY_CSS_RELATIVE_FILEPATH)

    minified_third_party_js_filepath = os.path.join(
        third_party_directory_path, MINIFIED_THIRD_PARTY_JS_RELATIVE_FILEPATH)
    minified_third_party_css_filepath = os.path.join(
        third_party_directory_path, MINIFIED_THIRD_PARTY_CSS_RELATIVE_FILEPATH)

    _minify_and_create_sourcemap(
        third_party_js_filepath, minified_third_party_js_filepath)
    _minify(third_party_css_filepath, minified_third_party_css_filepath)
    # Clean up un-minified third_party.js and third_party.css.
    safe_delete_file(third_party_js_filepath)
    safe_delete_file(third_party_css_filepath)


def build_third_party_libs(third_party_directory_path: str) -> None:
    """Joins all third party css files into single css file and js files into
    single js file. Copies both files and all fonts into third party folder.
    """

    print('Building third party libs at %s' % third_party_directory_path)

    third_party_js_filepath = os.path.join(
        third_party_directory_path, THIRD_PARTY_JS_RELATIVE_FILEPATH)
    third_party_css_filepath = os.path.join(
        third_party_directory_path, THIRD_PARTY_CSS_RELATIVE_FILEPATH)
    webfonts_dir = os.path.join(
        third_party_directory_path, WEBFONTS_RELATIVE_DIRECTORY_PATH)

    dependency_filepaths = get_dependencies_filepaths()
    ensure_directory_exists(third_party_js_filepath)
    with utils.open_file(
        third_party_js_filepath, 'w+') as third_party_js_file:
        _join_files(dependency_filepaths['js'], third_party_js_file)

    ensure_directory_exists(third_party_css_filepath)
    with utils.open_file(
        third_party_css_filepath, 'w+') as third_party_css_file:
        _join_files(dependency_filepaths['css'], third_party_css_file)

    ensure_directory_exists(webfonts_dir)
    _execute_tasks(
        _generate_copy_tasks_for_fonts(
            dependency_filepaths['fonts'], webfonts_dir))


def build_using_webpack(config_path: str) -> None:
    """Execute webpack build process. This takes all TypeScript files we have in
    /templates and generates JS bundles according the require() imports
    and also compiles HTML pages into the /backend_prod_files/webpack_bundles
    folder. The files are later copied into /build/webpack_bundles.

    Args:
        config_path: str. Webpack config to be used for building.
    """

    print('Building webpack')
    managed_webpack_compiler = servers.managed_webpack_compiler(
        config_path=config_path,
        max_old_space_size=MAX_OLD_SPACE_SIZE_FOR_WEBPACK_BUILD)
    with managed_webpack_compiler as p:
        p.wait()
    assert get_file_count('backend_prod_files/webpack_bundles/') > 0, (
        'webpack_bundles should be non-empty.')


def hash_should_be_inserted(filepath: str) -> bool:
    """Returns if the file should be renamed to include hash in
    the path.

    Args:
        filepath: str. Path relative to directory we are currently building.

    Returns:
        bool. True if filepath should contain hash else False.
    """
    return not any(
        fnmatch.fnmatch(filepath, pattern) for pattern
        in FILEPATHS_NOT_TO_RENAME)


def should_file_be_built(filepath: str) -> bool:
    """Determines if the file should be built.
        - JS files: Returns False if filepath matches with pattern in
        JS_FILENAME_SUFFIXES_TO_IGNORE or is in JS_FILEPATHS_NOT_TO_BUILD,
        else returns True.
        - Python files: Returns False if filepath ends with _test.py, else
        returns True
        - TS files: Returns False.
        - Other files: Returns False if filepath matches with pattern in
        GENERAL_FILENAMES_TO_IGNORE, else returns True.

    Args:
        filepath: str. Path relative to file we are currently building.

    Returns:
        bool. True if filepath should be built, else False.
    """
    if filepath.endswith('.js'):
        return all(
            not filepath.endswith(p) for p in JS_FILENAME_SUFFIXES_TO_IGNORE)
    elif filepath.endswith('_test.py'):
        return False
    elif filepath.endswith('.ts'):
        return False
    else:
        return not any(
            filepath.endswith(p) for p in GENERAL_FILENAMES_TO_IGNORE)


def generate_copy_tasks_to_copy_from_source_to_target(
    source: str, target: str, file_hashes: Dict[str, str]
) -> Deque[threading.Thread]:
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
    print('Processing %s' % os.path.join(os.getcwd(), source))
    print('Copying into %s' % os.path.join(os.getcwd(), target))
    copy_tasks: Deque[threading.Thread] = collections.deque()
    for root, dirnames, filenames in os.walk(os.path.join(os.getcwd(), source)):
        for directory in dirnames:
            print('Copying %s' % os.path.join(root, directory))
        for filename in filenames:
            source_path = os.path.join(root, filename)
            # Python files should not be copied to final build directory.
            if not any(
                    source_path.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                target_path = source_path
                # The path in hashes.json file is in posix style,
                # see the comment above HASHES_JSON_FILENAME for details.
                relative_path = common.convert_to_posixpath(
                    os.path.relpath(source_path, start=source))
                if (hash_should_be_inserted(source + relative_path) and
                        relative_path in file_hashes):
                    relative_path = (
                        _insert_hash(relative_path, file_hashes[relative_path]))

                target_path = os.path.join(os.getcwd(), target, relative_path)
                ensure_directory_exists(target_path)
                copy_task = threading.Thread(
                    target=safe_copy_file,
                    args=(source_path, target_path,))
                copy_tasks.append(copy_task)
    return copy_tasks


def is_file_hash_provided_to_frontend(filepath: str) -> bool:
    """Returns if the hash for the filepath should be provided to the frontend.

    Args:
        filepath: str. Relative path to the file.

    Returns:
        bool. True if file hash should be provided to the frontend else False.
    """
    return any(
        fnmatch.fnmatch(filepath, pattern) for pattern
        in FILEPATHS_PROVIDED_TO_FRONTEND)


def generate_md5_hash(filepath: str) -> str:
    """Returns md5 hash of file.

    Args:
        filepath: str. Absolute path to the file.

    Returns:
        str. Hexadecimal hash of specified file.
    """
    m = hashlib.md5()
    with utils.open_file(filepath, 'rb', encoding=None) as f:
        while True:
            buf = f.read(HASH_BLOCK_SIZE)
            if not buf:
                break
            m.update(buf)
    return m.hexdigest()


def get_filepaths_by_extensions(
    source_dir: str, file_extensions: Tuple[str, ...]
) -> List[str]:
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
            relative_filepath = os.path.relpath(filepath, start=source_dir)
            if should_file_be_built(filepath) and any(
                    filename.endswith(p) for p in file_extensions):
                filepaths.append(relative_filepath)
    return filepaths


def get_file_hashes(directory_path: str) -> Dict[str, str]:
    """Returns hashes of all files in directory tree, excluding files with
    extensions in FILE_EXTENSIONS_TO_IGNORE or files that should not be built.

    Args:
        directory_path: str. Root directory of the tree.

    Returns:
        dict(str, str). Dictionary with keys specifying file paths and values
        specifying file hashes.
    """
    file_hashes = {}

    print(
        'Computing hashes for files in %s'
        % os.path.join(os.getcwd(), directory_path))

    for root, _, filenames in os.walk(
            os.path.join(os.getcwd(), directory_path)):
        for filename in filenames:
            filepath = os.path.join(root, filename)
            if should_file_be_built(filepath) and not any(
                    filename.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                # The path in hashes.json file is in posix style,
                # see the comment above HASHES_JSON_FILENAME for details.
                complete_filepath = common.convert_to_posixpath(
                    os.path.join(root, filename))
                relative_filepath = common.convert_to_posixpath(os.path.relpath(
                    complete_filepath, start=directory_path))
                file_hashes[relative_filepath] = generate_md5_hash(
                    complete_filepath)

    return file_hashes


def filter_hashes(file_hashes: Dict[str, str]) -> Dict[str, str]:
    """Filters hashes that should be provided to the frontend
    and prefixes "/" in front of the keys.

    Args:
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.

    Returns:
        dict(str, str). Filtered dictionary of only filepaths that should be
        provided to the frontend.
    """
    filtered_hashes = {}
    for filepath, file_hash in file_hashes.items():
        if is_file_hash_provided_to_frontend(filepath):
            filtered_hashes['/' + filepath] = file_hash
    return filtered_hashes


def save_hashes_to_file(file_hashes: Dict[str, str]) -> None:
    """Return JS code that loads hashes needed for frontend into variable.

    Args:
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.

    Returns:
        str. JS code loading hashes as JSON into variable.
    """
    # Only some of the hashes are needed in the frontend.
    filtered_hashes = filter_hashes(file_hashes)

    ensure_directory_exists(HASHES_JSON_FILEPATH)
    with utils.open_file(HASHES_JSON_FILEPATH, 'w+') as hashes_json_file:
        hashes_json_file.write(
            str(json.dumps(filtered_hashes, ensure_ascii=False)))
        hashes_json_file.write(u'\n')


def minify_func(source_path: str, target_path: str, filename: str) -> None:
    """Call the appropriate functions to handle different types of file
    formats:
        - HTML files: Remove whitespaces, interpolates paths in HTML to include
        hashes in source directory and save edited file at target directory.
        - CSS or JS files: Minify and save at target directory.
        - Other files: Copy the file from source directory to target directory.
    """
    skip_minify = any(
        filename.endswith(p) for p in JS_FILENAME_SUFFIXES_NOT_TO_MINIFY)
    if filename.endswith('.html'):
        print('Building %s' % source_path)
        with utils.open_file(source_path, 'r+') as source_html_file:
            with utils.open_file(
                target_path, 'w+') as minified_html_file:
                process_html(source_html_file, minified_html_file)
    elif ((filename.endswith('.css') or filename.endswith('.js')) and
          not skip_minify):
        print('Minifying %s' % source_path)
        _minify(source_path, target_path)
    else:
        print('Copying %s' % source_path)
        safe_copy_file(source_path, target_path)


def _execute_tasks(
    tasks: Deque[threading.Thread], batch_size: int = 24
) -> None:
    """Starts all tasks and checks the results.

    Runs no more than 'batch_size' tasks at a time.
    """
    remaining_tasks = collections.deque(tasks)
    currently_running_tasks: List[threading.Thread] = []

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
            except RuntimeError as e:
                raise OSError(
                    'threads can only be started once') from e


def generate_build_tasks_to_build_all_files_in_directory(
    source: str, target: str
) -> Deque[threading.Thread]:
    """This function queues up tasks to build all files in a directory,
    excluding files that should not be built.

    Args:
        source: str. Path relative to /oppia of directory containing source
            files and directories to be built.
        target: str. Path relative to /oppia of directory where the built files
            and directories will be saved to.

    Returns:
        deque(Thread). A deque that contains all build tasks queued
        to be processed.
    """
    print('Processing %s' % os.path.join(os.getcwd(), source))
    print('Generating into %s' % os.path.join(os.getcwd(), target))
    build_tasks: Deque[threading.Thread] = collections.deque()

    for root, dirnames, filenames in os.walk(os.path.join(os.getcwd(), source)):
        for directory in dirnames:
            print('Building directory %s' % os.path.join(root, directory))
        for filename in filenames:
            source_path = os.path.join(root, filename)
            target_path = source_path.replace(source, target)
            ensure_directory_exists(target_path)
            if should_file_be_built(source_path):
                task = threading.Thread(
                    target=minify_func,
                    args=(source_path, target_path, filename,))
                build_tasks.append(task)
    return build_tasks


def generate_build_tasks_to_build_files_from_filepaths(
    source_path: str, target_path: str, filepaths: List[str]
) -> Deque[threading.Thread]:
    """This function queues up build tasks to build files from a list of
    filepaths, excluding files that should not be built.

    Args:
        source_path: str. Path relative to /oppia directory of directory
            containing files and directories to be copied.
        target_path: str. Path relative to /oppia directory of directory where
            to copy the files and directories.
        filepaths: list(str). List of filepaths to be built.

    Returns:
        deque(Thread). A deque that contains all build tasks queued
        to be processed.
    """
    build_tasks: collections.deque[threading.Thread] = collections.deque()
    for filepath in filepaths:
        source_file_path = os.path.join(source_path, filepath)
        target_file_path = os.path.join(target_path, filepath)
        ensure_directory_exists(target_file_path)
        if should_file_be_built(source_file_path):
            task = threading.Thread(
                target=minify_func,
                args=(
                    source_file_path, target_file_path, filepath,))
            build_tasks.append(task)
    return build_tasks


def generate_delete_tasks_to_remove_deleted_files(
    source_dir_hashes: Dict[str, str], staging_directory: str
) -> Deque[threading.Thread]:
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
    print('Scanning directory %s to remove deleted file' % staging_directory)
    delete_tasks: Deque[threading.Thread] = collections.deque()
    for root, _, filenames in os.walk(
            os.path.join(os.getcwd(), staging_directory)):
        for filename in filenames:
            target_path = os.path.join(root, filename)
            # Ignore files with certain extensions.
            if not any(
                    target_path.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                # On Windows the path is on Windows-Style, while the path in
                # hashes is in posix style, we need to convert it so the check
                # can run correctly.
                relative_path = common.convert_to_posixpath(
                    os.path.relpath(target_path, start=staging_directory))
                # Remove file found in staging directory but not in source
                # directory, i.e. file not listed in hash dict.
                if relative_path not in source_dir_hashes:
                    print(
                        'Unable to find %s in file hashes, deleting file'
                        % target_path)
                    task = threading.Thread(
                        target=safe_delete_file, args=(target_path,))
                    delete_tasks.append(task)
    return delete_tasks


def get_recently_changed_filenames(
    source_dir_hashes: Dict[str, str], out_dir: str
) -> List[str]:
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
    file_extensions_not_to_track = ('.html', '.py',)
    for filename, md5_hash in source_dir_hashes.items():
        # Skip files that are already built or should not be built.
        if should_file_be_built(filename) and not any(
                filename.endswith(p) for p in file_extensions_not_to_track):
            final_filepath = _insert_hash(
                os.path.join(out_dir, filename), md5_hash)
            if not os.path.isfile(final_filepath):
                # Filename with provided hash cannot be found, this file has
                # been recently changed or created since last build.
                recently_changed_filenames.append(filename)
    if recently_changed_filenames:
        print(
            'The following files will be rebuilt due to recent changes: %s'
            % recently_changed_filenames)
    return recently_changed_filenames


def generate_build_tasks_to_build_directory(
    dirnames_dict: Dict[str, str]
) -> Deque[threading.Thread]:
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

    Returns:
        deque(Thread). A deque that contains all build tasks queued
        to be processed.
    """
    source_dir = dirnames_dict['dev_dir']
    staging_dir = dirnames_dict['staging_dir']
    out_dir = dirnames_dict['out_dir']
    build_tasks: Deque[threading.Thread] = collections.deque()
    if not os.path.isdir(staging_dir):
        # If there is no staging dir, perform build process on all files.
        print('Creating new %s folder' % staging_dir)
        ensure_directory_exists(staging_dir)
        build_tasks += generate_build_tasks_to_build_all_files_in_directory(
            source_dir, staging_dir)
    else:
        # If staging dir exists, rebuild all HTML and Python files.
        file_extensions_to_always_rebuild = ('.html', '.py',)
        print(
            'Staging dir exists, re-building all %s files'
            % ', '.join(file_extensions_to_always_rebuild))

        filenames_to_always_rebuild = get_filepaths_by_extensions(
            source_dir, file_extensions_to_always_rebuild)
        build_tasks += generate_build_tasks_to_build_files_from_filepaths(
            source_dir, staging_dir, filenames_to_always_rebuild)

        dev_dir_hashes = get_file_hashes(source_dir)

        source_hashes = {}
        source_hashes.update(dev_dir_hashes)

        # Clean up files in staging directory that cannot be found in file
        # hashes dictionary.
        _execute_tasks(generate_delete_tasks_to_remove_deleted_files(
            source_hashes, staging_dir))

        print(
            'Getting files that have changed between %s and %s'
            % (source_dir, out_dir))
        recently_changed_filenames = get_recently_changed_filenames(
            dev_dir_hashes, out_dir)
        if recently_changed_filenames:
            print(
                'Re-building recently changed files at %s' % source_dir)
            build_tasks += generate_build_tasks_to_build_files_from_filepaths(
                source_dir, staging_dir, recently_changed_filenames)
        else:
            print('No changes detected. Using previously built files.')

    return build_tasks


def _verify_filepath_hash(
    relative_filepath: str, file_hashes: Dict[str, str]
) -> None:
    """Ensure that hashes in filepaths match with the hash entries in hash
    dict.

    Args:
        relative_filepath: str. Filepath that is relative from /build.
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.

    Raises:
        ValueError. The hash dict is empty.
        ValueError. Filepath has less than 2 partitions after splitting by '.'
            delimiter.
        ValueError. The filename does not contain hash.
        KeyError. The filename's hash cannot be found in the hash dict.
    """
    # Final filepath example:
    # pages/base.240933e7564bd72a4dde42ee23260c5f.html.
    if not file_hashes:
        raise ValueError('Hash dict is empty')

    filename_partitions = relative_filepath.split('.')
    if len(filename_partitions) < 2:
        raise ValueError('Filepath has less than 2 partitions after splitting')

    hash_string_from_filename = filename_partitions[-2]
    # Ensure hash string obtained from filename follows MD5 hash format.
    if not re.search(r'([a-fA-F\d]{32})', relative_filepath):
        if relative_filepath not in file_hashes:
            return
        raise ValueError(
            '%s is expected to contain MD5 hash' % relative_filepath)
    if hash_string_from_filename not in file_hashes.values():
        raise KeyError(
            'Hash from file named %s does not match hash dict values' %
            relative_filepath)


def _verify_hashes(
    output_dirnames: List[str], file_hashes: Dict[str, str]
) -> None:
    """Verify a few metrics after build process finishes:
        1) The hashes in filenames belongs to the hash dict.
        2) hashes.json, third_party.min.css and third_party.min.js are built and
        hashes are inserted.

    Args:
        output_dirnames: list(str). List of directory paths that contain
            built files.
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.
    """

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
                        os.path.join(root, filename), start=built_dir)
                    _verify_filepath_hash(relative_filepath, file_hashes)

    hash_final_filename = _insert_hash(
        HASHES_JSON_FILENAME, file_hashes[HASHES_JSON_FILENAME])

    # The path in hashes.json (generated via file_hashes) file is in posix
    # style, see the comment above HASHES_JSON_FILENAME for details.
    third_party_js_final_filename = _insert_hash(
        MINIFIED_THIRD_PARTY_JS_RELATIVE_FILEPATH,
        file_hashes[common.convert_to_posixpath(
            MINIFIED_THIRD_PARTY_JS_RELATIVE_FILEPATH)])

    # The path in hashes.json (generated via file_hashes) file is in posix
    # style, see the comment above HASHES_JSON_FILENAME for details.
    third_party_css_final_filename = _insert_hash(
        MINIFIED_THIRD_PARTY_CSS_RELATIVE_FILEPATH,
        file_hashes[common.convert_to_posixpath(
            MINIFIED_THIRD_PARTY_CSS_RELATIVE_FILEPATH)])

    _ensure_files_exist([
        os.path.join(ASSETS_OUT_DIR, hash_final_filename),
        os.path.join(
            THIRD_PARTY_GENERATED_OUT_DIR, third_party_js_final_filename),
        os.path.join(
            THIRD_PARTY_GENERATED_OUT_DIR, third_party_css_final_filename)])


def generate_hashes() -> Dict[str, str]:
    """Generates hashes for files."""

    # The keys for hashes are filepaths relative to the subfolders of the future
    # /build folder. This is so that the replacing inside the HTML files works
    # correctly.
    hashes = {}

    # Create hashes for all directories and files.
    hash_dirs = [
        ASSETS_DEV_DIR, EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir'],
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['dev_dir'],
        THIRD_PARTY_GENERATED_DEV_DIR]
    for hash_dir in hash_dirs:
        hashes.update(get_file_hashes(hash_dir))

    # Save hashes as JSON and write the JSON into JS file
    # to make the hashes available to the frontend.
    save_hashes_to_file(hashes)

    # Update hash dict with newly created hashes.json.
    hashes.update(
        {HASHES_JSON_FILENAME: generate_md5_hash(HASHES_JSON_FILEPATH)})
    # Make sure /assets/hashes.json is available to the frontend.
    _ensure_files_exist([HASHES_JSON_FILEPATH])
    return hashes


def generate_build_directory(hashes: Dict[str, str]) -> None:
    """Generates hashes for files. Minifies files and interpolates paths
    in HTMLs to include hashes. Renames the files to include hashes and copies
    them into build directory.
    """
    print('Building Oppia in production mode...')

    build_tasks: Deque[threading.Thread] = collections.deque()
    copy_tasks: Deque[threading.Thread] = collections.deque()

    # Build files in /extensions and copy them into staging directory.
    build_tasks += generate_build_tasks_to_build_directory(
        EXTENSIONS_DIRNAMES_TO_DIRPATHS)
    # Minify all template files and copy them into staging directory.
    build_tasks += generate_build_tasks_to_build_directory(
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS)
    _execute_tasks(build_tasks)

    # Copy all files from staging directory to production directory.
    copy_input_dirs = [
        ASSETS_DEV_DIR, EXTENSIONS_DIRNAMES_TO_DIRPATHS['staging_dir'],
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['staging_dir'],
        THIRD_PARTY_GENERATED_DEV_DIR,
        WEBPACK_DIRNAMES_TO_DIRPATHS['staging_dir']]
    copy_output_dirs = [
        ASSETS_OUT_DIR, EXTENSIONS_DIRNAMES_TO_DIRPATHS['out_dir'],
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['out_dir'],
        THIRD_PARTY_GENERATED_OUT_DIR, WEBPACK_DIRNAMES_TO_DIRPATHS['out_dir']]
    assert len(copy_input_dirs) == len(copy_output_dirs)
    for i, copy_input_dir in enumerate(copy_input_dirs):
        safe_delete_directory_tree(copy_output_dirs[i])
        copy_tasks += generate_copy_tasks_to_copy_from_source_to_target(
            copy_input_dir, copy_output_dirs[i], hashes)
    _execute_tasks(copy_tasks)

    _verify_hashes(copy_output_dirs, hashes)

    source_dirs_for_assets = [ASSETS_DEV_DIR, THIRD_PARTY_GENERATED_DEV_DIR]
    output_dirs_for_assets = [ASSETS_OUT_DIR, THIRD_PARTY_GENERATED_OUT_DIR]
    _compare_file_count(source_dirs_for_assets, output_dirs_for_assets)

    source_dirs_for_third_party = [THIRD_PARTY_GENERATED_DEV_DIR]
    output_dirs_for_third_party = [THIRD_PARTY_GENERATED_OUT_DIR]
    _compare_file_count(
        source_dirs_for_third_party, output_dirs_for_third_party)

    source_dirs_for_webpack = [WEBPACK_DIRNAMES_TO_DIRPATHS['staging_dir']]
    output_dirs_for_webpack = [WEBPACK_DIRNAMES_TO_DIRPATHS['out_dir']]
    _compare_file_count(
        source_dirs_for_webpack, output_dirs_for_webpack)

    source_dirs_for_extensions = [
        EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir']]
    output_dirs_for_extensions = [EXTENSIONS_DIRNAMES_TO_DIRPATHS['out_dir']]
    _compare_file_count(source_dirs_for_extensions, output_dirs_for_extensions)

    source_dirs_for_templates = [
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['dev_dir']]
    output_dirs_for_templates = [
        TEMPLATES_CORE_DIRNAMES_TO_DIRPATHS['out_dir']]
    _compare_file_count(source_dirs_for_templates, output_dirs_for_templates)

    print('Build completed.')


def generate_python_package() -> None:
    """Generates Python package using setup.py."""
    print('Building Oppia package...')
    subprocess.check_call('python setup.py -q sdist -d build', shell=True)
    print('Oppia package build completed.')


def clean() -> None:
    """Cleans up existing build directories."""
    safe_delete_directory_tree('build/')
    safe_delete_directory_tree('backend_prod_files/')
    safe_delete_directory_tree('webpack_bundles/')


def main(args: Optional[Sequence[str]] = None) -> None:
    """The main method of this script."""
    options = _PARSER.parse_args(args=args)

    if options.maintenance_mode and not options.prod_env:
        raise Exception(
            'maintenance_mode should only be enabled in prod build.')

    # Clean up the existing generated folders.
    clean()

    # Regenerate /third_party/generated from scratch.
    safe_delete_directory_tree(THIRD_PARTY_GENERATED_DEV_DIR)
    build_third_party_libs(THIRD_PARTY_GENERATED_DEV_DIR)

    # If minify_third_party_libs_only is set to True, skips the rest of the
    # build process once third party libs are minified.
    if options.minify_third_party_libs_only:
        if options.prod_env:
            minify_third_party_libs(THIRD_PARTY_GENERATED_DEV_DIR)
            return
        else:
            raise Exception(
                'minify_third_party_libs_only should not be '
                'set in non-prod env.')

    modify_constants(
        prod_env=options.prod_env,
        emulator_mode=not options.deploy_mode,
        maintenance_mode=options.maintenance_mode)
    if options.prod_env:
        minify_third_party_libs(THIRD_PARTY_GENERATED_DEV_DIR)
        hashes = generate_hashes()
        generate_python_package()
        if options.source_maps:
            build_using_webpack(WEBPACK_PROD_SOURCE_MAPS_CONFIG)
        else:
            build_using_webpack(WEBPACK_PROD_CONFIG)
        generate_app_yaml(
            deploy_mode=options.deploy_mode)
        generate_build_directory(hashes)

    save_hashes_to_file({})


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when build.py is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
