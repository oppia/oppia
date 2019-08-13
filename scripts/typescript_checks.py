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

import os
import shutil
import subprocess
import sys


def compile_and_check_typescript():
    """Compiles typescript files and checks the compilation errors."""
    node_path = os.path.join(os.pardir, 'oppia_tools/node-10.15.3')
    os.environ['PATH'] = '%s/bin:' % node_path + os.environ['PATH']
    if os.path.exists('local_compiled_js'):
        shutil.rmtree('local_compiled_js')
    print 'Compiling and testing typescript...'
    typescript_path = os.path.join(
        os.getcwd(), 'node_modules/typescript/bin/tsc')
    cmd = [typescript_path, '--project', 'tsconfig-for-compile-check.json']
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE)
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
