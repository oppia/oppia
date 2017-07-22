# -*- coding: utf-8 -*-
# Copyright 2013,2014 Christoph Reiter
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

import os
import re
import sys

import pytest
try:
    from pyflakes.scripts import pyflakes
except ImportError:
    pyflakes = None
from mutagen import _compat

from tests import TestCase


os.environ["PYFLAKES_NODOCTEST"] = "1"


class Error(object):
    IMPORT_UNUSED = "imported but unused"
    REDEF_FUNCTION = "redefinition of function"
    UNABLE_DETECT_UNDEF = "unable to detect undefined names"
    UNDEFINED_PY2_NAME = \
        "undefined name '(unicode|long|basestring|xrange|cmp)'"


class FakeStream(object):
    # skip these by default
    BL = []
    if _compat.PY3:
        BL.append(Error.UNDEFINED_PY2_NAME)

    def __init__(self, blacklist=None):
        self.lines = []
        if blacklist is None:
            blacklist = []
        self.bl = self.BL[:] + blacklist

    def write(self, text):
        for p in self.bl:
            if re.search(p, text):
                return
        text = text.strip()
        if not text:
            return
        self.lines.append(text)

    def check(self):
        if self.lines:
            raise Exception("\n" + "\n".join(self.lines))


@pytest.mark.quality
class TPyFlakes(TestCase):

    def _run(self, path, **kwargs):
        old_stdout = sys.stdout
        stream = FakeStream(**kwargs)
        try:
            sys.stdout = stream
            for dirpath, dirnames, filenames in os.walk(path):
                for filename in filenames:
                    if filename.endswith('.py'):
                        pyflakes.checkPath(os.path.join(dirpath, filename))
        finally:
            sys.stdout = old_stdout
        stream.check()

    def _run_package(self, mod, *args, **kwargs):
        path = mod.__path__[0]
        self._run(path, *args, **kwargs)

    def test_main(self):
        import mutagen
        self._run_package(mutagen)

    def test_tests(self):
        import tests
        self._run_package(tests)
