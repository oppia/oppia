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

from scripts import (
    common,
    install_python_dev_dependencies,
    install_third_party_libs,
    servers,
)

import rcssmin
from typing import (
    Deque,
    Dict,
    List,
    Optional,
    Sequence,
    TextIO,
    Tuple,
    TypedDict,
)

ASSETS_DEV_DIR = os.path.join('assets', '')

THIRD_PARTY_STATIC_DIR = os.path.join('third_party', 'static')
THIRD_PARTY_GENERATED_DEV_DIR = os.path.join('third_party', 'generated', '')

THIRD_PARTY_CSS_RELATIVE_FILEPATH = os.path.join('css', 'third_party.css')
MINIFIED_THIRD_PARTY_CSS_RELATIVE_FILEPATH = os.path.join(
    'css', 'third_party.min.css'
)

WEBFONTS_RELATIVE_DIRECTORY_PATH = os.path.join('webfonts', '')

EXTENSIONS_DIRNAMES_TO_DIRPATHS = {
    'dev_dir': os.path.join('extensions', ''),
}

# This json file contains a json object. The object's keys are file paths and
# the values are corresponded hash value. The paths need to be in posix style,
# as it is interpreted by the `url-interpolation` service, which which
# interprets the paths in this file as URLs.
HASHES_JSON_FILENAME = 'hashes.json'
HASHES_JSON_FILEPATH = os.path.join('assets', HASHES_JSON_FILENAME)


REMOVE_WS = re.compile(r'\s{2,}').sub

PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
UGLIFY_FILE = os.path.join('node_modules', 'uglify-js', 'bin', 'uglifyjs')

# Files with these extensions shouldn't be moved to build directory.
FILE_EXTENSIONS_TO_IGNORE = ('.py', '.pyc', '.stylelintrc', '.ts', '.gitkeep')
# Files with these name patterns shouldn't be moved to build directory, and will
# not be served in production. (This includes webdriverio.js
# files in /extensions.)
JS_FILENAME_SUFFIXES_TO_IGNORE = ('Spec.js', 'webdriverio.js')
JS_FILENAME_SUFFIXES_NOT_TO_MINIFY = ('.bundle.js',)
GENERAL_FILENAMES_TO_IGNORE = ('.pyc', '.stylelintrc', '.DS_Store')

JS_FILEPATHS_NOT_TO_BUILD = (
    os.path.join('core', 'templates', 'expressions', 'parser.js'),
    os.path.join('extensions', 'ckeditor_plugins', 'pre', 'plugin.js'),
)

# These filepaths shouldn't be renamed (i.e. the filepath shouldn't contain
# hash).
# This is because these files don't need cache invalidation, are referenced
# from third party files or should not be moved to the build directory.
# Statically served pages from app.yaml should be here to since they don't
# need cache invalidation.
FILEPATHS_NOT_TO_RENAME = (
    '*.py',
    'third_party/generated/webfonts/*',
    'dist/oppia-angular/*',
    'build/*',
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
    'DATASTORE_USE_PROJECT_ID_AS_APP_ID',
)

# Hashes for files with these paths should be provided to the frontend in
# JS hashes object.
FILEPATHS_PROVIDED_TO_FRONTEND = (
    'images/*',
    'videos/*',
    'i18n/*',
    '*.component.html',
    '*_directive.html',
    '*.directive.html',
    'audio/*',
    '*.template.html',
    '*.png',
    '*.json',
    '*.webp',
)

HASH_BLOCK_SIZE = 2**20

APP_DEV_YAML_FILEPATH = 'app_dev.yaml'

APP_YAML_FILEPATH = 'app.yaml'

MAX_OLD_SPACE_SIZE_FOR_NG_BUILD = 8192

_PARSER = argparse.ArgumentParser(
    description="""
Builds the production version of Oppia. Generates hashes for assets,
minifies files, and creates the build directory. Angular CLI handles
CSS bundling including third-party dependencies.
"""
)

_PARSER.add_argument(
    '--prod_env', action='store_true', default=False, dest='prod_env'
)
_PARSER.add_argument(
    '--deploy_mode', action='store_true', default=False, dest='deploy_mode'
)
_PARSER.add_argument(
    '--minify_third_party_libs_only',
    action='store_true',
    default=False,
    dest='minify_third_party_libs_only',
)
_PARSER.add_argument(
    '--maintenance_mode',
    action='store_true',
    default=False,
    dest='maintenance_mode',
    help=(
        'Enable maintenance mode, '
        'meaning that only super admins can access the site.'
    ),
)
_PARSER.add_argument(
    '--source_maps',
    action='store_true',
    default=False,
    dest='source_maps',
    help='Build angular cli with source maps.',
)


