from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import subprocess
import tempfile

from core.tests import test_utils

import python_utils

PYTHON_CMD = 'python3'
MYPY_SCRIPT_MODULE = 'scripts.run_mypy_checks'

class MypyCheckTests(test_utils.GenericTestBase):

    def setUp(self):
        super(MypyCheckTests, self).setUp()

    def test_mypy_valid(self):
        tmpfile = tempfile.NamedTemporaryFile(suffix='.py')
        tmpfile.write(
            "def add(x: float, y: float) -> float:\n"
            "    return x + y"
            )
        tmpfile.seek(0)
        cmd = [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE, '--files', tmpfile.name]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = process.communicate()
        tmpfile.close()
        self.assertEqual(output[0], 'Success: no issues found in 1 source file\n')

    def test_mypy_invalid(self):
        tmpfile = tempfile.NamedTemporaryFile(suffix='.py')
        tmpfile.write(
            "def add(x, y):\n"
            "    return x + y"
            )
        tmpfile.seek(0)
        cmd = [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE, '--files', tmpfile.name]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = process.communicate()
        tmpfile.close()
        self.assertIn('error', output[0])
