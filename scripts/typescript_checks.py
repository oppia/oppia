# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""File for compiling and checking typescript."""

import json
import os
import shutil
import subprocess
import sys

COMPILED_JS_DIR = os.path.join('local_compiled_js_for_test', '')
TSCONFIG_FILEPATH = 'tsconfig-for-compile-check.json'


def validate_compiled_js_dir():
    """Validates that compiled js dir matches out dir in tsconfig."""
    with open(TSCONFIG_FILEPATH) as f:
        config_data = json.load(f)
        out_dir = os.path.join(config_data['compilerOptions']['outDir'], '')
    if out_dir != COMPILED_JS_DIR:
        raise Exception(
            'COMPILED_JS_DIR: %s does not match the output directory '
            'in %s: %s' % (COMPILED_JS_DIR, TSCONFIG_FILEPATH, out_dir))


def compile_and_check_typescript():
    """Compiles typescript files and checks the compilation errors."""
    node_path = os.path.join(os.pardir, 'oppia_tools/node-10.15.3')
    os.environ['PATH'] = '%s/bin:' % node_path + os.environ['PATH']

    validate_compiled_js_dir()

    if os.path.exists(COMPILED_JS_DIR):
        shutil.rmtree(COMPILED_JS_DIR)

    print 'Compiling and testing typescript...'
    cmd = [
        './node_modules/typescript/bin/tsc', '--project',
        TSCONFIG_FILEPATH]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    if os.path.exists(COMPILED_JS_DIR):
        shutil.rmtree(COMPILED_JS_DIR)
    error_messages = []
    for line in iter(process.stdout.readline, ''):
        error_messages.append(line)
    if error_messages:
        print 'Errors found during compilation\n'
        for message in error_messages:
            print message
        sys.exit(1)
    else:
        print 'Compilation successful!'


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when build.py is used as a script.
if __name__ == '__main__':  # pragma: no cover
    compile_and_check_typescript()
