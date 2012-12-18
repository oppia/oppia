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
from subprocess import call

import css_minifier

HEAD_DIR = 'templates/dev/head/'
OUT_DIR = 'templates/prod/head/'
REMOVE_WS = re.compile(r'\s{2,}').sub
CLOSURE_COMPILER = """java -jar third_party/closure-compiler/compiler.jar \
    --compilation_level WHITESPACE_ONLY """


def EnsureDirectoryExists(f):
  d = os.path.dirname(f)
  if not os.path.exists(d):
    os.makedirs(d)


def GetTarget(filename):
  return filename.replace(HEAD_DIR, OUT_DIR)


def ProcessHtml(filename, target):
  f = open(filename, 'r')
  content = f.read()
  content = REMOVE_WS(' ', content)
  EnsureDirectoryExists(target)
  d = open(target, 'w+')
  d.write(content)


def ProcessCSS(filename, target):
  f = open(filename, 'r')
  EnsureDirectoryExists(target)
  d = open(target, 'w+')
  css_minifier.MinifyCSS(f.read(), d)
  return


def ProcessJS(filename, target):
  EnsureDirectoryExists(target)
  # TODO(sll): Reinstate the following once it can handle 'delete'.
  # cmd = CLOSURE_COMPILER + filename + ' --js_output_file ' + target
  # call(cmd, shell=True)
  f = open(filename, 'r')
  content = f.read()
  d = open(target, 'w+')
  d.write(content)
  return


# Script starts here.
EnsureDirectoryExists(OUT_DIR)
for root, dirs, files in os.walk(os.getcwd()):
  for directory in dirs:
    print 'Processing', os.path.join(root, directory)
  for fn in files:
    full_filename = os.path.join(root) + '/' + fn
    if full_filename.find(OUT_DIR) > 0:
      continue
    if full_filename.find('static/templates') != -1
      continue
    # Do not process files in third_party.
    if full_filename.find('third_party') != -1 or full_filename.find('.git') != -1:
      continue
    target_filename = GetTarget(full_filename)
    if fn.endswith('.html'):
      ProcessHtml(full_filename, target_filename)
    if fn.endswith('.css'):
      ProcessCSS(full_filename, target_filename)
    if fn.endswith('.js'):
      ProcessJS(full_filename, target_filename)
