import sys
import unittest
from core.tests import test_utils


class TestA(test_utils.GenericTestBase):
    def test_a(self):
        print("Success")


if __name__ == '__main__':
    unittest.main()
