# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for MyPy tyoe check runner script."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import subprocess
import tempfile

from core.tests import test_utils

PYTHON_CMD = 'python3'
MYPY_SCRIPT_MODULE = 'scripts.run_mypy_checks'


class MypyScriptChecks(test_utils.GenericTestBase):
    """Tests for MyPy type check runner script."""

    def test_mypy_valid(self):
        tmpfile = tempfile.NamedTemporaryFile(suffix='.py')
        tmpfile.write(
            'def add(x, y):\n'
            '    # type: (float, float) -> float\n'
            '    return x + y'
            )
        tmpfile.seek(0)
        cmd = [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE, '--files', tmpfile.name]
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = process.communicate()
        tmpfile.close()
        self.assertIn(
            'Success: no issues found in 1 source file\n', output[0])

    def test_mypy_invalid(self):
        tmpfile = tempfile.NamedTemporaryFile(suffix='.py')
        tmpfile.write(
            'def add(x, y):\n'
            '    return x + y'
            )
        tmpfile.seek(0)
        cmd = [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE, '--files', tmpfile.name]
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = process.communicate()
        tmpfile.close()
        self.assertIn('error', output[0])
