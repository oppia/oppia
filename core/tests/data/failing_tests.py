
import os
import sys

from core.tests import test_utils


class FailingTests(test_utils.GenericTestBase):

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def test_fail(self) -> None:
        self.assertEqual(1, 2)
