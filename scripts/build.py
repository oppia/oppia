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

HEAD_DIR = 'core/templates/dev/head/'
OUT_DIR = 'core/templates/prod/head/'
REMOVE_WS = re.compile(r'\s{2,}').sub
YUICOMPRESSOR_DIR = os.path.join(
    '..', 'oppia_tools', 'yuicompressor-2.4.8', 'yuicompressor-2.4.8.jar')


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
    process_third_party_libs()

    for root in os.listdir(os.path.join(os.getcwd())):
        if any([s in root for s in ['.git', 'third_party', 'extensions']]):
            continue

        print 'Processing %s' % os.path.join(os.getcwd(), root)
        for root, dirs, files in os.walk(os.path.join(os.getcwd(), root)):
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


if __name__ == '__main__':
    _build_files()
