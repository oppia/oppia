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

import os
import re
import shutil
import subprocess
import sys
import hashlib


HEAD_DIR = os.path.join('core', 'templates', 'dev', 'head', '')
OUT_DIR = os.path.join('core', 'templates', 'prod', 'head', '')
REMOVE_WS = re.compile(r'\s{2,}').sub
YUICOMPRESSOR_DIR = os.path.join(
    '..', 'oppia_tools', 'yuicompressor-2.4.8', 'yuicompressor-2.4.8.jar')

FILE_EXTENSIONS_TO_IGNORE = ('.py')
FILE_EXTENSIONS_NOT_TO_RENAME = (
    '.html', '.map', '.woff', '.ttf', '.woff2', '.eof', '.ico', '.txt')
HASH_BLOCK_SIZE = 2**20

def _minify(source_path, target_path):
    """Runs the given file through a minifier and outputs it to target_path."""
    cmd = 'java -jar %s %s -o %s' % (
        YUICOMPRESSOR_DIR, source_path, target_path)
    subprocess.check_call(cmd, shell=True)


def ensure_directory_exists(f):
    d = os.path.dirname(f)
    if not os.path.exists(d):
        os.makedirs(d)


def process_html(filename, target, file_hashes):
    f = open(filename, 'r')
    content = f.read()
    for filepath, file_hash in file_hashes.iteritems():
        if filepath.endswith('.html'):
            continue
        file_name, file_extension = os.path.splitext(filepath)
        filepath_with_hash = file_name + '.' + file_hash + file_extension
        content = content.replace(filepath, filepath_with_hash)
    content = REMOVE_WS(' ', content)
    ensure_directory_exists(target)
    d = open(target, 'w+')
    d.write(content)


def process_css(source_path, target_path):
    ensure_directory_exists(target_path)
    _minify(source_path, target_path)


def process_js(source_path, target_path):
    ensure_directory_exists(target_path)
    _minify(source_path, target_path)


