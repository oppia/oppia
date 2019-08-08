from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import os
import sys

from core.tests import test_utils


class FailingTests(test_utils.GenericTestBase):

    def test_fail(self):
        self.assertEqual(1, 2)
