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

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys

from core import utils

from typing import Optional, Sequence

from . import common

_PARSER = argparse.ArgumentParser(
    description="""
Run the script from the oppia root folder:
    python -m scripts.typescript_checks
Note that the root folder MUST be named 'oppia'.
""")

_PARSER.add_argument(
    '--strict_checks',
    help='optional; if specified, compiles typescript using strict config.',
    action='store_true')

COMPILED_JS_DIR = os.path.join('local_compiled_js_for_test', '')
TSCONFIG_FILEPATH = 'tsconfig.json'
STRICT_TSCONFIG_FILEPATH = 'tsconfig-strict.json'


def validate_compiled_js_dir() -> None:
    """Validates that compiled JS dir matches out dir in tsconfig."""
    with utils.open_file(TSCONFIG_FILEPATH, 'r') as f:
        config_data = json.load(f)
        out_dir = os.path.join(config_data['compilerOptions']['outDir'], '')
    if out_dir != COMPILED_JS_DIR:
        raise Exception(
            'COMPILED_JS_DIR: %s does not match the output directory '
            'in %s: %s' % (COMPILED_JS_DIR, TSCONFIG_FILEPATH, out_dir))


def compile_and_check_typescript(config_path: str) -> None:
    """Compiles typescript files and checks the compilation errors.

    Args:
        config_path: str. The config that should be used to run the typescript
            checks.
    """
    os.environ['PATH'] = '%s/bin:' % common.NODE_PATH + os.environ['PATH']
    validate_compiled_js_dir()

    if os.path.exists(COMPILED_JS_DIR):
        shutil.rmtree(COMPILED_JS_DIR)

    print('Compiling and testing typescript...')
    cmd = ['./node_modules/typescript/bin/tsc', '--project', config_path]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, encoding='utf-8')

    if os.path.exists(COMPILED_JS_DIR):
        shutil.rmtree(COMPILED_JS_DIR)

    # The value of `process.stdout` should not be None since we passed
    # the `stdout=subprocess.PIPE` argument to `Popen`.
    assert process.stdout is not None
    error_messages = list(iter(process.stdout.readline, ''))

    if error_messages:
        print('Errors found during compilation\n')
        print('\n'.join(error_messages))
        sys.exit(1)
    else:
        print('Compilation successful!')


def main(args: Optional[Sequence[str]] = None) -> None:
    """Run the typescript checks."""
    parsed_args = _PARSER.parse_args(args=args)
    compile_and_check_typescript(
        STRICT_TSCONFIG_FILEPATH
        if parsed_args.strict_checks else
        TSCONFIG_FILEPATH)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when typescript_checks.py is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
