# -*- coding: utf-8 -*-

import os
import glob

from tests.test_tools import _TTools

from mutagen._senf import fsnative as fsn


class TMutagenInspect(_TTools):

    TOOL_NAME = u"mutagen-inspect"

    def test_basic(self):
        base = os.path.join(fsn(u'tests'), fsn(u'data'))
        self.paths = glob.glob(os.path.join(base, "empty*"))
        self.paths += glob.glob(os.path.join(base, "silence-*"))

        for path in self.paths:
            res, out = self.call(path)
            self.failIf(res)
            self.failUnless(out.strip())
            self.failIf("Unknown file type" in out)
            self.failIf("Errno" in out)
