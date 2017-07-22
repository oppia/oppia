# -*- coding: utf-8 -*-
# Copyright 2014 Christoph Reiter
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

import os
import re

from tests import TestCase

import mutagen


class TSourceEncoding(TestCase):
    """Enforce utf-8 source encoding everywhere.
    Plus give helpful message for fixing it.
    """

    def _check_encoding(self, path):
        with open(path, "r") as h:
            match = None
            for i, line in enumerate(h):
                # https://www.python.org/dev/peps/pep-0263/
                match = match or re.search("coding[:=]\s*([-\w.]+)", line)
                if i >= 2:
                    break
            if match:
                match = match.group(1)
            self.assertEqual(match, "utf-8",
                             msg="%s has no utf-8 source encoding set\n"
                                 "Insert:\n# -*- coding: utf-8 -*-" % path)

    def test_main(self):
        root = os.path.dirname(mutagen.__path__[0])

        skip = [os.path.join(root, "docs"), os.path.join(root, "venv")]
        for dirpath, dirnames, filenames in os.walk(root):
            if any((dirpath.startswith(s + os.sep) or s == dirpath)
                   for s in skip):
                continue

            for filename in filenames:
                if filename.endswith('.py'):
                    path = os.path.join(dirpath, filename)
                    self._check_encoding(path)