class DependencyBundleDict(TypedDict):
    """Dictionary that represents dependency bundle."""

    js: List[str]
    css: List[str]
    fontsPath: str


def build_js_files(dev_mode: bool, source_maps: bool = False) -> None:
    """Build the javascript files.

    Args:
        dev_mode: bool. Represents whether to run the related commands in dev
            mode.
        source_maps: bool. Represents whether to use source maps while
            building.
    """
    existing_node_options = os.environ.get('NODE_OPTIONS', '')
    memory_flag = '--max_old_space_size=%s' % MAX_OLD_SPACE_SIZE_FOR_NG_BUILD

    if memory_flag not in existing_node_options:
        os.environ['NODE_OPTIONS'] = (
            '%s %s' % (existing_node_options, memory_flag)
        ).strip()

    if not dev_mode:
        print('Generating files for production mode...')

        build_args = ['--prod_env']
        if source_maps:
            build_args.append('--source_maps')
        main(args=build_args)

    else:
        main(args=[])
        servers.run_ng_compilation()


def generate_app_yaml(deploy_mode: bool = False) -> None:
    """Generate app.yaml from app_dev.yaml.

    Args:
        deploy_mode: bool. Whether the script is being called from deploy
            script.

    Raises:
        Exception. Environment variable to be removed does not exist.
    """
    content = '# THIS FILE IS AUTOGENERATED, DO NOT MODIFY\n'
    with open(APP_DEV_YAML_FILEPATH, 'r', encoding='utf-8') as yaml_file:
        content += yaml_file.read()

    def replace_content_or_fail(
        source_content: str,
        pattern: str,
        replacement: str,
        error_message: str,
    ) -> str:
        updated_content, num_replacements = re.subn(
            pattern, replacement, source_content, flags=re.MULTILINE
        )
        if num_replacements != 1:
            raise Exception(error_message)
        return updated_content

    if deploy_mode:
        content = content.replace('version: default', '')
        for env_variable in ENV_VARS_TO_REMOVE_FROM_DEPLOYED_APP_YAML:
            if env_variable not in content:
                raise Exception(
                    'Environment variable \'%s\' to be '
                    'removed does not exist.' % env_variable
                )
            content = re.sub('  %s: ".*"\n' % env_variable, '', content)

    if '/third_party/ckeditor' in content:
        content = replace_content_or_fail(
            content,
            r'^[ \t]*static_dir:[ \t]*dist/oppia-angular(?:/browser)?/third_party/ckeditor[ \t]*\r?$',
            '  static_dir: build/third_party/ckeditor',
            'CKEditor static_dir entry was not found in app.yaml content.',
        )
    if '/third_party/ckeditor-bootstrapck' in content:
        content = replace_content_or_fail(
            content,
            (
                r'^[ \t]*static_dir:[ \t]*'
                r'dist/oppia-angular(?:/browser)?/third_party/ckeditor-bootstrapck'
                r'[ \t]*\r?$'
            ),
            '  static_dir: build/third_party/ckeditor-bootstrapck',
            'CKEditor bootstrapck static_dir entry was not found in app.yaml content.',
        )

    content = content.replace(
        'static_dir: dist/oppia-angular/assets/mathjax',
        'static_dir: build/assets/mathjax',
    )
    content = content.replace(
        'static_dir: extensions', 'static_dir: build/extensions'
    )
    if os.path.isfile(APP_YAML_FILEPATH):
        os.remove(APP_YAML_FILEPATH)
    with open(APP_YAML_FILEPATH, 'w+', encoding='utf-8') as prod_yaml_file:
        prod_yaml_file.write(content)


def _minify_css(source_path: str, target_path: str) -> None:
    """Runs the given file through a minifier and outputs it to target_path.

    Args:
        source_path: str. Absolute path to file to be minified.
        target_path: str. Absolute path to location where to copy
            the minified file.
    """
    source_path = os.path.relpath(source_path)
    target_path = os.path.relpath(target_path)
    with open(source_path, 'r', encoding='utf-8') as source_file:
        with open(target_path, 'w', encoding='utf-8') as target_file:
            target_file.write(rcssmin.cssmin(source_file.read()))


def write_to_file_stream(file_stream: TextIO, content: str) -> None:
    """Write to a file object using provided content.

    Args:
        file_stream: file. A stream handling object to do write operation on.
        content: str. String content to write to file object.
    """
    file_stream.write(str(content))


