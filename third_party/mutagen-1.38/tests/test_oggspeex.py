# -*- coding: utf-8 -*-

import os
import shutil

from mutagen._compat import cBytesIO
from mutagen.ogg import OggPage
from mutagen.oggspeex import OggSpeex, OggSpeexInfo, delete, error
from tests import TestCase, DATA_DIR, get_temp_copy
from tests.test_ogg import TOggFileTypeMixin


class TOggSpeex(TestCase, TOggFileTypeMixin):
    Kind = OggSpeex

    def setUp(self):
        self.filename = get_temp_copy(os.path.join(DATA_DIR, "empty.spx"))
        self.audio = self.Kind(self.filename)

    def tearDown(self):
        os.unlink(self.filename)

    def test_module_delete(self):
        delete(self.filename)
        self.scan_file()
        self.failIf(OggSpeex(self.filename).tags)

    def test_channels(self):
        self.failUnlessEqual(2, self.audio.info.channels)

    def test_sample_rate(self):
        self.failUnlessEqual(44100, self.audio.info.sample_rate)

    def test_bitrate(self):
        self.failUnlessEqual(0, self.audio.info.bitrate)

    def test_invalid_not_first(self):
        with open(self.filename, "rb") as h:
            page = OggPage(h)
        page.first = False
        self.failUnlessRaises(error, OggSpeexInfo, cBytesIO(page.write()))

    def test_vendor(self):
        self.failUnless(
            self.audio.tags.vendor.startswith("Encoded with Speex 1.1.12"))
        self.failUnlessRaises(KeyError, self.audio.tags.__getitem__, "vendor")

    def test_not_my_ogg(self):
        fn = os.path.join(DATA_DIR, 'empty.oggflac')
        self.failUnlessRaises(error, type(self.audio), fn)
        self.failUnlessRaises(error, self.audio.save, fn)
        self.failUnlessRaises(error, self.audio.delete, fn)

    def test_multiplexed_in_headers(self):
        shutil.copy(
            os.path.join(DATA_DIR, "multiplexed.spx"), self.filename)
        audio = self.Kind(self.filename)
        audio.tags["foo"] = ["bar"]
        audio.save()
        audio = self.Kind(self.filename)
        self.failUnlessEqual(audio.tags["foo"], ["bar"])

    def test_mime(self):
        self.failUnless("audio/x-speex" in self.audio.mime)

    def test_init_padding(self):
        self.assertEqual(self.audio.tags._padding, 0)
