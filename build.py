# Copyright 2012 Google Inc. All Rights Reserved.
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

HEAD_DIR = 'templates/dev/head/'
OUT_DIR = 'templates/prod/head/'
REMOVE_WS = re.compile(r'\s{2,}').sub
CLOSURE_COMPILER = """java -jar third_party/closure-compiler/compiler.jar \
    --compilation_level WHITESPACE_ONLY """


def ensure_directory_exists(f):
    d = os.path.dirname(f)
    if not os.path.exists(d):
        os.makedirs(d)


def get_target(filename):
    return filename.replace(HEAD_DIR, OUT_DIR)


def process_html(filename, target):
    f = open(filename, 'r')
    content = f.read()
    content = REMOVE_WS(' ', content)
    ensure_directory_exists(target)
    d = open(target, 'w+')
    d.write(content)


def minify_css(css):
    """Collapse whitespace in CSS file."""
    # TODO(sll): replace with a third-party minifier, such as yuicompressor.
    return re.sub(r'\s+', ' ', css)


def process_css(filename, target):
    f = open(filename, 'r')
    ensure_directory_exists(target)
    d = open(target, 'w+')
    d.write(minify_css(f.read()))


def process_js(filename, target):
    ensure_directory_exists(target)
    # TODO(sll): Reinstate the following once it can handle 'delete'.
    # cmd = CLOSURE_COMPILER + filename + ' --js_output_file ' + target
    # call(cmd, shell=True)
    f = open(filename, 'r')
    content = f.read()
    d = open(target, 'w+')
    d.write(content)
    return


# Script starts here.
ensure_directory_exists(OUT_DIR)
shutil.rmtree(OUT_DIR)

for root in os.listdir(os.getcwd()):
    if '.git' in root or 'third_party' in root or 'lib' in root or 'data' in root:
        continue

    print 'Processing', os.path.join(os.getcwd(), root)
    for root, dirs, files in os.walk(os.path.join(os.getcwd(), root)):
        for directory in dirs:
            print 'Processing', os.path.join(root, directory)
        for fn in files:
            full_filename = os.path.join(root) + '/' + fn
            if full_filename.find(OUT_DIR) > 0:
                continue
            target_filename = get_target(full_filename)
            if fn.endswith('.html'):
                process_html(full_filename, target_filename)
            if fn.endswith('.css'):
                process_css(full_filename, target_filename)
            if fn.endswith('.js'):
                process_js(full_filename, target_filename)
