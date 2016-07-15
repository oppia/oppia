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

# TODO(gvishal): Import utils
# import utils

# ensure_directory_exists method trims file paths passed to it. Hence, directory
# paths require a trailing slash.
HEAD_DIR = os.path.join('core', 'templates', 'dev', 'head', '')
OUT_DIR = os.path.join('core', 'templates', 'prod', 'head', '')
REMOVE_WS = re.compile(r'\s{2,}').sub
YUICOMPRESSOR_DIR = os.path.join(
    '..', 'oppia_tools', 'yuicompressor-2.4.8', 'yuicompressor-2.4.8.jar')
CACHE_SLUG = None
ASSETS_SRC_DIR = os.path.join('assets', '')
ASSETS_OUT_DIR = None
THIRD_PARTY_GENERATED_SRC_DIR = os.path.join(
    'third_party', 'generated', 'prod', '')
THIRD_PARTY_GENERATED_OUT_DIR = None
CSS_SRC_DIR = os.path.join('core', 'templates', 'prod', 'head', 'css', '')
CSS_OUT_DIR = None
BUILD_DIR = None


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


def process_build(filename, target):
    ensure_directory_exists(target)
    shutil.copyfile(filename, target)


def process_third_party_libs():
    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    node_path = os.path.join(
        parent_dir, 'oppia_tools', 'node-4.2.1', 'bin', 'node')
    gulp_path = os.path.join(
        parent_dir, 'node_modules', 'gulp', 'bin', 'gulp.js')
    gulp_build_cmd = [node_path, gulp_path, 'build', '--minify=True']
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


def _build_files():
    ensure_directory_exists(OUT_DIR)
    shutil.rmtree(OUT_DIR)
    ensure_directory_exists(ASSETS_OUT_DIR)
    shutil.rmtree(ASSETS_OUT_DIR)
    ensure_directory_exists(THIRD_PARTY_GENERATED_OUT_DIR)
    shutil.rmtree(THIRD_PARTY_GENERATED_OUT_DIR)
    ensure_directory_exists(CSS_OUT_DIR)
    shutil.rmtree(CSS_OUT_DIR)
    process_third_party_libs()

    for root in os.listdir(os.path.join(os.getcwd())):
        if any([s in root for s in ['.git', 'extensions', 'build']]):
            continue

        print 'Processing %s' % os.path.join(os.getcwd(), root)

        # Process assets, copy it to build/[cache_slug]/assets
        if any([s in root for s in ['assets']]):
            for root, dirs, files in os.walk(os.path.join(os.getcwd(), root)):
                for directory in dirs:
                    print 'Processing %s' % os.path.join(root, directory)

                for filename in files:
                    source_path = os.path.join(root, filename)
                    if source_path.find(ASSETS_OUT_DIR) > 0:
                        continue
                    if source_path.find(ASSETS_SRC_DIR) == -1:
                        continue
                    target_path = source_path.replace(
                        ASSETS_SRC_DIR, ASSETS_OUT_DIR)
                    process_build(source_path, target_path)

        # Process third_party/generated/prod, copy it to
        # build/[cache_slug]/third_party/generated
        if any([s in root for s in ['third_party']]):
            for root, dirs, files in os.walk(os.path.join(os.getcwd(), root)):
                if not any([s in root for s in [
                        os.path.join('generated', 'prod')]]):
                    continue

                for directory in dirs:
                    print 'Processing %s' % os.path.join(root, directory)

                for filename in files:
                    source_path = os.path.join(root, filename)
                    if source_path.find(THIRD_PARTY_GENERATED_OUT_DIR) > 0:
                        continue
                    if source_path.find(THIRD_PARTY_GENERATED_SRC_DIR) == -1:
                        continue
                    target_path = source_path.replace(
                        THIRD_PARTY_GENERATED_SRC_DIR,
                        THIRD_PARTY_GENERATED_OUT_DIR)
                    process_build(source_path, target_path)

        # Process core/templates/dev/head
        if any([s in root for s in ['core']]):
            for root, dirs, files in os.walk(os.path.join(os.getcwd(), root)):
                if not any([s in root for s in [os.path.join('templates')]]):
                    continue
                for directory in dirs:
                    print 'Processing %s' % os.path.join(root, directory)
                for filename in files:
                    source_path = os.path.join(root, filename)
                    if source_path.find(OUT_DIR) > 0:
                        continue
                    if source_path.find(HEAD_DIR) == -1:
                        continue
                    target_path = source_path.replace(HEAD_DIR, OUT_DIR)
                    if filename.endswith('.html'):
                        process_html(source_path, target_path)
                    if filename.endswith('.css'):
                        process_css(source_path, target_path)
                    if filename.endswith('.js'):
                        process_js(source_path, target_path)

                # Process core/templates/prod/head/css,
                # copy it to build/[cache_slug]/css
                if not any([s in root for s in [
                        os.path.join('templates', 'prod', 'head', 'css')]]):
                    continue

                print 'Processing css directory.'

                for directory in dirs:
                    print 'Processing %s' % os.path.join(root, directory)

                for filename in files:
                    source_path = os.path.join(root, filename)
                    if source_path.find(CSS_OUT_DIR) > 0:
                        continue
                    if source_path.find(CSS_SRC_DIR) == -1:
                        continue
                    target_path = source_path.replace(CSS_SRC_DIR, CSS_OUT_DIR)
                    process_build(source_path, target_path)


if __name__ == '__main__':
    # TODO(gvishal): get this cache slug somehow
    # CACHE_SLUG = utils.get_cache_slug()
    CACHE_SLUG = 'default'
    BUILD_DIR = os.path.join('build', CACHE_SLUG)
    ASSETS_OUT_DIR = os.path.join(BUILD_DIR, 'assets', '')
    THIRD_PARTY_GENERATED_OUT_DIR = os.path.join(
        BUILD_DIR, 'third_party', 'generated', '')
    CSS_OUT_DIR = os.path.join(BUILD_DIR, 'css', '')
    # TODO(gvishal): copy extensions to build.
    _build_files()