def _join_files(source_paths: List[str], target_file_stream: TextIO) -> None:
    """Writes multiple files into one file.

    Args:
        source_paths: list(str). Paths to files to join together.
        target_file_stream: file. A stream object of target file.
    """
    for source_path in source_paths:
        with open(source_path, 'r', encoding='utf-8') as source_file:
            write_to_file_stream(target_file_stream, source_file.read())


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
            args=(
                font_path,
                target_path,
            ),
        )
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


def safe_delete_directory_tree(directory_path: str) -> None:
    """Recursively delete a directory tree. If directory tree does not exist,
    create the directories first then delete the directory tree.

    Args:
        directory_path: str. Directory path to be deleted.
    """
    common.ensure_directory_exists(directory_path)
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
                filename.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE
            ):
                total_file_count += 1
    return total_file_count


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
        target_file_stream, REMOVE_WS(' ', source_file_stream.read())
    )


def build_using_ng() -> None:
    """Execute angular build process. This runs the angular compiler and
    generates an ahead of time compiled bundle. This bundle can be found in the
    build folder.
    """
    print('Building using angular cli')
    managed_ng_build_process = servers.managed_ng_build(
        use_prod_env=True, watch_mode=False
    )
    with managed_ng_build_process as p:
        p.wait()
    assert (
        get_file_count('build') > 0
    ), 'angular generated bundle should be non-empty'


def sync_angular_css_hashes() -> None:
    """Updates hashes.json with Angular CLI generated CSS filenames.

    This should only be called during production builds where
    Angular generates hashed filenames.
    """

    dist_dir = 'build'

    if not os.path.exists(dist_dir):
        raise RuntimeError(
            '%s does not exist. Angular CLI build may have failed.' % dist_dir
        )

    dist_files = os.listdir(dist_dir)

    styles_files = [
        f for f in dist_files if f.startswith('styles.') and f.endswith('.css')
    ]
    hashed_styles_filename = styles_files[0] if styles_files else None

    vendor_styles_files = [
        f
        for f in dist_files
        if f.startswith('vendor-styles.') and f.endswith('.css')
    ]
    hashed_vendor_styles_filename = (
        vendor_styles_files[0] if vendor_styles_files else None
    )

    hashes = {}
    if os.path.exists(HASHES_JSON_FILEPATH):
        with open(HASHES_JSON_FILEPATH, 'r', encoding='utf-8') as f:
            hashes = json.loads(f.read())

    hashes_updated = False

    if hashed_styles_filename:
        hash_match = re.match(
            r'styles\.([a-f0-9]+)\.css', hashed_styles_filename
        )
        if hash_match:
            styles_hash = hash_match.group(1)
            hashes['angular_styles'] = styles_hash
            hashes_updated = True

    if hashed_vendor_styles_filename:
        vendor_hash_match = re.match(
            r'vendor-styles\.([a-f0-9]+)\.css', hashed_vendor_styles_filename
        )
        if vendor_hash_match:
            vendor_styles_hash = vendor_hash_match.group(1)
            hashes['angular_vendor_styles'] = vendor_styles_hash
            hashes_updated = True

    if hashes_updated:
        common.write_hashes_json_file(hashes)


def hash_should_be_inserted(filepath: str) -> bool:
    """Returns if the file should be renamed to include hash in
    the path.

    Args:
        filepath: str. Path relative to directory we are currently building.

    Returns:
        bool. True if filepath should contain hash else False.
    """
    return not any(
        fnmatch.fnmatch(filepath, pattern)
        for pattern in FILEPATHS_NOT_TO_RENAME
    )


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
            not filepath.endswith(p) for p in JS_FILENAME_SUFFIXES_TO_IGNORE
        )
    elif filepath.endswith('_test.py'):
        return False
    elif filepath.endswith('.ts'):
        return False
    else:
        return not any(
            filepath.endswith(p) for p in GENERAL_FILENAMES_TO_IGNORE
        )


def is_file_hash_provided_to_frontend(filepath: str) -> bool:
    """Returns if the hash for the filepath should be provided to the frontend.

    Args:
        filepath: str. Relative path to the file.

    Returns:
        bool. True if file hash should be provided to the frontend else False.
    """
    return any(
        fnmatch.fnmatch(filepath, pattern)
        for pattern in FILEPATHS_PROVIDED_TO_FRONTEND
    )


