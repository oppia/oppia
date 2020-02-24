# -*- coding: utf-8 -*-
import sys

try:
    # py < 2.7
    import unittest2 as unittest
except ImportError:
    import unittest

try:
    unicode()
except NameError:
    u = str
    b = bytes
else:
    def b(value):
        return str(value)
    def u(value):
        if isinstance(value, unicode):
            return value
        return unicode(value, 'utf-8')


if sys.version_info[:1] < (2, 6):
    def assertIn(self, x, y, c=None):
        assert x in y

    unittest.TestCase.assertIn = assertIn
