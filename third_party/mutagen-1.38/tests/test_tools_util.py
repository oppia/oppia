# -*- coding: utf-8 -*-

from mutagen._tools._util import split_escape
from mutagen._compat import text_type

from tests import TestCase


class Tsplit_escape(TestCase):
    def test_split_escape(self):
        inout = [
            (("", ":"), [""]),
            ((":", ":"), ["", ""]),
            ((":", ":", 0), [":"]),
            ((":b:c:", ":", 0), [":b:c:"]),
            ((":b:c:", ":", 1), ["", "b:c:"]),
            ((":b:c:", ":", 2), ["", "b", "c:"]),
            ((":b:c:", ":", 3), ["", "b", "c", ""]),
            (("a\\:b:c", ":"), ["a:b", "c"]),
            (("a\\\\:b:c", ":"), ["a\\", "b", "c"]),
            (("a\\\\\\:b:c\\:", ":"), ["a\\:b", "c:"]),
            (("\\", ":"), [""]),
            (("\\\\", ":"), ["\\"]),
            (("\\\\a\\b", ":"), ["\\a\\b"]),
        ]

        for inargs, out in inout:
            self.assertEqual(split_escape(*inargs), out)

    def test_types(self):
        parts = split_escape(b"\xff:\xff", b":")
        self.assertEqual(parts, [b"\xff", b"\xff"])
        self.assertTrue(isinstance(parts[0], bytes))

        parts = split_escape(b"", b":")
        self.assertEqual(parts, [b""])
        self.assertTrue(isinstance(parts[0], bytes))

        parts = split_escape(u"a:b", u":")
        self.assertEqual(parts, [u"a", u"b"])
        self.assertTrue(all(isinstance(p, text_type) for p in parts))

        parts = split_escape(u"", u":")
        self.assertEqual(parts, [u""])
        self.assertTrue(all(isinstance(p, text_type) for p in parts))

        parts = split_escape(u":", u":")
        self.assertEqual(parts, [u"", u""])
        self.assertTrue(all(isinstance(p, text_type) for p in parts))