def generate_md5_hash(filepath: str) -> str:
    """Returns md5 hash of file.

    Args:
        filepath: str. Absolute path to the file.

    Returns:
        str. Hexadecimal hash of specified file.
    """
    m = hashlib.md5()
    with open(filepath, 'rb', encoding=None) as f:
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
                filename.endswith(p) for p in file_extensions
            ):
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
        % os.path.join(os.getcwd(), directory_path)
    )

    for root, _, filenames in os.walk(
        os.path.join(os.getcwd(), directory_path)
    ):
        for filename in filenames:
            filepath = os.path.join(root, filename)
            if should_file_be_built(filepath) and not any(
                filename.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE
            ):
                complete_filepath = os.path.join(root, filename)
                relative_filepath = os.path.relpath(
                    complete_filepath, start=directory_path
                )
                file_hashes[relative_filepath] = generate_md5_hash(
                    complete_filepath
                )

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
    """Filters and saves hashes needed for frontend to hashes.json file.

    Args:
        file_hashes: dict(str, str). Dictionary with filepaths as keys and
            hashes of file content as values.
    """
    # Only some of the hashes are needed in the frontend.
    filtered_hashes = filter_hashes(file_hashes)
    common.write_hashes_json_file(filtered_hashes)


def generate_hashes() -> Dict[str, str]:
    """Generates hashes for files."""

    # The keys for hashes are filepaths relative to the subfolders of the future
    # /build folder. This is so that the replacing inside the HTML files works
    # correctly.
    hashes = {}

    # Create hashes for all directories and files.
    hash_dirs = [
        ASSETS_DEV_DIR,
        EXTENSIONS_DIRNAMES_TO_DIRPATHS['dev_dir'],
    ]
    for hash_dir in hash_dirs:
        hashes.update(get_file_hashes(hash_dir))

    # Save hashes as JSON and write the JSON into JS file
    # to make the hashes available to the frontend.
    save_hashes_to_file(hashes)

    # Update hash dict with newly created hashes.json.
    hashes.update(
        {HASHES_JSON_FILENAME: generate_md5_hash(HASHES_JSON_FILEPATH)}
    )
    # Make sure /assets/hashes.json is available to the frontend.
    _ensure_files_exist([HASHES_JSON_FILEPATH])
    return hashes


def generate_python_package() -> None:
    """Generates Python package using setup.py."""

    # We first remove this dev dependencies because they should not be needed
    # for the package build and we need to verify that they are actually not
    # needed.
    try:
        print('Remove dev dependencies')
        install_python_dev_dependencies.main(['--uninstall'])

        print('Building Oppia package...')
        subprocess.check_call('python setup.py -q sdist -d build', shell=True)
        print('Oppia package build completed.')
    finally:
        install_python_dev_dependencies.install_installation_tools()
        install_third_party_libs.main()
        print('Dev dependencies reinstalled')


def clean() -> None:
    """Cleans up existing build directories."""
    safe_delete_directory_tree('build/')


def rename_assets_with_hashes() -> None:
    """Renames static assets in the build directory to include their hashes."""
    dist_dir = 'build'
    if not os.path.exists(HASHES_JSON_FILEPATH):
        return

    with open(HASHES_JSON_FILEPATH, 'r', encoding='utf-8') as f:
        hashes = json.load(f)

    for filepath, file_hash in hashes.items():
        relative_filepath = filepath.lstrip('/')

        possible_paths = [
            os.path.join(dist_dir, 'assets', relative_filepath),
            os.path.join(dist_dir, relative_filepath),
            os.path.join(dist_dir, 'extensions', relative_filepath),
        ]

        for unhashed_file_path in possible_paths:
            if os.path.exists(unhashed_file_path):
                hashed_file_path = _insert_hash(unhashed_file_path, file_hash)
                shutil.copyfile(unhashed_file_path, hashed_file_path)
                break


def main(args: Optional[Sequence[str]] = None) -> None:
    """The main method of this script."""
    options = _PARSER.parse_args(args=args)

    if options.maintenance_mode and not options.prod_env:
        raise Exception(
            'maintenance_mode should only be enabled in prod build.'
        )

    # Clean up the existing generated folders.
    clean()

    # If minify_third_party_libs_only is set to True, skips the rest of the
    # build process once third party libs are minified.
    if options.minify_third_party_libs_only:
        raise Exception('minify_third_party_libs_only is no longer supported.')

    common.modify_constants(
        prod_env=options.prod_env,
        emulator_mode=not options.deploy_mode,
        maintenance_mode=options.maintenance_mode,
    )
    if options.prod_env:
        generate_hashes()
        generate_python_package()
        build_using_ng()
        sync_angular_css_hashes()
        rename_assets_with_hashes()
        generate_app_yaml(deploy_mode=options.deploy_mode)

    save_hashes_to_file({})


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when build.py is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