def build_minified_third_party_libs(output_directory):
    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    node_path = os.path.join(
        parent_dir, 'oppia_tools', 'node-6.9.1', 'bin', 'node')
    gulp_path = os.path.join(
        parent_dir, 'node_modules', 'gulp', 'bin', 'gulp.js')
    gulp_build_cmd = [node_path, gulp_path, 'build', '--minify=True',
                      '--output_directory=%s' % output_directory]
    proc = subprocess.Popen(
        gulp_build_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    gulp_stdout, gulp_stderr = proc.communicate()
    if gulp_stdout:
        print gulp_stdout
    if gulp_stderr:
        print 'Gulp build process failed.Exiting'
        print '----------------------------------------'
        print gulp_stderr
        sys.exit(1)


def copy_files_source_to_target(source, target, file_hashes):
    """Copies all files in source directory to target."""
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

            target_path = source_path
            relative_path = os.path.relpath(source_path, source)
            if (relative_path in file_hashes and
                    not filename.endswith(FILE_EXTENSIONS_NOT_TO_RENAME)):
                file_name, file_extension = os.path.splitext(source_path)
                target_path = (file_name + '.' + file_hashes[relative_path] +
                               file_extension)

            target_path = target_path.replace(source, target)
            ensure_directory_exists(target_path)
            shutil.copyfile(source_path, target_path)


def generate_file_md5(filepath):
    """Returns md5 hash of file.

    Args:
        filepath: str. Path to the file.

    Returns:
        str. Hexadecimal hash of specified file.
    """
    m = hashlib.md5()
    with open(filepath, "rb") as f:
        while True:
            buf = f.read(HASH_BLOCK_SIZE)
            if not buf:
                break
            m.update(buf)
    return m.hexdigest()


def get_file_hashes(folder_path):
    """Returns hashes of all files in folder tree.

    Args:
        folder_path: str. Root folder of the tree.

    Returns:
        dict(str, str). Dictionary with keys specifying file paths and values
        specifying file hashes.
    """
    file_hashes = dict()

    print 'Processing %s' % os.path.join(os.getcwd(), folder_path)

    for root, dirs, files in os.walk(os.path.join(os.getcwd(), folder_path)):
        for directory in dirs:
            print 'Processing %s' % os.path.join(root, directory)
        for filename in files:
            file_path = os.path.join(root, filename)
            relative_file_path = os.path.relpath(file_path, folder_path)
            file_hashes[relative_file_path] = generate_file_md5(file_path)

    return file_hashes


def build_files(source, target, file_hashes):
    """Minifies all css and js files, and removes whitespace from html in source
    directory and copies it to target.
    Arguments:
        source, target: strings
    """
    print 'Processing %s' % os.path.join(os.getcwd(), source)
    print 'Generating into %s' % os.path.join(os.getcwd(), target)
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
            target_path = source_path.replace(source, target)

            # Ignore files with certain extensions
            if any(source_path.endswith(p) for p in FILE_EXTENSIONS_TO_IGNORE):
                continue

            if filename.endswith('.html'):
                process_html(source_path, target_path, file_hashes)
            elif filename.endswith('.css'):
                process_css(source_path, target_path)
            elif filename.endswith('.js'):
                process_js(source_path, target_path)
            else:
                ensure_directory_exists(target_path)
                shutil.copyfile(source_path, target_path)

if __name__ == '__main__':
    hashes = dict() # pylint: disable=C0103

    # Create hashes for assets, copy folders and files to build/assets
    ASSETS_SRC_DIR = os.path.join('assets', '')
    ASSETS_OUT_DIR = os.path.join('build', 'assets', '')
    #hashes.update(get_file_hashes(ASSETS_SRC_DIR))
    copy_files_source_to_target(ASSETS_SRC_DIR, ASSETS_OUT_DIR, hashes)

    # Process third_party resources, create hashes for them and copy them into
    # build/third_party/generated
    THIRD_PARTY_GENERATED_PROD_DIR = os.path.join(
        'third_party', 'generated', '')
    THIRD_PARTY_GENERATED_OUT_DIR = os.path.join(
        'build', 'third_party', 'generated', '')
    build_minified_third_party_libs(THIRD_PARTY_GENERATED_PROD_DIR)
    hashes.update(get_file_hashes(THIRD_PARTY_GENERATED_PROD_DIR))
    copy_files_source_to_target(
        THIRD_PARTY_GENERATED_PROD_DIR, THIRD_PARTY_GENERATED_OUT_DIR, hashes)

    # Minify extension static resources, create hashes for them and copy them
    # into build/extensions
    EXTENSIONS_DEV_DIR = os.path.join('extensions', '')
    EXTENSIONS_PROD_DIR = os.path.join('extensions', 'prod', '')
    EXTENSIONS_OUT_DIR = os.path.join('build', 'extensions', '')
    hashes.update(get_file_hashes(EXTENSIONS_DEV_DIR))
    build_files(EXTENSIONS_DEV_DIR, EXTENSIONS_PROD_DIR, hashes)
    copy_files_source_to_target(EXTENSIONS_PROD_DIR, EXTENSIONS_OUT_DIR, hashes)

    # Minify all template files, create hashes for them and copy them
    # into build/etemplates/head
    TEMPLATES_DEV_DIR = os.path.join('core', 'templates', 'dev', 'head', '')
    TEMPLATES_PROD_DIR = os.path.join('core', 'templates', 'prod', 'head', '')
    TEMPLATES_OUT_DIR = os.path.join('build', 'templates', 'head', '')
    hashes.update(get_file_hashes(TEMPLATES_DEV_DIR))
    build_files(TEMPLATES_DEV_DIR, TEMPLATES_PROD_DIR, hashes)
    copy_files_source_to_target(TEMPLATES_PROD_DIR, TEMPLATES_OUT_DIR, hashes)
