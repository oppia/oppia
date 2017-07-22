# -*- coding: utf-8 -*-

import os

from mutagen.smf import SMF, SMFError
from tests import TestCase, DATA_DIR


class TSMF(TestCase):

    def setUp(self):
        self.audio = SMF(os.path.join(DATA_DIR, "sample.mid"))

    def test_length(self):
        self.failUnlessAlmostEqual(self.audio.info.length, 127.997, 2)

    def test_not_my_file(self):
        self.failUnlessRaises(
            SMFError, SMF, os.path.join(DATA_DIR, "empty.ogg"))

    def test_pprint(self):
        self.audio.pprint()
        self.audio.info.pprint()

    def test_mime(self):
        self.assertTrue("audio/x-midi" in self.audio.mime)
        self.assertTrue("audio/midi" in self.audio.mime)
