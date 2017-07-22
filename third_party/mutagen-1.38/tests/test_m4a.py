# -*- coding: utf-8 -*-

import os
import warnings

from tests import TestCase, DATA_DIR

with warnings.catch_warnings():
    warnings.simplefilter("ignore", DeprecationWarning)
    from mutagen.m4a import (M4A, M4ATags, M4AInfo, delete, M4ACover,
                             error)


class TM4ADeprecation(TestCase):

    SOME_FILE = os.path.join(DATA_DIR, "no-tags.m4a")

    def test_fail(self):
        self.assertRaises(error, M4A, self.SOME_FILE)
        self.assertRaises(error, delete, self.SOME_FILE)
        self.assertRaises(error, delete, self.SOME_FILE)

        M4AInfo  # pyflakes
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            a = M4A()
        a.add_tags()
        self.assertEqual(a.tags.items(), [])

        some_cover = M4ACover(b"foo", M4ACover.FORMAT_JPEG)
        self.assertEqual(some_cover.imageformat, M4ACover.FORMAT_JPEG)

        tags = M4ATags()
        self.assertRaises(error, tags.save, self.SOME_FILE)
