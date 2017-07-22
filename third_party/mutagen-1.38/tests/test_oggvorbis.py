# -*- coding: utf-8 -*-

import os
import shutil

from mutagen._compat import cBytesIO
from mutagen.ogg import OggPage
from mutagen.oggvorbis import OggVorbis, OggVorbisInfo, delete, error

from tests import TestCase, DATA_DIR, get_temp_copy
from tests.test_ogg import TOggFileTypeMixin


class TOggVorbis(TestCase, TOggFileTypeMixin):
    Kind = OggVorbis

    def setUp(self):
        self.filename = get_temp_copy(os.path.join(DATA_DIR, "empty.ogg"))
        self.audio = self.Kind(self.filename)

    def tearDown(self):
        os.unlink(self.filename)

    def test_module_delete(self):
        delete(self.filename)
        self.scan_file()
        self.failIf(OggVorbis(self.filename).tags)

    def test_bitrate(self):
        self.failUnlessEqual(112000, self.audio.info.bitrate)

    def test_channels(self):
        self.failUnlessEqual(2, self.audio.info.channels)

    def test_sample_rate(self):
        self.failUnlessEqual(44100, self.audio.info.sample_rate)

    def test_invalid_not_first(self):
        with open(self.filename, "rb") as h:
            page = OggPage(h)
        page.first = False
        self.failUnlessRaises(error, OggVorbisInfo, cBytesIO(page.write()))

    def test_avg_bitrate(self):
        with open(self.filename, "rb") as h:
            page = OggPage(h)
        packet = page.packets[0]
        packet = (packet[:16] + b"\x00\x00\x01\x00" + b"\x00\x00\x00\x00" +
                  b"\x00\x00\x00\x00" + packet[28:])
        page.packets[0] = packet
        info = OggVorbisInfo(cBytesIO(page.write()))
        self.failUnlessEqual(info.bitrate, 32768)

    def test_overestimated_bitrate(self):
        with open(self.filename, "rb") as h:
            page = OggPage(h)
        packet = page.packets[0]
        packet = (packet[:16] + b"\x00\x00\x01\x00" + b"\x00\x00\x00\x01" +
                  b"\x00\x00\x00\x00" + packet[28:])
        page.packets[0] = packet
        info = OggVorbisInfo(cBytesIO(page.write()))
        self.failUnlessEqual(info.bitrate, 65536)

    def test_underestimated_bitrate(self):
        with open(self.filename, "rb") as h:
            page = OggPage(h)
        packet = page.packets[0]
        packet = (packet[:16] + b"\x00\x00\x01\x00" + b"\x01\x00\x00\x00" +
                  b"\x00\x00\x01\x00" + packet[28:])
        page.packets[0] = packet
        info = OggVorbisInfo(cBytesIO(page.write()))
        self.failUnlessEqual(info.bitrate, 65536)

    def test_negative_bitrate(self):
        with open(self.filename, "rb") as h:
            page = OggPage(h)
        packet = page.packets[0]
        packet = (packet[:16] + b"\xff\xff\xff\xff" + b"\xff\xff\xff\xff" +
                  b"\xff\xff\xff\xff" + packet[28:])
        page.packets[0] = packet
        info = OggVorbisInfo(cBytesIO(page.write()))
        self.failUnlessEqual(info.bitrate, 0)

    def test_vendor(self):
        self.failUnless(
            self.audio.tags.vendor.startswith("Xiph.Org libVorbis"))
        self.failUnlessRaises(KeyError, self.audio.tags.__getitem__, "vendor")

    def test_vorbiscomment(self):
        self.audio.save()
        self.scan_file()
        if ogg is None:
            return
        self.failUnless(ogg.vorbis.VorbisFile(self.filename))

    def test_vorbiscomment_big(self):
        self.test_really_big()
        self.audio.save()
        self.scan_file()
        if ogg is None:
            return
        vfc = ogg.vorbis.VorbisFile(self.filename).comment()
        self.failUnlessEqual(self.audio["foo"], vfc["foo"])

    def test_vorbiscomment_delete(self):
        self.audio.delete()
        self.scan_file()
        if ogg is None:
            return
        vfc = ogg.vorbis.VorbisFile(self.filename).comment()
        self.failUnlessEqual(vfc.keys(), ["VENDOR"])

    def test_vorbiscomment_delete_readd(self):
        self.audio.delete()
        self.audio.tags.clear()
        self.audio["foobar"] = "foobar" * 1000
        self.audio.save()
        self.scan_file()
        if ogg is None:
            return
        vfc = ogg.vorbis.VorbisFile(self.filename).comment()
        self.failUnlessEqual(self.audio["foobar"], vfc["foobar"])
        self.failUnless("FOOBAR" in vfc.keys())
        self.failUnless("VENDOR" in vfc.keys())

    def test_huge_tag(self):
        vorbis = self.Kind(
            os.path.join(DATA_DIR, "multipagecomment.ogg"))
        self.failUnless("big" in vorbis.tags)
        self.failUnless("bigger" in vorbis.tags)
        self.failUnlessEqual(vorbis.tags["big"], ["foobar" * 10000])
        self.failUnlessEqual(vorbis.tags["bigger"], ["quuxbaz" * 10000])
        self.scan_file()

    def test_not_my_ogg(self):
        fn = os.path.join(DATA_DIR, 'empty.oggflac')
        self.failUnlessRaises(error, type(self.audio), fn)
        self.failUnlessRaises(error, self.audio.save, fn)
        self.failUnlessRaises(error, self.audio.delete, fn)

    def test_save_split_setup_packet(self):
        fn = os.path.join(DATA_DIR, "multipage-setup.ogg")
        shutil.copy(fn, self.filename)
        audio = OggVorbis(self.filename)
        tags = audio.tags
        self.failUnless(tags)
        audio.save()
        self.audio = OggVorbis(self.filename)
        self.failUnlessEqual(self.audio.tags, tags)

    def test_save_split_setup_packet_reference(self):
        if ogg is None:
            return
        self.test_save_split_setup_packet()
        vfc = ogg.vorbis.VorbisFile(self.filename).comment()
        for key in self.audio:
            self.failUnlessEqual(vfc[key], self.audio[key])
        self.ogg_reference(self.filename)

    def test_save_grown_split_setup_packet_reference(self):
        if ogg is None:
            return
        fn = os.path.join(DATA_DIR, "multipage-setup.ogg")
        shutil.copy(fn, self.filename)
        audio = OggVorbis(self.filename)
        audio["foobar"] = ["quux" * 50000]
        tags = audio.tags
        self.failUnless(tags)
        audio.save()
        self.audio = OggVorbis(self.filename)
        self.failUnlessEqual(self.audio.tags, tags)
        vfc = ogg.vorbis.VorbisFile(self.filename).comment()
        for key in self.audio:
            self.failUnlessEqual(vfc[key], self.audio[key])
        self.ogg_reference(self.filename)

    def test_mime(self):
        self.failUnless("audio/vorbis" in self.audio.mime)

    def test_init_padding(self):
        self.assertEqual(self.audio.tags._padding, 0)

try:
    import ogg.vorbis
except ImportError:
    print("WARNING: Skipping Ogg Vorbis reference tests.")
    ogg = None
