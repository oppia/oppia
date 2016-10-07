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
import yaml


HEAD_DIR = os.path.join('core', 'templates', 'dev', 'head', '')
OUT_DIR = os.path.join('core', 'templates', 'prod', 'head', '')
REMOVE_WS = re.compile(r'\s{2,}').sub
YUICOMPRESSOR_DIR = os.path.join(
    '..', 'oppia_tools', 'yuicompressor-2.4.8', 'yuicompressor-2.4.8.jar')

FILE_EXTENSIONS_TO_IGNORE = ['.py']


def _minify(source_path, target_path):
    """Runs the given file through a minifier and outputs it to target_path."""
    cmd = 'java -jar %s %s -o %s' % (
        YUICOMPRESSOR_DIR, source_path, target_path)
    subprocess.check_call(cmd, shell=True)


def ensure_directory_exists(f):
    d = os.path.dirname(f)
    if not os.path.exists(d):
        os.makedirs(d)


def process_html(filename, target):
    f = open(filename, 'r')
    content = f.read()
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
        parent_dir, 'oppia_tools', 'node-4.2.1', 'bin', 'node')
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


def copy_files_source_to_target(source, target):
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
            target_path = source_path.replace(
                source, target)
            ensure_directory_exists(target_path)
            shutil.copyfile(source_path, target_path)


def build_files(source, target):
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
                process_html(source_path, target_path)
            elif filename.endswith('.css'):
                process_css(source_path, target_path)
            elif filename.endswith('.js'):
                process_js(source_path, target_path)
            else:
                ensure_directory_exists(target_path)
                shutil.copyfile(source_path, target_path)

def get_cache_slug():
    """Returns the cache slug read from file."""
    with open('cache_slug.yaml', 'r') as cache_slug_file:
        content = cache_slug_file.read()
    retrieved_dict = yaml.safe_load(content)
    assert isinstance(retrieved_dict, dict)
    return retrieved_dict['cache_slug']


if __name__ == '__main__':
    CACHE_SLUG = get_cache_slug()
    BUILD_DIR = os.path.join('build', CACHE_SLUG)

    # os.path.dirname(path)(in ensure_directory_exists()) returns parent
    # directory of a path passed as an argument to it. This is as intended
    # for file paths, but for directory paths we do not want this to happen,
    # hence we append a trailing slash to it.
    # Process assets, copy it to build/[cache_slug]/assets
    ASSETS_SRC_DIR = os.path.join('assets', '')
    ASSETS_OUT_DIR = os.path.join(BUILD_DIR, 'assets', '')
    copy_files_source_to_target(ASSETS_SRC_DIR, ASSETS_OUT_DIR)

    # Process third_party resources, copy it to
    # build/[cache_slug]/third_party/generated
    THIRD_PARTY_GENERATED_OUT_DIR = os.path.join(
        BUILD_DIR, 'third_party', 'generated')
    build_minified_third_party_libs(THIRD_PARTY_GENERATED_OUT_DIR)

    # Minify extension static resources, copy it to
    # build/[cache_slug]/extensions
    EXTENSIONS_SRC_DIR = os.path.join('extensions', '')
    EXTENSIONS_OUT_DIR = os.path.join(BUILD_DIR, 'extensions', '')
    build_files(EXTENSIONS_SRC_DIR, EXTENSIONS_OUT_DIR)

    TEMPLATES_HEAD_DIR = os.path.join('core', 'templates', 'dev', 'head', '')
    TEMPLATES_OUT_DIR = os.path.join('core', 'templates', 'prod', 'head', '')
    build_files(TEMPLATES_HEAD_DIR, TEMPLATES_OUT_DIR)

    # Process core/templates/prod/head/css, copy it to build/[cache_slug]/css
    CSS_SRC_DIR = os.path.join('core', 'templates', 'prod', 'head', 'css', '')
    CSS_OUT_DIR = os.path.join(BUILD_DIR, 'css', '')
    copy_files_source_to_target(CSS_SRC_DIR, CSS_OUT_DIR)

    # Copy core/templates/prod/head/ to build/[cache_slug]/templates/head/
    TEMPLATES_SRC_DIR = os.path.join('core', 'templates', 'prod', 'head', '')
    TEMPLATES_OUT_DIR = os.path.join(BUILD_DIR, 'templates', 'head', '')
    copy_files_source_to_target(TEMPLATES_SRC_DIR, TEMPLATES_OUT_DIR)
