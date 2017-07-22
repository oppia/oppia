# -*- coding: utf-8 -*-

import os

from mutagen.trueaudio import TrueAudio, delete, error
from mutagen.id3 import TIT1

from tests import TestCase, DATA_DIR, get_temp_copy


class TTrueAudio(TestCase):

    def setUp(self):
        self.audio = TrueAudio(os.path.join(DATA_DIR, "empty.tta"))

    def test_tags(self):
        self.failUnless(self.audio.tags is None)

    def test_length(self):
        self.failUnlessAlmostEqual(self.audio.info.length, 3.7, 1)

    def test_sample_rate(self):
        self.failUnlessEqual(44100, self.audio.info.sample_rate)

    def test_not_my_file(self):
        filename = os.path.join(DATA_DIR, "empty.ogg")
        self.failUnlessRaises(error, TrueAudio, filename)

    def test_module_delete(self):
        delete(os.path.join(DATA_DIR, "empty.tta"))

    def test_delete(self):
        self.audio.delete()
        self.failIf(self.audio.tags)

    def test_pprint(self):
        self.failUnless(self.audio.pprint())

    def test_save_reload(self):
        filename = get_temp_copy(self.audio.filename)
        try:
            audio = TrueAudio(filename)
            audio.add_tags()
            audio.tags.add(TIT1(encoding=0, text="A Title"))
            audio.save()
            audio = TrueAudio(filename)
            self.failUnlessEqual(audio["TIT1"], "A Title")
        finally:
            os.unlink(filename)

    def test_mime(self):
        self.failUnless("audio/x-tta" in self.audio.mime)
