# -*- coding: utf-8 -*-

import os

from mutagen.monkeysaudio import MonkeysAudio, MonkeysAudioHeaderError
from tests import TestCase, DATA_DIR


class TMonkeysAudio(TestCase):

    def setUp(self):
        self.mac399 = MonkeysAudio(os.path.join(DATA_DIR, "mac-399.ape"))
        self.mac396 = MonkeysAudio(os.path.join(DATA_DIR, "mac-396.ape"))
        self.mac390 = MonkeysAudio(os.path.join(DATA_DIR, "mac-390-hdr.ape"))

    def test_channels(self):
        self.failUnlessEqual(self.mac399.info.channels, 2)
        self.failUnlessEqual(self.mac396.info.channels, 2)
        self.failUnlessEqual(self.mac390.info.channels, 2)

    def test_sample_rate(self):
        self.failUnlessEqual(self.mac399.info.sample_rate, 44100)
        self.failUnlessEqual(self.mac396.info.sample_rate, 44100)
        self.failUnlessEqual(self.mac390.info.sample_rate, 44100)

    def test_length(self):
        self.failUnlessAlmostEqual(self.mac399.info.length, 3.68, 2)
        self.failUnlessAlmostEqual(self.mac396.info.length, 3.68, 2)
        self.failUnlessAlmostEqual(self.mac390.info.length, 15.63, 2)

    def test_version(self):
        self.failUnlessEqual(self.mac399.info.version, 3.99)
        self.failUnlessEqual(self.mac396.info.version, 3.96)
        self.failUnlessEqual(self.mac390.info.version, 3.90)

    def test_not_my_file(self):
        self.failUnlessRaises(
            MonkeysAudioHeaderError, MonkeysAudio,
            os.path.join(DATA_DIR, "empty.ogg"))
        self.failUnlessRaises(
            MonkeysAudioHeaderError, MonkeysAudio,
            os.path.join(DATA_DIR, "click.mpc"))

    def test_mime(self):
        self.failUnless("audio/x-ape" in self.mac399.mime)

    def test_pprint(self):
        self.failUnless(self.mac399.pprint())
        self.failUnless(self.mac396.pprint())
