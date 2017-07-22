# -*- coding: utf-8 -*-

import os

from tests.test_tools import _TTools

from mutagen._senf import fsnative


class TMutagenPony(_TTools):

    TOOL_NAME = u"mutagen-pony"

    def test_basic(self):
        base = os.path.join(fsnative(u'tests'), fsnative(u'data'))
        res, out = self.call(base)
        self.failIf(res)
        self.failUnless("Report for %s" % base in out)
