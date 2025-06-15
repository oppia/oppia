# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""A script to generate a mapping of files and their root files."""

from __future__ import annotations

import os
import subprocess

from scripts import common
from scripts import run_typescript_checks

TEST_DEPENDENCIES_TSCONFIG_FILEPATH = 'tsconfig.test-dependencies.json'
ROOT_FILES_MAPPING_GENERATOR_FILEPATH = os.path.join(
    'core', 'tests', 'test-dependencies', 'root-files-mapping-generator.js')


def main() -> None:
    """Generates a mapping of files and their root files.""" 

    run_typescript_checks.compile_and_check_typescript(
        TEST_DEPENDENCIES_TSCONFIG_FILEPATH)

    print('Generating root files mapping...')
    cmd = [common.NODE_BIN_PATH, ROOT_FILES_MAPPING_GENERATOR_FILEPATH]
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    encoded_stdout, encoded_stderr = proc.communicate()
    stderr = encoded_stderr.decode('utf-8')

    if stderr:
        raise Exception(stderr)

    print(encoded_stdout.decode('utf-8'))
    print('Root files mapping generated successfully!')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when build.py is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
