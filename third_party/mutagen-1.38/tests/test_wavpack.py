# -*- coding: utf-8 -*-

import os

from mutagen.wavpack import WavPack, error as WavPackError
from tests import TestCase, DATA_DIR


class TWavPack(TestCase):

    def setUp(self):
        self.audio = WavPack(os.path.join(DATA_DIR, "silence-44-s.wv"))

    def test_version(self):
        self.failUnlessEqual(self.audio.info.version, 0x403)

    def test_channels(self):
        self.failUnlessEqual(self.audio.info.channels, 2)

    def test_sample_rate(self):
        self.failUnlessEqual(self.audio.info.sample_rate, 44100)

    def test_length(self):
        self.failUnlessAlmostEqual(self.audio.info.length, 3.68, 2)

    def test_not_my_file(self):
        self.failUnlessRaises(
            WavPackError, WavPack, os.path.join(DATA_DIR, "empty.ogg"))

    def test_pprint(self):
        self.audio.pprint()

    def test_mime(self):
        self.failUnless("audio/x-wavpack" in self.audio.mime)


class TWavPackNoLength(TestCase):

    def setUp(self):
        self.audio = WavPack(os.path.join(DATA_DIR, "no_length.wv"))

    def test_version(self):
        self.failUnlessEqual(self.audio.info.version, 0x407)

    def test_channels(self):
        self.failUnlessEqual(self.audio.info.channels, 2)

    def test_sample_rate(self):
        self.failUnlessEqual(self.audio.info.sample_rate, 44100)

    def test_length(self):
        self.failUnlessAlmostEqual(self.audio.info.length, 3.705, 3)

    def test_pprint(self):
        self.audio.pprint()

    def test_mime(self):
        self.failUnless("audio/x-wavpack" in self.audio.mime)
