# -*- coding: utf-8 -*-

import os
import sys
import importlib

from mutagen._compat import StringIO, text_type, PY2
from mutagen._senf import fsnative

from tests import TestCase


def get_var(tool_name, entry="main"):
    mod = importlib.import_module(
        "mutagen._tools.%s" % tool_name.replace("-", "_"))
    return getattr(mod, entry)


class _TTools(TestCase):
    TOOL_NAME = None

    def setUp(self):
        self.assertTrue(isinstance(self.TOOL_NAME, text_type))
        self._main = get_var(self.TOOL_NAME)

    def get_var(self, name):
        return get_var(self.TOOL_NAME, name)

    def call2(self, *args):
        for arg in args:
            self.assertTrue(isinstance(arg, fsnative))
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        try:
            out = StringIO()
            err = StringIO()
            sys.stdout = out
            sys.stderr = err
            try:
                ret = self._main([fsnative(self.TOOL_NAME)] + list(args))
            except SystemExit as e:
                ret = e.code
            ret = ret or 0
            out_val = out.getvalue()
            err_val = err.getvalue()
            if os.name == "nt" and PY2:
                encoding = getattr(sys.stdout, "encoding", None) or "mbcs"
                out_val = text_type(out_val, encoding)
                err_val = text_type(err_val, encoding)
            return (ret, out_val, err_val)
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr

    def call(self, *args):
        return self.call2(*args)[:2]

    def tearDown(self):
        del self._main
