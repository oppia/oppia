# -*- coding: utf-8 -*-

import os

from mutagen._compat import cBytesIO
from mutagen.oggflac import OggFLAC, OggFLACStreamInfo, delete, error
from mutagen.ogg import OggPage, error as OggError

from tests import TestCase, DATA_DIR, get_temp_copy
from tests.test_ogg import TOggFileTypeMixin
from tests.test_flac import have_flac, call_flac


class TOggFLAC(TestCase, TOggFileTypeMixin):
    Kind = OggFLAC
    PADDING_SUPPORT = False

    def setUp(self):
        self.filename = get_temp_copy(os.path.join(DATA_DIR, "empty.oggflac"))
        self.audio = OggFLAC(self.filename)

    def tearDown(self):
        os.unlink(self.filename)

    def test_vendor(self):
        self.failUnless(
            self.audio.tags.vendor.startswith("reference libFLAC"))
        self.failUnlessRaises(KeyError, self.audio.tags.__getitem__, "vendor")

    def test_streaminfo_bad_marker(self):
        with open(self.filename, "rb") as h:
            page = OggPage(h).write()
        page = page.replace(b"fLaC", b"!fLa", 1)
        self.failUnlessRaises(error, OggFLACStreamInfo, cBytesIO(page))

    def test_streaminfo_too_short(self):
        with open(self.filename, "rb") as h:
            page = OggPage(h).write()
        self.failUnlessRaises(OggError, OggFLACStreamInfo, cBytesIO(page[:10]))

    def test_streaminfo_bad_version(self):
        with open(self.filename, "rb") as h:
            page = OggPage(h).write()
        page = page.replace(b"\x01\x00", b"\x02\x00", 1)
        self.failUnlessRaises(error, OggFLACStreamInfo, cBytesIO(page))

    def test_flac_reference_simple_save(self):
        if not have_flac:
            return
        self.audio.save()
        self.scan_file()
        self.assertEqual(call_flac("--ogg", "-t", self.filename), 0)

    def test_flac_reference_really_big(self):
        if not have_flac:
            return
        self.test_really_big()
        self.audio.save()
        self.scan_file()
        self.assertEqual(call_flac("--ogg", "-t", self.filename), 0)

    def test_module_delete(self):
        delete(self.filename)
        self.scan_file()
        self.failIf(OggFLAC(self.filename).tags)

    def test_flac_reference_delete(self):
        if not have_flac:
            return
        self.audio.delete()
        self.scan_file()
        self.assertEqual(call_flac("--ogg", "-t", self.filename), 0)

    def test_flac_reference_medium_sized(self):
        if not have_flac:
            return
        self.audio["foobar"] = "foobar" * 1000
        self.audio.save()
        self.scan_file()
        self.assertEqual(call_flac("--ogg", "-t", self.filename), 0)

    def test_flac_reference_delete_readd(self):
        if not have_flac:
            return
        self.audio.delete()
        self.audio.tags.clear()
        self.audio["foobar"] = "foobar" * 1000
        self.audio.save()
        self.scan_file()
        self.assertEqual(call_flac("--ogg", "-t", self.filename), 0)

    def test_not_my_ogg(self):
        fn = os.path.join(DATA_DIR, 'empty.ogg')
        self.failUnlessRaises(error, type(self.audio), fn)
        self.failUnlessRaises(error, self.audio.save, fn)
        self.failUnlessRaises(error, self.audio.delete, fn)

    def test_mime(self):
        self.failUnless("audio/x-oggflac" in self.audio.mime)

    def test_info_pprint(self):
        self.assertTrue(self.audio.info.pprint().startswith(u"Ogg FLAC"))
