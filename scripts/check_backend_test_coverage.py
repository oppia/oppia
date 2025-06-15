# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""This script checks if backend overall line coverage is 100%."""

from __future__ import annotations

import os
import re
import subprocess
import sys

from scripts import common


def main() -> None:
    """Checks if backend overall line coverage is 100%."""
    env = os.environ.copy()

    # See the "Report" section at
    # https://coverage.readthedocs.io/en/latest/cmd.html
    # for what each of the options mean.
    cmd = [
        sys.executable, '-m', 'coverage', 'report',
        '--omit="%s*","third_party/*","/usr/share/*"'
        % common.OPPIA_TOOLS_DIR, '--show-missing',
        '--skip-covered', '--skip-empty']
    process = subprocess.run(
        cmd, capture_output=True, encoding='utf-8', env=env,
        check=False)
    if process.stdout.strip() == 'No data to report.':
        raise RuntimeError(
            'Run backend tests before running this script. ' +
            '\nOUTPUT: %s\nERROR: %s' % (process.stdout, process.stderr)
        )
    if process.returncode:
        raise RuntimeError(
            'Failed to calculate coverage because subprocess failed. ' +
            '\nOUTPUT: %s\nERROR: %s' % (process.stdout, process.stderr)
        )
    print(process.stdout)
    coverage_result = re.search(
        r'TOTAL\s+(\d+)\s+(?P<total>\d+)\s+(\d+)\s+(\d+)\s+(\d+)%\s+',
        process.stdout)
    uncovered_lines = -1.0
    if coverage_result:
        uncovered_lines = float(coverage_result.group('total'))
    else:
        raise RuntimeError('Error in parsing coverage report.')
    if uncovered_lines != 0:
        print('--------------------------------------------')
        print('Backend overall line coverage checks failed.')
        print('--------------------------------------------')
        sys.exit(1)
    else:
        print('--------------------------------------------')
        print('Backend overall line coverage checks passed.')
        print('--------------------------------------------')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_backend_associated_test_file.py
# is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
